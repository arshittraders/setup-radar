"""Download CC0 assets from Poly Haven (polyhaven.com — every asset there is CC0) for one video.
usage: python3 b3d/polyhaven.py <seed> <material> <out_dir>
Writes out_dir/manifest.json: {"hdri": path|null, "board": {...}|null, "mat": {...}|null, "credits": [...]}.
Any failure → that slot is null and the Blender scene uses its procedural fallback (still no third-party assets).
"""
import json, os, random, sys, urllib.request

API = 'https://api.polyhaven.com'
UA = {'User-Agent': 'kiwtech-b3d/1.0 (CC0 asset fetch)'}


def get(url, binary=False):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
        data = r.read()
    return data if binary else json.loads(data)


def pick(kind, words, r, prefer=()):
    """Assets of a type whose id / tags / categories contain one of `words`."""
    assets = get(f'{API}/assets?t={kind}')
    ok = []
    for aid, a in assets.items():
        hay = ' '.join([aid] + list(a.get('tags', [])) + list(a.get('categories', []))).lower()
        if any(w in hay for w in words):
            ok.append(aid)
    ok.sort()
    pre = [p for p in prefer if p in assets]
    if pre and r.random() < 0.5:
        return r.choice(pre)
    return r.choice(ok) if ok else None


def fetch_tex(aid, out, res='1k'):
    files = get(f'{API}/files/{aid}')
    got = {}
    for key, name in [('Diffuse', 'diff'), ('Rough', 'rough'), ('nor_gl', 'nor')]:
        try:
            url = files[key][res]['jpg']['url']
        except KeyError:
            continue
        p = os.path.join(out, f'{aid}_{name}.jpg')
        with open(p, 'wb') as f:
            f.write(get(url, binary=True))
        got[name] = p
    return {'id': aid, **got} if 'diff' in got else None


def main():
    seed, material, out = int(sys.argv[1]), sys.argv[2], sys.argv[3]
    os.makedirs(out, exist_ok=True)
    r = random.Random(seed * 7919 + 13)
    man = {'hdri': None, 'board': None, 'mat': None, 'credits': []}
    try:
        hid = pick('hdris', ['studio', 'indoor'], r, prefer=('studio_small_09', 'studio_small_08', 'studio_small_03', 'brown_photostudio_02', 'photo_studio_loft_hall'))
        if hid:
            url = get(f'{API}/files/{hid}')['hdri']['1k']['hdr']['url']
            p = os.path.join(out, f'{hid}_1k.hdr')
            with open(p, 'wb') as f:
                f.write(get(url, binary=True))
            man['hdri'] = p
            man['credits'].append(f'HDRI {hid} — Poly Haven (CC0)')
    except Exception as e:
        print('hdri fallback:', e)
    try:
        bid = pick('textures', ['wood_table', 'plank', 'wood'], r)
        man['board'] = fetch_tex(bid, out, '2k') if bid else None
        if man['board']:
            man['credits'].append(f'Texture {bid} — Poly Haven (CC0)')
    except Exception as e:
        print('board fallback:', e)
    if material in ('marble', 'wood'):
        try:
            mid = pick('textures', ['marble'] if material == 'marble' else ['wood'], r)
            man['mat'] = fetch_tex(mid, out, '2k') if mid else None
            if man['mat']:
                man['credits'].append(f'Texture {mid} — Poly Haven (CC0)')
        except Exception as e:
            print('material fallback:', e)
    with open(os.path.join(out, 'manifest.json'), 'w') as f:
        json.dump(man, f, indent=1)
    print(json.dumps(man, indent=1))


if __name__ == '__main__':
    main()
