/**
 * 天体の表示設定定数
 */

// 距離スケール: AUからシーン座標への変換
// 内惑星(< 2AU)は拡大、外惑星は圧縮して視認性を確保
export function auToScene(au) {
  const abs = Math.abs(au);
  if (abs < 2) {
    return au * 8; // 内惑星: 拡大
  }
  // 外惑星: 対数的に圧縮
  const sign = Math.sign(au) || 1;
  return sign * (16 + Math.log2(abs / 2) * 12);
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
