/**
 * The surface bakery.
 *
 * Renders each body's procedural surface into cube maps, once, at load. This is
 * the central performance decision of the whole renderer: a convincing surface
 * is six-plus octaves of warped 3D noise, roughly 400 ALU per fragment. Running
 * that per frame is fine on a desktop GPU and a hard failure on a phone.
 * Running it once and sampling the result costs two texture fetches.
 *
 * Cube maps rather than equirectangular: no pole pinch, uniform texel density,
 * and no wrap seam where screen-space derivatives explode into a bright line
 * down the middle of the planet.
 *
 * Two passes per body rather than MRT, because `WebGLCubeRenderTarget` has no
 * multiple-render-target support. Bakes are one-time, so the doubled cost is
 * paid once and buys a much simpler pipeline.
 */

import {
  BufferGeometry,
  ClampToEdgeWrapping,
  Float32BufferAttribute,
  GLSL3,
  LinearFilter,
  LinearMipmapLinearFilter,
  Matrix3,
  Mesh,
  NoColorSpace,
  OrthographicCamera,
  RawShaderMaterial,
  RGBAFormat,
  Scene,
  SRGBColorSpace,
  Texture,
  UnsignedByteType,
  Vector4,
  WebGLCubeRenderTarget,
  type WebGLRenderer,
} from 'three';

import { BODY_BY_ID, type BodyDef } from '../../data/bodies';
import { NOISE_BUNDLE } from '../shaders/lib/noise.glsl.ts';
import { BAKE_FRAGMENT, BAKE_VERTEX } from '../shaders/surface/uber.glsl.ts';
import { rampFor } from './palette';
import { recipeFor } from './recipes';

export interface BakedSurface {
  /** rgb = albedo, a = specular/ocean mask. */
  albedo: Texture;
  /** r = height, g = roughness, b = emissive, a = cloud alpha. */
  surface: Texture;
  size: number;
  dispose(): void;
}

/**
 * Cube face bases.
 *
 * Maps a fullscreen-triangle NDC coordinate (u, v) to the object-space
 * direction WebGL will sample for that texel.
 *
 * These are derived from three's own `CubeCamera` orientations rather than
 * from the raw cube-map spec, because that is what `setRenderTarget(rt, face)`
 * is built to match. Getting a sign wrong here does not produce an obvious
 * failure -- it mirrors one axis per face, and the only symptom is hard
 * straight-edged discontinuities where faces meet. That artifact reads as
 * "some weird polygon in the sky" rather than as a texture bug.
 */
const FACE_BASES: Matrix3[] = [
  new Matrix3().set(0, 0, 1, 0, 1, 0, 1, 0, 0), // +X -> ( 1,  v,  u)
  new Matrix3().set(0, 0, -1, 0, 1, 0, -1, 0, 0), // -X -> (-1,  v, -u)
  new Matrix3().set(-1, 0, 0, 0, 0, 1, 0, -1, 0), // +Y -> (-u,  1, -v)
  new Matrix3().set(-1, 0, 0, 0, 0, -1, 0, 1, 0), // -Y -> (-u, -1,  v)
  new Matrix3().set(-1, 0, 0, 0, 1, 0, 0, 0, 1), // +Z -> (-u,  v,  1)
  new Matrix3().set(1, 0, 0, 0, 1, 0, 0, 0, -1), // -Z -> ( u,  v, -1)
];

const OUTPUT_ALBEDO = 0;
const OUTPUT_SURFACE = 1;

/** Assemble one archetype's bake program. */
function buildFragment(define: string): string {
  // No `#version` directive here: `glslVersion: GLSL3` makes three prepend one,
  // and a second occurrence is a compile error rather than a no-op.
  return [
    `#define ${define}`,
    'precision highp float;',
    '#define texture2D texture',
    NOISE_BUNDLE,
    BAKE_FRAGMENT,
  ].join('\n');
}

let quad: Mesh | null = null;
let quadScene: Scene | null = null;
let quadCamera: OrthographicCamera | null = null;

function ensureQuad(): {
  scene: Scene;
  camera: OrthographicCamera;
  mesh: Mesh;
} {
  if (!quad || !quadScene || !quadCamera) {
    const g = new BufferGeometry();
    // A single oversized triangle: fewer vertices than a quad and no diagonal
    // seam where interpolation precision differs across the two halves.
    g.setAttribute(
      'position',
      new Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3)
    );
    g.setAttribute('uv', new Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
    quad = new Mesh(g);
    quad.frustumCulled = false;
    quadScene = new Scene();
    quadScene.add(quad);
    quadCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }
  return { scene: quadScene, camera: quadCamera, mesh: quad };
}

