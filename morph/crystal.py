# Crystal fruit ASMR cut: glass fruit full of glitter, knife slices a piece off, glitter spills.
# blender -b -P crystal.py -- --fruit strawberry --out out/c [--w 720 --h 1280 --samples 48 --f0 1 --f1 300 --still N]
import bpy, bmesh, sys, math, argparse, random
from mathutils import Vector
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
ap = argparse.ArgumentParser()
ap.add_argument('--fruit', default='strawberry')
ap.add_argument('--out', default='out/c')
ap.add_argument('--w', type=int, default=720); ap.add_argument('--h', type=int, default=1280)
ap.add_argument('--samples', type=int, default=48)
ap.add_argument('--f0', type=int, default=1); ap.add_argument('--f1', type=int, default=300)
ap.add_argument('--still', type=int, default=0)
A = ap.parse_args(argv)
RND = random.Random(5)
FR = {
    'strawberry': dict(glass=(1.0, 0.80, 0.84), glit=(1.0, 0.25, 0.35), leaf=(0.15, 0.75, 0.25), seed=True),
    'apple': dict(glass=(1.0, 0.95, 0.80), glit=(1.0, 0.80, 0.35), leaf=(0.2, 0.7, 0.2), seed=False),
    'grapes': dict(glass=(0.90, 0.82, 1.0), glit=(0.75, 0.45, 1.0), leaf=(0.2, 0.7, 0.2), seed=False),
}[A.fruit]

sc = bpy.context.scene
for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
sc.frame_start, sc.frame_end = A.f0, A.f1
sc.render.fps = 30
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'
sc.cycles.samples = A.samples; sc.cycles.use_denoising = True
sc.cycles.max_bounces = 12; sc.cycles.transmission_bounces = 10; sc.cycles.glossy_bounces = 6
sc.cycles.caustics_reflective = False; sc.cycles.caustics_refractive = False
sc.render.resolution_x, sc.render.resolution_y = A.w, A.h
sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Medium High Contrast'

def node_mat(name):
    m = bpy.data.materials.new(name); m.use_nodes = True; return m, m.node_tree.nodes, m.node_tree.links
def bsdf(m): return m.node_tree.nodes['Principled BSDF']

# glass shell
glass, n, l = node_mat('glass'); b = bsdf(glass)
b.inputs['Base Color'].default_value = (*FR['glass'], 1); b.inputs['Transmission Weight'].default_value = 1
b.inputs['Roughness'].default_value = 0.0; b.inputs['IOR'].default_value = 1.52
# glitter core: sparkly metallic flakes via voronoi-randomised normals
glit, n, l = node_mat('glitter'); b = bsdf(glit)
tc = n.new('ShaderNodeTexCoord'); vo = n.new('ShaderNodeTexVoronoi'); vo.inputs['Scale'].default_value = 180
l.new(tc.outputs['Object'], vo.inputs['Vector'])
mx = n.new('ShaderNodeMix'); mx.data_type = 'RGBA'; mx.inputs['Factor'].default_value = 0.55
l.new(vo.outputs['Color'], mx.inputs['B']); mx.inputs['A'].default_value = (0.5, 0.5, 1, 1)
nm = n.new('ShaderNodeNormalMap'); nm.inputs['Strength'].default_value = 3; l.new(mx.outputs['Result'], nm.inputs['Color'])
l.new(nm.outputs['Normal'], b.inputs['Normal'])
cr = n.new('ShaderNodeValToRGB'); l.new(vo.outputs['Distance'], cr.inputs['Fac'])
cr.color_ramp.elements[0].color = (*FR['glit'], 1); cr.color_ramp.elements[1].position = 0.6
cr.color_ramp.elements[1].color = tuple(c * 0.35 for c in FR['glit']) + (1,)
l.new(cr.outputs['Color'], b.inputs['Base Color'])
b.inputs['Metallic'].default_value = 1; b.inputs['Roughness'].default_value = 0.18
gold, n, l = node_mat('gold'); b = bsdf(gold); b.inputs['Base Color'].default_value = (1.0, 0.68, 0.25, 1); b.inputs['Metallic'].default_value = 1; b.inputs['Roughness'].default_value = 0.15
leafm, n, l = node_mat('leaf'); b = bsdf(leafm); b.inputs['Base Color'].default_value = (*FR['leaf'], 1); b.inputs['Transmission Weight'].default_value = 0.85; b.inputs['Roughness'].default_value = 0.05
steel, n, l = node_mat('steel'); b = bsdf(steel); b.inputs['Base Color'].default_value = (0.9, 0.9, 0.92, 1); b.inputs['Metallic'].default_value = 1; b.inputs['Roughness'].default_value = 0.12
black, n, l = node_mat('black'); b = bsdf(black); b.inputs['Base Color'].default_value = (0.02, 0.02, 0.02, 1); b.inputs['Roughness'].default_value = 0.3

