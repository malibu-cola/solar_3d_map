/**
 * 天体の表示設定定数
 */

// 距離スケール: AUからシーン座標への変換
// 内惑星(< 2AU)は拡大、外惑星は圧縮して視認性を確保
// 注: 各軸独立ではなく、距離(radius)にスケールを適用して方向を保持する

/**
 * スカラー距離(AU)をシーン距離に変換する
 */
function scaleRadius(r) {
  if (r < 2) {
    return r * 8;
  }
  return 16 + Math.log2(r / 2) * 12;
}

/**
 * XYZ座標(AU)をシーン座標に変換する
 * 距離に対してスケールを適用し、方向ベクトルは保持する
 */
export function auToSceneVec(x, y, z) {
  const r = Math.sqrt(x * x + y * y + z * z);
  if (r < 1e-10) return { sx: 0, sy: 0, sz: 0 };
  const scaled = scaleRadius(r);
  const factor = scaled / r;
  return {
    sx: x * factor,
    sy: z * factor,  // ecliptic Z -> scene Y (up)
    sz: y * factor,  // ecliptic Y -> scene Z (depth)
  };
}

// 天体の色と表示サイズ（実際の天体の見た目に近い色）
export const BODY_CONFIG = {
  Sun:     { color: 0xfff5e0, radius: 2.0, emissive: true },
  Mercury: { color: 0x8c7e6d, radius: 0.4 },   // 灰褐色（岩石表面）
  Venus:   { color: 0xe8cda0, radius: 0.6 },    // 淡黄色（硫酸雲）
  Earth:   { color: 0x2f6a9f, radius: 0.65 },   // 青（海洋）
  Mars:    { color: 0xc1440e, radius: 0.5 },     // 赤褐色（酸化鉄）
  Jupiter: { color: 0xc8a87a, radius: 1.4 },     // 黄褐色（縞模様の平均）
  Saturn:  { color: 0xe0c98a, radius: 1.2 },     // 淡い金色
  Uranus:  { color: 0x7ec8c8, radius: 0.9 },     // 淡いシアン（メタン大気）
  Neptune: { color: 0x3f54ba, radius: 0.85 },    // 濃い青（メタン大気）
};

// 彗星の色
export const COMET_COLOR = 0x88ffdd;

// 軌道線の色（白寄りにして視認性向上）
export const ORBIT_COLOR = 0x8899aa;
