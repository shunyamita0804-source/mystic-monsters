// 2026-10-06：共通UI（ZIP mismon_UI_A2／A3／B1〜B4_prepared）の正式部品の適用（第1弾・第2弾）。正本は PNG＝可逆の PNG のまま表示の約2倍へ縮小（JPEG・WebP にしない）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const HTML = readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const USED = ['b_group/b02_player_card_frame_blank', 'b_group/b04_save_slot_row_blank', 'b_group/b06_load_button_disabled', 'b_group/b13_facility_three_button_bar_blank',
  'b_group/b14_ranch_list_panel_blank', 'b_group/b15_ranch_four_action_bar_blank', 'b_group/b23_unique_skill_frame_blank', 'b_group/b44_nav_next_medallion',
  'b_group/b45_nav_back_medallion', 'a_group/a20_button_red_small_plain', 'a_group/a22_button_blue_large_panel',
  // 第2弾
  'b_group/b01_facility_label_blank', 'b_group/b03_profile_row_blank', 'b_group/b07_autosave_panel_blank', 'b_group/b08_backup_button_blank', 'b_group/b09_chapter_ribbon_blank',
  'b_group/b11_page_dot_on_glow', 'b_group/b12_page_dot_off', 'b_group/b20_board_progress_header_blank', 'b_group/b22_adventure_menu_popup_blank',
  'b_group/b26_ability_bar_fill_lightblue', 'b_group/b27_ability_bar_fill_darkblue', 'b_group/b28_ability_bar_fill_pink', 'b_group/b29_ability_bar_fill_green',
  'b_group/b30_ability_bar_fill_red', 'b_group/b31_ability_bar_fill_yellow', 'b_group/b37_skill_slot_locked_blank', 'b_group/b43_round_portrait_frame_plain',
  'b_group/b49_button_red_large_ornate', 'b_group/b50_button_disabled_gray_ornate', 'b_group/b51_parchment_note_frame_blank',
  'a_group/a17_popup_frame_parchment_plain', 'a_group/a19_button_blue_ornate_gems'];
const RAN = (HTML.match(/assets\/ui\/[ab]_group\/[a-z0-9_]+\.png/g) || []);

/** PNG（RGBA＝透過あり）。IHDR の色の種類 6 */
function pngAlpha(p) { const b = readFileSync(p); return b.readUInt32BE(0) === 0x89504e47 && b.toString('ascii', 12, 16) === 'IHDR' && b[25] === 6; }
const pngSize = (p) => { const b = readFileSync(p); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };

test('UB-01：使う部品は透過 PNG（可逆）で実在し、index.html から参照している。WebP・JPEG に変えた版・使わない部品は置かない', () => {
  for (const u of USED) {
    const p = path.join(ROOT, 'assets/ui', u + '.png');
    assert.ok(existsSync(p), u); assert.ok(pngAlpha(p), `${u} は透過 PNG`);
    assert.ok(HTML.includes(`./assets/ui/${u}.png`), `${u} を使う`);
    assert.ok(!existsSync(path.join(ROOT, 'assets/ui', u + '.webp')) && !existsSync(path.join(ROOT, 'assets/ui', u + '.jpg')), `${u} の WebP／JPEG 版は置かない`);
    assert.ok(Math.max(...pngSize(p)) <= 800, `${u} は表示の約2倍まで`);
  }
  for (const f of RAN) assert.ok(USED.includes(f.replace(/^assets\/ui\//, '').replace(/\.png$/, '')), `${f} は一覧にある`);
  for (const g of ['a_group', 'b_group']) for (const f of readdirSync(path.join(ROOT, 'assets/ui', g)).filter((f) => f.endsWith('.png'))) assert.ok(USED.includes(`${g}/${f.replace(/\.png$/, '')}`), `${g}/${f} は使う部品だけ`);
  for (const n of ['b05_save_button', 'b16_training', 'b17_warehouse', 'b24_ability_balance', 'b36_skill_slot_set', 'b38_skill_card_sample', 'a21_button_red_glow', 'a34_button_blue_glow']) assert.ok(!HTML.includes(n), `${n}（見本入り・光のにじみ）は使わない`);
  for (const f of ['__MACOSX', '.DS_Store']) for (const g of ['a_group', 'b_group']) assert.ok(!readdirSync(path.join(ROOT, 'assets/ui', g)).includes(f), f);
  const rd = readFileSync(path.join(ROOT, 'assets/ui/b_group/README.md'), 'utf8');
  for (const k of ['B-01', 'B-03', 'B-20', 'B-22', 'B-49']) assert.match(rd, new RegExp(`${k}_[a-z0-9_]+\\.png \\| [0-9a-f]{64}`), k);
});

test('UB-02：縦横比は画像のまま（背景 100% 100% と同じ aspect-ratio、または border-image）。押せる範囲は従来のボタン・処理は変えない', () => {
  const css = HTML.slice(HTML.indexOf('/* 2026-10-06 共通UI（正式素材 A2・A3・B1〜B3'), HTML.indexOf('.pfprof .pfhead .pfn{'));
  for (const [sel, ar] of [['#app .rn2 nav.rnact{', '800/138'], ['#app .lab nav.labnav{', '800/93'], ['.svs .card.slot:not(.svauto){', '720/178'], ['.pfprof .pfhead{', '720/443']]) {
    const i = css.indexOf(sel); assert.ok(i >= 0, sel); assert.match(css.slice(i, css.indexOf('}', i)), new RegExp(`aspect-ratio:${ar.replace('/', '\\/')};`), sel);
  }
  assert.match(css, /\.svs \.card\.slot:not\(\.svauto\)\{position:relative;box-sizing:border-box;/, 'padding を含めて縦横比を守る');
  assert.match(css, /#app \.sts \.stskill\{border:12px solid transparent;border-image:url\([^)]*b23_unique_skill_frame_blank\.png\) 46 fill \/ 12px \/ 0 round;/);
  assert.doesNotMatch(css, /hue-rotate|saturate|grayscale|sepia|invert/, '正式画像の色は変えない');
  assert.match(HTML, /<nav class="rnact" aria-label="牧場のコマンド"><button class="rna"/, '牧場のボタンは従来のまま');
  assert.match(HTML, /onclick="slotSave\(\$\{n\},this\)">セーブ<\/button><button \$\{d\?"":"disabled"\} onclick="slotLoad\(\$\{n\},this\)">ロード<\/button><\/div><i class="svpic" aria-hidden="true">/);
});

test('UB-03（第2弾）：施設名ラベル・リボン・プロフィール行・オートセーブ・バックアップ・ドット・能力バーの色・技のスロット・正式ボタン・羊皮紙・冒険の進行ヘッダー・メニュー。縦横比は画像のまま・処理は変えない', () => {
  const css = HTML.slice(HTML.indexOf('/* 2026-10-06 共通UI 第2弾'), HTML.indexOf('</style></head><body><main>'));
  assert.ok(css.length > 1000);
  const rule = (sel) => { const i = css.indexOf(sel); assert.ok(i >= 0, sel); return css.slice(i, css.indexOf('}', i)); };
  for (const [sel, ar] of [['#app .fm.fm2.bc .bcplq{box-sizing', '560/144'], ['#app .fm.bc .bcch,.chintro-name{', '560/153'], ['.pfprof .pfrow{', '720/195'], ['.svs .card.slot.svauto{', '720/156'], ['.svs details.svmore summary{', '720/122'], ['.chh .chh-top{', '800/106'], ['.tnewsscr .pfnote{', '480/625']]) assert.match(rule(sel), new RegExp(`aspect-ratio:${ar.replace('/', '\\/')}`), sel);
  // 能力バーの色＝正式色の対応（ライフ 黄・ちから 赤・かしこさ 緑・命中 ピンク・回避 水色・丈夫さ 青）
  for (const [k, c] of [['li', 'yellow'], ['po', 'red'], ['in', 'green'], ['hi', 'pink'], ['ev', 'lightblue'], ['de', 'darkblue']]) assert.match(css, new RegExp(`\\.sts \\.stb\\[data-k="${k}"\\]\\{--fill:url\\(\\./assets/ui/b_group/b\\d\\d_ability_bar_fill_${c}\\.png\\)\\}`), k);
  assert.match(css, /mmdg-danger,[^{]*\{aspect-ratio:720\/209;background-image:url\([^)]*b49_button_red_large_ornate\.png\)/, '取り返しのつかない操作は赤');
  assert.match(css, /:disabled[^{]*\{background-image:url\([^)]*b50_button_disabled_gray_ornate\.png\)/, '押せないボタンは灰色');
  assert.doesNotMatch(css, /hue-rotate|saturate|grayscale|sepia|invert|filter/, '正式画像の色は変えない（filter を使わない）');
  // 処理は変えない（押す範囲は従来のボタン）
  assert.match(readFileSync(path.join(ROOT, 'js/chapter/field-view.js'), 'utf8'), /<button class="p9mbtn chh-menu" onclick="p9Menu\(\)" aria-label="メニュー">☰<\/button>/);
  assert.match(HTML, /<button class="ngm-ok" data-nsfx="1" onclick="ngOk\(this\)">確認しました<\/button>/);
  assert.match(HTML, /class="pfrow"><i class="pfri" aria-hidden="true">/);
  assert.match(HTML, /<div class="card slot svauto">[\s\S]{0,500}<span class="svgold">\$\{S\.g\}G<\/span><\/div>/);
});
