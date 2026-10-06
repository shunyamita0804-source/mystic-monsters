// =========================================================
// 2026-10-03 品質向上（アプリ品質への全面クオリティアップ）
//  QU-01 プロローグ A〜E（js/prologue/prologue.js）／QU-02 街の札・聖獣士管理局・アイテム屋／QU-03 立ち絵つきの一言（フィナ・ヴァルガス・ニック・エリオット）とフィナの全身
//  QU-04 研究所・アイテム屋・牧場の画面／QU-05 対戦前の画面を1つに・バトルの UI（Phase 6 に触れない）／QU-06 はじめから → タイトル／QU-07 正式名称「聖獣士」
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const HTML = rd('index.html');
const fnOf = (name) => { const i = HTML.indexOf(`function ${name}(`); return HTML.slice(i, HTML.indexOf('\nfunction ', i + 10)); };
function loadPro() { const w = { matchMedia: () => ({ matches: false }) }; new Function('window', rd('js/prologue/prologue.js'))(w); return w.MMPRO; }

test('QU-01：プロローグ（2026-10-05 正式：4枚・本文はユーザー指定のとおり）。文字は画像に焼き込まず HTML の層・1文字ずつ。新しいゲームの最初に1回', () => {
  const P = loadPro(), txt = (id) => P.SLIDES.find((s) => s.id === id).pages.flat().join('');
  assert.deepEqual(P.SLIDES.map((s) => s.id), ['1', '2', '3', '4']);
  assert.equal(txt('1'), '遥か昔から、人と聖獣は共に生きてきた。力を貸し、心を通わせ、時に支え合いながら、同じ大地を歩む存在として――。');
  assert.equal(txt('2'), 'だが、およそ百年前。これまで知られていなかった、異質な力を宿す聖獣が現れ、世界はかつてない脅威にさらされた。その出来事をきっかけに、人々は各地で聖獣士を育て、聖獣を鍛え、来るべき危機に備えるようになった。');
  assert.equal(txt('3'), 'そして十年前――。再び世界を揺るがす大きな脅威が現れた。その脅威に立ち向かったのは、ミストリアの三人の聖獣士と、その聖獣たち。激しい戦いの末、彼らは脅威を退け、世界を救った。その名は今も、伝説として語り継がれている。');
  assert.equal(txt('4'), 'それから十年。戦いの傷を乗り越えたミストリアは、今や世界有数の聖獣士が集う街として、新たな時代を迎えていた。そして今日――。その街に憧れ、一人前の聖獣士になることを夢見る一人の若者が、ミストリアを訪れる。');
  assert.deepEqual(P.LEGENDS.map((l) => `${l.name}＋${l.beast}`), ['レオナ＋グリフェル', 'アストラッド＋ゼルヴァーン', 'バルド＋ドラグノル']);
  assert.doesNotMatch(P.SLIDES.map((s) => s.pages.flat().join('')).join(''), /ブリーダー|死|消滅|引退/);
  const files = ['prologue_01_coexistence', 'prologue_02_anomaly', 'prologue_03_three_legends', 'prologue_04_arrival_mistoria'];
  P.SLIDES.forEach((s, i) => { const f = `assets/prologue/${files[i]}.webp`; assert.equal(s.bg, './' + f); assert.ok(existsSync(path.join(ROOT, f)), f); });
  assert.ok(P.T.chGap >= 40 && P.T.chGap <= 55, '文字の開始間隔 40〜55ms'); assert.ok(P.T.chFade >= 120 && P.T.chFade <= 180, '各文字 120〜180ms'); assert.ok(P.T.chFade > P.T.chGap, '前の文字が出きる前に次が始まる');
  assert.equal(P.T.tapGuard, undefined, '2026-10-06：タップでは何も進まない（固定尺）'); assert.equal(P.POS.y, 0.42, '中央よりやや上');
  const pro = rd('js/prologue/prologue.js'); assert.match(pro, /<span class="mpc" style="--d:\$\{\(k\+\+\) \* T\.chGap\}ms">/, '文字ごとに開始をずらす'); assert.match(pro, /if \(cur\) cur\.classList\.add\('full'\)/, '時刻表のとおりに全部出る（2026-10-06：タップでは全部出さない）'); assert.doesNotMatch(pro, /addEventListener\('click', \(e\) => \{\n\s+if \(e\.target === skip\)/, '画面のタップの受け口は無い'); assert.doesNotMatch(pro, /mmpro-hint/, '「タップで先へ」の表示は無い');
  assert.match(HTML, /\.mmpro-u \.mpc\{display:inline-block;opacity:0;transform:translate3d\(0,var\(--chr,3px\),0\);filter:blur\(var\(--chb,1\.5px\)\);animation:mmproCh var\(--chf,160ms\)/);
  assert.match(fnOf('opPrologue'), /proPlay\(cv\)\.then\(ok=>\{cv\.remove\(\);if\(ok\)\{finaFlags\(\)\.prologue=1;save\(\)\}\}\)/, '見た記録は最後まで見た・スキップを確定したときだけ');
  assert.match(rd('tests/e2e/harness.mjs'), /MM_QA_NO_PROLOGUE = true/);
});

test('QU-02：街は正式ミストリア。施設は背景の上の押せる札（市場・牧場・研究所・闘技場・聖獣士管理局）で下のバーと二重に出さない。聖獣士管理局は中を作らない（素材・仕様なし）。アイテム屋は街に無く、ファームの屋台から（2026-10-04 正式）', () => {
  assert.ok(existsSync(path.join(ROOT, 'assets/town/mistria_main.webp')));
  assert.match(HTML, /function townGuild\(\)\{if\(S\.playerNamePending&&opOn\(\)\)return opBureau\(\);bureauScr\(\)\}/, '2026-10-04 PHASE H4：聖獣士管理局の中（正式背景・聖獣士証・功績）ができた＝札から入る');
  assert.doesNotMatch(HTML, /function townShop\(|SHOP_FROM=/, '街の独立したアイテム屋は無い');
  assert.doesNotMatch(rd('js/feel/game-feel.js'), /townShop/);
  assert.match(fnOf('bcCmds'), /\["shopScr\(\)","item","アイテム",""\]/, 'アイテムはベースキャンプの中（ベルナの補給所）から。2026-10-04 PHASE H2：下の1列のコマンド');
});

test('QU-03：立ち絵つきの一言（.nst）＝正式の半身（closeup）を大きく＋ネイビーの会話窓。街のフィナ（guide）・ヴァルガス（stern）・牧場のニック（smile）・研究所のエリオット（guide）。重要な会話（major）は同じ表情の全身（2026-10-03 の正式素材）', () => {
  assert.match(HTML, /function finaStandSrc\(\)\{const im=window\.MMNPC&&MMNPC\.imageOf\("fina","closeup","guide"\)/);
  for (const [k, v] of [['VARGAS_STAND', 'assets/npc/vargas/closeup/stern.webp'], ['NICK_STAND', 'assets/npc/nick/closeup/smile.webp'], ['ELLIOT_STAND', 'assets/npc/elliot/closeup/guide.webp']]) { assert.ok(HTML.includes(`${k}="${v}"`), k); assert.ok(existsSync(path.join(ROOT, v)), v); }
  assert.match(HTML, /\.mmtalk-fig\.closeup\{height:min\(52vh,470px\);height:min\(52dvh,470px\)\}/, '会話の半身を大きく');
  const N = rd('js/npc/npc.js'); assert.match(N, /if \(pres === 'major'\) lines = preferFullbody\(lines\);/);
  for (const e of ['normal', 'smile', 'happy', 'surprised', 'troubled', 'worried', 'serious', 'guide', 'wave', 'greet']) assert.ok(existsSync(path.join(ROOT, `assets/npc/fina/fullbody/${e}.webp`)), e);
  assert.match(HTML, /const FINA_PRES=\{raiseAgain:"compact",done:"major"\}/, '育成完了は重要な会話（全身）');
});

test('QU-04：研究所＝正式背景（assets/lab/lab_main.webp）・エリオットの半身・下に機能のカード（図鑑／特殊復元・合体は準備中＝システム表示だけ）。アイテム屋の店主は腰から上を大きく。牧場は選んでいる子を大きく', () => {
  assert.ok(existsSync(path.join(ROOT, 'assets/lab/lab_main.webp')));
  const mu = fnOf('museum'); assert.match(mu, /if\(tab=="book"\)return labBook\(\);if\(tab=="fuse"\)return labFuse\(\);if\(tab=="table"\)return labTable\(\);/, '2026-10-04（第二段階）：研究所の主要機能＝図鑑・合体・配合表（特殊復元は主要メニューに無い）');
  assert.doesNotMatch(mu, /labLock|特殊復元/); assert.doesNotMatch(HTML, /function labLock\(/, '旧 labLock（準備中の表示）は廃止');
  assert.match(HTML, /\.ds\.shop>\.shopnpc\{position:absolute;z-index:1;left:50%;top:calc\(58px \+ env\(safe-area-inset-top,0px\)\);height:min\(66dvh,600px\)/, '2026-10-05 試遊：アイテム屋の入口はベルナを大きく（背景の店内が見える）');
  // 2026-10-04 PHASE H3：牧場は20体の一覧（デザイン基準 01）＝選んでいる子は一覧の中で光らせる（旧「選んでいる子を大きく」は廃止）
  assert.match(fnOf('farm'), /if\(!all\.some\(x=>x\.uid===rnSel\)\)rnSel=\(m\|\|S\.box\[0\]\|\|\{\}\)\.uid\|\|null;/); assert.match(HTML, /\.rn2 button\.rnc\.on\{/);
});

test('QU-05：対戦前の画面を1つに：練習試合は BATTLE 画面（p9PreBattle）を出さず fight() の導入（対面＋VS）だけ。大会は順位表の「次の相手」に小さな能力比較＋対戦開始（2度押し）→ fight()。fight()・Phase 6 は変えない', () => {
  assert.match(fnOf('bBattleGo'), /^function bBattleGo\(\)\{const m=S\.m;if\(bBusy\|\|!m\)return;const bt=[^;]*,rk=bt=="rival"&&window\.MMRIVAL\?MMRIVAL\.rankFor\(m\):MMP8\.practiceRank\(m\);[^\n]*if\(!MMP8\.beginBattle\(S,m,\{kind:"practice",rank:rk\}\)\.ok\)return board\(\);(?:globalThis\.MM_LAST_BT=bt;)?save\(\);battleFoeOnce\(fs\);fight\(rk\)\}/);
  assert.doesNotMatch(HTML.replace(/function p9PreBattle\(/, ''), /p9PreBattle\(/, 'p9PreBattle はどこからも呼ばない（関数は残す）');
  assert.doesNotMatch(HTML.replace(/function p9VsScr\(/, ''), /p9VsScr\(\)/, 'VS 画面（p9VsScr）は流れから外した（関数は残す）');
  assert.match(fnOf('p8TourScr'), /onclick="p9CompareScr\(\)" aria-label="対戦する"/, '2026-10-06：大会1 対戦表 →「対戦する」→ 大会2'); assert.match(fnOf('p9CompareScr'), /data-nsfx="1" onclick="p9VsGo\(this\)" aria-label="対戦開始"/, '大会2の「対戦開始」（2度押し）→ 大会3 → fight()');
});

test('QU-06：セーブ・ロードの「最初からやり直す」（2度押し）→ タイトル画面（タイトルの曲と画面が一致）。押しただけではセーブを消さない＝タイトルで始めたときに従来の初期化。つづきからにもどれる', () => {
  assert.match(fnOf('reset'), /b\.textContent="もう一度押すと最初から";return\}sel=\[\];P_NEWGAME=true;title\(\)\}/);
  assert.doesNotMatch(fnOf('reset'), /p10NewSave|save\(\)|render\(\)/, '押しただけでは消さない');
  assert.match(fnOf('startGame'), /if\(P_NEWGAME\)\{P_NEWGAME=false;sel=\[\];S=p10NewSave\(\);save\(\)\}p8Resume\(\)/);
  assert.match(fnOf('title'), /onclick="P_NEWGAME=false;p8Resume\(\)">つづきからにもどる<\/button>/);
});

test('QU-07：正式名称「聖獣士」（旧「ブリーダー」）：名前登録の見出し・大会の参加者の肩書き。内部の変数名は変えない', () => {
  assert.match(HTML, /<b class="p11t">聖獣士登録<\/b>/); assert.doesNotMatch(HTML.replace(/\/\/[^\n]*/g, ''), /ブリーダー登録/);
  assert.match(rd('js/phase8/league.js'), /\$\{PROVISIONAL_NPC_TITLE\[rank\]\}聖獣士 \$\{name\}/);
});
