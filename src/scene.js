import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { loadPlanets, loadComets } from './loader.js';
import { BODY_CONFIG, COMET_COLOR, ORBIT_COLOR, auToScene } from './constants.js';
import { createOrbitLine, createCometOrbitLine, getPlanetScenePosition, getCometScenePosition } from './orbit.js';
import { showInfoPanel } from './ui.js';

// 管理用配列: 各エントリは { mesh, label, ring?, config, bodyData } のオブジェクト
let planets = [];
let comets = [];
let orbitLines = [];
let cometOrbitLines = [];
let raycaster, mouse;
let camera, scene;

export function initScene() {
  const canvas = document.getElementById('solar-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000005);

  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.01,
    10000
  );
  camera.position.set(0, 40, 60);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 1;
  controls.maxDistance = 500;

  scene.add(new THREE.AmbientLight(0x222233));

  createStars(scene);

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
  canvas.addEventListener('click', onCanvasClick);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { scene, camera, renderer, controls };
}

function createStars(scene) {
  const starCount = 2000;
  const positions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const r = 500 + Math.random() * 1500;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({ color: 0xffffff, size: 0.8, sizeAttenuation: true });
  scene.add(new THREE.Points(geometry, material));
}

export async function buildSolarSystem(targetScene) {
  const [planetsData, cometsData] = await Promise.all([loadPlanets(), loadComets()]);

  // Build planets
  for (const body of planetsData.bodies) {
    const config = BODY_CONFIG[body.name_en] || { color: 0xffffff, radius: 0.5 };

    const geometry = new THREE.SphereGeometry(config.radius, 32, 32);
    let material;
    if (config.emissive) {
      material = new THREE.MeshBasicMaterial({ color: config.color });
    } else {
      material = new THREE.MeshStandardMaterial({ color: config.color, roughness: 0.7 });
    }
    const mesh = new THREE.Mesh(geometry, material);
    const sx = auToScene(body.x);
    const sy = auToScene(body.z);
    const sz = auToScene(body.y);
    mesh.position.set(sx, sy, sz);
    mesh.userData = { bodyData: body, type: 'planet' };
    targetScene.add(mesh);

    // Sun glow
    let sunLight = null;
    if (body.name_en === 'Sun') {
      sunLight = new THREE.PointLight(0xffffff, 2, 500);
      sunLight.position.copy(mesh.position);
      targetScene.add(sunLight);
    }

    // Saturn ring
    let ring = null;
    if (body.name_en === 'Saturn') {
      const ringGeo = new THREE.RingGeometry(config.radius * 1.4, config.radius * 2.2, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xccbb88, side: THREE.DoubleSide, transparent: true, opacity: 0.5,
      });
      ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2.5;
      ring.position.copy(mesh.position);
      targetScene.add(ring);
    }

    // Label
    const label = createLabel(body.name, config.color);
    label.position.set(sx, sy + config.radius + 0.8, sz);
    targetScene.add(label);

    // Orbit line (skip Sun)
    if (body.name_en !== 'Sun') {
      const line = createOrbitLine(body.name_en, ORBIT_COLOR);
      if (line) {
        targetScene.add(line);
        orbitLines.push(line);
      }
    }

    planets.push({ mesh, label, ring, sunLight, config, bodyData: body });
  }

  // Build comets
  for (const comet of cometsData.comets) {
    const { line, position } = createCometOrbitLine(comet, COMET_COLOR);
    if (line) {
      targetScene.add(line);
      cometOrbitLines.push(line);
    }

    if (position) {
      const geometry = new THREE.SphereGeometry(0.3, 16, 16);
      const material = new THREE.MeshBasicMaterial({ color: COMET_COLOR });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(position);
      mesh.userData = { bodyData: comet, type: 'comet' };
      targetScene.add(mesh);

      const label = createLabel(comet.name, COMET_COLOR);
      label.position.set(position.x, position.y + 1, position.z);
      targetScene.add(label);

      comets.push({ mesh, label, bodyData: comet });
    }
  }
}

/**
 * 時間スライダー変更時に全天体の位置を更新する
 */
export function updatePositions(date) {
  for (const p of planets) {
    const name = p.bodyData.name_en;
    if (name === 'Sun') continue;

    const pos = getPlanetScenePosition(name, date);
    if (!pos) continue;

    p.mesh.position.copy(pos);
    p.label.position.set(pos.x, pos.y + p.config.radius + 0.8, pos.z);
    if (p.ring) p.ring.position.copy(pos);
  }

  for (const c of comets) {
    const pos = getCometScenePosition(c.bodyData.elements, date);
    if (!pos) continue;

    c.mesh.position.copy(pos);
    c.label.position.set(pos.x, pos.y + 1, pos.z);
  }
}

function createLabel(text, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.font = '28px sans-serif';
  ctx.fillStyle = '#' + new THREE.Color(color).getHexString();
  ctx.textAlign = 'center';
  ctx.fillText(text, 128, 40);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(4, 1, 1);
  return sprite;
}

function onCanvasClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const targets = [
    ...planets.map(p => p.mesh),
    ...comets.map(c => c.mesh),
  ];
  const intersects = raycaster.intersectObjects(targets);

  if (intersects.length > 0) {
    const data = intersects[0].object.userData.bodyData;
    const info = {};
    if (data.name_en) info['名前'] = `${data.name} (${data.name_en})`;
    if (data.x !== undefined) {
      info['X'] = `${data.x.toFixed(4)} AU`;
      info['Y'] = `${data.y.toFixed(4)} AU`;
      info['Z'] = `${data.z.toFixed(4)} AU`;
    }
    if (data.elements) {
      info['軌道長半径'] = `${data.elements.a.toFixed(3)} AU`;
      info['離心率'] = data.elements.e.toFixed(4);
      info['軌道傾斜角'] = `${data.elements.i.toFixed(2)}°`;
    }
    showInfoPanel(data.name, info);
  }
}

// Visibility toggles
export function setOrbitsVisible(visible) {
  orbitLines.forEach(l => l.visible = visible);
  cometOrbitLines.forEach(l => l.visible = visible);
}

export function setLabelsVisible(visible) {
  planets.forEach(p => p.label.visible = visible);
  comets.forEach(c => c.label.visible = visible);
}

export function setCometsVisible(visible) {
  comets.forEach(c => {
    c.mesh.visible = visible;
    c.label.visible = visible;
  });
  cometOrbitLines.forEach(l => l.visible = visible);
}

export function animate(scene, camera, renderer, controls) {
  function loop() {
    requestAnimationFrame(loop);
    controls.update();
    renderer.render(scene, camera);
  }
  loop();
}
