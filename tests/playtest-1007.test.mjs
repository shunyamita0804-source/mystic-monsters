// =========================================================
// 2026-10-07 実機試遊・軽微 UI／遷移修正便の最小テスト
//  PT-01：「最初からやり直す」の印（mr4ng）＝アプリを閉じても次の起動は新しいゲームの開始画面。セーブ・キー mr4v6 は変えない
//  PT-02：チラつき対策（プロローグ → フィナ・街 → リュウの黒い幕／会話の閉じ始め onClose で次の画面を下に描く＝セドリック → 対戦表）
//  PT-03：共通の はい／いいえ（新しいゲーム・大会をやめる）・2択は縦・長い選択肢は1行・本番の文言に TEST を出さない
//  PT-04：登録画面の赤い丸（機能なしの飾り）を消した・新人支援の 1000G＋薬草は1つの帯（報酬の中身は同じ）・世界地図の解放は短い知らせ
//  PT-05：プロローグの曲は Scene の切り替えの少し前から（時刻表 CUES は変えない）・ランク開始のカットは重ねてからフェード
//  PT-06：対戦表＝次の相手の行（rnx）・ほかの参加者どうしの新しい結果だけ短い演出（結果の計算は変えない）
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (f) => readFileSync(path.join(ROOT, f), 'utf8');
const HTML = rd('index.html');
const fnOf = (name) => { const i = HTML.indexOf(`function ${name}(`); assert.ok(i >= 0, name); const j = HTML.indexOf('\nfunction ', i + 10), k = HTML.indexOf('\nconst ', i + 10), l = HTML.indexOf('\nlet ', i + 10); return HTML.slice(i, Math.min(...[j, k, l].filter((x) => x > 0))); };
const CSS = HTML.slice(HTML.indexOf('/* ===== 2026-10-07 実機試遊・軽微修正便'), HTML.indexOf('</style></head><body><main>'));

