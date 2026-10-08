// =========================================================
// 実ブラウザ：実機試遊の修正（2026-10-05）＋リュウ／レグナス
//  TB-1 名前を決めたあと名前の画面が一瞬も見えない・新人支援の帯の SE（1000G＝GOLD_GET → 薬草＝REWARD → 世界地図＝UNLOCK。帯と同時・重ならない）
//  TB-2 聖獣士管理局の通常の画面（選ばれたコマンドなし・パネルなし・セルジュは画面の中）・通常の世界地図でリベルナを光らせない
//  TB-3 アイテム屋（名札・ベルナ・3つの導線が画面の中。旧名称なし）  TB-4 ベースキャンプ（出発するの位置・名前の帯なし）
//  TB-5 ベースキャンプ → Chapter で明るい画面が出ない  TB-6 HUD の特訓チケットは所持金の右  TB-7 リュウ＋レグナスの遭遇
//  TB-8 Chapter の BGM：AudioBuffer で鳴る・同じ場面の再描画で頭出ししない・バトルから戻ると続きから
//  （390×844・375×667。Playwright / Chromium が無い環境では省略）
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
const SIZES = [[390, 844], [375, 667]];
const rect = (pg, q) => pg.evaluate((q) => { const e = document.querySelector(q); if (!e) return null; const b = e.getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom, w: b.width, h: b.height }; }, q);
const withMon = (pg, sp = 0) => pg.evaluate((sp) => { const m = mk(sp); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; save(); }, sp);
const idle = (pg) => pg.waitForFunction(() => { const b = document.querySelector('#brollbtn'); return b && !b.disabled; }, null, { timeout: 30000 });

