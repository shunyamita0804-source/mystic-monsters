// 外部化した画像（assets/inline/）が、どの画面でいつ要求されるかを実ブラウザで記録する道具（テストではない）
//   node tools/inline-images/usage.mjs [出力 JSON]
// 画面ごとに「その画面に入ってから要求された assets/inline のファイル」を並べる。新しいバトル画面（既定）と旧（設定の「バトル画面：旧」＋?battleArt=old）の両方。
import { writeFileSync } from 'node:fs';
import * as H from '../../tests/e2e/harness.mjs';

const OUT = process.argv[2];
const L = await H.launch();
const all = {};
const pressStop = async (pg) => { if (await pg.evaluate(() => { const g = document.getElementById('go'); return !!g && !g.disabled && !g.classList.contains('bk'); })) await pg.click('#go').catch(() => {}); };

for (const [ui, query] of [['new', ''], ['old', '?battleArt=old']]) {
  const p = await L.open({ size: H.SIZES.base, query, raw: ui === 'old' ? { mmbattleui: 'old' } : {} }); const pg = p.page;
  let cur = 'boot'; const log = {};
  pg.on('request', (r) => { const u = r.url(); if (u.includes('/assets/inline/')) (log[cur] = log[cur] || []).push(u.split('/assets/inline/')[1]); });
  const at = async (name, fn, wait = 1200) => { cur = name; await fn(); await pg.waitForTimeout(wait); };
  await at('title', async () => {});
  await at('town', () => H.newGame(pg, 'テスト'));
  await at('ranch', () => pg.evaluate(() => { S.m = mk(0); S.m.name = 'ソラ'; MMP7.ensureProg(S.m); S.box = [mk(1)]; save(); farm(); }));
  await at('market', () => pg.evaluate(() => { lobby(); market(); }));
  await at('lab', () => pg.evaluate(() => { museum(); museum('book'); musd(0); museum('fuse'); museum('table'); }));
  await at('basecamp', () => pg.evaluate(() => { lobby(); hall(); }));
  await at('status', () => pg.evaluate(() => hall('st')));
  await at('moves', () => pg.evaluate(() => hall('w')));
  await at('train_menu', () => pg.evaluate(() => hall('s')));
  for (const sp of [0, 1]) {
    await at(`tour_table_sp${sp}`, async () => {
      await pg.evaluate((sp) => { const m = mk(sp); m.name = sp ? 'ガウ' : 'ソラ'; Object.assign(m, { po: 999, in: 999, hi: 999, li: 999 }); MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); const g = MMCH.graphFor(m); Object.assign(m.raise, { node: g.goal, goal: true, pend: null }); m.raise.field.arrivalSeen = true; save(); if (!MMP8.startTournament(S, S.m, 0, 7).ok) throw new Error('startTournament'); save(); board(); }, sp);
      await pg.waitForSelector('.tb1 .tbgo', { timeout: 20000 });
    });
    await at(`tour_compare_sp${sp}`, async () => { await pg.click('.tb1 .tbgo'); await pg.waitForSelector('.p9cmps, .mmcmp, #cmp', { timeout: 10000 }).catch(() => {}); });
    await at(`battle_start_sp${sp}`, async () => { await pg.evaluate(() => p8TourFight()); await pg.waitForSelector('#bt', { timeout: 15000 }); }, 1500);
    cur = `battle_turns_sp${sp}`;
    for (let i = 0; i < 160; i++) { if (await pg.evaluate(() => { const g = document.getElementById('go'); return !!g && g.classList.contains('bk'); })) break; await pressStop(pg); await pg.waitForTimeout(250); }
    await at(`battle_end_sp${sp}`, async () => {}, 2000);
    await at(`after_battle_sp${sp}`, () => pg.click('#go').catch(() => {}), 1000);
  }
  all[ui] = log;
  await p.ctx.close();
}
await L.close();
for (const [ui, log] of Object.entries(all)) {
  console.log(`== ${ui}`);
  for (const [k, v] of Object.entries(log)) console.log(`${k}: ${v.length}  ${[...new Set(v.map((x) => x.split('/')[0]))].join(',')}`);
}
if (OUT) writeFileSync(OUT, JSON.stringify(all, null, 1));
