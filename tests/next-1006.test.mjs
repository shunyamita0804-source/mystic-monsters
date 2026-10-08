// =========================================================
// 追加修正（2026-10-06）：Chapter 1 のマスの並び・新人支援（1000G＋薬草）・初期所持金・TEST 大会・会話の読む間・禁則・世界地図の倍率
//  N6-01〜07（画面は tests/qa-e2e-next-1006.test.mjs・qa-e2e-next-1005.test.mjs の OP-B1／OP-B3）
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const HTML = rd('index.html');
const fnOf = (name) => { const i = HTML.indexOf(`function ${name}(`); assert.ok(i > 0, name); return HTML.slice(i, HTML.indexOf('\nfunction ', i + 10)); };
const load = (f, name) => { const w = {}; new Function('window', 'document', rd(f))(w, undefined); return w[name]; };

test('N6-01：Chapter 1 のマス＝隣のマスまでの画面の距離 ÷ マスの大きさがどの背景でもそろう（奥で重ならない）。ゴールは大会会場の門の石段の前', () => {
  let cfg; const w = { MMCH: { registerConfig: (c) => { cfg = c; } } };
  new Function('window', rd('js/chapter/configs/ch1a.js'))(w);
  const D = [[0.98, 1.22], [0.9, 1.1], [0.84, 1], [0.72, 0.84], [0.6, 0.62], [0.535, 0.5], [0.47, 0.4], [0.425, 0.34], [0.38, 0.28], [0.3, 0.2]];
  const dep = (y) => { if (y >= D[0][0]) return D[0][1]; for (let i = 1; i < D.length; i++) if (y >= D[i][0]) { const a = D[i - 1], b = D[i]; return b[1] + (a[1] - b[1]) * (y - b[0]) / (a[0] - b[0]); } return D[D.length - 1][1]; };
  const h = (y) => Math.pow(dep(y), 0.9);
  for (const p of cfg.paths) {
    if (p.nodePts.length < 3) continue;
    const r = []; for (let i = 1; i < p.nodePts.length; i++) { const a = p.nodePts[i - 1][1], b = p.nodePts[i][1]; r.push((a - b) / ((h(a) + h(b)) / 2)); }
    assert.ok(Math.max(...r) - Math.min(...r) < 0.01, `${p.id}：間隔がそろう（${r.map((x) => x.toFixed(3)).join(' ')}）`);
  }
  const g = cfg.paths.find((p) => p.goal), goal = g.nodePts[g.nodePts.length - 1];
  assert.ok(goal[1] >= 0.67 && goal[1] <= 0.69 && Math.abs(goal[0] - 0.5) < 0.02, `ゴール（${goal}）＝門の石段の前（道の中央）`);
});

