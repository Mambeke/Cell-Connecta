"""Create a verifiable, source-only transfer archive. No network, deployment or DB operations."""
from pathlib import Path
import hashlib
import json
import re
import zipfile

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT.parent / 'Cell-Connecta-Export-20261105'
DEST.mkdir(exist_ok=True)
ARCHIVE = DEST / 'Cell-Connecta-Premium-Source.zip'
REQUIRED = [
    'server/render.js', 'server/data.js', 'server/core.js', 'server/api.js',
    'server/orders.js', 'server/recovery.js', 'public/_worker.js',
    'public/cc-assets/store.css', 'public/cc-assets/store.js', 'public/cc-assets/admin.js',
    *['public/cc-assets/hero-' + k + '-collection.webp' for k in ['iphone','samsung','laptop','accessories']],
    'AGENTS.md', 'HANDOVER.md', 'NEXT-AGENT-START-HERE.md', 'PROJECT-STATE.json',
    'package.json', 'package-lock.json',
]
FORBIDDEN = {'node_modules', 'build', 'dist', '.wrangler', '.git', '__pycache__', '.cache', 'upgrade-backup'}
files = []
for directory in ['server','public','tests','scripts','checks','migrations']:
    folder = ROOT / directory
    if not folder.is_dir():
        raise RuntimeError('Required directory missing: ' + directory)
    for p in folder.rglob('*'):
        if not p.is_file():
            continue
        if p.is_symlink():
            raise RuntimeError('Refusing symlink: ' + str(p))
        rel = p.relative_to(ROOT)
        if any(part in FORBIDDEN for part in rel.parts):
            continue
        if p.name.startswith('.env') or p.suffix in {'.sqlite','.sqlite3','.db','.pyc'}:
            continue
        if directory == 'checks' and ('failure' in p.name.lower() or any(t in p.name.lower() for t in ['project-before','project-after','customer-export','auth-export','database-export'])):
            continue
        files.append(p)
files += list(ROOT.glob('*.md'))
files += [ROOT / f for f in ['.gitignore','package.json','package-lock.json','PROJECT-STATE.json','wrangler.toml','wrangler.local.toml']]
files = sorted(set(files))
for name in REQUIRED:
    if ROOT / name not in files:
        raise RuntimeError('Required file omitted: ' + name)
secret = re.compile(rb'(?:github_pat_|ghp_|cfut_)[A-Za-z0-9_]{20,}|Bearer [A-Za-z0-9_\-]{30,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----')
manifest = {}
for p in files:
    data = p.read_bytes()
    if secret.search(data):
        raise RuntimeError('Possible credential in ' + str(p.relative_to(ROOT)) + '; export blocked')
    manifest[str(p.relative_to(ROOT))] = {'bytes':len(data), 'sha256':hashlib.sha256(data).hexdigest()}
assets = json.loads((ROOT/'checks/source-export-asset-verification.json').read_text())
for name, facts in assets['assets'].items():
    actual = manifest['public/' + name]
    if actual['bytes'] != facts['bytes'] or actual['sha256'] != facts['sha256']:
        raise RuntimeError('Canonical public asset mismatch: ' + name)
state = json.loads((ROOT/'PROJECT-STATE.json').read_text())
index = {
    'export_date':'2026-11-05',
    'production_deployment':state['production_deployment'],
    'archive_root':'Cell-Connecta-Premium/',
    'source_provenance':'Existing editable server/tests/docs in this workspace. Current canonical public CSS/browser modules/artwork recovered read-only and included byte-for-byte.',
    'credential_scan':'passed',
    'production_writes':0,
    'files':manifest,
}
with zipfile.ZipFile(ARCHIVE,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
    for p in files:
        z.write(p,'Cell-Connecta-Premium/'+str(p.relative_to(ROOT)))
    z.writestr('Cell-Connecta-Premium/SOURCE-EXPORT-MANIFEST.json',json.dumps(index,indent=2)+'\n')
with zipfile.ZipFile(ARCHIVE) as z:
    bad = z.testzip()
    if bad:
        raise RuntimeError('CRC failure: ' + bad)
digest = hashlib.sha256(ARCHIVE.read_bytes()).hexdigest()
(DEST/'Cell-Connecta-Premium-Source.sha256').write_text(digest+'  '+ARCHIVE.name+'\n')
summary = {
    'zip_path':str(ARCHIVE), 'zip_bytes':ARCHIVE.stat().st_size, 'zip_sha256':digest,
    'production_deployment':state['production_deployment'], 'entry_count':len(files)+1,
    'archive_root':'Cell-Connecta-Premium/', 'crc':'passed', 'credential_scan':'passed',
    'canonical_public_assets_byte_match':True,
    'required_entries':{f:manifest[f] for f in REQUIRED},
    'included_directories':['server/','public/','tests/','scripts/','checks/','migrations/'],
    'excluded':['tokens and secrets','private checkpoints/config snapshots','node_modules','build caches','local D1/database files','customer/auth exports'],
    'production_writes':0,
}
(DEST/'Cell-Connecta-Premium-Source-Verification.json').write_text(json.dumps(summary,indent=2)+'\n')
print(json.dumps({k:summary[k] for k in ['zip_path','zip_bytes','zip_sha256','entry_count','crc','canonical_public_assets_byte_match']},indent=2))
