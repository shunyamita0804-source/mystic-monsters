// =========================================================
// 次期総合改修（2026-10-05）：正式プロローグ4枚・文字単位のフェード／序盤の導線（セルジュの正式登録・世界地図）／正式ステータス画面／短いイベント
//  NX5-01〜06（画面は tests/qa-e2e-next-1005.test.mjs・qa-e2e-prologue.test.mjs）
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const HTML = rd('index.html');
const fnOf = (name) => { const i = HTML.indexOf(`function ${name}(`); assert.ok(i > 0, name); return HTML.slice(i, HTML.indexOf('\nfunction ', i + 10)); };
const load = (f, name) => { const w = {}; new Function('window', 'document', rd(f))(w, undefined); return w[name]; };

test('NX5-01：プロローグ（2026-10-07 正式：6枚＝平和 → 厄災 → 文化 → 三人のレジェンド → 大会 → 旅立ち）・本文の始まりと終わり・三人のレジェンドと聖獣（本文には名前を出さない）', () => {
  const P = load('js/prologue/prologue.js', 'MMPRO');
  assert.deepEqual(P.SLIDES.map((s) => s.id), ['1', '2', '3', '4', '5', '6']);
  assert.deepEqual(P.SLIDES.map((s) => path.basename(s.bg)), ['prologue_01_peace.webp', 'prologue_02_calamity.webp', 'prologue_03_culture.webp', 'prologue_04_legends.webp', 'prologue_05_tournament.webp', 'prologue_06_departure.webp']);
  for (const s of P.SLIDES) assert.ok(existsSync(path.join(ROOT, s.bg)), s.bg);
  const all = P.SLIDES.flatMap((s) => s.pages.flat()).join('');
  assert.ok(all.startsWith('はるか昔、人と聖獣は'));
  assert.ok(all.endsWith('聖獣都市ミストリアへ旅立つ。'));
  assert.match(all, /10年前/); assert.match(all, /三人のレジェンド/);
  assert.deepEqual(P.LEGENDS.map((l) => `${l.name}+${l.beast}`), ['アストラッド+ゼルヴァーン', 'レオナ+グリフェル', 'ラグナス+ドラグノル']);
  for (const l of P.LEGENDS) assert.ok(!all.includes(l.name), `本文に ${l.name} を出さない`);
  assert.doesNotMatch(all, /死|亡くな|引退|異世界|バルド|聖獣師/, 'レジェンドの死亡・引退・旧名は書かない');
});

