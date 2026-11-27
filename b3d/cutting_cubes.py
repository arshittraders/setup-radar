"""Blender (4.2 LTS, Cycles CPU) scene: CUTTING CUBES.
A block sits on a cutting board; a knife cuts it again and again (x, y, then horizontal z slices) until it is N little cubes.
usage: blender -b --factory-startup --python b3d/cutting_cubes.py -- <params.json> <chunk> <nchunks> <out_dir>
params.json = cc_plan.make(seed) + {"assets": "<dir with manifest.json>"}. Every chunk builds the identical scene
(everything comes from the seed), then renders only its own frame range → 10 matrix jobs share the work.
Only Poly Haven CC0 assets (HDRI / textures) or procedural materials are used.
"""
import bpy, bmesh, colorsys, json, math, os, sys
from mathutils import Matrix, Vector

argv = sys.argv[sys.argv.index('--') + 1:]
P = json.load(open(argv[0]))
CHUNK, NCH, OUT = int(argv[1]), int(argv[2]), argv[3]
ASSETS = P.get('assets') or ''
MAN = {}
try:
    MAN = json.load(open(os.path.join(ASSETS, 'manifest.json')))
except Exception as e:
    print('no manifest', e)
FPS = P['fps']
fr = lambda t: 1 + t * FPS   # seconds → (float) frame

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
nx, ny, nz, s = P['nx'], P['ny'], P['nz'], P['size']
W, D, H = nx * s, ny * s, nz * s
GAP = {'x': 0.05, 'y': 0.05, 'z': 0.012}


def hsv(h, sat, v):
    r, g, b = colorsys.hsv_to_rgb(h % 1.0, sat, v)
    return (r, g, b, 1.0)


