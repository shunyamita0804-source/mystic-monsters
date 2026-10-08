// 2026-10-07 大会〜バトル追補便の最小テスト（TF-01：素材と割り当て、TF-02：大会の終わりの順は変えない・E→D の昇格は無い）
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (f) => readFileSync(path.join(ROOT, f), 'utf8'); const HTML = rd('index.html');

test('TF-01：セドリック（opening／booth）・会場 venue・ランク開始 A1〜A6・ランクアップ B1〜B7 の素材と割り当て', () => {
  for (const r of 'EDCBAS') for (const f of [`cedric/opening_${r}`, `cedric/booth_${r}`, `venues/venue_${r}`]) { const b = readFileSync(path.join(ROOT, `assets/tournament/${f}.webp`)); assert.equal(b.toString('ascii', 8, 12), 'WEBP', f); }
  for (const n of ['A1', 'A2', 'A3', 'A4', 'A5', 'A6']) assert.ok(existsSync(path.join(ROOT, `assets/tournament/rank_start/${n}.webp`)), n);
  for (const n of ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7']) assert.ok(existsSync(path.join(ROOT, `assets/tournament/rank_up/${n}.webp`)), n);
  assert.ok(HTML.includes('scene:CED_SCENE(k,"opening"),noFig:true'), '開会＝standing（opening）'); assert.ok(HTML.includes('scene:CED_SCENE(rs.rank,"booth"),noFig:true'), '締め＝booth');
  assert.ok(HTML.includes('tbbg" style="background-image:url(${TB_VENUE(t.rank)})"')); assert.ok(HTML.includes('<div class="pcbg" style="background-image:url(${TB_VENUE(t.rank)})">'));
  assert.match(rd('js/battle/arena.js'), /assets\/tournament\/venues\/venue_\$\{r\}\.webp/, 'バトルの会場');
  assert.match(rd('js/npc/npc.js'), /if \(scene && opts\.noFig\) ov\.classList\.add\('mmtalk-nofig'\)/);
  assert.match(HTML, /function p9TourIntro\(k,noCed\)\{if\(k===0\)return p9Frames\(RANK_START_FX,RANK_START_MS,"p9rs"\);/, 'E は正式カット');
});

test('TF-02：大会の終わりの順は変えない（優勝 → 初回報酬 → ランクアップ → セドリックの締め → S 優勝なら LEGEND の解禁）。2026-10-08：E・D は最初から解放＝E→D の昇格は無い＝B1〜B7（E→D の絵）は流さない・D→C 以降の正式カットは未着＝演出なし', () => {
  assert.match(rd('js/phase8/raising.js'), /TOUR_END_STEPS = Object\.freeze\(\['final', 'champion', 'firstReward', 'rankUp', 'cedricEnd', 'legendUnlock', 'next'\]\)/);
  assert.match(HTML, /registerTourEndHook\("rankUp",async d=>\{P9_END_UP=d;P9_END_FX=false;const m=S\.m;p9EndMark\("rankUp"\);\n if\(!RANK_UP_ART\[d\.to\]\|\|window\.MM_QA_NO_TOURFX\)return;/);
  assert.match(HTML, /\nconst RANK_UP_ART=\{\};/, '昇格の正式カットは無い（E→D 用の RANK_UP_FX を流用しない）');
  assert.doesNotMatch(HTML.replace(/^const RANK_UP_FX=.*$/m, ''), /p9Frames\(RANK_UP_FX/, 'B1〜B7 を流す呼び出しは無い');
});
