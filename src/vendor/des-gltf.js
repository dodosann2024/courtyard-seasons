/* Desert Tripo GLB loader — self-hosted three + GLTFLoader (no CDN). */
import * as THREE from './three.module.min.js';
import { GLTFLoader } from './GLTFLoader.js';

const loader = new GLTFLoader();

/** @returns {Promise<{scene: THREE.Object3D, animations: THREE.AnimationClip[]}>} */
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

export { THREE, GLTFLoader };
