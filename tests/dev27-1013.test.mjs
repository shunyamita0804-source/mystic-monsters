// =========================================================
// 2026-10-13 開発27（iPhone 試遊の修正）：ふだんのテスト（ファイル・データ・コードの形だけ。画面は tests/qa-e2e-dev27-1013.test.mjs）
//  D27-01：素材＝サイコロの SE は着地の足音だけ（sha256）・1 の面の紋章は円（sha256・ほかの面は変えない）・プレイヤーの印の SVG
//  D27-02：門の飾り（開始・中央の2か所）だけ出さない／大会会場は半透明にしない／横の1歩は静止の立ち絵を進む向きへ（standFace）
//  D27-03：声＝「よっ」の場面は止める・勝ったあとの「やるじゃん」は会話の行・施設の入口のアップと一言（FAC_ENTRY）
//  D27-04：開発27 の CSS に色を変える効果（filter）を使わない・「対戦開始」は1回の押下
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const sha = (p) => crypto.createHash('sha256').update(readFileSync(path.join(ROOT, p))).digest('hex');
const HTML = rd('index.html');

test('D27-01：サイコロの SE＝着地の足音だけ・1 の面＝円の紋章・プレイヤーの印', () => {
  assert.equal(sha('assets/audio/se/dice_1013/dice_cube_throw_land.ogg'), '89b4e05fa5389f2a72c111c3f2ecceb8c80ed92b1937b3900fd5606dc256e5cb');
  assert.match(rd('js/audio/audio-registry.js'), /DICE_CUBE:\s*\{ src: SE_DIR \+ 'dice_1013\/dice_cube_throw_land\.ogg', gain: 0\.9 \}/);
  assert.equal(sha('assets/fields/ch1a/dice/cube_1013/face_1.webp'), '30f938aade639554a3fe82d18b4cae93d831bf53592f29eebbdc719f401415ec');
  const R = rd('assets/fields/ch1a/dice/cube_1013/README.md');
  for (let v = 2; v <= 6; v++) { const m = new RegExp(`\\| face_${v}\\.webp \\|[^|]*\\| ([0-9a-f]{64}) \\|`).exec(R); assert.ok(m, `face_${v}`); assert.equal(sha(`assets/fields/ch1a/dice/cube_1013/face_${v}.webp`), m[1], `face_${v} は変えていない`); }
  assert.ok(existsSync(path.join(ROOT, 'assets/ui/profile_icon/player_silhouette.svg')));
  assert.match(HTML, /\.p10mk \.p10who::before\{[^}]*background:url\(\.\/assets\/ui\/profile_icon\/player_silhouette\.svg\)/, '市場のプレイヤーの札の円に黒い人の形');
});

test('D27-02：門の飾りだけ出さない・大会会場は透けない・横の1歩は立ち絵を進む向きへ', () => {
  const WB = rd('js/chapter/world-board.js'), RW = rd('js/proto/roadfirst-world.js');
  assert.match(WB, /hideLm: \['START', 'LOWER_GATE', 'UPPER_GATE'\]/);
  assert.match(RW, /if \(o\.hideLm && o\.hideLm\.includes\(L\.node\)\) continue;/);
  assert.match(RW, /props\[props\.length - 1\]\.solid = true;/); assert.match(RW, /if \(o\.xray && !p\.mark && !p\.solid\)/);
  const C = rd('js/chapter/configs/ch1a.js');
  assert.match(C, /solamo: \{[^\n]*standFace: 'left'/); assert.match(C, /gauru: \{[^\n]*standFace: 'right'/);
});

test('D27-03：声＝「よっ」の場面は止める・「やるじゃん」はボードの会話の行・施設の入口のアップと一言', () => {
  const w = {}; new Function('window', rd('js/npc/voice-cues.js'))(w); const V = w.MMVOICE;
  assert.equal(V.CUES['ryu.appear'].on, false); assert.ok(V.LINE_VOICE.ryu_praise);
  assert.match(HTML, /const FAC_ENTRY=\{ranch:\{npc:"nick",expr:"gentle",text:"今日も元気そうだな。",bg:\(\)=>RANCH_BG\},farm:\{npc:"dan",expr:"cheer",text:"よう、準備はできたか？"/);
  assert.match(HTML, /lab:\{npc:"elliot",expr:"smile",text:"やあ。",bg:\(\)=>LAB_BG\}/, '06：エリオットの「やあ」は笑顔');
  assert.match(HTML, /function facEntryOn\(fac\)\{return !!FAC_ENTRY\[fac\]&&!window\.MM_QA_NO_NPC/);
});

test('D27-04：開発27 の CSS に色を変える効果を使わない・「対戦開始」は1回の押下', () => {
  const css = HTML.slice(HTML.indexOf('/* ===== 2026-10-13 開発27'), HTML.indexOf('</style></head>'));
  assert.ok(css.length > 1000);
  assert.doesNotMatch(css, /filter|hue-rotate|saturate|grayscale|sepia|invert/);
  assert.match(HTML, /function p9VsGo\(b\)\{if\(bBusy\|\|\(b&&b\.dataset\.go\)\)return;if\(b\)b\.dataset\.go="1";/);
  assert.doesNotMatch(rd('js/battle/rules.js'), /filter: 'drop-shadow/, '固有スキルの演出でモンスターの絵の色を変えない');
});
