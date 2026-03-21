# Design Notes — Trip Bridge Server

**Date:** 2026-03-21
**Change:** One-click trip generation from intake wizard

## Problem

`trip_intake.html` is a standalone browser HTML file. The trip generation pipeline runs in Claude Code (CLI). There is no native communication channel between them. Users had to download a file, then copy-paste a command into Claude Code.

## Solution

A lightweight Node.js HTTP bridge server (`trip_bridge.js`) that accepts requests from the intake page:

1. **Receives** trip details via `POST /generate` (filename + markdown content)
2. **Saves** the `.md` file directly to the project directory
3. **Launches** `claude -p "generate trip from {filename}"` in a new terminal window

## Architecture

```
Browser (trip_intake.html)
    │
    ├── fetch('http://localhost:3456/generate')
    │       ↓
    │   trip_bridge.js (Node.js, port 3456)
    │       ├── fs.writeFileSync(filename)
    │       └── exec('start cmd /k claude -p "..."')
    │               ↓
    │           New terminal window with Claude Code
    │
    └── [fallback if bridge offline]
        └── Browser download + copy command
```

## Key Decisions

- **Zero dependencies** — uses only Node.js built-in modules (`http`, `fs`, `path`, `child_process`)
- **Graceful degradation** — if bridge is not running, falls back to existing download + copy command flow
- **Batch file approach** — writes a `.trip_generate.bat` to avoid nested quote escaping issues when spawning `claude` in a new terminal
- **CORS enabled** — `Access-Control-Allow-Origin: *` for `file://` and `http://` origins
- **Health endpoint** — `GET /health` lets the page check if bridge is available

## Files

| File | Change |
|------|--------|
| `trip_bridge.js` | **New** — bridge server (~70 lines) |
| `trip_intake.html` | **Modified** — download handler tries bridge first, new i18n keys for bridge mode |
| `trip_intake_rules.md` | **Modified** — documents bridge server and integration |
