// 2026-10-06：共通UI（ZIP mismon_UI_A2／A3／B1〜B3_prepared）のうち、安全に透過できて用途がはっきりした部品の適用
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const HTML = readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const USED = ['b_group/b02_player_card_frame_blank', 'b_group/b04_save_slot_row_blank', 'b_group/b06_load_button_disabled', 'b_group/b13_facility_three_button_bar_blank',
  'b_group/b14_ranch_list_panel_blank', 'b_group/b15_ranch_four_action_bar_blank', 'b_group/b23_unique_skill_frame_blank', 'b_group/b44_nav_next_medallion',
  'b_group/b45_nav_back_medallion', 'a_group/a20_button_red_small_plain', 'a_group/a22_button_blue_large_panel'];

function webpAlpha(p) { const b = readFileSync(p); return b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP' && (b.toString('ascii', 12, 16) === 'VP8X' ? (b[20] & 0x10) !== 0 : b.toString('ascii', 12, 16) === 'VP8L'); }

test('UB-01：使う部品は透過 WebP で実在し、index.html から参照している。使わない部品（透過できない・見本入り・空の枠）は置かない', () => {
  for (const u of USED) {
    const p = path.join(ROOT, 'assets/ui', u + '.webp');
    assert.ok(existsSync(p), u); assert.ok(webpAlpha(p), `${u} は透過`);
    assert.ok(HTML.includes(`./assets/ui/${u}.webp`), `${u} を使う`);
  }
  for (const n of ['b03_profile_row', 'b05_save_button', 'b08_backup', 'b26_ability', 'b32_ability', 'b37_skill_slot']) assert.ok(!HTML.includes(n), n);
  assert.match(readFileSync(path.join(ROOT, 'assets/ui/b_group/README.md'), 'utf8'), /B-04_save_slot_row_blank\.png \| [0-9a-f]{64}/);
});

test('UB-02：縦横比は画像のまま（背景 100% 100% と同じ aspect-ratio、または border-image）。押せる範囲は従来のボタン・処理は変えない', () => {
  const css = HTML.slice(HTML.indexOf('/* 2026-10-06 共通UI（正式素材 A2・A3・B1〜B3'), HTML.indexOf('.pfprof .pfhead .pfn{'));
  for (const [sel, ar] of [['#app .rn2 nav.rnact{', '800/138'], ['#app .lab nav.labnav{', '800/93'], ['.svs .card.slot:not(.svauto){', '720/178'], ['.pfprof .pfhead{', '720/443']]) {
    const i = css.indexOf(sel); assert.ok(i >= 0, sel); assert.match(css.slice(i, css.indexOf('}', i)), new RegExp(`aspect-ratio:${ar.replace('/', '\\/')};`), sel);
  }
  assert.match(css, /\.svs \.card\.slot:not\(\.svauto\)\{position:relative;box-sizing:border-box;/, 'padding を含めて縦横比を守る');
  assert.match(css, /#app \.sts \.stskill\{border:12px solid transparent;border-image:url\([^)]*b23_unique_skill_frame_blank\.webp\) 46 fill \/ 12px \/ 0 round;/);
  assert.doesNotMatch(css, /hue-rotate|saturate|grayscale|sepia|invert/, '正式画像の色は変えない');
  assert.match(HTML, /<nav class="rnact" aria-label="牧場のコマンド"><button class="rna"/, '牧場のボタンは従来のまま');
  assert.match(HTML, /onclick="slotSave\(\$\{n\},this\)">セーブ<\/button><button \$\{d\?"":"disabled"\} onclick="slotLoad\(\$\{n\},this\)">ロード<\/button><\/div><i class="svpic" aria-hidden="true">/);
});
