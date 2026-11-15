#!/usr/bin/env python3
"""Build deterministic local sample LUTs, previews, MinIO objects and Flyway seed."""
from __future__ import annotations

import argparse, json, math, os, re, subprocess, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
HERE = Path(__file__).resolve().parent
OUT = HERE / "out"
SEED = ROOT / "backend/app/src/main/resources/db/seed/V3_1__seed_kho_lut.sql"
SEED_RES = ROOT / "backend/business/src/main/resources/seed/kho-lut"

CATS = [
 ("dien-anh","Điện ảnh","phong-cach","Tông màu như phim chiếu rạp: tương phản sâu, vùng tối dày, da người vẫn tự nhiên.",1),
 ("co-dien","Cổ điển","phong-cach","Màu phai nhẹ, vàng ấm như ảnh cũ, hợp vlog hoài niệm và MV.",0),
 ("phim-nhua","Phim nhựa","phong-cach","Mô phỏng các dòng film Kodak, Fuji: grain nhẹ, màu mềm và có chiều sâu.",1),
 ("den-trang","Đen trắng","phong-cach","Đen trắng nhiều sắc độ, từ mềm mại đến tương phản mạnh.",0),
 ("am-ap","Ấm áp","tong-mau","Vàng cam ấm, hợp hoàng hôn, chân dung và khung cảnh mùa thu.",0),
 ("lanh","Lạnh","tong-mau","Xanh lạnh và trầm, tạo cảm giác yên tĩnh, bí ẩn.",0),
 ("teal-orange","Teal & Orange","tong-mau","Cặp màu bổ túc kinh điển của Hollywood: nền xanh mòng két, da cam ấm.",1),
 ("ruc-ro","Rực rỡ","tong-mau","Màu bão hoà, tươi sáng, nổi bật trên mạng xã hội.",0),
 ("du-lich","Du lịch","dip","Làm nổi bật trời, biển và phong cảnh cho video du lịch.",1),
 ("dam-cuoi","Đám cưới","dip","Da sáng, màu mềm và lãng mạn cho phóng sự cưới.",1),
 ("chan-dung","Chân dung","dip","Giữ màu da đẹp, tách chủ thể khỏi nền.",0),
 ("ban-dem","Ban đêm","dip","Giữ chi tiết vùng tối, làm đèn đường và neon thêm lung linh.",0),
 ("premiere-pro","Premiere Pro","phan-mem","LUT .cube dùng ngay trong Lumetri Color của Premiere Pro.",0),
 ("davinci-resolve","DaVinci Resolve","phan-mem","Kéo thả vào node Color của DaVinci Resolve.",1),
 ("final-cut-pro","Final Cut Pro","phan-mem","Dùng với hiệu ứng Custom LUT của Final Cut Pro.",0),
 ("capcut","CapCut","phan-mem","Nhập LUT vào mục Điều chỉnh của CapCut bản máy tính.",0)]

def slug(s):
    import unicodedata
    s=s.replace('đ','d').replace('Đ','D')
    s=unicodedata.normalize('NFD',s).encode('ascii','ignore').decode().lower()
    return re.sub(r'-+','-',re.sub(r'[^a-z0-9]+','-',s)).strip('-')

def cube():
    return make_cube('', 'DownBeat identity LUT')

def transform(rgb, spec):
    import numpy as np
    x=np.asarray(rgb,dtype=np.float64)
    for name,arg in re.findall(r'(grayscale|sepia|saturate|hue-rotate|brightness|contrast)\(([^)]+)\)',spec or ''):
        v=float(arg.replace('deg','').replace('turn',''))
        if name=='hue-rotate' and 'turn' in arg: v*=360
        if name=='grayscale':
            a=v; m=np.array([[.2126,.7152,.0722],[.2126,.7152,.0722],[.2126,.7152,.0722]]); x=np.clip(x@((1-a)*np.eye(3)+a*m).T,0,1)
        elif name=='sepia':
            a=v; m=np.array([[.393,.769,.189],[.349,.686,.168],[.272,.534,.131]]); x=np.clip(x@((1-a)*np.eye(3)+a*m).T,0,1)
        elif name=='saturate':
            m=np.array([[.213+.787*v,.715-.715*v,.072-.072*v],[.213-.213*v,.715+.285*v,.072-.072*v],[.213-.213*v,.715-.715*v,.072+.928*v]]); x=np.clip(x@m.T,0,1)
        elif name=='hue-rotate':
            a=math.radians(v); c=math.cos(a); s=math.sin(a)
            m=np.array([[.213+c*.787-s*.213,.715-c*.715-s*.715,.072-c*.072+s*.928],[.213-c*.213+s*.143,.715+c*.285+s*.140,.072-c*.072-s*.283],[.213-c*.213-s*.787,.715-c*.715+s*.715,.072+c*.928+s*.072]])
            x=np.clip(x@m.T,0,1)
        elif name=='brightness': x=np.clip(x*v,0,1)
        elif name=='contrast': x=np.clip((x-.5)*v+.5,0,1)
    return x