# ---- fruit shape (profile radius by height) ----
def profile(zn):            # zn: 0 bottom .. 1 top -> radius factor
    if A.fruit == 'strawberry': return max(0.0, math.sin(math.pi * zn)) ** 0.55 * (0.45 + 0.55 * zn)
    return math.sin(math.pi * zn) * (0.92 + 0.08 * math.cos(zn * 6))
H = 1.9 if A.fruit == 'strawberry' else 1.7
def fruit_mesh(name, scale):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=96, ring_count=64, radius=1)
    o = bpy.context.object; o.name = name
    for v in o.data.vertices:
        zn = (v.co.z + 1) / 2; r = profile(zn) * 1.05
        lob = 1 + (0.04 * math.cos(8 * math.atan2(v.co.y, v.co.x)) if A.fruit == 'apple' else 0)
        xy = Vector((v.co.x, v.co.y)); L = xy.length
        if L > 1e-6: xy = xy / L * r * lob * scale * (1 if A.fruit != 'strawberry' else 1.0)
        v.co.x, v.co.y = xy.x, xy.y; v.co.z = zn * H * scale + (1 - scale) * H * 0.5
    bpy.ops.object.shade_smooth()
    return o
shell = fruit_mesh('shell', 1.0); shell.data.materials.append(glass)
core = fruit_mesh('core', 0.80); core.data.materials.append(glit)
# gold seams (strawberry: seeds; apple: meridian lines)
parts = [shell, core]
if FR['seed']:
    for i in range(70):
        zn = 0.12 + 0.78 * (i / 70); ang = i * 2.399963
        r = profile(zn) * 1.05; p = Vector((math.cos(ang) * r, math.sin(ang) * r, zn * H))
        bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, radius=0.035, location=p)
        s = bpy.context.object; s.scale = (1, 1, 1.6); s.data.materials.append(gold); parts.append(s)
# crown leaves + stem
for k in range(6):
    a = k / 6 * 2 * math.pi
    bpy.ops.mesh.primitive_cone_add(vertices=24, radius1=0.13, radius2=0.0, depth=0.8, location=(math.cos(a) * 0.32, math.sin(a) * 0.32, H + 0.02))
    lf = bpy.context.object; lf.scale = (1, 0.35, 1); lf.rotation_euler = (0, math.radians(112), a)
    lf.data.materials.append(leafm); bpy.ops.object.shade_smooth()
bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.05, depth=0.45, location=(0, 0, H + 0.2))
st = bpy.context.object; st.data.materials.append(gold); st.rotation_euler = (0.25, 0, 0)

# ---- the cut: split shell/core/seeds into body + slice at x = CUTX ----
CUTY = -0.30          # front slice (y < CUTY) falls toward the camera, showing the glitter inside
def cutter(name, ymax):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, ymax - 2, 1)); c = bpy.context.object
    c.scale = (4, 4, 4); c.name = name; c.hide_render = True; c.display_type = 'WIRE'
    c.data.materials.append(glit); return c
