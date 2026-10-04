// =========================================================
// 牧場NPC「ニック」（牧場の管理者。旧データ NP.f の「ダン」の表示を置き換え）
//  ・アップ画像のみ（closeup の6表情：normal・smile・guide・troubled・happy・serious）。小さい顔は立ち絵 normal から切り出した face.webp
//  ・牧場の吹き出し：ふだんはニックの一言（顔・名前つき）。システム通知（farm(msg) の msg）は名前・顔なし
//  ・旧データ NP.f・NPI.f は互換のため残す（表示しない）。牧場の機能（預ける・受け取る・売却・合体）は変えない
//  実ブラウザのテストは QA_E2E=1 のときだけ実行する（tests/e2e/harness.mjs）。
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import * as H from './e2e/harness.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HTML = readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const EXPR = ['normal', 'smile', 'guide', 'troubled', 'happy', 'serious'];
function loadNpc() { const ctx = { console }; ctx.window = ctx; vm.createContext(ctx); vm.runInContext(readFileSync(path.join(ROOT, 'js/npc/npc.js'), 'utf8'), ctx); return ctx.MMNPC; }
const lineOf = (s) => HTML.split('\n').find((l) => l.startsWith(s));
const nickTalk = () => { const i = HTML.indexOf('const NICK_TALK={'); return new Function(`return ${HTML.slice(i + 'const NICK_TALK='.length, HTML.indexOf('};', i) + 1)}`)(); };
/** 可逆WebP（VP8L）の見出しを読む：形式・幅・高さ・透過の有無（2026-09-30：透過PNGから画素を変えずに変換） */
const webp = (p) => { const b = readFileSync(path.join(ROOT, p)); const v = b.readUInt32LE(21); return { sig: b.subarray(8, 12).toString(), type: b.subarray(12, 16).toString() + (b[20] === 0x2f && (v >>> 28) & 1 ? '+alpha' : ''), w: (v & 0x3fff) + 1, h: ((v >>> 14) & 0x3fff) + 1 }; };
const farmSrc = () => HTML.slice(HTML.indexOf('function farm(msg,tab){'), HTML.indexOf('\nfunction dep('));

test('NICK-1：ニックは牧場の管理者として、アップ画像（closeup）の6表情で登録。Chapterボードには置かない', () => {
  const M = loadNpc(), n = M.get('nick');
  assert.deepEqual([n.name, n.role, n.board, n.defaultView, n.defaultExpr], ['ニック', '牧場の管理者', false, 'closeup', 'normal']);
  assert.ok(EXPR.every((e) => M.expressionsOf('nick', 'closeup').includes(e)), '2026-10-04（追加アセット）：旧い表情名はすべて引き続き使える（意味の近い正式の表情差分 assets/npc/<id>/expr/ へ読み替え）'); assert.ok(M.EXPR.nick.every((e) => M.expressionsOf('nick', 'closeup').includes(e)), '正式の4表情');
  assert.equal(M.imageOf('nick', 'closeup', 'smile').src, 'assets/npc/nick/expr/closeup/02_gentle.webp', '2026-10-04（追加アセット）：旧い表情名はすべて引き続き使える（意味の近い正式の表情差分 assets/npc/<id>/expr/ へ読み替え）');
  assert.equal(M.get('dan').name, 'ダン', 'ファームのダンはそのまま');
});

test('NICK-2：素材は透過PNG（RGBA）。立ち絵6枚は高さ760px、小さい顔は正方形。README に元画像との対応と透明化の方法', () => {
  for (const e of EXPR) { const i = webp(`assets/npc/nick/closeup/${e}.webp`); assert.deepEqual([i.sig, i.type, i.w, i.h], ['WEBP', 'VP8L+alpha', 573, 760], e); }
  const f = webp('assets/npc/nick/face.webp'); assert.deepEqual([f.sig, f.type, f.w, f.h], ['WEBP', 'VP8L+alpha', 256, 256]);
  const md = readFileSync(path.join(ROOT, 'assets/npc/nick/README.md'), 'utf8');
  assert.match(md, /市松模様/); assert.match(md, /face\.webp/);
});