def new_mat(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes.get('Principled BSDF')
    return m, nt, bsdf


def setin(node, key, val):
    if key in node.inputs:
        node.inputs[key].default_value = val


def obj_coords(nt, scale=1.0):
    tc = nt.nodes.new('ShaderNodeTexCoord')
    mp = nt.nodes.new('ShaderNodeMapping')
    mp.inputs['Scale'].default_value = (scale, scale, scale)
    nt.links.new(tc.outputs['Object'], mp.inputs['Vector'])
    return mp.outputs['Vector']


def img_tex(nt, path, vec, non_color=False):
    t = nt.nodes.new('ShaderNodeTexImage')
    t.image = bpy.data.images.load(path)
    t.projection = 'BOX'
    t.projection_blend = 0.25
    if non_color:
        t.image.colorspace_settings.name = 'Non-Color'
    nt.links.new(vec, t.inputs['Vector'])
    return t


def bump(nt, bsdf, height_socket, strength=0.3, dist=0.02):
    b = nt.nodes.new('ShaderNodeBump')
    b.inputs['Strength'].default_value = strength
    b.inputs['Distance'].default_value = dist
    nt.links.new(height_socket, b.inputs['Height'])
    nt.links.new(b.outputs['Normal'], bsdf.inputs['Normal'])


def ramp(nt, fac_socket, stops):
    cr = nt.nodes.new('ShaderNodeValToRGB')
    el = cr.color_ramp.elements
    el[0].position, el[0].color = stops[0]
    el[1].position, el[1].color = stops[-1]
    for pos, col in stops[1:-1]:
        e = el.new(pos)
        e.color = col
    nt.links.new(fac_socket, cr.inputs['Fac'])
    return cr.outputs['Color']


def pbr(nt, bsdf, tex, vec):
    if tex.get('diff'):
        nt.links.new(img_tex(nt, tex['diff'], vec).outputs['Color'], bsdf.inputs['Base Color'])
    if tex.get('rough'):
        nt.links.new(img_tex(nt, tex['rough'], vec, True).outputs['Color'], bsdf.inputs['Roughness'])


# ---------- block material (texture coords = block space → continuous across all pieces, moves with each piece) ----------
def block_material():
    kind, h = P['material'], P['hue']
    m, nt, bsdf = new_mat('Block')
    vec = obj_coords(nt, 1.0)
    if kind == 'cheese':
        setin(bsdf, 'Base Color', hsv(0.12 + 0.03 * h, 0.75, 0.95)); setin(bsdf, 'Roughness', 0.45)
        setin(bsdf, 'Subsurface Weight', 0.25); setin(bsdf, 'Subsurface Scale', 0.05)
        vo = nt.nodes.new('ShaderNodeTexVoronoi'); vo.inputs['Scale'].default_value = 4.0; nt.links.new(vec, vo.inputs['Vector'])
        holes = ramp(nt, vo.outputs['Distance'], [(0.0, (0, 0, 0, 1)), (0.22, (0, 0, 0, 1)), (0.26, (1, 1, 1, 1))])
        bump(nt, bsdf, holes, 0.6, 0.03)
    elif kind == 'soap':
        setin(bsdf, 'Base Color', hsv(h, 0.35, 0.95)); setin(bsdf, 'Roughness', 0.22)
        setin(bsdf, 'Subsurface Weight', 0.6); setin(bsdf, 'Subsurface Scale', 0.08)
        no = nt.nodes.new('ShaderNodeTexNoise'); no.inputs['Scale'].default_value = 30; nt.links.new(vec, no.inputs['Vector']); bump(nt, bsdf, no.outputs['Fac'], 0.05)
    elif kind in ('jelly', 'crystal'):
        setin(bsdf, 'Base Color', hsv(h, 0.75 if kind == 'jelly' else 0.25, 0.95)); setin(bsdf, 'Transmission Weight', 1.0)
        setin(bsdf, 'Roughness', 0.08 if kind == 'jelly' else 0.02); setin(bsdf, 'IOR', 1.35 if kind == 'jelly' else 1.55)
    elif kind == 'marble':
        setin(bsdf, 'Roughness', 0.12); setin(bsdf, 'Coat Weight', 0.3)
        if MAN.get('mat'):
            pbr(nt, bsdf, MAN['mat'], obj_coords(nt, 1.2)); setin(bsdf, 'Roughness', 0.12)
        else:
            no = nt.nodes.new('ShaderNodeTexNoise'); no.inputs['Scale'].default_value = 2.5; no.inputs['Detail'].default_value = 12; no.inputs['Distortion'].default_value = 3.0
            nt.links.new(vec, no.inputs['Vector'])
            nt.links.new(ramp(nt, no.outputs['Fac'], [(0.0, (0.95, 0.95, 0.96, 1)), (0.48, (0.92, 0.92, 0.93, 1)), (0.5, hsv(h, 0.2, 0.35)), (0.52, (0.9, 0.9, 0.92, 1)), (1.0, (0.97, 0.97, 0.98, 1))]), bsdf.inputs['Base Color'])
    elif kind == 'wood':
        if MAN.get('mat'):
            pbr(nt, bsdf, MAN['mat'], obj_coords(nt, 1.5))
        else:
            wv = nt.nodes.new('ShaderNodeTexWave'); wv.wave_type = 'RINGS'; wv.inputs['Scale'].default_value = 3.0; wv.inputs['Distortion'].default_value = 6.0
            nt.links.new(vec, wv.inputs['Vector'])
            nt.links.new(ramp(nt, wv.outputs['Fac'], [(0.0, (0.35, 0.18, 0.07, 1)), (1.0, (0.7, 0.45, 0.22, 1))]), bsdf.inputs['Base Color'])
        setin(bsdf, 'Roughness', 0.5)
    elif kind == 'chocolate':
        setin(bsdf, 'Base Color', (0.16, 0.07, 0.03, 1)); setin(bsdf, 'Roughness', 0.28)
        no = nt.nodes.new('ShaderNodeTexNoise'); no.inputs['Scale'].default_value = 60; nt.links.new(vec, no.inputs['Vector']); bump(nt, bsdf, no.outputs['Fac'], 0.08)
    elif kind == 'clay':
        setin(bsdf, 'Base Color', hsv(h, 0.55, 0.8)); setin(bsdf, 'Roughness', 0.75)
        no = nt.nodes.new('ShaderNodeTexNoise'); no.inputs['Scale'].default_value = 25; nt.links.new(vec, no.inputs['Vector']); bump(nt, bsdf, no.outputs['Fac'], 0.15)
    elif kind == 'rainbow':   # rainbow across the block → every cut shows clean colour bands
        sep = nt.nodes.new('ShaderNodeSeparateXYZ'); nt.links.new(vec, sep.inputs['Vector'])
        mth = nt.nodes.new('ShaderNodeMath'); mth.operation = 'MULTIPLY_ADD'; mth.inputs[1].default_value = 1.0 / W; mth.inputs[2].default_value = 0.5
        nt.links.new(sep.outputs['X'], mth.inputs[0])
        nt.links.new(ramp(nt, mth.outputs['Value'], [(0.0, hsv(h, 0.8, 0.95)), (0.25, hsv(h + 0.2, 0.8, 0.95)), (0.5, hsv(h + 0.4, 0.8, 0.95)), (0.75, hsv(h + 0.6, 0.8, 0.95)), (1.0, hsv(h + 0.8, 0.8, 0.95))]), bsdf.inputs['Base Color'])
        setin(bsdf, 'Roughness', 0.35); setin(bsdf, 'Subsurface Weight', 0.3); setin(bsdf, 'Subsurface Scale', 0.05)
    else:   # layer cake: sponge / cream stripes along z
        sep = nt.nodes.new('ShaderNodeSeparateXYZ'); nt.links.new(vec, sep.inputs['Vector'])
        mth = nt.nodes.new('ShaderNodeMath'); mth.operation = 'MULTIPLY'; mth.inputs[1].default_value = 6.0 / H
        nt.links.new(sep.outputs['Z'], mth.inputs[0])
        fr_ = nt.nodes.new('ShaderNodeMath'); fr_.operation = 'FRACT'; nt.links.new(mth.outputs['Value'], fr_.inputs[0])
        sponge, cream = hsv(0.09, 0.45, 0.85), hsv(h, 0.35, 0.98)
        nt.links.new(ramp(nt, fr_.outputs['Value'], [(0.0, sponge), (0.68, sponge), (0.72, cream), (1.0, cream)]), bsdf.inputs['Base Color'])
        no = nt.nodes.new('ShaderNodeTexNoise'); no.inputs['Scale'].default_value = 80; nt.links.new(vec, no.inputs['Vector']); bump(nt, bsdf, no.outputs['Fac'], 0.25)
        setin(bsdf, 'Roughness', 0.6)
    return m


def plain(name, col, rough=0.5, metal=0.0):
    m, nt, bsdf = new_mat(name)
    setin(bsdf, 'Base Color', col); setin(bsdf, 'Roughness', rough); setin(bsdf, 'Metallic', metal)
    return m, nt, bsdf


# ---------- world: Poly Haven HDRI lights the scene, camera sees a clean colour backdrop ----------
bg_col = hsv(P['bg_hue'], 0.35, 0.55)
wd = bpy.data.worlds.new('World'); sc.world = wd; wd.use_nodes = True; wn = wd.node_tree
for n in list(wn.nodes):
    wn.nodes.remove(n)
outw = wn.nodes.new('ShaderNodeOutputWorld'); light_bg = wn.nodes.new('ShaderNodeBackground'); cam_bg = wn.nodes.new('ShaderNodeBackground')
cam_bg.inputs['Color'].default_value = bg_col; cam_bg.inputs['Strength'].default_value = 1.0
if MAN.get('hdri'):
    env = wn.nodes.new('ShaderNodeTexEnvironment'); env.image = bpy.data.images.load(MAN['hdri']); wn.links.new(env.outputs['Color'], light_bg.inputs['Color'])
    light_bg.inputs['Strength'].default_value = 0.9
else:
    light_bg.inputs['Color'].default_value = (0.8, 0.8, 0.82, 1); light_bg.inputs['Strength'].default_value = 0.6
lp = wn.nodes.new('ShaderNodeLightPath'); mix = wn.nodes.new('ShaderNodeMixShader')
wn.links.new(lp.outputs['Is Camera Ray'], mix.inputs['Fac']); wn.links.new(light_bg.outputs['Background'], mix.inputs[1]); wn.links.new(cam_bg.outputs['Background'], mix.inputs[2])
wn.links.new(mix.outputs['Shader'], outw.inputs['Surface'])

# floor (same colour as the backdrop → seamless studio look)
bpy.ops.mesh.primitive_plane_add(size=60, location=(0, 0, -0.09))
fm, _, fb = plain('Floor', hsv(P['bg_hue'], 0.35, 0.5), 0.85); bpy.context.object.data.materials.append(fm)

# cutting board
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, -0.045)); board = bpy.context.object; board.scale = (W + 1.5, D + 1.3, 0.09)
bpy.ops.object.transform_apply(scale=True)
bv = board.modifiers.new('bev', 'BEVEL'); bv.width = 0.03; bv.segments = 4
bm_, bnt, bbs = new_mat('Board')
if P['board_style'] == 0 and MAN.get('board'):
    pbr(bnt, bbs, MAN['board'], obj_coords(bnt, 0.6))
