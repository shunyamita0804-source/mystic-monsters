// 2026-10-15：新しいパラメーター比較画面（A）・フルーネの技カード10枚（B）・QA 試遊モード（C）
//  CQ-01 比較画面の肩上アップ6枚（派生 640×640・原本の sha256 は納品の 04_Assets_Manifest と一致・番号 → 絵）・固定の数値なし・999 の尺度・正式6色
//  CQ-02 流れ：大会＝比較（MMCMP.html・公式の会場）→ p9VsGo → そのままバトル／野生・レア・ライバル＝比較の重ね画面（MMCMP.overlay・野外）→ バトル。独立した VS の画面は呼ばない
//  CQ-03 フルーネの技カード10枚（番号・名前・ファイル・README の原本の sha256）・既存の50枚の対応は不変（SK の番号にフルーネは入らない）
//  CQ-04 QA 試遊モード：?mmQaTrial=1 のときだけ・通常のセーブのキーだけを止める・6体×10技＝実戦 50（ジオル＝2026-10-15 正式10技）／プレビュー 10（フルーネ）／静止画 0
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (f) => readFileSync(path.join(ROOT, f), 'utf8');
const HTML = rd('index.html');
const J = (x) => JSON.parse(JSON.stringify(x));
const sha = (f) => createHash('sha256').update(readFileSync(path.join(ROOT, f))).digest('hex');
function webpSize(f) {
  const b = readFileSync(path.join(ROOT, f));
  assert.equal(b.toString('ascii', 8, 12), 'WEBP', f);
  const k = b.toString('ascii', 12, 16);
  if (k === 'VP8X') return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
  if (k === 'VP8 ') return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
  if (k === 'VP8L') { const v = b.readUInt32LE(21); return [1 + (v & 0x3fff), 1 + ((v >> 14) & 0x3fff)]; }
  throw new Error(f + ' ' + k);
}
const ctxWith = (files, extra = {}) => { const ctx = { console, ...extra }; ctx.window = ctx; ctx.globalThis = ctx; vm.createContext(ctx); for (const f of files) vm.runInContext(rd(f), ctx); return ctx; };
const fnOf = (name) => { const i = HTML.indexOf('function ' + name + '('); assert.ok(i > 0, name); return HTML.slice(i, HTML.indexOf('\nfunction ', i + 10)); };

