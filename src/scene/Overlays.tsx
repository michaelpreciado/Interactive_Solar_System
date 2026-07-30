/**
 * Sci-viz overlays.
 *
 * The asteroid belt, the habitable zone and the ecliptic grid. All three are
 * static geometry rebased against the floating origin, so they cost one
 * transform write per frame regardless of how many instances they contain.
 */

import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  IcosahedronGeometry,
  InstancedBufferAttribute,
  InstancedMesh,
  LineBasicMaterial,
  LineLoop,
  Mesh,
  RingGeometry,
  ShaderMaterial,
  Vector3,
} from 'three';

import { compressDistance } from '../data/bodies';
import { AU, DEG2RAD, J2000, TAU } from '../sim/constants';
import { simClock } from '../sim/SimClock';
import { floatingOrigin } from '../sim/floatingOrigin';
import { quality } from '../perf/QualityManager';
import { uiState } from '../state/uiStore';
import { getOrbitMorph } from './orbitMorph';

export function Overlays() {
  const root = useRef<Group>(null);

  return (
    <group ref={root}>
      <AsteroidBelt />
      <HabitableZone />
      <EclipticGrid />
    </group>
  );
}

// ---------------------------------------------------------------- asteroids

/**
 * The main belt as a single `InstancedMesh` with the Kepler solve done in the
 * vertex shader.
 *
 * Per-instance orbital elements are uploaded once; the CPU never touches an
 * instance matrix again. That is the only way to animate thousands of bodies
 * without the transform update dominating the frame.
 */
const BELT_VERTEX = /* glsl */ `
attribute vec4 orbitA;   // a (AU), e, inclination, longitude of ascending node
attribute vec3 orbitB;   // argument of perihelion, mean anomaly at epoch, size
attribute float tint;

uniform float uDays;      // days since J2000
uniform float uMorph;     // 0 = compressed layout, 1 = true scale
uniform vec3 uOrigin;     // floating-origin offset, scene units
uniform float uAU;
uniform float uCompressA; // compressDistance() constants, mirrored from TS
uniform float uCompressB;
uniform float uCompressP;

varying float vTint;
varying vec3 vNormalW;

void main() {
  float a = orbitA.x;
  float e = orbitA.y;
  float inc = orbitA.z;
  float node = orbitA.w;
  float peri = orbitB.x;
  float m0 = orbitB.y;
  float size = orbitB.z;

  // Mean motion from Kepler's third law, in radians per day.
  float n = 0.01720209895 / (a * sqrt(a));
  float M = m0 + n * uDays;

  // Newton-Raphson. Three iterations is plenty at belt eccentricities (< 0.3)
  // and the loop bound has to be constant for the shader to compile.
  float E = M + e * sin(M);
  for (int i = 0; i < 3; i++) {
    E -= (E - e * sin(E) - M) / (1.0 - e * cos(E));
  }

  float xPeri = a * (cos(E) - e);
  float yPeri = a * sqrt(1.0 - e * e) * sin(E);

  float cw = cos(peri), sw = sin(peri);
  float co = cos(node), so = sin(node);
  float ci = cos(inc), si = sin(inc);

  float x1 = cw * xPeri - sw * yPeri;
  float y1 = sw * xPeri + cw * yPeri;

  vec3 ecl = vec3(co * x1 - so * ci * y1, so * x1 + co * ci * y1, si * y1);
  float r = length(ecl);

  // Match the scale morph the rest of the scene uses.
  float trueUnits = r * uAU;
  float compressed = uCompressA + uCompressB * pow(r, uCompressP);
  float target = mix(compressed, trueUnits, uMorph);
  vec3 scene = ecl * (target / max(r, 1e-6));

  // Ecliptic (x, y, z) -> scene (x, z, -y).
  vec3 centre = vec3(scene.x, scene.z, -scene.y) - uOrigin;

  vTint = tint;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * vec4(centre + position * size, 1.0);
}
`;