cut = cutter('cut', CUTY)                       # shell: glass cap
cut.data.materials[0] = glass
cutc = cutter('cutc', CUTY + 0.012)             # body core: recessed a hair so caps never overlap
cutd = cutter('cutd', CUTY - 0.012)             # slice core
piv = bpy.data.objects.new('slicepivot', None); sc.collection.objects.link(piv); piv.location = (0, CUTY - 0.35, 0.0)
for p in parts:
    dup = p.copy(); dup.data = p.data.copy(); sc.collection.objects.link(dup)
    m1 = p.modifiers.new('b', 'BOOLEAN'); m1.operation = 'DIFFERENCE'; m1.object = cut if p is shell else cutc; m1.solver = 'EXACT'; m1.material_mode = 'TRANSFER'
    m2 = dup.modifiers.new('b', 'BOOLEAN'); m2.operation = 'INTERSECT'; m2.object = cut if p is shell else cutd; m2.solver = 'EXACT'; m2.material_mode = 'TRANSFER'
    dup.parent = piv; dup.matrix_parent_inverse = piv.matrix_world.inverted()
# timeline: knife comes down 30..120, slice tips over 120..165, rest
KNIFE0, KNIFE1, FALL0, FALL1 = 25, 125, 125, 165
piv.rotation_euler = (0, 0, 0); piv.keyframe_insert('rotation_euler', frame=FALL0)
piv.rotation_euler = (math.radians(-86), 0, 0); piv.keyframe_insert('rotation_euler', frame=FALL1)
piv.rotation_euler = (math.radians(-80), 0, 0); piv.keyframe_insert('rotation_euler', frame=FALL1 + 5)
piv.rotation_euler = (math.radians(-86), 0, 0); piv.keyframe_insert('rotation_euler', frame=FALL1 + 9)
for fc in piv.animation_data.action.fcurves if hasattr(piv.animation_data.action, 'fcurves') else []:
    for kp in fc.keyframe_points: kp.interpolation = 'QUAD'

# ---- knife ----
bpy.ops.mesh.primitive_cube_add(size=1); kn = bpy.context.object
kn.scale = (2.6, 0.02, 0.55); bpy.ops.object.transform_apply(scale=True)
bm = bmesh.new(); bm.from_mesh(kn.data)
for v in bm.verts:                              # taper edge + pointed tip
    if v.co.z < 0: v.co.y *= 0.05
    if v.co.x > 0.9: v.co.z = max(v.co.z, -0.275 + (v.co.x - 0.9) * 0.9) if v.co.z < 0 else v.co.z - (v.co.x - 0.9) * 0.3
bm.to_mesh(kn.data); bm.free(); kn.data.materials.append(steel)
bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.14, depth=1.3, location=(-1.95, 0, 0.05), rotation=(0, math.pi / 2, 0))
hd = bpy.context.object; hd.data.materials.append(black); hd.parent = kn
knife = kn
def kpos(f):
    t = max(0, min(1, (f - KNIFE0) / (KNIFE1 - KNIFE0)))
    return Vector((0.35 - 0.25 * t, CUTY, H + 1.2 - (H + 1.25) * (t * t * (3 - 2 * t)))), math.radians(12 - 10 * t)
for f in range(1, A.f1 + 1, 3):
    p, rx = kpos(f); knife.location = p; knife.rotation_euler = (0, rx, 0)
    if f > KNIFE1: knife.location.z += min(1.5, (f - KNIFE1) * 0.05) ; knife.location.x -= min(0.6, (f - KNIFE1) * 0.02)
    knife.keyframe_insert('location', frame=f); knife.keyframe_insert('rotation_euler', frame=f)

# ---- glitter spill (particles from the cut face) ----
bpy.ops.mesh.primitive_plane_add(size=1, location=(0, CUTY - 0.02, 0.9), rotation=(math.pi / 2, 0, 0))
em = bpy.context.object; em.scale = (1.2, 1.4, 1); em.hide_render = True
ps = em.modifiers.new('ps', 'PARTICLE_SYSTEM').particle_system.settings
ps.count = 2500; ps.frame_start = KNIFE0 + 30; ps.frame_end = FALL1 + 30; ps.lifetime = 400
ps.normal_factor = 0.3; ps.factor_random = 0.4; ps.render_type = 'OBJECT'; ps.particle_size = 0.012; ps.size_random = 0.6
ps.use_rotations = True; ps.rotation_mode = 'NOR'; ps.phase_factor_random = 2.0
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=1, location=(0, 0, -50)); fl = bpy.context.object
fl.scale = (1, 1, 0.25); fl.data.materials.append(glit); ps.instance_object = fl

