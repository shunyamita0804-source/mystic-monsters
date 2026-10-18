// 2026-10-18 REV3 A5：7体×10技＝70枠の監査表（コードとデータから作る）。node tools/rev3_1018/moves70.mjs > docs/rev3_1018/moves70.tsv
//  分類：正式実装（通常プレイのバトルで出る）／QA実戦（未解禁・市場に無い種族＝?mmQaTrial=1 の個体だけ・本物の戦闘計算）／QAプレビュー／素材未決
import fs from 'node:fs'; import path from 'node:path'; import vm from 'node:vm'; import crypto from 'node:crypto';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const ctx = { console, location: { search: '' }, URLSearchParams }; ctx.window = ctx; vm.createContext(ctx);
for (const f of ['js/phase10/monsters.js', 'js/battle/soramo-moves-data.js', 'js/battle/gauru-moves-data.js', 'js/battle/nobiton-moves-data.js', 'js/battle/regnas-moves-data.js', 'js/battle/jiol-moves-data.js', 'js/battle/flurene-moves-data.js', 'js/battle/razuck-moves-data.js', 'js/battle/move-tune-1015.js'])
  vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
const M = ctx.MMP10M, T = ctx.MMTUNE;
const SETS = { solamo: ['MMSOMV_DATA', (k) => k], gauru: ['MMGAMV_DATA', (k) => k], nobiton: ['MMNOMV_DATA', (k) => k], regnas: ['MMREMV_DATA', (k) => k], jiol: ['MMJIMV_DATA', (k, no) => no], flurene: ['MMFLMV_DATA', (k, no) => no], razuck: ['MMRZMV_DATA', (k, no) => no] };
const NORMAL = { solamo: '正式実装（通常のバトル）', gauru: '正式実装（通常のバトル）', regnas: null, nobiton: 'QA実戦（市場は入荷待ち＝通常プレイに出ない）', jiol: 'QA実戦（未解禁）', flurene: 'QA実戦（未解禁）', razuck: 'QA実戦（未解禁・美術は一部未承認）' };
const sha = (f) => { try { return crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex').slice(0, 12); } catch (e) { return '（無い）'; } };
const rows = [['種族', 'No', '技名', 'SK', '分類', 'コマのデータ', '本体の枚数', '効果の枚数', '最初のコマ', 'sha256（先頭12）', '表示の修正（MMTUNE）', '備考']];
for (const key of ['solamo', 'gauru', 'nobiton', 'jiol', 'regnas', 'flurene', 'razuck']) {
  const list = M.movesOf(key), [g, idx] = SETS[key], D = ctx[g] || {};
  for (const mv of list) {
    const k = mv.slot != null ? mv.slot : key === 'nobiton' ? 29 + mv.no : null, d = D[idx(k, mv.no)];   // ノビトンの SK（30〜39）は rules.js が実行時に足す
    const dir = d ? (d.dir || './assets/battle/soramo_moves_1012/').replace(/^\.\//, '') : '';
    const first = d && d.cuts[0] ? dir + d.cuts[0].f : '';
    const tk = d ? T.keyOf(d, d.dir || './assets/battle/soramo_moves_1012/') : null, tune = tk && T.MOVES[tk] ? T.MOVES[tk].id : '';
    let cls = NORMAL[key] || (k >= 20 && k <= 23 ? '正式実装（ライバル戦の初期4技）' : 'QA実戦（ライバル専用＝レグナスの残り6技は通常プレイで使われない）');
    let note = '';
    if (!d) { cls = key === 'flurene' && mv.no === 9 ? cls : '素材未決'; note = 'コマのデータなし'; }
    if (key === 'flurene' && mv.no === 9) note = 'ルートドレイン＝補修版10コマ（js/battle/rootdrain-1016.js・MMRD）';
    if (key === 'flurene' && mv.no === 10) note = '専用の根4＋命中3（MMTUNE の steps）';
    if (key === 'gauru' && mv.no === 8) note = '2026-10-18 REV3 A1：赤い炎の光線（16_beam_a／b）';
    if (key === 'gauru' && mv.no === 4) note = '2026-10-18 REV3 A2：終わりの光（sp_buff）を出さない';
    if (key === 'jiol' && mv.no === 8) note = '2026-10-18 REV3 A3：小さい姿（j08_03）を使わない';
    if (key === 'jiol' && mv.no === 9) note = '2026-10-18 REV3 A4：衝撃波は前の拳から';
    rows.push([key, mv.no, mv.name, k, cls, g, d ? d.cuts.length : 0, d ? (d.fx || []).length + d.cuts.filter((c) => c.fx).length : 0, first, first ? sha(path.join(ROOT, first)) : '', tune, note]);
  }
}
console.log(rows.map((r) => r.join('\t')).join('\n'));
