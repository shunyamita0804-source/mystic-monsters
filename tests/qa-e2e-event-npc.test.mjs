// =========================================================
// QA（実ブラウザ）：第二段階・追加アセット（2026-10-04）＝Chapter 1 のイベント挿絵 12枚・主要 NPC の表情 32枚
//  EN-B1：イベントの挿絵カード（390×844・375×667）＝盤面を暗く → 挿絵（3:2・切れない）→ イベント名 → 小さな会話窓（挿絵を隠さない）→ 結果。
//         後ろにサイコロ・予兆・出目を残さない。会話中の START はサイコロを振らない。会話の途中で再読み込みしても効果は1回
//  EN-B2：画像の読み込み：挿絵 12枚と NPC 96枚（32 表情 × closeup／full／face）が 404 なく読め、透過（四隅が透明・中央に人物）
//  EN-B3：場面ごとの表情（カレンの購入＝04・ダンの帰還＝04・ニックの売却＝03・エリオットの合体＝03・ヴァルガス＝02・セドリックの試合開始＝02・ゲンシンの開始＝02／初回＝01・アイテム屋の購入＝04）
//  EN-B4：表情の切り替えで立ち絵の位置・大きさが動かない（390×844・375×667。8人 × 4表情）
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
test.afterEach(async () => { for (const p of OPEN.splice(0)) await p.ctx.close().catch(() => {}); });
const T = (name, fn) => test(name, { skip: SKIP }, fn);

async function clearFina(pg, max = 8) { for (let i = 0; i < max; i++) { if (!(await pg.$('.chf-fina'))) return; await pg.waitForTimeout(380); const f = await pg.$('.chf-fina'); if (f) await f.click().catch(() => {}); await pg.waitForTimeout(300); } }
async function start(pg) {
  await H.newGame(pg, 'テスト');
  await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); S.npcFlags.story = ['tut_event', 'tut_stat', 'tut_rest']; save(); board(); });
  await pg.waitForSelector('#chf .chf-bg'); await pg.waitForTimeout(700);
  await clearFina(pg);
  await pg.waitForFunction(() => !bBusy && !MMCHD.isLocked(), null, { timeout: 20000 }); await pg.waitForTimeout(250);
}
const landOn = (pg, ev) => pg.evaluate((ev) => {
  const g = MMCH.graphFor(S.m), a = S.m.raise.field.nodeAssignments, used = S.m.raise.field.consumedEvents;
  const id = g.order.find((x) => a[x] && a[x].t === 'event' && !a[x].recovery && g.nodes[x].field <= 4 && !used.includes(x));
  a[id] = { t: 'event', tier: 'normal', ev };
  const r = S.m.raise; r.node = id; r.pend = { roll: 1, left: 0, stage: 'resolve' }; r.turnsUsed = 3; save(); board(); return id;
}, ev);
const talkOn = (pg, re) => pg.waitForFunction((src) => { const t = document.querySelector('.mmtalk:not(.mmtalk-out)'); return !!t && new RegExp(src).test(t.textContent); }, re, { timeout: 15000 });
/** 共通会話を最後まで送り、行ごとの［名前・立ち絵の src］を集める */
async function collectTalk(pg, max = 80) {
  const seen = [];
  for (let i = 0; i < max; i++) {
    const s = await pg.evaluate(() => { const o = document.querySelector('.mmtalk:not(.mmtalk-out)'); if (!o) return null; const im = o.querySelector('.mmtalk-fig img'); return { name: (o.querySelector('.mmtalk-name') || {}).textContent || '', src: im ? im.getAttribute('src') : '' }; });
    if (!s) { await pg.waitForFunction(() => !document.querySelector('.mmtalk'), null, { timeout: 5000 }).catch(() => {}); return seen; }
    const k = `${s.name}|${s.src}`; if (!seen.some((x) => `${x.name}|${x.src}` === k)) seen.push(s);
    await pg.click('.mmtalk:not(.mmtalk-out)', { force: true }).catch(() => {}); await pg.waitForTimeout(40);
  }
  throw new Error('会話が終わらない');
}
const rect = (pg, sel) => pg.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, b: r.bottom, r: r.right }; }, sel);

