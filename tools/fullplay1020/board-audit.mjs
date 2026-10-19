// =========================================================
// 2026-10-20：Chapter 1〜4 × A／B／C のマス配置の一覧と道路グラフの検査（テストではない道具）。node tools/fullplay1020/board-audit.mjs [配置の seed 数=500]
//  固定マス（役割のある地点）・ランダムマス（MMRF_PLAY.layout が出発ごとに決める中身の平均の数）・育成分岐（分かれ道の選択肢と道の偏り）・
//  グラフの検査（START から全地点・全地点から GOAL・ライバルを通らずに GOAL へ行けない・行き止まりから戻れる・孤立・同じ種類のマスの連続）を Markdown で出す
// =========================================================
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const rd = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const w = {};
for (const f of ['js/phase10/monsters.js', 'js/chapter/engine.js', 'js/chapter/configs/ch1a.js', 'js/chapter/configs/ch2a.js', 'js/proto/roadfirst-data.js', 'js/proto/roadfirst-routes.js', 'js/proto/ch2-routes.js', 'js/proto/ch3-routes.js', 'js/proto/ch4-routes.js', 'js/proto/roadfirst-core.js', 'js/proto/roadfirst-play.js', 'js/chapter/event-themes.js'])
  new Function('window', 'module', rd(f))(w, undefined);
const P = w.MMRF_PLAY, N = +(process.argv[2] || 500);
const DATA = { 1: { A: w.MMRF_DATA, B: w.MMRF_ROUTES.B, C: w.MMRF_ROUTES.C }, 2: w.MMRF_CH2, 3: w.MMRF_CH3, 4: w.MMRF_CH4 };
const POOL = { 1: w.MMCH.getConfig(1).eventPool, 2: w.MMCH.getConfig(2).eventPool, 3: w.MMCH.getConfig(1).eventPool, 4: w.MMCH.getConfig(1).eventPool };
const LABEL = { li: 'ライフ', po: 'ちから', in: 'かしこさ', hi: '命中', ev: '回避', de: '丈夫さ' };
const ROLE = { start: 'START', goal: 'GOAL', mandatory_rival: 'ライバル（必ず通る）', parity_forced_fork: '運命の分かれ道（奇数＝左・偶数＝右）', challenge_d6_5_6: '特殊挑戦（5・6 で成功）',
  fixed_reward_dead_end: '固定報酬（行き止まり・1回）', optional_random_unlock_dead_end: '隠れ家（出発時に開閉）', free_fork: '分かれ道（自由）', late_free_fork: '後半の分かれ道（自由）',
  early_merge: '合流', parity_rejoin: '合流（運命のあと）', final_merge: '最後の合流', lower_walk_through_gate: '下の門', upper_walk_through_gate: '上の門', rare_zone_candidate: 'レアの候補（石像など）' };
function reach(D, from, block) { const f = {}; for (const e of D.edges) (f[e[0]] = f[e[0]] || []).push(e[1]); const s = new Set([from]), q = [from]; while (q.length) { const x = q.shift(); for (const y of f[x] || []) if (!s.has(y) && y !== block) { s.add(y); q.push(y); } } return s; }
const out = ['# Chapter 1〜4 マス配置一覧・経路グラフ検査（tools/fullplay1020/board-audit.mjs・配置の seed ' + N + ' 回の平均）', ''];
for (const ch of [1, 2, 3, 4]) for (const r of ['A', 'B', 'C']) {
  const D = DATA[ch][r]; if (!D) continue;
  const ids = Object.keys(D.nodes), roles = {}; for (const id of ids) { const ro = D.nodes[id][2]; roles[ro] = (roles[ro] || 0) + 1; }
  const all = reach(D, 'START'), toGoal = ids.filter((id) => !reach(D, id).has('GOAL')), rivalSkip = reach(D, 'START', 'RIVAL').has('GOAL');
  const deg = {}; for (const e of D.edges) { deg[e[0]] = (deg[e[0]] || 0) + 1; deg[e[1]] = (deg[e[1]] || 0) + 1; }
  const iso = ids.filter((id) => !deg[id]);
  // ランダムマスの中身（新しい出発の配置＝本編と同じ bias:true・Chapter の割合・出来事の表）
  const cnt = {}, stat = {}, runs = {}; let maxRun = 0, wildAdj = 0;
  for (let s = 1; s <= N; s++) {
    const T = P.layout(D, s * 7919 + 13, { bias: true, route: r, ch, pool: ch === 1 ? undefined : w.MMEVTH.themed(ch, POOL[ch]) });
    for (const t of Object.values(T)) { const k = t.t === 'wild' && t.rare ? 'rare' : t.t; cnt[k] = (cnt[k] || 0) + 1; if (t.t === 'stat') stat[t.k] = (stat[t.k] || 0) + 1; }
    for (const sg of Object.values(D.segments)) { let run = 0, pk = null; for (const id of sg[3]) { const t = T[id]; const k = t ? t.t : '-'; if (k === pk && k !== '-') { run++; if (k === 'wild') wildAdj++; } else run = 1; pk = k; maxRun = Math.max(maxRun, k === 'stat' ? 0 : run); } }
  }
  const ord = roles.ordinary_tile || 0, avg = (k) => ((cnt[k] || 0) / N).toFixed(1);
  const lanes = D.statLanes || P.TUNING.statBias.lanes, forks = ids.filter((id) => /free_fork/.test(D.nodes[id][2]));
  out.push(`## Chapter ${ch} ${r}${D.name ? '「' + D.name + '」' : ''}`, '');
  out.push(`- 地点 ${ids.length}（通常 ${ord}）・接続 ${D.edges.length}・区間 ${Object.keys(D.segments).length}`);
  out.push(`- 固定マス：` + Object.entries(ROLE).filter(([k]) => roles[k]).map(([k, v]) => `${v} ${roles[k]}`).join('・'));
  out.push(`- ランダムマス（通常 ${ord} のうち・平均）：能力 ${avg('stat')}・出来事 ${avg('event')}・食事 ${avg('rest')}・野生 ${avg('wild')}・宝箱 ${avg('treasure')}・レア ${avg('rare')}・無地 ${(ord - Object.values(cnt).reduce((a, b) => a + b, 0) / N).toFixed(1)}`);
  out.push(`- 能力マスの能力（平均）：` + Object.keys(LABEL).map((k) => `${LABEL[k]} ${((stat[k] || 0) / N).toFixed(1)}`).join('・'));
  out.push(`- 育成分岐（自由な分かれ道 ${forks.length} か所）：` + forks.map((id) => `${id}＝` + D.edges.filter((e) => e[0] === id && e[3] === 'forward').map((e) => { const L = lanes[e[2]]; return /^D_/.test(e[2]) ? '寄り道' : L ? L.map((k) => LABEL[k]).join('・') : '偏りなし'; }).join('／')).join('；'));
  out.push(`- 検査：START から行けない ${ids.length - all.size}・GOAL へ行けない ${toGoal.length}・孤立 ${iso.length}・ライバルを通らずに GOAL ${rivalSkip ? 'あり（NG）' : 'なし'}・同じ種類（能力以外）の最長の連続 ${maxRun}・野生の連続 ${wildAdj}`, '');
}
console.log(out.join('\n'));
