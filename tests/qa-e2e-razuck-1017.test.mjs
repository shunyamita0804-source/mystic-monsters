// =========================================================
// 2026-10-17 ラズック（統合便：正式10技性能・技アニメ 81枚・制作候補の絵）の実ブラウザ確認（QA 試遊モード ?mmQaTrial=1 だけ）
//  RZ-B1 QA の一覧＝7体目にラズック・10技とも「実戦可能」（SK 60〜69）・カード10枚が読める・絵の比較パネル（待機・比較・対戦表・VS・表情6）
//  RZ-B2 常設バトル QA のステージで全10技を味方側・敵側で再生＝実戦と同じ描画（anim）・ラズックの技アニメのコマ（razuck_moves_1017）が出る・残らない・エラー／404 なし
//  RZ-B3 比較画面 → QA 試合（ルーレットの6枠＝選んだ技・待機絵＝idle_razuck）→ QA 一覧へ・通常のセーブを書き換えない
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import * as H from './e2e/harness.mjs';
const SKIP = H.skipReason();
const ranchSave = async (pg) => { await H.newGame(pg, 'テスト'); await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; S.g = 1234; save(); farm(); }); };
const stored = (pg) => pg.evaluate(() => Object.fromEntries(Object.keys(localStorage).filter((k) => /^mr4/.test(k)).sort().map((k) => [k, localStorage.getItem(k)])));

