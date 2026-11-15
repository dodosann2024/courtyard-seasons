/* Desert Tripo GLB loader — self-hosted three + GLTFLoader + SkeletonUtils (no CDN). */
import * as THREE from './three.module.min.js';
import { GLTFLoader } from './GLTFLoader.js';
import { clone as cloneSkinned } from './SkeletonUtils.js';

const loader = new GLTFLoader();

/** @returns {Promise<{scene: THREE.Object3D, animations: THREE.AnimationClip[], gltf: object}>} */
export function loadGLB(url) {
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => resolve({ scene: gltf.scene || gltf.scenes?.[0], animations: gltf.animations || [], gltf }),
      undefined,
      reject
    );
  });
}

export function makeMixer(root) {
  return new THREE.AnimationMixer(root);
}

export { THREE, GLTFLoader, cloneSkinned };
export const LoopRepeat = THREE.LoopRepeat;
export const LoopOnce = THREE.LoopOnce;
