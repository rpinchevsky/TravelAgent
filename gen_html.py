import markdown, re, os

with open('trip_2026-03-10_1146.md', encoding='utf-8') as f:
    md_text = f.read()

md = markdown.Markdown(extensions=['tables', 'toc', 'fenced_code', 'nl2br'])
body = md.convert(md_text)
body = re.sub(r'<a href="(http[^"]+)"', r'<a href="\1" target="_blank" rel="noopener noreferrer"', body)
body = re.sub(r'<img ([^>]+)>', r'<img \1 loading="lazy">', body)

html = """<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Budapest Family Trip 2026</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  /* ===== DESIGN TOKENS ===== */
  :root {
    --space-1: 4px;
    --space-2: 8px;
    --space-3: 16px;
    --space-4: 24px;
    --space-5: 32px;
    --space-6: 48px;
    --space-7: 64px;
    --radius-container: 12px;
    --radius-interactive: 6px;

    /* Light theme */
    --bg-primary: #ffffff;
    --bg-secondary: #f8f9fa;
    --bg-accent: #f0f4ff;
    --text-primary: #1a1a2e;
    --text-secondary: #4a5568;
    --text-muted: #718096;
    --border-color: #e2e8f0;
    --header-bg: #1a3a5c;
    --header-text: #fafafa;
    --link-color: #1a56db;
    --link-hover: #1e429f;
    --row-even: #f8f9fa;
    --row-hover: #eef4ff;
    --blockquote-bg: #f0f4ff;
    --blockquote-border: #1a56db;
    --shadow: 0 1px 6px rgba(0,0,0,0.08);
    --shadow-md: 0 4px 12px rgba(0,0,0,0.12);
  }

  @media (prefers-color-scheme: dark) {
    :root {
      --bg-primary: #0f172a;
      --bg-secondary: #1e293b;
      --bg-accent: #1e3a5f;
      --text-primary: #fafafa;
      --text-secondary: #cbd5e1;
      --text-muted: #94a3b8;
      --border-color: rgba(255,255,255,0.1);
      --header-bg: #0f2a47;
      --header-text: #fafafa;
      --link-color: #60a5fa;
      --link-hover: #93c5fd;
      --row-even: #1e293b;
      --row-hover: #1e3a5f;
      --blockquote-bg: #1e3a5f;
      --blockquote-border: #60a5fa;
      --shadow: 0 1px 6px rgba(0,0,0,0.4);
      --shadow-md: 0 4px 12px rgba(0,0,0,0.5);
    }
  }

  /* ===== RESET & BASE ===== */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: "Inter", system-ui, -apple-system, sans-serif;
    font-size: 15px;
    font-weight: 400;
    line-height: 1.5;
    color: var(--text-primary);
    background: var(--bg-primary);
    -webkit-font-smoothing: antialiased;
  }

  /* ===== HEADER ===== */
  header {
    background: linear-gradient(135deg, #c41e3a 0%, #1a3a5c 55%, #2d6a4f 100%);
    color: #fafafa;
    padding: var(--space-6) var(--space-4);
    text-align: center;
  }
  header h1 {
    font-size: clamp(1.6rem, 4vw, 2.4rem);
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: -0.02em;
    color: #fafafa;
  }
  header p {
    margin-top: var(--space-2);
    font-size: 1rem;
    opacity: 0.85;
    color: #fafafa;
  }

  /* ===== LAYOUT ===== */
  .container {
    max-width: 1100px;
    margin: 0 auto;
    padding: var(--space-4);
  }

  /* ===== TYPOGRAPHY ===== */
  h1, h2, h3, h4, h5, h6 {
    color: var(--text-primary);
    line-height: 1.2;
    font-weight: 600;
  }
  h1 { font-size: 2rem; margin: var(--space-6) 0 var(--space-3); }
  h2 { font-size: 1.6rem; margin: var(--space-5) 0 var(--space-3); border-bottom: 2px solid var(--border-color); padding-bottom: var(--space-2); }
  h3 { font-size: 1.25rem; margin: var(--space-4) 0 var(--space-2); }
  h4 { font-size: 1.05rem; margin: var(--space-3) 0 var(--space-2); }

  p { margin-bottom: var(--space-3); color: var(--text-secondary); }
  ul, ol { margin: var(--space-2) 0 var(--space-3) var(--space-4); color: var(--text-secondary); }
  li { margin-bottom: var(--space-1); }
  strong { color: var(--text-primary); font-weight: 600; }
  em { color: var(--text-muted); }
  hr { border: none; border-top: 1px solid var(--border-color); margin: var(--space-5) 0; }

  /* ===== LINKS ===== */
  a {
    color: var(--link-color);
    text-decoration: none;
    border-radius: var(--radius-interactive);
    transition: color 0.15s;
  }
  a:hover { color: var(--link-hover); text-decoration: underline; }
  a:focus {
    outline: 2px solid var(--link-color);
    outline-offset: 2px;
  }

  /* ===== TABLES ===== */
  .table-wrapper {
    width: 100%;
    overflow-x: auto;
    border-radius: var(--radius-container);
    box-shadow: var(--shadow-md);
    margin-bottom: var(--space-5);
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
    min-width: 600px;
  }
  thead {
    background: var(--header-bg);
    color: var(--header-text);
    position: sticky;
    top: 0;
    z-index: 10;
  }
  th {
    padding: 11px var(--space-3);
    font-weight: 600;
    font-size: 0.85rem;
    text-align: left;
    letter-spacing: 0.03em;
    white-space: nowrap;
  }
  td {
    padding: 9px var(--space-3);
    border-bottom: 1px solid var(--border-color);
    color: var(--text-secondary);
    vertical-align: top;
  }
  tbody tr:nth-child(even) { background: var(--row-even); }
  tbody tr:hover { background: var(--row-hover); transition: background 0.12s; }
  tbody tr:last-child td { border-bottom: none; }

  /* ===== BLOCKQUOTES ===== */
  blockquote {
    background: var(--blockquote-bg);
    border-left: 4px solid var(--blockquote-border);
    border-radius: 0 var(--radius-interactive) var(--radius-interactive) 0;
    padding: var(--space-3) var(--space-4);
    margin: var(--space-3) 0;
    color: var(--text-secondary);
  }
  blockquote p { color: var(--text-secondary); margin-bottom: 0; }

  /* ===== CODE ===== */
  code {
    font-family: "SF Mono", "Cascadia Code", Consolas, monospace;
    font-size: 0.85em;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: 1px 5px;
    color: var(--text-primary);
  }
  pre code {
    display: block;
    padding: var(--space-3);
    overflow-x: auto;
    border-radius: var(--radius-container);
  }

  /* ===== RESPONSIVE ===== */
  @media (max-width: 768px) {
    .container { padding: var(--space-3); }
    header { padding: var(--space-4) var(--space-3); }
    h2 { font-size: 1.3rem; }
    th, td { padding: var(--space-2) var(--space-2); font-size: 0.82rem; }
  }

  /* ===== PRINT ===== */
  @media print {
    header { background: #1a3a5c !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    thead { background: #1a3a5c !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    a::after { content: " (" attr(href) ")"; font-size: 0.75em; color: #666; }
    .table-wrapper { box-shadow: none; border: 1px solid #ccc; }
  }
</style>
</head>
<body>
<header>
  <h1>&#127463;&#127482; Budapest Family Trip 2026</h1>
  <p>20 — 31 августа 2026 &middot; Семейное путешествие &middot; Роберт, Анна, Тамир, Ариэль, Итай</p>
</header>
<div class="container">
""" + body + """
</div>
</body>
</html>"""

# Wrap all tables in scrollable div
html = re.sub(r'(<table>)', r'<div class="table-wrapper">\1', html)
html = re.sub(r'(</table>)', r'\1</div>', html)

with open('trip_2026-03-10_1146.html', 'w', encoding='utf-8') as f:
    f.write(html)

size = os.path.getsize('trip_2026-03-10_1146.html')
print(f'Done. File size: {size:,} bytes')
