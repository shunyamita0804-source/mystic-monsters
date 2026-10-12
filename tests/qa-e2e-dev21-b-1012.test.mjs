// =========================================================
// 2026-10-12 開発21 ②（実ブラウザ・375×667・390×844・430×932）
//  GB-1：市場で購入・命名 → 中央に命名した子の丸い顔＋光の粒（3回）＋「〔名前〕を手に入れた！」→ カレンのお礼「ありがとう。大切に育ててあげてね。」→ 街。
//        旧「つれて帰った」の帯は出ない・購入は1体・保存済み・演出は画面の中・二度押しで二重にならない
//  GB-2：ベースキャンプの「出発する」は下のバーから離れた（旧 72px → 100px／低い画面 68px）・モンスターと重ならない・画面の中。出発準備の「出発する」も下から離れた
//  GB-3：出発準備のバッグの未解放枠は鍵だけ（「E・D」などの文字なし）・読み上げの解放条件と枠の数（2/3/4/6）は従来どおり
//  Playwright / Chromium が無い環境では省略（skip）する。
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import * as H from './e2e/harness.mjs';

const SKIP = H.skipReason();
let L = null;
test.before(async () => { if (!SKIP) L = await H.launch(); });
test.after(async () => { if (L) await L.close(); });
const OPEN = [];
const openPage = async (o) => { const p = await L.open(o); OPEN.push(p); return p; };
test.afterEach(async () => { for (const p of OPEN.splice(0)) await p.ctx.close(); });
const SIZES = [[375, 667], [390, 844], [430, 932]];
/** 画面の記録（環境変数 MM_SHOT にフォルダを渡したときだけ。報告用） */
const shot = (pg, n) => (process.env.MM_SHOT ? pg.screenshot({ path: `${process.env.MM_SHOT}/${n}.png` }) : null);

