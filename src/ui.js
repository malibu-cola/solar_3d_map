/**
 * UI制御モジュール
 * 時間スライダー、表示切替、情報パネルの管理
 */

import { setOrbitsVisible, setLabelsVisible, setCometsVisible, updatePositions } from './scene.js';

const BASE_DATE = new Date('2026-03-23T00:00:00Z');

export function initUI() {
  const slider = document.getElementById('time-slider');
  const infoPanel = document.getElementById('info-panel');
  const infoClose = document.getElementById('info-close');

  updateTimeLabel(0);

  slider.addEventListener('input', (e) => {
    const offsetDays = parseInt(e.target.value, 10);
    updateTimeLabel(offsetDays);

    // 天体位置を更新
    const targetDate = new Date(BASE_DATE.getTime() + offsetDays * 86400000);
    updatePositions(targetDate);
  });

  infoClose.addEventListener('click', () => {
    infoPanel.classList.add('hidden');
  });

  // 表示切替
  document.getElementById('show-orbits').addEventListener('change', (e) => {
    setOrbitsVisible(e.target.checked);
  });
  document.getElementById('show-labels').addEventListener('change', (e) => {
    setLabelsVisible(e.target.checked);
  });
  document.getElementById('show-comets').addEventListener('change', (e) => {
    setCometsVisible(e.target.checked);
  });
}

function updateTimeLabel(offsetDays) {
  const label = document.getElementById('time-label');
  const date = new Date(BASE_DATE.getTime() + offsetDays * 86400000);
  label.textContent = date.toLocaleDateString('ja-JP');

  // 今日からのオフセットも表示
  if (offsetDays === 0) {
    label.textContent += ' (データ取得日)';
  } else {
    const sign = offsetDays > 0 ? '+' : '';
    label.textContent += ` (${sign}${offsetDays}日)`;
  }
}

/**
 * 情報パネルに天体情報を表示する
 */
export function showInfoPanel(name, data) {
  const panel = document.getElementById('info-panel');
  const nameEl = document.getElementById('info-name');
  const bodyEl = document.getElementById('info-body');

  nameEl.textContent = name;
  bodyEl.innerHTML = Object.entries(data)
    .map(([key, value]) => `<div><strong>${key}:</strong> ${value}</div>`)
    .join('');

  panel.classList.remove('hidden');
}
