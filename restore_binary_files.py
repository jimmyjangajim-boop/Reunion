"""Restore large original files from hash-verified compressed parts."""
import gzip, hashlib, json, os
from pathlib import Path
ROOT=Path(__file__).resolve().parent

def digest(b):return hashlib.sha256(b).hexdigest()
def resolve(p):
    dest=(ROOT/p).resolve()
    if not dest.is_relative_to(ROOT):raise ValueError("Unsafe manifest path")
    return dest

def main():
    manifest=json.loads((ROOT/'BINARY_FILES.json').read_text())
    for item in manifest:
        destination=resolve(item['path'])
        if destination.exists():
            if digest(destination.read_bytes())==item['sha256']:
                print('Already restored:',item['path']);continue
            raise RuntimeError('Existing file differs; refusing to overwrite: '+item['path'])
        compressed=[]
        for part in item['parts']:
            data=resolve(part['path']).read_bytes()
            if digest(data)!=part['sha256']:raise RuntimeError('Part checksum mismatch: '+part['path'])
            compressed.append(data)
        raw=gzip.decompress(b''.join(compressed))
        if len(raw)!=item['bytes'] or digest(raw)!=item['sha256']:raise RuntimeError('Restored checksum mismatch: '+item['path'])
        destination.parent.mkdir(parents=True,exist_ok=True)
        temp=destination.with_name(destination.name+'.restore-tmp')
        temp.write_bytes(raw);os.replace(temp,destination)
        print('Restored:',item['path'])

if __name__=='__main__':main()
