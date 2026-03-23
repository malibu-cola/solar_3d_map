import { initScene, buildSolarSystem, animate } from './scene.js';
import { initUI } from './ui.js';

async function main() {
  const { scene, camera, renderer, controls } = initScene();
  initUI();
  await buildSolarSystem(scene);
  animate(scene, camera, renderer, controls);
}

main();