for (const size of SIZES) {
  test(`GB-1（${size.join('×')}）：購入・命名 → 丸い顔と光の粒・「〔名前〕を手に入れた！」→ カレンのお礼 → 街`, { skip: SKIP, timeout: 120000 }, async () => {
    const p = await openPage({ size, got: true, karen: true }); const pg = p.page;
    await H.newGame(pg, 'テスト');
    await pg.evaluate(() => { finaFlags().karenIntro = 1; finaFlags().first = Object.assign(finaFlags().first || {}, { market: 1 }); save(); market(); });
    await pg.waitForSelector('.p10mk'); await pg.waitForTimeout(800);
    await pg.waitForFunction(() => !document.querySelector('.mmtalk'), null, { timeout: 8000 }).catch(() => {}); await H.finishTalk(pg);
    await H.marketDetail(pg); await pg.click('#p10info .p10buy'); await pg.waitForSelector('#p10ov'); await pg.waitForTimeout(600);
    await pg.fill('#mnm', 'ソラ');
    await pg.evaluate(() => { const b = document.querySelector('#p10ov .p10ok'); b.click(); b.click(); });   // 確定ボタンの二度押し
    await pg.waitForSelector('.mkgot'); await pg.waitForTimeout(1200);
    const g = await pg.evaluate(() => { const e = document.querySelector('.mkgot'), f = e.querySelector('.gotf').getBoundingClientRect(), t = e.querySelector('.gott b').getBoundingClientRect(), i = e.querySelector('.gotf img');
      return { tx: e.querySelector('.gott b').textContent, cx: f.left + f.width / 2, W: innerWidth, H: innerHeight, f: [f.top, f.bottom, f.width], t: [t.left, t.right, t.bottom], img: i && i.complete && i.naturalWidth > 0, src: i && i.getAttribute('src'), n: document.querySelectorAll('.mkgot').length, talk: !!document.querySelector('.mmtalk'), band: !!document.querySelector('.mmnote') }; });
    assert.equal(g.tx, 'ソラを手に入れた！', '命名した名前で'); assert.equal(g.n, 1, '演出は1つ'); assert.ok(g.img, `丸い顔の画像 ${g.src}`);
    assert.ok(Math.abs(g.cx - g.W / 2) < 3 && g.f[0] > 0 && g.f[1] < g.H * 0.75 && g.f[2] >= 150, `中央に大きめ ${JSON.stringify(g)}`);
    assert.ok(g.t[0] >= 0 && g.t[1] <= g.W && g.t[2] <= g.H, '名前は画面の中');
    assert.deepEqual([g.talk, g.band], [false, false], '演出の間は会話・帯なし');
    await shot(pg, `gb1_${size.join('x')}`);
    await pg.waitForSelector('.mmtalk:not(.mmtalk-out)', { timeout: 6000 });
    const k = await pg.evaluate(() => MMNPC.state());
    assert.equal(k.npc, 'karen'); await H.finishTalk(pg);
    await pg.waitForSelector('.map.town');
    const s = await H.storedSave(pg);
    assert.deepEqual([s.m && s.m.name, s.box.length, s.cnt], ['ソラ', 0, 1], '購入は1体だけ（二度押しでも）');
    assert.deepEqual(await pg.evaluate(() => MM_GOT_LOG.map((x) => x.title)), ['ソラを手に入れた！'], '演出は1回');
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });

  test(`GB-2・GB-3（${size.join('×')}）：「出発する」を上へ（ベースキャンプ・出発準備）・バッグの未解放枠は鍵だけ`, { skip: SKIP, timeout: 120000 }, async () => {
    const p = await openPage({ size }); const pg = p.page;
    await H.newGame(pg, 'テスト');
    await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; save(); hall('t'); });
    await pg.waitForSelector('.fm.bc .bcgo .fmgo'); await pg.waitForTimeout(700);
    const b = await pg.evaluate(() => { const g = document.querySelector('.bcgo .fmgo').getBoundingClientRect(), bar = document.querySelector('.fm.bc .bcbar').getBoundingClientRect(), mon = document.querySelector('.fm.bc .bcfield').getBoundingClientRect();
      return { gap: bar.top - g.bottom, top: g.top, bottom: g.bottom, mon: mon.bottom, H: innerHeight }; });
    assert.ok(b.gap >= (size[1] <= 700 ? 50 : 80), `下のバーから離れる ${JSON.stringify(b)}`); assert.ok(b.top > 0 && b.bottom < b.H, '画面の中');
    assert.ok(b.mon <= b.top + 2, `モンスターの場所と重ならない ${JSON.stringify(b)}`);
    await shot(pg, `gb2_bc_${size.join('x')}`);
    await pg.evaluate(() => prepScr()); await pg.waitForSelector('.pp .ppgobtn'); await pg.waitForTimeout(500);
    const q = await pg.evaluate(() => { const g = document.querySelector('.pp .ppgobtn').getBoundingClientRect(), pp = document.querySelector('.pp').getBoundingClientRect();
      const locks = [...document.querySelectorAll('.ppsl.lock')]; return { gap: pp.bottom - g.bottom, H: innerHeight, top: g.top, n: document.querySelectorAll('.ppslots .ppsl').length, locks: locks.map((e) => [e.textContent.trim(), e.getAttribute('aria-label')]) }; });
    assert.ok(q.gap >= (size[1] <= 700 ? 24 : 34), `出発準備の「出発する」も下から離れる ${JSON.stringify(q)}`); assert.ok(q.top > 0);
    assert.equal(q.n, 6, '6つの枠（使える2・未解放4）');
    assert.deepEqual(q.locks, [['🔒', '未解放の枠（E・D優勝で解放）'], ['🔒', '未解放の枠（C・B優勝で解放）'], ['🔒', '未解放の枠（A・S優勝で解放）'], ['🔒', '未解放の枠（A・S優勝で解放）']], '鍵だけ（読み上げの解放条件は従来どおり）');
    assert.equal(await pg.evaluate(() => MMP7.bagCap(S)), 2, '枠の数は変えない');
    await shot(pg, `gb2_pp_${size.join('x')}`);
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}
