# usage: python clipzeno_sql.py rows.tsv out.sql   (tsv: file<TAB>title<TAB>hook<TAB>post_at_iso)
import sys
B = 'https://ceoehwleopykotddcxxk.supabase.co/storage/v1/object/public/studio/site/videos/'
CH = 'b68c5efb-3ea4-4239-b5fd-e725b8919691'; TAGS = '#GTA6 #KreekCraft #GrandTheftAutoVI'
q = lambda s: "'" + s.replace("'", "''") + "'"
vals = []
for ln in open(sys.argv[1], encoding='utf-8'):
    if not ln.strip(): continue
    f, t, hook, at = ln.rstrip('\n').split('\t')
    cap = f"{hook}\n\n🎮 Clip from @KreekCraft's GTA 6 stream\nFollow for daily GTA 6 moments!\n\n{TAGS} #gta6clips #gaming"
    vals.append(f"({q(t)},{q(f)},{q(at)},E{q(cap).replace(chr(10), chr(92) + 'n')},{q(t + ' ' + TAGS)})")
sql = f"""insert into studio_jobs (channel_id, kind, title, part, story_text, plan, created_by, status, post_at, ready_at, video_path, duration)
select c.id, 'own', v.title, '', 'clipzeno:'||v.f, jsonb_build_object('kind','own','format','reel','dur',55,'caption',v.cap,'hashtags',jsonb_build_array('#GTA6','#KreekCraft','#GrandTheftAutoVI'),'yt_title',v.yt),
 c.owner_id, 'ready', v.at::timestamptz, now(), '{B}clipzeno-'||v.f||'.mp4', 55
from (values {",".join(vals)}) as v(title,f,at,cap,yt) join studio_channels c on c.id='{CH}'
where not exists (select 1 from studio_jobs j where j.channel_id=c.id and j.story_text='clipzeno:'||v.f);
select json_agg(x) as diag from (select title, status, to_char(post_at at time zone 'Asia/Kolkata','DD Mon HH24:MI') at from studio_jobs where channel_id='{CH}' and status in ('ready','posted','posting') order by post_at) x;
"""
open(sys.argv[2], 'w', encoding='utf-8').write(sql)
