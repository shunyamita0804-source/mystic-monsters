// =========================================================
// 2026-10-20 追加指示：sim-growth.mjs の結果（JSON）から「通しの到達（funnel）」の表を Markdown で出す（テストではない道具）
//  node tools/fullplay1020/sim-funnel.mjs <結果.json> [<結果.json> ...]
//  列：E＝その Chapter に入った・G＝GOAL に着いた・U＝次の Chapter が解放された（Chapter 4 は F＝最終 Chapter の解放）。分母はすべて全回数（N）。
//  「1〜4 通し」＝Chapter 4 の GOAL（G4）。最終の値＝G4 の個体の Chapter 4 終了時（大会の後）の対象の能力
// =========================================================
import { readFileSync } from 'node:fs';
const rows = [];
for (const f of process.argv.slice(2)) { const j = JSON.parse(readFileSync(f, 'utf8')); for (const [k, v] of Object.entries(j.out)) rows.push([k, v, j.FOOD || 'eat80', j.N]); }
const KEY = { li: 'ライフ', po: 'ちから', in: 'かしこさ', hi: '命中', ev: '回避', de: '丈夫さ' };
console.log('| 個体｜方針｜食事 | 対象（適性・初期） | G1 | U1 | G2 | U2（Ch3 解放） | G3 | U3（Ch4 解放） | G4＝1〜4 通し | F（最終解放） | Ch3 G｜入った個体 | Ch4 G｜入った個体 | 最終 p10 / 中央値 / p90（最大） |');
console.log('|---|---|---|---|---|---|---|---|---|---|---|---|---|');
for (const [k, v, food, N] of rows) {
  const F = v.funnel, c = (x) => (x == null ? '―' : `${x}%`);
  console.log(`| ${k}｜${food === 'none' ? '食べない' : '空腹80で食べる'} | ${KEY[v.target] || v.target}（${v.grade}・${v.base}） | ${c(F[1].goal)} | ${c(F[1].unlockNext)} | ${c(F[2].goal)} | ${c(F[2].unlockNext)} | ${c(F[3].goal)} | ${c(F[3].unlockNext)} | **${c(F[4].goal)}** | ${c(F[4].finalOpen)} | ${c(F[3].goalIfEntered)} | ${c(F[4].goalIfEntered)} | ${v.final.p10 ?? '―'} / ${v.final.p50 ?? '―'} / ${v.final.p90 ?? '―'}（${v.final.max ?? '―'}） |`);
}
