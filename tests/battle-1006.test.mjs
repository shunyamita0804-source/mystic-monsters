// =========================================================
// 2026-10-06：本体修正＋大会UI統合＋技アニメ実装＋バトル演出強化
//  MV-01 正式技のデータ（ソラモ・ノビトン・ジオル・ガウル・レグナス）と技辞典の資料（assets/moves/）
//  MV-02 ソラモ・ガウルの SK（0〜19）を実行時に入れ替える（js/battle/official-moves.js）。番号＝習得の枠は変えない・SK／EFF の定義の行は変えない
//  MV-03 バトルの共通演出（js/battle/stage.js）：tier ごとの長さ・ずらすタイマーは 720／1500／1900 だけ・色の加工なし・Phase 6 に触れない
//  MV-04 技辞典（js/battle/movedex.js）の入口
//  MV-05 UI の修正（はい／いいえ・プロフィールの見出し・購入確認の正式ボタン）・「ガッツ」を使わない
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const HTML = rd('index.html');
const CODE = HTML.slice(HTML.lastIndexOf('<script>'));
const M = (() => { const w = {}; new Function('window', rd('js/phase10/monsters.js'))(w); return w.MMP10M; })();

test('MV-01：正式技のデータ（2026-10-06）。ソラモ・ガウル・ノビトンは数値つき、ジオルは名前だけ（数値は未同期＝null）、レグナスは既存の数値＋技辞典の画像。資料はすべて実在', () => {
  const row = (m) => [m.name, m.type, m.power ?? null, m.accuracy ?? null, m.critical ?? null];
  assert.deepEqual(M.movesOf('solamo').map(row), [
    ['たいあたり', 'power', 70, 90, 5], ['ひっかき', 'power', 60, 100, 10], ['しっぽアタック', 'power', 85, 80, 10], ['スタークラッシュ', 'power', 105, 85, 15],
    ['ほしのまもり', 'support', null, null, null], ['吠える', 'support', null, null, null], ['ソラモビーム', 'wisdom', 90, 85, 10], ['すなかけ', 'support', null, null, null],
    ['スターダストレイ', 'wisdom', 120, 95, 20], ['スターフォール', 'wisdom', 140, 85, 25]]);
  assert.deepEqual(M.movesOf('gauru').map(row), [
    ['つつく', 'power', 60, 100, 5], ['ウィンド', 'wisdom', 65, 95, 5], ['スパイラルダイブ', 'power', 95, 85, 15], ['ソニックムーブ', 'support', null, null, null],
    ['紅翼スラッシュ', 'power', 110, 90, 15], ['ファイアボール', 'wisdom', 100, 90, 10], ['スカイラッシュ', 'power', 125, 85, 20], ['フレアレイ', 'wisdom', 120, 90, 15],
    ['フェザーストーム', 'wisdom', 145, 70, 20], ['聖なる炎', 'wisdom', 115, 90, 15]]);
  assert.deepEqual(M.movesOf('nobiton').map(row), [
    ['はなビンタ', 'power', 65, 90, 5], ['ずつき', 'power', 80, 75, 10], ['はなみず', 'wisdom', 55, 95, 5], ['ひとやすみ', 'heal', null, null, null],
    ['ハンマーノーズ', 'power', 105, 80, 15], ['ノーズウェーブ', 'wisdom', 90, 90, 10], ['しびれ突き', 'power', 75, 100, 10], ['ミラージュノーズ', 'power', 100, 90, 30],
    ['ダウナーミスト', 'special', 60, 95, 0], ['ギガントノーズ', 'power', 150, 75, 25]]);
  assert.deepEqual(M.movesOf('jiol').map((m) => m.name), ['パンチ', 'キック', '力をためる', 'のしかかり', 'グランドハンマー', 'クリスタルレイ', 'グランドスパイク', 'ロックアッパー', 'ジオインパクト', 'クリスタルノヴァ']);
  assert.ok(M.movesOf('jiol').every((m) => m.power === null && m.accuracy === null), 'ジオルの数値は推測で入れない');
  assert.deepEqual(M.movesOf('regnas').map((m) => m.name).sort(), ['きりさく', 'しっぽアタック', 'スナイプファング', 'テイルサイクロン', 'ドラゴンクラッシュ', '幻影クロー', '残影ステップ', '竜眼ロック', '蒼光ブレス', '蒼刃乱舞'].sort());
  // 効果
  const fx = (key, name) => M.movesOf(key).find((m) => m.name === name);
  assert.deepEqual(fx('solamo', 'ほしのまもり').effects.map((e) => [e.target, e.stat, e.dir, e.size, e.turns]), [['self', 'hi', 'up', 'small', 2], ['self', 'ev', 'up', 'small', 2]]);
  assert.deepEqual(fx('solamo', '吠える').effects.map((e) => [e.target, e.stat, e.dir, e.size, e.turns]), [['opponent', 'de', 'down', 'small', 2]]);
  assert.deepEqual(fx('solamo', 'すなかけ').effects.map((e) => [e.target, e.stat, e.dir, e.size, e.turns]), [['opponent', 'hi', 'down', 'small', 2]]);
  assert.deepEqual(fx('gauru', 'ソニックムーブ').effects.map((e) => [e.target, e.stat, e.dir, e.size, e.turns]), [['self', 'hi', 'up', 'small', 2], ['self', 'ev', 'up', 'small', 2]]);
  assert.deepEqual(fx('gauru', '聖なる炎').effects.map((e) => [e.target, e.stat, e.dir, e.size, e.turns]), [['self', 'atk', 'up', 'small', 1], ['self', 'hi', 'up', 'small', 1], ['self', 'ev', 'up', 'small', 1], ['self', 'de', 'up', 'small', 1]], 'ちから・かしこさ（攻撃力）・命中・回避・丈夫さ。ライフと素早さは上げない');
  assert.deepEqual(fx('nobiton', 'はなみず').effects.map((e) => [e.target, e.stat, e.dir, e.size, e.turns]), [['opponent', 'de', 'down', 'small', 1]]);
  assert.deepEqual(fx('nobiton', 'ダウナーミスト').effects.map((e) => [e.target, e.stat, e.dir, e.size, e.turns]), [['opponent', 'atk', 'down', 'medium', 2], ['opponent', 'de', 'down', 'medium', 2]]);
  assert.deepEqual([fx('nobiton', 'ダウナーミスト').ailment.kind, fx('nobiton', 'ダウナーミスト').ailment.chance], ['sleep', 0.2]);
  assert.deepEqual([fx('nobiton', 'しびれ突き').ailment.kind, fx('nobiton', 'しびれ突き').ailment.chance], ['paralysis', 0.3]);
  assert.deepEqual(fx('nobiton', 'ひとやすみ').heal, { lifeRatio: 0.2, cureAilments: true, clearStatChanges: false });
  // 旧仕様の技名は正式技に無い
  const all = ['solamo', 'gauru', 'nobiton'].flatMap((k) => M.movesOf(k).map((m) => m.name));
  for (const old of ['とっしん', 'ドリルアタック', '超スターダストレイ', 'くっつく', 'ピンポイント突き', 'ウイングアタック', 'バードアタック', 'ファイアビーム']) assert.ok(!all.includes(old), old);
  assert.ok(!M.movesOf('gauru').some((m) => m.name === 'ひっかき'), 'ガウルの正式10技に ひっかき は無い');
  // 技辞典の資料（50枚）
  for (const k of ['solamo', 'gauru', 'nobiton', 'jiol', 'regnas']) { const L = M.movesOf(k); assert.equal(L.length, 10, k); for (const m of L) assert.ok(existsSync(path.join(ROOT, m.sheet)), m.sheet); }
  assert.match(rd('assets/moves/README.md'), /しびれ突き/);
});

