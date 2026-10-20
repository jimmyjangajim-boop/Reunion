"""Package a consistent SQLite snapshot and original evidence, without private configuration."""
import hashlib,json,sqlite3,sys,zipfile
from pathlib import Path

database,evidence,output=map(lambda p:Path(p).resolve(),sys.argv[1:])
if output.is_relative_to(evidence):raise ValueError('Backup destination must be outside evidence/')
c=sqlite3.connect('file:'+str(database)+'?mode=ro',uri=True)
assert c.execute('PRAGMA integrity_check').fetchone()[0]=='ok'
assert not c.execute('PRAGMA foreign_key_check').fetchall()
migrations=[r[0] for r in c.execute('SELECT version FROM migrations ORDER BY version')]
c.close()
files=[(database,'data/reunion.sqlite')]+[(p,'evidence/'+p.relative_to(evidence).as_posix()) for p in sorted(evidence.rglob('*')) if p.is_file() and not p.is_symlink()]
manifest={'format':'rnas-portable-v1','migrations':migrations,'files':{name:{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p,name in files}}
with zipfile.ZipFile(output,'w',zipfile.ZIP_DEFLATED) as z:
    for p,name in files:z.write(p,name)
    z.writestr('MANIFEST.json',json.dumps(manifest,indent=2))
    z.writestr('RESTORE.txt','Stop RNAS. Extract this archive to a new folder. Verify MANIFEST.json checksums. Run npm run restore -- /absolute/extracted/data/reunion.sqlite --confirm from app/. Copy the extracted evidence directory to the matching application evidence directory, preserving any newer originals. Run npm run setup before starting. Never commit this runtime backup to Git.\n')
with zipfile.ZipFile(output) as z:
    assert z.testzip() is None
    for name,item in manifest['files'].items():assert hashlib.sha256(z.read(name)).hexdigest()==item['sha256']
print('Verified portable files:',len(files))