test('RZ-B1〜B3：ラズックの QA（一覧・ステージで全10技×両側・QA 試合・セーブを守る）', { skip: SKIP, timeout: 1500000 }, async () => {
  const L = await H.launch();
  try {
    const p = await L.open({ query: '?mmQaTrial=1', size: [390, 844] }); const pg = p.page; await ranchSave(pg);
    const s0 = await stored(pg);
    await pg.waitForSelector('#mmqa-sw'); await pg.click('#mmqa-sw'); await pg.waitForSelector('#mmqa .qcard');
    // RZ-B1
    const cat = await pg.evaluate(() => { const c = MMQA.catalog(); return { n: c.length, last: c[6] && { key: c[6].key, sp: c[6].sp, name: c[6].name, moves: c[6].moves.map((m) => [m.no, m.name, m.slot, m.status, m.power, m.accuracy, m.critical]) } }; });
    assert.equal(cat.n, 7, '7体');
    assert.deepEqual(cat.last.moves, [[1, 'かみつき', 60, 'battle', 65, 95, 5], [2, 'ひっかき', 61, 'battle', 60, 100, 10], [3, 'すばやい一撃', 62, 'battle', 75, 100, 10], [4, 'ちょこまか', 63, 'battle', null, 100, null],
      [5, 'ガジガジラッシュ', 64, 'battle', 85, 90, 15], [6, 'トリックショット', 65, 'battle', 90, 95, 10], [7, 'かく乱ステップ', 66, 'battle', null, 100, null], [8, 'シャドーバイト', 67, 'battle', 110, 80, 15], [9, 'ミラージュダッシュ', 68, 'battle', 115, 90, 20], [10, 'ラズックラッシュ', 69, 'battle', 125, 90, 20]]);
    await pg.click('#mmqa .qtab[data-i="6"]');
    await pg.waitForFunction(() => { const im = [...document.querySelectorAll('#mmqa .qcard img')]; return im.length === 10 && im.every((x) => x.complete && x.naturalWidth > 0 && /cards_1014\/razuck\//.test(x.getAttribute('src'))); }, null, { timeout: 30000 });
    await pg.click('#mmqa .qcard[data-n="0"]'); await pg.waitForSelector('#mmqa .qdet img.big');
    await pg.waitForFunction(() => { const im = [...document.querySelectorAll('#mmqa .qpics img')]; return im.length === 10 && im.every((x) => x.complete && x.naturalWidth > 0); }, null, { timeout: 30000 });
    assert.equal(await pg.textContent('#mmqa .qdet .qgo'), 'この技で QA 試合');
    await pg.click('#mmqa .qdet .qno');
    // RZ-B2：ステージ
    assert.equal(await pg.evaluate(() => MMQA.stage(6, 1)), true);
    await pg.waitForSelector('#mmqas'); await pg.waitForTimeout(800);
    const recs = [];
    for (const side of [0, 1]) {
      await pg.evaluate((s) => MMQAS.change('side', String(s)), side);
      for (let no = 1; no <= 10; no++) {
        await pg.evaluate((n) => MMQAS.change('no', String(n)), no);
        const r = await pg.evaluate(async () => { const seen = new Set(); const mo = new MutationObserver(() => document.querySelectorAll('#bt .p25f').forEach((e) => { const s = e.getAttribute('src') || (e.querySelector('img') && e.querySelector('img').getAttribute('src')) || ''; if (s) seen.add(s.split('/').slice(-2).join('/')); })); mo.observe(document.getElementById('bt'), { childList: true, subtree: true }); const rec = await MMQAS.play(); mo.disconnect(); return { kind: rec && rec.kind, err: rec && rec.err, ms: rec && rec.ms, seen: [...seen] }; });
        recs.push({ side, no, ...r });
        assert.equal(r.kind, 'anim', `${side}-${no}`); assert.ok(!r.err, r.err);
        assert.ok(r.seen.some((s) => s.startsWith('razuck_moves_1017/')), `技アニメのコマ ${side}-${no} ${JSON.stringify(r.seen)}`);
        assert.equal(await pg.evaluate(() => document.querySelectorAll('#bt .p25f').length), 0, '再生のあとにコマが残らない');
        if (no === 5 || no === 10) await pg.screenshot({ path: `${process.env.RZ_SHOT || '/tmp'}/rz_stage_${side}_${no}.png` });
      }
    }
    await pg.evaluate(() => MMQAS.close()); await pg.waitForSelector('#mmqa .qcard', { state: 'visible', timeout: 60000 });
    // RZ-B3：比較 → QA 試合
    await pg.click('#mmqa .qtab[data-i="6"]'); await pg.click('#mmqa .qcard[data-n="9"]'); await pg.click('#mmqa .qdet .qgo');
    await pg.waitForSelector('#cmp .c2go'); await pg.waitForFunction(() => [...document.querySelectorAll('#cmp img')].some((i) => /compare_1015\/razuck/.test(i.getAttribute('src') || '') && i.complete && i.naturalWidth > 0), null, { timeout: 15000 });
    assert.match(await pg.textContent('#cmp'), /調子に乗る/);
    await pg.waitForTimeout(400); await pg.click('#cmp .c2go');
    await pg.waitForSelector('#bt'); await pg.waitForFunction(() => { const g = document.getElementById('go'); return g && !g.disabled; }, null, { timeout: 30000 });
    const b = await pg.evaluate(() => ({ sp: BPL[0].sp, eq: BPL[0].eq.slice(0, 6), idle: (document.querySelector('#m0 .mma-idle') || {}).getAttribute && document.querySelector('#m0 .mma-idle').getAttribute('src'), spd: BPL[0].speed }));
    assert.equal(b.sp, 6); assert.deepEqual(b.eq, Array(6).fill(69)); assert.match(b.idle || '', /idle_razuck\.webp/);
    await pg.click('#go'); await pg.waitForTimeout(2500);
    await pg.evaluate(() => MMQA.endBattle()); await pg.waitForSelector('#mmqa .qcard', { state: 'visible', timeout: 60000 });
    await pg.click('#mmqa .qoff'); await pg.waitForSelector('#app>.rn');
    assert.deepEqual(await stored(pg), s0, '通常のセーブ（mr4…）を書き換えない');
    assert.equal(await pg.evaluate(() => IMG[6] === undefined && !MMARENA.IDLE[6]), true, 'QA を出たらラズックの絵を返す');
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
    console.log(JSON.stringify(recs.map((r) => [r.side, r.no, r.ms])));
  } finally { await L.close(); }
});
