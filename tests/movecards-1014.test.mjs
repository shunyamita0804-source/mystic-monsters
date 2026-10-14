// 開発30（2026-10-14）：正式5体×10技＝50技の静止カード（js/battle/move-cards.js・assets/moves/cards_1014/）
//  MC-01 50枚の対応（カードの番号 → 技ID → SK の番号）が納品の対応表どおり・ファイルが実在する WebP
//  MC-02 技管理（6枠・技の一覧・技の詳細）だけが新しいカードを使い、バトル中のルーレット・技辞典・技データは変えない
//  MC-03 README に50枚の原本の sha256・変換の条件
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HTML = readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const load = () => { const ctx = { console }; ctx.window = ctx; ctx.globalThis = ctx; vm.createContext(ctx);
  for (const f of ['js/phase10/monsters.js', 'js/battle/move-cards.js']) vm.runInContext(readFileSync(path.join(ROOT, f), 'utf8'), ctx);
  return ctx; };
// 納品の対応表（全5体50技_画像ファイル名と正式技ID対応.tsv）：種族 → [カードの番号, 技ID, SK]
const TSV = {
  solamo: [[1, 'taiatari', 0], [2, 'hikkaki', 1], [3, 'shippo_attack', 2], [4, 'hoeru', 3], [5, 'star_crash', 4], [6, 'soramo_beam', 5], [7, 'sunakake', 6], [8, 'hoshi_no_mamori', 7], [9, 'stardust_ray', 8], [10, 'star_fall', 9]],
  gauru: [[1, 'tsutsuku', 11], [2, 'wind', 12], [3, 'spiral_dive', 10], [4, 'sonic_move', 13], [5, 'kouyoku_slash', 14], [6, 'fireball', 15], [7, 'sky_rush', 17], [8, 'flare_ray', 16], [9, 'feather_storm', 18], [10, 'seinaru_honoo', 19]],
  nobiton: [[1, 'hana_binta', 30], [2, 'zutsuki', 31], [3, 'hanamizu', 32], [4, 'hitoyasumi', 33], [5, 'hammer_nose', 34], [6, 'nose_wave', 35], [7, 'shibire_tsuki', 36], [8, 'mirage_nose', 37], [9, 'downer_mist', 38], [10, 'gigant_nose', 39]],
  jiol: [[1, 'punch', null], [2, 'kick', null], [3, 'chikara_wo_tameru', null], [4, 'noshikakari', null], [5, 'ground_hammer', null], [6, 'crystal_ray', null], [7, 'ground_spike', null], [8, 'rock_upper', null], [9, 'geo_impact', null], [10, 'crystal_nova', null]],
  regnas: [[1, 'kirisaku', 20], [2, 'shippo_attack', 21], [3, 'ryugan_lock', 22], [4, 'zanei_step', 23], [5, 'dragon_crash', 24], [6, 'soukou_breath', 25], [7, 'snipe_fang', 26], [8, 'genei_claw', 27], [9, 'soujin_ranbu', 28], [10, 'tail_cyclone', 29]],
};

test('MC-01：50枚の対応が納品の対応表どおり（番号の昇順で刺さない）・ファイルは実在する WebP・重複なし', () => {
  const C = load().MMMVCARD;
  const seen = new Set(); let n = 0;
  for (const [sp, rows] of Object.entries(TSV)) {
    const L = C.list(sp);
    assert.equal(L.length, 10, sp);
    for (const [card, id, slot] of rows) {
      const x = L.find((v) => v.id === id); assert.ok(x, sp + ' ' + id);
      assert.equal(x.slot, slot, sp + ' ' + id + ' の SK');
      const want = `./assets/moves/cards_1014/${sp}/${String(card).padStart(2, '0')}_${id}.webp`;
      assert.equal(x.src, want, sp + ' ' + id);
      const buf = readFileSync(path.join(ROOT, want));
      assert.equal(buf.toString('latin1', 0, 4) + buf.toString('latin1', 8, 12), 'RIFFWEBP', want);
      assert.ok(!seen.has(want)); seen.add(want); n++;
      if (slot != null) assert.equal(C.bySlot(slot).src, want, 'SK ' + slot);
    }
  }
  assert.equal(n, 50);
  // 番号のずれに注意する所（指示書）
  assert.match(C.src(3), /solamo\/04_hoeru/); assert.match(C.src(4), /solamo\/05_star_crash/); assert.match(C.src(7), /solamo\/08_hoshi_no_mamori/);
  assert.match(C.src(10), /gauru\/03_spiral_dive/); assert.match(C.src(17), /gauru\/07_sky_rush/); assert.match(C.src(16), /gauru\/08_flare_ray/);
  assert.equal(C.src(40, 'fb'), 'fb', 'カードの無い番号は従来の絵');
});

test('MC-02：技管理だけが新しいカード（6枠・一覧・詳細）・バトルのルーレット／技辞典／技データは従来のまま', () => {
  assert.match(HTML, /<script src="\.\/js\/battle\/rules\.js"><\/script>\n<script src="\.\/js\/battle\/move-cards\.js"><\/script>/);
  assert.match(HTML, /class="rw mvr \$\{SK\[k\]\[7\]=="p"\?"cp":"ci"\}[^`]*<img class="rt" src="\$\{mvSrc\(k\)\}"/);
  assert.match(HTML, /<div class="dska\$\{mvNew\(k\)\?" mvc":""\}"><img src="\$\{mvSrc\(k\)\}" alt="" loading="lazy"/);
  assert.match(HTML, /<div class="dsha\$\{mvNew\(k\)\?" mvc":""\}"><img src="\$\{mvSrc\(k\)\}"/);
  assert.match(HTML, /const ic=k=>SKART\[k\]\?`<span class="si"><img class="sart" src="\$\{SKART\[k\]\}"/, 'バトル中のルーレットの絵は SKART のまま');
  assert.match(HTML, /const sico=k=>SKART\[k\]\?`<img class="sart" src="\$\{SKART\[k\]\}"/);
  assert.match(HTML, /locked_skill_panel\.png/, '未習得の伏せカードは従来のまま');
  const src = readFileSync(path.join(ROOT, 'js/battle/move-cards.js'), 'utf8');
  assert.doesNotMatch(src, /\b(SK|EFF|SKART|SKS|SPECIAL_MOVES)\s*\[[^\]]*\]\s*=(?!=)/, '技データ・絵の表を書き換えない');
  assert.doesNotMatch(readFileSync(path.join(ROOT, 'js/battle/movedex.js'), 'utf8'), /MMMVCARD|cards_1014/, '技辞典は変えない');
  const css = HTML.slice(HTML.indexOf('/* ===== 2026-10-14 開発30'), HTML.indexOf('</style></head>'));
  assert.doesNotMatch(css, /filter|hue-rotate|saturate|\.rw|\.bt[\s.{]|#rl|#go/, '色を変えない・Phase 6 のセレクタに触れない');
});

test('MC-03：README に50枚の原本（背景あり）の sha256 と変換の条件・道具がある', () => {
  const md = readFileSync(path.join(ROOT, 'assets/moves/cards_1014/README.md'), 'utf8');
  assert.equal((md.match(/\b[0-9a-f]{64}\b/g) || []).length, 50);
  assert.match(md, /640/); assert.match(md, /品質 ?84/);
  assert.ok(existsSync(path.join(ROOT, 'tools/movecards1014/derive.py')));
  assert.ok(existsSync(path.join(ROOT, 'prototype/movecards_1014/index.html')));
});