const BELT_FRAGMENT = /* glsl */ `
precision mediump float;
varying float vTint;
varying vec3 vNormalW;
uniform vec3 uSunDir;

void main() {
  // Cheap lambert against the Sun. At the sizes these render, anything more is
  // invisible.
  float lambert = max(dot(normalize(vNormalW), uSunDir), 0.0) * 0.85 + 0.15;
  vec3 base = mix(vec3(0.34, 0.30, 0.26), vec3(0.58, 0.52, 0.44), vTint);
  gl_FragColor = vec4(base * lambert, 1.0);
}
`;

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function AsteroidBelt() {
  const meshRef = useRef<InstancedMesh>(null);

  const { geometry, material, count } = useMemo(() => {
    const n = quality.settings.asteroidCount;
    const geo = new IcosahedronGeometry(1, 0);

    const orbitA = new Float32Array(n * 4);
    const orbitB = new Float32Array(n * 3);
    const tint = new Float32Array(n);
    const rand = mulberry32(0xbe17);

    for (let i = 0; i < n; i++) {
      // The main belt runs 2.1-3.3 AU. Kirkwood gaps at the 3:1, 5:2 and 2:1
      // resonances with Jupiter are real structure, so they are carved out
      // rather than left as uniform noise.
      let a = 2.1 + rand() * 1.2;
      for (const gap of [2.5, 2.82, 3.27]) {
        if (Math.abs(a - gap) < 0.035) a += (a > gap ? 1 : -1) * 0.09;
      }

      orbitA[i * 4] = a;
      orbitA[i * 4 + 1] = rand() * 0.22;
      orbitA[i * 4 + 2] = (rand() - 0.5) * 20 * DEG2RAD;
      orbitA[i * 4 + 3] = rand() * TAU;
      orbitB[i * 3] = rand() * TAU;
      orbitB[i * 3 + 1] = rand() * TAU;
      // Size in scene units. Wildly exaggerated: a real belt asteroid is
      // sub-pixel from anywhere you would want to stand.
      orbitB[i * 3 + 2] = 0.06 + rand() * 0.16;
      tint[i] = rand();
    }

    geo.setAttribute('orbitA', new InstancedBufferAttribute(orbitA, 4));
    geo.setAttribute('orbitB', new InstancedBufferAttribute(orbitB, 3));
    geo.setAttribute('tint', new InstancedBufferAttribute(tint, 1));

    const mat = new ShaderMaterial({
      vertexShader: BELT_VERTEX,
      fragmentShader: BELT_FRAGMENT,
      uniforms: {
        uDays: { value: 0 },
        uMorph: { value: 0 },
        uOrigin: { value: new Vector3() },
        uAU: { value: AU },
        uCompressA: { value: compressDistance(0) },
        uCompressB: { value: compressDistance(1) - compressDistance(0) },
        uCompressP: { value: 0.55 },
        uSunDir: { value: new Vector3(1, 0, 0) },
      },
    });

    return { geometry: geo, material: mat, count: n };
  }, []);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material]
  );

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const visible = uiState().overlays.asteroids && count > 0;
    mesh.visible = visible;
    if (!visible) return;

    const u = material.uniforms;
    u.uDays.value = simClock.jd - J2000;
    u.uMorph.value = getOrbitMorph();
    (u.uOrigin.value as Vector3).set(
      floatingOrigin.origin[0],
      floatingOrigin.origin[1],
      floatingOrigin.origin[2]
    );
    // The Sun is at absolute zero, so its direction from the belt is simply
    // away from the origin.
    (u.uSunDir.value as Vector3)
      .set(-floatingOrigin.origin[0], -floatingOrigin.origin[1], -floatingOrigin.origin[2])
      .normalize();
  }, -1);

  if (count === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      // Instance positions are computed in the vertex shader, so three's
      // bounding-sphere test against the base geometry is meaningless.
      frustumCulled={false}
    />
  );
}

