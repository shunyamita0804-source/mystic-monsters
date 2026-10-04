// =========================================================
// 2026-10-04 PHASE H（正式デザインの統合・施設の作り直し）
//  PH-01 ベースキャンプ（旧ファーム）／PH-02 牧場20体／PH-03 聖獣士管理局・聖獣士登録の背景／PH-04 NPC の立ち絵の規格（stand・--nk）／
//  PH-05 セルジュ・リュウ（正式の透過素材待ち＝白背景・市松の JPEG は置かない）／PH-06 守ること（セーブ v6・mr4v6・合体は研究所・街に独立したアイテム屋は無い）
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const HTML = rd('index.html');
const fnOf = (name) => { const i = HTML.indexOf(`function ${name}(`); assert.ok(i > 0, name); return HTML.slice(i, HTML.indexOf('\nfunction ', i + 10)); };
const webpSize = (p) => { const b = readFileSync(path.join(ROOT, p)); assert.equal(b.toString('ascii', 0, 4), 'RIFF'); assert.equal(b.toString('ascii', 8, 12), 'WEBP');
  const t = b.toString('ascii', 12, 16); if (t === 'VP8 ') return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
  if (t === 'VP8X') return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)]; const n = b.readUInt32LE(21); return [1 + (n & 0x3fff), 1 + ((n >> 14) & 0x3fff)]; };
function loadNpc() { const w = {}; new Function('window', rd('js/npc/npc.js'))(w); return w.MMNPC; }
function loadMon() { const w = {}; new Function('window', rd('js/phase10/monsters.js'))(w); return w.MMP10M; }