const materialCache = new Map<string, RawShaderMaterial>();

function materialFor(define: string): RawShaderMaterial {
  let m = materialCache.get(define);
  if (!m) {
    m = new RawShaderMaterial({
      glslVersion: GLSL3,
      vertexShader: BAKE_VERTEX,
      fragmentShader: buildFragment(define),
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uPalette: { value: null },
        uFaceBasis: { value: new Matrix3() },
        uSeed: { value: 0 },
        uTime: { value: 0 },
        uOutput: { value: 0 },
        uRoughBase: { value: 0.85 },
        uBandCount: { value: 9 },
        uBandContrast: { value: 0.5 },
        uWarpAmount: { value: 0.5 },
        uCraterDensity: { value: 0.5 },
        uIceExtent: { value: 0 },
        uContinentLevel: { value: 0.52 },
        uSpotA: { value: new Vector4() },
        uSpotB: { value: new Vector4() },
        uSpotSwirl: { value: 0 },
      },
    });
    materialCache.set(define, m);
  }
  return m;
}

function makeCubeTarget(size: number, srgb: boolean): WebGLCubeRenderTarget {
  const rt = new WebGLCubeRenderTarget(size, {
    format: RGBAFormat,
    type: UnsignedByteType,
    generateMipmaps: true,
    minFilter: LinearMipmapLinearFilter,
    magFilter: LinearFilter,
    wrapS: ClampToEdgeWrapping,
    wrapT: ClampToEdgeWrapping,
  });
  // Albedo is authored colour and must round-trip through sRGB. Height,
  // roughness and masks are data and must not -- getting this backwards is the
  // classic cause of "the lighting looks wrong at grazing angles".
  rt.texture.colorSpace = srgb ? SRGBColorSpace : NoColorSpace;
  return rt;
}

/**
 * Bake one body. Synchronous; the scheduler is responsible for spreading calls
 * across frames so a single hitch never exceeds the frame budget.
 */
export function bakeBody(
  renderer: WebGLRenderer,
  body: BodyDef,
  size: number
): BakedSurface {
  const recipe = recipeFor(body.id, body.archetype);
  const { scene, camera, mesh } = ensureQuad();
  const material = materialFor(recipe.define);
  mesh.material = material;

  const u = material.uniforms;
  u.uPalette.value = rampFor(body.id, body.palette);
  u.uSeed.value = body.seed * 1.618;
  u.uRoughBase.value = recipe.roughBase;
  u.uBandCount.value = recipe.bandCount;
  u.uBandContrast.value = recipe.bandContrast;
  u.uWarpAmount.value = recipe.warpAmount;
  u.uCraterDensity.value = recipe.craterDensity;
  u.uIceExtent.value = recipe.iceExtent;
  u.uContinentLevel.value = recipe.continentLevel;
  (u.uSpotA.value as Vector4).fromArray(recipe.spotA);
  (u.uSpotB.value as Vector4).fromArray(recipe.spotB);
  u.uSpotSwirl.value = recipe.spotSwirl;

  const albedoRT = makeCubeTarget(size, true);
  const surfaceRT = makeCubeTarget(size, false);

  const prevTarget = renderer.getRenderTarget();
  const prevActiveCubeFace = renderer.getActiveCubeFace();
  const prevAutoClear = renderer.autoClear;
  renderer.autoClear = false;

  for (const [output, target] of [
    [OUTPUT_ALBEDO, albedoRT],
    [OUTPUT_SURFACE, surfaceRT],
  ] as const) {
    u.uOutput.value = output;
    for (let face = 0; face < 6; face++) {
      (u.uFaceBasis.value as Matrix3).copy(FACE_BASES[face]);
      renderer.setRenderTarget(target, face);
      renderer.render(scene, camera);
    }
  }

  renderer.autoClear = prevAutoClear;
  renderer.setRenderTarget(prevTarget, prevActiveCubeFace);

  return {
    albedo: albedoRT.texture,
    surface: surfaceRT.texture,
    size,
    dispose() {
      albedoRT.dispose();
      surfaceRT.dispose();
    },
  };
}

// --------------------------------------------------------------- placeholder

let placeholderAlbedo: Texture | null = null;
let placeholderSurface: Texture | null = null;

/**
 * A 1x1 cube map used until a real bake lands.
 *
 * This must never be null. Assigning `null` to a sampler uniform makes three
 * compile the program *without* that sampler, so the later swap to a real
 * texture silently does nothing and the planet renders flat forever.
 */
