"""Seed only Miniflare's local SQLite database. Never connects to production.
Requires CC_QA_PASSWORD and --reset. Optional --images DIR uses real public images.
"""
import argparse, base64, hashlib, json, os, pathlib, sqlite3, subprocess, time
parser=argparse.ArgumentParser();parser.add_argument('--reset',action='store_true');parser.add_argument('--images');args=parser.parse_args()
if not args.reset:raise SystemExit('Pass --reset to explicitly replace ONLY the local QA fixture.')
password=os.environ.get('CC_QA_PASSWORD','')
if len(password)<16:raise SystemExit('Set a temporary CC_QA_PASSWORD of at least 16 characters. It is for LOCAL TESTS ONLY.')
root=pathlib.Path(__file__).resolve().parent.parent
subprocess.run(['npx','wrangler','d1','execute','DB','--local','--config','wrangler.local.toml','--command','SELECT 1'],cwd=root,check=True)
files=[p for p in (root/'.wrangler/state/v3/d1/miniflare-D1DatabaseObject').glob('*.sqlite') if p.name!='metadata.sqlite']
if len(files)!=1:raise SystemExit('Expected exactly one isolated local QA SQLite file; refusing to guess which to reset.')
p=files[0]
for suffix in ['','-wal','-shm']:
 f=pathlib.Path(str(p)+suffix)
 if f.exists():f.unlink()
c=sqlite3.connect(p);c.executescript((root/'tests/fixtures/legacy-schema.sql').read_text())
fixture=json.loads((root/'tests/fixtures/catalogue.json').read_text())
for table in ['phones','variants']:
 for row in fixture[table]:c.execute('INSERT INTO '+table+'('+','.join(row)+') VALUES('+','.join('?' for _ in row)+')',list(row.values()))
salt=os.urandom(16);derived=hashlib.pbkdf2_hmac('sha256',password.encode(),salt,100000,32);encoded='pbkdf2$100000$'+base64.b64encode(salt).decode()+'$'+base64.b64encode(derived).decode()
for user,email,role in [('qa-owner','qa-owner@cellconnecta.invalid','owner'),('qa-customer','qa-customer@cellconnecta.invalid','customer')]:c.execute('INSERT INTO users(id,email,password_hash,created_at,role,email_verified) VALUES(?,?,?,?,?,1)',[user,email,encoded,int(time.time()*1000),role])
keys={key for row in fixture['phones'] for key in json.loads(row['photos'])}
for key in keys:
 f=pathlib.Path(args.images)/key if args.images else root/'tests/fixtures/upload.jpg'
 if not f.is_file():raise SystemExit('Missing fixture image: '+str(f))
 # Without --images the same labelled test-only image is used for each key.
 c.execute('INSERT INTO photo_blobs(key,content_type,bytes,created_at) VALUES(?,?,?,?)',[key,'image/jpeg',f.read_bytes(),int(time.time()*1000)])
c.executescript((root/'migrations/0001_premium_store.sql').read_text());c.commit();c.close();print('Isolated local fixture seeded. No remote data or actual owner credentials were used.')