test('PT-01：「最初からやり直す」の印（mr4ng）。開始画面で印を合わせ、新しいゲームを始めた（つづきからに戻った）あとの保存で消す', () => {
  assert.match(HTML, /var P_NEWGAME=\(\(\)=>\{try\{return localStorage\.getItem\("mr4ng"\)=="1"\}catch\(e\)\{return false\}\}\)\(\);/);
  assert.match(fnOf('title'), /^function title\(\)\{ngMark\(P_NEWGAME\);/);
  assert.match(fnOf('save'), /^function save\(\)\{if\(P8_LOAD\.locked\|\|TEST_TOUR\)return;if\(P_NEWGAME===false\)ngMark\(0\);try\{localStorage\.setItem\(MMP8\.SAVE_KEY,/, '起動の途中（P_NEWGAME の読み込み前）は消さない');
  assert.match(HTML, /SAVE_KEY/); assert.doesNotMatch(HTML, /localStorage\.setItem\("mr4ng",JSON/);
  // 印の読み書き（偽の localStorage）
  const st = {}; const ls = { getItem: (k) => (k in st ? st[k] : null), setItem: (k, v) => { st[k] = String(v); }, removeItem: (k) => { delete st[k]; } };
  const i0 = HTML.indexOf('function ngMark(on){'), src = HTML.slice(i0, HTML.indexOf('catch(e){}}', i0) + 11);
  const ngMark = new Function('localStorage', `${src};return ngMark;`)(ls);
  ngMark(1); assert.equal(st.mr4ng, '1'); ngMark(0); assert.equal(st.mr4ng, undefined);
});

test('PT-02：チラつき対策＝黒い幕（会話の下 z 899）と、会話の閉じ始めに次の画面を描く onClose', () => {
  const npc = rd('js/npc/npc.js');
  assert.match(npc, /if \(typeof opts\.onClose === 'function' && !ov\.__instant\) \{ try \{ opts\.onClose\(choice == null \? null : choice\); \} catch \(e\) \{\} \}/);
  assert.match(CSS, /\.opcur\{position:fixed;inset:0;z-index:899;/);
  assert.match(fnOf('opPrologue'), /\.then\(\(\)=>\{opCurtain\(\);lobby\(msg\);if\(!OP_TALKING\)opCurtainOff\(\)\}\)/, 'プロローグのあと、フィナの会話が出るまで黒い幕');
  assert.match(fnOf('opTownTalk'), /opCurtainOff\(\);t\.then\(/); assert.match(fnOf('opTownTalk'), /\},cur\?0:350\)\}/);
  const ryu = fnOf('opRyu');
  assert.match(ryu, /opCurtain\(true\);/); assert.match(ryu, /onClose:\(\)=>\{OP_TALKING=false;RYU_NOW=false;after\(\)\}/); assert.doesNotMatch(ryu, /setTimeout\(r,450\)/, '街を一瞬見せてから会話を出さない');
  assert.match(fnOf('p9TourOpen'), /onClose:\(\)=>\{drawn=true;P9_ENTER=true;board\(\)\}/, 'セドリックの会話の閉じ始めに対戦表を下に描く');
});

test('PT-03：共通の はい／いいえ・2択は縦・長い選択肢は1行・本番の文言に TEST を出さない', () => {
  assert.match(fnOf('ngAsk'), />はい<\/button><button class="ngm-back" data-se="UI_CANCEL" onclick="ngBack\(\)">いいえ<\/button>/); assert.doesNotMatch(fnOf('ngAsk'), />確認しました</);
  assert.match(fnOf('ynAsk'), /tapHold\(d,350\)/);
  const menu = fnOf('p9Menu'); assert.match(menu, /ynAsk\('大会をやめて街へ戻りますか？','',\(\)=>testTourEnd\(\)\)">大会をやめて街へ戻る<\/button>/); assert.doesNotMatch(menu, /TEST 大会をやめて/);
  assert.match(fnOf('testTourEnd'), /lobby\(msg\|\|"大会を終了しました（セーブは変わっていません）。"\)/);
  assert.match(CSS, /\.mmtalk-big \.mmtalk-choices:has\(>\.mmtalk-choice:nth-child\(2\):last-child\)\{flex-direction:column;/);
  assert.match(rd('js/npc/npc.js'), /if \(Array\.from\(x\.label\)\.length >= 13\) bt\.classList\.add\('long'\);/);
  assert.match(CSS, /#p9ov \.p8menu button,#p9ov \.p8menu button\.p8danger\{[^}]*height:48px!important;[^}]*aspect-ratio:auto!important;/, '4つのボタンは同じ形・大きさ');
  assert.doesNotMatch(CSS, /hue-rotate|saturate|grayscale|sepia|invert|filter/, '画像の色は変えない');
});

test('PT-04：赤い丸を消した・1000G＋薬草は1つの帯（中身は同じ）・世界地図の解放は短い知らせ', () => {
  assert.doesNotMatch(fnOf('p11NameScr'), /p11seal/);
  assert.match(HTML, /const SUPPORT=Object\.freeze\(\{gold:1000,item:"herb"\}\)|SUPPORT=\{gold:1000,item:"herb"\}|gold:1000/);
  const no = rd('js/feel/notice.js'); assert.match(no, /n\.rows \? `<div class="mmnote-rows">/);
  const w = {}; new Function('window', 'document', no)(w, undefined); assert.ok(w.MMNOTE);
});

test('PT-05：プロローグの曲は少し前から（時刻表は変えない）・ランク開始のカットは重ねてからフェード', () => {
  const pro = rd('js/prologue/prologue.js');
  assert.match(pro, /const AQ = opts\.onSceneAudio \? sceneStarts\(\)\.slice\(1\)\.map\(\(t, k\) => \(\{ t: Math\.max\(0, t - \(opts\.audioLeadMs \|\| 0\)\), si: k \+ 1 \}\)\) : \[\];/);
  const w = {}; new Function('window', 'document', pro)(w, undefined);
  assert.deepEqual(w.MMPRO.sceneStarts(), [0, 7800, 16100, 24400, 34100, 42500]);   // 2026-10-08：各 Scene を1〜3秒延長
  assert.match(fnOf('p9Frames'), /x\.classList\.add\("on"\);T\.push\(setTimeout\(\(\)=>\{im\.forEach\(\(y,j\)=>\{if\(j<i\)y\.classList\.remove\("on"\)\}\)\},520\)\)/);
});

test('PT-06：対戦表＝次の相手の行全体・ほかの参加者どうしの新しい結果だけ短い演出（計算は MMP8L のまま）', () => {
  const g = fnOf('tbBoardGrid');
  assert.match(g, /rc=e\.player\?" rme":e\.id===nx\?" rnx":""/);
  assert.match(g, /MMP8L\.matchStats\(lg,r,mt\)\[a\]/); assert.match(g, /a\.player\|\|b\.player/, 'プレイヤーの試合は対象外');
  assert.match(CSS, /\.tb1g\.tbv2 \.rnx\{/); assert.match(CSS, /@keyframes tblfDrop\{from\{transform:scaleX\(1\)\}to\{transform:scaleX\(var\(--lf,\.5\)\)\}\}/);
  assert.doesNotMatch(rd('js/phase8/league.js'), /2026-10-07 試遊/, '大会の計算は変えない');
});