elif P['board_style'] == 1:
    setin(bbs, 'Base Color', (0.06, 0.065, 0.07, 1)); setin(bbs, 'Roughness', 0.55)   # slate
else:
    if MAN.get('board'):
        pbr(bnt, bbs, MAN['board'], obj_coords(bnt, 0.6))
    else:
        setin(bbs, 'Base Color', (0.92, 0.92, 0.9, 1)); setin(bbs, 'Roughness', 0.4)   # white board
board.data.materials.append(bm_)

# ---------- the block: nx*ny*nz pieces, each mesh already sits in block space (origin = block origin) ----------
BM = block_material()
pieces = []
for i in range(nx):
    for j in range(ny):
        for k in range(nz):
            me = bpy.data.meshes.new(f'p{i}_{j}_{k}'); b = bmesh.new()
            bmesh.ops.create_cube(b, size=s)
            c = Vector((-W / 2 + (i + 0.5) * s, -D / 2 + (j + 0.5) * s, (k + 0.5) * s))
            for v in b.verts:
                v.co += c
            b.to_mesh(me); b.free()
            ob = bpy.data.objects.new(me.name, me); sc.collection.objects.link(ob); me.materials.append(BM)
            pieces.append({'ob': ob, 'idx': {'x': i, 'y': j, 'z': k}, 'off': Vector((0, 0, 0))})