test('NX5-02：プロローグの文字＝1文字ずつ（開始の間隔 40〜55ms・各 120〜180ms で重なる・数px の移動とぼかし）・位置は中央よりやや上・段落は空行で区切る', () => {
  const P = load('js/prologue/prologue.js', 'MMPRO'), src = rd('js/prologue/prologue.js');
  assert.ok(P.T.chGap >= 40 && P.T.chGap <= 55); assert.ok(P.T.chFade >= 120 && P.T.chFade <= 180); assert.ok(P.T.chFade > P.T.chGap, '前の文字が出終わる前に次が始まる');
  assert.ok(P.T.chRise >= 2 && P.T.chRise <= 4); assert.ok(P.T.chBlur >= 1 && P.T.chBlur <= 2);
  assert.ok(P.POS.y > 0.35 && P.POS.y < 0.5);
  assert.deepEqual(P.units(['a', 'b', '', 'c']), [['a', 'b'], ['c']]);
  assert.match(HTML, /@keyframes mmproCh\{to\{opacity:1;transform:none;filter:blur\(0\)\}\}/);
  assert.match(HTML, /\.mmpro-u\.full \.mpc\{animation:none;opacity:1/, 'タップで全文');
});

test('NX5-03：序盤の導線＝フィナの2択（どちらも管理局へ）・セルジュ（画像なし＝名前だけ・仮の人物を作らない）・名前の確認・登録のあとに初めて名前を呼ぶ・出身（フェルナ／リベルナ）・世界地図（画像に焼き込まない）', () => {
  const first = HTML.slice(HTML.indexOf('const OPEN_TALK={'), HTML.indexOf('/** プロローグ（新しいゲームの最初に1回'));
  assert.match(first, /あの……もしかして、今日ミストリアで聖獣士登録をする予定の方ですか？",choices:\[\{id:"yes",label:"はい"\},\{id:"no",label:"いいえ"\}\]/);
  const before = first.slice(0, first.indexOf(' confirm:'));
  assert.doesNotMatch(before, /\$\{n\}/, '登録より前の会話に名前は入らない');
  assert.match(fnOf('opTownTalk'), /branches:\{yes:OPEN_TALK\.firstYes,no:OPEN_TALK\.firstNo\}/);
  assert.match(fnOf('opGuide'), /c\[3\]=="townGuild\(\)"\?"go":"lk"/, '登録前は管理局だけ');
  assert.match(fnOf('opConfirm'), /MMP11P\.confirmName\(S,n\)/, '保存先は従来どおり');
  const N = rd('js/npc/npc.js'); assert.match(N, /const SERGE = 'assets\/npc\/serge\/full_normal\.webp'/); assert.match(N, /register\('serge', \{ name: 'セルジュ'/);
  assert.ok(existsSync(path.join(ROOT, 'assets/npc/serge/full_normal.webp')), '2026-10-06：セルジュ＝参考画像を透過した立ち絵');
  assert.ok(!existsSync(path.join(ROOT, 'assets/npc/serge/serge_reference.png')), '白背景の参考画像そのものは置かない');
  const MAP = load('js/opening/worldmap.js', 'MMMAP');
  assert.deepEqual(Object.keys(MAP.SPOTS), ['world', 'ferna', 'asteria', 'liberna', 'mistoria']);
  assert.equal(MAP.SPOTS.liberna.note, '出身地'); assert.equal(MAP.SPOTS.mistoria.note, '現在地');
  assert.ok(existsSync(path.join(ROOT, MAP.MAP.src)));
  assert.match(fnOf('opAfterReg'), /focus\("ferna"\)[\s\S]*focus\("asteria"\)[\s\S]*focus\("liberna",true\)[\s\S]*focus\("mistoria",true\)/, '世界 → フェルナ → アステリア → リベルナ → ミストリア');
  assert.match(HTML, /<button class="bub bumap" (?:data-cmd="bureau_map" )?onclick="bureauMap\(\)" aria-label="世界地図">/, '管理局の常設「世界地図」');
  assert.match(fnOf('lobby'), /if\(S\.playerNamePending&&!opOn\(\)\)return p11NameScr\(msg\);/, '自動テスト（MM_QA_NO_OPENING）は従来の名前登録');
});

test('NX5-04：正式ステータス画面＝動的（レーダー＋6能力の棒 999 まで・固有スキル4種）。Lv・経験値・個体ランクは出さない', () => {
  const st = fnOf('stScr');
  assert.match(st, /\$\{stRadar\(m\)\}/); assert.match(st, /v\/999\*100/); assert.match(st, /STAT_COLOR\[k\]/);
  assert.doesNotMatch(st, /Lv|経験値|EXP|rankLabel|ランク/);
  for (const [n, d] of [["逆境のひと踏ん張り", "20%以下"], ["紅翼の猛攻", "3ターン"], ["ふしぎな嗅覚", "状態異常"], ["大地の守り", "10%の確率"]]) assert.match(HTML, new RegExp(`name:"${n}",desc:"[^"]*${d}`), n);   // 2026-10-06：4種とも効果の文（表示だけ）
  assert.doesNotMatch(st, /p11Speed|素早さ/, '2026-10-06：ステータス画面に素早さは出さない');
  assert.match(HTML, /if\(id=="st"\)return stScr\(m,msg\);/);
});

test('NX5-05：短いイベント（MMNPCE.moment）＝吹き出し1〜3・表情は正式差分・最初の1回だけ（S.npcFlags.moment）・自動テストでは出さない', () => {
  const NE = load('js/npc/npc-events.js', 'MMNPCE');
  const EXPR = { fina: null, dan: ['normal', 'cheer', 'caution', 'proud'], genshin: ['guide', 'fired', 'strict', 'approve'] };
  for (const k of ['partner', 'sp', 'move', 'tour', 'tourWon', 'tourLost']) {
    const L = NE.moment(k, 'テスト'); assert.ok(L && L.length >= 1 && L.length <= 3, k);
    for (const l of L) { assert.ok(l.npc in EXPR, `${k}：${l.npc}`); if (EXPR[l.npc]) assert.ok(EXPR[l.npc].includes(l.expression), `${k}：${l.npc} ${l.expression}`); }
  }
  assert.equal(NE.moment('nope'), null);
  const f = fnOf('npcMoment'); assert.match(f, /window\.MM_QA_NO_NPC/); assert.match(f, /if\(M\[k\]\)\{fin\(\);return false\}/); assert.match(f, /M\[k\]=1;save\(\);/);
  for (const k of ['"partner"', '"move"', '"tour"', 'rs.won?"tourWon":"tourLost"']) assert.ok(HTML.includes(`npcMoment(${k}`), k);
  assert.match(fnOf('p7Depart'), /MMNPCE\.moment\("sp"/, '種族の初めての育成＝育成開始の掛け合いに添える');
});

test('NX5-06：操作欄（safe-area・少し上へ）・30ターンの説明（コードの値と一致）', () => {
  assert.match(HTML, /#app>\.chfw\{--chcmd:128px;--chdeck:calc\(clamp\(136px,20\.6vh,180px\) \+ env\(safe-area-inset-bottom,0px\)\)\}/);
  const c = rd('js/chapter/configs/ch1a.js');
  assert.match(c, /turnLimit: root\.MMCH_CH1A_TURN_LIMIT \|\| 45/); assert.match(c, /id: 'tut_turns'/); assert.match(c, /この旅は45ターン/);   // 2026-10-06：45ターン
});
