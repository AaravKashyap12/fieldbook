"""Regenerate assets/social-preview.png (1200x630) from the live styles.

Needs the local server (npm start) and Microsoft Edge or Chrome. Run from site/:
    python scripts/social-preview.py
Then npm run build. The front notebook page always shows a Fieldbook original,
so the card never implies endorsement by a listed maintainer.
"""
import json, os, re, shutil, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, 'dist')
BROWSERS = [r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe', r'C:\Program Files\Google\Chrome\Application\chrome.exe', shutil.which('chromium') or '', shutil.which('google-chrome') or '']
browser = next((b for b in BROWSERS if b and os.path.exists(b)), None)
if not browser: sys.exit('No Edge or Chrome found.')

count = len(json.load(open(os.path.join(ROOT, 'content/skills.json'), encoding='utf-8'))) + len(json.load(open(os.path.join(ROOT, 'content/directory.json'), encoding='utf-8')))
home = open(os.path.join(DIST, 'index.html'), encoding='utf-8').read()
deck = re.search(r'<div class="deck".*?<span class="deck-hint">.*?</span></div>', home, re.S).group(0)
deck = re.sub(r' aria-hidden="true" data-rise style="--i:\d"', '', deck)
deck = re.sub(r'<span class="deck-(caption|hint)">.*?</span>', '', deck)
detail = open(os.path.join(DIST, 'skills/aaravkashyap12/secure-launch/index.html'), encoding='utf-8').read()
shield = re.search(r'<span class="detail-glyph">(<svg.*?</svg>)', detail, re.S).group(1)
front = re.search(r'<div class="sheet" data-pos="0".*?</span></div>', deck, re.S).group(0)
new_front = re.sub(r'<span class="sheet-cat">.*?</span><strong>.*?</strong><span class="sheet-by">.*?</span>', f'<span class="sheet-cat">Security{shield}</span><strong>Secure Launch</strong><span class="sheet-by">Fieldbook original</span>', front, flags=re.S)
new_front = re.sub(r'<code>.*?</code>', '<code>reviewed · MIT</code>', new_front)
deck = deck.replace(front, new_front)
mark = re.search(r'<svg class="brand-mark".*?</svg>', home, re.S).group(0)
page = f'''<!doctype html><html lang="en" data-theme="light"><head><meta charset="utf-8"><link rel="stylesheet" href="/styles.css"><style>
html,body{{margin:0;width:1200px;height:630px;overflow:hidden;background:var(--bg)}}
.og{{position:relative;box-sizing:border-box;width:1200px;height:630px;padding:64px 72px;display:grid;grid-template-columns:1fr 380px;align-items:center}}
.og .brand{{font-size:30px;gap:14px}} .og .brand-mark{{width:30px;height:30px}} .og .brand-name{{font-size:36px}}
.og h1{{margin-top:56px;font-family:var(--serif);font-weight:400;font-size:104px;line-height:.94;letter-spacing:-.02em}} .og h1 em{{font-style:italic;color:var(--ink-2)}}
.og p{{margin-top:34px;font-size:24px;color:var(--ink-2)}} .og p b{{color:var(--ink);font-weight:600}}
.og .deck{{transform:scale(1.08);transform-origin:center;justify-self:end}}
.og .rule{{position:absolute;left:72px;right:72px;bottom:44px;display:flex;justify-content:space-between;padding-top:14px;border-top:1px solid var(--line);font-size:18px;color:var(--ink-3)}}
</style></head><body><div class="og"><div><span class="brand">{mark}<span class="brand-name">Fieldbook</span></span><h1>Engineering skills,<br><em>reviewed.</em></h1><p><b>{count}</b> skills, each licence-checked, scanned and labelled.</p></div>{deck}<div class="rule"><span>fieldbook.tech</span><span>Ranked by real installs, refreshed daily</span></div></div></body></html>'''
tmp = os.path.join(DIST, '_og.html')
open(tmp, 'w', encoding='utf-8').write(page)
try:
    out = os.path.join(ROOT, 'assets', 'social-preview.png')
    subprocess.run([browser, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-prefers-reduced-motion', '--window-size=1200,630', '--virtual-time-budget=3000', f'--screenshot={out}', 'http://127.0.0.1:4173/_og.html'], check=True, capture_output=True)
    print(f'Wrote {out} ({count} skills).')
finally:
    os.remove(tmp)