# ---------- knife ----------
L, HB = 2.3, 0.42
kn = bpy.data.objects.new('KnifeRig', None); sc.collection.objects.link(kn)
me = bpy.data.meshes.new('blade'); b = bmesh.new()
tip = -L / 2 + 0.3
pts = [(-L / 2, 0.0), (L / 2, 0.0), (L / 2, HB), (tip, HB)]   # edge along local x at z=0, spine at z=HB, pointed tip
vs = []
for (x, z) in pts:
    th = 0.0007 if z == 0 else 0.007
    vs.append((b.verts.new((x, -th, z)), b.verts.new((x, th, z))))
b.faces.new([vs[0][0], vs[1][0], vs[2][0], vs[3][0]]); b.faces.new([vs[3][1], vs[2][1], vs[1][1], vs[0][1]])
for a in range(4):
    c2 = (a + 1) % 4
    b.faces.new([vs[a][0], vs[a][1], vs[c2][1], vs[c2][0]])
b.to_mesh(me); b.free()
blade = bpy.data.objects.new('blade', me); sc.collection.objects.link(blade); blade.parent = kn
blm, _, _ = plain('Steel', (0.85, 0.86, 0.88, 1), 0.14, 1.0); me.materials.append(blm)
bpy.ops.mesh.primitive_cube_add(size=1, location=(L / 2 + 0.33, 0, HB * 0.55)); hd = bpy.context.object; hd.scale = (0.66, 0.075, 0.2)
bpy.ops.object.transform_apply(scale=True); hd.modifiers.new('bev', 'BEVEL').width = 0.025; hd.parent = kn
hcol = [(0.02, 0.02, 0.02, 1), (0.28, 0.14, 0.06, 1), hsv(P['hue'] + 0.5, 0.7, 0.6)][P['knife_style']]
hm, _, _ = plain('Handle', hcol, 0.4); hd.data.materials.append(hm)

