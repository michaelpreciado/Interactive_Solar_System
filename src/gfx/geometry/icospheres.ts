/**
 * Shared sphere geometry pool.
 *
 * Icospheres rather than UV spheres: uniform triangle area, no pole pinch, and
 * no wasted vertices crowded at the poles. Bodies sample a cube map by
 * direction, so no UVs are needed at all.
 *
 * All bodies of a given detail level share one `BufferGeometry` instance, so an
 * LOD swap is a reference assignment -- no upload, no allocation, no GC.
 */

import { IcosahedronGeometry } from 'three';

const pool = new Map<number, IcosahedronGeometry>();

/** Triangle counts: detail 3 -> 1280, 4 -> 5120, 5 -> 20480, 6 -> 81920. */
export function geometryForDetail(detail: number): IcosahedronGeometry {
  const d = Math.max(1, Math.min(6, Math.round(detail)));
  let g = pool.get(d);
  if (!g) {
    g = new IcosahedronGeometry(1, d);
    // The material derives normals from the baked height field, but three's
    // standard shader still wants a base normal attribute.
    g.computeVertexNormals();
    pool.set(d, g);
  }
  return g;
}

export function disposeGeometryPool(): void {
  for (const g of pool.values()) g.dispose();
  pool.clear();
}