// ----------------------------------------------------------- habitable zone

/**
 * The conservative habitable zone, 0.95-1.37 AU for a G2V star.
 * Drawn as a translucent annulus in the ecliptic plane.
 */
function HabitableZone() {
  const ref = useRef<Mesh>(null);

  const { geometry, material } = useMemo(() => {
    const geo = new RingGeometry(1, 1.44, 128, 1);
    geo.rotateX(-Math.PI / 2);
    const mat = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
      blending: AdditiveBlending,
      uniforms: { uOpacity: { value: 0.06 } },
      vertexShader: /* glsl */ `
        varying vec2 vLocal;
        void main() {
          vLocal = position.xz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        precision mediump float;
        varying vec2 vLocal;
        uniform float uOpacity;
        void main() {
          // Fade at both edges so the band has no hard boundary -- the real
          // limits are fuzzy and drawing them as crisp rings overstates them.
          float r = length(vLocal);
          float a = smoothstep(1.0, 1.08, r) * (1.0 - smoothstep(1.34, 1.44, r));
          gl_FragColor = vec4(vec3(0.35, 0.95, 0.55) * a, a * uOpacity);
        }
      `,
    });
    return { geometry: geo, material: mat };
  }, []);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material]
  );

  useFrame(() => {
    const mesh = ref.current;
    if (!mesh) return;
    mesh.visible = uiState().overlays.habitableZone;
    if (!mesh.visible) return;

    // The geometry's inner radius is 1, so scaling by the layout distance of
    // the zone's inner edge (0.95 AU) puts both edges in the right place.
    const morph = getOrbitMorph();
    const innerAU = 0.95;
    mesh.scale.setScalar(lerp(compressDistance(innerAU), innerAU * AU, morph));
    mesh.position.set(
      -floatingOrigin.origin[0],
      -floatingOrigin.origin[1],
      -floatingOrigin.origin[2]
    );
  }, -1);

  return <mesh ref={ref} geometry={geometry} material={material} frustumCulled={false} />;
}

// ----------------------------------------------------------- ecliptic grid

/** Concentric AU rings plus radial spokes, to make the plane legible. */
function EclipticGrid() {
  const ref = useRef<Group>(null);

  const lines = useMemo(() => {
    const out: LineLoop[] = [];
    const material = new LineBasicMaterial({
      color: new Color('#4b6a9b'),
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      toneMapped: false,
    });

    for (const au of [0.5, 1, 2, 5, 10, 20, 30, 40]) {
      const points: number[] = [];
      for (let i = 0; i < 128; i++) {
        const t = (i / 128) * TAU;
        points.push(Math.cos(t), 0, Math.sin(t));
      }
      const geo = new BufferGeometry();
      geo.setAttribute('position', new Float32BufferAttribute(points, 3));
      const loop = new LineLoop(geo, material);
      loop.frustumCulled = false;
      loop.userData.au = au;
      out.push(loop);
    }
    return out;
  }, []);

  useEffect(() => {
    const group = ref.current;
    if (!group) return;
    for (const l of lines) group.add(l);
    return () => {
      for (const l of lines) {
        group.remove(l);
        l.geometry.dispose();
      }
      (lines[0]?.material as LineBasicMaterial | undefined)?.dispose();
    };
  }, [lines]);

  useFrame(() => {
    const group = ref.current;
    if (!group) return;
    group.visible = uiState().overlays.eclipticGrid;
    if (!group.visible) return;

    const morph = getOrbitMorph();
    group.position.set(
      -floatingOrigin.origin[0],
      -floatingOrigin.origin[1],
      -floatingOrigin.origin[2]
    );
    for (const l of lines) {
      const au = l.userData.au as number;
      l.scale.setScalar(lerp(compressDistance(au), au * AU, morph));
    }
  }, -1);

  return <group ref={ref} />;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