T('TB-1：名前を決めたあと、名前の入力画面は一瞬も見えない。新人支援の帯の SE は帯と同時に1つずつ（GOLD_GET → REWARD → UNLOCK）', async () => {
  const p = await openPage({ opening: true }); const pg = p.page;
  await pg.click('.p15start'); await pg.waitForSelector('.mmtalk:not(.mmtalk-out)', { timeout: 8000 });
  await H.chooseTalk(pg, 'yes'); await H.finishTalk(pg);
  await pg.waitForSelector('.tpin.opgo'); await pg.click('.tpin.opgo');
  await pg.waitForSelector('.mmtalk:not(.mmtalk-out)'); await H.finishTalk(pg);
  await pg.waitForSelector('#p11nm'); await pg.fill('#p11nm', 'ミナト');
  // 毎フレーム：名前の画面（.p11reg）が見えていたら記録する／帯が出たら、そのときの SE の記録を残す
  await pg.evaluate(() => { window.__seen = []; window.__notes = []; const t0 = performance.now(); const f = () => { const r = document.querySelector('.p11reg'), app = document.querySelector('#app'); if (r && app && getComputedStyle(app).visibility !== 'hidden' && getComputedStyle(r).opacity !== '0') window.__seen.push(Math.round(performance.now() - t0)); const n = document.querySelector('.mmnote:not(.out)'); if (n && !n.__r) { n.__r = 1; window.__notes.push([n.querySelector('b').textContent, MMAUDIO.seLog().slice(-1)[0]]); } if (window.__stop) return; requestAnimationFrame(f); }; requestAnimationFrame(f); });
  await pg.click('[onclick*="p11NameGo"]');
  await pg.waitForFunction(() => !document.querySelector('.p11reg'), null, { timeout: 3000 });
  await pg.evaluate(() => { window.__seen = []; });   // 押した瞬間（会話が開く前）は除く。ここから先に名前の画面が戻らないこと
  await H.chooseTalk(pg, 'ok');
  for (let i = 0; i < 400 && (await pg.evaluate(() => window.__notes.length)) < 2; i++) {   // 会話を送る（出身地の2択は a）・帯はそのまま消えるのを待つ
    const st = await pg.evaluate(() => (document.querySelector('.mmtalk:not(.mmtalk-out)') && window.MMNPC ? MMNPC.state() : null));
    if (st && st.choices) await H.chooseTalk(pg, st.choices[0].id); else if (st) await pg.click('.mmtalk:not(.mmtalk-out)', { force: true }).catch(() => {});
    await pg.waitForTimeout(120);
  }
  const r = await pg.evaluate(() => { window.__stop = 1; return { seen: window.__seen, notes: window.__notes, S: { name: S.playerName, pend: !!S.playerNamePending } }; });
  assert.deepEqual(r.seen, [], '確認・登録完了・新人支援の間に名前の入力画面が見えない');
  assert.equal(r.S.name, 'ミナト'); assert.equal(r.S.pend, false);
  assert.deepEqual(r.notes, [['1000G', 'GOLD_GET'], ['世界地図が使えるようになった', 'UNLOCK']], '帯が出た瞬間にその帯の SE（2026-10-07 試遊：1000G と薬草は1つの帯）');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

for (const size of SIZES) {
  T(`TB-2（${size.join('×')}）：聖獣士管理局の通常の画面＝選ばれたコマンドなし・パネルなし・セルジュは画面の中。通常の世界地図はリベルナを光らせない`, async () => {
    const p = await openPage({ size }); const pg = p.page;
    await H.newGame(pg, 'ユウ');
    await pg.evaluate(() => { finaFlags().worldMap = 1; save(); bureauScr(); });
    await pg.waitForSelector('.bu.idle'); await pg.waitForTimeout(500);
    const a = await pg.evaluate(() => ({ on: document.querySelectorAll('.bu .bub.on').length, card: !!document.querySelector('.bu .bucard,.bu .buachw'), focus: document.activeElement && document.activeElement.classList.contains('bub') }));
    assert.deepEqual(a, { on: 0, card: false, focus: false });
    const s = await rect(pg, '.bu .bunpc'); const nav = await rect(pg, '.bu .bunav');
    assert.ok(s && s.h > 150 && s.h <= size[1] * 0.5 && s.t >= 50 && s.l >= -size[0] * 0.1 && s.r <= size[0] * 1.1, `セルジュは高さで決まる（巨大にしない） ${JSON.stringify(s)}`);
    assert.ok(nav.b <= size[1] + 1);
    await pg.click('.bub[onclick="bureauScr(\'card\')"]'); await pg.waitForSelector('.bu .bucard'); assert.equal(await pg.evaluate(() => document.querySelectorAll('.bu .bub.on').length), 1, '押したコマンドだけ選ばれる');
    await pg.click('.bub.bumap'); await pg.waitForSelector('.wmap.view .wm-pin[data-spot="liberna"].on', { state: 'attached' }); await pg.waitForTimeout(400);
    const lib = await pg.evaluate(() => { const pin = document.querySelector('.wmap.view .wm-pin[data-spot="liberna"]'), ring = pin.querySelector('.wm-ring'), cs = getComputedStyle(ring), dot = getComputedStyle(pin.querySelector('.wm-dot')); return { ring: cs.display, anim: cs.animationName, glow: dot.boxShadow, label: pin.querySelector('.wm-lb').textContent }; });
    assert.equal(lib.ring, 'none'); assert.equal(lib.anim, 'none'); assert.doesNotMatch(lib.glow, /255, 214, 110/, '光らない'); assert.equal(lib.label, 'リベルナ', '印と名前は出る');
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });

  T(`TB-3（${size.join('×')}）：アイテム屋＝名札「アイテム屋」・ベルナ（見える）・購入／売却／アイテム図鑑が画面の中。旧名称なし`, async () => {
    const p = await openPage({ size }); const pg = p.page;
    await H.newGame(pg, 'ユウ'); await withMon(pg); await pg.evaluate(() => shopScr());
    await pg.waitForSelector('.ds.shop.shopf'); await pg.waitForTimeout(600);
    const a = await pg.evaluate(() => { const n = document.querySelector('.shopnpc'), b = n.getBoundingClientRect(), cs = getComputedStyle(n); return { plq: document.querySelector('.isp-plq b').textContent, font: getComputedStyle(document.querySelector('.isp-plq b')).fontFamily, ok: n.complete && n.naturalWidth > 0, b: [b.top, b.bottom, b.left, b.right], op: +cs.opacity, vis: cs.visibility, txt: document.body.innerText, sw: document.documentElement.scrollWidth, ents: [...document.querySelectorAll('.shent')].map((e) => { const r = e.getBoundingClientRect(), i = e.querySelector('img'); return [e.querySelector('b').textContent, r.top >= 0 && r.bottom <= innerHeight + 1, i.complete && i.naturalWidth > 0]; }) }; });
    assert.equal(a.plq, 'アイテム屋'); assert.match(a.font, /Shippori Mincho/);
    assert.ok(a.ok && a.op > 0.9 && a.vis === 'visible' && a.b[0] < size[1] * 0.25 && a.b[1] > size[1] * 0.5, `ベルナが大きく見える ${a.b.map(Math.round)}`);
    assert.deepEqual(a.ents.map((x) => x[0]), ['購入', '売却', 'アイテム図鑑']); assert.ok(a.ents.every((x) => x[1] && x[2]), '3つとも画面の中・正式アイコン');
    assert.doesNotMatch(a.txt, /補給所/); assert.equal(a.sw, size[0]);
    const g = await rect(pg, '.isp-gold'), snd = await rect(pg, '#snd'); assert.ok(!snd || snd.w === 0 || g.r <= snd.l + 1, '所持金と音のボタンが重ならない');
    await pg.click('.shent:nth-child(1)'); await pg.waitForSelector('.ds.shop.shopf.tab .dcard');
    assert.match(await pg.textContent('.ds.shop .dbody'), /商品は準備中です/); assert.match(await pg.textContent('.isp-plq'), /アイテム屋\s*購入/);
    for (const w of [size[0], 360]) { await pg.setViewportSize({ width: w, height: size[1] }); await pg.waitForTimeout(150); assert.ok(await pg.evaluate(() => [...document.querySelectorAll('.shent,.isp-plq')].every((e) => e.scrollWidth <= e.clientWidth + 1)), `${w}px：導線・名札の文字がはみ出さない`); }
    await pg.setViewportSize({ width: size[0], height: size[1] });
    await pg.click('.shent:nth-child(3)'); await pg.waitForSelector('.shbook'); assert.match(await pg.textContent('.shbook'), /薬草/);
    await pg.click('.dback'); await pg.waitForSelector('.ds.shop.shopf:not(.tab)');
    await pg.click('.dback'); await pg.waitForSelector('.fm.bc');
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });

  T(`TB-4（${size.join('×')}）：ベースキャンプ＝「出発する」は下のバーから離れ、モンスターに重ならない。モンスターの下に名前・種類の帯なし`, async () => {
    const p = await openPage({ size }); const pg = p.page;
    await H.newGame(pg, 'ユウ'); await withMon(pg, 1); await pg.evaluate(() => hall('t'));
    await pg.waitForSelector('.fm.bc .bcgo .fmgo'); await pg.waitForTimeout(500);
    // 2026-10-08（監査 stale）：5e27556（今回差分の最終統合）で次の Chapter の札は上部（.bcch.bctop）へ移った＝「出発する」の下ではなく画面の上
    const go = await rect(pg, '.bcgo .fmgo'), bar = await rect(pg, '.bcbar'), ch = await rect(pg, '.bcch.bctop'), img = await rect(pg, '.bcmonw .fmmon img');
    assert.ok(bar.t - go.b >= (size[1] > 700 ? 64 : 44), `下のバーから離す ${bar.t - go.b}px`);
    assert.ok(img.b <= go.t, `モンスターの絵は「出発する」に重ならない ${img.b} / ${go.t}`); assert.ok(img.t >= ch.b, `モンスターの絵は上の札に重ならない ${img.t} / ${ch.b}`);
    assert.equal(await pg.$('.bcname'), null);
    assert.equal(await pg.evaluate(() => document.documentElement.scrollWidth), size[0]);
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });

  T(`TB-6（${size.join('×')}）：Chapter の HUD：特訓チケットは所持金の右（同じ行・画面の中）。値は S.trainTix`, async () => {
    const p = await openPage({ size }); const pg = p.page;
    await H.newGame(pg, 'ユウ'); await withMon(pg);
    await pg.evaluate(() => { S.trainTix = 12; S.g = 12345; save(); MMP8.depart(S, S.m, () => 0.37); save(); board(); });
    await pg.waitForSelector('#chtix');
    const g = await rect(pg, '#chgold'), t = await rect(pg, '#chtix');
    assert.ok(Math.abs(g.t - t.t) < 2 && t.l >= g.r && t.r <= size[0] - 4, `所持金の右・同じ行 ${JSON.stringify([g, t])}`);
    assert.match(await pg.textContent('#chtix'), /特訓チケット\s*×12/);
    for (const w of [360]) { await pg.setViewportSize({ width: w, height: size[1] }); await pg.waitForTimeout(200); const g2 = await rect(pg, '#chgold'), t2 = await rect(pg, '#chtix'); assert.ok(Math.abs(g2.t - t2.t) < 2 && t2.r <= w - 2, `${w}px でも1行`); }
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });

  T(`TB-7（${size.join('×')}）：ライバル遭遇＝リュウ（全身）＋レグナスを並べる。切れない・大アップにしない・文と重ならない`, async () => {
    const p = await openPage({ size }); const pg = p.page;
    await H.newGame(pg, 'テスト');
    await pg.evaluate(() => { finaFlags().story = ['tut_turns']; const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); save(); board(); });
    await pg.waitForSelector('#chf .chf-bg'); await idle(pg);
    await pg.evaluate(() => { const g = MMCH.graphFor(S.m), id = g.order.find((x) => g.nodes[x].kind === 'rival'), from = g.order[g.order.indexOf(id) - 1]; const r = S.m.raise; r.node = from; r.pend = null; r.field.fieldId = g.nodes[from].field; save(); board(); });
    await idle(pg);
    await pg.evaluate(() => { window.__mr = Math.random; Math.random = () => 0.1; }); await pg.click('#brollbtn'); await pg.evaluate(() => { Math.random = window.__mr; });
    await pg.waitForSelector('.chf-enc2.t-rival .ce-partner', { timeout: 20000 }); await pg.waitForTimeout(750);
    const r = await pg.evaluate(() => { const g = (q) => { const e = document.querySelector(q), b = e.getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom, h: b.height, ok: e.complete === undefined ? true : e.complete && e.naturalWidth > 0, src: e.getAttribute('src') }; }; return { ryu: g('.ce-rival'), reg: g('.ce-partner'), tx: g('.ce-tx'), top: g('.ce-top span'), tx2: document.querySelector('.ce-tx').textContent }; });
    assert.match(r.ryu.src, /ryu_official_fullbody\.webp$/); assert.match(r.reg.src, /regnas_official\.webp$/); assert.ok(r.ryu.ok && r.reg.ok, '読み込み済み');
    for (const k of ['ryu', 'reg']) { const b = r[k]; assert.ok(b.l >= 0 && b.r <= size[0] && b.t >= 0 && b.b <= size[1], `${k} は画面の中 ${JSON.stringify(b)}`); }
    assert.ok(r.ryu.h <= size[1] * 0.42, `リュウは大アップにしない（全身） ${r.ryu.h}`); assert.ok(r.reg.h >= 150, 'レグナスは小さすぎない');
    assert.ok(r.ryu.r <= r.reg.l + r.reg.r * 0.25 && r.ryu.l < r.reg.l, 'リュウが左・レグナスが右（並べる）');
    assert.ok(r.tx.t >= Math.max(r.ryu.b, r.reg.b) - 2, '下の文と重ならない'); assert.ok(r.ryu.t >= r.top.b - 6, 'RIVAL の帯と重ならない');
    assert.equal(r.tx2, 'リュウが立ちはだかった！');
    await pg.waitForSelector('.chbat', { timeout: 20000 });
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}

T('TB-5：ベースキャンプ → 出発 → Chapter（開始の演出あり）で明るい画面が1フレームも出ない', async () => {
  const p = await openPage({ intro: true }); const pg = p.page;
  await H.newGame(pg, 'ユウ'); await withMon(pg); await pg.evaluate(() => hall('t'));
  await pg.click('.bcgo .fmgo'); await pg.waitForSelector('#app button[onclick="p7Depart(this)"]'); await pg.waitForTimeout(400);
  await pg.evaluate(() => { window.__bright = []; const cv = document.createElement('canvas'); const f = () => { const w = document.querySelector('#chfw'); if (w) { const op = +getComputedStyle(w).opacity, bg = getComputedStyle(document.querySelector('#app')).backgroundColor, bb = getComputedStyle(document.body).backgroundColor; const lum = (c) => { const m = c.match(/\d+(\.\d+)?/g) || []; const a = m[3] != null ? +m[3] : 1; return a === 0 ? null : (+m[0] + +m[1] + +m[2]) / 3; }; const L1 = lum(bg), L2 = lum(bb); if (op < 1 && ((L1 == null ? L2 : L1) || 0) > 60) window.__bright.push([op, bg, bb]); } if (!window.__stop) requestAnimationFrame(f); }; requestAnimationFrame(f); void cv; });
  await pg.click('#app button[onclick="p7Depart(this)"]');
  await H.chooseTalk(pg, 'start'); await H.finishTalk(pg);
  await pg.waitForSelector('.chintro', { timeout: 8000 }); await pg.waitForTimeout(600);
  const r = await pg.evaluate(() => { window.__stop = 1; return window.__bright; });
  assert.deepEqual(r, [], 'フィールドの器が透けている間、後ろは濃紺（明るい地色が見えない）');
  assert.ok(await pg.$('.chintro-img'), 'Chapter 開始の演出はそのまま');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

T('TB-8：Chapter のフィールドの BGM＝デコード後は AudioBuffer で鳴る。再描画（board）では頭出ししない・バトルから戻ると続きの位置から', async () => {
  const p = await openPage({}); const pg = p.page;
  await H.newGame(pg, 'ユウ'); await withMon(pg);
  await pg.evaluate(() => { MMAUDIO.unlock(); MMP8.depart(S, S.m, () => 0.37); save(); board(); });
  await pg.waitForFunction(() => { const s = MMAUDIO.status(); return s.scene === 'CHAPTER_1' && !!s.buffer; }, null, { timeout: 30000 });
  const st0 = await pg.evaluate(() => MMAUDIO.status());
  assert.match(st0.buffer.src, /07_spirits_forest_full\.ogg$/); assert.equal(st0.slots.filter((x) => x.active).length, 0, '<audio> は止まる（二重に鳴らない）');
  await pg.waitForTimeout(1500);
  const a = await pg.evaluate(() => MMAUDIO.status().buffer.pos);
  for (let i = 0; i < 4; i++) await pg.evaluate(() => board());
  await pg.waitForTimeout(300);
  const b = await pg.evaluate(() => MMAUDIO.status().buffer.pos);
  assert.ok(b > a, `再描画で頭出ししない ${a} → ${b}`);
  await pg.evaluate(() => { MMAUDIO.stopBgm({ fade: 'quick' }); MMAUDIO.scene('WILD_BATTLE', { fade: 'quick' }); });
  await pg.waitForTimeout(800);
  await pg.evaluate(() => board()); await pg.waitForTimeout(300);
  const c = await pg.evaluate(() => MMAUDIO.status().buffer);
  assert.ok(c && c.pos >= b, `バトルから戻ると続きから ${b} → ${c && c.pos}`);
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

T('TB-9：購入の知らせ＝帯で1回だけ・約2.6秒で自動で消える・タップで早く消える・街の再描画／施設の行き来／再読み込みで出ない・セーブに入らない・別の購入はその名前で1回', async () => {
  const p = await openPage({}); const pg = p.page;
  await H.newGame(pg, 'ユウ');
  const notes = () => pg.evaluate(() => MMNOTE.log().filter((x) => /つれて帰った/.test(x.title)).map((x) => x.title));
  const town = () => pg.evaluate(() => ({ msg: (document.querySelector('#msg') || {}).textContent || '', on: !!document.querySelector('#app>.map ~ .tlow.on, .tlow.on'), band: [...document.querySelectorAll('.mmnote')].map((e) => e.innerText) }));
  await pg.evaluate(() => { S.g = 2000; save(); adopt(0, 'ソラ'); });
  await pg.waitForSelector('.map.town'); await pg.waitForSelector('.mmnote');
  let t = await town(); assert.match(t.band.join('|'), /ソラをつれて帰った！/); assert.doesNotMatch(t.msg, /つれて帰った/, '街の案内欄には出さない'); assert.equal(t.on, false);
  assert.ok(await pg.evaluate(() => { const i = document.querySelector('.mmnote img'); return !!i && /solamo/.test(i.src); }), 'モンスターの正式画像');
  await pg.waitForFunction(() => !document.querySelector('.mmnote'), null, { timeout: 4000 });   // 自動で消える
  assert.deepEqual(await notes(), ['ソラをつれて帰った！'], '1回だけ');
  await pg.evaluate(() => lobby()); await pg.waitForTimeout(400); t = await town(); assert.deepEqual([t.band, /つれて帰った/.test(t.msg)], [[], false], '街の再描画で出ない');
  await pg.evaluate(() => market()); await pg.waitForTimeout(500); await pg.evaluate(() => lobby()); await pg.waitForTimeout(400); t = await town(); assert.deepEqual([t.band, /つれて帰った/.test(t.msg)], [[], false], '施設の行き来で出ない');
  assert.doesNotMatch(JSON.stringify(await H.storedSave(pg)), /つれて帰った/, 'セーブに入らない');
  await pg.reload(); await pg.waitForFunction(() => typeof S === 'object' && typeof lobby === 'function'); await pg.evaluate(() => lobby()); await pg.waitForTimeout(600);
  t = await town(); assert.deepEqual([t.band, /つれて帰った/.test(t.msg)], [[], false], '再読み込みで出ない');
  // 別のモンスター：その名前で1回・タップで早く消える
  await pg.evaluate(() => adopt(1, 'ガウ')); await pg.waitForSelector('.mmnote'); await pg.waitForTimeout(450);
  assert.match((await town()).band.join('|'), /ガウをつれて帰った！（牧場に預けました）/);
  const t0 = Date.now(); await pg.click('.mmnote'); await pg.waitForFunction(() => !document.querySelector('.mmnote'), null, { timeout: 1500 }); assert.ok(Date.now() - t0 < 1500, 'タップで早く消える');
  assert.deepEqual(await pg.evaluate(() => MMNOTE.log().filter((x) => /つれて帰った/.test(x.title)).map((x) => x.title)), ['ガウをつれて帰った！（牧場に預けました）'], '再読み込みのあと（ページの中の記録）はガウの1回だけ');
  const s = await H.getS(pg); assert.deepEqual([s.m.name, s.box.map((x) => x.name)], ['ソラ', ['ガウ']], '購入・牧場への追加は従来どおり');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

T('TB-10：バトル開始の演出・バトルの HUD（自分・相手）に Lv の表記が出ない（能力値・名前・ライフは従来どおり）', async () => {
  const p = await openPage({}); const pg = p.page;
  await H.newGame(pg, 'テスト');
  await pg.evaluate(() => { const m = mk(0); m.name = 'ソラモ'; MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); save(); board(); const r = S.m.raise; r.pend = { roll: 1, left: 0, stage: 'battle', fx: { kind: 'battle', battleType: 'wild' } }; MMP8.beginBattle(S, S.m, { kind: 'practice', rank: 0 }); save(); fight(0); });
  await pg.waitForSelector('#bt .intro'); await pg.waitForTimeout(800);
  const a = await pg.evaluate(() => document.querySelector('#bt').innerText);
  assert.doesNotMatch(a, /Lv|LEVEL|レベル/i, 'バトル開始の演出'); assert.match(a, /ソラモ/);
  await pg.waitForSelector('#bt .intro', { state: 'detached', timeout: 15000 }); await pg.waitForTimeout(1500);
  const b = await pg.evaluate(() => ({ t: document.querySelector('#bt').innerText, hp: [...document.querySelectorAll('#bt .hn1 b')].map((e) => e.textContent) }));
  assert.doesNotMatch(b.t, /Lv|LEVEL|レベル/i, 'バトルの HUD'); assert.equal(b.hp[0], 'ソラモ', '名前は出る');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});
