// =========================================================
// 2026-10-08：ソラモ・ガウルの 2.5D バトル素材の比較試遊（js/battle/art25d.js・?battleArt=2p5d のときだけ）
//  A25-01：データ＝20技・コマの数（ソラモ 48・ガウル 46）・使うコマのファイルが実在・旧素材は残っている
//  A25-02：通常の URL では何もしない（URL の battleArt を読むだけ・既定は off）・差し込みは animRaw の先頭／立ち絵／stage の時間だけ
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (f) => readFileSync(path.join(ROOT, f), 'utf8');
const DATA = JSON.parse(rd('js/battle/art25d-data.js').split('= ').slice(1).join('= ').trim().replace(/;$/, ''));

test('A25-01：20技・コマの数・ファイルの実在・旧素材は残す', () => {
  const ks = Object.keys(DATA).map(Number).sort((a, b) => a - b);
  assert.deepEqual(ks, [...Array(20).keys()]);
  const n = (a, b) => ks.filter((k) => k >= a && k <= b).reduce((t, k) => t + DATA[k].cuts.length, 0);
  assert.equal(n(0, 9), 48, 'ソラモ 10技・48コマ'); assert.equal(n(10, 19), 46, 'ガウル 10技・46コマ');
  for (const k of ks) {
    const d = DATA[k];
    assert.ok(d.cuts.some((c) => c.f), `${d.name}：使うコマがある`);
    for (const c of d.cuts) {
      if (c.f) { assert.ok(existsSync(path.join(ROOT, 'assets/battle/2p5d', c.f)), c.f); assert.match(c.f, k < 10 ? /^soramo\// : /^gauru\//); }
      else assert.ok(c.skip, `${d.name}：使わないコマには理由`);
    }
    assert.ok(d.body && d.body.h > 0.4 && d.body.gy > 0.6, `${d.name}：本体の大きさ・足元`);
  }
  for (const f of ['soramo/idle.webp', 'gauru/idle.webp', 'README.md']) assert.ok(existsSync(path.join(ROOT, 'assets/battle/2p5d', f)), f);
  for (const f of ['idle_soramo.webp', 'idle_gauru.webp']) assert.ok(existsSync(path.join(ROOT, 'assets/battle/idle', f)), `旧の立ち絵 ${f} は残す`);
});

test('A25-02：既定は off・URL の battleArt=2p5d だけで on・差し込み口は最小', () => {
  const js = rd('js/battle/art25d.js');
  assert.match(js, /get\('battleArt'\)/);
  assert.match(js, /let on = param === '2p5d';/);
  assert.doesNotMatch(js, /localStorage|S\.\w+\s*=|save\(/, 'セーブ・端末の保存に触れない');
  const html = rd('index.html');
  assert.match(html, /function animRaw\(k,s\)\{if\(window\.MM25D&&MM25D\.anim\(k,s\)\)return;/);
  assert.ok(html.indexOf('js/battle/art25d-data.js') < html.indexOf('js/battle/art25d.js'));
  const st = rd('js/battle/stage.js');
  assert.match(st, /MM25D\.timing\(k, s\)/); assert.match(st, /MM25D\.handles\(k, s\)/);
  assert.match(rd('js/battle/arena.js'), /if \(root\.MM25D\) MM25D\.syncIdle\(bt\);/);
});