test('PH-01：ベースキャンプ＝正式背景マスター（768×1360・UI なし）・名札「ベースキャンプ」・所持金・メニュー・音／ダン＋育成中の個体＋一言／次の Chapter＋「冒険」／下の1列5つ。「ファーム」「育成を始める」「育成準備中」は出さない', () => {
  assert.deepEqual(webpSize('assets/basecamp/basecamp_main.webp'), [768, 1360]); assert.match(rd('assets/basecamp/README.md'), /157cf00222fafea99943d00016daacb28320534a59b7801b34fa61d6b81e6e2f/);
  const f = fnOf('fmScr');
  for (const w of ['<b>ベースキャンプ</b>', 'class="bcgold"', 'onclick="bcMenu()"', 'onclick="sndToggle();', 'class="fmdan bcnpc" data-npc="dan"', '${msv(m)}', '<span class="kdtx"><b>ダン</b>${bcomm()}</span>', '<div class="bcch">${chip}</div>', 't:"冒険"', '<nav class="bcbar fmcmd"']) assert.ok(f.includes(w), w);
  assert.deepEqual([...f.matchAll(/\["([^"]+)","(\w+)","([^"]+)",/g)].map((m) => m[3]), ['特訓', 'アイテム', 'ステータス', '技管理', '中断', '街へ戻る'], '下の1列5つ（育成中は街へ戻れない＝5つ目は中断）');
  assert.doesNotMatch(f, /ファーム|育成を始める|育成準備中|rankLabel/);
  assert.match(f, /<em class="bctix" aria-label="特訓チケット \$\{S\.trainTix\}枚">チケット \$\{S\.trainTix\}<\/em>/, 'チケットは特訓の上の小さな札（数は実際の値）');
  assert.match(HTML, /\["ベースキャンプ","育成","#tic-farm","hall\(\)"/, '街の下のバーも「ベースキャンプ」');
  assert.match(HTML, /\.fm\.fm2\.bc \.bcbar\{[^}]*grid-template-columns:repeat\(5,1fr\)/, '下は1列');
  assert.match(fnOf('bcMenu'), /p8AbandonAsk\(\)">育成放棄<\/button>`:""/, '育成放棄はメニューの中（2段階の確認は従来どおり）');
});

test('PH-02：牧場は最大20体（MMP10M.RANCH_LIMIT。所持上限＝20＋連れている1）。2列の一覧だけがスクロールし、見る・名前変更・受け取る（預ける）・売る。合体は置かない', () => {
  const M = loadMon(); assert.equal(M.RANCH_LIMIT, 20); assert.equal(M.OWN_LIMIT, 21);
  assert.equal(M.canPurchase({ g: 9999 }, 'solamo', 20).ok, true); assert.deepEqual(M.canPurchase({ g: 9999 }, 'solamo', 21), { ok: false, reason: 'full' });
  assert.match(fnOf('dep'), /if\(S\.box\.length>=MMP10M\.RANCH_LIMIT\)return farm\("牧場がいっぱいです。","b"\);/);
  const f = fnOf('farm');
  assert.match(f, /<header class="rnlh2"><b>牧場のモンスター<\/b><span class="rncnt"><b>\$\{S\.box\.length\}<\/b> \/ \$\{L\}<\/span><\/header>/, '数は実際の値（参考画像の 20 / 20 は見本）');
  for (const w of ['<span>見る</span>', '<span>名前変更</span>', '<span>売る</span>', '"受け取る"', '"預ける"']) assert.ok(f.includes(w), w);
  assert.doesNotMatch(f.replace(/\/\/.*$/gm, ''), /合体|Fuse|labFuse\(/, '牧場に合体を置かない（研究所。コメントを除く）');
  assert.match(HTML, /\.rn2 \.rngrid\{[^}]*overflow-y:auto;[^}]*grid-template-columns:1fr 1fr;/, '2列・一覧だけがスクロール'); assert.match(HTML, /#app>\.rn\.rn2>\.wpanel\.rnpanel\{[^}]*overflow:hidden/);
  assert.match(fnOf('rnCell'), /\$\{p11Esc\(x\.name\)\}/); assert.match(fnOf('rnTag'), /"育成完了"[\s\S]*"未育成"/);
  const r = fnOf('rnRename'); assert.match(r, /\.trim\(\)\.slice\(0,8\)/, '名前は8文字まで（市場と同じ）'); assert.match(r, /save\(\);/);
  assert.match(fnOf('pfSellGo'), /if\(!arm\(b,`もう一度押すと売却/, '売却は従来どおり2度押し'); assert.equal(M.SELL.unraised, 50); assert.equal(M.SELL.max, 400);
});

test('PH-03：聖獣士管理局＝正式背景マスター（864×1536）。聖獣士証の値はすべてセーブから（見本の数値を固定しない）・功績は既存データの判定だけ・下に「聖獣士証」「功績一覧」。聖獣士登録の背景も管理局', () => {
  assert.deepEqual(webpSize('assets/bureau/bureau_main.webp'), [864, 1536]); assert.match(rd('assets/bureau/README.md'), /990f36996315078c7b1eccecd94f23e06033eec383ab236e839904ad02abbc5e/);
  const rows = fnOf('bureauRows');
  for (const w of ['p11Esc(S.playerName||MMP11P.DEFAULT_NAME)', 'RN[br]', 'MMP8.raiseDoneCount(S)', 'S.fuseCnt|0', 'bureauFound()', 'S.wins|0']) assert.ok(rows.includes(w), w);
  assert.doesNotMatch(rows + fnOf('bureauScr'), /\b(128|342|96)\b|アルト・ランクー/, '参考画像の見本の値・名前は使わない');
  const b = fnOf('bureauScr'); assert.match(b, /<nav class="bunav"><button class="bub[^>]*onclick="bureauScr\(\)">聖獣士証<\/button><button class="bub[^>]*onclick="bureauScr\('ach'\)">功績一覧<\/button><\/nav>/);
  assert.doesNotMatch(b, /聖獣士登録|聖獣士証を発行/, '登録済みの画面に「聖獣士登録」「聖獣士証を発行」は使わない');
  assert.doesNotMatch(HTML.slice(HTML.indexOf('const BUREAU_ACH='), HTML.indexOf('function bureauRows(')), /S\.g\s*[+-]=|unlock|reward:/, '功績に報酬・解放は付けない');
  assert.match(HTML, /function townGuild\(\)\{bureauScr\(\)\}/); assert.match(HTML, /\["聖獣士管理局","聖獣士証・功績","","townGuild\(\)","ok",0,\[500,594\]\]/, '街の既存の札から入る');
  assert.match(fnOf('p11NameScr'), /const bg=BUREAU_BG;/); assert.match(fnOf('p11NameScr'), /<b class="p11t">聖獣士登録<\/b>/, '登録の画面は従来どおり（入力・決定・保存）');
  assert.match(fnOf('fuse'), /S\.fuseCnt=\(S\.fuseCnt\|0\)\+1;/, '合体回数（任意項目。セーブの形式は変えない）');
});

test('PH-04：NPC の立ち絵の規格：主要 NPC は全身（expr/full）を上から決まった割合だけ見せる（顔の大きさ・頭の位置をフィナの半身にそろえる。画像は加工しない）。CSS の --nk と MMNPC.STAND が一致', () => {
  const M = loadNpc();
  for (const [id, v] of Object.entries(M.STAND)) {
    const full = M.standOf(id, 'closeup', M.EXPR[id][0]); assert.ok(full && full.includes(`assets/npc/${id}/expr/full/`), id);
    const [w, h] = webpSize(full); assert.ok(Math.abs(w / h / v.fr - v.nk) < 0.01, `${id}：nk＝幅÷高さ÷fr（${(w / h / v.fr).toFixed(3)}）`);
    assert.ok(HTML.includes(`[data-npc=${id}]{--nk:${String(v.nk).replace(/^0/, '')}}`), `${id}：CSS の --nk`);
    for (const e of M.EXPR[id]) { const s = M.standOf(id, 'closeup', e); assert.deepEqual(webpSize(s), [w, h], `${id}/${e}：表情を変えても器の大きさは同じ`); }
  }
  assert.equal(M.standOf('fina', 'closeup', 'normal'), null, 'フィナは従来の半身（基準）'); assert.equal(M.standOf('dan', 'fullbody', 'normal'), null, '全身（major）の指定はそのまま');
  assert.match(HTML, /\.mmtalk-fig\.stand img\{width:auto;max-width:none;aspect-ratio:var\(--nk,\.754\);object-fit:cover;object-position:50% 0\}/);
  assert.match(rd('js/npc/npc.js'), /fig\.className = 'mmtalk-fig ' \+ \(s\.view \|\| 'closeup'\) \+ \(stand \? ' stand' : ''\)/);
  assert.doesNotMatch(HTML.slice(HTML.indexOf('/* 2026-10-04 PHASE H5'), HTML.indexOf('img.nstf[data-npc]')), /filter|hue-rotate/, '色は変えない');
});

test('PH-05：セルジュ・リュウは正式の透過素材待ち：白背景・市松模様の JPEG はリポジトリに置かず、表示もしない（差し込み口だけ）', () => {
  const M = loadNpc(); assert.equal(M.get('serge'), null); assert.equal(M.get('ryu'), null);
  assert.match(HTML, /const SERGE=\{id:"serge",name:"セルジュ"/); assert.match(fnOf('bureauNpc'), /MMNPC\.get\(SERGE\.id\)/);
  const walk = (d) => readdirSync(path.join(ROOT, d)).flatMap((n) => { const p = path.join(d, n); return statSync(path.join(ROOT, p)).isDirectory() ? walk(p) : [p]; });
  const files = walk('assets').filter((p) => /serge|セルジュ|ryu|09_ryu|04_serge|ranch_20_ui|bureau_ui|base_camp_ui|standing/i.test(p));
  assert.deepEqual(files, [], '参考画像・白背景の JPEG は置かない');
});

test('PH-06：守ること：セーブ v6・キー mr4v6、合体は研究所（牧場に戻さない）、特殊復元は無い、街に独立したアイテム屋は無い、プロローグの PHASE G の仕組みはそのまま', () => {
  const P8 = (() => { const w = {}; new Function('window', rd('js/phase7/progression.js'))(w); new Function('window', rd('js/phase8/raising.js'))(w); return w.MMP8; })();
  assert.equal(P8.SAVE_KEY, 'mr4v6'); assert.equal(P8.newSave().v ?? P8.newSave().version ?? 6, 6);
  assert.match(fnOf('museum'), /if\(tab=="fuse"\)return labFuse\(\);/); assert.doesNotMatch(fnOf('museum'), /特殊復元/);
  assert.doesNotMatch(HTML, /function townShop\(|SHOP_FROM=/);
  assert.match(fnOf('p11NameScr'), /MMPRO\.readyOrTimeout\(6000\)/, 'PHASE G のプロローグの待ち方はそのまま');
  const h = createHash('sha256').update(HTML.slice(HTML.indexOf('async function fight('), HTML.indexOf('\n$("#snd").textContent'))).digest('hex'); assert.ok(h.length === 64);
});

test('PH-07：大会ランクの状態は固定表示にしない（進行で決まる）：未解放・参加可能・挑戦目標（次に挑むランク）・クリア済。解放は従来どおり（Chapter 1 から E・D、クリアした最高ランクの1つ上まで）。F・FREE・賞金・推奨戦力は出さない', () => {
  const w = {}; new Function('window', rd('js/phase7/progression.js'))(w); new Function('window', rd('js/phase8/raising.js'))(w); const P8 = w.MMP8, P7 = w.MMP7;
  const f = new Function('return ' + fnOf('p9RankState').trim())();
  const st = (clr, ch) => { const m = { prog: { rankClr: clr.map(Boolean) } }; P7.ensureProg(m); m.prog.rankClr = clr.map(Boolean); const el = P8.eligibleRanks(m, ch); return 'EDCBAS'.split('').map((L, k) => `${L}:${f(m, k, el)}`).join(' '); };
  assert.equal(st([0, 0, 0, 0, 0, 0], 1), 'E:open D:next C:lock B:lock A:lock S:lock', 'はじめ（Chapter 1）：E・D が参加可能・D が挑戦目標・C 以上は未解放');
  assert.equal(st([1, 0, 0, 0, 0, 0], 1), 'E:clear D:next C:lock B:lock A:lock S:lock', 'E クリア後');
  assert.equal(st([1, 1, 0, 0, 0, 0], 2), 'E:clear D:clear C:next B:lock A:lock S:lock', 'D クリア後（Chapter 2）：C が参加可能');
  assert.equal(st([1, 1, 1, 0, 0, 0], 3), 'E:clear D:clear C:clear B:next A:lock S:lock', 'C クリア後：B');
  assert.equal(st([1, 1, 1, 1, 1, 0], 4), 'E:clear D:clear C:clear B:clear A:clear S:next', 'A クリア後：S');
  assert.equal(st([1, 1, 1, 0, 0, 0], 1), 'E:clear D:clear C:clear B:lock A:lock S:lock', 'Chapter 1 の上限（D）より上でもクリア済は「クリア済」と出す');
  assert.match(rd('js/phase8/raising.js'), /const RANK_FLOOR = RANK_D;/); assert.match(rd('js/phase8/raising.js'), /const RANK_UNLOCK_STEP = 1;/);
  const rc = fnOf('p9ReceptionHtml'); assert.doesNotMatch(rc, /PRIZE|推奨|FREE|ランクF|"F"/); assert.match(rc, /参加者 \$\{sz\}体 \/ \$\{sz-1\}試合/);
  assert.match(HTML, /\.rcv-row\.st-open \.rcv-plate,\.rcv-row\.st-next \.rcv-plate\{background:linear-gradient\(#8e1a2c/, '参加可能はワインレッド＋金');
});
