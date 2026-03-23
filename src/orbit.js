/**
 * 軌道計算・描画ユーティリティ
 */

import * as THREE from 'three';
import * as Astronomy from 'astronomy-engine';
import { auToSceneVec } from './constants.js';

const BODY_MAP = {
  Mercury: Astronomy.Body.Mercury,
  Venus: Astronomy.Body.Venus,
  Earth: Astronomy.Body.Earth,
  Mars: Astronomy.Body.Mars,
  Jupiter: Astronomy.Body.Jupiter,
  Saturn: Astronomy.Body.Saturn,
  Uranus: Astronomy.Body.Uranus,
  Neptune: Astronomy.Body.Neptune,
};

const PERIODS = {
  Mercury: 88, Venus: 225, Earth: 365, Mars: 687,
  Jupiter: 4333, Saturn: 10759, Uranus: 30687, Neptune: 60190,
};

/** HelioVectorからシーン座標のVector3を返すヘルパー */
function helioToScene(vec) {
  const { sx, sy, sz } = auToSceneVec(vec.x, vec.y, vec.z);
  return new THREE.Vector3(sx, sy, sz);
}

/**
 * astronomy-engineで任意時刻の惑星位置(シーン座標)を返す
 */
export function getPlanetScenePosition(bodyNameEn, date) {
  const body = BODY_MAP[bodyNameEn];
  if (!body) return null;
  const astroTime = Astronomy.MakeTime(date);
  const vec = Astronomy.HelioVector(body, astroTime);
  return helioToScene(vec);
}

/**
 * astronomy-engineを使って惑星の軌道線を生成する
 */
export function createOrbitLine(bodyNameEn, color) {
  const body = BODY_MAP[bodyNameEn];
  if (!body) return null;

  const period = PERIODS[bodyNameEn] || 365;
  const steps = Math.min(360, Math.max(72, Math.round(period / 5)));

  const points = [];
  const startDate = new Date('2026-03-23T00:00:00Z');

  for (let i = 0; i <= steps; i++) {
    const date = new Date(startDate.getTime() + (i / steps) * period * 86400000);
    const astroTime = Astronomy.MakeTime(date);
    const vec = Astronomy.HelioVector(body, astroTime);
    points.push(helioToScene(vec));
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.6 });
  return new THREE.Line(geometry, material);
}

/**
 * 軌道要素からXYZ座標を計算する（彗星用）
 */
export function orbitalElementsToXYZ(elements, jd) {
  const { a, e, i, node, peri, M: M0, epoch } = elements;

  const n = (2 * Math.PI) / (365.25 * Math.pow(a, 1.5));
  const dt = jd - epoch;
  let M = ((M0 * Math.PI) / 180) + n * dt;
  M = M % (2 * Math.PI);

  let E = M;
  for (let iter = 0; iter < 30; iter++) {
    const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < 1e-12) break;
  }

  const cosV = (Math.cos(E) - e) / (1 - e * Math.cos(E));
  const sinV = (Math.sqrt(1 - e * e) * Math.sin(E)) / (1 - e * Math.cos(E));
  const v = Math.atan2(sinV, cosV);
  const r = a * (1 - e * Math.cos(E));

  const xOrb = r * Math.cos(v);
  const yOrb = r * Math.sin(v);

  const iRad = (i * Math.PI) / 180;
  const nodeRad = (node * Math.PI) / 180;
  const w = (peri * Math.PI) / 180;

  const x =
    xOrb * (Math.cos(w) * Math.cos(nodeRad) - Math.sin(w) * Math.sin(nodeRad) * Math.cos(iRad)) +
    yOrb * (-Math.sin(w) * Math.cos(nodeRad) - Math.cos(w) * Math.sin(nodeRad) * Math.cos(iRad));
  const y =
    xOrb * (Math.cos(w) * Math.sin(nodeRad) + Math.sin(w) * Math.cos(nodeRad) * Math.cos(iRad)) +
    yOrb * (-Math.sin(w) * Math.sin(nodeRad) + Math.cos(w) * Math.cos(nodeRad) * Math.cos(iRad));
  const z =
    xOrb * (Math.sin(w) * Math.sin(iRad)) +
    yOrb * (Math.cos(w) * Math.sin(iRad));

  return { x, y, z };
}

/** ecliptic XYZ(AU) からシーン座標Vector3を返す */
function eclipticToScene(pos) {
  const { sx, sy, sz } = auToSceneVec(pos.x, pos.y, pos.z);
  return new THREE.Vector3(sx, sy, sz);
}

/**
 * 任意時刻の彗星位置(シーン座標)を返す
 */
export function getCometScenePosition(elements, date) {
  const jd = dateToJD(date);
  const pos = orbitalElementsToXYZ(elements, jd);
  return eclipticToScene(pos);
}

/**
 * 彗星の軌道線と現在位置を生成する
 */
export function createCometOrbitLine(comet, color) {
  const { elements } = comet;
  const period = 365.25 * Math.pow(elements.a, 1.5);
  const steps = 360;
  const jdNow = dateToJD(new Date());

  const points = [];
  for (let s = 0; s <= steps; s++) {
    const jd = jdNow + (s / steps) * period;
    const pos = orbitalElementsToXYZ(elements, jd);
    points.push(eclipticToScene(pos));
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.3 });
  const line = new THREE.Line(geometry, material);

  const position = getCometScenePosition(elements, new Date());

  return { line, position };
}

function dateToJD(date) {
  return (date.getTime() / 86400000) + 2440587.5;
}