test('N6-02：新人支援＝聖獣士登録のあと1回だけ 1000G＋薬草×1（受け取りの記録と同時に確定して保存）。新しいゲームは 0G・市場は 500G のまま', () => {
  const M = load('js/phase10/monsters.js', 'MMP10M');
  assert.deepEqual({ ...M.ECONOMY }, { initialGold: 0, marketPrice: 500 });
  assert.match(HTML, /const SUPPORT=Object\.freeze\(\{gold:1000,item:"herb"\}\);/);
  const g = fnOf('grantSupport'); assert.ok(g.indexOf('f.support=1') < g.indexOf('save()'), '記録・所持金・薬草を確定してから保存');
  const S = { g: 0, inv: { bag: [], vault: [] }, npcFlags: {} }; let saves = 0;
  const run = new Function('S', 'finaFlags', 'MMP7', 'save', 'SUPPORT', `${g}\nreturn grantSupport;`)(S, () => S.npcFlags, { bagAdd: (s, id) => { s.inv.bag.push({ id }); return { ok: true }; } }, () => saves++, { gold: 1000, item: 'herb' });
  assert.equal(run(), true); assert.equal(run(), false, '2回目は受け取らない'); assert.equal(run(), false);
  assert.deepEqual([S.g, S.inv.bag.map((i) => i.id), S.npcFlags.support, saves], [1000, ['herb'], 1, 1]);
  assert.match(fnOf('opAfterReg'), /if\(grantSupport\(\)\)await talkSeq\(OPEN_TALK\.support\(n\)/, '登録の直後（セルジュ）。受け取り済みなら会話も出さない。2026-10-05 PHASE B：受け取りの知らせはシステム通知の帯（talkSeq の note）');
  assert.match(HTML, /MMP7\.registerItem\(\{id:"herb",name:"薬草"\}\);if\(window\.MMCH\)MMCH\.registerFatigueItem\("herb",\{amount:30\}\);/, '薬草＝疲れ −30');
});

test('N6-03：TEST 大会＝TEST_MODE の1か所で入口ごと消せる。大会の間は保存しない。終わり・辞退・中断・放棄・メニューで始める前のセーブへ戻す', () => {
  assert.match(HTML, /\nconst TEST_MODE=(true|false);/, '2026-10-08（監査 L-37）：値は固定しない（リリースで false にしてもテストが落ちない）。false の挙動は AF-06');
  assert.equal((HTML.match(/onclick="testTour\(\)"/g) || []).length, 1); assert.match(HTML, /\$\{TEST_MODE&&!S\.playerNamePending\?`<button class="ttest" onclick="testTour\(\)"/, 'ボタンは TEST_MODE のときだけ');
  assert.match(fnOf('testTour'), /^function testTour\(\)\{if\(!TEST_MODE\|\|TEST_TOUR\|\|S\.playerNamePending\)return;const snap=JSON\.stringify\(S\);/, 'TEST_MODE が false なら何もしない・始める前のセーブを控える');
  assert.match(fnOf('save'), /^function save\(\)\{if\(P8_LOAD\.locked\|\|TEST_TOUR\)return;/, 'TEST 大会の間は保存しない');
  for (const f of ['p8AfterChapterEnd', 'p8Suspend', 'p8AbandonAsk']) assert.match(fnOf(f), /\{if\(testTourEnd\(\)\)return;/, `${f}：TEST 大会なら控えたセーブへ戻して街へ`);
  assert.match(fnOf('testTourEnd'), /S=JSON\.parse\(snap\);lobby\(/);
  // TEST_MODE を false にしたら入口が出ない（街の描画の式を評価する）
  const expr = HTML.match(/\$\{(TEST_MODE&&!S\.playerNamePending\?`<button class="ttest"[^`]*`:"")\}/)[1];
  assert.equal(new Function('TEST_MODE', 'S', `return ${expr};`)(false, {}), '', 'リリース（TEST_MODE false）では何も出さない');
  assert.match(new Function('TEST_MODE', 'S', `return ${expr};`)(true, {}), /TEST 大会/);
});

test('N6-04：会話＝タップで全文を出した直後0.3秒は次へ進まない（読む間）。自動では進まない（Chapter のフィナの吹き出しは自動テストだけ時間で進む）', () => {
  const N = rd('js/npc/npc.js');
  assert.match(N, /const READ_GUARD_MS = 300;/);
  assert.match(N, /if \(waiting\(\)\) return 'choice';[^\n]*\n\s*if \(t - \(st\.fullTap \|\| -1e9\) < READ_GUARD_MS\) return 'ignored';/);
  assert.match(rd('js/chapter/field-view.js'), /const t = root\.MM_QA_FINA_AUTO \|\| root\.MM_QA_NO_STORY \? setTimeout\(ok, ms\) : null;/);
});

test('N6-05：禁則＝プロローグは句読点・閉じ括弧を前の文字に・開き括弧を次の文字に付けたまとまりで折り返す（最後の1文字だけで改行しない）。会話・案内は line-break:strict（2026-10-06 試遊修正：text-wrap:pretty は Safari で行が早く折り返されるため使わない）', () => {
  const P = load('js/prologue/prologue.js', 'MMPRO');
  assert.deepEqual(P.kinsoku('世界を救った。'), ['世', '界', 'を', '救っ', 'た。']);
  assert.deepEqual(P.kinsoku('「聖獣」と共に――'), ['「聖', '獣」', 'と', '共', 'に――']);
  for (const s of P.SLIDES) for (const pg of s.pages) for (const t of pg) for (const u of P.kinsoku(t)) assert.ok(!/^[。、！？…―」』）]/.test(u), `行頭に句読点を置かない：${u}`);
  assert.match(HTML, /\.mmpro-u \.mpw\{white-space:nowrap\}/);
  assert.match(HTML, /\.mmtalk-text\{[^}]*line-break:strict;text-wrap:wrap;/);
  assert.match(HTML, /#app :is\(\.dlg,#msg,\.kbub,\.fbub,\.dmsg,\.dbub,\.gssay,\.vgsay,\.elsay,\.p9ced,\.chf-fina\)\{line-break:strict;text-wrap:wrap\}/);
});

test('N6-06：世界地図（序盤の会話）は世界の全体が見える倍率（寄りすぎない）。案内している地点は光（地方）・光点とリング（町）', () => {
  const M = load('js/opening/worldmap.js', 'MMMAP');
  for (const k of ['ferna', 'asteria', 'liberna', 'mistoria']) assert.equal(M.SPOTS[k].z, 1, k);
  assert.match(HTML, /@keyframes wmPulse\{0%,100%\{filter:brightness\(1\)\}50%\{filter:brightness\(1\.45\)\}\}/);
});

test('N6-07：ベースキャンプにダンは常設しない・「出発する」は下のバーから少し上。街の名札「ミストリア」は正式デザインの名札（.tcity・2026-10-05 PHASE B）', () => {
  const f = fnOf('fmScr');
  assert.doesNotMatch(f, /fmdan|kdan|bcomm\(\)/);
  assert.match(HTML, /#app \.fm\.bc \.bcgo\{bottom:calc\(var\(--bcbar\) \+ 72px \+ env\(safe-area-inset-bottom,0px\)\)\}/, '2026-10-05 試遊：さらに上へ（40 → 72px）');
  assert.match(HTML, /<div class="tcity" aria-label="現在地：ミストリア"><img class="tcity-img" src="\$\{TOWN_NAMEPLATE\}" alt="ミストリア"/, '2026-10-05 正式素材：名札は正式画像（.fmplq の流用はやめた）');
  assert.match(HTML, /const TOWN_NAMEPLATE="\.\/assets\/ui\/recovery_1006\/town\/nameplate_mistria\.png";/, '2026-10-07 正式UI回収：ZIP 095601 の名札'); assert.match(HTML, /#app \.map\.town \.tcity\{[^}]*aspect-ratio:400\/204;/, '縦横比のまま'); assert.doesNotMatch(HTML, /fmplq tplace/);
});

test('N6-08（2026-10-06 試遊修正）：会話の本文は「語＋うしろの助詞」のまとまりで折り返す（語の途中・助詞の前・句読点の前で切らない・最後の1文字だけの行を作らない）', () => {
  const N = load('js/npc/npc.js', 'MMNPC');
  const g = (t) => N.phraseGroups(t).map((x) => x.join(''));
  const a = g('アルトさんのような新人の聖獣士には、管理局から支援をお渡ししています。');
  assert.equal(a.join(''), 'アルトさんのような新人の聖獣士には、管理局から支援をお渡ししています。', '文字は変えない');
  assert.ok(a.includes('聖獣士には、'), `語の途中で切らない：${a.join('|')}`);
  assert.ok(a.includes('お渡ししています。'), `「お」は次の語に・句読点は前に：${a.join('|')}`);
  for (const u of a) assert.ok(!/^[のにはをがでとも、。！？]/.test(u), `助詞・句読点で始まらない：${u}`);
  const b = g('育成を始めるときは、街の下の「ベースキャンプ」から。準備ができたら行ってみよう！');
  assert.ok(b.some((u) => u.startsWith('「ベースキャンプ」')), `開き括弧は次・閉じ括弧は前：${b.join('|')}`);
  for (const t of ['はい', 'あ', '一行目\n二行目']) assert.equal(g(t).join(''), t);
  assert.ok(g('一行目\n二行目').some((u) => u === '\n'), '改行はそのまま');
  for (const u of g('ああああああああああああああああああああああああああああああ')) assert.ok(u.length <= 14, 'とても長い語は分ける（窓からはみ出さない）');
});
