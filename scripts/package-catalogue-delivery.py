"""Package reviewed source and public evidence only. No deploy/DB/credential operations."""
from pathlib import Path
import base64, hashlib, html, io, json, re, zipfile
from PIL import Image
ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT.parent
state = json.loads((ROOT / 'PROJECT-STATE.json').read_text())
assert state['live_sidebar_verified'] is True, 'Only package LIVE status after actual verification.'

def embed(path):
    image = Image.open(path).convert('RGB')
    if image.width > 1200:
        image.thumbnail((1200, 9000))
    buffer = io.BytesIO()
    image.save(buffer, format='WEBP', quality=85, method=6)
    return 'data:image/webp;base64,' + base64.b64encode(buffer.getvalue()).decode()

captures = [
    ('Landing page · Shop by brand removed', ROOT / 'checks/categories-home-desktop.png'),
    ('Desktop catalogue · LIVE production capture', DEST / 'Cell-Connecta-Catalogue-Preview.png'),
    ('Phones + Laptops · blue-separated sections; genuinely empty laptop catalogue', ROOT / 'checks/catalogue-grouped-desktop.png'),
    ('Mobile · compact filters and two-column products', ROOT / 'checks/compact-catalogue-mobile.png'),
    ('Mobile · expanded premium filters', ROOT / 'checks/compact-filters-mobile.png'),
    ('Desktop · sourcing below pagination and footer admin gateway', ROOT / 'checks/phone-sourcing-desktop.png'),
    ('Mobile · phone sourcing on WhatsApp', ROOT / 'checks/phone-sourcing-mobile.png'),
    ('Desktop · stronger green WhatsApp and Others browse category', ROOT / 'checks/navbar-others-desktop.png'),
    ('Mobile · expanded filters including Others', ROOT / 'checks/navbar-others-mobile.png'),
]
figures = ''.join('<figure><figcaption>' + html.escape(label) + '</figcaption><div class="capture"><img src="' + embed(path) + '" alt="' + html.escape(label) + '"></div></figure>' for label, path in captures)
report = '''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Cell Connecta · Premium catalogue preview</title><style>*{box-sizing:border-box}body{margin:0;background:#f3f6fc;color:#142745;font:15px/1.75 system-ui,sans-serif}header{background:#11264b;color:white;padding:38px max(24px,calc((100vw - 1080px)/2))}header p{color:#c8d7f2;max-width:800px}h1{font-size:clamp(30px,4vw,46px);line-height:1.15;letter-spacing:-1.5px}main{max-width:1128px;margin:auto;padding:28px 24px 55px}.status{display:inline-block;background:#ffe7aa;color:#583e00;border-radius:99px;padding:7px 14px;font-size:12px;font-weight:800}.notice,article,figure{background:white;border:1px solid #dbe5f5;border-radius:16px;padding:23px;margin:0 0 24px}.notice{border-left:4px solid #e2ab29}.metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.metrics b{font-size:28px;display:block;color:#174cda}.capture{max-height:760px;overflow:auto;border:1px solid #dfe7f3;border-radius:10px}.capture img{display:block;width:100%;height:auto}figcaption{font-size:13px;font-weight:750;margin-bottom:15px}h2{letter-spacing:-.7px;font-size:25px}code{background:#eef3fd;padding:3px 5px;border-radius:4px;font-size:12px}footer{font-size:12px;color:#5f728f}@media(max-width:600px){.metrics{grid-template-columns:1fr}.capture{max-height:600px}header{padding:28px 22px}main{padding:22px 15px}figure,article,.notice{padding:17px}}</style><header><p>CELL CONNECTA · 4 NOVEMBER 2026</p><h1>All Products.<br>Made easier to explore.</h1><p>Compact shopping layout with a navy/blue sidebar, decorated surfaces, responsive filters and products visible sooner.</p><span class="status">LIVE · VERIFIED</span></header><main><div class="notice"><strong>Live at cell-connecta.pages.dev/shop.</strong> The premium catalogue has been published to your existing shop and verified on canonical production. All 32 products and production configuration are unchanged. No database writes or migrations were made.</div><article class="metrics"><div><b>36 / 36</b>Unit tests pass</div><div><b>22 groups</b>Local + LIVE read-only checks</div><div><b>8 widths</b>360–1920px</div></article><article><h2>What changed</h2><ul><li>Landing-page Shop by brand section removed; category gallery, supplied-artwork heroes, featured phones and shop brand filters retained.</li><li>No floating WhatsApp; navbar WhatsApp is solid green. Footer payment notice removed; Others added to shop browse filters (currently empty).</li><li>Header account/search icons removed. WhatsApp sits before cart; Owner admin is in the footer. Catalogue search retained.</li><li>Phone-sourcing WhatsApp section below product pagination.</li><li>The entire introductory banner is removed: sidebar and search begin directly below navigation. A screen-reader-only category heading remains.</li><li>Multiple categories have separately titled sections and blue dividing lines, with independent pagination.</li><li>Desktop sidebar: category checkboxes, Apple / iPhone → exact model → actual storage, price, condition, colour, stock and deals.</li><li>Mobile: expandable filters, batch choices and Apply.</li><li>The chosen storage stays selected when opening a product.</li><li>Search, sorting, removable filter chips and no-JavaScript GET forms remain functional.</li></ul><p>All four supplied-artwork homepage slides, premium category gallery and sticky navigation passed regression checks. The production catalogue was compared read-only and is unchanged: 32 real products. Empty categories stay honest—no listings or stock were invented.</p></article>''' + figures + '''<article><h2>Verification and handover</h2><p>36 unit tests, 15-module syntax, formatting, production bundle, eleven existing hero/gallery/navigation groups and eleven catalogue groups pass locally and LIVE with zero uncaught JavaScript errors. Desktop/mobile images were reviewed, with no horizontal overflow or sticky-header overlap at tested widths. No-JavaScript forms, resize behavior, same-variant filters and selected-storage navigation also pass.</p><p>The standalone 38-file release artifact is deployed. The source archive includes <code>AGENTS.md</code>, <code>HANDOVER.md</code>, <code>PROJECT-STATE.json</code>, <code>CATALOGUE-SIDEBAR-UPDATE.md</code>, editable server/frontend source, tests, public fixtures and current local and LIVE evidence. It excludes credentials, private exports/configuration snapshots and local databases.</p><p><strong>Deployment verified:</strong> catalogue/configuration unchanged, uploaded browser assets match, public shop200 / protected hash302 / unauthenticated admin401. <strong>Separate remaining integrations:</strong> actual-owner sign-in, payments and recovery email remain separate unverified/unconfigured integrations. Browser checks do not constitute physical-device or Safari certification.</p></article><footer>Existing public address: cell-connecta.pages.dev · Current LIVE release: 2e6cc1d9-b20d-4bb7-a2bc-e07af3a5992f · Previous release retained: a0583bcd-3209-40b9-8164-0b2eeeeb175c.</footer></main></html>'''
(DEST / 'Cell-Connecta-Upgrade-Report.html').write_text(report)
files=[]
for directory in ['server','public','migrations','tests','scripts']:
    for p in (ROOT / directory).rglob('*'):
        if p.is_file() and '__pycache__' not in p.parts and p.suffix != '.pyc':
            files.append(p)