function loadInstall() {
  const sk = HTML.match(/const SK=(\[.*?\]);/s)[1], eff = HTML.match(/const EFF=(\{.*?\});/s)[1];
  const ctx = vm.createContext({ console });
  ctx.window = ctx; ctx.MMP10M = M;
  vm.runInContext(`var SK=${sk};var EFF=${eff};var SKART=new Array(20).fill(0).map((_,i)=>"art"+i);var SFR={};for(let i=0;i<20;i++)SFR[i]={f:[],id:i};var SKM=new Array(20).fill(0).map((_,i)=>["m"+i]);`, ctx);
  vm.runInContext(rd('js/battle/official-moves.js'), ctx);
  assert.equal(vm.runInContext('MMMOVES.install()', ctx), true);
  return ctx;
}

test('MV-02：ソラモ・ガウルの SK（0〜19）を正式技へ入れ替える。番号（習得の枠）はそのまま・威力＝SK[1]×100・命中・クリティカル・効果（EFF）・旧技の絵の付け替え。SK／EFF の定義の行は変えない', () => {
  const c = loadInstall(), SK = c.SK, EFF = c.EFF;
  const row = (k) => [SK[k][0], Math.round(SK[k][1] * 100), SK[k][8], Math.round(SK[k][9] * 100), SK[k][7]];
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(row), [
    ['たいあたり', 70, 90, 5, 'p'], ['ひっかき', 60, 100, 10, 'p'], ['しっぽアタック', 85, 80, 10, 'p'], ['吠える', 0, 100, 0, 'i'], ['スタークラッシュ', 105, 85, 15, 'p'],
    ['ソラモビーム', 90, 85, 10, 'i'], ['すなかけ', 0, 100, 0, 'i'], ['ほしのまもり', 0, 100, 0, 'i'], ['スターダストレイ', 120, 95, 20, 'i'], ['スターフォール', 140, 85, 25, 'i']]);
  assert.deepEqual([10, 11, 12, 13, 14, 15, 16, 17, 18, 19].map(row), [
    ['スパイラルダイブ', 95, 85, 15, 'p'], ['つつく', 60, 100, 5, 'p'], ['ウィンド', 65, 95, 5, 'i'], ['ソニックムーブ', 0, 100, 0, 'i'], ['紅翼スラッシュ', 110, 90, 15, 'p'],
    ['ファイアボール', 100, 90, 10, 'i'], ['フレアレイ', 120, 90, 15, 'i'], ['スカイラッシュ', 125, 85, 20, 'p'], ['フェザーストーム', 145, 70, 20, 'i'], ['聖なる炎', 115, 90, 15, 'i']]);
  const E = (k) => JSON.parse(JSON.stringify(EFF[k] || null));
  assert.deepEqual(E(3), [{ tg: 1, st: 'de', lv: -1, t: 2 }]);
  assert.deepEqual(E(6), [{ tg: 1, st: 'hi', lv: -1, t: 2 }]);
  assert.deepEqual(E(7), [{ tg: 0, st: 'hi', lv: 1, t: 2 }, { tg: 0, st: 'ev', lv: 1, t: 2 }]);
  assert.deepEqual(E(13), [{ tg: 0, st: 'hi', lv: 1, t: 2 }, { tg: 0, st: 'ev', lv: 1, t: 2 }]);
  assert.deepEqual(E(19), [{ tg: 0, st: 'atk', lv: 1, t: 1 }, { tg: 0, st: 'hi', lv: 1, t: 1 }, { tg: 0, st: 'ev', lv: 1, t: 1 }, { tg: 0, st: 'de', lv: 1, t: 1 }]);
  assert.equal(E(0), null); assert.equal(E(10), null);
  // 旧技の絵の付け替え（VISUAL）
  assert.equal(c.SKART[10], 'art14'); assert.equal(c.SKART[14], 'art16'); assert.equal(c.SKART[16], 'art18'); assert.equal(c.SKART[18], 'art12'); assert.equal(c.SKART[7], 'art8'); assert.equal(c.SKART[0], 'art0');
  assert.equal(c.SFR[10].id, 14); assert.equal(c.SKM[18][0], 'm12');
  // 旧名は SK から消える
  const names = SK.slice(0, 20).map((x) => x[0]);
  for (const old of ['とっしん', 'ドリルアタック', '超スターダストレイ', 'ウイングアタック', 'バードアタック', 'ファイアビーム']) assert.ok(!names.includes(old), old);
  // tier
  assert.deepEqual([0, 4, 9, 7].map((k) => c.MMMOVES.info(k).tier), ['basic', 'strong', 'finisher', 'support']);
  // index.html：起動時に1回・定義の行は変えない（QA-G6 のハッシュ）
  assert.match(HTML, /\nif\(window\.MMMOVES\)MMMOVES\.install\(\);/);
  assert.match(HTML, /<script src="\.\/js\/battle\/official-moves\.js"><\/script>/);
  const JS = rd('js/battle/official-moves.js');
  assert.doesNotMatch(JS, /localStorage|save\(|mr4v6/, 'セーブに触れない');
});