for (const size of [H.SIZES.base, H.SIZES.se]) {
  T(`EN-B1（${size.join('×')}）：挿絵カード：盤面を暗く → 挿絵（3:2・画面に収まる）→ イベント名 → 小さな会話窓（挿絵を隠さない）→ 結果。後ろに出目・予兆を残さない。会話中の START は振らない。会話の途中の再読み込みでも効果は1回`, async () => {
    const p = await openPage({ size, story: true }); const pg = p.page;
    await start(pg);
    const ev0 = await pg.evaluate(() => S.m.ev);
    await landOn(pg, 'small_animal');
    await pg.waitForSelector('.chf-evc.on[data-ev="small_animal"]', { timeout: 15000 });
    await talkOn(pg, 'こっちを気にしてる'); await pg.waitForTimeout(500);
    const L1 = await pg.evaluate(() => {
      const c = document.querySelector('.chf-evc-card'), im = c.querySelector('img'), cap = c.querySelector('figcaption'), dim = document.querySelector('.chf-evc-dim'), w = document.querySelector('.mmtalk .mmtalk-win');
      const R = (e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, b: r.bottom, r: r.right }; };
      return { img: R(im), nat: [im.naturalWidth, im.naturalHeight], fit: getComputedStyle(im).objectFit, cap: cap.textContent, capR: R(cap), dim: [getComputedStyle(dim).backgroundImage !== 'none', getComputedStyle(dim).opacity], win: R(w), W: innerWidth, H: innerHeight, sw: document.documentElement.scrollWidth,
        behind: [...document.querySelectorAll('.chdz,.chroll,.chf-rustle,.chf-excl,.chf-enc,.chf-fina,.chpop')].map((e) => e.className), pres: document.querySelector('.mmtalk').dataset.pres, turns: S.m.raise.turnsUsed };
    });
    assert.deepEqual(L1.nat, [1080, 720]);
    assert.ok(Math.abs(L1.img.w / L1.img.h - 1.5) < 0.02, `挿絵は 3:2 のまま（切らない） ${JSON.stringify(L1.img)}`);
    assert.ok(L1.img.x >= 0 && L1.img.r <= L1.W && L1.img.y >= 0, '挿絵は画面に収まる'); assert.ok(L1.img.w >= L1.W * 0.85, `横長で大きく（${L1.img.w}px）`);
    assert.equal(L1.cap, '小さな生き物に導かれる'); assert.ok(L1.capR.b <= L1.win.y + 2, `イベント名は会話窓に隠れない ${JSON.stringify([L1.capR, L1.win])}`);
    assert.ok(L1.img.b <= L1.win.y + 2, '会話窓は挿絵を隠さない'); assert.ok(L1.win.b <= L1.H, '会話窓は画面内');
    assert.deepEqual(L1.dim, [true, '1'], '盤面を暗くする'); assert.equal(L1.pres, 'compact'); assert.ok(L1.sw <= L1.W + 1, '横にはみ出さない');
    assert.deepEqual(L1.behind, [], '後ろに出目・予兆・吹き出し・結果を残さない');
    // 会話の途中で START の位置を押しても、サイコロは振らない（会話が進むだけ）
    const st = await rect(pg, '#chdock'); await pg.mouse.click(st.x + st.w / 2, st.y + st.h / 2); await pg.waitForTimeout(400);
    assert.deepEqual(await pg.evaluate(() => [S.m.raise.turnsUsed, !!document.querySelector('.chdz')]), [3, false], '会話中の START でサイコロは振らない');
    // 効果は止まった時点で1回（セーブ済み）→ 会話の途中で再読み込みしても二重にならず、カードも出し直さない
    assert.equal((await H.storedSave(pg)).m.ev, ev0 + 5);
    await pg.reload(); await pg.waitForFunction(() => typeof window.MMP8 === 'object'); await pg.click('.p15start');
    await pg.waitForSelector('#chf .chf-bg', { timeout: 20000 }); await pg.waitForTimeout(1500);
    assert.deepEqual(await pg.evaluate(() => [S.m.ev, S.m.raise.pend, !!document.querySelector('.chf-evc'), S.m.raise.turnsUsed]), [ev0 + 5, null, false, 3], '再読み込みで二重に起きない');
    // 2択：選択肢まで挿絵の上の小さな窓。選択肢のボタンも画面内
    await pg.waitForFunction(() => !bBusy && !MMCHD.isLocked(), null, { timeout: 20000 });
    await landOn(pg, 'sudden_rain');
    await pg.waitForSelector('.chf-evc.on[data-ev="sudden_rain"]', { timeout: 15000 }); await talkOn(pg, '降ってきた');
    for (let i = 0; i < 20 && !(await pg.$('.mmtalk-choice')); i++) { await pg.click('.mmtalk:not(.mmtalk-out)', { force: true }).catch(() => {}); await pg.waitForTimeout(120); }
    await pg.waitForSelector('.mmtalk-choice', { timeout: 15000 }); await pg.waitForTimeout(400);
    const ch = await pg.evaluate(() => [...document.querySelectorAll('.mmtalk-choice')].map((b) => { const r = b.getBoundingClientRect(); return [b.textContent, r.bottom <= innerHeight, r.right <= innerWidth, r.height]; }));
    assert.equal(ch.length, 2); for (const c of ch) { assert.ok(c[1] && c[2], `選択肢は画面内 ${c}`); assert.ok(c[3] < 70, `選択肢は1〜2行（${c[3]}px）`); }
    const de0 = await pg.evaluate(() => S.m.de);
    await H.chooseTalk(pg, 'go');
    await pg.waitForSelector('.chpop.ev', { timeout: 15000 });
    assert.equal(await pg.evaluate(() => !!document.querySelector('.chf-evc')), false, '結果の前に挿絵は消える');
    await pg.waitForFunction(() => !bBusy && !document.querySelector('.chpop,.mmtalk,.chf-evc'), null, { timeout: 20000 });
    assert.deepEqual(await pg.evaluate(() => [S.m.de, S.m.raise.turnsUsed]), [de0 + 5, 3], 'このまま進む＝丈夫さ +5・追加ターンなし');
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}

T('EN-B2：挿絵 12枚と NPC の表情 96枚（8人 × 4表情 × closeup／full／face）が 404 なく読める。NPC は透過（上の四隅が透明・中央に人物）', async () => {
  const p = await openPage({}); const pg = p.page;
  await pg.waitForFunction(() => !!window.MMNPC && !!window.MMCH);
  const r = await pg.evaluate(async () => {
    const out = [], views = ['closeup', 'fullbody', 'face'];
    const load = (src) => new Promise((ok) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = src; });
    for (const id of Object.keys(MMNPC.EXPR)) for (const k of MMNPC.EXPR[id]) for (const v of views) {
      const src = MMNPC.srcOf(id, k, v), im = await load(src); if (!im) { out.push([src, 'load']); continue; }
      const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; const x = c.getContext('2d'); x.drawImage(im, 0, 0);
      const a = (px, py) => x.getImageData(Math.min(c.width - 1, Math.max(0, px)), Math.min(c.height - 1, Math.max(0, py)), 1, 1).data[3];
      const corners = [a(1, 1), a(c.width - 2, 1)];   // 上の四隅（下は体・足が端まで届く切り出し）
      const center = a(c.width / 2, c.height * (v === 'face' ? 0.55 : 0.35));
      if (corners.some((q) => q > 8)) out.push([src, 'corner', corners]); if (center < 200) out.push([src, 'center', center]);
    }
    for (const e of MMCH.getConfig(1).eventPool.filter((e) => e.image)) { const im = await load(e.image); if (!im || im.naturalWidth !== 1080) out.push([e.image, 'event']); }
    return { bad: out, n: Object.values(MMNPC.EXPR).reduce((s, a) => s + a.length, 0) };
  });
  assert.equal(r.n, 32); assert.deepEqual(r.bad, []);
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

T('EN-B3：場面ごとの表情：カレンの購入成功＝04・研究所の合体＝エリオット 03・牧場の売却＝ニック 03・闘技場の初回＝ヴァルガス 02・アイテム屋の初回＝02／購入＝04・特訓の初回＝ゲンシン 01／開始＝02・ファームへの帰還＝ダン 04・大会の対戦前＝セドリック 02', async () => {
  const p = await openPage({ npc: true, karen: true }); const pg = p.page;
  await H.newGame(pg, 'テスト');
  // 市場：初回の会話 → 購入 → カレン 04（購入成立）
  await pg.evaluate(() => { S.g = 1000; save(); market(); }); await talkOn(pg, '市場'); await H.finishTalk(pg);
  await pg.waitForFunction(() => !P10_ANIM); await pg.waitForTimeout(400);
  await H.marketDetail(pg); await pg.click('.p10buy'); await pg.waitForSelector('#p10ov .p10ok'); await pg.waitForTimeout(500); await pg.click('#p10ov .p10ok');
  await pg.waitForSelector('.mmtalk'); let t = await collectTalk(pg);
  assert.ok(t.some((x) => x.name === 'カレン' && /karen\/expr\/(?:closeup|full)\/04_sold\.webp$/.test(x.src)), `カレン：購入成立＝04 ${JSON.stringify(t)}`);
  await pg.waitForSelector('.map.town');
  // 牧場に育成完了の子を2体置いて、研究所の合体・牧場の売却
  await pg.evaluate(() => { const a = mk(1); a.name = 'ガル'; MMP7.ensureProg(a); a.raise = { ...(a.raise || {}), state: 'done' }; const b = mk(0); b.name = 'モモ'; MMP7.ensureProg(b); b.raise = { ...(b.raise || {}), state: 'done' }; S.box = [a, b]; S.g = 1000; S.trainTix = 2; save(); museum(); });
  t = await collectTalk(pg); assert.ok(t.some((x) => x.name === 'エリオット' && /elliot\/expr\/(?:closeup|full)\/0\d_/.test(x.src)), `エリオット：初回 ${JSON.stringify(t)}`);
  await pg.evaluate(() => museum('fuse')); await pg.waitForSelector('.elsay');
  assert.match(await pg.evaluate(() => document.querySelector('.elsay img').getAttribute('src')), /elliot\/expr\/face\/03_analyze\.webp$/, 'エリオット：合体＝03 分析');
  await pg.evaluate(() => farm()); t = await collectTalk(pg); assert.ok(t.some((x) => x.name === 'ニック' && /nick\/expr\/(?:closeup|full)\/02_gentle\.webp$/.test(x.src)), `ニック：初回＝02 ${JSON.stringify(t)}`);
  // 2026-10-04 PHASE H3：牧場20体の一覧。売却の確認の間は一覧の上のニックの小さな顔が 03（真剣）
  await pg.evaluate(() => { pfSellUid = S.m.uid; farm('', 'd'); }); await pg.waitForSelector('.rnnick img');
  assert.match(await pg.evaluate(() => document.querySelector('.rnnick img').getAttribute('src')), /nick\/expr\/face\/03_serious\.webp$/, 'ニック：売却（大事な管理）＝03');
  await pg.evaluate(() => lobby()); await pg.waitForSelector('.map.town'); await pg.evaluate(() => townArena());
  t = await collectTalk(pg); assert.ok(t.some((x) => x.name === 'ヴァルガス' && /vargas\/expr\/(?:closeup|full)\/02_grin\.webp$/.test(x.src)), `ヴァルガス：挑戦の受付＝02 ${JSON.stringify(t)}`);
  // アイテム屋：初回（02）→ 購入（04）
  await pg.evaluate(() => { lobby(); shopScr(); }); t = await collectTalk(pg);
  assert.ok(t.some((x) => x.name === 'ベルナ' && /shop\/expr\/full\/02_smile\.webp$|shop\/expr\/(?:closeup|full)\/02_smile\.webp$/.test(x.src)), `アイテム屋：初回＝02 ${JSON.stringify(t)}`);
  await pg.evaluate(() => shopScr('', true)); await pg.waitForSelector('.shopsay');
  const sh = await pg.evaluate(() => [document.querySelector('.shopnpc').getAttribute('src'), document.querySelector('.shopsay').textContent]);
  assert.match(sh[0], /shop\/expr\/full\/04_recommend\.webp$/); assert.match(sh[1], /アイテム屋はい、これで大丈夫。気をつけて行ってらっしゃい。/);
  // 特訓：Chapter 1 を終えた状態 → 初回（ゲンシン 01）→ 開始（02）
  await pg.evaluate(() => { const m = S.m; MMP8.depart(S, m, () => 0.37); const g = MMCH.graphFor(m); Object.assign(m.raise, { node: g.goal, goal: true, pend: null }); MMP8.declineTournament(S, m); m.raise.evSeen = ['ret1', 'rumor']; S.npcFlags.first.farm = 1; S.trainTix = 2; save(); hall('s'); });
  t = await collectTalk(pg); assert.ok(t.some((x) => x.name === 'ゲンシン' && /genshin\/expr\/(?:closeup|full)\/01_guide\.webp$/.test(x.src)), `ゲンシン：初回＝01 ${JSON.stringify(t)}`);
  await pg.evaluate(() => trStart('po')); await pg.waitForSelector('.gssay.over');
  assert.deepEqual(await pg.evaluate(() => { const g = document.querySelector('.gssay.over'); return [g.dataset.ex, /genshin\/expr\/face\/02_fired\.webp$/.test(g.querySelector('img').getAttribute('src')), g.textContent.includes('よし。始めるぞ。')]; }), ['fired', true, true], 'ゲンシン：開始＝02');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

T('EN-B3b：ファームへの帰還＝ダン 04（誇らしげ）・大会の対戦前（パラメーター比較）＝セドリック 02', async () => {
  const p = await openPage({ npc: true }); const pg = p.page;
  await H.newGame(pg, 'テスト');
  await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; S.npcFlags.first = { farm: 1 }; save(); MMP8.depart(S, m, () => 0.37); const g = MMCH.graphFor(m); Object.assign(m.raise, { node: g.goal, goal: true, pend: null }); MMP8.declineTournament(S, m); save(); hall('t'); });
  const t = await collectTalk(pg);
  assert.ok(t.some((x) => x.name === 'ダン' && /dan\/expr\/(closeup|full)\/04_proud\.webp$/.test(x.src)), `ダン：帰還＝04 ${JSON.stringify(t)}`);
  // 大会：Chapter 2 のゴールから大会進行 → パラメーター比較
  const p2 = await openPage({}); const q = p2.page;
  await H.newGame(q, 'テスト');
  await q.evaluate(() => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); const g = MMCH.graphFor(m); Object.assign(m.raise, { node: g.goal, goal: true, pend: null }); m.raise.field.arrivalSeen = true; save(); MMP8.startTournament(S, S.m, 0, 7); save(); board(); });
  await q.waitForSelector('.p9tour.tp2 .p9next .p9go', { timeout: 15000 });
  assert.match(await q.evaluate(() => document.querySelector('.p9tour .p9ced img').getAttribute('src')), /cedric\/expr\/face\/01_host\.webp$/, 'セドリック：E ランクの進行＝01 司会');
  await q.waitForTimeout(400); await q.click('.p9next .p9go'); await q.waitForSelector('.p9cmps .pcced .p9ced img');
  assert.match(await q.evaluate(() => document.querySelector('.pcced .p9ced img').getAttribute('src')), /cedric\/expr\/face\/02_kickoff\.webp$/, 'セドリック：試合開始＝02');
  const fit = await q.evaluate(() => { const a = document.querySelector('.pcacts').getBoundingClientRect(); return [a.bottom <= innerHeight + 1, document.documentElement.scrollWidth <= innerWidth + 1]; });
  assert.deepEqual(fit, [true, true], '対戦開始のボタンは画面内・横はみ出しなし');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []); assert.deepEqual(p2.errors, []); assert.deepEqual(p2.bad, []);
});