function makePlaceholder(
  rgba: [number, number, number, number],
  srgb: boolean
): Texture {
  const data = new Uint8Array(rgba);
  const faces: HTMLCanvasElement[] = [];
  for (let i = 0; i < 6; i++) {
    const c = document.createElement('canvas');
    c.width = 1;
    c.height = 1;
    const ctx = c.getContext('2d')!;
    const img = ctx.createImageData(1, 1);
    img.data.set(data);
    ctx.putImageData(img, 0, 0);
    faces.push(c);
  }
  const tex = new Texture();
  // A CubeTexture built from canvases; three accepts the image array directly.
  const cube = Object.assign(tex, { isCubeTexture: true, image: faces });
  cube.colorSpace = srgb ? SRGBColorSpace : NoColorSpace;
  cube.generateMipmaps = false;
  cube.minFilter = LinearFilter;
  cube.magFilter = LinearFilter;
  cube.needsUpdate = true;
  return cube;
}

export function getPlaceholders(): { albedo: Texture; surface: Texture } {
  if (!placeholderAlbedo)
    placeholderAlbedo = makePlaceholder([90, 90, 96, 255], true);
  if (!placeholderSurface)
    placeholderSurface = makePlaceholder([128, 220, 0, 0], false);
  return { albedo: placeholderAlbedo, surface: placeholderSurface };
}

// ----------------------------------------------------------------- scheduler

interface QueueEntry {
  id: string;
  size: number;
  priority: number;
}

/**
 * Time-sliced bake queue.
 *
 * Baking eleven bodies in one frame is a half-second stall on mobile. This
 * spends at most `budgetMs` per frame and stops mid-queue, so the loading
 * sequence stays responsive and the first bodies appear immediately.
 */
export class BakeScheduler {
  private queue: QueueEntry[] = [];
  private readonly results = new Map<string, BakedSurface>();
  /** Bodies whose bake threw. They keep their placeholder texture. */
  readonly failed = new Set<string>();
  private readonly listeners = new Set<
    (id: string, baked: BakedSurface | null) => void
  >();

  constructor(
    private readonly renderer: WebGLRenderer,
    public budgetMs = 8
  ) {}

  request(id: string, size: number, priority: number): void {
    if (this.results.has(id)) return;
    const existing = this.queue.find((q) => q.id === id);
    if (existing) {
      existing.priority = Math.min(existing.priority, priority);
      existing.size = Math.max(existing.size, size);
      return;
    }
    this.queue.push({ id, size, priority });
    this.queue.sort((a, b) => a.priority - b.priority);
  }

  get pending(): number {
    return this.queue.length;
  }

  get complete(): boolean {
    return this.queue.length === 0;
  }

  get(id: string): BakedSurface | undefined {
    return this.results.get(id);
  }

  /** `baked` is null when that body's bake failed. */
  onBaked(fn: (id: string, baked: BakedSurface | null) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /** Process as much of the queue as fits in the budget. */
  step(): void {
    if (this.queue.length === 0) return;
    const start = performance.now();
    do {
      const entry = this.queue.shift()!;
      const body = BODY_BY_ID[entry.id];
      if (!body) continue;

      try {
        const baked = bakeBody(this.renderer, body, entry.size);
        this.results.set(entry.id, baked);
        for (const fn of this.listeners) fn(entry.id, baked);
      } catch (error) {
        // A bake can fail on an unusual driver, on a lost context, or when the
        // GPU is out of memory. Letting it throw would escape the rAF pump and
        // stall the queue: progress would never reach 1 and the loading screen
        // would sit there forever with a spinner and no explanation. Far better
        // to lose one body's detail -- it keeps its placeholder texture -- and
        // let everything else through.
        console.error(
          `Surface bake failed for "${entry.id}"; using placeholder.`,
          error
        );
        this.failed.add(entry.id);
        for (const fn of this.listeners) fn(entry.id, null);
      }
    } while (
      this.queue.length > 0 &&
      performance.now() - start < this.budgetMs
    );
  }

  /** Drain the entire queue immediately. Used by tests and by the intro. */
  flush(): void {
    while (this.queue.length > 0) this.step();
  }

  dispose(): void {
    for (const r of this.results.values()) r.dispose();
    this.results.clear();
    this.queue.length = 0;
    this.listeners.clear();
  }
}

export function disposeBakeMaterials(): void {
  for (const m of materialCache.values()) m.dispose();
  materialCache.clear();
  if (quad) {
    quad.geometry.dispose();
    quad = null;
    quadScene = null;
    quadCamera = null;
  }
}
