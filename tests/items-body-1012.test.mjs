// =========================================================
// アイテム38種の表示用画像（本体透過・2026-10-12）
//  ITB-01 assets/items/body_1012/01〜38.webp＝256×256・透過・四辺は透明。README に38行の対応表（番号・安定ID・正式名・元ファイル・sha256）。
//         原本（PNG）は置かない。このブランチではゲームにつながない（index.html・js から参照しない）。正式名の 38＝ラグナスの闘魂（旧名は使わない）
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = 'assets/items/body_1012';
/** WebP（VP8X）の幅・高さ・透過の印 */
function webpInfo(p) {
  const b = readFileSync(path.join(ROOT, p));
  assert.equal(b.toString('ascii', 0, 4), 'RIFF'); assert.equal(b.toString('ascii', 8, 12), 'WEBP');
  assert.equal(b.toString('ascii', 12, 16), 'VP8X', `${p}：透過つき（VP8X）`);
  return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3), alpha: !!(b[20] & 0x10) };
}
const NAMES = ['ジャガイモ', 'あまい果実', '新鮮な魚', '振り直しダイス', '忍びの香', '採集かご', '骨付き肉', 'ダブルダイス', '満腹のお守り', '守護の護符', '栄養スープ', '小刻みダイス', '追い風の砂', 'そよ風の砂', '勝利の小袋', '幸運のしおり', '成長の雫', 'ベルナの特製弁当', '猛攻の護符', '幸運の羽根', '幸運の鍵', 'エネルギーチャージ', '幸運のダイス', '分岐の羅針盤', '清めの護符', '目利きのルーペ', '挑戦者の証', '幻獣の鈴', '大成功の紋章', '努力の腕輪', '奇跡のペンダント', '先制の角笛', '運命のダイス', 'フィナの導き', 'ダンの鍛錬章', 'アストラッドの星盤', 'レオナの風羽', 'ラグナスの闘魂'];

test('ITB-01：アイテム38種の表示用画像（256×256・透過）・README の対応表・原本を置かない・まだゲームにつながない', () => {
  const files = readdirSync(path.join(ROOT, DIR)).sort();
  const nos = NAMES.map((_, i) => String(i + 1).padStart(2, '0'));
  assert.deepEqual(files, ['README.md', ...nos.map((n) => n + '.webp')].sort(), '38枚と README だけ（PNG の原本は置かない）');
  for (const n of nos) assert.deepEqual(webpInfo(`${DIR}/${n}.webp`), { w: 256, h: 256, alpha: true }, n);
  const rm = readFileSync(path.join(ROOT, DIR, 'README.md'), 'utf8');
  NAMES.forEach((name, i) => {
    const n = nos[i];
    assert.match(rm, new RegExp(`\\| ${n} \\| [a-z_]+ \\| ${name} \\| [^|]+ \\| [^|]+ \\| body_1012/${n}\\.webp \\| ${n}_${name}\\.png \\| [0-9a-f]{64} \\|`), `対応表 ${n} ${name}`);
  });
  assert.equal((rm.match(/\| P2の6種 \|/g) || []).length, 6, 'P2 の6種＝01・02・03・07・11・22');
  for (const n of ['01', '02', '03', '07', '11', '22']) assert.match(rm, new RegExp(`\\| ${n} \\|[^\\n]*\\| P2の6種 \\|`));
  assert.doesNotMatch(rm, /バルドの竜鱗|ラグナスの竜鱗/, '旧名は使わない');
  // このブランチではゲームにつながない（P2 の承認のあとにつなぐ）
  const html = readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.ok(!html.includes('body_1012'), 'index.html から参照しない');
  const js = (d) => readdirSync(path.join(ROOT, d), { withFileTypes: true }).flatMap((e) => e.isDirectory() ? js(path.join(d, e.name)) : e.name.endsWith('.js') ? [path.join(d, e.name)] : []);
  for (const f of js('js')) assert.ok(!readFileSync(path.join(ROOT, f), 'utf8').includes('body_1012'), `${f} から参照しない`);
});