test('MV-03：バトルの共通演出（構え → 溜め → 攻撃動作 → ヒットストップ → 被弾 → ダメージ表示 → 余韻 → ルーレット）。tier の長さ・ずらすタイマーは act() の 720／1500／1900 だけ・視差を減らす設定と自動テストでは使わない・色の加工なし', () => {
  const ctx = vm.createContext({ console, performance, setTimeout, clearTimeout });
  ctx.window = ctx; ctx.matchMedia = () => ({ matches: false });
  vm.runInContext(rd('js/battle/stage.js'), ctx);
  const S = ctx.MMSTAGE, T = S.TIER;
  const len = (t) => T[t].windup + T[t].charge + 1500 / T[t].rate;   // 攻撃の長さ（今までの技の絵＝1.5秒）
  assert.ok(len('basic') >= 900 && len('basic') <= 1350, `基本技 ${len('basic')}`);
  assert.ok(len('strong') >= 1300 && len('strong') <= 1750, `強技 ${len('strong')}`);
  assert.ok(len('finisher') >= 1900 && len('finisher') <= 2700, `必殺級 ${len('finisher')}`);
  assert.ok(T.basic.hs < T.strong.hs && T.strong.hs < T.finisher.hs, 'ヒットストップは強い技ほど長い');
  assert.ok(T.basic.hold > 0 && T.finisher.hold > T.basic.hold, '余韻');
  const JS = rd('js/battle/stage.js');
  assert.match(JS, /if \(ms === 720\) ms = pend\.dmg;/); assert.match(JS, /else if \(ms === 1500 \|\| ms === 1900\)/);
  assert.match(JS, /if \(reduced\(\) \|\| window\.MM_QA_NO_STAGE/);
  assert.doesNotMatch(JS.replace(/\/\/[^\n]*/g, ''), /filter\s*:|style\.filter|hue-rotate|brightness\(|saturate\(/, '色を変える指定は使わない（被弾の光はマスクに白）');
  assert.doesNotMatch(JS, /\.rw\b|\.rl\b|#rl\b|#go\b/, '技ルーレットの CSS に触れない');
  assert.match(JS, /SPECIAL = \{ 7: 'guard', 13: 'sonic', 19: 'holy', 18: 'storm' \}/, '補助技（ほしのまもり・ソニックムーブ）・聖なる炎・フェザーストームは別のテンポ');
  // index.html：anim() の先頭から呼ぶだけ。fight() は変えない（P7-32 のハッシュ）
  assert.match(HTML, /function anim\(k,s\)\{if\(window\.MMSTAGE&&MMSTAGE\.run\(k,s,animRaw\)\)return;animRaw\(k,s\)\}/);
  assert.match(rd('tests/e2e/harness.mjs'), /MM_QA_NO_STAGE = true/);
  const fight = HTML.slice(HTML.indexOf('async function fight('), HTML.indexOf('\n$("#snd").textContent'));
  assert.doesNotMatch(fight, /MMSTAGE|MMMOVES|tourVs/, 'fight() の中には入れない');
});

test('MV-04：技辞典（MMMOVEDEX）の入口＝技管理の技の詳細（技の演出を見る）・技の一覧（技辞典）・研究所の図鑑の詳細。表示だけ（セーブに触れない）', () => {
  assert.match(HTML, /<script src="\.\/js\/battle\/movedex\.js"><\/script>/);
  assert.match(CODE, /MMMOVEDEX\.hasSlot\(k\)\?`<button class="dmvdex" onclick="MMMOVEDEX\.openSlot\(\$\{k\}\)">📖 技の演出を見る（技辞典）<\/button>`/);
  assert.match(CODE, /<button class="dmvall" onclick="MMMOVEDEX\.open\(\$\{m\.sp\}\)">📖 技辞典<\/button>/);
  assert.match(CODE, /<button class="lbmvdex" onclick="MMMOVEDEX\.open\(\$\{i\}\)">📖 技辞典（正式10技）<\/button>/);
  assert.match(CODE, /<span class="dcat">\$\{x\[1\]\?\(x\[7\]=="p"\?"✊ ちから":"📖 かしこさ"\):"✨ 補助"\}<\/span>/, '補助技は「補助」と表示');
  const JS = rd('js/battle/movedex.js');
  assert.doesNotMatch(JS, /localStorage|save\(|mr4v6|S\.m/, '表示だけ');
  assert.match(JS, /状態異常・回復は今のバトルでは未対応/);
});

test('MV-05：UI の修正：フィナの2択「はい／いいえ」・セルジュの確認「はい／いいえ」・プロフィールの「ミスティックモンスターズ」の見出しを出さない・市場の購入確認は正式ボタン（A-19・B-49）。このゲームに「ガッツ」は無い', () => {
  assert.match(CODE, /choices:\[\{id:"yes",label:"はい"\},\{id:"no",label:"いいえ"\}\]/);
  assert.match(CODE, /このお名前で登録してよろしいですか？`,choices:\[\{id:"ok",label:"はい"\},\{id:"fix",label:"いいえ"\}\]/);
  assert.doesNotMatch(CODE, /label:"ちがいます"|label:"この名前で登録する"|label:"書き直す"/);
  assert.match(HTML, /main:has\(>#app>\.pfprof\) h1\{display:none\}/);
  assert.match(HTML, /\.p10shb \.p10ok\{[^}]*b49_button_red_large_ornate\.png/); assert.match(HTML, /\.p10shb \.p10no,\.p10shb \.p10ok\{[^}]*a19_button_blue_ornate_gems\.png/);
  for (const f of ['index.html', 'js/phase10/monsters.js', 'js/battle/official-moves.js', 'js/battle/stage.js', 'js/battle/movedex.js']) assert.doesNotMatch(rd(f).replace(/このゲームに「ガッツ」は無い[^\n]*/g, ''), /ガッツ/, f);
  assert.match(rd('docs/ui-pending.md'), /聖獣士登録/);
});