for (const size of [H.SIZES.base, H.SIZES.se]) {
  T(`EN-B4（${size.join('×')}）：表情の切り替えで立ち絵の位置・大きさが動かない（8人 × 4表情。同じ話者の行で表情だけ変える）`, async () => {
    const p = await openPage({ size }); const pg = p.page;
    await H.newGame(pg, 'テスト');
    for (const id of ['karen', 'dan', 'nick', 'elliot', 'vargas', 'cedric', 'genshin', 'shop']) {
      const keys = await pg.evaluate((id) => [...MMNPC.EXPR[id]], id);
      await pg.evaluate(([id, keys]) => { MMNPC.preload && MMNPC.preload(id); MMNPC.warm(id); window.__t = MMNPC.talk(keys.map((k) => ({ npc: id, expression: k, text: `表情 ${k}` })), { presentation: 'standard' }); }, [id, keys]);
      const rs = [];
      for (let i = 0; i < keys.length; i++) {
        await pg.waitForFunction((k) => { const o = document.querySelector('.mmtalk:not(.mmtalk-out)'); const im = o && o.querySelector('.mmtalk-fig img'); return !!im && im.complete && im.naturalWidth > 0 && im.getAttribute('src').includes(`_${k}.webp`); }, keys[i], { timeout: 8000 });
        rs.push(await rect(pg, '.mmtalk:not(.mmtalk-out) .mmtalk-fig img'));
        if (i < keys.length - 1) for (let k = 0; k < 6 && (await pg.evaluate(() => MMNPC.state().idx)) === i; k++) { await pg.click('.mmtalk:not(.mmtalk-out)', { force: true }); await pg.waitForTimeout(80); }
      }
      await H.finishTalk(pg);
      for (const r of rs) for (const k of ['x', 'y', 'w', 'h']) assert.ok(Math.abs(r[k] - rs[0][k]) <= 1, `${id}：表情を変えても ${k} が同じ ${JSON.stringify(rs)}`);
    }
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}
