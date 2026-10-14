// =========================================================
// Chapter 1 の画像演出（2026-10-11。ZIP MysticMonsters_Ch1_21Images_FX_Handoff_20261011）
//  FX-01 素材：assets/chapter/fx_1011/ の派生（透過・大きさ・README の原本 sha256）・EV06 は既存 bc05 の派生（原本を追加保存しない）・原本の JPEG は置かない
//  FX-02 マスの上面の試作（TOP01・TOP07）：tiles_v2 と同じ大きさ・外形の透明度は tile_blank のまま・既存の tiles_v2 は変えていない・既定では使わない（?tileTop=1011）
//  FX-03 world-board：RIVAL（EV01 → リュウ → EV06）・野生／レア（Lv を出さない・野生は影）・高額 G（150 以上）・砂時計（10・5・1・記録は field.tw）・レアの紋章（MMRF_WORLD.marker）
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const sha = (p) => createHash('sha256').update(readFileSync(path.join(ROOT, p))).digest('hex');
function webp(p) {
  const b = readFileSync(path.join(ROOT, p)); assert.equal(b.toString('ascii', 0, 4) + b.toString('ascii', 8, 12), 'RIFFWEBP', p);
  const t = b.toString('ascii', 12, 16);
  if (t === 'VP8X') return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3), alpha: !!(b[20] & 0x10) };
  if (t === 'VP8L') { const v = b.readUInt32LE(21); return { w: (v & 0x3fff) + 1, h: ((v >> 14) & 0x3fff) + 1, alpha: !!((v >> 28) & 1) }; }
  return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff, alpha: false };
}

test('FX-01：画像演出の派生（透過・大きさ）・README に原本の sha256・EV06 は既存 bc05 から・原本の JPEG は置かない', () => {
  const D = 'assets/chapter/fx_1011/', R = rd(D + 'README.md');
  const want = { 'ev01_rival_title.webp': [864, 1536, false], 'ev04_rare_marker.webp': [null, 512, true], 'ev05_gold_burst.webp': [640, null, true], 'ev06_rival_clash.webp': [768, 432, true],
    'ev07_hourglass_10.webp': [null, 640, true], 'ev08_hourglass_5.webp': [640, null, true], 'ev09_hourglass_1.webp': [640, null, true] };
  for (const [f, [w, h, a]] of Object.entries(want)) {
    const i = webp(D + f); if (w) assert.equal(i.w, w, f); if (h) assert.equal(i.h, h, f); assert.equal(i.alpha, a, `${f}：透過 ${a}`);
    assert.ok(R.includes(f), `README に ${f}`);
  }
  assert.equal(sha('assets/battle/common/original/bc05_1790981740287.jpeg'), 'd0f8573af2e13226fb1ad70a9dc5d43c8df82ef8ef13f4bb4934fe3751cbc3b9', 'EV06＝既存の bc05（同じ原本）');
  for (const h of ['036d744cbbbeb1c1', '0b78c4ac36fb83fd', 'f97ba54d9fdce98d', '6293074b0ff538e5', 'f5589c6806b17f24', 'a36a762d8fa590a8', '1ab64560bbfa2deb', '73989418164815a3']) assert.ok(R.includes(h), `README に原本の sha256 ${h}`);
  assert.deepEqual(readdirSync(path.join(ROOT, D)).filter((f) => /\.jpe?g$/i.test(f)), [], '原本の JPEG は置かない');
  assert.ok(existsSync(path.join(ROOT, 'tools/fx1011/derive.py')));
});

test('FX-02：マスの上面の試作 2種＝tiles_v2 と同じ大きさ・既定では使わない・既存の tiles_v2 は変えていない', () => {
  const T = 'assets/fields/ch1a/tiles_top_1011/';
  for (const f of ['tile_stat_life.webp', 'tile_wild_monster.webp']) { const i = webp(T + f); assert.deepEqual([i.w, i.h, i.alpha], [320, 246, true], f); }
  for (const f of ['src/top01_life_yellow.webp', 'src/top07_wild_claws.webp']) assert.equal(webp(T + f).alpha, true, f);
  const wb = rd('js/chapter/world-board.js');
  // 2026-10-12：正式の12種（tiles_top_1012）が既定になった＝試作の ?tileTop=1011 の切り替えは外した（試作の2枚はファイルだけ残す）
  assert.match(wb, /TOP \+ 'tile_stat_' \+ STAT_FILE\[t\.k\] \+ '\.webp'/, '既定は正式の上面12種');
  const T2 = 'assets/fields/ch1a/tiles_top_1012/';
  for (const f of ['tile_stat_life', 'tile_stat_power', 'tile_stat_intelligence', 'tile_stat_accuracy', 'tile_stat_evasion', 'tile_stat_toughness', 'tile_wild_monster', 'tile_treasure', 'tile_meal', 'tile_rival', 'tile_event', 'tile_rare_monster']) { const i = webp(T2 + f + '.webp'); assert.deepEqual([i.w, i.h, i.alpha], [320, 246, true], f); }
  assert.match(wb, /t\.tier === 'rare' \? TV2 \+ 'tile_treasure_2\.webp'/, '珍しい宝箱は従来の絵（段階の違いを消さない）');
  // 既存の tiles_v2 は上書きしていない（このコミットの前と同じ大きさ）
  for (const [f, h] of [['tile_stat_life.webp', 262], ['tile_wild_monster.webp', 246], ['tile_blank.webp', 246]]) assert.deepEqual([webp('assets/fields/ch1a/tiles_v2/' + f).w, webp('assets/fields/ch1a/tiles_v2/' + f).h], [320, h], f);
});

test('FX-03：world-board の演出（RIVAL・野生／レア・高額 G・砂時計・レアの紋章）とその条件', () => {
  const wb = rd('js/chapter/world-board.js'), rw = rd('js/proto/roadfirst-world.js');
  assert.match(wb, /const GOLD_BIG = 150;/); assert.match(wb, /const TURN_WARN = \[10, 5, 1\];/);
  assert.match(wb, /f\.tw\[left\] = 1; doSave\(\);/, '砂時計は各1回（先に記録）');
  assert.match(wb, /document\.querySelector\('\.mmtalk,\.wb-pop,\.wbtr,\.chf-enc2,\.wbx-gold,\.wbx-hg'\)/, '会話・演出・遭遇（2026-10-14 実機試遊④：宝箱のカットイン .wbtr を含む）の間は待つ');
  assert.match(wb, /if \(rival\) return rivalCut\(/);
  assert.match(wb, /FXF\.rivalBg[\s\S]*FXF\.clash/, 'EV01 の幕と EV06 の X');
  assert.doesNotMatch(wb, /Lv\.|レベル/, 'Lv は出さない');
  assert.match(wb, /sil \|\| !foe \? '？？？'/, '野生は影と ？？？（2026-10-06 の決定のまま）');
  assert.match(wb, /await goldBurst\(fx\.gold\)/);
  assert.match(rw, /marker\(id, src, opt = \{\}\)/, 'MMRF_WORLD.marker（地点の上に浮かぶ目印）');
  assert.match(wb, /V\.world\.markerDim\(id, f\.used\[id\] != null\)/, '訪れたら弱くする');
  assert.doesNotMatch(wb, /bBattleSkip\(\)/, '2026-10-12 試遊：野生・レア・ライバルの遭遇はすべて強制バトル（「やめておく」は出さない）');
});
