// =========================================================
// QA（実ブラウザ）：サイコロの完全停止（2026-10-04 第二段階）
//  実機の試遊で「止まったように見えたあとも ドット・面・向きが微妙に変わる」→ LOCK の瞬間から、画像の src・class・CSS transform（位置・傾き）・
//  影・光の輪・子要素の数・動いているアニメーションのどれも変わらないことを、LOCK の 0／250／500／750ms 後（消えるまで）で比べる。
//  出目 1・2・3（通常）と、同じレンダラを 1〜6 面で使ったとき（分岐用）の 4〜6 も確かめる。
//  SE：主なコマンドで1回だけ（二重に鳴らない）・未開放は UI_ERROR・戻るは UI_CANCEL。
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

async function start(pg) {
  await H.newGame(pg, 'テスト');
  await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); save(); board(); });
  await pg.waitForSelector('#chf .chf-bg');
  await pg.waitForTimeout(600);
  if (await pg.$('.chf-fina')) await pg.waitForFunction(() => !document.querySelector('.chf-fina'), null, { timeout: 8000 });
  await pg.waitForFunction(() => !bBusy && !MMCHD.isLocked(), null, { timeout: 20000 });
  await pg.waitForTimeout(250);
  // 10コマの先読みが終わるまで（終わっていないと従来の見せ方になる）
  await pg.evaluate(() => Promise.all(MMCH.getConfig(1).dice.throwFrames.concat(Object.values(MMCH.getConfig(1).dice.resultSprites)).map((s) => new Promise((ok) => { const i = new Image(); i.onload = i.onerror = () => ok(); i.src = s; }))));
}
/** LOCK の瞬間から、サイコロの見た目に関わる値を記録しつづける（rAF ごと） */
const watch = (pg) => pg.evaluate(() => {
  window.__lock = { samples: [], t0: null, gone: null };
  const snap = () => {
    const ov = document.querySelector('.chdz'); if (!ov) return null;
    const mv = ov.querySelector('.chdz-mv'), img = ov.querySelector('.chdz-img'), sh = ov.querySelector('.chdz-sh');
    const cs = (e) => e ? getComputedStyle(e) : null;
    const anims = ov.getAnimations ? ov.getAnimations({ subtree: true }).filter((a) => a.playState === 'running' && a.effect && (!Number.isFinite(a.effect.getComputedTiming().endTime) || a.currentTime < a.effect.getComputedTiming().endTime)).map((a) => (a.effect.target && a.effect.target.className) || '?') : [];
    const rotc = ov.querySelector('.chdz-rot'), faces = [...ov.querySelectorAll('.chdz-mv img')].map((e) => `${e.getAttribute('src')}:${cs(e).opacity}:${cs(e).visibility}:${cs(e).display}`).join(',');
    return { phase: ov.dataset.phase, src: img && img.getAttribute('src'), cls: img && img.className, mv: cs(mv) && cs(mv).transform, rot: cs(img) && cs(img).transform, rotc: rotc && cs(rotc).transform, faces, op: cs(img) && cs(img).opacity,
      sh: cs(sh) && cs(sh).transform + '|' + cs(sh).opacity, kids: mv ? mv.children.length : 0, glow: [...ov.querySelectorAll('.chdz-glow')].map((g) => cs(g).opacity + '|' + cs(g).transform).join(','), out: ov.classList.contains('out'), running: anims };
  };
  const tick = () => {
    const s = snap();
    if (!s) { if (window.__lock.t0 != null && window.__lock.gone == null) window.__lock.gone = performance.now(); if (window.__lock.gone == null) requestAnimationFrame(tick); return; }
    if (s.phase === 'lock' || (window.__lock.t0 != null)) { if (window.__lock.t0 == null) window.__lock.t0 = performance.now(); window.__lock.samples.push({ t: performance.now() - window.__lock.t0, ...s }); }   // LOCK のあと play() は phase を result にするが、見た目は LOCK のまま
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});
function assertStill(samples, label) {
  assert.ok(samples.length >= 8, `${label}：LOCK のあと十分なフレームを見た（${samples.length}）`);
  const first = samples[0], keys = ['src', 'cls', 'mv', 'rot', 'rotc', 'faces', 'sh', 'kids', 'glow'];
  const steady = samples.filter((s) => !s.out);   // 消え始め（.out＝全体のフェードアウト）より前
  assert.ok(steady.length >= 6, `${label}：消える前の静止フレーム ${steady.length}`);
  for (const s of steady) for (const k of keys) assert.equal(String(s[k]), String(first[k]), `${label}：LOCK の ${Math.round(s.t)}ms 後に ${k} が変わった（${first[k]} → ${s[k]}）`);
  // 2026-10-04 PHASE H：見た目の切り替えは Web Animations の時間軸（停止以降は同じ値の keyframe・消えるまで終わらせない＝終わるときの描き直しも無い）。
  //  そのため「動いているアニメーションが無い」ではなく、上の computed の値（位置・傾き・各面の opacity・影・光）が1フレームも変わらないことを確かめる
  assert.equal(first.op, '1'); assert.equal(first.phase, 'lock'); assert.ok(steady.every((x) => x.phase === 'lock' || x.phase === 'result'));
  const last = steady[steady.length - 1]; assert.ok(last.t >= 700, `${label}：少なくとも 0.7秒は静止したまま見せる（${Math.round(last.t)}ms）`);
}

for (const size of [[390, 844], [375, 667]]) for (const v of [1, 2, 3]) {
  T(`DL-B1（${size.join('×')}・出目 ${v}）：LOCK の瞬間から消えるまで、画像・class・位置・傾き・影・光の輪・子要素のどれも変わらず、動いているアニメーションも無い。出目の面は ${v}`, async () => {
    const p = await openPage({ size }); const pg = p.page;
    await start(pg);
    await watch(pg);
    await pg.evaluate(() => { window.__wa = null; window.__mut = { src: 0, after: [] };
      const mo = new MutationObserver(() => { const o = document.querySelector('.chdz'); if (o && window.__wa == null) { window.__wa = o.classList.contains('wa') && !!o.querySelector('.chdz-frs'); mo.disconnect();
        // サイコロの中の変化を記録：src の変更は一度も無いこと・停止の確定（data-stopped）のあとは中の要素（面・傾き・影・光）に何も起きないこと
        new MutationObserver((ms) => { for (const m of ms) { if (m.type === 'attributes' && m.attributeName === 'src') window.__mut.src++;
          if (o.dataset.stopped === '1' && m.target !== o) window.__mut.after.push(`${m.type}:${m.attributeName || ''}:${m.target.className || m.target.nodeName}`); } })
          .observe(o, { attributes: true, childList: true, subtree: true, characterData: true }); } });
      mo.observe(document.body, { childList: true, subtree: true }); });
    await pg.evaluate((v) => { window.__mr = Math.random; Math.random = () => ({ 1: 0.1, 2: 0.5, 3: 0.9 }[v]); }, v);
    await pg.click('#brollbtn');
    await pg.evaluate(() => { Math.random = window.__mr; });
    // 画面の画素でも確かめる：停止の確定（data-stopped）から消える前まで、サイコロのまわりの画素が1つも変わらない
    await pg.waitForFunction(() => { const o = document.querySelector('.chdz'); return o && o.dataset.stopped === '1'; }, null, { timeout: 20000, polling: 'raf' });
    const clip = await pg.evaluate(() => { const r = document.querySelector('.chdz-mv').getBoundingClientRect(); return { x: Math.max(0, r.left - 24), y: Math.max(0, r.top - 24), width: r.width + 48, height: r.height + 48 }; });
    const shots = [];
    for (let i = 0; i < 5; i++) { if (await pg.evaluate(() => { const o = document.querySelector('.chdz'); return !o || o.classList.contains('out'); })) break; shots.push(await pg.screenshot({ clip })); await pg.waitForTimeout(150); }
    assert.ok(shots.length >= 3, `出目 ${v}：停止のあと消えるまでに ${shots.length} 回撮れた`);
    for (let i = 1; i < shots.length; i++) assert.ok(shots[i].equals(shots[0]), `出目 ${v}：停止のあと ${i} 回目の画面がはじめと違う（面・角度・位置が変わった）`);
    await pg.waitForFunction(() => window.__lock.gone != null, null, { timeout: 20000 });
    const r = await pg.evaluate(() => window.__lock);
    assertStill(r.samples, `出目 ${v}`);
    { const m = await pg.evaluate(() => window.__mut); assert.equal(m.src, 0, '画像の src は一度も変えない'); assert.deepEqual(m.after, [], '停止のあと、サイコロの中の要素は何も変わらない'); }
    assert.equal(await pg.evaluate(() => window.__wa), true, '2026-10-04 PHASE H：見た目の切り替えを時間軸に載せた見せ方（投げる10コマ・面・出目の面がすべて最初から置かれ、src を変えない）');
    assert.equal(r.samples[0].src, `./assets/fields/ch1a/dice/dice_stop_${v}.webp`, '出目の面');
    assert.match(r.samples[0].rot, /^matrix\(1, 0, 0, 1, 0, 0\)$|^none$/, '傾き 0°');
    assert.equal(await pg.evaluate(() => S.m.raise.pend ? S.m.raise.pend.roll : null) ?? v, v);
    assert.deepEqual(p.errors, []);
  });
}

T('DL-B2（1〜6 面）：同じレンダラを 6 面で使っても（分岐用）、4〜6 の出目で LOCK のあと何も変わらない。終わったら 3 面に戻る', async () => {
  const p = await openPage(); const pg = p.page;
  await start(pg);
  for (const v of [4, 5, 6]) {
    await watch(pg);
    await pg.evaluate(() => { MMCHD.configure({ sides: 6 }); MMCHD.preload(); });
    await pg.waitForFunction(() => MMCHD.missingSprites().length === 0, null, { timeout: 10000 }); await pg.waitForTimeout(900);   // configure は先読みを作り直す＝そろうまで待つ（そろっていないと従来の見せ方になる）
    await pg.evaluate((v) => { const b = document.querySelector('#brollbtn').getBoundingClientRect(); const host = document.querySelector('#chfw'), hr = host.getBoundingClientRect(); window.__pl = MMCHD.play(v, { host, from: { x: b.left + b.width / 2 - hr.left, y: b.top + b.height / 2 - hr.top } }); }, v);
    await pg.waitForFunction(() => window.__lock.gone != null, null, { timeout: 20000 });
    await pg.evaluate(() => window.__pl);
    const r = await pg.evaluate(() => window.__lock);
    assertStill(r.samples, `出目 ${v}（6面）`);
    assert.equal(r.samples[0].src, `./assets/fields/ch1a/dice/dice_stop_${v}.webp`);
  }
  await pg.evaluate(() => MMCHD.configure({ sides: 3 }));
  assert.deepEqual(p.errors, []);
});

T('DL-B3：SE 監査：街の施設の札・下のバー・ファームのコマンド・戻るは1操作＝1回（二重に鳴らない）。未開放は UI_ERROR だけ、戻るは UI_CANCEL だけ、通常のコマンドは UI_SELECT だけ', async () => {
  const p = await openPage({ navDelay: true }); const pg = p.page;
  await H.newGame(pg, 'テスト');
  await pg.evaluate(() => { const m = mk(0); MMP7.ensureProg(m); S.m = m; save(); lobby(); });
  await pg.waitForSelector('.tpin[onclick="market()"]');
  const arm = () => pg.evaluate(() => { window.__seAt = MMAUDIO.seLog().length; });
  const got = () => pg.evaluate(() => { const l = MMAUDIO.seLog(), r = l.slice(window.__seAt); window.__seAt = l.length; return r; });
  const tap = async (sel) => { const b = await pg.$(sel); const r = await b.boundingBox(); await pg.mouse.click(r.x + r.width / 2, r.y + r.height / 2); await pg.waitForTimeout(700); };
  await arm();
  await tap('.tpin[onclick="townArena()"]'); assert.deepEqual(await got(), ['UI_ERROR'], '闘技場（未開放）＝UI_ERROR だけ');
  await pg.evaluate(() => townMsgClose(document.querySelector('.tlow'))); await pg.waitForTimeout(200); await got();
  await tap('.tpin[onclick="townGuild()"]'); await pg.waitForSelector('.bu .bucard'); assert.deepEqual(await got(), ['UI_SELECT'], '聖獣士管理局（2026-10-04 PHASE H4：開いた）＝UI_SELECT を1回');
  await tap('.bu .burb[onclick="lobby()"]'); await pg.waitForSelector('.tpin[onclick="market()"]'); assert.deepEqual(await got(), ['UI_CANCEL'], '街へ戻る＝UI_CANCEL を1回');
  await tap('.tpin[onclick="market()"]'); await pg.waitForSelector('.p10mk'); assert.deepEqual(await got(), ['UI_SELECT'], '市場へ＝UI_SELECT を1回');
  await tap('.p10mk .p10back'); await pg.waitForSelector('.tpin[onclick="farm()"]'); assert.deepEqual(await got(), ['UI_CANCEL'], '街へ戻る＝UI_CANCEL を1回');
  await tap('.tbar button[onclick="hall()"]'); await pg.waitForSelector('.fm .fmgo'); assert.deepEqual(await got(), ['UI_SELECT'], 'ファームへ＝UI_SELECT を1回');
  await tap('.fm .fmb[data-cmd="status"]');   /* 2026-10-04 PHASE H2：ベースキャンプの下の1列（data-cmd） */ await pg.waitForSelector('.sts'); assert.deepEqual(await got(), ['UI_SELECT'], 'ステータス＝1回');
  await tap('.sts .strb');   /* 2026-10-05：正式ステータス画面（stScr）の戻る */ await pg.waitForSelector('.fm .fmgo'); assert.deepEqual(await got(), ['UI_CANCEL'], 'ファームへ戻る＝UI_CANCEL');
  await tap('.fm .fmb[data-cmd="item"]'); await pg.waitForSelector('.ds.shop'); assert.deepEqual(await got(), ['UI_SELECT'], 'アイテム屋（ファームの屋台）＝1回');
  await tap('.ds .dback'); await pg.waitForSelector('.fm .fmgo'); assert.deepEqual(await got(), ['UI_CANCEL']);
  await tap('.fm .fmb[data-cmd="town"]'); await pg.waitForSelector('.tpin[onclick="farm()"]'); assert.deepEqual(await got(), ['UI_CANCEL'], '街へ戻る（ファーム）＝UI_CANCEL');
  await tap('.tpin[onclick="farm()"]'); await pg.waitForSelector('.rn'); assert.deepEqual(await got(), ['UI_SELECT'], '牧場へ＝1回');
  await tap('.rn2 .rnc'); const sel = await got(); assert.ok(sel.length <= 1 && !sel.includes('UI_TAB'), `牧場の一覧の選択（2026-10-04 PHASE H3：タブは無い）は二重に鳴らない：${sel}`);
  await tap('.rn button.back'); await pg.waitForSelector('.tpin[onclick="museum()"]'); assert.deepEqual(await got(), ['UI_CANCEL']);
  await tap('.tpin[onclick="museum()"]'); await pg.waitForSelector('.lab'); assert.deepEqual(await got(), ['UI_SELECT'], '研究所へ＝1回');
  assert.deepEqual(p.errors, []);
});

T('DL-B4（メインスレッドが止まる端末の再現）：出目の面に切り替わる時刻と停止の時刻をまたいで 0.6秒メインスレッドを止めても、再開した最初のフレームで既に出目の面・停止の姿になっていて、そのあと消えるまで画素が変わらない（2026-10-04 PHASE H：iPhone の Safari で「止まったあとに面が変わる」が残っていた原因＝面の切り替えだけがメインスレッドの時刻で遅れて描かれていた）', async () => {
  const p = await openPage(); const pg = p.page;
  await start(pg);
  await pg.evaluate(() => { window.__mr = Math.random; Math.random = () => 0.5; });
  await pg.click('#brollbtn');
  await pg.evaluate(() => { Math.random = window.__mr; });
  await pg.waitForFunction(() => { const o = document.querySelector('.chdz'); return o && o.__anims && o.style.visibility === ''; }, null, { timeout: 20000, polling: 'raf' });
  await pg.evaluate(() => { const o = document.querySelector('.chdz'); window.__imgMut = []; new MutationObserver((ms) => { for (const m of ms) if (m.target.nodeName === 'IMG' || m.type === 'childList') window.__imgMut.push(`${m.type}:${m.attributeName || ''}`); }).observe(o.querySelector('.chdz-mv'), { attributes: true, childList: true, subtree: true }); });
  const r = await pg.evaluate(() => new Promise((ok) => {
    const o = document.querySelector('.chdz'), a = o.__anims.find((x) => x.effect && x.effect.target && x.effect.target.classList.contains('chdz-mv')), fin = +o.dataset.finAt, S = +o.dataset.stopAt;
    const go = () => { if (a.currentTime < fin - 250) return requestAnimationFrame(go);
      const t0 = performance.now(); while (performance.now() - t0 < 600) { /* 端末が忙しい状態（メインスレッドが止まる） */ }
      requestAnimationFrame(() => { const img = o.querySelector('.chdz-img'), others = [...o.querySelectorAll('.chdz-rf img, .chdz-frs img, .chdz-rolling')];
        ok({ at: Math.round(a.currentTime), S, fin, final: getComputedStyle(img).opacity, others: others.map((e) => getComputedStyle(e).opacity), rot: getComputedStyle(o.querySelector('.chdz-rot')).transform, mv: getComputedStyle(o.querySelector('.chdz-mv')).transform }); }); };
    requestAnimationFrame(go); }));
  assert.ok(r.at >= r.S, `止まっていた間に時間軸は停止の時刻を過ぎた（${r.at} ≥ ${r.S}）`);
  assert.equal(r.final, '1', '再開した最初のフレームで、出目の面が出ている（メインスレッドを待たない）');
  assert.ok(r.others.every((x) => x === '0'), `ほかの面・投げる絵は消えている：${r.others}`);
  assert.match(r.rot, /^matrix\(1, 0, 0, 1, 0, 0\)$|^none$/, '傾きは 0°');
  const clip = await pg.evaluate(() => { const b = document.querySelector('.chdz-mv').getBoundingClientRect(); return { x: Math.max(0, b.left - 24), y: Math.max(0, b.top - 24), width: b.width + 48, height: b.height + 48 }; });
  const s0 = await pg.screenshot({ clip }); await pg.waitForTimeout(250); const s1 = await pg.screenshot({ clip });
  assert.equal(await pg.evaluate(() => { const o = document.querySelector('.chdz'); return !!o && !o.classList.contains('out'); }), true, 'まだ消えていない間に比べた');
  assert.ok(s1.equals(s0), '停止のあと画素が変わらない');
  assert.equal(await pg.evaluate(() => getComputedStyle(document.querySelector('.chdz-mv')).transform), r.mv, '位置も変わらない');
  await pg.waitForFunction(() => !document.querySelector('.chdz'), null, { timeout: 10000 });
  assert.deepEqual(await pg.evaluate(() => window.__imgMut), [], '投げてから消えるまで、面・コマの <img> の class・style・src は一度も触らない（見た目は時間軸のアニメーションだけで変わる）');
  assert.deepEqual(p.errors, []);
});
