// =========================================================
// 2026-10-19 ミュロル（登録のみ・未解禁）の実ブラウザ確認（QA 試遊モード ?mmQaTrial=1 だけ）
//  MY-B1 QA の一覧＝9体目にミュロル・10技とも「実戦可能」（SK 80〜89）・カード10枚・絵の比較パネル（2.5D・待機・比較・対戦表・VS・表情6）・新歩行の確認（5方向×4コマ＋左は反転）
//  MY-B2 常設バトル QA のステージで全10技を味方側・敵側で再生＝myurol_moves_1019 のコマが出る・残らない・エラー／404 なし。
//        No.10 マリンストリーム＝津波（舞台の座標の層）が本体の後ろ（z 6）・命中が前（z 8）・敵側は左右反転（scaleX(-1)）して攻撃側の後ろから相手へ
//  MY-B3 比較画面 → QA 試合（6枠＝No.10・待機絵＝idle_myurol・固有スキル「しめったはだ」）→ STOP で実際の技アニメ（舞台の津波）→ QA 一覧へ・通常のセーブを書き換えない
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import * as H from './e2e/harness.mjs';
const SKIP = H.skipReason();
const ranchSave = async (pg) => { await H.newGame(pg, 'テスト'); await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; S.g = 1234; save(); farm(); }); };
const stored = (pg) => pg.evaluate(() => Object.fromEntries(Object.keys(localStorage).filter((k) => /^mr4/.test(k)).sort().map((k) => [k, localStorage.getItem(k)])));
// 再生中の #bt の技アニメの層を集める（src・舞台の層・z・左右反転・中心）
const WATCH = () => { window.__myw = { seen: new Set(), stage: [] }; const mo = new MutationObserver(() => document.querySelectorAll('#bt .p25f').forEach((e) => {
  const s = (e.getAttribute('src') || (e.querySelector('img') && e.querySelector('img').getAttribute('src')) || '').split('/').slice(-2).join('/'); if (s) window.__myw.seen.add(s);
  if (e.dataset.layer && !window.__myw.stage.some((x) => x.cut === e.dataset.cut)) window.__myw.stage.push({ cut: e.dataset.cut, layer: e.dataset.layer, z: e.style.zIndex, f: +e.dataset.f, cx: +e.dataset.cx, tf: (e.getAnimations && e.getAnimations()[0] && e.getAnimations()[0].effect.getKeyframes().map((k) => k.transform).find(Boolean)) || '' }); }));
  mo.observe(document.getElementById('bt'), { childList: true, subtree: true }); window.__myw.mo = mo; };

