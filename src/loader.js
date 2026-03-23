/**
 * データ読み込みモジュール
 * data/ 配下のJSONファイルを fetch で取得する
 */

export async function loadPlanets() {
  const resp = await fetch('./planets.json');
  return resp.json();
}

export async function loadComets() {
  const resp = await fetch('./comets.json');
  return resp.json();
}
