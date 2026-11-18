# Morphik-style "N FACE" cloth drop: a metal mesh sheet falls on an object.
# Usage: blender -b -P morph.py -- --faces 256 --stack 5 --out out/seg --seed 3 [--w 720 --h 1280 --samples 24 --f0 1 --f1 75]
import bpy, sys, math, argparse, random
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
ap = argparse.ArgumentParser()
ap.add_argument('--faces', type=int, default=256)
ap.add_argument('--stack', type=int, default=4)      # sheets still waiting above
ap.add_argument('--out', default='out/seg')
ap.add_argument('--seed', type=int, default=1)
ap.add_argument('--w', type=int, default=720); ap.add_argument('--h', type=int, default=1280)
ap.add_argument('--samples', type=int, default=24)
ap.add_argument('--f0', type=int, default=1); ap.add_argument('--f1', type=int, default=75)
ap.add_argument('--still', type=int, default=0)       # render one frame to PNG (preview)
ap.add_argument('--threads', type=int, default=0)
A = ap.parse_args(argv)
R = random.Random(A.seed)

# ---------- looks (picked by seed so every video differs) ----------
BG = [(0.62, 0.42, 0.10), (0.55, 0.56, 0.58), (0.40, 0.22, 0.48), (0.26, 0.40, 0.52), (0.62, 0.40, 0.42), (0.50, 0.38, 0.24)]
METAL = [((0.05, 0.05, 0.055), 0.28), ((0.80, 0.55, 0.20), 0.22), ((0.75, 0.76, 0.78), 0.18), ((0.10, 0.09, 0.08), 0.35)]
BALL = [(0.55, 0.02, 0.03), (0.08, 0.15, 0.65), (0.45, 0.05, 0.60), (0.85, 0.30, 0.02), (0.75, 0.50, 0.05)]
PED = ['tile', 'granite', 'white', 'marble']
look = dict(bg=R.choice(BG), metal=R.choice(METAL), ball=R.choice(BALL), ped=R.choice(PED))
OBJ = R.choice(['sphere', 'sphere', 'two', 'cluster'])

sc = bpy.context.scene
for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
sc.frame_start, sc.frame_end = A.f0, A.f1
sc.render.fps = 30
sc.render.engine = 'CYCLES'
sc.cycles.device = 'CPU'
sc.cycles.samples = A.samples
sc.cycles.use_denoising = True
sc.cycles.max_bounces = 6
sc.render.resolution_x, sc.render.resolution_y = A.w, A.h
sc.render.film_transparent = False
if A.threads: sc.render.threads_mode = 'FIXED'; sc.render.threads = A.threads
sc.view_settings.view_transform = 'AgX'
sc.view_settings.look = 'AgX - Medium High Contrast'

def mat(name, col, metal=0.0, rough=0.5, coat=0.0, tex=None):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*col, 1); b.inputs['Metallic'].default_value = metal
    b.inputs['Roughness'].default_value = rough
    if coat: b.inputs['Coat Weight'].default_value = coat; b.inputs['Coat Roughness'].default_value = 0.05
    if tex: tex(nt, b)
    return m

# world + backdrop
w = bpy.data.worlds.new('W'); sc.world = w; w.use_nodes = True
w.node_tree.nodes['Background'].inputs['Color'].default_value = (*look['bg'], 1)
w.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.35
bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 8, 6), rotation=(math.pi / 2, 0, 0))
bpy.context.object.data.materials.append(mat('wall', look['bg'], rough=0.9))
bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 0, -4))
bpy.context.object.data.materials.append(mat('floor', tuple(c * 0.8 for c in look['bg']), rough=0.9))

# pedestal
def ped_tex(nt, b):
    n = nt.nodes; l = nt.links
    if look['ped'] == 'tile':
        t = n.new('ShaderNodeTexBrick'); t.inputs['Scale'].default_value = 1.6; t.offset = 0.0
        t.inputs['Mortar Size'].default_value = 0.025; t.inputs['Brick Width'].default_value = 0.5; t.inputs['Row Height'].default_value = 0.5
        t.inputs['Color1'].default_value = (0.42, 0.20, 0.12, 1); t.inputs['Color2'].default_value = (0.50, 0.26, 0.16, 1)
        t.inputs['Mortar'].default_value = (0.85, 0.83, 0.80, 1)
        tc = n.new('ShaderNodeTexCoord'); sp = n.new('ShaderNodeSeparateXYZ'); ad = n.new('ShaderNodeMath'); cb = n.new('ShaderNodeCombineXYZ')
        l.new(tc.outputs['Object'], sp.inputs[0]); l.new(sp.outputs[0], ad.inputs[0]); l.new(sp.outputs[1], ad.inputs[1])
        l.new(ad.outputs[0], cb.inputs[0]); l.new(sp.outputs[2], cb.inputs[1]); l.new(cb.outputs[0], t.inputs['Vector'])
        l.new(t.outputs['Color'], b.inputs['Base Color'])
        b.inputs['Roughness'].default_value = 0.45
    else:
        t = n.new('ShaderNodeTexNoise'); t.inputs['Scale'].default_value = 40 if look['ped'] == 'granite' else 3
        t.inputs['Detail'].default_value = 8
        cr = n.new('ShaderNodeValToRGB')
        if look['ped'] == 'granite': cr.color_ramp.elements[0].color = (0.25, 0.25, 0.26, 1); cr.color_ramp.elements[1].color = (0.85, 0.85, 0.85, 1)
        elif look['ped'] == 'white': cr.color_ramp.elements[0].color = (0.82, 0.82, 0.82, 1); cr.color_ramp.elements[1].color = (0.92, 0.92, 0.92, 1)
        else: cr.color_ramp.elements[0].color = (0.62, 0.50, 0.40, 1); cr.color_ramp.elements[1].color = (0.90, 0.84, 0.76, 1)
        l.new(t.outputs['Fac'], cr.inputs['Fac']); l.new(cr.outputs['Color'], b.inputs['Base Color'])
        b.inputs['Roughness'].default_value = 0.35
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, -1.6))
ped = bpy.context.object; ped.scale = (1.9, 1.9, 3.2); bpy.ops.object.transform_apply(scale=True)
bv = ped.modifiers.new('bv', 'BEVEL'); bv.width = 0.02; bv.segments = 3
ped.data.materials.append(mat('ped', (0.5, 0.5, 0.5), tex=ped_tex))
ped.modifiers.new('col', 'COLLISION')

