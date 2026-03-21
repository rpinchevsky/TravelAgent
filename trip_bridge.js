const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 3456;
const PROJECT_DIR = __dirname;
const generations = new Map();

// Detect pipeline stage from claude output text.
// Returns the HIGHEST matching stage (not first) so text like
// "Phase A complete. Now launching Phase B" correctly returns stage 1.
function detectStage(text) {
  const t = text.toLowerCase();
  let stage = null;
  // Stage 0: Overview & Manifest — reading trip details, research, overview, manifest
  if (/phase\s*a|overview|manifest|trip.details|trip_planning_rules|content_format_rules|reading.*trip|reading.*rule|research.*destination|calculate.*age/i.test(t)) stage = 0;
  // Stage 1: Day Generation — parallel day writing, batch, day files
  if (/phase\s*b|day.generation|parallel.*day|day_\d|batch.*day|spawn.*day|writing.*day|generate.*day/i.test(t)) stage = 1;
  // Stage 2: Budget
  if (/budget/i.test(t)) stage = 2;
  // Stage 3: Assembly — concat, trip_full.md, assemble
  if (/assembl|trip_full|concat|full.*trip/i.test(t)) stage = 3;
  // Stage 4: HTML Render — render, html, fragment
  if (/\/render|render.*html|html.*render|fragment|\.html|base_layout|rendering/i.test(t)) stage = 4;
  // Stage 5: Regression — test, playwright, regression
  if (/regression|playwright|test.*passed|test.*failed|\.spec\.ts|\/regression/i.test(t)) stage = 5;
  return stage;
}

