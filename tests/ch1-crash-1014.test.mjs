// =========================================================
// 2026-10-14 Chapter 1 進入時のクラッシュ対策（iPhone で「CHAPTER 1／はじまりの草原」の題字 → 全景の間に落ちる）
//  CR14-01 マス・景物の will-change は開始の俯瞰の外（.rfw:not(.intro)）だけ・平面とモンスターは従来どおり
//  CR14-02 寄る間だけ幅を「画面に見えている間の最大の大きさ」に縮め、終わりで決まった base へ戻す作り（keyframe の scale は見えている間 1 以下）
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const W = readFileSync(path.join(ROOT, 'js/proto/roadfirst-world.js'), 'utf8');

test('CR14-01：マス・景物の will-change は俯瞰の外だけ', () => {
  assert.match(W, /\.rfw-tile\{position:absolute;left:0;top:0;transform-origin:0 0\}/, 'マスの既定に will-change を付けない');
  assert.match(W, /\.rfw-prop\{position:absolute;left:0;top:0;transform-origin:0 0;pointer-events:none/, '景物の既定に will-change を付けない');
  assert.match(W, /\.rfw:not\(\.intro\) :is\(\.rfw-tile,\.rfw-prop\)\{will-change:transform\}/);
  assert.match(W, /\.rfw-plane\{[^}]*will-change:transform/); assert.match(W, /\.rfw-mon\{[^}]*will-change:transform/);
});

test('CR14-02：寄る間だけ幅を縮め、終わりで base へ戻す', () => {
  assert.match(W, /const fit = \(el, base, rs, on\) => \{/);
  assert.match(W, /el\.style\.width = Math\.max\(1, base \* m\)\.toFixed\(1\) \+ 'px'; resized\.push\(\[el, base\]\);/);
  assert.match(W, /return \(r, i\) => \(near\[i\] \? r \/ m : Math\.min\(1, r \/ m\)\);/);
  assert.match(W, /for \(const \[el, base\] of it\.resized \|\| \[\]\) el\.style\.width = base \+ 'px';[^\n]*\n\s*S\.cam = Object\.assign\(\{\}, it\.final/, '戻すのは最後の姿を置く apply の前（同じ処理の中）');
  assert.match(W, /introResized: S\.introResized \|\| 0/);
});