# ---------- animation ----------
ROT = {'x': Matrix.Rotation(math.pi / 2, 4, 'Z').to_euler(), 'y': Matrix.Identity(4).to_euler(),
       'z': Matrix(((0, 0, -1), (1, 0, 0), (0, 1, 0))).to_4x4().to_euler()}   # z: length→Y, thickness→Z, spine→-X (edge leads along +X)
AX = {'x': 0, 'y': 1, 'z': 2}
BASE = {'x': -W / 2, 'y': -D / 2, 'z': 0.0}


def key_knife(t, loc, rot, lin=False):
    kn.location = loc; kn.rotation_euler = rot
    kn.keyframe_insert('location', frame=fr(t)); kn.keyframe_insert('rotation_euler', frame=fr(t))


def key_piece(p, t):
    p['ob'].location = p['off']; p['ob'].keyframe_insert('location', frame=fr(t))


for p in pieces:
    key_piece(p, 0)
top = H + 0.02
key_knife(0.0, (W / 2 + 1.6, -0.3, top + 1.6), ROT['x'])
for e in P['events']:
    ax, bnd, t = e['axis'], e['b'], e['t']
    a = AX[ax]
    # where is the boundary now? (left side pieces' far face == right side pieces' near face)
    ref = next(p for p in pieces if p['idx'][ax] == bnd)
    pos = BASE[ax] + bnd * s + ref['off'][a]
    if ax in ('x', 'y'):
        lo = Vector((pos, -0.25, 0)) if ax == 'x' else Vector((-0.25, pos, 0))
        up = top + 0.55
        key_knife(t - 0.55, lo + Vector((0, 0, up)), ROT[ax]); key_knife(t - 0.16, lo + Vector((0, 0, top + 0.03)), ROT[ax])
        key_knife(t, lo + Vector((0, 0, 0.004)), ROT[ax]); key_knife(t + 0.12, lo + Vector((0, 0, 0.004)), ROT[ax]); key_knife(t + 0.5, lo + Vector((0, 0, up)), ROT[ax])
    else:
        z = pos; y = -0.25
        key_knife(t - 0.6, Vector((-(W / 2 + 0.95), y, z)), ROT['z']); key_knife(t - 0.3, Vector((-(W / 2 + 0.03), y, z)), ROT['z'])
        key_knife(t, Vector((W / 2 + 0.06, y, z)), ROT['z']); key_knife(t + 0.1, Vector((W / 2 + 0.06, y, z)), ROT['z']); key_knife(t + 0.55, Vector((-(W / 2 + 0.95), y, z + 0.15)), ROT['z'])
    # pieces part along the cut
    for p in pieces:
        key_piece(p, t)
        g = GAP[ax]
        if ax == 'z':
            if p['idx']['z'] >= bnd:
                p['off'][2] += g
        else:
            p['off'][a] += g / 2 if p['idx'][ax] >= bnd else -g / 2
        key_piece(p, t + 0.22)
# knife leaves, cubes spread out for the final count
tl = P['events'][-1]['t']
key_knife(tl + 1.0, (W / 2 + 1.8, -0.3, top + 1.8), ROT['x'])
TR = P['t_reveal']
for p in pieces:
    key_piece(p, TR)
    i, j, k = p['idx']['x'], p['idx']['y'], p['idx']['z']
    p['off'] = Vector((p['off'][0] * 2.2, p['off'][1] * 2.2, p['off'][2] + k * 0.03))
    key_piece(p, TR + 1.3)