test('MY-B1〜B3：ミュロルの QA（一覧・新歩行・ステージで全10技×両側・舞台の津波・QA 試合・セーブを守る）', { skip: SKIP, timeout: 1500000 }, async () => {
  const L = await H.launch();
  try {
    const p = await L.open({ query: '?mmQaTrial=1', size: [390, 844] }); const pg = p.page; await ranchSave(pg);
    const s0 = await stored(pg);
    await pg.waitForSelector('#mmqa-sw'); await pg.click('#mmqa-sw'); await pg.waitForSelector('#mmqa .qcard');
    // MY-B1
    const cat = await pg.evaluate(() => { const c = MMQA.catalog(); return { n: c.length, last: c[8] && { key: c[8].key, sp: c[8].sp, name: c[8].name, moves: c[8].moves.map((m) => [m.no, m.name, m.slot, m.status, m.power, m.accuracy, m.critical]) } }; });
    assert.equal(cat.n, 9, '9体（9体目＝ミュロル）'); assert.deepEqual([cat.last.key, cat.last.sp, cat.last.name], ['myurol', 8, 'ミュロル']);
    assert.deepEqual(cat.last.moves, [[1, 'しっぽうち', 80, 'battle', 65, 100, 5], [2, 'みずでっぽう', 81, 'battle', 70, 95, 5], [3, 'タックル', 82, 'battle', 80, 90, 10], [4, 'あわのまもり', 83, 'battle', null, 100, null],
      [5, 'テールスイング', 84, 'battle', 100, 85, 15], [6, 'アクアバブル', 85, 'battle', 100, 90, 10], [7, 'バブルスナイプ', 86, 'battle', 90, 100, 10], [8, 'すいすいステップ', 87, 'battle', null, 100, null], [9, 'スパイラルテール', 88, 'battle', 115, 85, 15], [10, 'マリンストリーム', 89, 'battle', 125, 85, 20]]);
    await pg.click('#mmqa .qtab[data-i="8"]');
    await pg.waitForFunction(() => { const im = [...document.querySelectorAll('#mmqa .qcard img')]; return im.length === 10 && im.every((x) => x.complete && x.naturalWidth > 0 && /cards_1014\/myurol\//.test(x.getAttribute('src'))); }, null, { timeout: 30000 });
    await pg.click('#mmqa .qcard[data-n="9"]'); await pg.waitForSelector('#mmqa .qdet img.big');
    await pg.waitForFunction(() => { const im = [...document.querySelectorAll('#mmqa .qpics img')]; return im.length === 11 && im.every((x) => x.complete && x.naturalWidth > 0); }, null, { timeout: 30000 });   // 2.5D・待機・比較・対戦表・VS・表情6
    assert.match(await pg.textContent('#mmqa .qdet'), /舞台の座標＝津波 V2/);
    await pg.click('#mmqa .qdet .qno');
    // 新歩行（walk_1018/myurol の 5方向×4コマ・左は反転）
    await pg.click('#mmqa .qwk7'); await pg.waitForSelector('#mmqa .qwalk.q7');
    await pg.waitForFunction(() => { const im = [...document.querySelectorAll('#mmqa .qwalk .q7c:not(.old) img')]; return im.length === 32 && im.every((x) => x.complete && x.naturalWidth > 0 && /walk_1018\/myurol\//.test(x.getAttribute('src'))); }, null, { timeout: 30000 });
    const wk = await pg.evaluate(() => [...document.querySelectorAll('#mmqa .qwalk .q7c')].map((c) => [c.classList.contains('fl'), c.querySelector('img').getAttribute('src').split('/').pop(), getComputedStyle(c.querySelector('div')).transform]));
    assert.equal(wk.filter((w) => w[0]).length, 3, '左3方向は反転'); assert.ok(wk.every((w) => /^(back|backd|side|frontd|front)_1\.webp$/.test(w[1])), JSON.stringify(wk));
    await pg.click('#mmqa .qwalk [data-a="close"]');
    // MY-B2：ステージ
    assert.equal(await pg.evaluate(() => MMQA.stage(8, 1)), true);
    await pg.waitForSelector('#mmqas'); await pg.waitForTimeout(800);
    const recs = [];
    for (const side of [0, 1]) {
      await pg.evaluate((s) => MMQAS.change('side', String(s)), side);
      for (let no = 1; no <= 10; no++) {
        await pg.evaluate((n) => MMQAS.change('no', String(n)), no);
        const r = await pg.evaluate(async (w) => { eval(w)(); const rec = await MMQAS.play(); window.__myw.mo.disconnect(); return { kind: rec && rec.kind, err: rec && rec.err, ms: rec && rec.ms, seen: [...window.__myw.seen], stage: window.__myw.stage }; }, `(${WATCH})`);
        recs.push({ side, no, ...r });
        assert.equal(r.kind, 'anim', `${side}-${no}`); assert.ok(!r.err, r.err);
        assert.ok(r.seen.some((s) => s.startsWith('myurol_moves_1019/')), `技アニメのコマ ${side}-${no} ${JSON.stringify(r.seen)}`);
        if (no === 10) {
          const fx = r.stage.filter((x) => x.layer === 'fx'), hit = r.stage.filter((x) => x.layer === 'hit');
          assert.equal(fx.length, 7, `津波 7コマ ${JSON.stringify(r.stage)}`); assert.equal(hit.length, 2, '命中 2コマ');
          assert.ok(fx.every((x) => x.z === '6') && hit.every((x) => x.z === '8'), '津波は本体の後ろ・命中は前');
          assert.ok(r.stage.every((x) => x.f === (side ? -1 : 1) && /scaleX\((-1|1)\)/.test(x.tf) && x.tf.includes(`scaleX(${side ? -1 : 1})`)), `敵側は舞台ごと左右反転 ${JSON.stringify(r.stage.slice(0, 2))}`);
          // 津波は攻撃側の後ろから相手へ（1コマ目の中心 → 7コマ目の中心が相手の方向へ動く）・命中は相手の側
          const dir = side ? -1 : 1, c1 = fx.find((x) => /fx1$/.test(x.cut)).cx, c7 = fx.find((x) => /fx7$/.test(x.cut)).cx;
          assert.ok(dir * (c7 - c1) > 60, `津波は相手の方向へ進む ${c1} → ${c7}`);
          assert.ok(hit.every((x) => dir * (x.cx - c1) > 100), '命中は相手の側');
          await pg.screenshot({ path: `${process.env.MY_SHOT || '/tmp'}/my_stage10_${side}.png` });
        }
        if (no === 4 || no === 8) assert.ok(!r.seen.some((s) => /_hit\d+_t\.webp$/.test(s)), '補助技は相手に命中エフェクトを出さない');
        assert.equal(await pg.evaluate(() => document.querySelectorAll('#bt .p25f').length), 0, '再生のあとにコマが残らない');
      }
    }
    await pg.evaluate(() => MMQAS.close()); await pg.waitForSelector('#mmqa .qcard', { state: 'visible', timeout: 60000 });
    // MY-B3：比較 → QA 試合（No.10）
    await pg.click('#mmqa .qtab[data-i="8"]'); await pg.click('#mmqa .qcard[data-n="9"]'); await pg.click('#mmqa .qdet .qgo');
    await pg.waitForSelector('#cmp .c2go'); await pg.waitForFunction(() => [...document.querySelectorAll('#cmp img')].some((i) => /compare_1015\/myurol/.test(i.getAttribute('src') || '') && i.complete && i.naturalWidth > 0), null, { timeout: 15000 });
    assert.match(await pg.textContent('#cmp'), /しめったはだ/);
    await pg.waitForTimeout(400); await pg.click('#cmp .c2go');
    await pg.waitForSelector('#bt'); await pg.waitForFunction(() => { const g = document.getElementById('go'); return g && !g.disabled && !g.classList.contains('bk'); }, null, { timeout: 30000 });
    const b = await pg.evaluate(() => ({ sp: BPL[0].sp, eq: BPL[0].eq.slice(0, 6), idle: (document.querySelector('#m0 .mma-idle') || {}).getAttribute && document.querySelector('#m0 .mma-idle').getAttribute('src') }));
    assert.equal(b.sp, 8); assert.deepEqual(b.eq, Array(6).fill(89)); assert.match(b.idle || '', /idle_myurol\.webp/);
    await pg.evaluate((w) => eval(w)(), `(${WATCH})`);
    await pg.click('#go');
    // 自分の番の技（No.10）の層を待つ（相手の番の技＝ソラモの絵は数えない）。ルーレットが MISS に止まったときは技が出ない＝そのときは確かめない
    const got = await pg.waitForFunction(() => [...window.__myw.seen].some((s) => s.startsWith('myurol_moves_1019/m10_')) && window.__myw.stage.length >= 7, null, { timeout: 9000 }).then(() => true, () => false);
    const seen = await pg.evaluate(() => { window.__myw.mo.disconnect(); return { seen: [...window.__myw.seen], stage: window.__myw.stage.length, msg: (document.getElementById('msg') || {}).textContent || '' }; });
    if (!got) assert.ok(!seen.seen.some((s) => s.startsWith('myurol_moves_1019/')), `ミュロルの技が出たのに舞台の津波が無い ${JSON.stringify(seen)}`);
    console.log('MY-B3', got ? '実戦で舞台の津波' : 'MISS（技なし）', JSON.stringify(seen).slice(0, 300));
    await pg.evaluate(() => MMQA.endBattle()); await pg.waitForSelector('#mmqa .qcard', { state: 'visible', timeout: 60000 });
    await pg.click('#mmqa .qoff'); await pg.waitForSelector('#app>.rn');
    assert.deepEqual(await stored(pg), s0, '通常のセーブ（mr4…）を書き換えない');
    assert.equal(await pg.evaluate(() => IMG[8] === undefined && !MMARENA.IDLE[8]), true, 'QA を出たらミュロルの絵を返す');
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
    console.log(JSON.stringify(recs.map((r) => [r.side, r.no, r.ms, r.stage.length])));
  } finally { await L.close(); }
});