test('CQ-01：比較画面の肩上アップ6枚（番号 → 絵・派生 640×640・原本の sha256）・固定の数値なし・999 の尺度・正式6色', () => {
  const C = ctxWith(['js/phase10/monsters.js', 'js/battle/compare.js']).MMCMP;
  const want = { 0: 'solamo', 1: 'gauru', 2: 'nobiton', 3: 'jiol', 4: 'regnas', 5: 'flurene' };
  // 納品の 04_Assets_Manifest.txt（原本 1254×1254 の RGBA 透過 PNG）
  const orig = { solamo: 'fdc7a21b6cdb9438c75f6f7d4f7fda76c6b130492ead9bd6f26c8fb78f869f76', gauru: '3cfa3894b589492d05fccc421392ff936faf55c0390a74a78e60260a80d56d39',
    nobiton: '852234ecf910718627fa6c5929f575692a4366641c094ecc963ce6d6e732ac51', jiol: 'd86d34dd047010744848e55976b781122b157e8bced41771668c0df5d6c0eed3',
    regnas: 'b8ad1a9764a14d6f7d04ef61f0fa6162a4ab1108a79a1592f296a3819d4e0882', flurene: '76baf7789377e1bfccf0e7a281f020c74bf0b7adf95e33daa11903004789b3bf' };
  const md = rd('assets/monsters/compare_1015/README.md');
  for (const [sp, k] of Object.entries(want)) {
    assert.equal(C.PORTRAIT[sp].f, k, `番号 ${sp} → ${k}（6枚目＝フルーネ）`);
    const f = `assets/monsters/compare_1015/${k}.webp`;
    assert.equal(C.src(+sp), './' + f); assert.deepEqual(webpSize(f), [640, 640], f);
    assert.ok(md.includes(orig[k]), `${k}：原本の sha256`); assert.ok(md.includes(sha(f)), `${k}：派生の sha256`);
  }
  // 2026-10-17：6＝ラズック（バトル待機の参考画像の上の部分＝tools/razuck1017/derive_art.py の派生・QA だけ）
  assert.equal(C.PORTRAIT[6].f, 'razuck'); assert.deepEqual(webpSize('assets/monsters/compare_1015/razuck.webp'), [640, 640]);
  assert.equal(JSON.parse(rd('tools/razuck1017/derive_art.json')).derived['assets/monsters/compare_1015/razuck.webp'], sha('assets/monsters/compare_1015/razuck.webp'));
  // 2026-10-18：7＝カルシェル（専用の肩上アップは未納＝正式の待機絵の顔を中心に切った代替・tools/kalshell1018/derive_art.py・QA だけ）
  assert.equal(C.PORTRAIT[7].f, 'kalshell'); assert.deepEqual(webpSize('assets/monsters/compare_1015/kalshell.webp'), [640, 640]);
  assert.equal(JSON.parse(rd('tools/kalshell1018/derive_art.json')).derived['assets/monsters/compare_1015/kalshell.webp'], sha('assets/monsters/compare_1015/kalshell.webp'));
  // 2026-10-19：8＝ミュロル（専用の肩上アップは未納＝正式の待機絵の顔の周りを切った代替・tools/myurol1019/derive_art.py・QA だけ）
  assert.equal(C.PORTRAIT[8].f, 'myurol'); assert.deepEqual(webpSize('assets/monsters/compare_1015/myurol.webp'), [640, 640]);
  assert.equal(JSON.parse(rd('tools/myurol1019/derive_art.json')).derived['assets/monsters/compare_1015/myurol.webp'], sha('assets/monsters/compare_1015/myurol.webp'));
  assert.equal(C.src(9), null, '肩上アップの無い番号は null（待機の立ち絵へ）');
  assert.ok(!existsSync(path.join(ROOT, 'assets/monsters/compare_1015/01_CompareLayout_Reference.png')), 'レイアウトの見本はゲームに置かない');
  const js = rd('js/battle/compare.js');
  assert.doesNotMatch(js, /\b(159|130|108|109|127|126)\b/, '見本の数値を固定で出さない');
  assert.equal(C.MAX, 999); assert.equal(C.width(999), 100); assert.equal(C.width(0), 0); assert.equal(C.width(1500), 100);
  const sc = HTML.match(/const STAT_COLOR=(\{[^}]*\})/)[1].toLowerCase();
  for (const c of ['#f2c14e', '#d9534f', '#5cb85c', '#f06292', '#7fd4e8', '#4c7bd9']) { assert.ok(sc.includes(c)); assert.ok(js.toLowerCase().includes(c), c); }
  assert.match(js, /\.cmp2 \.c2side\.op img\{transform:scaleX\(-1\)\}/, '右（相手）は CSS で左右反転＝ファイルは反転しない');
  assert.deepEqual([0, 1, 2, 3, 4, 5].map((s) => C.skillName(s)), ['逆境のひと踏ん張り', '紅翼の猛攻', 'ふしぎな嗅覚', '大地の守り', '蒼銀の反撃', '生命の芽吹き'], '固有スキルは名前だけ');
  assert.doesNotMatch(js, /\.desc\b/, '説明の長文は出さない');
});