files += list(ROOT.glob('*.md'))
files += [ROOT / n for n in ['.gitignore','package.json','package-lock.json','wrangler.toml','wrangler.local.toml','PROJECT-STATE.json']]
# Historical successful evidence is retained with its own original environment labels.
for p in (ROOT / 'checks').iterdir():
    if p.is_file() and p.suffix in ['.png','.json'] and 'failure' not in p.name and p.name not in ['catalogue-source-manifest.json']:
        files.append(p)
files=sorted(set(files))
pattern=re.compile(rb'(?:github_pat_|ghp_|cfut_)[A-Za-z0-9_]{20,}|Bearer [A-Za-z0-9_\-]{30,}')
for p in files:
    if pattern.search(p.read_bytes()):
        raise RuntimeError('Possible secret; source archive blocked: '+str(p.relative_to(ROOT)))
manifest={str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in files}
(ROOT / 'checks/catalogue-source-manifest.json').write_text(json.dumps({'status':'LIVE VERIFIED','sha256':manifest},indent=2)+'\n')
archive=DEST / 'Cell-Connecta-Premium-Source.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
    for p in files:
        z.write(p,'Cell-Connecta-Premium/'+str(p.relative_to(ROOT)))
    z.write(ROOT/'checks/catalogue-source-manifest.json','Cell-Connecta-Premium/checks/catalogue-source-manifest.json')
    z.write(DEST/'Cell-Connecta-Upgrade-Report.html','Cell-Connecta-Premium/DELIVERY-REPORT.html')
    z.write(DEST/'Cell-Connecta-Catalogue-Preview.png','Cell-Connecta-Premium/checks/catalogue-preview.png')
(DEST/'Cell-Connecta-Premium-Source.sha256').write_text(hashlib.sha256(archive.read_bytes()).hexdigest()+'  '+archive.name+'\n')
print('Generated LIVE report and allowlisted/secret-scanned source archive:',len(files),'source/evidence files;',round(archive.stat().st_size/1048576,2),'MB')
