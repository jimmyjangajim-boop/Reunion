"""Read-only ingestion of supplied Reunion evidence into an isolated review database."""
import collections, csv, hashlib, io, json, re, sqlite3, zipfile
from pathlib import Path
from datetime import datetime, timezone
from lxml import html, etree

ROOT = Path(__file__).resolve().parent
WORK = ROOT.parent
NS = {'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main', 's':'http://schemas.openxmlformats.org/spreadsheetml/2006/main', 'r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
def digest(b): return hashlib.sha256(b).hexdigest()
def cls(el, name): return el.xpath('.//*[contains(concat(" ",normalize-space(@class)," ")," '+name+' ")]')
def txt(el):
    # Preserve explicit line breaks and block boundaries without importing scripts/styles.
    e=etree.fromstring(etree.tostring(el))
    for n in e.xpath('.//script|.//style'): n.getparent().remove(n)
    for n in e.xpath('.//br'): n.tail='\n'+(n.tail or '')
    for n in e.xpath('.//p|.//li|.//h1|.//h2|.//h3|.//tr|.//pre'): n.tail='\n'+(n.tail or '')
    return ''.join(e.itertext()).strip()

def main():
    ROOT.mkdir(exist_ok=True); (ROOT/'texts').mkdir(exist_ok=True); (ROOT/'originals').mkdir(exist_ok=True)
    db=sqlite3.connect(ROOT/'reunion_evidence.sqlite'); db.execute('PRAGMA foreign_keys=ON')
    db.executescript('''
    CREATE TABLE IF NOT EXISTS metadata(key TEXT PRIMARY KEY,value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS source_blobs(sha256 TEXT PRIMARY KEY,bytes BLOB NOT NULL);
    CREATE TABLE IF NOT EXISTS document_properties(source_id TEXT REFERENCES sources,name TEXT,value TEXT,PRIMARY KEY(source_id,name));
    CREATE TABLE IF NOT EXISTS sources(id TEXT PRIMARY KEY,container TEXT,path TEXT,kind TEXT,sha256 TEXT REFERENCES source_blobs,byte_count INTEGER,priority TEXT,extraction_status TEXT,text TEXT,UNIQUE(container,path));
    CREATE TABLE IF NOT EXISTS passages(id TEXT PRIMARY KEY,source_id TEXT REFERENCES sources,locator TEXT,body TEXT,recorded_at TEXT,world_date_text TEXT,canon_status TEXT DEFAULT 'unreviewed', UNIQUE(source_id,locator));
    CREATE VIRTUAL TABLE IF NOT EXISTS search USING fts5(passage_id UNINDEXED,source_id UNINDEXED,locator UNINDEXED,body,tokenize='unicode61');
    CREATE TABLE IF NOT EXISTS discord_channels(source_id TEXT PRIMARY KEY REFERENCES sources,category_channel TEXT,channel_id TEXT,expected_count INTEGER,parsed_count INTEGER,export_timezone TEXT);
    CREATE TABLE IF NOT EXISTS discord_messages(message_id TEXT PRIMARY KEY,source_id TEXT REFERENCES sources,author_id TEXT,author_display TEXT,author_handle TEXT,posted_text TEXT,posted_utc TEXT,edited_text TEXT,reply_to TEXT,content TEXT,embeds TEXT,raw_html TEXT);
    CREATE TABLE IF NOT EXISTS attachment_references(id INTEGER PRIMARY KEY,source_id TEXT REFERENCES sources,message_id TEXT,url TEXT,label TEXT,kind TEXT,availability TEXT DEFAULT 'remote_reference_only');
    CREATE TABLE IF NOT EXISTS workbook_cells(source_id TEXT REFERENCES sources,sheet TEXT,address TEXT,cell_type TEXT,raw_value TEXT,display_value TEXT,formula TEXT,style_id TEXT,PRIMARY KEY(source_id,sheet,address));
    CREATE TABLE IF NOT EXISTS workbook_sheets(source_id TEXT REFERENCES sources,name TEXT,state TEXT,dimension TEXT,nonempty_cells INTEGER,PRIMARY KEY(source_id,name));
    CREATE TABLE IF NOT EXISTS workbook_comments(source_id TEXT REFERENCES sources,sheet TEXT,address TEXT,body TEXT,author TEXT,PRIMARY KEY(source_id,sheet,address));
    CREATE TABLE IF NOT EXISTS review_issues(id TEXT PRIMARY KEY,priority TEXT,topic TEXT,question TEXT,evidence TEXT,default_handling TEXT,answer TEXT,status TEXT DEFAULT 'awaiting_user');
    CREATE TABLE IF NOT EXISTS candidate_claims(id TEXT PRIMARY KEY,entity TEXT,predicate TEXT,value_json TEXT,world_date_text TEXT,date_precision TEXT,canon_status TEXT,operational_status TEXT,authority TEXT,notes TEXT);
    CREATE TABLE IF NOT EXISTS claim_evidence(claim_id TEXT REFERENCES candidate_claims,passage_id TEXT REFERENCES passages,relation TEXT DEFAULT 'supports',PRIMARY KEY(claim_id,passage_id));
    CREATE TABLE IF NOT EXISTS review_coverage(source_id TEXT PRIMARY KEY REFERENCES sources,extraction_verified INTEGER DEFAULT 0,content_reviewed INTEGER DEFAULT 0,notes TEXT);
    ''')
    db.execute('DELETE FROM search')
    def source(container,path,b,priority):
        sha=digest(b); sid='src_'+digest((container+'!'+path).encode())[:16]
        old=db.execute('SELECT sha256 FROM sources WHERE id=?',(sid,)).fetchone()
        if old and old[0]!=sha:raise ValueError('Existing source bytes changed; use a new import/version instead: '+path)
        db.execute('INSERT OR IGNORE INTO source_blobs VALUES(?,?)',(sha,b))
        db.execute('INSERT OR IGNORE INTO sources VALUES(?,?,?,?,?,?,?,?,?)',(sid,container,path,Path(path).suffix.lower(),sha,len(b),priority,'pending',''))
        db.execute('INSERT OR IGNORE INTO review_coverage(source_id) VALUES(?)',(sid,))
        return sid
    def passage(sid,loc,body,recorded=None):
        pid='p_'+digest((sid+'!'+loc).encode())[:20]
        db.execute('INSERT INTO passages(id,source_id,locator,body,recorded_at) VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET body=excluded.body,recorded_at=excluded.recorded_at',(pid,sid,loc,body,recorded))
        return pid
    def xlsx(sid,b):
        lines=[]
        with zipfile.ZipFile(io.BytesIO(b)) as z:
            strings=[]
            if 'xl/sharedStrings.xml' in z.namelist():
                for si in etree.fromstring(z.read('xl/sharedStrings.xml')).findall('s:si',NS): strings.append(''.join(si.itertext()))
            rels={n.get('Id'):n.get('Target') for n in etree.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
            wb=etree.fromstring(z.read('xl/workbook.xml'))
            comment_sheets={}
            for sh in wb.findall('s:sheets/s:sheet',NS):
                name=sh.get('name'); target=rels[sh.get('{'+NS['r']+'}id')]
                target=target.lstrip('/') if target.startswith('/') else 'xl/'+target
                relpath=str(Path(target).parent/'_rels'/(Path(target).name+'.rels'))
                if relpath in z.namelist():
                    import posixpath
                    for rel in etree.fromstring(z.read(relpath)):
                        if rel.get('Type','').endswith('/comments'):
                            ct=rel.get('Target'); ct=ct.lstrip('/') if ct.startswith('/') else posixpath.normpath(posixpath.join(str(Path(target).parent),ct))
                            comment_sheets[ct]=name
                sheet=etree.fromstring(z.read(target)); count=0
                lines.append('\n## '+name)
                for row in sheet.findall('s:sheetData/s:row',NS):
                    cells=[]
                    for c in row.findall('s:c',NS):
                        addr=c.get('r'); typ=c.get('t','n'); v=c.find('s:v',NS); f=c.find('s:f',NS)
                        raw=v.text if v is not None else None
                        val=strings[int(raw)] if typ=='s' and raw is not None else ''.join(c.find('s:is',NS).itertext()) if typ=='inlineStr' else raw
                        formula=f.text if f is not None else None
                        if val in (None,'') and formula is None: continue
                        count+=1
                        db.execute('INSERT OR REPLACE INTO workbook_cells VALUES(?,?,?,?,?,?,?,?)',(sid,name,addr,typ,raw,val,formula,c.get('s')))
                        cells.append(addr+'='+str(val)+(' [formula='+str(formula)+']' if formula else ''))
                    if cells:
                        body=' | '.join(cells); loc=name+'!row '+row.get('r'); passage(sid,loc,body); lines.append(body)
                dim=sheet.find('s:dimension',NS)
                db.execute('INSERT OR REPLACE INTO workbook_sheets VALUES(?,?,?,?,?)',(sid,name,sh.get('state','visible'),dim.get('ref') if dim is not None else None,count))
                for n in sheet.findall('s:hyperlinks/s:hyperlink',NS): lines.append('HYPERLINK '+etree.tostring(n).decode())
            for n in z.namelist():
                if re.search(r'comments\d*\.xml$',n):
                    cr=etree.fromstring(z.read(n)); authors=[a.text or '' for a in cr.findall('s:authors/s:author',NS)]
                    for cm in cr.findall('s:commentList/s:comment',NS):
                        content=''.join(cm.find('s:text',NS).itertext()); shname=comment_sheets.get(n,'unknown_sheet'); addr=cm.get('ref')
                        author=authors[int(cm.get('authorId','0'))] if authors else ''
                        db.execute('INSERT OR REPLACE INTO workbook_comments VALUES(?,?,?,?,?)',(sid,shname,addr,content,author))
                        passage(sid,shname+'!'+addr+' comment',content); lines.append('COMMENT '+shname+'!'+addr+' '+content)
        return '\n'.join(lines)
    def docx(sid,b):
        lines=[]
        with zipfile.ZipFile(io.BytesIO(b)) as z:
            names=['word/document.xml']+[n for n in z.namelist() if re.match(r'word/(footnotes|endnotes|comments|header\d+|footer\d+)\.xml$',n)]
            for n in names:
                doc=etree.fromstring(z.read(n))
                for i,p in enumerate(doc.findall('.//w:p',NS),1):
                    parts=[]
                    for node in p.iter():
                        tag=etree.QName(node).localname
                        if tag in ('t','delText'): parts.append(node.text or '')
                        elif tag=='tab': parts.append('\t')
                        elif tag in ('br','cr'): parts.append('\n')
                    body=''.join(parts).strip()
                    if body: loc=n+':paragraph '+str(i); passage(sid,loc,body); lines.append('['+str(i)+'] '+body)
            for n in z.namelist():
                if n.endswith('.rels'):
                    for el in etree.fromstring(z.read(n)):
                        if el.get('TargetMode')=='External':
                            db.execute('INSERT INTO attachment_references(source_id,url,label,kind) VALUES(?,?,?,?)',(sid,el.get('Target'),n,'docx_external_relationship'))
                if n.startswith('word/media/'):
                    bb=z.read(n); imgid=source(sid,n,bb,'embedded_media'); db.execute("UPDATE sources SET extraction_status='binary_preserved' WHERE id=?",(imgid,))
        return '\n'.join(lines)
    def discord(sid,b):
        db.execute('DELETE FROM attachment_references WHERE source_id=?',(sid,))
        root=html.fromstring(b)
        pre=cls(root,'preamble__entry'); channel=' / '.join(txt(x) for x in pre)
        post=' '.join(txt(x) for x in cls(root,'postamble__entry')); match=re.search(r'Exported ([\d,]+) message',post)
        tz=re.search(r'Timezone: (\S+)',post); tz=tz.group(1) if tz else None
        containers=root.xpath('//*[@data-message-id]'); lines=[]
        inherited={}
        for el in containers:
            mid=el.get('data-message-id'); a=cls(el,'chatlog__author')
            if a: inherited={'id':a[0].get('data-user-id'),'display':txt(a[0]),'handle':a[0].get('title')}
            group=el.getparent()
            if not a:
                aa=cls(group,'chatlog__author')
                if aa: inherited={'id':aa[0].get('data-user-id'),'display':txt(aa[0]),'handle':aa[0].get('title')}
            stamps=cls(el,'chatlog__timestamp') or cls(el,'chatlog__short-timestamp')
            posted=stamps[0].get('title') if stamps else None
            # Discord snowflakes encode exact real-world UTC creation timestamps.
            utc=datetime.fromtimestamp(((int(mid)>>22)+1420070400000)/1000,timezone.utc).isoformat()
            contents=cls(el,'chatlog__content'); content='\n'.join(txt(x) for x in contents)
            embeds='\n'.join(txt(x) for x in cls(el,'chatlog__embed'))
            edited=cls(el,'chatlog__edited-timestamp'); edited_text=edited[0].get('title') if edited else None
            replies=cls(el,'chatlog__reply'); reply_to=None
            if replies:
                rr=re.search(r'scrollToMessage\([^,]+,[\s\x27\x22]*([0-9]+)',etree.tostring(replies[0]).decode()); reply_to=rr.group(1) if rr else None
            db.execute('INSERT OR REPLACE INTO discord_messages VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',(mid,sid,inherited.get('id'),inherited.get('display'),inherited.get('handle'),posted,utc,edited_text,reply_to,content,embeds,etree.tostring(el,encoding='unicode')))
            refs=[]
            for attachment in cls(el,'chatlog__attachment'):
                for node in attachment.xpath('.//*[@href or @src]'):
                    url=node.get('href') or node.get('src')
                    if url and not url.startswith('#'):
                        refs.append((url,txt(node) or node.get('alt') or '', 'discord_attachment'))
            for node in el.xpath('.//a[@href]'):
                url=node.get('href')
                if url.startswith(('https://','http://')): refs.append((url,txt(node),'message_link'))
            seen=set()
            for url,label,kind in refs:
                if url in seen: continue
                seen.add(url); db.execute('INSERT INTO attachment_references(source_id,message_id,url,label,kind) VALUES(?,?,?,?,?)',(sid,mid,url,label,kind))
            body=content+('\n[EMBEDS]\n'+embeds if embeds else '')+''.join('\n[LINK '+k+'] '+l+' '+u for u,l,k in refs if k=='discord_attachment')
            passage(sid,'message '+mid,body,utc)
            lines.append('['+mid+'] '+str(inherited.get('handle'))+' | '+str(posted)+' | UTC '+utc+'\n'+body)
        path=db.execute('SELECT path FROM sources WHERE id=?',(sid,)).fetchone()[0]
        cid=re.search(r'\[(\d+)\]',path)
        db.execute('INSERT OR REPLACE INTO discord_channels VALUES(?,?,?,?,?,?)',(sid,channel,cid.group(1) if cid else None,int(match.group(1).replace(',','')) if match else None,len(containers),tz))
        return '\n\n'.join(lines)
    archives=['Reunion Archives.zip','REUNION-20261020T035402Z-1-001.zip']
    items=[]
    for name in archives:
        p=WORK/'upload'/name; b=p.read_bytes(); cs=source('upload',name,b,'original_container'); db.execute("UPDATE sources SET extraction_status='archive_verified' WHERE id=?",(cs,)); (ROOT/'originals'/name).write_bytes(b)
        with zipfile.ZipFile(io.BytesIO(b)) as z:
            assert z.testzip() is None
            for i in z.infolist():
                if i.is_dir(): continue
                items.append((name,i.filename,z.read(i),'historical_evidence'))
    items.append(('upload','Reunion campaign tracker(1).xlsx',(WORK/'upload/Reunion campaign tracker(1).xlsx').read_bytes(),'latest_snapshot_user_designated'))
    for p in sorted((WORK/'project_sources').glob('*.txt')): items.append(('prior_sources',p.name,p.read_bytes(),'historical_evidence'))
    for container,path,b,priority in items:
        sid=source(container,path,b,priority); ext=Path(path).suffix.lower()
        if ext in ('.docx','.xlsx','.xlsm'):
            with zipfile.ZipFile(io.BytesIO(b)) as oz:
                if 'docProps/core.xml' in oz.namelist():
                    for prop in etree.fromstring(oz.read('docProps/core.xml')):
                        db.execute('INSERT OR REPLACE INTO document_properties VALUES(?,?,?)',(sid,prop.tag,prop.text))
        if ext=='.html': content=discord(sid,b)
        elif ext=='.docx': content=docx(sid,b)
        elif ext in ('.xlsx','.xlsm'): content=xlsx(sid,b)
        elif ext in ('.txt','.md'): content=b.decode('utf-8-sig'); passage(sid,'full text',content)
        else: content=''
        state='extracted' if content else 'empty_document' if ext=='.docx' else 'empty_channel' if ext=='.html' else 'binary_preserved'
        db.execute('UPDATE sources SET text=?,extraction_status=? WHERE id=?',(content,state,sid))
        (ROOT/'texts'/(sid+'.txt')).write_text('SOURCE '+container+'!'+path+'\n\n'+content,encoding='utf8')
        db.execute('UPDATE review_coverage SET extraction_verified=1 WHERE source_id=?',(sid,))
    for row in db.execute('SELECT id,source_id,locator,body FROM passages'): db.execute('INSERT INTO search VALUES(?,?,?,?)',row)
    db.execute('INSERT OR REPLACE INTO metadata VALUES(?,?)',('policy','Isolated evidence staging. No app updates or automatic canon approvals. Latest tracker has snapshot priority; in-world date remains separately determined.'))
    db.execute('INSERT OR REPLACE INTO metadata VALUES(?,?)',('created_utc',datetime.now(timezone.utc).isoformat()))
    db.commit()
    inv=[dict(zip(['id','container','path','kind','sha256','byte_count','priority','extraction_status','text_chars'],r)) for r in db.execute('SELECT id,container,path,kind,sha256,byte_count,priority,extraction_status,length(text) FROM sources')]
    (ROOT/'source_inventory.json').write_text(json.dumps(inv,indent=2,ensure_ascii=False))
    with (ROOT/'source_inventory.csv').open('w',newline='') as f:
        w=csv.DictWriter(f,fieldnames=inv[0].keys()); w.writeheader(); w.writerows(inv)
    print(json.dumps({'sources':len(inv),'passages':db.execute('select count(*) from passages').fetchone()[0],'messages':db.execute('select count(*) from discord_messages').fetchone()[0],'channels':db.execute('select count(*) from discord_channels').fetchone()[0],'cells':db.execute('select count(*) from workbook_cells').fetchone()[0],'text_chars':sum(i['text_chars'] or 0 for i in inv),'attachment_references':db.execute('select count(*) from attachment_references').fetchone()[0],'channel_count_mismatches':db.execute('select count(*) from discord_channels where expected_count != parsed_count').fetchone()[0]},indent=2))
    for i in inv: print(i['id'],i['text_chars'],i['extraction_status'],i['path'])
    db.close()

if __name__=='__main__': main()