test('CQ-02：流れ＝比較 →「対戦開始」→ バトル（大会・野生・レア・ライバル）。独立した VS の画面と fight() の導入は出さない', () => {
  const cmp = fnOf('p9CompareScr');
  assert.match(cmp, /MMCMP\.html\(\{cls:"p9cmps",bg:TB_ARENA\(t\.rank\),sub:`公式ランク\$\{RN\[t\.rank\]\}大会`,me:cmpSide\(m,m\.name\),op:cmpSide\(o,p9Short\(lg,pm\.opp\)\)/, '大会：公式の会場・実際の6能力');
  assert.match(cmp, /go:\{cls:"p9btn p9go pcgo tbstart",onclick:"p9VsGo\(this\)"\}/); assert.match(cmp, /bgm\("matchup"\)/, '大会の比較の曲は従来どおり');
  const go = HTML.slice(HTML.indexOf('function p9VsGo('), HTML.indexOf('const TB_INTRO=intro;'));
  assert.match(go, /TB_SKIP_INTRO=true;[^\n]*p8TourFight\(\)\}/); assert.doesNotMatch(go, /tourVsShow\(/);
  const bg = fnOf('bBattleGo');
  assert.match(bg, /document\.getElementById\("cmp"\)\|\|MMP8\.boardPhase\(m\)!=="battle"\)return;/, '比較の重ね画面の間は二重に始めない');
  assert.match(bg, /MMCMP\.overlay\(\{bg:\(window\.MMARENA&&MMARENA\.fieldSrc&&MMARENA\.fieldSrc\(m\.raise&&m\.raise\.ch\)\)\|\|TB_VENUE\(rk\),sub:PRACTICE_LABEL\[bt\]/, '練習試合：野外の背景・試合の種類');
  assert.match(bg, /ov=\(window\.MMP8L&&MMP8L\.PROVISIONAL_OPPONENT_STAT\[rk\]\)\|\|0/, '相手の6能力＝fight() が作る相手と同じランクの値');
  assert.match(bg, /osp=bt=="rival"\?4:/, 'ライバル＝レグナス（4）の肩上アップ');
  assert.match(bg, /ui\.pressed\.then\(\(\)=>\{bBusy=false;try\{MMAUDIO\.stopBgm\(\{fade:"quick"\}\)\}catch\(e\)\{\}/, '「対戦開始」でボードの曲を止める（⑧）');
  assert.match(bg, /TB_SKIP_INTRO=true;[^\n]*bBattleRun\(m,bt,rk,fs\)/); assert.doesNotMatch(bg, /tourVsShow\(/);
  assert.match(fnOf('cmpShown'), /MMFEEL\.emit\("battle\.matchup"\)/, '旧 VS の正式 SE は比較画面の VS の飾りで1回');
  assert.match(HTML, /function tourVsShow\(/, 'VS の画面の関数・素材は残す（通常の流れからは外した）');
  assert.match(HTML, /<script src="\.\/js\/battle\/compare\.js"><\/script>/);
});

test('CQ-03：フルーネの技カード10枚（番号・名前・ファイル・原本の sha256）・既存の50枚の対応は不変', () => {
  const ctx = ctxWith(['js/phase10/monsters.js', 'js/battle/move-cards.js']);
  const C = ctx.MMMVCARD, F = ctx.MMP10M.pendingSpecies('flurene');
  const L = J(C.list('flurene'));
  const names = ['つるうち', 'たねとばし', 'はなのかおり', 'ねっこのまもり', 'こんさいプレス', 'ブルームレイ', 'しばりづる', 'はなかげのまい', 'ルートドレイン', 'ルートテンペスト'];   // 2026-10-16：09 の新しい名前（カードの絵とファイル名 inochi_no_shizuku は旧のまま）
  const ids = ['tsuruuchi', 'tane_tobashi', 'hana_no_kaori', 'nekko_no_mamori', 'konsai_press', 'bloom_ray', 'shibari_zuru', 'hanakage_no_mai', 'root_drain', 'root_tempest'];   // 2026-10-16：09 のカードを差し替え（技ID root_drain）
  assert.deepEqual(L.map((x) => x.no), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]); assert.deepEqual(L.map((x) => x.name), names); assert.deepEqual(L.map((x) => x.id), ids);
  assert.deepEqual(J(F.moves).map((x) => x.name), names, '登録の技の名前の並びと同じ');
  assert.deepEqual(J(F.moves).map((x) => x.id), ids, '2026-10-18 REV3：正式10技の ID＝技カードの ID と同じ');
  assert.deepEqual(J(F.moves).map((x) => x.slot), [50, 51, 52, 53, 54, 55, 56, 57, 58, 59], '2026-10-18 REV3：正式10技＝SK 50〜59');
  assert.ok(L.every((x) => x.slot === null), 'この読み込み（index.html の SK が無い）では SK の番号なし');
  const md = rd('assets/moves/cards_1014/README.md').split('## カルシェル')[0].split('## フルーネ')[1];   // 2026-10-18：カルシェルの節は tests/kalshell-1018.test.mjs
  L.forEach((x, i) => { const f = `assets/moves/cards_1014/flurene/${String(i + 1).padStart(2, '0')}_${ids[i]}.webp`; assert.equal(x.src, './' + f); assert.deepEqual(webpSize(f), [640, 360], f); assert.ok(md.includes(i === 8 ? '03_Fulune_09_RootDrain_Card_Absorb.png' : `FLURENE_${String(i + 1).padStart(2, '0')}_${ids[i]}.png`), f); });
  assert.equal((md.match(/\b[0-9a-f]{64}\b/g) || []).length, 10);
  // 既存の50枚：SK の番号 → カード（ソラモ・ガウル 0〜19・レグナス 20〜29・ノビトン 30〜39）は変えていない＝フルーネは入らない
  const n = { solamo: 0, gauru: 0, regnas: 0, nobiton: 0 };
  for (let k = 0; k < 40; k++) { const c = C.bySlot(k); assert.ok(c, 'SK ' + k); assert.notEqual(c.sp, 'flurene'); n[c.sp]++; assert.ok(existsSync(path.join(ROOT, c.src.replace(/^\.\//, ''))), c.src); }
  assert.deepEqual(n, { solamo: 10, gauru: 10, regnas: 10, nobiton: 10 });
  assert.equal(J(C.list('jiol')).filter((x) => x.src).length, 10, 'ジオルの10枚（2026-10-15 から SK 40〜49）');
});

test('CQ-04：QA 試遊モード＝?mmQaTrial=1 のときだけ・通常のセーブのキーだけ止める・7体×10技（実戦 70＝2026-10-18 REV3 フルーネ正式10技）', () => {
  const load = (search, fl = true) => ctxWith(['js/phase10/monsters.js', 'js/battle/move-cards.js'].concat(fl ? ['js/battle/flurene-moves-data.js'] : [], ['js/qa/trial.js']), { location: { search }, URLSearchParams });
  assert.equal(load('').MMQA.ENABLED, false, '普段の URL では何も出さない');
  assert.equal(load('?mmQaTrial=0').MMQA.ENABLED, false);
  const ctx = load('?mmQaTrial=1'); const Q = ctx.MMQA;
  assert.equal(Q.ENABLED, true); assert.equal(Q.isOn(), false, '開いただけでは OFF（ON は切り替えを押したとき）');
  assert.equal(Q.battle(0, 1), false, 'OFF のときは QA 試合を始めない（通常のセーブの S を触らない）'); assert.equal(Q.endBattle(), undefined);
  for (const k of ['mr4v6', 'mr4', 'mr4s1', 'mr4s3', 'mr4s2t', 'mr4ng']) assert.ok(Q.SAVE_KEY_RE.test(k), k + '：通常のセーブ（止める）');
  for (const k of ['mr4a', 'mmaudio', 'mmvoice', 'mmcrowd', 'mmbattleui', 'mr4v6x']) assert.ok(!Q.SAVE_KEY_RE.test(k), k + '：設定（止めない）');
  // SK（index.html の技の表）があるときの状態：ソラモ・ガウル 0〜19・レグナス 20〜29・ノビトン 30〜39・ジオル 40〜49（2026-10-15）
  ctx.SK = Array.from({ length: 90 }, (_, i) => ['技' + i]);   // 2026-10-17：60〜69＝ラズック・2026-10-18 REV3：50〜59＝フルーネの正式10技・2026-10-18：70〜79＝カルシェル・2026-10-19：80〜89＝ミュロル
  const cat = J(Q.catalog());
  assert.deepEqual(cat.map((x) => x.key), ['solamo', 'gauru', 'nobiton', 'jiol', 'regnas', 'flurene', 'razuck', 'kalshell', 'myurol']);
  assert.ok(cat.every((x) => x.moves.length === 10 && x.moves.every((m) => m.src)), '9体×10技＝90 のカード（2026-10-17：ラズック・2026-10-18：カルシェル・2026-10-19：ミュロル）');
  assert.deepEqual(J(Q.counts()), { battle: 90, preview: 0, static: 0, total: 90 });
  assert.deepEqual(cat[8].moves.map((m) => [m.status, m.slot]), Array.from({ length: 10 }, (_, i) => ['battle', 80 + i]), '2026-10-19：ミュロル＝正式10技で実戦（SK 80〜89・QA だけ）');
  assert.deepEqual(cat[7].moves.map((m) => [m.status, m.slot]), Array.from({ length: 10 }, (_, i) => ['battle', 70 + i]), '2026-10-18：カルシェル＝正式10技で実戦（SK 70〜79・QA だけ）');
  assert.deepEqual(cat[6].moves.map((m) => [m.status, m.slot]), Array.from({ length: 10 }, (_, i) => ['battle', 60 + i]), '2026-10-17：ラズック＝正式10技で実戦（SK 60〜69・QA だけ）');
  assert.deepEqual(cat[3].moves.map((m) => [m.status, m.slot]), Array.from({ length: 10 }, (_, i) => ['battle', 40 + i]), '2026-10-15：ジオル＝正式10技で実戦（SK 40〜49）');
  assert.deepEqual(cat[5].moves.map((m) => [m.status, m.slot]), Array.from({ length: 10 }, (_, i) => ['battle', 50 + i]), '2026-10-18 REV3：フルーネ＝正式10技で実戦（SK 50〜59・QA だけ）');
  assert.deepEqual(cat[5].moves.map((m) => [m.anim.bodies, m.anim.effects, m.anim.wait]), [[4, 4, false], [4, 4, false], [4, 4, false], [4, 4, false], [5, 5, false], [4, 4, false], [4, 4, false], [4, 4, false], [4, 2, true], [5, 0, true]], '本体・効果の枚数（09・10＝FX追加待ち）');
  { const c0 = load('?mmQaTrial=1', false); c0.SK = ctx.SK; assert.ok(J(c0.MMQA.catalog())[5].moves.every((m) => m.status === 'battle'), '2026-10-18 REV3：技アニメのデータが読めなくても正式10技（SK 50〜59）で実戦できる'); }
  const qa = rd('js/qa/trial.js');
  assert.match(qa, /qs\.get\('mmQaTrial'\) === '1'/); assert.match(qa, /未実装／要仕様確認/);
  assert.doesNotMatch(qa, /localStorage\.setItem|sessionStorage\.setItem|indexedDB/, 'QA は何も保存しない');
  assert.match(qa, /rank: FOE\.rank/, 'テスト相手＝ランク E の練習試合の相手'); assert.match(qa, /const FOE = Object\.freeze\(\{ sp: 0, rank: 0 \}\);/);
  assert.match(HTML, /<script src="\.\/js\/qa\/trial\.js"><\/script>/);
  assert.deepEqual(HTML.split('\n').filter((l) => l.length < 50000 && !l.includes('src="./js/qa/trial.js"') && !l.includes('src="./js/qa/battle-stage.js"') && /mmQaTrial|MMQA/.test(l)), [], 'index.html は読み込むだけ（本番の画面のコードに QA の分岐を足していない。画像データの長い行は除く）');
  // 本番の表は変えていない（レグナス＝ライバル専用・フルーネ＝未解禁）
  const M = ctx.MMP10M;
  assert.deepEqual(J(M.SPECIES.map((s) => s.id)), [0, 1, 2, 3]); assert.equal(M.rivalMonster('regnas').playerAvailable, false); assert.equal(M.pendingSpecies('flurene').unlocked, false);
});
