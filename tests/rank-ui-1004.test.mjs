// =========================================================
// 2026-10-04（正式デザイン：大会ランク選択＝青＋金・Chapter 1〜4 共通の部品）
//  RK-01 正式な解放の順（E・D は最初から／E だけのクリアでは C は開かない／D→C→B→A→S）
//  RK-02 Chapter 1〜4 で同じ部品（p9ReceptionHtml＝p9RankListHtml＋p9RankRow）・旧カード（p9rank・p9rlock）を使わない・参加者と試合数
//  RK-03 状態は HTML/CSS（青＋金・未解放は灰色がかった濃紺＋鎖と錠・挑戦目標・クリア済・選択中）。画像・黒い塗りつぶし・点線の仮 UI を使わない
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const HTML = rd('index.html');
const fnOf = (name) => { const i = HTML.indexOf(`function ${name}(`); assert.ok(i > 0, name); return HTML.slice(i, HTML.indexOf('\nfunction ', i + 10)); };
const w = {}; new Function('window', rd('js/phase7/progression.js'))(w); new Function('window', rd('js/phase8/raising.js'))(w); const P8 = w.MMP8, P7 = w.MMP7;
const L = 'EDCBAS';
const mon = (clr) => { const m = {}; P7.ensureProg(m); m.prog.rankClr = [0, 1, 2, 3, 4, 5].map((i) => clr.includes(L[i])); return m; };
const open = (clr, ch) => P8.eligibleRanks(mon(clr), ch).map((i) => L[i]).join('');
const state = (clr, ch) => { const f = new Function('return ' + fnOf('p9RankState').trim())(), m = mon(clr), el = P8.eligibleRanks(m, ch); return [...L].map((x, k) => `${x}:${f(m, k, el)}`).join(' '); };

test('RK-01：解放の順＝新しい個体は E・D／E だけクリアしても C は未解放／D クリア → C／C → B／B → A／A → S（F・FREE は無い）', () => {
  assert.equal(P8.RANK_LETTERS ? P8.RANK_LETTERS.join('') : 'EDCBAS', 'EDCBAS', 'ランクは E〜S の6つだけ');
  assert.equal(open('', 1), 'ED', '新しい個体（Chapter 1）＝E・D');
  assert.equal(open('', 4), 'ED', '新しい個体はどの Chapter でも E・D');
  assert.equal(open('E', 4), 'ED', 'E だけクリア → C はまだ未解放（E のクリアは C の解放条件ではない）');
  assert.equal(open('ED', 4), 'EDC', 'D クリア → C');
  assert.equal(open('D', 4), 'EDC', 'E を飛ばして D をクリアしても C');
  assert.equal(open('EDC', 4), 'EDCB', 'C クリア → B');
  assert.equal(open('EDCB', 4), 'EDCBA', 'B クリア → A');
  assert.equal(open('EDCBA', 4), 'EDCBAS', 'A クリア → S');
  assert.equal(open('EDCBAS', 4), 'EDCBAS');
  assert.equal(open('EDC', 1), 'ED', 'Chapter の上限（Chapter 1 は D まで）は従来どおり');
  // 画面の状態（固定表示にしない）
  assert.equal(state('', 1), 'E:open D:next C:lock B:lock A:lock S:lock');
  assert.equal(state('E', 2), 'E:clear D:next C:lock B:lock A:lock S:lock', 'E だけクリア：C は lock のまま');
  assert.equal(state('ED', 2), 'E:clear D:clear C:next B:lock A:lock S:lock');
  assert.equal(state('EDC', 3), 'E:clear D:clear C:clear B:next A:lock S:lock');
  assert.equal(state('EDCB', 4), 'E:clear D:clear C:clear B:clear A:next S:lock');
  assert.equal(state('EDCBA', 4), 'E:clear D:clear C:clear B:clear A:clear S:next');
  assert.match(rd('js/phase8/raising.js'), /const RANK_FLOOR = RANK_D;/); assert.match(rd('js/phase8/raising.js'), /const RANK_UNLOCK_STEP = 1;/);
});

