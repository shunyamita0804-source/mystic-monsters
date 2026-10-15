// 公開URL（GitHub Pages）の確認。main へ push した後に実行する。
//   node tools/public-check.mjs [スクリーンショットの保存先]
// 1) 公開された index.html が、いまの HEAD の index.html と同じになるまで待つ（最大15分）
// 2) Playwright＋Chromium で 390×844 の通しの流れ（開始→名前→フィナ→街→市場で購入→牧場→通知→ファーム→育成開始の選択肢）を確認
// 3) 375×667・360×800・430×932 で牧場とファームの横はみ出しを確認
// 4xx/5xx 応答（Google Fonts は除く）と pageerror も記録する。NG が1つでもあれば終了コード 1。
// リポジトリのファイルは変更しない。スクリーンショットはリポジトリの外（既定は OS の一時ディレクトリ）に置く。
// ブラウザの通信は Node の fetch で取り直して渡す（プロキシの証明書をブラウザが信頼しない環境でも、TLS の検証を切らずに確認するため）。
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const URL = process.env.MM_PUBLIC_URL || 'https://shunyamita0804-source.github.io/mystic-monsters/';
const OUT = process.argv[2] || path.join(os.tmpdir(), 'mm-public-check');
const WAIT_MS = 15 * 60 * 1000;
mkdirSync(OUT, { recursive: true });

const require = createRequire(import.meta.url);
function loadPlaywright() {
  try { return require('playwright'); } catch (e) {}
  return require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
}
const { chromium } = loadPlaywright();

const R = []; const bad = []; const errs = [];
const rec = (k, ok, d = '') => R.push({ k, ok, d });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const sha = (b) => createHash('sha256').update(b).digest('hex');

// 1) 公開の反映待ち
const head = execSync('git rev-parse --short HEAD').toString().trim();
const want = sha(execSync('git show HEAD:index.html', { maxBuffer: 64 * 1024 * 1024 }));
let got = '', t0 = Date.now();
for (;;) {
  try {
    const r = await fetch(URL + 'index.html?cb=' + Date.now(), { headers: { 'cache-control': 'no-cache' } });
    got = r.ok ? sha(Buffer.from(await r.arrayBuffer())) : 'HTTP ' + r.status;
  } catch (e) { got = String(e); }
  if (got === want || Date.now() - t0 > WAIT_MS) break;
  await sleep(20000);
}
rec(`公開版の index.html が HEAD（${head}）と同じ`, got === want, got === want ? `${Math.round((Date.now() - t0) / 1000)}秒で一致` : `15分待っても不一致（${got.slice(0, 16)}）`);

// 1b) 2026-10-14 開発29（10）：公開クレジット（/credits.html が 200・ポケットサウンドの4行が見える・ゲームの設定から1か所）
try {
  const r = await fetch(URL + 'credits.html?cb=' + Date.now(), { headers: { 'cache-control': 'no-cache' } }); const h = r.ok ? await r.text() : '';
  const t = h.replace(/<style[\s\S]*?<\/style>/, '').replace(/<[^>]+>/g, '');
  const need = ['効果音：ポケットサウンド', 'https://pocket-se.info/', '使用音源：ゲームオーバー＃２', 'https://pocket-se.info/archives/754/'];
  const ix = await (await fetch(URL + 'index.html?cb=' + Date.now(), { headers: { 'cache-control': 'no-cache' } })).text();
  rec('開発29：公開クレジット /credits.html（HTTP 200・4行・設定の画面から1か所）', r.status === 200 && need.every((x) => t.includes(x)) && (ix.match(/credits\.html/g) || []).length === 1, `HTTP ${r.status} ${need.filter((x) => !t.includes(x)).join(' / ')}`);
} catch (e) { rec('開発29：公開クレジット /credits.html', false, String(e).slice(0, 200)); }

// 2) 画面の確認
let exe;
for (const p of ['/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome']) if (existsSync(p) && !exe) exe = p;
const browser = await chromium.launch(exe ? { executablePath: exe } : {}).catch(() => chromium.launch());
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const host = new globalThis.URL(URL).origin;
const retried = [];   // 通信の切断で1回取り直した URL（結果の最後に件数だけ出す）
const routeFn = async (route) => {
  const req = route.request(); const u = req.url();
  if (!u.startsWith(host)) return /fonts\.(googleapis|gstatic)/.test(u) ? route.abort() : route.continue();
  try {
    const h = { ...req.headers() }; delete h['accept-encoding'];
    // 2026-10-15：クラウドの通信経路（プロキシ）が途中で切れる（UND_ERR_SOCKET・other side closed）ことがある＝その切断のときだけ1回だけ取り直す（4xx・5xx は取り直さない）
    const get = async () => { const r = await fetch(u, { method: req.method(), headers: h, redirect: 'manual' }); return [r, Buffer.from(await r.arrayBuffer())]; };
    let r, body;
    try { [r, body] = await get(); } catch (e1) { if (!(e1 && e1.cause && /UND_ERR_SOCKET|ECONNRESET/.test(e1.cause.code || ''))) throw e1; retried.push(u); [r, body] = await get(); }
    const hd = {}; r.headers.forEach((v, k) => { if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(k)) hd[k] = v; });
    await route.fulfill({ status: r.status, headers: hd, body });
  } catch (e) { errs.push('取得失敗 ' + u + ' ' + e + (e && e.cause ? ' cause=' + (e.cause.code || '') + ' ' + String(e.cause.message || e.cause).slice(0, 160) : '') + ' type=' + req.resourceType()); await route.abort(); }   // 原因（通信・プロキシ・コード）を切り分けられるよう、cause とリソースの種類も記録
};
await ctx.route('**/*', routeFn);
const page = await ctx.newPage();
page.on('response', (r) => { if (r.status() >= 400 && !/fonts\.(googleapis|gstatic)/.test(r.url())) bad.push(`${r.status()} ${r.url().slice(0, 150)}`); });
page.on('pageerror', (e) => errs.push(('pageerror ' + String(e) + ' | stack: ' + String(e && e.stack || '')).slice(0, 700)));

