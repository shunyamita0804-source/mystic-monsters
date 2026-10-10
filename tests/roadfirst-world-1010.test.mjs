// =========================================================
// 1枚の世界ビュー（2026-10-10・絵なしの技術検証。js/proto/roadfirst-world.js・roadfirst-view.js の &rfView=world）とレアの1マス
//  RW-01 project：注視点は画面の注視位置へ・傾き0は等倍で線形・傾けると奥ほど小さく上へ
//  RW-02 fitZoom：返した倍率で点がすべて枠の中・入らなければ下限
//  RW-03 lookahead：START から6マス先・分かれ目のあとは3マスずつ・枝を戻る途中は逆向き・原本の接続だけ
//  RW-04 レア（ユーザー決定）：1つの Chapter に1マス・Z1 右の本道と Z2 石像の尾根の通常マスだけ・野生の隣に置かない・同じ seed＝同じ
//  RW-05 フラグ：&rfView=world のときだけ・保存の鍵は同じ・index.html の読み込み順・world は保存／通信をしない
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEngine } from './chapter-sim.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => readFileSync(path.join(ROOT, p), 'utf8');
loadEngine();
await import('../js/proto/roadfirst-data.js');
await import('../js/proto/roadfirst-core.js');
await import('../js/proto/roadfirst-play.js');
await import('../js/proto/roadfirst-world.js');
const D = globalThis.MMRF_DATA, C = globalThis.MMRF_CORE, P = globalThis.MMRF_PLAY, Wd = globalThis.MMRF_WORLD;

test('RW-01：project＝注視点は注視位置・傾き0は線形・傾けると奥ほど小さく上へ', () => {
  const cam = { tx: 500, ty: 1000, s: 2, tilt: 0, P: 900, ax: 195, ay: 500 };
  assert.deepEqual([Wd.project(cam, 500, 1000).x, Wd.project(cam, 500, 1000).y], [195, 500]);
  const a = Wd.project(cam, 510, 990); assert.equal(a.x, 215); assert.equal(a.y, 480); assert.equal(a.k, 1);
  const t = Object.assign({}, cam, { tilt: 40 });
  const far = Wd.project(t, 500, 900), near = Wd.project(t, 500, 1050);
  assert.ok(far.k < 1 && near.k > 1, '奥は縮み手前は大きい'); assert.ok(far.y < 500 && near.y > 500);
  assert.ok(500 - far.y < 100 * 2, '奥は傾きのぶん詰まって見える');
});

test('RW-02：fitZoom＝返した倍率で点がすべて枠の中', () => {
  const cam = { tx: 512, ty: 1400, s: 1, tilt: 40, P: 900, ax: 160, ay: 520 };
  const rect = { l: 22, r: 298, t: 160, b: 640 };
  const pts = D.segments.S01[3].slice(1, 7).map((id) => D.nodes[id]);
  const s = Wd.fitZoom(cam, pts, rect, 1.3, 4.2);
  assert.ok(s >= 1.3 && s <= 4.2);
  for (const p of pts) { const q = Wd.project(Object.assign({}, cam, { s }), p[0], p[1]); assert.ok(q.x >= rect.l && q.x <= rect.r && q.y >= rect.t - 1e-6 && q.y <= rect.b, `${q.x},${q.y}`); }
  assert.equal(Wd.fitZoom(cam, [[0, 0]], rect, 1.3, 4.2), 1.3, '入らなければ下限');
});

test('RW-03：lookahead＝6マス先・分かれ目のあとは3マスずつ・枝を戻る途中は逆向き', () => {
  assert.deepEqual(Wd.lookahead(D, 'START', null, null, 6), D.segments.S01[3].slice(1, 7));
  const j = Wd.lookahead(D, 'J0', ['EL01_01', 'ER01_01'], null, 6);
  assert.deepEqual(j, ['EL01_01', 'EL01_02', 'EL01_03', 'ER01_01', 'ER01_02', 'ER01_03']);
  const fwd = new Set(D.edges.filter((e) => e[3] === 'forward').map((e) => e[0] + '>' + e[1]));
  for (const id of Object.keys(D.nodes)) for (const x of Wd.lookahead(D, id, null, null, 6)) assert.ok(D.nodes[x], x);
  const s = D.segments.D_RC[3]; assert.deepEqual(Wd.lookahead(D, s[s.length - 1], null, 'D_RC', 6), s.slice(0, -1).reverse(), '戻り道は枝を逆に');
  assert.ok(fwd.has('START>S01_01'));
});

test('RW-04：レアは1つの Chapter に1マス・Z1／Z2 の通常マスだけ・野生の隣に置かない', () => {
  const zones = new Set(Object.values(P.TUNING.rare.zones).flat());
  assert.equal(P.TUNING.rare.count, 1); assert.equal(zones.size, 38);
  const nb = {}; for (const s of Object.values(D.segments)) for (let i = 0; i < s[3].length; i++) (nb[s[3][i]] = nb[s[3][i]] || []).push(s[3][i - 1], s[3][i + 1]);
  const seen = new Set();
  for (let seed = 1; seed <= 600; seed++) {
    const t = P.layout(D, seed), r = Object.keys(t).filter((k) => t[k].rare);
    assert.equal(r.length, 1, `${seed}：レアは1マス`);
    assert.ok(zones.has(r[0]) && D.nodes[r[0]][2] === 'ordinary_tile', `${seed}：${r[0]} はゾーンの通常マス`);
    assert.ok(!(nb[r[0]] || []).some((x) => x && t[x] && t[x].t === 'wild' && !t[x].rare), `${seed}：野生の隣ではない`);
    seen.add(r[0].startsWith('ER') ? 'Z1' : 'Z2');
  }
  assert.deepEqual([...seen].sort(), ['Z1', 'Z2']);
  assert.deepEqual(P.layout(D, 5), P.layout(D, 5));
});

test('RW-05：&rfView=world のときだけ・保存の鍵は同じ・読み込み順・world は保存／通信をしない', () => {
  const v = rd('js/proto/roadfirst-view.js'), w = rd('js/proto/roadfirst-world.js'), html = rd('index.html');
  assert.match(v, /const ZWORLD = ON && Q\.get\('rfView'\) === 'world'/);
  assert.match(v, /const KEY = 'mmrf_proto_v1'/);
  assert.doesNotMatch(w, /localStorage|fetch\(|XMLHttpRequest/);
  const iz = html.indexOf('roadfirst-zones.js'), iw = html.indexOf('roadfirst-world.js'), iv = html.indexOf('roadfirst-view.js');
  assert.ok(iz < iw && iw < iv, 'zones → world → view');
});
