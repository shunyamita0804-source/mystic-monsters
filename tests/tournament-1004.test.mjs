// =========================================================
// 第二段階 PHASE D（2026-10-04）：公式大会の画面（ランク選択・大会進行・パラメーター比較・VS・BATTLE START → 実戦）とランクの解放・S クリアの導線（静的）
//  TN-01〜05。画面は tests/qa-e2e-tournament.test.mjs
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const HTML = rd('index.html');
const CODE = HTML.slice(HTML.lastIndexOf('<script>'));
const fnOf = (name) => { const i = CODE.indexOf(`function ${name}(`); return CODE.slice(i, CODE.indexOf('\nfunction ', i + 10)); };

test('TN-01：ランク選択（デザイン参考 01）は従来どおり：S→E の6段・参加可能／参加不可（鎖と錠）・フィナの見立て・「この大会に参加する」・辞退。E・D は最初から、クリアごとに1つ上（RANK_UNLOCK_STEP 1・RANK_FLOOR D）', () => {
  const rc = fnOf('p9RankRow') + fnOf('p9RankListHtml') + fnOf('p9ReceptionHtml'); assert.match(rc, /\[5,4,3,2,1,0\]\.map\(k=>p9RankRow\(m,k,el[,)]/); assert.match(rc, /P9_RS_LABEL\[st\]/); assert.match(rc, /p9RankState\(m,k,el\)/); assert.match(rc, /P9_RANK_IMG\(k\)/);   // 2026-10-05：参加可能／参加不可（鎖と錠）は正式画像   // 2026-10-04 PHASE H：状態（未解放・参加可能・挑戦目標・クリア済）は進行で決まる
  assert.match(HTML, /const P9_RS_LABEL=\{lock:"参加不可",open:"参加可能",next:"参加可能",clear:"クリア済"\};/); assert.match(rc, /参加者 \$\{sz\}体 \/ \$\{sz-1\}試合/);
  assert.doesNotMatch(rc, /PRIZE|推奨|FREE|ランクF/, '賞金・推奨戦力・FREE 大会・F ランクは出さない'); assert.match(rc, /p8TourDecline\(this\)/);
  const R = rd('js/phase8/raising.js'); assert.match(R, /const RANK_UNLOCK_STEP = 1;/); assert.match(R, /const RANK_FLOOR = RANK_D;/);
  assert.match(rd('js/phase8/league.js'), /const LEAGUE_SIZE = Object\.freeze\(\[6, 6, 8, 8, 8, 8\]\);/, 'E・D 6体（5試合）・C〜S 8体（7試合）');
});

test('TN-02：大会1 対戦表（2026-10-07 ADDENDUM2＝最終モック）：題字は「公式ランクX大会」だけ・左に参加者・右に対戦マトリクス（同じ順）・勝ち＝赤○・負け＝青×・未対戦は空欄・自分自身は斜線・プレイヤーの行が光る・次の相手との交点が光る・「対戦する」→ 大会2。試合数の見出し・凡例・「あなた／次の相手」・セドリックは出さない', () => {
  const t = fnOf('p8TourScr');
  for (const s of ['<header class="tbttl"><b>公式ランク${RN[t.rank]}大会</b></header>', '${tbBoardGrid(lg,pm,enter)}', 'onclick="p9CompareScr()" aria-label="対戦する"']) assert.ok(t.includes(s), s);
  assert.doesNotMatch(t, /試合 \/ 全|legend\.png|tag_you|tag_next|p9Ced\(|現在の成績|p9Standings\(|p9Matrix\(|p9VsGo/, '試合数・凡例・札・セドリック・旧い一覧・2度押しは大会1には無い');
  const g = fnOf('tbBoardGrid');
  assert.match(g, /MMP8L\.resultCell\(lg,e\.id,o\.id\)/, '勝敗のマスは大会の処理（resultCell）から');
  assert.match(g, /<i class="tbo" aria-label="勝ち"><\/i>/); assert.match(g, /<i class="tbx" aria-label="負け"><\/i>/); assert.match(g, /c-self/, '自分自身'); assert.match(g, /e\.player\?" rme":e\.id===nx\?" rnx":""/, 'プレイヤーの行（2026-10-07 試遊：次の相手の行は rnx）');
  assert.match(HTML, /\.tb1g\.tbv2 \.tbo\{[^}]*#ff4d5e/); assert.match(HTML, /\.tb1g\.tbv2 \.tbx::before,\.tb1g\.tbv2 \.tbx::after\{[^}]*#4fb4ff/); assert.match(HTML, /\.tb1g\.tbv2 \.c-next\.hot\{/);
});

test('TN-03：大会2 対戦前比較（2026-10-07 刷新）：大会名・第N試合 / 全M試合・左右に待機の立ち絵（相手はこちら向き）と名前・固有スキルの説明・能力の数値と棒（左右で比べる）・「対戦開始」（2度押し）→ 大会3 → fight()・「対戦表にもどる」。セドリックは出さない', () => {
  const c = fnOf('p9CompareScr');
  assert.match(c, /<header class="tbttl"><b>公式ランク\$\{RN\[t\.rank\]\}大会<\/b><\/header>/);
  assert.doesNotMatch(c, /試合 \/ 全/, 'ADDENDUM2：比較画面に試合数は出さない');
  assert.match(c, /tbIdle\(m,0\)/); assert.match(c, /tbIdle\(o,1\)/); assert.match(c, /tbSkillDesc\(m\)/); assert.match(c, /tbSkillDesc\(o\)/);
  assert.match(c, /<b class="pcv">\$\{a\}<\/b><div class="pcb l" style="--c:\$\{STAT_COLOR\[k\]\}"><i style="width:\$\{Math\.round\(a\/mx\*100\)\}%"><\/i><\/div><span class="pcl">\$\{LAB\[k\]\}<\/span><div class="pcb r" style="--c:\$\{STAT_COLOR\[k\]\}"><i style="width:\$\{Math\.round\(b\/mx\*100\)\}%"><\/i><\/div><b class="pcv">\$\{b\}<\/b>/, '能力は数値と棒');
  assert.doesNotMatch(c, /戦力|勝率|有利|p9Ced\(/, '戦力・勝率・有利は出さない・セドリックは出さない');
  assert.match(c, /data-nsfx="1" onclick="p9VsGo\(this\)" aria-label="対戦開始"/); assert.match(c, /onclick="board\(\)" aria-label="対戦表にもどる"/);
  assert.match(CODE, /function p9VsGo\(b\)\{if\(bBusy\|\|!p9arm\(b,"もう一度押すと試合開始"\)\)return;/, '2度押し → 大会3 → fight()');
  assert.match(fnOf('tbIdle'), /MMARENA\.idleSrc\(x\.sp\)/); assert.match(fnOf('tbIdle'), /MMARENA\.flipOf\(side,x\.sp\)/);
  assert.match(fnOf('tbSkillDesc'), /MMP10M\.skillText\(x\.sp\)/); assert.match(fnOf('tbSkillDesc'), /p11Esc\(k\.desc\|\|""\)/);
});

test('TN-03b：大会3 VS 演出（正式素材 vs）：背景・VS のロゴ・斜めの光・名前の札・飾り＋待機の立ち絵（相手はこちら向き）→ fight()。fight() の導入（intro）はこの試合だけ出さない（二重の VS にしない）。fight()・intro() の中身は変えない', () => {
  const v = CODE.slice(CODE.indexOf('function tourVsShow('), CODE.indexOf('function tourVsOut('));
  assert.ok(v.includes('${TB_VENUE('), '2026-10-07 追補便：VS の背景はそのランクの正式の会場（venue_E〜S）'); for (const f of ['vs/vs_diagonal.png', 'vs/vs_nameplate.png', 'vs/vs_ornament.png', 'vs/vs_logo.png']) { assert.ok(v.includes(f), f); assert.ok(existsSync(path.join(ROOT, 'assets/tournament', f)), f); }
  assert.match(v, /p11Esc\(o\.name\)/); assert.match(v, /p11Esc\(m\.name\)/); assert.match(v, /tbIdle\(o,1\)/); assert.match(v, /tbIdle\(m,0\)/);
  assert.match(CODE, /const TB_INTRO=intro;intro=function\(pl\)\{if\(TB_SKIP_INTRO\)\{TB_SKIP_INTRO=false;return Promise\.resolve\(\)\}return TB_INTRO\(pl\)\};/);
  assert.match(CODE, /if\(window\.MM_QA_NO_TOURVS\|\|!t\|\|t\.status!="league"\)return p8TourFight\(\);/, '自動テストの既定は大会2 から直接バトル（tourvs:true で大会3）');
});

test('TN-04：VS（デザイン参考 04）＝fight() の導入（CHALLENGER／YOUR MONSTER・VS・自動で FIGHT!）。fight()・intro()・.bt 系 CSS は変えず、色（金の VS・札）だけ', () => {
  assert.match(HTML, /\.ivs b\{[^}]*color:#ffe08a;/); assert.match(HTML, /\.inm small\{display:inline-block;padding:2px 10px;border-radius:4px;/);
  const intro = CODE.slice(CODE.indexOf('async function intro(pl){'), CODE.indexOf('\nasync function fight('));
  assert.match(intro, /CHALLENGER/); assert.match(intro, /YOUR MONSTER/); assert.match(intro, /setTimeout\(fin,3100\)/, '約3.1秒・タップで飛ばせる（変えていない）');
  assert.match(CODE, /ban\(lb,"#ffffff"\);await sleep\(1000\);ban\("FIGHT!","#ff5a3a"\);sfx\(3\);/, 'BATTLE START＝大会名の帯 → FIGHT!（fight() のまま）');
});

test('TN-05：S ランク制覇＝Chapter 5 の解放フラグ（S.npcFlags.chapter5）と「新たな道が開かれた」の表示だけ。Chapter 5 の画面・ボードは作らない', () => {
  assert.match(fnOf('p8AfterBattle'), /if\(f\.settled&&f\.won&&S\.m&&S\.m\.raise&&S\.m\.raise\.tour&&S\.m\.raise\.tour\.rank===5&&!finaFlags\(\)\.chapter5\)\{finaFlags\(\)\.chapter5=1;save\(\)\}/);
  assert.match(fnOf('p9TourResult'), /t\.rank===5\?`<div class="p9newroad"><b>S ランク制覇！<\/b><span>新たな道が開かれた…（Chapter 5 は準備中）<\/span><\/div>`:""/);
  assert.doesNotMatch(CODE, /chapter5Scr|function ch5|Chapter 5 へ出発/, 'Chapter 5 の画面は無い');
  assert.doesNotMatch(rd('js/phase8/raising.js'), /chapter5/, '解放の記録は画面側の任意項目だけ（セーブの形は変えない）');
});
