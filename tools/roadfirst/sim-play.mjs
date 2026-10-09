// 道路先行の試作（育成の中身つき）の 40ターンのシミュレーション（2026-10-09）
//  node tools/roadfirst/sim-play.mjs [回数=5000] [--md]
//  方針ごとに「40T 以内に GOAL」「報酬に着く」「帰還（親の地点まで戻る）」「報酬を取って 40T 以内に GOAL」を別々に数える。
//  能力6種の伸び・疲れ・休んだ回数・時間切れの場所も出す。数値は js/proto/roadfirst-play.js の TUNING【試作用・要承認】のまま
import { loadEngine } from '../../tests/chapter-sim.mjs';
const N = Number(process.argv[2]) || 5000, MD = process.argv.includes('--md');
const E = loadEngine(); globalThis.MMP10M = E.w.MMP10M;
await import('../../js/proto/roadfirst-data.js'); await import('../../js/proto/roadfirst-core.js'); await import('../../js/proto/roadfirst-play.js');
const D = globalThis.MMRF_DATA, C = globalThis.MMRF_CORE, P = globalThis.MMRF_PLAY;
P.setEventPool(E.CH.getConfig(1).eventPool);
const SOLAMO = { sp: 0, name: 'ソラモ', li: 100, po: 100, in: 100, hi: 100, ev: 100, de: 100 };
const SP = { D_LC: ['L_CHEST', { j0: 'L' }], D_LA: ['L_ALTAR', { j0: 'L' }], D_RC: ['R_CHEST', { j0: 'R' }], D_LLA: ['L_LATE_ALTAR', { h: 'left' }], D_R5: ['REWARD5', { h: 'right' }], D_RS: ['R_SPECIAL', { h: 'right' }], D_RAND: ['RANDOM_DEN', { h: 'right' }, true] };
const pct = (a) => (a * 100).toFixed(1) + '%';
const q = (arr, p) => { if (!arr.length) return '-'; const s = arr.slice().sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
function run(name, mk) {
  const r = { goal: 0, turns: [], reach: 0, ret: 0, rwGoal: 0, gain: { li: 0, po: 0, in: 0, hi: 0, ev: 0, de: 0 }, gainTot: [], fat: [], rests: 0, stuck: 0, timeAt: {}, rare: 0, wild: 0, stat: 0, ev: 0 };
  let target = null;
  for (let i = 1; i <= N; i++) {
    const o = mk(i); target = o.target || null;
    const st = P.simulate(D, C, Object.assign({ seed: i * 7919 + 13, monster: SOLAMO }, o));
    if (st.done) { r.goal++; r.turns.push(st.turn); }
    else { const seg = Object.entries(D.segments).find(([, s]) => s[3].includes(st.node)); const k = seg ? seg[0] : st.node; r.timeAt[k] = (r.timeAt[k] || 0) + 1; }
    if (target) { const got = !!st.play.claimed[target.end]; if (got) r.reach++; if (got && st.spurDone[target.sp]) r.ret++; if (got && st.done) r.rwGoal++; }
    let tot = 0; for (const k of P.STAT_KEYS) { const d = st.play.stats[k] - st.play.mon.base[k]; r.gain[k] += d; tot += d; } r.gainTot.push(tot);
    r.fat.push(st.play.fat); r.rests += st.play.rests; r.stuck += st.stuck;
    for (const h of st.play.hist) { if (h.kind === 'stat') r.stat++; if (h.kind === 'wild') r.wild++; if (h.kind === 'event' || h.kind === 'choice') r.ev++; }
    r.rare += st.play.hist.some((h) => h.kind === 'wild' && h.title === 'レアモンスター') ? 1 : 0;
  }
  const top = Object.entries(r.timeAt).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k} ${pct(v / N)}`).join('・') || '-';
  return { name, goal: pct(r.goal / N), avg: r.turns.length ? (r.turns.reduce((a, b) => a + b, 0) / r.turns.length).toFixed(1) : '-', p: `${q(r.turns, 0.1)}/${q(r.turns, 0.5)}/${q(r.turns, 0.9)}`,
    reach: target ? pct(r.reach / N) : '', ret: target ? pct(r.ret / N) : '', rwGoal: target ? pct(r.rwGoal / N) : '',
    gain: P.STAT_KEYS.map((k) => (r.gain[k] / N).toFixed(0)).join('/'), gainTot: `${(r.gainTot.reduce((a, b) => a + b, 0) / N).toFixed(0)}（${q(r.gainTot, 0.1)}〜${q(r.gainTot, 0.9)}）`,
    fat: `${(r.fat.reduce((a, b) => a + b, 0) / N).toFixed(0)}（p90 ${q(r.fat, 0.9)}）`, rests: (r.rests / N).toFixed(2), stops: `能力${(r.stat / N).toFixed(1)}・出来事${(r.ev / N).toFixed(1)}・野生${(r.wild / N).toFixed(1)}`, rare: pct(r.rare / N), stuck: r.stuck, timeAt: top };
}
const rows = [];
const base = (p, extra = {}) => (i) => Object.assign({ p, randOpen: undefined }, extra);
rows.push(run('寄り道なし（左右ランダム）・休む＝100のとき', base({})));
rows.push(run('寄り道なし・H 安全', base({ h: 'safe' })));
rows.push(run('寄り道なし・H 左（特殊挑戦）', base({ h: 'left' })));
rows.push(run('寄り道なし・H 右（石像）', base({ h: 'right' })));
for (const [sp, [end, pol, open]] of Object.entries(SP)) rows.push(run(`報酬へ寄り道 ${sp}（${end}）${open ? '・D_RAND 開' : ''}`, (i) => ({ p: Object.assign({ spurs: [sp] }, pol), randOpen: open ? true : undefined, target: { sp, end } })));
rows.push(run('D_RAND 閉（H 右）', (i) => ({ p: { h: 'right', spurs: ['D_RAND'] }, randOpen: false })));
rows.push(run('休む＝疲れ80以上（慎重）', base({}, { restAt: 80 })));
rows.push(run('休む＝疲れ60以上（とても慎重）', base({}, { restAt: 60 })));
for (const dd of [0, 1, 3]) rows.push(run(`ダブルダイス【仮】 ${dd}個（先に使う）`, (i) => ({ p: {}, dd })));
for (const dd of [1, 3]) rows.push(run(`ダブルダイス【仮】 ${dd}個・報酬 D_LA へ寄り道`, (i) => ({ p: { j0: 'L', spurs: ['D_LA'] }, dd, target: { sp: 'D_LA', end: 'L_ALTAR' } })));
const H = ['方針', '40T GOAL', '平均T', 'p10/50/90', '報酬に着く', '帰還', '報酬＋GOAL', '能力の伸び li/po/in/hi/ev/de', '能力合計（p10〜p90）', '最後の疲れ', '休んだ', '止まった回数', 'レア1回以上', '詰み', '時間切れの場所'];
if (MD) { console.log('| ' + H.join(' | ') + ' |'); console.log('|' + H.map(() => '---').join('|') + '|'); for (const r of rows) console.log('| ' + [r.name, r.goal, r.avg, r.p, r.reach, r.ret, r.rwGoal, r.gain, r.gainTot, r.fat, r.rests, r.stops, r.rare, r.stuck, r.timeAt].join(' | ') + ' |'); }
else console.table(rows);
