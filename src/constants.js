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

// 天体の色と表示サイズ
export const BODY_CONFIG = {
  Sun:     { color: 0xffdd44, radius: 2.0, emissive: true },
  Mercury: { color: 0xaaaaaa, radius: 0.4 },
  Venus:   { color: 0xffcc66, radius: 0.6 },
  Earth:   { color: 0x4488ff, radius: 0.65 },
  Mars:    { color: 0xff4422, radius: 0.5 },
  Jupiter: { color: 0xddaa66, radius: 1.4 },
  Saturn:  { color: 0xddcc88, radius: 1.2 },
  Uranus:  { color: 0x88ccdd, radius: 0.9 },
  Neptune: { color: 0x4466ff, radius: 0.85 },
};

// 彗星の色
export const COMET_COLOR = 0x66ffcc;

// 軌道線の色
export const ORBIT_COLOR = 0x335577;
