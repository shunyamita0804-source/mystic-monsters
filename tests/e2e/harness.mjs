// =========================================================
// 実ブラウザ（Chromium + Playwright）で index.html を動かすテストの共通部品
//  ・Playwright が見つからない環境では available() が false を返し、各テストは skip する（node --test の結果は失敗にしない）
//  ・リポジトリ直下を簡易HTTPサーバで配信する（ビルドなし・外部サービスなし）
//  ・外部フォント（Google Fonts）は通信を止めて空で返す（オフライン・証明書の都合で結果が変わらないように）
//  ・pageerror / console.error / 404 / 読み込み失敗を記録する
// =========================================================
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const SAVE_KEY = 'mr4v6';
export const SIZES = { base: [390, 844], se: [375, 667], android: [360, 800], max: [430, 932] };

let PW;   // undefined: 未確認 / null: 無い / object: playwright
function loadPlaywright() {
  if (PW !== undefined) return PW;
  const tries = [() => createRequire(import.meta.url)('playwright')];
  if (process.env.PLAYWRIGHT_MODULE) tries.push(() => createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE));
  tries.push(() => createRequire(execSync('npm root -g', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() + '/')('playwright'));
  for (const t of tries) { try { PW = t(); return PW; } catch (e) { /* 次へ */ } }
  PW = null; return PW;
}
/** 実ブラウザテストを実行できるか（Playwright と Chromium が使えるか） */
export function available() {
  const pw = loadPlaywright(); if (!pw) return false;
  try { return !!pw.chromium.executablePath(); } catch (e) { return false; }
}
// 実ブラウザテストは重いので、ふだんの node --test tests/*.test.mjs では省略する（速く・安定して回すため）。
// 実行するとき：QA_E2E=1 node --test --test-concurrency=1 tests/*.test.mjs （1ファイルずつ順番に。並列だと約9MBの読み込みが重なり時間計測が不安定になる）
export const skipReason = () => (process.env.QA_E2E !== '1' ? '実ブラウザテスト：QA_E2E=1 のときだけ実行'
  : available() ? false : 'Playwright / Chromium が無い環境のため実ブラウザテストを省略');

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.PNG': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.md': 'text/plain; charset=utf-8', '.ogg': 'audio/ogg', '.m4a': 'audio/mp4', '.mp3': 'audio/mpeg' };