def make_cube(spec,title):
    grid=cube_grid(spec)
    lines=[f'TITLE "{title.replace(chr(34), chr(39))}"','LUT_3D_SIZE 33']
    lines.extend('%.6f %.6f %.6f'%tuple(c) for c in grid.reshape((-1,3)))
    return ('\n'.join(lines)+'\n').encode()

def cube_grid(spec):
    import numpy as np
    values=np.arange(33,dtype=np.float64)/32
    bv,gv,rv=np.meshgrid(values,values,values,indexing='ij')
    colors=np.stack((rv,gv,bv),axis=-1).reshape((-1,3))
    return transform(colors,spec).reshape((33,33,33,3))

def apply_cube(image,grid):
    import numpy as np
    from PIL import Image
    source=np.asarray(image,dtype=np.float32)/255
    coords=source*32
    lo=np.floor(coords).astype(np.int16); hi=np.minimum(lo+1,32)
    frac=coords-lo
    result=np.zeros_like(source)
    for rb in (0,1):
        for gb in (0,1):
            for bb in (0,1):
                ri=hi[...,0] if rb else lo[...,0]; gi=hi[...,1] if gb else lo[...,1]; bi=hi[...,2] if bb else lo[...,2]
                wr=frac[...,0] if rb else 1-frac[...,0]; wg=frac[...,1] if gb else 1-frac[...,1]; wb=frac[...,2] if bb else 1-frac[...,2]
                result += grid[bi,gi,ri] * (wr*wg*wb)[...,None]
    return Image.fromarray(np.round(np.clip(result,0,1)*255).astype('uint8'))

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--self-test',action='store_true'); args=ap.parse_args()
    payload=json.loads((SEED_RES/'luts.json').read_text(encoding='utf-8'))
    data=payload['luts'] if isinstance(payload,dict) else payload
    creator_names=[c['name'] for c in payload.get('creators',[])] if isinstance(payload,dict) else []
    if args.self_test:
        rows=cube().decode().splitlines()[2:]
        assert len(rows)==35937
        for i,line in enumerate(rows):
            b,g,r=divmod(i,33*33)[0],divmod(i,33)[0]%33,i%33
            actual=tuple(map(float,line.split())); expected=(r/32,g/32,b/32)
            assert len(actual)==3 and all(0<=v<=1 for v in actual) and max(abs(a-e) for a,e in zip(actual,expected))<=1e-6
        print('OK'); return
    try:
        from PIL import Image, ImageDraw, ImageFont, ImageEnhance
        import numpy as np
        from minio import Minio
    except ImportError as e: raise SystemExit(f'Missing dependency: {e}. Install requirements.txt')
    OUT.mkdir(exist_ok=True)
    # Credentials come from environment first, backend/.env second.
    env={}
    envfile=ROOT/'backend/.env'
    if envfile.exists():
        for ln in envfile.read_text(encoding='utf-8').splitlines():
            if '=' in ln and not ln.lstrip().startswith('#'):
                k,v=ln.split('=',1); env[k.strip()]=v.strip().strip('"\'')
    def cfg(k, default): return os.getenv(k) or env.get(k) or default
    endpoint=cfg('MINIO_ENDPOINT','http://localhost:9020').replace('http://','').replace('https://','')
    client=Minio(endpoint,access_key=cfg('MINIO_ROOT_USER','minioadmin'),secret_key=cfg('MINIO_ROOT_PASSWORD','minioadmin'),secure=cfg('MINIO_ENDPOINT','http://localhost:9020').startswith('https://'))
    pub=cfg('MINIO_PUBLIC_BUCKET','downbeat-public'); priv=cfg('MINIO_PRIVATE_BUCKET','downbeat-lut')
    for bucket in (pub,priv):
        if not client.bucket_exists(bucket): client.make_bucket(bucket)
    client.set_bucket_policy(pub,json.dumps({'Version':'2012-10-17','Statement':[{'Effect':'Allow','Principal':{'AWS':['*']},'Action':['s3:GetObject'],'Resource':[f'arn:aws:s3:::{pub}/*']}]}))
    assets=[]
    for d in data:
        name=d['title']; s=d.get('slug') or slug(name); obj=f'lut/{s}'; local=OUT/s; local.mkdir(exist_ok=True)
        cache=HERE/'.cache'; cache.mkdir(exist_ok=True)
        res_photo=SEED_RES/'photos'/f"{d['picsumSeed']}.jpg"
        source=res_photo if res_photo.exists() else cache/f"{d['picsumSeed']}.jpg"
        if not source.exists(): urllib.request.urlretrieve(f"https://picsum.photos/seed/{d['picsumSeed']}/1280/720",source)
        base=Image.open(source).convert('RGB').resize((1280,720))
        lut=local/f'{s}.cube'; lut.write_bytes(make_cube(d.get('filter',''),name))
        before=local/'before.jpg'; after=local/'after.jpg'; cover=local/'cover.jpg'
        # Derive the preview from the same quantized 33^3 cube that users download.
        graded=apply_cube(base,cube_grid(d.get('filter','')))
        if d.get('previewType')!='VIDEO': base.save(before,quality=85); graded.save(after,quality=85)
        c=graded.resize((960,540)); draw=ImageDraw.Draw(c)
        txt=d.get('coverText') or ''
        if txt:
            draw.rectangle((0,430,960,540),fill=(0,0,0,100)); draw.text((40,460),txt.upper(),fill=(245,197,66) if d.get('coverTextStyle')=='bold' else 'white',stroke_width=1,stroke_fill='black')
        c.save(cover,quality=85)
        files=[]
        if d.get('previewType')!='VIDEO': files.extend([(before,pub,'image/jpeg'),(after,pub,'image/jpeg')])
        files.append((cover,pub,'image/jpeg'))
        if d.get('previewType')=='VIDEO':
            res_video=SEED_RES/'videos'/f"{d['videoSource']}.mp4"
            video=res_video if res_video.exists() else cache/f"{d['videoSource']}.mp4"
            if not video.exists(): urllib.request.urlretrieve(f"https://interactive-examples.mdn.mozilla.net/media/cc0-videos/{d['videoSource']}.mp4",video)
            preview=local/'preview.mp4'; preview.write_bytes(video.read_bytes()); files.append((preview,pub,'video/mp4'))
        files.append((lut,priv,'text/plain'))
        keys=[]
        for file,bucket,content in files:
            key=f'{obj}/{file.name}' if file.suffix!='.cube' else f'lut/{s}.cube'
            try:
                stat=client.stat_object(bucket,key)
                if stat.size==file.stat().st_size:
                    print(f'skip existing {bucket}/{key}')
                else: client.fput_object(bucket,key,str(file),content_type=content,metadata={'Cache-Control':'public, max-age=31536000, immutable' if bucket==pub else 'private, max-age=31536000'})
            except Exception:
                client.fput_object(bucket,key,str(file),content_type=content,metadata={'Cache-Control':'public, max-age=31536000, immutable' if bucket==pub else 'private, max-age=31536000'})
            keys.append(key)
        assets.append((d,s,keys,math.ceil(lut.stat().st_size/1024)))
    # SQL seed is deterministic and deliberately uses explicit IDs for local sample data.
    q=lambda x: "'"+str(x).replace("'","''")+"'"
    sql=['-- Generated by tools/seed/kho-lut/build.py; do not edit.','INSERT IGNORE INTO creator (id,name,slug,status) VALUES']
    creators=creator_names or list(dict.fromkeys(x['creator'] for x in data))
    sql.append(',\n'.join(f"({i+1},{q(c)},{q(slug(c))},1)" for i,c in enumerate(creators))+';')
    sql.append('INSERT IGNORE INTO lut (id,slug,title,description,creator_id,style,is_premium,status,cover_url,preview_type,before_url,after_url,preview_video_url,file_key,file_size_kb,lut_size,download_count,published_time,created_by) VALUES')
    tuples=[]
    for i,(d,s,keys,size) in enumerate(assets,1):
        lut_id=int(d['id'])
        p=f'http://localhost:9020/{pub}/lut/{s}/'; preview='VIDEO' if int(d['id']) in (2,14,23,27) else 'BEFORE_AFTER'
        video=q(p+'preview.mp4') if preview=='VIDEO' else 'NULL'
        tags=', '.join(d['tags'][:2]); desc=f"{d['title']} là LUT phong cách {tags} do {d['creator']} chỉnh màu. Kéo thả file .cube vào Premiere Pro, DaVinci Resolve, Final Cut Pro hoặc CapCut để áp ngay, rồi chỉnh cường độ cho hợp với cảnh quay của bạn."
        status=d.get('status','PUBLISHED'); pubtime=q(d['publishedAt'].replace('T',' ')) if d.get('publishedAt') else 'NULL'
        tuples.append(f"({lut_id},{q(s)},{q(d['title'])},{q(desc)},{creators.index(d['creator'])+1},{q(d['style'])},{int(d['premium'])},{q(status)},{q(p+'cover.jpg')},{q(preview)},{q(p+'before.jpg') if preview!='VIDEO' else 'NULL'},{q(p+'after.jpg') if preview!='VIDEO' else 'NULL'},{video},{q('lut/'+s+'.cube')},{size},33,{d['downloads']},{pubtime},1)")
    sql.append(',\n'.join(tuples)+';')
    sql.append('INSERT IGNORE INTO lut_tag (lut_id,tag) VALUES '+','.join(f"({int(d['id'])},{q(tag)})" for d,*_ in assets for tag in sorted(d['tags']))+';')
    maps=[]
    for d,*_ in assets:
        for category in d.get('categories',[]):
            maps.append(f"SELECT {int(d['id'])}, id FROM lut_category WHERE slug={q(category)}")
    sql.append('INSERT IGNORE INTO lut_category_map (lut_id,category_id) '+ ' UNION ALL '.join(maps) + ';')
    (ROOT/'backend/app/src/main/resources/db/seed').mkdir(parents=True,exist_ok=True)
    SEED.write_text('\n'.join(sql)+'\n',encoding='utf-8')
    print('Seed generated:',SEED)

if __name__=='__main__': main()
