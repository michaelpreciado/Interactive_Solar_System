"""Procedural cinematic planet starter for Blender 4.x.

Run from macOS Terminal:
  /Applications/Blender.app/Contents/MacOS/Blender --python planet_studio.py

The scene is intentionally self-contained: no downloaded textures or addons.
"""

import bpy
import math
from mathutils import Vector


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)


def material(name, base, metallic=0.0, roughness=0.5, emission=None):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*base, 1)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*base, 1)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if emission:
        bsdf.inputs["Emission Color"].default_value = (*emission, 1)
        bsdf.inputs["Emission Strength"].default_value = 0.06
    return mat


def build_planet():
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=6, radius=3.0)
    planet = bpy.context.object
    planet.name = "Aurelia_Surface"
    planet.data.materials.append(material("Aurelia mineral", (0.055, 0.11, 0.16), roughness=0.72))

    displace = planet.modifiers.new("Continental relief", "DISPLACE")
    tex = bpy.data.textures.new("Ancient continental shelves", type="MUSGRAVE")
    tex.noise_scale = 0.62
    tex.noise_intensity = 0.76
    displace.texture = tex
    displace.strength = 0.16
    displace.texture_coords = "GLOBAL"

    bpy.ops.mesh.primitive_uv_sphere_add(segments=192, ring_count=128, radius=3.12)
    atmosphere = bpy.context.object
    atmosphere.name = "Aurelia_Atmosphere"
    atmosphere.data.materials.append(material("Atmospheric scatter", (0.015, 0.16, 0.32), roughness=0.18, emission=(0.01, 0.09, 0.22)))

    bpy.ops.mesh.primitive_torus_add(major_radius=4.7, minor_radius=0.065, major_segments=256, minor_segments=12)
    ring = bpy.context.object
    ring.name = "Aurelia_Ring"
    ring.scale.y = 0.36
    ring.rotation_euler = (math.radians(12), math.radians(-8), math.radians(18))
    ring.data.materials.append(material("Ice ring", (0.36, 0.46, 0.55), metallic=0.12, roughness=0.38, emission=(0.08, 0.13, 0.19)))
    return planet


def setup_stage(target):
    bpy.ops.object.light_add(type="AREA", location=(-7.0, -4.0, 5.5))
    key = bpy.context.object
    key.name = "Distant_Star_Key"
    key.data.energy = 1700
    key.data.shape = "DISK"
    key.data.size = 4.0
    key.data.color = (1.0, 0.58, 0.28)

    bpy.ops.object.light_add(type="AREA", location=(5.0, 2.0, -1.5))
    rim = bpy.context.object
    rim.name = "Blue_Rim"
    rim.data.energy = 1150
    rim.data.size = 3.0
    rim.data.color = (0.12, 0.32, 1.0)

    bpy.ops.object.camera_add(location=(8.7, -10.8, 5.4))
    camera = bpy.context.object
    camera.name = "Anamorphic_Camera"
    camera.data.lens = 72
    direction = Vector(target.location) - camera.location
    camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    bpy.context.scene.camera = camera

    world = bpy.context.scene.world
    world.color = (0.001, 0.002, 0.006)
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.render.resolution_x = 2560
    scene.render.resolution_y = 1440
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = "//aurelia_planet.png"
    scene.render.film_transparent = False
    scene.view_settings.look = "AgX - Medium High Contrast"


clear_scene()
planet = build_planet()
setup_stage(planet)
bpy.ops.wm.save_as_mainfile(filepath="//aurelia_planet.blend")
bpy.ops.render.render(write_still=True)
