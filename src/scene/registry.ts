/**
 * The body registry.
 *
 * React mounts the scene graph once and hands each body's `Object3D`s here.
 * From then on the driver mutates them directly, and React is out of the loop
 * entirely. Nothing in this module imports React, by design.
 */

import type { Group, Mesh, Object3D } from 'three';
import type { BodyMaterial } from '../gfx/materials/BodyMaterial';
import type { AtmosphereMaterial } from '../gfx/materials/AtmosphereMaterial';
import type { StarMaterial } from '../gfx/materials/StarMaterial';

export interface BodyHandles {
  id: string;
  /** Positioned at the body's scene-space location. */
  group: Group;
  /** Carries the axial tilt and the spin. Child of `group`. */
  spinGroup: Object3D;
  mesh?: Mesh;
  material?: BodyMaterial | StarMaterial;
  atmosphere?: Mesh;
  atmosphereMaterial?: AtmosphereMaterial;
  rings?: Object3D;
  clouds?: Mesh;
  /** Screen-space label element, positioned imperatively by the driver. */
  label?: HTMLElement;
  /** Set false when the body is culled; the driver skips its work. */
  active: boolean;
  /** Projected screen radius in pixels, updated each frame. */
  screenRadius: number;
}

const handles = new Map<string, BodyHandles>();

export function registerBody(h: BodyHandles): () => void {
  handles.set(h.id, h);
  return () => {
    handles.delete(h.id);
  };
}

export function getBody(id: string): BodyHandles | undefined {
  return handles.get(id);
}

export function allBodies(): IterableIterator<BodyHandles> {
  return handles.values();
}

export function bodyCount(): number {
  return handles.size;
}

export function clearRegistry(): void {
  handles.clear();
}
