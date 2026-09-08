# Planet Studio for Blender on macOS

This starter builds **Aurelia**, a procedural ocean world with continental relief,
an atmospheric shell, an ice ring, cinematic complementary lighting, and a
pre-composed 16:9 camera. It requires Blender 4.x and no addons.

```bash
cd tools/blender
/Applications/Blender.app/Contents/MacOS/Blender --python planet_studio.py
```

The script opens Blender, generates `aurelia_planet.blend`, and renders
`aurelia_planet.png` beside the script. From there, use the Shader Editor to
replace the procedural mineral material with authored textures, or change the
world palette and rerun the script to create variants.