# ease everything (bezier) but make the knife strike linear → sharp chop
for ob in [kn] + [p['ob'] for p in pieces]:
    ad = ob.animation_data
    if not ad or not ad.action:
        continue
    for fc in ad.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'BEZIER'; kp.handle_left_type = kp.handle_right_type = 'AUTO_CLAMPED'
for fc in kn.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        t = (kp.co[0] - 1) / FPS
        if any(abs(t - (e['t'] - (0.16 if e['axis'] != 'z' else 0.3))) < 1e-3 for e in P['events']):
            kp.interpolation = 'LINEAR'

# ---------- camera + lights ----------
tgt = bpy.data.objects.new('Target', None); sc.collection.objects.link(tgt); tgt.location = (0, 0, H * 0.45)
cam_d = bpy.data.cameras.new('Cam'); cam_d.lens = 40; cam = bpy.data.objects.new('Cam', cam_d); sc.collection.objects.link(cam); sc.camera = cam
tc = cam.constraints.new('TRACK_TO'); tc.target = tgt; tc.track_axis = 'TRACK_NEGATIVE_Z'; tc.up_axis = 'UP_Y'
side, hgt = P['cam_side'], P['cam_h']


def cam_at(t, dist, ang, h):
    a = math.radians(ang)
    cam.location = (side * math.sin(a) * dist, -math.cos(a) * dist, h * hgt)
    cam.keyframe_insert('location', frame=fr(t))


cam_at(0, 5.9, 28, 3.6); cam_at(tl, 5.2, 18, 3.3); cam_at(TR + 1.5, 5.6, 12, 4.4); cam_at(P['dur'], 5.6, 9, 4.5)
for (loc, pw, size) in [((-2.5, -2.0, 4.5), 650, 3.0), ((3.0, 2.5, 3.0), 300, 2.0)]:
    ld = bpy.data.lights.new('L', 'AREA'); ld.energy = pw; ld.size = size
    lo = bpy.data.objects.new('L', ld); sc.collection.objects.link(lo); lo.location = loc
    c = lo.constraints.new('TRACK_TO'); c.target = tgt; c.track_axis = 'TRACK_NEGATIVE_Z'; c.up_axis = 'UP_Y'

# ---------- render settings ----------
sc.render.engine = 'CYCLES'; cy = sc.cycles; cy.device = 'CPU'
cy.samples = int(os.environ.get('B3D_SAMPLES', '40')); cy.use_adaptive_sampling = True; cy.adaptive_threshold = 0.03
cy.use_denoising = True
try:
    cy.denoiser = 'OPENIMAGEDENOISE'
except Exception:
    pass
cy.max_bounces = 6; cy.diffuse_bounces = 3; cy.glossy_bounces = 3; cy.transmission_bounces = 8; cy.transparent_max_bounces = 4
cy.caustics_reflective = False; cy.caustics_refractive = False; cy.blur_glossy = 1.0
sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = 1080, 1920, int(os.environ.get('B3D_PCT', '100'))
sc.render.fps = FPS; sc.render.use_persistent_data = True
try:
    sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Medium High Contrast'
except Exception:
    pass
sc.render.image_settings.file_format = 'JPEG'; sc.render.image_settings.quality = 94
n = P['frames']; per = math.ceil(n / NCH)
sc.frame_start = 1 + CHUNK * per; sc.frame_end = min(n, (CHUNK + 1) * per)
os.makedirs(OUT, exist_ok=True)
sc.render.filepath = os.path.join(OUT, 'f_####')
print(f'B3D chunk {CHUNK}/{NCH}: frames {sc.frame_start}-{sc.frame_end}, {len(pieces)} pieces, material {P["material"]}', flush=True)
if os.environ.get('B3D_DRY') != '1':
    bpy.ops.render.render(animation=True)