// 会話（.mmtalk）を送る。選択肢が出たら 'choice'、閉じたら 'none'
async function drain(max = 40) {
  for (let i = 0; i < max; i++) {
    const st = await page.evaluate(() => !document.querySelector('.mmtalk') ? 'none' : document.querySelector('.mmtalk-choice') ? 'choice' : 'open');
    if (st !== 'open') return st;
    await page.click('.mmtalk', { force: true }).catch(() => {});
    await sleep(250);
  }
  return 'timeout';
}

try {
  await page.goto(URL, { waitUntil: 'load', timeout: 120000 });
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await page.reload({ waitUntil: 'load', timeout: 120000 });
  await sleep(1500);

  await page.click('[onclick*="startGame"]'); await sleep(600);
  // 2026-10-05：新しいゲームの最初はプロローグ（2026-10-07 正式6枚・1文字ずつ）→ 街 → フィナの声かけ（2択）→ 聖獣士管理局（光る札）→ セルジュ → 聖獣士登録
  const pro = await page.waitForFunction(() => { const b = document.querySelector('.mmpro .mmpro-bg.on'); return b && /v2\/prologue_01_peace\.webp/.test(b.style.backgroundImage) && document.querySelector('.mmpro .mmpro-u .mpc'); }, null, { timeout: 20000 }).then(() => true, () => false);
  const proImgs = await page.evaluate(() => Promise.all(['01_peace', '02_calamity', '03_culture', '04_legends', '05_tournament', '06_departure'].map((k) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i.naturalWidth > 0); i.onerror = () => ok(false); i.src = `assets/prologue/v2/prologue_${k}.webp`; })))).then((a) => a.every(Boolean));
  await sleep(1200); await page.screenshot({ path: `${OUT}/prologue_01_390.png` });
  if (pro) { await sleep(500); await page.click('.mmpro-skip'); await sleep(500); await page.click('.mmpro-skip'); }
  rec('プロローグ（正式6枚が読める・1文字ずつ・スキップで街へ）', pro && proImgs, `表示:${pro} 背景:${proImgs}`);
  await page.waitForSelector('.map.town', { state: 'attached', timeout: 20000 });   /* 2026-10-06：フィナの会話の間は街の UI を隠す（data-mmscene）*/ await sleep(900);
  const c1 = await drain(); if (c1 === 'choice') { await sleep(450); await page.click('.mmtalk-choice[data-choice="yes"]'); await sleep(300); }
  const c1b = await drain(); await sleep(400);
  const guide = await page.evaluate(() => { const g = [...document.querySelectorAll('.map.town .tpin.opgo')].map((b) => b.getAttribute('onclick')); return g.length === 1 && g[0] === 'townGuild()' && [...document.querySelectorAll('.map.town .tpin:not(.opgo)')].every((b) => b.disabled); });
  await page.screenshot({ path: `${OUT}/opening_town_390.png` });
  rec('序盤：フィナの2択 → 聖獣士管理局だけが光る（ほかは押せない）', c1 === 'choice' && c1b === 'none' && guide, `会話:${c1}/${c1b} 案内:${guide}`);
  await page.click('.tpin.opgo'); await sleep(1200);
  const serge = await page.evaluate(() => { const s = window.MMNPC && MMNPC.state(); return s ? s.name : null; });
  await drain();
  await page.waitForSelector('#p11nm', { timeout: 20000 });
  rec('聖獣士管理局：セルジュが登録を受け付ける → 聖獣士登録', serge === 'セルジュ', `話者:${serge}`);
  const lobbyOk = await page.evaluate(() => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i.naturalWidth > 0); i.onerror = () => ok(false); i.src = 'assets/tournament/lobby/lobby_main.webp'; }));   // 2026-10-04 G4：大会会場の中（ロビー）の背景
  const reg = await page.evaluate(() => !!document.querySelector('.p11reg .p11card #p11nm') && !!document.querySelector('.p11reg .p11go') && getComputedStyle(document.querySelector('h1')).display === 'none');
  rec('聖獣士登録の画面（登録カード・登録する・旧い見出しなし）・大会会場の中の背景が読める', lobbyOk && reg, `ロビー:${lobbyOk} 登録:${reg}`);
  await page.fill('#p11nm', 'テスト');
  await page.click('[onclick*="p11NameGo"]'); await sleep(800);
  const cf = await drain(); if (cf === 'choice') { await sleep(450); await page.click('.mmtalk-choice[data-choice="ok"]'); await sleep(1200); }
  let cg = 'none'; for (let k = 0; k < 30 && cg !== 'choice'; k++) { cg = await drain(); if (cg !== 'choice') await sleep(700); }   // 2026-10-05 PHASE B：新人支援の会話の間にシステム通知の帯（会話ではない）が入る
  if (cg === 'choice') { await sleep(1500); await page.screenshot({ path: `${OUT}/worldmap_390.png` }); await page.click('.mmtalk-choice[data-choice="a"]'); await sleep(400); }
  let d1 = 'open', ryu = false; for (let k = 0; k < 40; k++) { if (await page.evaluate(() => !!document.querySelector('.map.town') && !document.querySelector('.mmtalk') && S.npcFlags.op === 'done' && S.npcFlags.ryuMet === 1)) { d1 = 'none'; break; } d1 = await drain(); if (d1 === 'choice') { ryu = true; await sleep(450); await page.click('.mmtalk-choice[data-choice="a"]').catch(() => {}); await sleep(400); } await sleep(700); }   // 2026-10-12 開発21：町で世界地図 → 解放の帯 → リュウ（返答の3択）   // 会話と会話の間（フェード）を待ちながら送る
  await sleep(600);
  const town = await page.evaluate(() => !!document.querySelector('.map.town [onclick*="market()"]') && S.playerName === 'テスト' && !S.playerNamePending && S.npcFlags.op === 'done' && S.npcFlags.worldMap === 1);
  rec('名前の確認 → 登録 → 支援 → フィナの説明 → 町で出身地と世界地図 → 解放 → リュウ（3択）→ 街', cf === 'choice' && cg === 'choice' && ryu && d1 === 'none' && town, `確認:${cf} 出身:${cg} リュウ:${ryu} 会話:${d1} 街:${town}`);
  await page.screenshot({ path: `${OUT}/town_390.png` });

  await page.evaluate(() => market()); await sleep(1000);
  const d2 = await drain(); await sleep(500);
  await page.evaluate(() => p10Detail(true)); await sleep(700);
  await page.click('#p10info .p10buy'); await sleep(500);
  await page.fill('#p10ov #mnm', 'ソラ'); await sleep(600);
  await page.click('.p10ok'); await sleep(1000);
  let d3 = 'open'; for (let k = 0; k < 20; k++) { await sleep(600); if (await page.evaluate(() => !!document.querySelector('.map.town') && !document.querySelector('.mmtalk,.mkgot'))) { d3 = 'none'; break; } d3 = await drain(); }   // 2026-10-12 開発21：入手の演出 → カレンのお礼 → 街
  const bought = await page.evaluate(() => ({ m: !!S.m, name: S.m && S.m.name }));
  rec('市場で購入→街', d2 === 'none' && d3 === 'none' && bought.m, JSON.stringify(bought));

  await page.evaluate(() => farm()); await sleep(1200); await drain(); await sleep(300);   // 2026-10-04：初回訪問の会話（フィナ ↔ ニック）を送る
  const f = await page.evaluate(() => {
    const b = document.querySelector('.rnnick .rnsay'); const img = document.querySelector('.rnnick .rnsay img');   // 2026-10-04 PHASE H3：牧場20体の一覧の上にニックの小さな顔＋一言
    return { cls: b && b.className, name: b && b.querySelector('b') && b.querySelector('b').textContent,
      src: img && img.getAttribute('src'), nw: img && img.naturalWidth, dan: document.body.innerText.includes('ダン') };
  });
  rec('牧場：ニックの顔と一言（画像が読める・「ダン」なし）', f.cls === 'fbub rnsay' && f.name === 'ニック' && /assets\/npc\/nick\/expr\/face\/0[1-4]_\w+\.webp/.test(f.src || '') && f.nw > 0 && !f.dan, JSON.stringify(f));
  await page.screenshot({ path: `${OUT}/ranch_390.png` });

  await page.evaluate(() => { farm('', 'a'); dep(); }); await sleep(800);
  const n = await page.evaluate(() => { const b = document.querySelector('.fbub'); return { cls: b && b.className, text: b && b.textContent, img: !!(b && b.querySelector('img')), b: !!(b && b.querySelector('b')) }; });
  rec('牧場：預けたときの通知（顔・名前なし）', n.cls === 'fbub sys' && /預けました/.test(n.text) && !n.img && !n.b, JSON.stringify(n));
  await page.evaluate(() => { farm('', 'b'); wd(0); }); await sleep(800);
  rec('牧場：受け取り', await page.evaluate(() => !!S.m));

  await page.evaluate(() => hall('t')); await sleep(1200); await drain(); await sleep(300);   // 2026-10-04：初回訪問の会話（ダン ↔ フィナ）を送る
  const h = await page.evaluate(() => { const i = document.querySelector('.bcmonw .fmmon img'); return { mon: !!(i && i.naturalWidth > 0), dan: document.querySelectorAll('.fmdan,.kdan').length, go: !!document.querySelector('.bcgo .fmgo') }; });
  rec('ベースキャンプ：モンスターが主役（ダンの常設なし・出発する）', h.mon && h.dan === 0 && h.go, JSON.stringify(h));   // 2026-10-06
  await page.screenshot({ path: `${OUT}/hall_390.png` });

  await page.evaluate(() => prepScr()); await sleep(1000);
  await page.click('button[onclick="p7Depart(this)"]'); await sleep(800);
  const d4 = await drain(); await sleep(600);
  const c = await page.evaluate(() => ({ ch: [...document.querySelectorAll('.mmtalk-choice')].map((x) => x.textContent.trim()),
    next: (() => { const x = document.querySelector('.mmtalk-next'); if (!x) return false; const s = getComputedStyle(x); return s.display !== 'none' && s.visibility !== 'hidden' && s.opacity !== '0'; })() }));
  await page.screenshot({ path: `${OUT}/depart_choice_390.png` });
  rec('育成開始：選択肢「始める／まだやめておく」（▼なし）', d4 === 'choice' && c.ch.length === 2 && c.ch.includes('始める') && c.ch.includes('まだやめておく') && !c.next, JSON.stringify({ d4, ...c }));
  await sleep(500);
  for (const el of await page.$$('.mmtalk-choice')) if ((await el.textContent()).includes('まだやめておく')) { await el.click(); break; }
  await sleep(1000);
  const aft = await page.evaluate(() => ({ talk: !!document.querySelector('.mmtalk'), state: S.m && S.m.raise && S.m.raise.state }));
  rec('「まだやめておく」で育成が始まらない', !aft.talk && aft.state === 'none', JSON.stringify(aft));
  // 3) ほかの画面サイズでの横はみ出し
  for (const [w, hh] of [[375, 667], [360, 800], [430, 932]]) {
    await page.setViewportSize({ width: w, height: hh }); await sleep(300);
    for (const [nm, fn] of [['ranch', () => farm()], ['hall', () => hall('t')]]) {
      await page.evaluate(fn); await sleep(900);
      const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }));
      rec(`${w}×${hh} ${nm === 'ranch' ? '牧場' : 'ファーム'}：横はみ出しなし`, o.sw <= o.iw, JSON.stringify(o));
      await page.screenshot({ path: `${OUT}/${nm}_${w}x${hh}.png` });
    }
  }
  // 2026-10-13 開発24：公開 URL（デバッグ用のパラメータなし）で、新しい素材が正しい形式で返る・施設の声が実際に鳴り始めた・公式大会の新しいバトル画面と観客の声
  {
    const want = { 'js/battle/crowd.js': /javascript/, 'js/npc/voice-cues.js': /javascript/, 'version.json': /json/,
      'assets/battle/roulette/compact_1013/plate_normal_c.webp': /image\/webp/, 'assets/battle/roulette/compact_1013/plate_selected_c.webp': /image\/webp/, 'assets/battle/roulette/compact_1013/plate_miss_c.webp': /image\/webp/, 'assets/battle/roulette/compact_1013/center_frame_c.webp': /image\/webp/,
      'assets/audio/se/crowd_1013/hit_cheer_2p0_2p7_700ms.ogg': /audio\/ogg/, 'assets/audio/se/crowd_1013/hit_cheer_2p0_2p7_700ms.m4a': /audio\/(mp4|x-m4a|m4a)/, 'assets/audio/se/crowd_1013/miss_disappointment_0p5_1p2_700ms.ogg': /audio\/ogg/, 'assets/audio/se/crowd_1013/evade_boo_0p0_0p6_600ms.ogg': /audio\/ogg/, 'assets/audio/se/crowd_1013/evade_boo_0p0_0p6_600ms.m4a': /audio\/(mp4|x-m4a|m4a)/,
      // 2026-10-15 次回便12項目：対戦表の顔（正式のイラスト6枚）・フルーネの派生（登録のみ）・ライバルのマスの影
      ...Object.fromEntries(['solamo', 'gauru', 'nobiton', 'jiol', 'regnas', 'flurene'].map((k) => [`assets/tournament/icons_1015/icon_${k}.webp`, /image\/webp/])),
      'assets/monsters/2p5d/flurene.webp': /image\/webp/, 'assets/battle/idle/idle_flurene.webp': /image\/webp/, 'assets/chapter/rival_mark_1015/rival_silhouette.webp': /image\/webp/,
};
    const res = [];
    for (const [f, re] of Object.entries(want)) { try { const r = await fetch(URL + f + '?cb=' + Date.now()); const ct = r.headers.get('content-type') || ''; const n = (await r.arrayBuffer()).byteLength; res.push([f, r.status, ct, n, r.status === 200 && re.test(ct) && n > 0]); } catch (e) { res.push([f, 'ERR', String(e).slice(0, 80), 0, false]); } }
    rec('開発24：新しいスクリプト・画像・音源が 200・正しい MIME で返る', res.every((x) => x[4]), res.filter((x) => !x[4]).map((x) => x.slice(0, 3).join(' ')).join(' / ') || `${res.length}件`);
    const ver = await page.evaluate(() => ({ build: typeof MM_BUILD !== 'undefined' ? MM_BUILD : null, crowd: !!window.MMCROWD, voice: !!(window.MMVOICE && MMAUDIO.voice), v24: !!(window.MMARENA && MMARENA.v24 && MMARENA.v24()) }));
    const vj = await fetch(URL + 'version.json?cb=' + Date.now()).then((r) => r.json()).catch(() => ({}));
    rec('開発24：最新の実装が読み込まれている（MM_BUILD＝version.json・MMCROWD・MMVOICE・新しいバトル画面が既定）', ver.build && ver.build === vj.build && ver.crowd && ver.voice && ver.v24, JSON.stringify({ ...ver, json: vj.build }));
    // 2026-10-15 N11・N12：フルーネは登録だけ（市場・図鑑の表に無い・予約番号 5）・対戦表の顔は正式のイラスト（6番目＝フルーネ）
    const fl = await page.evaluate(() => { const f = MMP10M.pendingSpecies && MMP10M.pendingSpecies('flurene'); return { reg: !!f, id: f && f.id, unlocked: f && f.unlocked, inSpecies: MMP10M.SPECIES.some((s) => s.key === 'flurene' || s.id === 5), byId: !!MMP10M.byId(5), market: MMP10M.MARKET_CATALOG.some((c) => c.key === 'flurene'), icon5: window.MMARENA && MMARENA.tourIconSrc(5), icon0: window.MMARENA && MMARENA.tourIconSrc(0) }; });
    rec('N11・N12：フルーネは登録のみ（市場・図鑑・byId に無い）・対戦表の顔は正式のイラスト', fl.reg && fl.id === 5 && fl.unlocked === false && !fl.inSpecies && !fl.byId && !fl.market && /icons_1015\/icon_flurene\.webp$/.test(fl.icon5 || '') && /icons_1015\/icon_solamo\.webp$/.test(fl.icon0 || ''), JSON.stringify(fl));
    // 2026-10-15 追加B：Chapter 1 の能力マス 53%（無地 12%）・落ち着いた区間も能力マス・Chapter 1 の上昇 A17 B15 C14 D10 E8
    const cb = await page.evaluate(() => ({ dens: window.MMRF_PLAY && Object.assign({}, MMRF_PLAY.TUNING.density), calm: window.MMRF_PLAY && MMRF_PLAY.TUNING.calmToStat, g1: Object.assign({}, MMP10M.GROWTH_GAIN_BY_CH[1]) }));
    rec('追加B：Chapter 1 の能力マス 53%・上昇 A17〜E8', !!cb.dens && cb.dens.stat === 0.53 && cb.calm === true && JSON.stringify(cb.g1) === JSON.stringify({ A: 17, B: 15, C: 14, D: 10, E: 8 }), JSON.stringify(cb));
    // 施設の声：2026-10-13 開発25 F＝初回の説明（MMNPCE の FIRST・カレンの初回）が出る訪問は入口の声を出さない → 説明のあとの再訪で1回。
    //  上の流れ（市場の購入・牧場・ベースキャンプ）は初回＝声なし。牧場・ベースキャンプは「ほかの画面サイズ」の再訪で鳴っている。市場・アイテム屋はここで初回の説明を送ってから、もう一度入る（再訪）
    await page.evaluate(() => shopScr()); await sleep(1200); await drain(); await sleep(300);   // アイテム屋の初回（フィナ ↔ ベルナ）
    await page.evaluate(() => lobby()); await sleep(500); await page.evaluate(() => market()); await sleep(1400); await drain(); await sleep(300);   // 市場の再訪（カレンの来店の一言＋声）
    await page.evaluate(() => lobby()); await sleep(500); await page.evaluate(() => hall('t')); await sleep(900); await drain(); await page.evaluate(() => shopScr()); await sleep(1400); await drain(); await sleep(300);   // アイテム屋の再訪（ベルナ「いらっしゃい」＋声）
    // 2026-10-15 N04：NPC のボイスは全停止＝施設の入口・会話の行でも声は鳴らない（設定が on のままでも）。台詞の会話は出る。旧い声のファイルは公開 URL で取れない（404）
    const vo = await page.evaluate(() => ({ play: MMAUDIO.playLog().filter((x) => x.kind === 'voice').map((x) => x.name), blocked: !!(MMAUDIO.voiceBlocked && MMAUDIO.voiceBlocked()), log: MMAUDIO.voiceLog().slice(-12).map((x) => x.id + ':' + x.result), entries: typeof FAC_ENTRY_LOG !== 'undefined' ? FAC_ENTRY_LOG.slice() : [] }));
    rec('N04：NPC のボイスは鳴らない（施設の入口・会話の行・設定 on のまま）', vo.blocked && vo.play.length === 0 && !vo.log.some((x) => /:(play|wait)$/.test(x)), JSON.stringify(vo));
    const old = ['fina_hello_new.ogg', 'fina_yes.m4a', 'karen_welcome.ogg', 'dan_hello.m4a', 'nick_hello.ogg', 'berna_welcome.ogg', 'ryu_praise.ogg', 'serge_welcome.m4a', 'leona_greet.ogg', 'astrad_greet.ogg'];
    const gone = [];
    for (const f of old) { try { const r = await fetch(URL + 'assets/audio/voice/npc_1013/' + f + '?cb=' + Date.now()); gone.push([f, r.status]); } catch (e) { gone.push([f, 'ERR']); } }
    rec('N04：旧い NPC の声のファイルは公開 URL で 404', gone.every((x) => x[1] === 404), gone.map((x) => x.join(' ')).join(' / '));
  }
  // 2026-10-11：本編の Chapter 1＝1枚の世界のボード（js/chapter/world-board.js）。出発すると新ボード（299地点・サイコロ 1〜6・40ターン）
  await page.setViewportSize({ width: 390, height: 844 }); await sleep(300);
  await page.evaluate(() => { MMP8.depart(S, S.m); S.m.raise.field.introSeen = true; save(); board(); });
  await page.waitForSelector('#wbw #brollbtn', { timeout: 20000 }).catch(() => {}); await sleep(2500);
  const wb = await page.evaluate(() => ({ on: !!document.querySelector('#wbw #brollbtn'), old: !!document.querySelector('#chf'), lim: S.m.raise.turnLimit, sides: MMP8.diceSides(S.m), w: window.MMWB && MMWB.state().world }));
  await page.screenshot({ path: `${OUT}/world_ch1_390.png` });
  rec('Chapter 1：1枚の世界のボード（40ターン・1〜6・絵が読める）', wb.on && !wb.old && wb.lim === 40 && wb.sides === 6 && !!wb.w && wb.w.art && wb.w.tiles === 299, JSON.stringify({ ...wb, w: wb.w && { art: wb.w.art, tiles: wb.w.tiles, painted: wb.w.painted } }));

  // 2026-10-13 開発24：公式大会（E）の実戦（上の Chapter 1 の出発のあと）：新しい画面・技の発動中の表示・観客の声（命中・ルーレットの MISS・かわされた）
  {
    await page.evaluate(() => { if (window.MMNPC) MMNPC.close(); Object.assign(S.m.raise, { goal: true, pend: null }); const r = MMP8.startTournament(S, S.m, 0, 7); if (!r || !r.ok) throw new Error('startTournament ' + JSON.stringify(r)); save(); window.__cine = []; board(); });
    // 実際の画面の流れ：フィナの一言 → 対戦表「対戦する」→ 対戦前比較（2026-10-15：新しいパラメーター比較）「対戦開始」→ バトル（独立した VS の画面は出さない）
    const flow = []; let cmpInfo = null;
    for (let k = 0; k < 120 && !(await page.evaluate(() => !!document.querySelector('#bt #m0 .mon .mma-idle'))); k++) {
      const st = await page.evaluate(() => ({ talk: !!document.querySelector('.mmtalk:not(.mmtalk-out)'), ch: !!document.querySelector('.mmtalk-choice'), tb: !!document.querySelector('.tb1 .tbgo'), cmp: !!document.querySelector('.pcgo'), yn: !!document.querySelector('#p9conf .p9conf-yes, #ynm .ynm-y'), vs: !!document.getElementById('tvs') }));
      if (st.talk) { flow.push('talk'); if (st.ch) { await sleep(450); await page.click('.mmtalk-choice').catch(() => {}); } else await page.click('.mmtalk:not(.mmtalk-out)', { force: true }).catch(() => {}); await sleep(350); continue; }
      if (st.yn) { flow.push('yn'); await sleep(450); await page.click('#p9conf .p9conf-yes, #ynm .ynm-y').catch(() => {}); await sleep(300); continue; }
      if (st.vs) { if (flow[flow.length - 1] !== 'vs') flow.push('vs'); await sleep(400); continue; }
      if (st.cmp) { if (!flow.includes('compare')) cmpInfo = await page.evaluate(() => ({ cmp2: !!document.querySelector('#app>.p9cmps.cmp2'), imgs: [...document.querySelectorAll('.cmp2 img.c2img')].map((i) => [i.getAttribute('src').split('/').pop(), i.complete && i.naturalWidth > 0]), rows: document.querySelectorAll('.cmp2 .c2r').length, flip: getComputedStyle(document.querySelector('.cmp2 .c2side.op img') || document.body).transform })); flow.push('compare'); await sleep(500); await page.click('.pcgo').catch(() => {}); await sleep(500); continue; }   // 2026-10-13 開発27（29）：「対戦開始」は1回の押下
      if (st.tb) { flow.push('board'); await sleep(400); await page.click('.tb1 .tbgo').catch(() => {}); await sleep(500); continue; }
      await sleep(500);
    }
    rec('開発24：公式大会の実際の流れ（対戦表 → 対戦前比較 → バトル・2026-10-15：VS の画面なし）', await page.evaluate(() => !!document.getElementById('bt')) && flow.includes('compare') && !flow.includes('vs'), flow.join('→'));
    rec('2026-10-15：新しいパラメーター比較（肩上アップ2枚が読める・6能力・右は左右反転）', !!(cmpInfo && cmpInfo.cmp2 && cmpInfo.imgs.length === 2 && cmpInfo.imgs.every((x) => x[1] && /^(solamo|gauru|nobiton|jiol|regnas|flurene)\.webp$/.test(x[0])) && cmpInfo.rows === 6 && /^matrix\(-1/.test(cmpInfo.flip)), JSON.stringify(cmpInfo));
    await page.waitForSelector('#bt #m0 .mon .mma-idle', { timeout: 30000 });
    await page.evaluate(() => { const bt = document.getElementById('bt'); new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => { if (n.classList && n.classList.contains('skb3')) { const c = { on: false, hpr: 'visible', bui: 'visible' }; window.__cine.push(c); const smp = (k) => { const on = bt.classList.contains('mma-cine'), h = getComputedStyle(bt.querySelector('.hpr')).visibility, b = getComputedStyle(bt.querySelector('.bui')).visibility; c.on = c.on || on; if (h === 'hidden' && b === 'hidden') { c.hpr = h; c.bui = b; } c['t' + k] = [on, h, b].join('/'); }; setTimeout(() => smp(600), 600); setTimeout(() => smp(900), 900); } }))).observe(bt, { childList: true });
      const B = window.MMBattle; let n = 0; window.MMBattle = Object.freeze(Object.assign({}, B, { resolveAction(o) { if (o && o.attackerSide === 'A' && (n++ % 2 === 0)) o = Object.assign({}, o, { rng: Object.assign({}, o.rng || {}, { hitRng: () => 0.999 }) }); return B.resolveAction(o); } })); });   // 確認のためだけ：自分の攻撃を1回おきに外れ側へ（かわされる場面を作る。保存されるのはこの試合の結果だけ）
    await sleep(800);
    const ui = await page.evaluate(() => { const bt = document.getElementById('bt'), m = bt.querySelector('.mmr').getBoundingClientRect(), g = bt.querySelector('#go').getBoundingClientRect(); return { v24: bt.classList.contains('mma-v24'), st: bt.querySelectorAll('.mmr .pl .st').length, mmrH: Math.round(m.height), goW: Math.round(g.width), goBottom: Math.round(g.bottom), ih: innerHeight }; });
    await page.screenshot({ path: `${OUT}/dev24_battle_390.png` });
    let turn = 0; const tb = Date.now();
    while (Date.now() - tb < 200000) {
      const st = await page.evaluate(() => { const g = document.getElementById('go'); return { bt: !!document.getElementById('bt'), back: !!g && g.classList.contains('bk'), can: !!g && !g.disabled && !g.classList.contains('bk') }; });
      if (!st.bt || st.back) break;
      if (st.can && !ui.cards) ui.cards = await page.evaluate(() => { const bt = document.getElementById('bt'); return bt.querySelector('.mmr.cards') ? { n: bt.querySelectorAll('.mmr .pl.cd').length, src: [...bt.querySelectorAll('.mmr .pl.cd .ic img')].map((i) => i.getAttribute('src')), miss: bt.querySelectorAll('.mmr .pl.ms img.bgp').length } : { none: true }; });   // 追加A
      if (st.can) { const w = turn++ % 3 === 1; await page.waitForFunction((w) => { const on = document.querySelector('#rl .rw.on'); return on && on.classList.contains('ms') === w; }, w, { timeout: 4000, polling: 5 }).catch(() => {}); await page.click('#go').catch(() => {}); if (turn === 2) { await sleep(1300); await page.screenshot({ path: `${OUT}/dev24_cine_390.png` }); } }
      await sleep(150);
    }
    const bt2 = await page.evaluate(() => ({ cine: window.__cine, crowd: MMCROWD.log().map((x) => [x.kind, x.result]), play: MMAUDIO.playLog().filter((x) => /^CROWD/.test(x.name)).map((x) => [x.name, x.ctx, x.src.split('/').pop()]), back: !!document.querySelector('#go.bk') }));
    await page.screenshot({ path: `${OUT}/dev24_end_390.png` });
    rec('追加A：ルーレット＝横長の技カード（正式カード・技名の帯・MISS の板は従来の絵）', ui.cards && ui.cards.n >= 4 && ui.cards.src.every((x) => /cards_1014\//.test(x)) && ui.cards.miss >= 1, JSON.stringify(ui.cards));
    rec('開発24：公式大会の新しいバトル画面（低いルーレット・数値なし・STOP は画面の中）', ui.v24 && ui.st === 0 && ui.mmrH < 130 && ui.goBottom <= ui.ih, JSON.stringify(ui));
    rec('開発24：技の発動中は HUD・ルーレット・STOP を隠す', bt2.cine.length > 0 && bt2.cine.every((c) => c.on && c.hpr === 'hidden' && c.bui === 'hidden'), JSON.stringify(bt2.cine.slice(0, 4)));
    const pk = new Set(bt2.play.map((x) => x[0]));
    rec('開発24：観客の声が鳴り始めた（命中＝歓声・ルーレットの MISS＝落胆・かわされた＝ブーイング・2026-10-13 開発28 の既定＝通常 1.0秒の版・OGG）', ['CROWD_HIT_LONG', 'CROWD_MISS_LONG', 'CROWD_EVADE_LONG'].every((n) => pk.has(n)) && bt2.play.every((x) => x[1] === 'running') && bt2.play.length === bt2.crowd.length, JSON.stringify({ crowd: bt2.crowd.slice(0, 12), play: bt2.play.slice(0, 6), n: bt2.play.length }));
    if (bt2.back) { await page.click('#go').catch(() => {}); await sleep(1500); }
    for (let k = 0; k < 10; k++) { const c = await drain(); if (c === 'choice') await page.click('.mmtalk-choice').catch(() => {}); await sleep(500); }
    // 再起動（ホーム画面のアイコンから開き直す相当）：セーブは残る・つづきから
    const before = await page.evaluate(() => ({ name: S.m && S.m.name, g: S.g, key: !!localStorage.getItem('mr4v6') }));
    await page.reload({ waitUntil: 'load', timeout: 120000 }); await sleep(2500);
    const after = await page.evaluate(() => ({ name: S.m && S.m.name, g: S.g, key: !!localStorage.getItem('mr4v6'), title: !!document.querySelector('[onclick*="startGame"]'), build: MM_BUILD }));
    rec('開発24：開き直してもセーブはそのまま（つづきから）', before.key && after.key && after.name === before.name && after.title, JSON.stringify({ before, after }));
    await page.click('[onclick*="startGame"]').catch(() => {}); await sleep(1500); await drain();
  }


  // 2026-10-15：QA 試遊モード（?mmQaTrial=1）＝普段の URL では無効・ON → 6体×10技（60）のカードが読める → QA 試合 → OFF で通常のセーブは1文字も変わらない
  {
    rec('2026-10-15：普段の URL では QA 試遊モードは無効（切り替えも出ない）', await page.evaluate(() => !!window.MMQA && MMQA.ENABLED === false && !document.getElementById('mmqa-sw')), '');
    const ctxQ = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });   // QA は別の保存領域（本筋の確認のセーブとは混ぜない）
    await ctxQ.route('**/*', routeFn);
    const q = await ctxQ.newPage();
    q.on('response', (r) => { if (r.status() >= 400 && !/fonts\.(googleapis|gstatic)/.test(r.url())) bad.push(`${r.status()} ${r.url().slice(0, 150)}`); });
    q.on('pageerror', (e) => errs.push(('pageerror(QA) ' + String(e)).slice(0, 400)));
    await q.goto(URL + (URL.includes('?') ? '&' : '?') + 'mmQaTrial=1', { waitUntil: 'load', timeout: 120000 });
    await q.waitForFunction(() => window.MMQA && typeof S === 'object' && S, null, { timeout: 120000 }); await sleep(1500);
    await q.evaluate(() => { const m = mk(0); m.name = 'QA確認'; MMP7.ensureProg(m); S.m = m; S.g = 1234; save(); });   // 通常のセーブ（牧場に連れている子）を1つ作る
    await q.evaluate(() => { try { if (window.MMNPC) MMNPC.close(); } catch (e) {} farm(); }); await sleep(1200);
    const s0 = await q.evaluate(() => localStorage.getItem('mr4v6'));
    const sw = await q.evaluate(() => !!document.getElementById('mmqa-sw'));
    await q.evaluate(() => { const b = document.getElementById('mmqa-sw'); if (b) b.click(); }); await sleep(800);
    const cat = await q.evaluate(async () => { const c = MMQA.catalog(); const urls = c.flatMap((x) => x.moves.map((m) => m.src)); const ok = await Promise.all(urls.map((u) => new Promise((r) => { const i = new Image(); i.onload = () => r(i.naturalWidth > 0); i.onerror = () => r(false); i.src = u; }))); return { tabs: document.querySelectorAll('#mmqa .qtab').length, n: urls.length, ok: ok.filter(Boolean).length, counts: MMQA.counts() }; });
    rec('2026-10-15：QA 試遊モード（?mmQaTrial=1）＝牧場に切り替え → ON → 6体×10技（60）のカードが読める（実戦 40・プレビュー 20・静止画 0＝2026-10-15 フルーネの技アニメ）', sw && cat.tabs === 6 && cat.n === 60 && cat.ok === 60 && cat.counts.battle === 40 && cat.counts.preview === 20 && cat.counts.static === 0, JSON.stringify(cat));
    await q.evaluate(() => MMQA.battle(0, 1)); await q.waitForSelector('#bt .mmr .pl .nm', { timeout: 30000 }).catch(() => {});
    // 素早さが同じ（ソラモどうし）なら相手が先に動くことがある＝自分の番（STOP が押せる）になってからルーレットの技を読む（相手の番のルーレットは相手の技）
    await q.waitForFunction(() => { const g = document.getElementById('go'); return g && !g.disabled && !g.classList.contains('bk'); }, null, { timeout: 30000 }).catch(() => {}); await sleep(400);
    const qb = await q.evaluate(() => ({ bt: !!document.getElementById('bt'), names: [...document.querySelectorAll('#bt .mmr .pl .nm')].map((e) => e.textContent).slice(0, 3) }));
    await sleep(2500); await q.evaluate(() => MMQA.endBattle());
    for (let k = 0; k < 60 && await q.evaluate(() => !!document.getElementById('bt')); k++) await sleep(500);
    await q.waitForFunction(() => { const v = document.getElementById('mmqa'); return v && v.style.display !== 'none' && !!v.querySelector('.qoff'); }, null, { timeout: 30000 }).catch(() => {});
    // 2026-10-15：フルーネの技アニメ 77枚（本体 42＋効果 35）と歩行 16コマが公開 URL で読める・QA のプレビューでコマが出る
    const fl = await q.evaluate(async () => {
      const D = window.MMFLMV_DATA || {}, urls = [];
      Object.values(D).forEach((d) => { d.cuts.forEach((c) => { urls.push(d.dir + c.f); if (c.fx) urls.push(d.dir + c.fx); }); (d.fx || []).forEach((c) => urls.push(d.dir + c.f)); });
      const W = MMCH.getConfig(1).monsterSprites.flurene.dirs; const wk = W.front.frames.concat(W.back.frames);
      const ld = (u) => new Promise((r) => { const i = new Image(); i.onload = () => r(i.naturalWidth > 0); i.onerror = () => r(false); i.src = u; });
      const a = await Promise.all(urls.map(ld)), b = await Promise.all(wk.map(ld));
      return { anim: urls.length, animOk: a.filter(Boolean).length, walk: wk.length, walkOk: b.filter(Boolean).length };
    });
    await q.evaluate(() => MMQA.battle(5, 7)); await q.waitForSelector('#bt.mmqa-prev', { timeout: 30000 }).catch(() => {});
    await q.waitForFunction(() => [...document.querySelectorAll('#bt img')].some((i) => /flurene_moves_1015\//.test(i.getAttribute('src') || '')), null, { timeout: 12000 }).catch(() => {});
    const flb = await q.evaluate(() => ({ prev: !!document.querySelector('#bt.mmqa-prev'), sp: typeof BPL !== 'undefined' && BPL[0] && BPL[0].sp, cut: [...document.querySelectorAll('#bt img')].some((i) => /flurene_moves_1015\//.test(i.getAttribute('src') || '')), idle: /idle_flurene/.test((document.querySelector('#m0 .mma-idle') || {}).src || '') }));
    await q.screenshot({ path: `${OUT}/qa_flurene_anim_390.png` }).catch(() => {});
    await q.evaluate(() => MMQA.endBattle());
    for (let k = 0; k < 60 && await q.evaluate(() => !!document.getElementById('bt')); k++) await sleep(500);
    await q.waitForFunction(() => { const v = document.getElementById('mmqa'); return v && v.style.display !== 'none' && !!v.querySelector('.qoff'); }, null, { timeout: 30000 }).catch(() => {});
    rec('2026-10-15：フルーネの技アニメ 77枚・歩行 16コマが読める・QA のプレビュー（No.07）でコマが出る', fl.anim === 77 && fl.animOk === 77 && fl.walk === 16 && fl.walkOk === 16 && flb.prev && flb.sp === 5 && flb.cut && flb.idle, JSON.stringify({ fl, flb }));
    await q.evaluate(() => { const b = document.querySelector('#mmqa .qoff'); if (b) b.click(); }); await sleep(800);
    const s1 = await q.evaluate(() => ({ save: localStorage.getItem('mr4v6'), on: MMQA.isOn(), rn: !!document.querySelector('#app>.rn') }));
    rec('2026-10-15：QA 試合（ソラモ No.01）→ OFF で通常のセーブは同じ・通常の牧場へ戻る', qb.bt && qb.names.every((x) => x === 'たいあたり') && s1.save === s0 && !s1.on && s1.rn, JSON.stringify({ qb, same: s1.save === s0, on: s1.on, rn: s1.rn }));
    await q.screenshot({ path: `${OUT}/qa_off_390.png` }).catch(() => {});
    await q.close(); await ctxQ.close();
  }

} catch (e) {
  rec('確認の途中で例外', false, String(e).slice(0, 400));
  await page.screenshot({ path: `${OUT}/error.png` }).catch(() => {});
}
await browser.close();

rec('4xx/5xx 応答なし', bad.length === 0, bad.join(' / '));
rec('pageerror なし', errs.length === 0, errs.join(' / ') + (retried.length ? ` （通信の切断で1回取り直した：${retried.length}件）` : ''));
for (const x of R) console.log(`${x.ok ? 'OK' : 'NG'} | ${x.k}${x.d ? ' | ' + x.d : ''}`);
console.log(`スクリーンショット：${OUT}`);
process.exit(R.every((x) => x.ok) ? 0 : 1);
