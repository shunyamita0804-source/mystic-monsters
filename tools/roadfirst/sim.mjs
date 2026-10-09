// Chapter 1 Pattern A 道路先行の試作（?chapterBoard=roadfirst）の 40ターン・サイコロ 1〜6 のシミュレーション（テストではない道具）
// 使い方：node tools/roadfirst/sim.mjs [回数=5000]
// 実際の進行（js/proto/roadfirst-core.js）をそのまま回す。疲れ・成長・所持金・バトル・能力マスはデータに無いので反映していない。
await import('../../js/proto/roadfirst-data.js'); await import('../../js/proto/roadfirst-core.js');
const D = globalThis.MMRF_DATA, C = globalThis.MMRF_CORE;
const N = Number(process.argv[2]) || 5000;
const SPUR = { D_LC: ['L_CHEST', { j0: 'L' }], D_LA: ['L_ALTAR', { j0: 'L' }], D_RC: ['R_CHEST', { j0: 'R' }], D_LLA: ['L_LATE_ALTAR', { h: 'left' }], D_R5: ['REWARD5', { h: 'right' }], D_RS: ['R_SPECIAL', { h: 'right' }] };
const segOf = (id) => (D.nodes[id] ? D.nodes[id][3] || id : id);
function batch(name, p, extra = {}) {
  let done = 0, turns = [], fail = {}, got = 0, trip = 0;
  for (let i = 0; i < N; i++) {
    const seed = 1000003 * (i + 1) + name.length * 7919;
    const st = C.simulate(D, Object.assign({ seed, p }, extra));
    if (st.done) { done++; turns.push(st.turn); } else { const k = segOf(st.node); fail[k] = (fail[k] || 0) + 1; }
    if (p.spurs && p.spurs.length === 1) { const [sp] = p.spurs; if (st.rewards[SPUR[sp][0]]) got++; if (st.spurDone[sp]) trip++; }
  }
  turns.sort((a, b) => a - b);
  const pct = (x) => (100 * x / N).toFixed(1) + '%', q = (f) => turns.length ? turns[Math.min(turns.length - 1, Math.floor(f * turns.length))] : '-';
  const top = Object.entries(fail).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => `${k} ${pct(v)}`).join('・');
  const avg = turns.length ? (turns.reduce((a, b) => a + b, 0) / turns.length).toFixed(1) : '-';
  return `| ${name} | ${pct(done)} | ${avg} | ${q(0.5)} | ${q(0.9)} | ${turns.length ? turns[turns.length - 1] : '-'} | ${p.spurs && p.spurs.length === 1 ? pct(got) + ' / ' + pct(trip) : '-'} | ${top || '-'} |`;
}
console.log(`${N}回ずつ（サイコロ 1〜6・40ターン・停止ルール stop【仮】・D_RAND は開始時に50%【仮】・Q と挑戦はイベントのサイコロ）`);
console.log('| 方針 | GOAL 到達 | 平均 | 中央値 | p90 | 最長 | 報酬に着いた / 往復できた | 時間切れの場所（上位） |');
console.log('|---|---|---|---|---|---|---|---|');
console.log(batch('寄り道なし・左右ランダム', {}));
for (const h of ['safe', 'left', 'right']) console.log(batch(`寄り道なし・H＝${h}`, { h }));
for (const [sp, [, plan]] of Object.entries(SPUR)) console.log(batch(`報酬 ${sp} を1つ往復`, Object.assign({ spurs: [sp] }, plan)));
console.log(batch('左の道の報酬2つ（D_LC＋D_LA）', { j0: 'L', spurs: ['D_LC', 'D_LA'] }));
console.log(batch('右の道で取れる報酬すべて（D_RC＋D_R5＋D_RS）', { j0: 'R', h: 'right', spurs: ['D_RC', 'D_R5', 'D_RS'] }));
console.log(batch('通れる報酬すべて（左・特殊挑戦）', { j0: 'L', h: 'left', spurs: ['D_LC', 'D_LA', 'D_LLA'] }));
console.log(batch('寄り道なし（比較：停止ルール pass）', {}, { stopRule: 'pass' }));