test('RK-02：Chapter 1〜4 で同じ部品（Chapter 2 以降のゴールも p9ReceptionHtml）。旧カード（p9rank・p9rlock・p8TourStart）は画面に出さない。参加者 6体/5試合（E・D）・8体/7試合（C〜S）', () => {
  assert.match(fnOf('p8GoalHtml'), /return p9ReceptionHtml\(m\)/, '大会のある Chapter のゴールは共通の部品');
  const bd = fnOf('board'); assert.match(bd, /ph=="goal"\)\{const ru=MMP8\.chapterRule\(r\.ch\);if\(ru&&ru\.tournament\)\{\$\("#app"\)\.innerHTML=`<div class="p9rcvw" style="--lobby:url\(\$\{P9_LOBBY_BG\}\)">\$\{p9ReceptionHtml\(m\)\}<\/div>`;return\}/, '旧ボード（Chapter 3・4）');
  assert.match(rd('js/chapter/field-view.js'), /if \(ph === 'goal' && root\.p9ReceptionHtml && \(P8\(\)\.chapterRule\(m\.raise\.ch\) \|\| \{\}\)\.tournament\)/, 'フィールドの Chapter（Chapter 2）');
  const comp = fnOf('p9RankRow') + fnOf('p9RankListHtml') + fnOf('p9ReceptionHtml');
  assert.doesNotMatch(comp, /p9rank|p9rlock|p8TourStart|PRIZE|初回優勝|推奨|FREE|ランクF|CHAPTER \$\{/, '旧カード・賞金・推奨戦力・F・FREE・旧 Chapter 見出しは無い');
  assert.match(comp, /参加者 \$\{sz\}体 \/ \$\{sz-1\}試合/); assert.match(comp, /MMP8L\.LEAGUE_SIZE\[k\]/);
  assert.match(rd('js/phase8/league.js'), /const LEAGUE_SIZE = Object\.freeze\(\[6, 6, 8, 8, 8, 8\]\);/);
  assert.match(fnOf('p9RankRow'), /return ok\?`<button class="rcv-row ok st-\$\{st\}\$\{un\?" unlocking":""\}"[^`]*onclick="p9RcvPick\(\$\{k\},this\)"/, '選べるランク（クリア済の再挑戦を含む）だけ button（2026-10-05 PHASE B：解除の演出の行は unlocking）');
  assert.match(fnOf('p9RankRow'), /:`<div class="rcv-row lk st-\$\{st\}"[^`]*aria-disabled="true"/, '未解放は押せない div');
  assert.match(fnOf('p9RcvPick'), /MMP8\.eligibleRanks\(m,m\.raise\.ch\)\.includes\(k\)\)return;/); assert.match(fnOf('p9RcvJoin'), /MMP8\.eligibleRanks\(m,m\.raise\.ch\)\.includes\(k\)\)return;/);
});

test('RK-03：見た目は HTML/CSS（2026-10-05 PHASE B：参加可能＝赤＋金・未解放＝青＋鎖と錠）。未解放＝灰色がかった濃紺（黒い塗りつぶしではない）＋鎖と錠、挑戦目標＝金の光と札、クリア済＝金のチェック、選択中＝明るい金の枠と光。画像を背景に固定しない', () => {
  const css = HTML.slice(HTML.indexOf('/* 2026-10-04 正式デザイン（大会ランク選択'), HTML.indexOf('.rcv-note{'));
  assert.match(css, /\.rcv-plate::before\{[^}]*linear-gradient\(#a3192b,#7c0f20 50%,#5a0816\)/, '2026-10-05 PHASE B 正式（rank_selection_final）：参加可能＝赤〜ワインレッド');
  assert.match(css, /\.rcv-plate\{[^}]*background:linear-gradient\(90deg,#a8781f,#f3d27a/, '金の縁');
  assert.match(css, /\.rcv-row\.st-lock \.rcv-plate::before\{background:[^}]*linear-gradient\(#2c4c9e,#1b3478 55%,#10225a\)/, '2026-10-05 PHASE B：未解放＝青〜濃紺＋鎖（交差）と南京錠');
  assert.match(css, /\.rcv-chain\.b\{transform:rotate\(8deg\)\}/); assert.match(css, /\.rcv-lock\{/); assert.match(css, /\.rcv-unveil\{/); assert.match(css, /\.rcv-row\.st-lock \.rcv-st\{[^}]*linear-gradient\(#b3202f,#7a0f1e\)/, '参加不可の札＝赤'); assert.match(css, /\.rcv-st\{[^}]*linear-gradient\(#2f9a4c,#1a6a32\)/, '参加可能の札＝緑');
  assert.match(css, /\.rcv-chain\{/); assert.match(HTML, /const P9_PADLOCK=/);
  assert.match(css, /\.rcv-row\.st-next \.rcv-plate\{filter:drop-shadow\(0 0 7px rgba\(255,212,110/); assert.match(css, /\.rcv-next\{/);
  assert.match(css, /\.rcv-row\.st-clear \.rcv-ic\{color:#ffd25a\}/); assert.match(css, /\.rcv-row\.ok\.sel \.rcv-plate\{/);
  assert.doesNotMatch(css, /url\(|background[^;}]*(#000\b|rgba\(0,0,0,\.[5-9])|dotted|dashed/, '画像・黒い塗りつぶし・点線の仮 UI を使わない');
  assert.doesNotMatch(HTML, /tournament_rank_ui_official|rank_emblems\/slices|emblem_slot/, '参考画像・エンブレム（割り当て未確定）は使わない');
});