# ---- board, background, lights ----
bpy.ops.mesh.primitive_cylinder_add(vertices=128, radius=3.2, depth=0.35, location=(0, 0, -0.175)); bd = bpy.context.object
bd.modifiers.new('c', 'COLLISION')
wood, n, l = node_mat('wood'); b = bsdf(wood)
wv = n.new('ShaderNodeTexWave'); wv.wave_type = 'RINGS'; wv.inputs['Scale'].default_value = 7; wv.inputs['Distortion'].default_value = 6; wv.inputs['Detail'].default_value = 4
cr = n.new('ShaderNodeValToRGB'); l.new(wv.outputs['Fac'], cr.inputs['Fac'])
cr.color_ramp.elements[0].color = (0.10, 0.035, 0.012, 1); cr.color_ramp.elements[1].color = (0.38, 0.15, 0.045, 1)
l.new(cr.outputs['Color'], b.inputs['Base Color']); b.inputs['Roughness'].default_value = 0.35; b.inputs['Coat Weight'].default_value = 0.3
bd.data.materials.append(wood)
w = bpy.data.worlds.new('W'); sc.world = w; w.use_nodes = True
w.node_tree.nodes['Background'].inputs['Color'].default_value = (0.01, 0.006, 0.002, 1)
bok, n, l = node_mat('bokeh'); n.remove(bsdf(bok)); e = n.new('ShaderNodeEmission'); e.inputs['Color'].default_value = (1, 0.62, 0.22, 1); e.inputs['Strength'].default_value = 5
l.new(e.outputs[0], n['Material Output'].inputs[0])
for i in range(45):
    bpy.ops.mesh.primitive_ico_sphere_add(radius=RND.uniform(0.08, 0.2), location=(RND.uniform(-6, 6), RND.uniform(8, 13), RND.uniform(1.5, 8)))
    bpy.context.object.data.materials.append(bok)
def area(loc, energy, size, rot, col=(1, 0.92, 0.8)):
    bpy.ops.object.light_add(type='AREA', location=loc, rotation=rot); L = bpy.context.object
    L.data.energy = energy; L.data.size = size; L.data.color = col
area((-3, -3, 5), 1100, 3, (math.radians(40), 0, math.radians(-40)))
area((3.5, -1, 3), 350, 2.5, (math.radians(70), 0, math.radians(75)), (1, 0.8, 0.6))
area((0, 3.5, 4.5), 900, 2.5, (math.radians(-45), 0, 0), (1, 0.85, 0.65))   # rim light behind
area((0, -9, 3.5), 260, 9, (math.radians(90), 0, 0), (1, 0.93, 0.85))       # soft front fill: gives the blade something to mirror
bpy.ops.object.camera_add(location=(0, -6.4, 2.9)); cam = bpy.context.object; sc.camera = cam
cam.data.lens = 34; cam.data.sensor_fit = 'VERTICAL'
tg = bpy.data.objects.new('t', None); sc.collection.objects.link(tg); tg.location = (0, 0, 1.0)
c = cam.constraints.new('TRACK_TO'); c.target = tg; c.track_axis = 'TRACK_NEGATIVE_Z'; c.up_axis = 'UP_Y'
cam.data.dof.use_dof = True; cam.data.dof.focus_object = tg; cam.data.dof.aperture_fstop = 2.0

if A.still:
    for f in range(1, A.still + 1): sc.frame_set(f)
    sc.render.filepath = A.out + '.png'; bpy.ops.render.render(write_still=True)
else:
    for f in range(1, A.f1 + 1): sc.frame_set(f)       # particles evaluated in order
    sc.render.image_settings.file_format = 'JPEG'; sc.render.image_settings.quality = 92
    sc.render.filepath = A.out + '_'; bpy.ops.render.render(animation=True)