/** リポジトリ直下を配信するサーバを起動する。{ url, close, requests } */
export async function serve() {
  const requests = [];
  const server = createServer(async (req, res) => {
    const u = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const f = path.join(ROOT, u === '/' ? 'index.html' : u);
    requests.push(u);
    if (!f.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
    try {
      const s = await stat(f); if (!s.isFile()) throw new Error('not file');
      res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' });
      res.end(await readFile(f));
    } catch (e) { res.writeHead(404); res.end('not found'); }
  });
  await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
  const url = `http://127.0.0.1:${server.address().port}/`;
  return { url, requests, close: () => new Promise((ok) => server.close(ok)) };
}

/**
 * ブラウザとサーバを用意する。戻り値の open() でページを開く。最後に close() を呼ぶこと。
 *  open({ size, save, raw, clock }) … save：mr4v6 に入れるセーブ（オブジェクト）／raw：localStorage に入れる {キー: 文字列}
 */
export async function launch() {
  const pw = loadPlaywright();
  const srv = await serve();
  const browser = await pw.chromium.launch(process.env.QA_CHROME_ARGS ? { args: JSON.parse(process.env.QA_CHROME_ARGS) } : undefined);   // 2026-10-17：計測の道具だけが使う（GPU の描き方の比較など）。テストは使わない
  const pages = [];
  async function open(opt = {}) {
    const [w, h] = opt.size || SIZES.base;
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: opt.dsf || 1, hasTouch: !!opt.touch, isMobile: !!opt.touch, ...(opt.video ? { recordVideo: { dir: opt.video, size: { width: w, height: h } } } : {}) });   // 2026-10-13 開発25：opt.video＝画面の動画を残すフォルダ（確認の証拠用）
    const errors = [], bad = [];
    await ctx.route(/^https?:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com)\//, (r) => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    const seed = {};
    if (opt.save) seed[SAVE_KEY] = JSON.stringify(opt.save);
    Object.assign(seed, opt.raw || {});
    if (Object.keys(seed).length) {
      await ctx.addInitScript((kv) => {
        // 最初の読み込みのときだけ入れる（再読み込みでは入れ直さない＝ゲームが保存した内容で再開する）
        try { if (!sessionStorage.getItem('__seeded')) { for (const [k, v] of Object.entries(kv)) localStorage.setItem(k, v); sessionStorage.setItem('__seeded', '1'); } } catch (e) {}
      }, seed);
    }
    // 市場のカレンの会話（初回来店・購入成功）は、ふだんのテストでは出さない（市場・購入の操作を止めないため）。カレンのテストは open({ karen: true })
    if (!opt.karen) await ctx.addInitScript(() => { window.MM_QA_NO_KAREN = true; });
    if (!opt.npc) await ctx.addInitScript(() => { window.MM_QA_NO_NPC = true; });   // 2026-10-04：施設の初回訪問の会話・Chapter の帰還イベント（MMNPCE）は npc:true のテストだけ
    if (!opt.intro) await ctx.addInitScript(() => { window.MM_QA_NO_INTRO = true; });
    if (!opt.worldCh1) await ctx.addInitScript(() => { window.MM_QA_OLD_CH1 = true; });   // 2026-10-11：本編の Chapter 1 は1枚の世界のボード（js/chapter/world-driver.js）。旧い14枚の Chapter 1 を前提にしたテストは既定で旧ボード。新ボードは worldCh1:true
    if (!opt.worldCh2) await ctx.addInitScript(() => { window.MM_QA_OLD_CH2 = true; });   // 2026-10-16：本編の Chapter 2 も1枚の世界のボード（js/chapter/world-driver-ch2.js）。旧 Chapter 2 を前提にした実ブラウザテストは既定で旧ボード。新しい盤は open({ worldCh2:true })（ルートは open({ route2:'B' })・既定 A）
    if (opt.worldCh2 && opt.route2 !== 'random') await ctx.addInitScript((r) => { window.MM_CH2ROUTE = r; }, opt.route2 || 'A');
    // 2026-10-14 Chapter 1 B／C 独立ルート：本番は出発で A／B／C を抽選。自動テストは既定で A に固定（従来のテストの前提）。open({ route: 'B' }) で B／C、open({ route: 'random' }) で本番の抽選
    if (opt.worldCh1 && opt.route !== 'random') await ctx.addInitScript((r) => { window.MM_CH1ROUTE = r; }, opt.route || 'A');
    if (!opt.stage) await ctx.addInitScript(() => { window.MM_QA_NO_STAGE = true; });   // 2026-10-06：バトルの共通演出（構え・溜め・ヒットストップ・余韻＝js/battle/stage.js）は stage:true のテストだけ（既定は従来の時間）
    if (!opt.tourfx) await ctx.addInitScript(() => { window.MM_QA_NO_TOURFX = true; });
    if (!opt.rjlock) await ctx.addInitScript(() => { window.MM_QA_NO_RJLOCK = true; });   // 2026-10-14 開発29（8）：決着の曲の間（WIN 4秒／LOSE 5秒）のもどるの禁止は rjlock:true のテストだけ（ほかのテストは従来どおりすぐ押せる）   // 2026-10-07：ランクアップの正式演出（B1〜B7）は tourfx:true のテストだけ
    if (!opt.tourconf) await ctx.addInitScript(() => { window.MM_QA_NO_TOURCONF = true; });
    if (!opt.got) await ctx.addInitScript(() => { window.MM_QA_NO_GOT = true; });   // 2026-10-12：市場の入手の演出（丸い顔・光の粒）は got:true のテストだけ（記録 MM_GOT_LOG は既定でも残る）   // 2026-10-07：大会の参加確認ダイアログ（はい／いいえ）は tourconf:true のテストだけ
    if (!opt.tourvs) await ctx.addInitScript(() => { window.MM_QA_NO_TOURVS = true; });   // 2026-10-06：大会3（VS 演出）は tourvs:true のテストだけ（既定は大会2 から直接バトル）   // Chapter開始の俯瞰図の演出は intro:true のテストだけ
    if (!opt.arrival) await ctx.addInitScript(() => { window.MM_QA_NO_ARRIVAL = true; });
    if (!opt.prologue) await ctx.addInitScript(() => { window.MM_QA_NO_PROLOGUE = true; });   // 新しいゲームの最初のプロローグ（MMPRO）は prologue:true のテストだけ
    if (!opt.opening) await ctx.addInitScript(() => { window.MM_QA_NO_OPENING = true; });   // 2026-10-05：正式の序盤導線（フィナ → 管理局 → セルジュの登録 → 世界地図）は opening:true のテストだけ（既定は従来の名前登録の画面）
    if (!opt.navDelay) await ctx.addInitScript(() => { window.MM_QA_NAV_INSTANT = true; });   // 画面を移るボタンの「押下を見せてから移る」待ち（MMFEEL）は navDelay:true のテストだけ（既存のテストはクリック直後に次の画面を見る）
    if (!opt.story) await ctx.addInitScript(() => { window.MM_QA_NO_STORY = true; });   // Chapter のイベント（フィナの節目の一言。config.story）は story:true のテストだけ   // 大会会場への到着のフィナの会話は arrival:true のテストだけ（背景の切り替えと受付は常に出る）
    // legacyStep：旧 rules.passNormal（通常マスの通過専用）を、このテストのページでだけ切っていた名残。2026-10-02 の60マス再設計から Chapter 1 の通常マスは止まれるので、付けても何も変わらない
    if (opt.legacyStep) await ctx.addInitScript(() => { document.addEventListener('DOMContentLoaded', () => { try { MMCH.getConfig(1).rules.passNormal = false; } catch (e) {} }); });
    const page = await ctx.newPage();
    // 全テストを並列で流すと、約9MBの index.html の読み込みが遅くなる。待ち時間は長めにとる（成功時の速さは変わらない）
    page.setDefaultTimeout(90000); page.setDefaultNavigationTimeout(120000);
    page.on('pageerror', (e) => errors.push(String(e && e.message || e)));
    page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
    page.on('response', (r) => { if (r.status() >= 400 && r.url().startsWith(srv.url)) bad.push(r.status() + ' ' + r.url().slice(srv.url.length)); });
    // 画面の再読み込み（reload）で途中だった BGM のダウンロードが中断される（net::ERR_ABORTED・media）のは失敗ではない
    //  2026-10-13 開発28：声・SE の XHR（assets/audio/）と最新の版の確認（version.json）が再読み込みで中断されるのも同じ（開始画面の BGM の読み込みと重なり、再読み込みの時点でまだ途中のことがある。404 などの本当の失敗は従来どおり記録）
    page.on('requestfailed', (r) => { const u = r.url(), p = u.slice(srv.url.length), aborted = /ERR_ABORTED/.test((r.failure() || {}).errorText || ''); if (u.startsWith(srv.url) && !(aborted && (/^(media|image)$/.test(r.resourceType()) || /^assets\/audio\//.test(p) || /^version\.json(\?|$)/.test(p)))) bad.push('failed ' + p); });   // 画像の ERR_ABORTED＝会話の立ち絵などが読み終わる前に次の画面へ移って要素が消えた（読み込みの失敗ではない。404 は応答で別に数える）
    await page.goto(srv.url + 'index.html' + (opt.query || ''));
    await page.waitForFunction(() => typeof window.MMP8 === 'object' && typeof S === 'object', null, { timeout: 120000 });
    const p = { page, ctx, errors, bad };
    pages.push(p);
    return p;
  }
  async function close() { for (const p of pages) { try { await p.ctx.close(); } catch (e) {} } await browser.close(); await srv.close(); }
  return { open, close, url: srv.url, requests: srv.requests };
}

/** ページ内のセーブ（S）のコピー */
export const getS = (page) => page.evaluate(() => JSON.parse(JSON.stringify(S)));
/** localStorage のセーブ（mr4v6）のコピー（無ければ null） */
export const storedSave = (page) => page.evaluate((k) => { const t = localStorage.getItem(k); return t == null ? null : JSON.parse(t); }, SAVE_KEY);
/** 画面の文字 */
export const text = (page) => page.evaluate(() => document.body.innerText);
/** 共通会話（MMNPC）が開いていれば最後まで送る（1文字表示中は全文→次へ、を繰り返す） */
export async function finishTalk(page, max = 240) {   // 2026-10-06：全文を出したタップから0.3秒は次へ進まない（読む間）ので回数を多めに
  for (let i = 0; i < max; i++) {
    const open = await page.evaluate(() => !!document.querySelector('.mmtalk:not(.mmtalk-out)'));   // 退場中（フェード）のウィンドウは数えない
    if (!open) { await page.waitForFunction(() => !document.querySelector('.mmtalk'), null, { timeout: 5000 }).catch(() => {}); return i; }   // フェードが終わって DOM が消えるまで待つ
    if (await page.evaluate(() => !!(window.MMNPC && MMNPC.state() && MMNPC.state().choices))) throw new Error('会話に選択肢がある（chooseTalk で選ぶ）');
    await page.click('.mmtalk:not(.mmtalk-out)', { force: true }).catch(() => {});
    await page.waitForTimeout(20);
  }
  throw new Error('会話が終わらない');
}
/** 共通会話を送り、選択肢が出たら指定の選択肢（id）を押す（選択肢は、出てから0.35秒・直前のタップから0.4秒あけないと受け付けないので、手を止めてから押す）。選択肢が出る前に会話が終われば false */
export async function chooseTalk(page, id, max = 240) {
  for (let i = 0; i < max; i++) {
    const s = await page.evaluate(() => (document.querySelector('.mmtalk') && window.MMNPC ? MMNPC.state() : null));
    if (!s) return false;
    if (s.choices) {
      for (let k = 0; k < 3; k++) {
        await page.waitForFunction((s) => !!document.querySelector(s), `.mmtalk-choice[data-choice="${id}"]`);   // ElementHandle を持たない（持つと、閉じた会話のDOMが残って見える）
        await page.waitForTimeout(450);
        await page.click(`.mmtalk-choice[data-choice="${id}"]`);
        await page.waitForTimeout(60);
        const r = await page.evaluate(() => { const x = window.MMNPC && MMNPC.state(); return x ? x.choice : 'closed'; });
        if (r === id || r === 'closed') return true;
      }
      throw new Error('選択肢を選べない');
    }
    await page.click('.mmtalk:not(.mmtalk-out)', { force: true }).catch(() => {});
    await page.waitForTimeout(20);
  }
  throw new Error('選択肢が出ない');
}
/** 2026-10-14 実機試遊⑩：遭遇は「バトルする」の確認なしに自動でバトルへ移る＝テストで先へ進むときは、始まったバトルを降参して盤へ戻る（降参の確認は2度押し・「もどる」まで）。
 *  始まらなければ（timeout）例外。戻ったら true */
export async function surrenderBattle(page, timeout = 30000) {
  await page.waitForSelector('#bt #m1 img', { timeout });
  await page.waitForFunction(() => { const g = document.getElementById('go'); return g && !g.disabled; }, null, { timeout: 20000 });
  for (let k = 0; k < 2; k++) { await page.click('#sur', { force: true }).catch(() => {}); await page.waitForTimeout(320); }
  for (let i = 0; i < 100; i++) {
    if (await page.evaluate(() => !document.getElementById('bt'))) return true;
    if (await page.evaluate(() => { const g = document.getElementById('go'); return !!g && !g.disabled; })) await page.click('#go').catch(() => {});   // 降参のあとの「もどる」（間に合わなければ STOP＝試合を進める）
    await page.waitForTimeout(400);
  }
  throw new Error('バトルから戻れない');
}
/** 出発準備の出発ボタンから育成を始める：フィナの確認 →「始める」→ 同じ会話でフィナ→ダンの掛け合い → ボードへ */
export async function startRaising(page, dep = '#app button[onclick="p7Depart(this)"]') {
  await page.waitForSelector(dep);
  await page.click(dep);
  await page.waitForSelector('.mmtalk');
  if (!(await chooseTalk(page, 'start'))) throw new Error('育成開始の選択肢が出ない');
  await finishTalk(page);
  await page.waitForSelector('#brollbtn');
}
/** 開始画面から新しいゲームを始め、名前を登録して街まで進む（フィナの初回あいさつも送る） */
export async function newGame(page, name = 'テスト') {
  await page.click('.tpage [onclick*="startGame"], [onclick*="startGame"]');
  await page.waitForSelector('#p11nm', { timeout: 5000 });
  await page.fill('#p11nm', name);
  await page.click('[onclick*="p11NameGo"]');
  await page.waitForTimeout(100);
  await finishTalk(page);
}
/** 市場：中央のモンスターの詳細（能力・購入ボタンのシート）を開く。購入ボタン（.p10buy）はふだん閉じたシートの中にある */
export async function marketDetail(page) {
  await page.waitForFunction(() => !!document.querySelector('#p10car .p10sl.on') && typeof P10_ANIM !== 'undefined' && !P10_ANIM);
  await page.evaluate(() => p10Detail(true));
  await page.waitForFunction(() => { const p = document.querySelector('.p10detp'); return !!p && document.querySelector('.p10mk').classList.contains('det') && p.getBoundingClientRect().bottom <= innerHeight + 1; });
  await page.waitForTimeout(260);
}
