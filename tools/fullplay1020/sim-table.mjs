// sim-growth.mjs の結果（JSON）を表にする：node tools/fullplay1020/sim-table.mjs <結果.json> [md]
import { readFileSync } from 'node:fs';
const o = JSON.parse(readFileSync(process.argv[2], 'utf8')), md = process.argv[3] === 'md';
const L = [];
if (md) L.push('| 個体｜方針 | 対象（適性） | 初期 | Ch4 完走率 | 最終 p10 / 中央値 / p90 | Ch1 終了 中央値 | Ch2 | Ch3 | Ch4 | 到達率 Ch1/2/3/4 |', '|---|---|---|---|---|---|---|---|---|---|');
for (const [k, v] of Object.entries(o.out)) {
  const c = (n) => v.perCh[n] && v.perCh[n].all, e = (n) => (c(n) ? c(n).end.p50 : '-'), g = (n) => (c(n) ? c(n).goal : '-');
  const row = [k, `${v.target}（${v.grade}）`, v.base, v.completed4 + '%', `${v.final.p10} / ${v.final.p50} / ${v.final.p90}`, e(1), e(2), e(3), e(4), [1, 2, 3, 4].map(g).join(' / ')];
  L.push(md ? '| ' + row.join(' | ') + ' |' : row.join('\t'));
}
console.log(L.join('\n'));
// 第3引数 routes：個体｜方針ごとに Chapter × ルートの表（開始 → 終了の p10／中央値／p90・上昇の内訳・到達率）
if (process.argv[3] === 'routes') {
  const R = ['| 個体｜方針 | Ch | ルート | 回数 | 到達率 | 開始 中央値 | 終了 p10 / 中央値 / p90 | 上昇 平均 | 内訳：能力マス（回数）／出来事／固定報酬／大会／特訓 | 能力マス・出来事・バトル・食事 の停止 |', '|---|---|---|---|---|---|---|---|---|---|'];
  for (const [k, v] of Object.entries(o.out)) for (const c of [1, 2, 3, 4]) for (const rt of ['A', 'B', 'C']) {
    const x = v.perCh[c] && v.perCh[c][rt]; if (!x) continue;
    R.push(`| ${k} | ${c} | ${rt} | ${x.n} | ${x.goal}% | ${x.start.p50} | ${x.end.p10} / ${x.end.p50} / ${x.end.p90} | ${x.gain.avg} | ${x.src.statTiles}（${x.src.hits}回）／${x.src.event}／${x.src.reward}／${x.src.tour}／${x.src.train} | ${x.statStops}・${x.eventStops}・${x.battles}・${x.meals} |`);
  }
  console.log('\n' + R.join('\n'));
}