function broadcast(gen, event) {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  gen.clients = gen.clients.filter(res => {
    try { res.write(data); return true; } catch (e) { return false; }
  });
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // Health check
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, projectDir: PROJECT_DIR }));
    return;
  }

  // SSE progress stream
  if (req.method === 'GET' && req.url.startsWith('/progress/')) {
    const id = req.url.split('/')[2];
    const gen = generations.get(id);
    if (!gen) { res.writeHead(404); res.end(); return; }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    // Send current state snapshot
    res.write(`data: ${JSON.stringify({
      type: 'init',
      currentStep: gen.currentStep,
      completedSteps: gen.completedSteps,
      status: gen.status,
      logs: gen.logs.slice(-30)
    })}\n\n`);

    gen.clients.push(res);
    req.on('close', () => {
      gen.clients = gen.clients.filter(c => c !== res);
    });
    return;
  }

  // Generate trip
  if (req.method === 'POST' && req.url === '/generate') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { filename, content } = JSON.parse(body);
        const filePath = path.join(PROJECT_DIR, filename);
        fs.writeFileSync(filePath, content, 'utf8');

        // Kill any previous running generation
        for (const [prevId, prevGen] of generations) {
          if (prevGen.status === 'running' && prevGen.child) {
            try { prevGen.child.kill(); } catch (e) {}
            prevGen.status = 'cancelled';
            broadcast(prevGen, { type: 'done', status: 'cancelled', code: -1 });
            console.log(`[${prevId}] Cancelled (new generation started)`);
          }
        }

        const id = Date.now().toString();
        const gen = {
          id, filename,
          currentStep: -1,
          completedSteps: [],
          status: 'running',
          logs: [],
          clients: [],
          child: null
        };
        generations.set(id, gen);

        console.log(`[${id}] Saved: ${filename}`);
        console.log(`[${id}] Starting claude...`);

        const prompt = `generate trip from ${filename}. Do not ask clarifying questions — if any detail is ambiguous, make a reasonable assumption and proceed.`;

        // Build command as a single string to avoid shell: true + array args
        // deprecation (DEP0190) and broken argument quoting on Windows.
        // JSON.stringify wraps the prompt in escaped double-quotes so
        // spaces, em-dashes, and other special chars survive cmd.exe parsing.
        const claudeCmd = `claude -p ${JSON.stringify(prompt)} --output-format stream-json --verbose`;

        // stdin must be 'ignore' — when it defaults to 'pipe', the claude
        // CLI (running inside cmd.exe on Windows) detects a piped stdin and
        // buffers/delays its stdout indefinitely, causing the data handler
        // to never fire.
        const child = spawn(claudeCmd, {
          cwd: PROJECT_DIR,
          shell: true,
          stdio: ['ignore', 'pipe', 'pipe'],
          windowsHide: true
        });
        gen.child = child;

        let buffer = '';

        child.stdout.on('data', (data) => {
          buffer += data.toString();
          const lines = buffer.split('\n');
          buffer = lines.pop(); // keep incomplete last line in buffer

          for (const line of lines) {
            if (!line.trim()) continue;

            let logText = '';
            let eventType = '';
            try {
              const evt = JSON.parse(line);
              eventType = evt.type || '';
              if (evt.type === 'assistant' && evt.message?.content) {
                logText = evt.message.content
                  .filter(b => b.type === 'text')
                  .map(b => b.text).join(' ');
              } else if (evt.type === 'tool_use') {
                const name = evt.tool?.name || evt.name || '';
                logText = `[Tool] ${name}`;
              } else if (evt.type === 'tool_result') {
                logText = '[Tool result received]';
              } else if (evt.type === 'result') {
                if (evt.subtype === 'success') {
                  gen.status = 'completed';
                  logText = `Completed in ${Math.round((evt.duration_ms || 0) / 1000)}s`;
                } else {
                  logText = evt.result || '';
                }
              } else if (evt.type === 'system' && evt.subtype === 'init') {
                logText = 'Claude session initialized';
              }
            } catch (e) {
              logText = line;
            }

            if (!logText.trim()) continue;

            // Detect pipeline stage
            const stage = detectStage(logText);
            if (stage !== null && stage > gen.currentStep) {
              if (gen.currentStep >= 0 && !gen.completedSteps.includes(gen.currentStep)) {
                gen.completedSteps.push(gen.currentStep);
              }
              gen.currentStep = stage;
              broadcast(gen, {
                type: 'stage',
                step: stage,
                completedSteps: [...gen.completedSteps]
              });
              console.log(`[${id}] → Stage ${stage + 1}/6: ${['Overview','Days','Budget','Assembly','Render','Testing'][stage]}`);
            }

            // Stream log text (truncate long lines)
            const entry = logText.length > 300 ? logText.substring(0, 300) + '…' : logText;
            gen.logs.push(entry);
            if (gen.logs.length > 200) gen.logs.shift();
            broadcast(gen, { type: 'log', text: entry });
          }
        });

        child.stderr.on('data', (data) => {
          const text = data.toString().trim();
          if (text) {
            gen.logs.push(text);
            broadcast(gen, { type: 'log', text });
          }
        });

        child.on('close', (code) => {
          if (gen.currentStep >= 0 && !gen.completedSteps.includes(gen.currentStep)) {
            gen.completedSteps.push(gen.currentStep);
          }
          gen.status = code === 0 ? 'completed' : 'error';
          broadcast(gen, { type: 'done', status: gen.status, code });
          console.log(`[${id}] Finished (exit ${code})`);
        });

        child.on('error', (err) => {
          gen.status = 'error';
          broadcast(gen, { type: 'error', message: err.message });
          console.error(`[${id}] Error: ${err.message}`);
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, id, filename, filePath }));
      } catch (err) {
        console.error('Error:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // Cancel a running generation
  if (req.method === 'POST' && req.url.startsWith('/cancel/')) {
    const id = req.url.split('/')[2];
    const gen = generations.get(id);
    if (!gen) { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: false, error: 'Not found' })); return; }
    if (gen.status === 'running' && gen.child) {
      try { gen.child.kill(); } catch (e) {}
      gen.status = 'cancelled';
      broadcast(gen, { type: 'done', status: 'cancelled', code: -1 });
      console.log(`[${id}] Cancelled by user`);
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  // Latest trip — find the most recent generated trip HTML files
  if (req.method === 'GET' && req.url === '/latest-trip') {
    const tripsDir = path.join(PROJECT_DIR, 'generated_trips');
    try {
      const folders = fs.readdirSync(tripsDir)
        .filter(f => f.startsWith('trip_') && fs.statSync(path.join(tripsDir, f)).isDirectory())
        .sort().reverse();
      if (folders.length === 0) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'No trips found' }));
        return;
      }
      const latest = folders[0];
      const latestPath = path.join(tripsDir, latest);
      const htmlFiles = fs.readdirSync(latestPath).filter(f => f.endsWith('.html'));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, folder: latest, files: htmlFiles }));
    } catch (e) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: e.message }));
    }
    return;
  }

  // Serve file from generated_trips (read-only, restricted to generated_trips/)
  if (req.method === 'GET' && req.url.startsWith('/file/')) {
    const relPath = decodeURIComponent(req.url.slice(6));
    // Security: only serve from generated_trips/
    if (relPath.includes('..') || !relPath.startsWith('generated_trips/')) {
      res.writeHead(403); res.end('Forbidden'); return;
    }
    const absPath = path.join(PROJECT_DIR, relPath);
    try {
      const content = fs.readFileSync(absPath);
      const ext = path.extname(absPath).toLowerCase();
      const mimeTypes = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      res.end(content);
    } catch (e) {
      res.writeHead(404); res.end('File not found');
    }
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log('');
  console.log('  Trip Bridge Server (with live progress)');
  console.log('  ────────────────────────────────────────');
  console.log(`  Listening: http://localhost:${PORT}`);
  console.log(`  Project:   ${PROJECT_DIR}`);
  console.log('');
  console.log('  Endpoints:');
  console.log('    GET  /health        — check server status');
  console.log('    POST /generate      — save file + start generation');
  console.log('    GET  /progress/:id  — SSE stream of generation progress');
  console.log('    GET  /latest-trip   — find latest generated trip HTML');
  console.log('    GET  /file/:path    — serve files from generated_trips/');
  console.log('');
});
