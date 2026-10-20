"""Bounded, traversal-safe extraction for untrusted import archives."""
import sys, zipfile, pathlib, stat
archive,destination=sys.argv[1:3]
root=pathlib.Path(destination).resolve()
with zipfile.ZipFile(archive) as z:
 files=[i for i in z.infolist() if not i.is_dir()]
 if len(files)>200 or sum(i.file_size for i in files)>30_000_000:raise ValueError('ZIP exceeds 200 files or 30 MB expanded size')
 seen=set()
 for i in files:
  p=pathlib.PurePosixPath(i.filename)
  if p.is_absolute() or '..' in p.parts or '\\' in i.filename or stat.S_ISLNK(i.external_attr >> 16):raise ValueError('Unsafe ZIP path')
  if i.filename in seen:raise ValueError('Duplicate ZIP path')
  seen.add(i.filename)
  target=(root/i.filename).resolve()
  if not target.is_relative_to(root):raise ValueError('Unsafe ZIP path')
  target.parent.mkdir(parents=True,exist_ok=True)
  with z.open(i) as src, target.open('wb') as out:
   while block:=src.read(65536):out.write(block)
print(len(files))