test('NICK-3：牧場の吹き出し：通知（msg）は名前・顔なし。ふだんはニックの一言（顔・名前）。旧データ NP.f（旧「ダン」）は画面に出さない', () => {
  assert.match(lineOf('const NICK_FACE='), /^const NICK_FACE="assets\/npc\/nick\/face\.webp";/);
  const f = farmSrc();
  // 2026-10-04 PHASE H3：牧場20体の一覧（デザイン基準 01）。ニックは一覧の上の小さな顔＋一言（表情＝売る（真剣）・見る（優しい笑顔）・育成完了の子の詳細（感心）・ふだんは一言の表情）。通知のときは通知だけ
  assert.ok(f.includes('<div class="rnnick">${msg?`<div class="fbub sys">${msg}</div>`:(l=>`<div class="fbub rnsay"><img src="${npcSrc("nick",ft=="d"?"serious":ft=="e"&&x&&MMP7.raiseState(x)=="done"?"impressed":ft=="e"?"gentle":(l?l.expression:"normal"),"face")||NICK_FACE}" alt=""><span><b>ニック</b>${l?l.text:""}</span></div>`)(npcLineX("ranch",NICK_TALK.ranch,"normal"))}</div>'), 'ニックの顔・名前はニックの一言だけ');
  assert.doesNotMatch(f, /NP\.f|<b>ダン<\/b>/, '牧場に旧「ダン」を出さない');
  assert.doesNotMatch(HTML, /\.fbub::after|\.fbub\.fnick::after/, '吹き出しのしっぽ（背景の絵の人物を指す）は無い');
  assert.match(HTML, /\.fbub\{position:absolute;left:3%;top:3%;width:52%;/, '正式背景では左上の空に出す（牧舎を隠さない。旧い吹き出しを隠す位置・最小の高さは不要になった）');
  assert.match(HTML, /\.fbub\.sys\{background:#0c1f56;border-color:#c9a24d;color:#fff\}/, '通知は紺地・白文字');
  assert.doesNotMatch(f, /MMNPC|finaTalk/, '牧場で会話ウィンドウは開かない');
});

test('NICK-4：旧データ NP.f・NPI.f は互換のため残す（名前「ダン」とセリフ4行はそのまま）', () => {
  const NP = new Function(`${lineOf('const NP=')}\nreturn NP;`)();
  assert.equal(NP.f.n, 'ダン'); assert.equal(NP.f.t.length, 4);
  assert.match(lineOf('const NPI='), /,f:"data:image\/png;base64,/);
});

test('NICK-5：一言は NICK_TALK.ranch。ニックの口調（やぁ・〜だな・心配するな）で、ダンの一言とは違う。「〜だぜ」・若者言葉・寿命・疲労は使わない', () => {
  const T = nickTalk();
  assert.deepEqual(T.ranch, ['やぁ。今日も元気そうだな。', 'いい顔つきになってきたな。', 'この子なら、もう少し伸びそうだ。', '心配するな。こっちで見ておく。', 'さて、今日はどうする？']);
  for (const s of T.ranch) assert.doesNotMatch(s, /だぜ|ぜ！|寿命|疲労|ストレス|マジ|ヤバ/, s);
  const i = HTML.indexOf('const DAN_TALK={'), D = new Function(`return ${HTML.slice(i + 'const DAN_TALK='.length, HTML.indexOf('};', i) + 1)}`)();
  for (const s of T.ranch) assert.ok(!D.farm.includes(s), 'ダンと同じ一言にしない');
});

// ---------------------------------------------------------
// 実ブラウザ
// ---------------------------------------------------------
const SKIP = H.skipReason();
let L;
test.before(async () => { if (!SKIP) L = await H.launch(); });
test.after(async () => { if (L) await L.close(); });
async function buyFirst(pg) {
  await H.newGame(pg, 'テスト');
  await pg.evaluate(() => market()); await pg.waitForFunction(() => document.querySelector('#p10car .p10sl.on') && !P10_ANIM);
  await H.marketDetail(pg); await pg.waitForTimeout(500); await pg.click('#p10info .p10buy', { force: true });
  await pg.waitForSelector('#p10ov'); await pg.fill('#mnm', 'ソラ'); await pg.waitForTimeout(600); await pg.click('.p10ok', { force: true });
  await pg.waitForSelector('#app .map');
}
// 2026-10-04 PHASE H3：牧場20体の一覧の上に、ニックの小さな顔＋一言（.rnnick .fbub.rnsay）。通知（.fbub.sys）は名前・顔なし（書き直しの理由：牧場の画面の作り直し）
const bub = (pg) => pg.evaluate(() => { const b = document.querySelector('.rnnick .fbub'), i = b.querySelector('img');
  return { cls: b.className, name: b.querySelector('b') ? b.querySelector('b').textContent : null, img: i ? [i.getAttribute('src'), i.complete && i.naturalWidth > 0] : null, text: b.textContent }; });

test('NICK-B1：牧場：ふだんはニックの一言（名前・顔が読み込める・一言は進行状態に合う一言）。預ける／受け取るの通知は名前・顔なし。旧「ダン」は出ない', { skip: SKIP }, async () => {
  const p = await L.open(); const pg = p.page;
  await buyFirst(pg);
  await pg.click('.hz[onclick="farm()"]'); await pg.waitForSelector('#app .rnnick .rnsay'); await pg.waitForFunction(() => { const i = document.querySelector('.rnnick img'); return i && i.complete && i.naturalWidth > 0; });
  let b = await bub(pg);
  assert.equal(b.cls, 'fbub rnsay'); assert.equal(b.name, 'ニック'); assert.match(b.img[0], /^assets\/npc\/nick\/expr\/face\/0[124]_(normal|gentle|impressed)\.webp$/); assert.equal(b.img[1], true);
  assert.ok((await pg.evaluate(() => (window.MMNPCE ? MMNPCE.REVISIT.ranch.lines.map((l) => l.text) : NICK_TALK.ranch))).some((s) => b.text.endsWith(s)), `ニックの一言：${b.text}`);
  assert.doesNotMatch(await H.text(pg), /ダン/, '牧場に旧「ダン」の名前を出さない');
  await pg.evaluate(() => dep()); await pg.waitForFunction(() => document.querySelector('.fbub.sys')); b = await bub(pg);
  assert.deepEqual([b.cls, b.name, b.img], ['fbub sys', null, null]); assert.match(b.text, /預けました/);
  assert.equal((await H.getS(pg)).box.length, 1, '預ける処理は従来どおり');
  await pg.evaluate(() => wd(0)); await pg.waitForFunction(() => /受け取りました/.test((document.querySelector('.fbub.sys') || {}).textContent || '')); b = await bub(pg);
  assert.deepEqual([b.cls, b.name, b.img], ['fbub sys', null, null]);
  assert.equal((await H.getS(pg)).box.length, 0, '受け取る処理は従来どおり');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('NICK-B2：4つの画面サイズで、牧場のニックの一言・通知が画面からはみ出さず、横にはみ出さない', { skip: SKIP }, async () => {
  for (const size of Object.values(H.SIZES)) {
    const p = await L.open({ size }); const pg = p.page;
    await buyFirst(pg);
    for (const msg of ['', 'ソラを預けました。牧場で元気に過ごしています。']) {
      await pg.evaluate((m) => farm(m), msg); await pg.waitForSelector(msg ? '#app .rnnick .fbub.sys' : '#app .rnnick .rnsay'); await pg.waitForTimeout(300);
      const r = await pg.evaluate(() => { const b = document.querySelector('.rnnick .fbub').getBoundingClientRect();
        return { inside: b.left >= -1 && b.right <= innerWidth + 1 && b.top >= -1 && b.bottom <= innerHeight + 1, sw: document.documentElement.scrollWidth, W: innerWidth }; });
      assert.ok(r.inside, `${size.join('×')}：画面に収まる（${msg ? '通知' : 'ニック'}）`);
      assert.ok(r.sw <= r.W + 1, `${size.join('×')}：横にはみ出さない`);
    }
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
    await p.ctx.close();
  }
});

// ---------------------------------------------------------
// 牧場の4コマンド（2026-09-30 正式仕様：預ける・受け取る・様子を見る・売る。合体は研究所へ移す）
// ---------------------------------------------------------
test('NICK-6：牧場（2026-10-04 PHASE H3）：選んだ子に 見る・名前変更・受け取る（連れている子は預ける）・売る。合体のコマンドは無い（研究所）。合体の処理（fuse・selm・選択画面）は研究所から呼ぶために残す', () => {
  const f = lineOf('function farm(msg,tab){') + HTML.slice(HTML.indexOf('function farm(msg,tab){'), HTML.indexOf('\nfunction dep('));
  assert.match(f, /<nav class="rnact" aria-label="牧場のコマンド"><button class="rna" \$\{x\?"":"disabled"\} onclick="rnView=rnSel;farm\('','e'\)">\$\{rnIc\("look"\)\}<span>見る<\/span><\/button><button class="rna" \$\{x\?"":"disabled"\} onclick="farm\('','n'\)">\$\{rnIc\("ren"\)\}<span>名前変更<\/span><\/button>/);
  assert.match(f, /mv=!x\?\["","受け取る",true\]:x===m\?\["dep\(\)","預ける",busy\|\|S\.box\.length>=L\]:\[`wd\(\$\{bi\}\)`,"受け取る",busy\];/, '受け取る＝従来の wd・預ける＝従来の dep');
  assert.match(f, /<button class="rna rnsell" \$\{sq\.ok\?"":"disabled"\} onclick="pfSellUid=rnSel;farm\('','d'\)">\$\{rnIc\("sell"\)\}<span>売る<\/span><\/button>/, '売る＝従来の売却の確認（2度押し）');
  assert.doesNotMatch(f, /"合体"|rnfuse|>合体</, '牧場に合体を置かない');
  assert.match(f, /ft=tab\|\|\(ft=="c"\?"b":ft\);if\(ft=="c"\)return museum\("fuse"\);/, '2026-10-04：合体の画面は研究所（labFuse）。牧場の内部画面 farm(\'\',\'c\') は研究所へ送る');
  assert.ok(HTML.includes('async function fuse(){') && HTML.includes('function selm(i){'), '合体の処理は残す');
  const look = HTML.slice(HTML.indexOf('function rnLookPanel(x){'), HTML.indexOf('\nconst rnIc='));
  assert.doesNotMatch(look, /save\(|wd\(|pfSell|fuse\(|selm\(|dep\(/, '見るは閲覧だけ（保存・受け取る・売る・合体を呼ばない）');
  assert.match(f, /牧場にはまだモンスターがいません。/);
});

test('NICK-B3：見る（2026-10-04 PHASE H3）：牧場の一覧（画像・名前・育成の札）→ 選んで「見る」→ 詳細（6能力）→ 一覧へ。閲覧ではセーブが変わらない。0体のときは案内だけ', { skip: SKIP }, async () => {
  const p = await L.open(); const pg = p.page;
  await buyFirst(pg);
  await pg.evaluate(() => { const c = JSON.parse(JSON.stringify(S.m)); c.uid = c.uid + 'b'; c.name = 'ガウ'; c.sp = 1; c.po = 123; S.box.push(c); save(); });
  await pg.click('.hz[onclick="farm()"]'); await pg.waitForSelector('#app .rn2 .rnact'); await pg.waitForTimeout(400);
  assert.deepEqual(await pg.evaluate(() => [...document.querySelectorAll('.rnact .rna')].map((b) => b.innerText.replace(/\s+/g, ''))), ['見る', '名前変更', '受け取る', '売る']);
  await pg.evaluate(() => { window.__box = S.box; S.box = []; farm('', 'b'); });
  assert.equal(await pg.evaluate(() => document.querySelector('.rngrid').innerText.trim()), '牧場にはまだモンスターがいません。');
  await pg.evaluate(() => { S.box = window.__box; farm('', 'b'); });
  const raw0 = await pg.evaluate(() => localStorage.getItem('mr4v6'));
  const rows = await pg.evaluate(() => [...document.querySelectorAll('.rngrid .rnc')].map((r) => [r.querySelector('.rncn b').textContent, r.querySelector('.rntag').textContent, !!r.querySelector('img,svg')]));
  assert.deepEqual(rows, [['ガウ', '未育成', true]]);
  await pg.click('.rngrid .rnc'); await pg.waitForTimeout(300); await pg.click(".rna[onclick=\"rnView=rnSel;farm('','e')\"]"); await pg.waitForSelector('.rnlook');
  const d = await pg.evaluate(() => [document.querySelector('.rnlname>b').textContent, [...document.querySelectorAll('.rnlst div')].map((x) => x.innerText.replace(/\s+/g, ''))]);
  assert.deepEqual(d, ['ガウ', ['ライフ100', 'ちから123', 'かしこさ100', '命中100', '回避100', '丈夫さ100']]);
  assert.equal(await pg.$$eval('.wpanel button', (a) => a.map((b) => b.getAttribute('onclick')).join('|')), "rnView=null;farm('','b')", '詳細のボタンは「一覧にもどる」だけ');
  await pg.click('.rnlback'); await pg.waitForSelector('.rngrid .rnc');
  assert.equal(await pg.evaluate(() => localStorage.getItem('mr4v6')), raw0, '見るだけではセーブは変わらない');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  await p.ctx.close();
});