# object(s) the sheet falls on
ballm = mat('ball', look['ball'], rough=0.12, coat=1.0)
def ball(x, y, z, r):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=(x, y, z), segments=64, ring_count=32)
    o = bpy.context.object; bpy.ops.object.shade_smooth(); o.data.materials.append(ballm)
    c = o.modifiers.new('col', 'COLLISION'); o.collision.thickness_outer = 0.03; o.collision.cloth_friction = 8
    return o
if OBJ == 'sphere': ball(0, 0, 0.75, 0.75)
elif OBJ == 'two': ball(-0.5, 0, 0.45, 0.45); ball(0.5, 0, 0.45, 0.45)
else:
    for x, y in [(-0.42, -0.42), (0.42, -0.42), (-0.42, 0.42), (0.42, 0.42)]: ball(x, y, 0.38, 0.38)
    ball(0, 0, 1.0, 0.38)
top = 1.5 if OBJ in ('sphere', 'cluster') else 0.9

# ---------- the sheets ----------
SIZE = 2.6
metal = mat('metal', look['metal'][0], metal=1.0, rough=look['metal'][1])
def sheet(n_side, z, sim):
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=n_side, y_subdivisions=n_side, size=SIZE, location=(0, 0, z))
    o = bpy.context.object; o.data.materials.append(metal)
    vis = max(n_side, 16)                     # keep the lattice look even on coarse sheets
    if sim:
        cl = o.modifiers.new('cloth', 'CLOTH'); s = cl.settings
        s.quality = 10 if n_side < 64 else 20; s.mass = 0.6 / max(1, (n_side / 16) ** 2) * 4
        s.tension_stiffness = s.compression_stiffness = 80; s.shear_stiffness = 40
        s.bending_stiffness = 2.0 if n_side < 64 else 0.6
        s.air_damping = 1.5
        cs = cl.collision_settings; cs.distance_min = 0.015; cs.collision_quality = 4 if n_side < 64 else 8
        cs.use_self_collision = False
        cl.point_cache.frame_start = A.f0; cl.point_cache.frame_end = A.f1
    if n_side > 32:                            # sim stays fine, lattice we SEE stays readable
        dc = o.modifiers.new('dc', 'DECIMATE'); dc.decimate_type = 'UNSUBDIV'; dc.iterations = int(math.log2(n_side / 32)); vis = 32
    if vis > n_side:
        sd = o.modifiers.new('sd', 'SUBSURF'); sd.subdivision_type = 'SIMPLE'
        sd.levels = sd.render_levels = int(math.log2(vis / n_side))
    wf = o.modifiers.new('wf', 'WIREFRAME'); wf.thickness = SIZE / vis * 0.19
    wf.use_even_offset = True; wf.use_relative_offset = False
    sm = o.modifiers.new('sub2', 'SUBSURF'); sm.levels = 0; sm.render_levels = 0
    return o

n_side = max(1, round(math.sqrt(A.faces)))
STACK0 = top + 1.55
sheet(n_side, top + 0.35, True)
for k in range(A.stack):
    sheet(32, STACK0 + k * 0.09, False)

# ---------- light + camera ----------
def area(loc, energy, size, rot):
    bpy.ops.object.light_add(type='AREA', location=loc, rotation=rot); L = bpy.context.object
    L.data.energy = energy; L.data.size = size; return L
area((-3.5, -3.5, 6), 900, 4, (math.radians(45), 0, math.radians(-40)))
area((4.5, -2.5, 3), 350, 5, (math.radians(70), 0, math.radians(60)))
area((0, 4, 6), 400, 4, (math.radians(-40), 0, 0))
bpy.ops.object.camera_add(location=(0, -9.2, 6.4))
cam = bpy.context.object; sc.camera = cam
cam.data.lens = 40; cam.data.sensor_fit = 'VERTICAL'
tgt = bpy.data.objects.new('tgt', None); sc.collection.objects.link(tgt); tgt.location = (0, 0, 1.15)
tc = cam.constraints.new('TRACK_TO'); tc.target = tgt; tc.track_axis = 'TRACK_NEGATIVE_Z'; tc.up_axis = 'UP_Y'

print('LOOK', look, OBJ, 'faces', A.faces, 'side', n_side)
if A.still:
    for f in range(A.f0, A.still + 1): sc.frame_set(f)
    sc.render.filepath = A.out + '.png'; bpy.ops.render.render(write_still=True)
else:
    for f in range(A.f0, A.f1 + 1): sc.frame_set(f)       # bake sim in order
    sc.render.image_settings.file_format = 'JPEG'; sc.render.image_settings.quality = 92
    sc.render.filepath = A.out + '_'
    bpy.ops.render.render(animation=True)
