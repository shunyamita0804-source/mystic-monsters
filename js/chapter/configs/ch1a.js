// =========================================================
// Chapter 1「はじまりの草原」Pattern A の config（Chapterフィールドエンジン js/chapter/engine.js 用）
//  このファイルはデータだけ。背景を決まった順にだけ1回ずつ通り、各背景の実際の道の中央線の上にマスを置く。
//  2026-10-02（正式背景）：assets/fields/ch1a/final/field/ch1_bg_01〜14（出どころは assets/fields/ch1a/final/README.md）。
//  2026-10-02（60マス再設計）：共通区間 01〜05 → 05 の最後のマス＝分かれ道 → 森の道（06 大樹の森・07 深い森の小道）／大橋の道（08 水道橋の見える道・09 天空の大橋）
//   → 10 風の丘の最初のマス＝合流 → 終盤 11〜13 → 14 大会会場の門前（ゴール）。1回の旅で通る背景は12枚（森か大橋のどちらか）。
//   2026-10-04 G3：ライバル（リュウ・強制停止）は 05 の最初のマス p5_0（野生 → イベント → ライバル → 分かれ道 → さらに冒険 → 大会）。旧：14 の最初のマス（大会の直前）
//   14 の最後のマス＝ゴールに着いたら、到着イベント専用の背景 final/event/ch1_bg_15_event（マス・サイコロなし）→ フィナの会話 → 大会受付（config.arrival）。
//   旧構成の背景（field/ 10枚・road/ 15枚・journey/ 13枚）はファイルを残すが参照しない。
//  2026-10-08（正式ボード）：背景は formal_1008/ の完成背景 14枚に置き換えた（下の SCENES・PIECES）。2026-10-02 の final/field/ 14枚と final/event/ch1_bg_15_event はファイルだけ残す（参照しない）。
//   到着（ゴールのあと）は 14 の広場の全景へ引いて → 会場の中のロビー。以下の BACKGROUNDS・ysOf の記述は旧構成の記録
//  BACKGROUNDS：背景ごとに backgroundId・route・image・表示名【暫定】・地形・道の中央線 road [y, x, 半幅]（画像を目視で読んだ値。背景に対する割合）・
//   nodes＝その背景のマス [x, y, 種類]（背景に対する割合。手前 → 奥）。マス数は背景ごとに違ってよい（道の長さ・見え方で決めた。固定の「1枚 N マス」は無い）。
//   背景の最奥（遠景の道）まではマスを置かない（この先にも世界が続く景観として残す）。必要なら背景ごとに camera を書ける。ずれていたら数字を直すだけ。
//  公式マス 54（2026-10-04。スタートを含まない。通常13・能力18（6能力×3）・野生6・イベント6・宝4・休む3・ライバル1・分岐／合流2・ゴール1）・30ターン（正式）・サイコロ 1〜3。旧（2026-10-02）：60マス＝通常19・40ターン。
// =========================================================
(function (root) {
  'use strict';
  const A = './assets/fields/ch1a/', CB = './assets/chests/', TL = A + 'tiles/', T2 = A + 'tiles_v2/', FN = A + 'final/', F = FN + 'field/', I = A + 'intro/', U = A + 'ui/', D = A + 'dice/';
  // ---- 2026-10-08 正式ボード（Chapter 1 Pattern A）：完成背景 14枚（assets/fields/ch1a/formal_1008/。元の JPEG は original/。00 は美術マスター＝ゲームには出さない）。
  //  1回の旅で 01 → 14 の全部を順に通る（森の道／大橋の道は同じ背景の左右の道＝分岐 A・B と同じ「道の上の置き方」で分ける）。
  //  ゲームの中身（84マス・ノードID・マスの種類と並び・分岐3か所・つながり・64歩・45ターン）は 2026-10-06 から変えていない。変えたのは「どのマスをどの背景のどこに置くか」だけ。
  //  1本の道（同じノードID）が2つの背景にまたがるときは区間（key・idOffset）に分ける（engine の buildGraph）＝途中のセーブはそのまま続きから。
  //  SCENES[]＝背景ごとの見せ方のデータ：
  //   road＝目に見えない道路中央ライン [y, x, 半幅]（背景に対する割合。画像の道の両端を画素で測って中央を取り、なめらかにした値。09 の階段は目視）。マスとモンスターはこの線から作る（個別の left／top は書かない）
  //   rows＝マスの列の数（near＝いちばん手前の y 0.86、step＝列の間隔＝列が少ないほど広く。手前 → 奥）。playable＝[手前, 奥]（マスを置く範囲＝その画像のいちばん気持ちいい区間。奥まで使い切らない）
  //   enter＝前の背景から入ってくるときの出発点（y。最初のマスの手前）、handoff＝次の背景へ渡す地点（y。最後のマスの少し先＝ここで次の背景へ溶ける）、exit＝この背景のカメラが見てよい奥の端（y。0＝画像の上端まで）
  //   cue＝見せ場の視線誘導（入ってくる間だけカメラが少しそちらを見る。{ x, y, mix }。意味のある所だけ）、camera＝背景ごとのカメラの上書き（終盤は会場が見えるよう少し上を広く）
  //  レイヤー：背景（画像）→ マス（.chf-tile）→ モンスター → 演出 → HUD。背景にマス・宝箱・モンスター・UI は描き込まない ----
  const SC = A + 'formal_1008/', W = 762;
  const DEPTH = [[0.98, 1.22], [0.9, 1.1], [0.84, 1], [0.72, 0.84], [0.6, 0.62], [0.535, 0.5], [0.47, 0.4], [0.425, 0.34], [0.38, 0.28], [0.3, 0.2]];
  const SCENES = [
    { id: 1, name: '旅立ちの石畳', terrain: 'grass', rows: 4,
      road: [[0.96,0.513,0.6],[0.92,0.511,0.575],[0.88,0.51,0.55],[0.84,0.508,0.525],[0.8,0.507,0.5],[0.76,0.504,0.475],[0.72,0.503,0.451],[0.68,0.505,0.425],[0.64,0.511,0.389],[0.6,0.515,0.351],[0.56,0.519,0.312],[0.52,0.538,0.279],[0.48,0.581,0.269],[0.44,0.612,0.252],[0.4,0.607,0.215],[0.36,0.565,0.162],[0.32,0.614,0.109]] },
    { id: 2, name: '柵のある丘道', terrain: 'grass', rows: 3,
      road: [[0.96,0.483,0.652],[0.92,0.487,0.618],[0.88,0.491,0.584],[0.84,0.495,0.549],[0.8,0.499,0.515],[0.76,0.502,0.481],[0.72,0.507,0.447],[0.68,0.512,0.411],[0.64,0.515,0.376],[0.6,0.522,0.334],[0.56,0.532,0.293],[0.52,0.567,0.27],[0.48,0.614,0.262],[0.44,0.618,0.23],[0.4,0.585,0.184],[0.36,0.563,0.147],[0.32,0.657,0.112]] },
    { id: 3, name: '大樹の木陰道', terrain: 'forest', rows: 6,
      road: [[0.96,0.51,0.485],[0.92,0.496,0.496],[0.88,0.497,0.497],[0.84,0.503,0.483],[0.8,0.511,0.458],[0.76,0.522,0.433],[0.72,0.526,0.401],[0.68,0.538,0.368],[0.64,0.551,0.33],[0.6,0.562,0.291],[0.56,0.572,0.259],[0.52,0.578,0.226],[0.48,0.546,0.198],[0.44,0.55,0.157],[0.4,0.67,0.094],[0.36,0.714,0.051]] },
    { id: 4, name: '清流沿いの道', terrain: 'grass', rows: 7, cue: { x: 0.2, y: 0.5, mix: 0.18 },
      road: [[0.96,0.492,0.62],[0.92,0.495,0.584],[0.88,0.499,0.549],[0.84,0.503,0.514],[0.8,0.507,0.479],[0.76,0.511,0.443],[0.72,0.514,0.407],[0.68,0.519,0.374],[0.64,0.524,0.333],[0.6,0.537,0.296],[0.56,0.571,0.274],[0.52,0.625,0.257],[0.48,0.652,0.226],[0.44,0.63,0.182],[0.4,0.592,0.141],[0.36,0.666,0.1],[0.32,0.703,0.058]] },
    { id: 5, name: '滝の見える道', terrain: 'forest', rows: 6, cue: { x: 0.78, y: 0.36, mix: 0.18 },
      road: [[0.96,0.465,0.629],[0.92,0.465,0.591],[0.88,0.464,0.553],[0.84,0.465,0.517],[0.8,0.464,0.478],[0.76,0.463,0.439],[0.72,0.466,0.406],[0.68,0.465,0.367],[0.64,0.464,0.329],[0.6,0.466,0.286],[0.56,0.481,0.25],[0.52,0.504,0.227],[0.48,0.521,0.196],[0.44,0.502,0.159],[0.4,0.42,0.123],[0.36,0.428,0.097],[0.32,0.571,0.056]] },
    { id: 6, name: '古い柱の遺跡', terrain: 'highland', rows: 4,
      road: [[0.96,0.584,0.535],[0.92,0.566,0.528],[0.88,0.538,0.53],[0.84,0.521,0.521],[0.8,0.511,0.505],[0.76,0.509,0.48],[0.72,0.513,0.451],[0.68,0.52,0.421],[0.64,0.529,0.383],[0.6,0.539,0.344],[0.56,0.552,0.297],[0.52,0.572,0.263],[0.48,0.567,0.221],[0.44,0.535,0.175],[0.4,0.554,0.137],[0.36,0.608,0.083],[0.32,0.554,0.042]] },
    { id: 7, name: '遺跡のアーチ', terrain: 'highland', rows: 5, cue: { x: 0.68, y: 0.22, mix: 0.2 },
      road: [[0.96,0.516,0.63],[0.92,0.513,0.6],[0.88,0.511,0.569],[0.84,0.508,0.539],[0.8,0.506,0.507],[0.76,0.504,0.479],[0.72,0.502,0.449],[0.68,0.499,0.417],[0.64,0.496,0.379],[0.6,0.499,0.339],[0.56,0.51,0.3],[0.52,0.548,0.285],[0.48,0.588,0.263],[0.44,0.601,0.217],[0.4,0.558,0.157],[0.36,0.491,0.081]] },
    { id: 8, name: '石の円環', terrain: 'grass', rows: 5,
      road: [[0.96,0.503,0.651],[0.92,0.506,0.616],[0.88,0.508,0.582],[0.84,0.511,0.547],[0.8,0.514,0.512],[0.76,0.516,0.478],[0.72,0.518,0.445],[0.68,0.522,0.409],[0.64,0.529,0.368],[0.6,0.538,0.331],[0.56,0.546,0.296],[0.52,0.581,0.281],[0.48,0.625,0.262],[0.44,0.683,0.211],[0.4,0.718,0.137],[0.36,0.738,0.086],[0.32,0.795,0.06]] },
    { id: 9, name: '苔むした大階段', terrain: 'slope', rows: 3, cue: { x: 0.6, y: 0.4, mix: 0.2 },
      road: [[0.96,0.5,0.55],[0.9,0.5,0.53],[0.8,0.51,0.5],[0.7,0.53,0.47],[0.65,0.545,0.44],[0.6,0.556,0.41],[0.55,0.567,0.37],[0.5,0.571,0.32],[0.456,0.575,0.26],[0.41,0.59,0.2],[0.365,0.606,0.16],[0.32,0.7,0.1]] },
    { id: 10, name: '渦紋の立石', terrain: 'highland', rows: 3,
      road: [[0.96,0.525,0.608],[0.92,0.522,0.579],[0.88,0.519,0.55],[0.84,0.516,0.522],[0.8,0.513,0.492],[0.76,0.51,0.465],[0.72,0.506,0.436],[0.68,0.509,0.405],[0.64,0.517,0.366],[0.6,0.528,0.327],[0.56,0.548,0.294],[0.52,0.588,0.279],[0.48,0.609,0.257],[0.44,0.606,0.222],[0.4,0.574,0.183],[0.36,0.565,0.133],[0.32,0.661,0.076]] },
    { id: 11, name: '崖ぞいの欄干道', terrain: 'bridge', rows: 7,
      road: [[0.96,0.585,0.573],[0.92,0.568,0.56],[0.88,0.549,0.549],[0.84,0.534,0.534],[0.8,0.521,0.518],[0.76,0.517,0.492],[0.72,0.52,0.459],[0.68,0.525,0.423],[0.64,0.535,0.384],[0.6,0.544,0.345],[0.56,0.555,0.307],[0.52,0.556,0.274],[0.48,0.561,0.248],[0.44,0.568,0.242],[0.4,0.552,0.212],[0.36,0.549,0.176],[0.32,0.566,0.141]] },
    { id: 12, name: '会場を望む丘', terrain: 'grass', rows: 5, cue: { x: 0.45, y: 0.18, mix: 0.2 }, camera: { anchorY: 0.75 },
      road: [[0.96,0.407,0.57],[0.92,0.426,0.551],[0.88,0.447,0.536],[0.84,0.472,0.524],[0.8,0.491,0.507],[0.76,0.505,0.483],[0.72,0.508,0.452],[0.68,0.514,0.422],[0.64,0.517,0.384],[0.6,0.521,0.344],[0.56,0.528,0.304],[0.52,0.544,0.265],[0.48,0.586,0.251],[0.44,0.646,0.224],[0.4,0.699,0.173],[0.36,0.656,0.121],[0.32,0.565,0.08]] },
    { id: 13, name: '会場への坂道', terrain: 'grass', rows: 3, camera: { anchorY: 0.77 },
      road: [[0.96,0.42,0.581],[0.92,0.434,0.561],[0.88,0.448,0.543],[0.84,0.463,0.526],[0.8,0.482,0.512],[0.76,0.499,0.495],[0.72,0.504,0.47],[0.68,0.506,0.44],[0.64,0.509,0.399],[0.6,0.517,0.359],[0.56,0.528,0.332],[0.52,0.556,0.311],[0.48,0.6,0.286],[0.44,0.64,0.284],[0.4,0.647,0.264],[0.36,0.628,0.207],[0.32,0.592,0.144]] },
    // 14＝大会会場前の広場（Chapter 1〜4 共通の構図。Chapter 1 は昼の版）。最後のマス＝ゴールのあと、同じ絵の全景へ引いて「到着」→ 会場の中のロビー（config.arrival）
    { id: 14, name: '大会会場前の広場', terrain: 'grass', rows: 4, step: 0.07, common: 'arena_approach', cue: { x: 0.5, y: 0.36, mix: 0.22 }, camera: { anchorY: 0.78 },
      road: [[0.99,0.5,0.5],[0.9,0.5,0.48],[0.8,0.5,0.45],[0.7,0.5,0.41],[0.62,0.5,0.36],[0.58,0.5,0.2]] },
  ].map((s) => {
    // 列の間隔：列が少ない背景ほど広く（モンスターが次のマスを隠さない）。7列（分岐の背景）は 0.065
    const k = String(s.id).padStart(2, '0'), near = s.near || 0.86, step = s.step || ({ 3: 0.08, 4: 0.08, 5: 0.075, 6: 0.07 }[s.rows] || 0.065), far = +(near - step * (s.rows - 1)).toFixed(3);
    return { ...s, key: k, image: SC + `ch1a_scene_${k}.webp`, h: s.id === 14 ? 1535 : 1795, near, step, playable: [near, far],
      enter: s.enter || +(near + 0.06).toFixed(3), handoff: s.handoff || +(far - 0.06).toFixed(3), exit: s.exit || 0 };
  });
  // ---- ゲームの中身（2026-10-06 の 84マス。旧 BACKGROUNDS[].seq・split と同じ並び）を、旅の順に背景へ置く。
  //  piece＝{ id（ノードIDの頭）, off（最初のノードの番号）, scene, seq（マスの種類）, row（その背景の何列目から）, side（-1 左・0 中央・1 右）, branch（分岐の道の名前）}
  const LANE_K = 0.36;   // 左右の道の中心＝道の中央 ± LANE_K × 半幅（2026-10-06 と同じ）
  const PIECES = [
    { id: 'p1_', scene: 1, seq: ['start', 'normal', 'stat_life', 'normal'], start: true, next: ['p1_b'] },
    { id: 'p1_', key: 'p1_b', off: 4, scene: 2, seq: ['stat_power', 'event', 'stat_intelligence'], next: ['p2_'] },
    { id: 'p2_', scene: 3, seq: ['treasure', 'stat_accuracy', 'normal', 'stat_evasion', 'event', 'normal'], next: ['p3_'] },
    { id: 'p3_', scene: 4, seq: ['branch'], next: ['p3l_', 'p3r_'] },   // 分岐 A
    { id: 'p3l_', scene: 4, row: 1, side: -1, branch: 'power', seq: ['stat_power', 'stat_toughness', 'wild', 'stat_power', 'stat_toughness'], next: ['p3m_'] },
    { id: 'p3r_', scene: 4, row: 1, side: 1, branch: 'mind', seq: ['stat_intelligence', 'stat_accuracy', 'event', 'stat_intelligence', 'stat_accuracy'], next: ['p3m_'] },
    { id: 'p3m_', scene: 4, row: 6, seq: ['merge'], next: ['p4_'] },
    { id: 'p4_', scene: 5, seq: ['rest', 'stat_life', 'wild', 'normal', 'treasure', 'stat_evasion'], next: ['p5_'] },
    { id: 'p5_', scene: 6, seq: ['rival', 'stat_toughness', 'event', 'branch'], next: ['p6_', 'p8_'] },   // 分岐 C（ライバル＝強制停止 p5_0）
    { id: 'p6_', scene: 7, side: -1, branch: 'forest', seq: ['stat_evasion', 'event', 'stat_life', 'rest', 'stat_intelligence'], next: ['p7_'] },
    { id: 'p7_', scene: 8, side: -1, branch: 'forest', seq: ['treasure', 'normal', 'stat_accuracy', 'event', 'stat_life'], next: ['p10_'] },   // 並びは 2026-10-06 と同じ（p6_ → p7_ → p8_ → p9_）＝同じ seed なら同じ配置（中身の抽選の順が変わらない）
    { id: 'p8_', scene: 7, side: 1, branch: 'bridge', seq: ['wild', 'stat_power', 'normal', 'treasure', 'wild'], next: ['p9_'] },
    { id: 'p9_', scene: 8, side: 1, branch: 'bridge', seq: ['stat_toughness', 'wild', 'treasure', 'normal', 'stat_intelligence'], next: ['p10_'] },
    { id: 'p10_', scene: 9, seq: ['merge', 'stat_power', 'normal'], next: ['p10_b'] },
    { id: 'p10_', key: 'p10_b', off: 3, scene: 10, seq: ['wild', 'stat_evasion', 'event'], next: ['p11_'] },
    { id: 'p11_', scene: 11, seq: ['branch'], next: ['p11l_', 'p11r_'] },   // 分岐 B
    { id: 'p11l_', scene: 11, row: 1, side: -1, branch: 'guard', seq: ['stat_life', 'stat_toughness', 'event', 'stat_life', 'stat_toughness'], next: ['p11m_'] },
    { id: 'p11r_', scene: 11, row: 1, side: 1, branch: 'swift', seq: ['stat_evasion', 'stat_accuracy', 'event', 'stat_evasion', 'stat_accuracy'], next: ['p11m_'] },
    { id: 'p11m_', scene: 11, row: 6, seq: ['merge'], next: ['p12_'] },
    { id: 'p12_', scene: 12, seq: ['treasure', 'normal', 'stat_intelligence', 'wild', 'rest'], next: ['p13_'] },
    { id: 'p13_', scene: 13, seq: ['normal', 'treasure', 'event'], next: ['p14_'] },
    { id: 'p14_', scene: 14, seq: ['normal', 'stat_power', 'normal', 'goal'], goal: true, next: [] },   // ゴール＝14 の最後のマス（大会会場の門の前）
  ];
  const TOTAL_TILES = PIECES.reduce((t, p) => t + p.seq.filter((q) => q !== 'start').length, 0);   // 84（tests/chapter-engine.test.mjs と layoutRules.expect で確認）
  const at = (pts, y, k) => { const C = [...pts].sort((a, b) => a[0] - b[0]); if (y <= C[0][0]) return C[0][k]; for (let i = 1; i < C.length; i++) if (y <= C[i][0]) { const a = C[i - 1], b = C[i]; return +(a[k] + (b[k] - a[k]) * (y - a[0]) / (b[0] - a[0])).toFixed(4); } return C[C.length - 1][k]; };
  const xOn = (road, y, sd) => +(at(road, y, 1) + (sd || 0) * LANE_K * at(road, y, 2)).toFixed(4);
  // 歩く道筋：マスの点と、その間にある道路中央ライン（左右の道なら同じ割合だけ横）の点。経由点は歩きの見た目だけ（出目には数えない）
  const lanePts = (road, nodes, sd) => { const near = nodes[0][1], far = nodes[nodes.length - 1][1], mids = road.filter((p) => p[0] < near && p[0] > far).map((p) => [xOn(road, p[0], sd), p[0]]); return [...nodes.map((q) => [q[0], q[1]]), ...mids].sort((a, b) => b[1] - a[1]); };
  const fieldScenes = SCENES.map((s) => ({ id: s.id, key: s.key, name: s.name, bg: s.image, w: W, h: s.h, bgKey: s.key, stage: s.key, exit: 'up', farBand: { to: 0.26, k: 0.95 }, depth: DEPTH,
    zoom: { near: 1.15, far: 1.55 }, road: { center: s.road, safe: 0.7 }, play: { enter: s.enter, playable: s.playable, handoff: s.handoff, exit: s.exit }, cue: s.cue || null, laneK: LANE_K,
    ...(s.camera ? { camera: s.camera } : {}), ...(s.common ? { common: s.common } : {}) }));
  const landmarks = {}, foreground = {}; for (const s of SCENES) { landmarks[s.id] = []; foreground[s.id] = []; }
  const paths = PIECES.map((p) => {
    const s = SCENES[p.scene - 1], row0 = p.row || 0;
    const nodes = p.seq.map((t, i) => { const y = +(s.near - s.step * (row0 + i)).toFixed(3); return [xOn(s.road, y, p.side), y, t]; });
    return { id: p.id, ...(p.key ? { key: p.key } : {}), ...(p.off ? { idOffset: p.off } : {}), field: p.scene, n: nodes.length, nodePts: nodes.map((q) => [q[0], q[1]]), tiles: p.seq, tileLook: nodes.map(() => null),
      curve: 'linear', terrain: s.terrain, next: p.next, pts: nodes.length > 1 ? lanePts(s.road, nodes, p.side) : [[nodes[0][0], nodes[0][1]]],
      ...(p.branch ? { branch: p.branch } : {}), ...(p.side ? { landmark: { fixedSide: p.side }, lane: p.side } : {}), ...(p.start ? { start: true } : {}), ...(p.goal ? { goal: true } : {}) };
  });
  // 背景ごとのマス数（スタートを含まない）・旅の順（どの道を選んでも 01 → 14 を全部通る）
  const ORDER = SCENES.map((s) => s.key), NODES = Object.fromEntries(SCENES.map((s) => [s.key, PIECES.filter((p) => p.scene === s.id).reduce((a, p) => a + p.seq.filter((q) => q !== 'start').length, 0)]));
  const ROUTES = { common: ORDER };
  // 分かれ道の名前と説明（選ぶ画面に出す。道の上のマスの種類と一致させる＝説明どおりの能力が伸びる）。gate＝道の先が次の背景へ続く分かれ道 C の左右の門
  const OPT = {
    power: { label: 'ちからの道', desc: 'ちから・丈夫さのマスが並ぶ。野生モンスターも出る' },
    mind: { label: 'かしこさの道', desc: 'かしこさ・命中のマスが並ぶ。出来事もある' },
    forest: { label: '森の道', desc: '安全な道。休む・出来事・能力のマスが多い', gate: 'gate_left' },
    bridge: { label: '大橋の道', desc: '挑戦の道。野生モンスターと宝箱が多い', gate: 'gate_right' },
    guard: { label: '守りの道', desc: 'ライフ・丈夫さのマスが並ぶ' },
    swift: { label: '身軽の道', desc: '回避・命中のマスが並ぶ' },
  };
  const BRANCHES = [
    { at: 'p3_0', split: 'A', options: [{ id: 'power', to: 'p3l_0', side: -1, lean: {} }, { id: 'mind', to: 'p3r_0', side: 1, lean: {} }] },
    { at: 'p5_3', split: 'C', options: [{ id: 'forest', to: 'p6_0', side: -1, lean: {} }, { id: 'bridge', to: 'p8_0', side: 1, lean: {} }] },
    { at: 'p11_0', split: 'B', options: [{ id: 'guard', to: 'p11l_0', side: -1, lean: {} }, { id: 'swift', to: 'p11r_0', side: 1, lean: {} }] },
  ];
  for (const b of BRANCHES) b.options = b.options.map((o) => ({ ...o, ...OPT[o.id] }));

  const cfg = {
    chapterId: 1,
    patternId: 'A',
    title: 'はじまりの草原',
    patternTitle: 'はじまりの草原',
    playable: true,
    // 通常マス（normal）は止まれる公式のマス（2026-10-02 の60マス再設計：出目に数え、止まると何も起きずにターンが終わる。旧 passNormal＝通過専用は廃止）。
    //  歩きの見た目だけの経由点（paths[].pts の道の中央線の点）はマスではなく、出目に数えない
    rules: { turnLimit: root.MMCH_CH1A_TURN_LIMIT || 45, diceSides: 3, ...(root.MMCH_CH1A_GROWTH ? { growthGain: root.MMCH_CH1A_GROWTH } : {}) },   // 2026-10-08：能力マスの上昇量は全 Chapter 共通の GROWTH_GAIN（js/phase10/monsters.js）。MMCH_CH1A_GROWTH はシミュレーション用の上書き口   // 2026-10-04：正式仕様＝Chapter 1〜4 すべて 30ターン（ユーザー確認 2026-10-03）。サイコロは 1〜3（4〜6 の素材・共通の仕組みは残す）。旧：試遊用の 40
    forceStopKinds: ['rival'],
    tournamentDestination: 'official',
    // ---- ゴール（14 の最後のマス）に着いたあと：到着イベント専用の背景（マス・サイコロ・操作欄なし）→ フィナの短い会話 → 大会受付（ランク選択）。
    //  {name} はプレイヤー名（初期名アルト）。会話はこの個体のこの Chapter で1回（m.raise.field.arrivalSeen）。受付のあとは既存の大会（開始演出 → セドリックの進行） ----
    // 2026-10-04 G4：門の前でいきなりランクを選ばせない＝門前（短い遷移 gateMs）→ 会場の中のロビー（lobby。受付・参加者・高い天井。闘技場のステージとは別の場所）へクロスフェード
    //  → フィナの到着の会話（正式素材の全身・大型の会話窓）→ ランク選択（ロビーの上）。会話の文面は【暫定】（ユーザーの例「ようこそ、大会会場へ！」「参加する大会を選ぼう。」）
    arrival: { bg: SC + 'ch1a_scene_14.webp', name: '公式大会会場・正門前', fadeMs: 900, gateMs: 1300,
      lobby: { bg: './assets/tournament/lobby/lobby_main.webp', name: '公式大会会場', fadeMs: 800 },
      talk: [
        { npc: 'fina', expression: 'happy', text: 'やっと着いたね、{name}さん！' },
        { expression: 'smile', text: 'ようこそ、大会会場へ！' },
        { expression: 'guide', text: 'さあ、参加する大会を選ぼう。' },
      ] },
    // 背景の切り替え：歩き続けたまま前の背景から次の背景へクロスフェード（ms＝溶ける時間（歩いて入る enterMs の間に終わる）、outMs／out＝前の背景の先へ歩き続ける時間・距離、back／enterMs＝次の背景の入口の手前から歩いて入る距離・時間。境目はマスではない）
    backgroundTransition: { type: 'crossfade', ms: 460, outMs: 260, out: 80, back: 90, enterMs: 540 },
    stageOrder: ORDER, routes: ROUTES, tilesPerBackground: NODES, totalTiles: TOTAL_TILES,

    fieldScenes, paths, edges: {}, nodeOverrides: {},
    branches: BRANCHES,

    // anchorY 0.72（2026-10-02 歩行アニメ：0.66 → 0.72。ソラモを画面の中央下に置き、進む先の道を広く見せる）
    camera: { anchorY: 0.72, lookAhead: 0.08, followDelay: 110, zoom: { idle: 1, move: 0.985, stop: 1.015, branch: 0.93, focus: 1.02 } },
    motion: { stepMs: 520, minMs: 380, maxMs: 760, baseLen: 170, terrain: { grass: { speed: 1 }, highland: { speed: 0.96 }, bridge: { speed: 1, fixed: true }, forest: { speed: 0.94 } } },
    parallax: { far: 0.95, back: 0.97, road: 1, front: 1.12, canopy: 0.6 },

    // ---- Chapter開始の演出（js/chapter/intro.js。2026-10-02 正式の流れ）：全景を止めて見せる →「Chapter 1」→「はじまりの草原」→ 消える
    //  → 全景の中を旅の開始地点（下端の草原の小道＝FIELD 1 の柵のある小道）へカメラが移動 → FIELD 1 へクロスフェード → ソラモ・マス・UI。
    //  Pattern ごとの全景画像とカメラは patterns[patternId]（Pattern B／C はここに { overview, camera:{ from, to, via } } を足すだけ）。
    //  camera の x・y は全景画像に対する割合、zoom は画面いっぱい（cover）に対する倍率。timing を書けば時間も変えられる（既定は intro.js の TIMING＝約3.9秒） ----
    intro: { label: 'Chapter 1', name: 'はじまりの草原', overviews: { A: I + 'ch1_intro_overview.webp' },
      patterns: { A: { overview: I + 'ch1_intro_overview.webp', camera: { from: { x: 0.5, y: 0.5, zoom: 1 }, to: { x: 0.5, y: 0.93, zoom: 2.3 } } } } },

    // ---- 操作欄：START の正式画像（STOP は使わない） ----
    deck: { start: U + 'deck_start.webp', aspect: 1100 / 353,
      hit: { center: { x: 0.385, y: 0.03, w: 0.23, h: 0.94 }, tl: { x: 0.012, y: 0.05, w: 0.37, h: 0.42 }, tr: { x: 0.618, y: 0.05, w: 0.37, h: 0.42 }, bl: { x: 0.012, y: 0.53, w: 0.37, h: 0.42 }, br: { x: 0.618, y: 0.53, w: 0.37, h: 0.42 } } },

    // ---- 配置の規則（2026-10-02 の60マス再設計：固定配置）。マスの種類は BACKGROUNDS[].nodes の3番目のとおり（ランダムに並べ替えない）。
    //  Chapter開始時に seed で決めるのは中身だけ：イベントの内容（eventPool。休む＝疲れ回復のイベント）・宝箱の段階・野生がレアモンスターマスになるか（rareBattleRate）。
    //  expect＝正式の内訳（スタートを含まない60マス）。構成を変えたら validateLayout がこの数で確かめる ----
    layoutRules: {
      fixed: true,
      expect: { total: TOTAL_TILES, groups: { normal: 13, stat: 36, wild: 7, event: 10, treasure: 7, rest: 3, rival: 1, branchSpecial: 6, goal: 1 }, perStat: 6 },   // 2026-10-06：84マス（分岐3か所＝分かれ道3・合流3）
      rareBattleRate: 0.1,   // 野生のマスがレアモンスターマスになる確率（2026-10-02 正式：10%）。配置を作るとき（Chapter開始時に1回）に決めて保存する
      eventTierWeights: { normal: 70, rare: 25, special: 5 },
    },

    // ---- イベント（値は旧Chapterの暫定イベントと同じ【暫定】。疲れ回復は正式仕様）。目印は tier の祠を石板の脇に小さく置く（街道の上に木・岩は置かない） ----
    eventPool: [
      { id: 'shade', tier: 'normal', recovery: true, weight: 4, handler: 'fatigue', params: { amount: 10 }, text: '石板の木陰でひと休みした。', look: { h: 104 } },
      { id: 'break', tier: 'normal', recovery: true, weight: 3, handler: 'fatigue', params: { amount: 20 }, text: '街道のそばで小休憩をとった。', look: { h: 104 } },
      { id: 'spring', tier: 'rare', recovery: true, weight: 2, handler: 'fatigue', params: { amount: 30 }, text: '澄んだ泉で体を休めた。', look: { h: 118 } },
      { id: 'holy_spring', tier: 'special', recovery: true, weight: 1, handler: 'fatigue', params: { full: true }, text: '不思議な泉の力で、疲れがすっかり取れた！', look: { h: 132 } },
      { id: 'herb', tier: 'normal', weight: 3, handler: 'stat_random', params: { amount: 6 }, text: '珍しい草を見つけた！', look: { h: 104 } },
      { id: 'trip', tier: 'normal', weight: 2, handler: 'stat_random', params: { amount: -4 }, text: '石につまずいて転んでしまった…', look: { h: 104 } },
      { id: 'coin', tier: 'normal', weight: 3, handler: 'gold', params: { amount: 50 }, text: '道端でお金を見つけた！', look: { h: 104 } },
      { id: 'sage', tier: 'rare', weight: 2, handler: 'stat_random', params: { amount: 20 }, text: '旅の賢者に教えを受けた！', look: { h: 118 } },
      { id: 'charm', tier: 'rare', weight: 2, handler: 'gold', params: { amount: 150 }, text: '幸運のお守りを見つけた！', look: { h: 118 } },
      { id: 'legend_spring', tier: 'special', weight: 1, handler: 'stat_all', params: { amount: 8 }, text: '伝説の泉の力で、ライフ以外の能力がそれぞれ上がった！', look: { h: 132 } },
      // ---- 2026-10-04（第二段階）：Chapter 1 の短いランダムイベント（フィナの2〜3行＋小さな結果。lines＝会話（フィナの吹き出し）、効果は既存の仕組みの中で安全なものだけ）。
      //  同じ Chapter では同じイベントを重複して割り当てない（engine の pickDistinct）。choices＝2択（選んでから効果。選ぶまで使った印を付けない）。文面は【暫定】 ----
      // ---- 2026-10-04（第二段階・追加アセット）：12種に正式の挿絵（assets/events/ch1/。title＝挿絵の上のイベント名・image＝挿絵）と正式の会話・効果。
      //  止まると：背景を少し暗く → 挿絵（横長）→ イベント名 → フィナの会話（共通会話の小さな窓）→（2択なら選ぶ）→ 挿絵が消える → 能力UP・疲れの演出。id・重複しない仕組みは従来どおり ----
      { id: 'tailwind', title: '草原の追い風', image: './assets/events/ch1/01_tailwind.webp', tier: 'normal', weight: 3, handler: 'stat_random', params: { amount: 5, keys: ['ev'] }, text: '草原の追い風に乗って、軽やかに動けた。',
        lines: [{ expression: 'happy', text: 'わっ、いい風！' }, { expression: 'guide', text: 'こういう時は、力を抜いて風に合わせると動きやすいよ。' }] },
      { id: 'spring_water', title: '澄んだ湧き水', image: './assets/events/ch1/02_spring_water.webp', tier: 'normal', weight: 3, handler: 'fatigue', params: { amount: 15 }, text: '澄んだ湧き水でひと息ついた。',
        lines: [{ expression: 'smile', text: 'すごく澄んでる。少し休んでいこうか。' }, { expression: 'happy', text: 'うん、これならまた歩けそう。' }] },
      { id: 'stone_tablet', title: '風化した石碑', image: './assets/events/ch1/04_stone_tablet.webp', tier: 'normal', weight: 3, handler: 'stat_random', params: { amount: 5, keys: ['in'] }, text: '風化した石碑をじっくり眺めた。',
        lines: [{ expression: 'normal', text: 'かなり古い石碑だね。文字はほとんど消えてるけど……' }, { expression: 'guide', text: '昔の旅人が道の目印にしてたのかも。' }] },
      { id: 'break_with_fina', title: 'フィナとの休憩', image: './assets/events/ch1/06_break_with_fina.webp', tier: 'normal', weight: 3, handler: 'fatigue', params: { amount: 15 }, text: 'フィナと一緒に少し休んだ。',
        lines: [{ expression: 'smile', text: 'ちょっと休憩しよう。急いでも、いい育成にはならないからね。' }, { expression: 'happy', text: '……よし。そろそろ行こっか。' }] },
      { id: 'sudden_rain', title: '突然の通り雨', image: './assets/events/ch1/07_sudden_rain.webp', tier: 'normal', weight: 2, text: '突然の通り雨に降られた。',
        lines: [{ expression: 'surprised', text: 'うわ、降ってきた！' }, { expression: 'troubled', text: 'すぐ止みそうだけど……どうする？' }],
        choices: [{ id: 'shelter', label: '雨宿りする', desc: '疲れ−10', handler: 'fatigue', params: { amount: 10 }, text: '木の下で雨宿りをした。' },
          { id: 'go', label: 'このまま進む', desc: '丈夫さ＋5・疲れ＋5', handler: 'stat_tired', params: { amount: 5, keys: ['de'], fatigue: 5 }, text: '雨の中をそのまま進んだ。' }] },
      { id: 'beast_tracks', title: '獣の足跡', image: './assets/events/ch1/08_beast_tracks.webp', tier: 'normal', weight: 3, handler: 'stat_random', params: { amount: 5, keys: ['hi'] }, text: '獣の足跡に気をつけながら進んだ。',
        lines: [{ expression: 'serious', text: '見て、この足跡。まだ新しい。' }, { expression: 'guide', text: '周りをよく見ながら進もう。' }] },
      { id: 'distant_cry', title: '風に乗る鳴き声', image: './assets/events/ch1/09_distant_cry.webp', tier: 'normal', weight: 2, handler: 'stat_random', params: { amount: 5, keys: ['in'] }, text: '風に乗る鳴き声に耳を澄ませた。',
        lines: [{ expression: 'surprised', text: '……今、何か聞こえなかった？' }, { expression: 'normal', text: '近くに珍しいモンスターがいるのかも。' }] },
      { id: 'wild_flowers', title: '野花の群生', image: './assets/events/ch1/10_wild_flowers.webp', tier: 'normal', weight: 3, handler: 'stat_random', params: { amount: 5, keys: ['li'] }, text: '野花の群生のそばで元気をもらった。',
        lines: [{ expression: 'happy', text: 'きれい……。こういう景色を見ると、ちょっと元気出るね。' }, { expression: 'smile', text: 'この子も、少し調子が良さそう。' }] },
      { id: 'traveler_trace', title: '古い旅人の痕跡', image: './assets/events/ch1/11_traveler_trace.webp', tier: 'normal', weight: 3, handler: 'fatigue', params: { amount: 10 }, text: '古い旅人の休んだ跡で、少し休んだ。',
        lines: [{ expression: 'normal', text: '誰かがここで休んだ跡だね。' }, { expression: 'smile', text: '火は完全に消えてる。私たちも少しだけ休んでいこうか。' }] },
      { id: 'small_animal', title: '小さな生き物に導かれる', image: './assets/events/ch1/12_small_animal.webp', tier: 'normal', weight: 3, handler: 'stat_random', params: { amount: 5, keys: ['ev'] }, text: '小さな生き物について、足元に気をつけて進んだ。',
        lines: [{ expression: 'surprised', text: 'あ、こっちを気にしてる。' }, { expression: 'guide', text: 'ついて来てって言ってるみたい。足元に気をつけて行こう。' }] },
      { id: 'remember_dan', tier: 'normal', weight: 2, handler: 'stat_random', params: { amount: 5, keys: ['de', 'li'] }, text: 'ダンの言葉を思い出した。', lines: [{ expression: 'normal', text: 'ダンが言ってたよね。「無理をするより、整えてから進め」って。' }, { expression: 'smile', text: '落ち着いて歩いたら、この子の足取りもしっかりしてきた。' }] },
      { id: 'wind_cry', tier: 'normal', weight: 2, handler: 'none', text: '風に乗って鳴き声が聞こえた。', lines: [{ expression: 'surprised', text: '風に乗って、鳴き声が聞こえる。…この子が返事してる！' }, { expression: 'smile', text: '仲間を呼んでるのかな。それとも、挨拶？' }] },
      { id: 'old_grounds', title: '古い訓練跡', image: './assets/events/ch1/03_old_grounds.webp', tier: 'normal', weight: 3, text: '古い訓練跡を見つけた。',
        lines: [{ expression: 'guide', text: 'ここ、昔の訓練場みたい。' }, { expression: 'normal', text: '少し使ってみる？ それとも動きを確かめるだけにする？' }],
        choices: [{ id: 'train', label: '少し鍛える', desc: 'ちから＋5・疲れ＋5', handler: 'stat_tired', params: { amount: 5, keys: ['po'], fatigue: 5 }, text: '古い訓練跡で少し鍛えた。' },
          { id: 'check', label: '動きを確かめる', desc: '命中＋5', handler: 'stat_random', params: { amount: 5, keys: ['hi'] }, text: '訓練跡で動きを確かめた。' }] },
      // 小さな祠（2026-10-04 追加アセット）：2択をやめて、短い休憩イベント（宗教・信仰の設定は足さない）
      { id: 'small_shrine', title: '小さな祠', image: './assets/events/ch1/05_small_shrine.webp', tier: 'normal', weight: 2, handler: 'fatigue', params: { amount: 10 }, text: '小さな祠のそばで、少し落ち着いた。',
        lines: [{ expression: 'normal', text: '小さな祠だね。旅人が立ち寄ってたのかな。' }, { expression: 'smile', text: '少しだけ、ここで落ち着いていこう。' }] },
    ],
    treasurePool: { tierWeights: { normal: 70, rare: 25, special: 5 }, contents: { handler: 'gold_table', params: { table: [{ w: 4, gold: 50 }, { w: 1, gold: 150 }] } } },
    battleTypes: {
      // encounter（2026-10-03）：遭遇の演出の文（絵と同時に出る）【暫定の文面】。tone＝帯の色（wild 赤金・rare 深紅・rival 紫）。ライバルは草むらの揺れ・野生のカットインを使わない
      wild: { label: '野生のモンスター', asset: 'battle_wild', encounter: '野生のモンスターが現れた！', tone: 'wild' },   // 2026-10-04 G3：遭遇は正式のモンスター＋魔法陣＋ENCOUNTER（field-view の encounterShow）。赤い刃の交差のカットイン（fx_battle_encounter）は野生には強すぎるので使わない（素材は残す）   // cutin：野生バトル突入のカットイン（2026-10-02 正式。赤と金の交差。レア・ライバルには付けない）
      rare: { label: 'レアモンスター', asset: 'battle_wild', encounter: 'レアモンスターが現れた！', tone: 'rare', aura: true, badge: '★ レア' },   // aura（2026-10-03 デザイン参考 04）：同じ遭遇の作りに淡い後光・金のリムライト・光の粒・「★ レア」の札（見た目だけ。出現率・判定は変えない）   // レアモンスターマス（10%）。敵データ・報酬・遭遇演出は未登録＝【暫定】バトルの中身は野生と同じ
      rival: { label: 'ライバルのリュウ', name: 'リュウ', asset: 'battle_rival', figure: null, encounterFigure: 'rival_ryu', encounterPartner: 'rival_regnas', encounter: 'リュウが立ちはだかった！', tone: 'rival', noRustle: true,   // 2026-10-05 試遊：遭遇の画面にリュウ（正式立ち絵）と正式の相棒レグナス（js/phase10/monsters.js の RIVAL_MONSTERS）を並べる
        note: 'リュウの相棒は、今のこの子と同じくらいの強さみたい。' },   // 2026-10-04：ライバルの正式名＝リュウ（各 Chapter に登場する同一人物。相棒モンスターは未確定）。強さは js/phase8/rival.js（MMRIVAL）   // sting（2026-10-03 デザイン参考 04 の A1）：1秒未満の「RIVAL」の映画的な一瞬（ネイビー・アイボリーの細い罫線）。ライバルの会話（A2）・自動でバトルへ（A3）は未決＝ライバルの人物・会話のデータが無い
    },
    // ---- Chapter のイベント（2026-10-02。MMCH.storyEvents のデータ。本文は【暫定】）：フィナは節目だけ話す（通常マスごとには話さない）。
    //  trigger：'start'＝Chapter に入った最初、'land'＝止まったあと。when：field＝今回の移動で通った背景・今いる背景、branch＝選んだ道、fx／battleType＝止まったマスの結果、species＝種族、fatigueMin＝疲れ、chance＝確率。
    //  once（既定）＝この個体のこの Chapter で1回。priority＝同時に満たしたときの順（高いほうを1つだけ）。presentation：'bubble'（既定・フィナの小さな吹き出し）／'talk'（小さな会話窓） ----
    story: [
      // ---- 2026-10-04（第二段階）：初回チュートリアル＝フィナとの会話（scope 'save'＝このセーブで1回だけ。見た記録は S.npcFlags.story）。文面は【暫定】 ----
      // 2026-10-05：初めての冒険の最初に1回だけ（このセーブで1回）。30ターンの説明（コードの規則のとおり：rules.turnLimit 30・サイコロ1回＝1ターン・休むも1ターン・ゴールで公式大会・
      //  ターン切れは大会なしで Chapter が終わる（失敗ではない・能力はそのまま次へ）＝engine の onTimeUp 'end'）。出発の一言（ch1_start）も先頭に含める。文面は【暫定】
      { id: 'tut_turns', trigger: 'start', scope: 'save', priority: 70, presentation: 'talk', lines: [{ expression: 'guide', text: '出発の前に、ひとつだけ。この旅は45ターンだよ。サイコロを1回振るか、「休む」を1回使うと、1ターン進むよ。' }, { expression: 'normal', text: '45ターンのうちに大会会場に着けば、公式大会に挑戦できるんだ。' }, { expression: 'smile', text: '間に合わなくても失敗じゃないよ。育った能力は、そのまま次へ持っていけるからね。' }] },
      { id: 'tut_stat', trigger: 'land', scope: 'save', priority: 50, presentation: 'talk', when: { kind: 'chstat' }, lines: [{ expression: 'guide', text: '能力マスだよ。止まると、この子の得意に合わせて能力が伸びるんだ。' }, { expression: 'smile', text: '伸び方は子ごとに違うから、ステータスで確かめてみてね。' }] },
      { id: 'tut_event', trigger: 'land', scope: 'save', priority: 50, presentation: 'talk', when: { hasEvent: true }, lines: [{ expression: 'guide', text: 'イベントマスは、止まるたびに違う出来事が起きるよ。' }, { expression: 'happy', text: '何が起きるかは、その時のお楽しみ！' }] },
      { id: 'tut_rest', trigger: 'land', scope: 'save', priority: 50, presentation: 'talk', when: { recovery: true }, lines: [{ expression: 'guide', text: '休憩マスだね。疲れが減ったよ。' }, { expression: 'normal', text: '疲れが100になるとサイコロが振れなくなるから、操作欄の「休む」も使ってね。' }] },
      { id: 'tut_treasure', trigger: 'land', scope: 'save', priority: 50, presentation: 'talk', when: { kind: 'treasure' }, lines: [{ expression: 'happy', text: '宝箱だ！ 中身はその時によって違うよ。' }, { expression: 'guide', text: '珍しい宝箱ほど、いいものが入ってるみたい。' }] },
      { id: 'tut_wild', trigger: 'land', scope: 'save', priority: 50, presentation: 'talk', when: { fx: 'battle', battleType: 'wild' }, lines: [{ expression: 'surprised', text: '野生のモンスターだ！ ここでバトルするか、やめておくか選べるよ。' }, { expression: 'guide', text: '勝っても賞金は無いけど、いい練習になる。バトルのあとは少し疲れるから気をつけてね。' }] },
      { id: 'tut_rival', trigger: 'land', scope: 'save', priority: 50, presentation: 'talk', when: { fx: 'battle', battleType: 'rival' }, lines: [{ expression: 'surprised', text: 'あっ、リュウ！ やっぱり先に来てたんだね。' }, { speaker: 'ryu', text: 'おっ、もう追いついてきたのか。ちょうどいい、オレの相棒の力を見せてやるよ！' }, { expression: 'guide', text: '街で会ったときより強くなってるはず。でも、私たちだって負けないよ！' }] },   // 2026-10-07：街で先に会っている（登録のあと・市場の前）＝後追いの説明「同じように旅をしてるリュウ」は使わない
      { id: 'tut_branch', trigger: 'branch', scope: 'save', priority: 50, presentation: 'talk', lines: [{ expression: 'guide', text: '分かれ道だよ。どっちの道を通るかは、自分で決められるんだ。' }, { expression: 'smile', text: '道によって出来事や相手が少し変わるみたい。好きなほうを選んでね。' }] },
      { id: 'tut_goal', trigger: 'land', scope: 'save', priority: 60, presentation: 'talk', when: { goal: true }, lines: [{ expression: 'happy', text: 'ゴールだ！ ここから公式大会に挑戦できるよ。' }, { expression: 'guide', text: '大会はランクE〜S。今のこの子に合うランクを選ぼう。参加しない選択もできるよ。' }] },
      { id: 'ch1_start', trigger: 'start', lines: [{ expression: 'happy', text: 'いよいよ出発だね！ 大会会場まで、一緒にがんばろう。' }] },
      { id: 'ch1_first_wild', trigger: 'land', priority: 30, when: { fx: 'battle', battleType: 'wild' }, lines: [{ expression: 'surprised', text: '野生のモンスターだ！ 気をつけて！' }] },
      { id: 'ch1_first_rare', trigger: 'land', priority: 31, when: { fx: 'battle', battleType: 'rare' }, lines: [{ expression: 'surprised', text: 'あの子、見たことない色…！ めずらしいモンスターかも！' }] },
      { id: 'ch1_fork_near', trigger: 'land', priority: 10, when: { field: [6] }, lines: [{ expression: 'guide', text: '滝の向こうで、道が二つに分かれてるみたい。' }] },
      { id: 'ch1_forest', trigger: 'land', priority: 12, when: { branch: 'forest', field: [7] }, lines: [{ expression: 'surprised', text: '大きな木…！ 森の中は、空気がひんやりしてるね。' }] },
      { id: 'ch1_bridge', trigger: 'land', priority: 12, when: { branch: 'bridge', field: [8] }, lines: [{ expression: 'surprised', text: '見て、空まで続いてるみたいな大きな橋！' }] },
      { id: 'ch1_bridge_gauru', trigger: 'land', priority: 13, when: { branch: 'bridge', field: [8], species: ['gauru'] }, lines: [{ expression: 'smile', text: 'ガウル、風が気持ちいいのかな。うれしそう！' }] },
      { id: 'ch1_merge', trigger: 'land', priority: 11, when: { field: [9] }, lines: [{ expression: 'smile', text: '道がひとつに戻ったね。大会会場はもうすぐだよ。' }] },
      { id: 'ch1_castle', trigger: 'land', priority: 11, when: { field: [13] }, lines: [{ expression: 'happy', text: 'お城が見えてきた！ あそこが大会会場だよ。' }] },
      { id: 'ch1_rival_before', trigger: 'land', priority: 20, when: { field: [5] }, lines: [{ expression: 'serious', text: 'この先に誰かいる…。もしかして、リュウ？' }] },
      { id: 'ch1_special_event', trigger: 'land', priority: 25, when: { tier: 'special' }, lines: [{ expression: 'surprised', text: 'すごい…！ 今のは、めったに起きないことだよ！' }] },
      { id: 'ch1_tired', trigger: 'land', priority: 5, when: { fatigueMin: 80 }, lines: [{ expression: 'worried', text: 'だいぶ疲れてきたみたい。無理しないで、休もうね。' }] },
    ],
    // 同行者（フィナ）のリアクション：本文は未決（空＝何も出さない）。例：gold: ['50G拾ったよ。ラッキーだね。']。key は MMCH.REACTION_KEYS
    companion: { npc: 'fina', reactions: {} },

    // ---- サイコロ：回転中は無地の正式サイコロ（dice_blank）、停止面は正式の dice_stop_1〜6（上面＝出目） ----
    // throwFrames（2026-10-03）：既存の正式10コマ（assets/dice/std/。投げる → 空中 → 着地の衝撃 → 静止）で投げて着地させ、停止面で転がって止まる（js/chapter/dice-renderer.js の physical）
    dice: { throwFrames: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => `./assets/dice/std/${String(i).padStart(2, '0')}.webp`), rollingSprite: D + 'dice_blank.webp', resultSprites: { 1: D + 'dice_stop_1.webp', 2: D + 'dice_stop_2.webp', 3: D + 'dice_stop_3.webp', 4: D + 'dice_stop_4.webp', 5: D + 'dice_stop_5.webp', 6: D + 'dice_stop_6.webp' } },

    assets: {
      stat_li: A + 'nodes/stat_life.webp', stat_po: A + 'nodes/stat_power.webp', stat_in: A + 'nodes/stat_intelligence.webp',
      stat_hi: A + 'nodes/stat_accuracy.webp', stat_ev: A + 'nodes/stat_evasion.webp', stat_de: A + 'nodes/stat_toughness.webp',
      event_normal: A + 'nodes/event_normal.webp', event_rare: A + 'nodes/event_rare.webp', event_special: A + 'nodes/event_special.webp',
      treasure_normal: A + 'nodes/treasure_normal.webp', treasure_rare: A + 'nodes/treasure_rare.webp', treasure_special: A + 'nodes/treasure_special.webp',
      battle_wild: A + 'nodes/battle_wild.webp', battle_rival: A + 'nodes/battle_rival.webp', rival_ryu: './assets/npc/ryu/ryu_official_fullbody.webp', rival_regnas: './assets/monsters/regnas/regnas_official.webp',
      grass_front: A + 'env/grass_flower_border.webp',
      // 演出（2026-10-02。ZIP mystic-monsters-board-ui-assets-2026-10-01-v2 の 03_board_effects を透過化。assets/fields/ch1a/effects/README.md）
      fx_battle_encounter: A + 'effects/effect_battle_encounter.webp', fx_stat_up: A + 'effects/frame_stat_up.webp', fx_turn_warning: A + 'effects/ui_turn_warning.webp',
      // 宝箱（2026-10-03 正式素材 4種類＝assets/chests/。各＝本体1枚＋開封アニメーション4枚。README.md）：normal＝chest_01（木）、special＝chest_04（虹色）。
      //  4種類はそれぞれ別ランク・別用途（正式の対応表は後日）。chest_02・03 は保存のみ（統合しない）。rare は対応表が届くまで従来の表示のまま。旧（2026-10-02）の chest_normal／rainbow は tiles/ にファイルだけ残す
      ...['01', '02', '03', '04'].reduce((o, n) => Object.assign(o, { [`chest_${n}_base`]: `${CB}chest_${n}_base.webp` },
        ...[1, 2, 3, 4].map((i) => ({ [`chest_${n}_anim_0${i}`]: `${CB}chest_${n}_anim_0${i}.webp` }))), {}),
    },
    // 目印：石板の脇（道の中央の輪にモンスター、目印は輪の横。奥の輪でもモンスターに重ならない距離 gap）。足元の草は置かない（石の道）
    nodeLook: {
      stat: { w: 104, side: 1, gap: 215, sink: 0.1, tuft: false },
      event: { h: 110, side: 1, gap: 215, sink: 0.06, tuft: false },
      eventNature: { w: 140, side: 1, gap: 215, sink: 0.08, tuft: false },
      treasure: { w: 88, side: -1, gap: 205, sink: 0.08, tuft: false },
      battle: { h: 140, side: 1, gap: 170, sink: 0.04, tuft: false },
      figure: { h: 190, side: 1, gap: 150, sink: 0.02, tuft: false },
      tuft: 'grass_front',
    },
    // ---- マスUI（2026-10-02 正式素材：assets/fields/ch1a/tiles/。ZIP mystic-monsters-board-ui-assets-complete-2026-10-02 の 01_board_nodes・05_goal_and_treasure を透過化）。
    //  60個の座標は BACKGROUNDS[].nodes のまま、種別ごとの素材だけを差し替える。種別名は MMCH.NODE_TYPES。探す順＝種別名 → まとめた種類（stat・event・battle）→ normal。
    //  通常マス（normal）・スタート（start）の正式素材は未着（ZIP の MISSING_OR_PENDING）＝何も置かない。位置確認の仮表示は ?chdebug=1 のときだけ。
    //  バトルのマスは 野生（赤い爪）・レアモンスター（深紅。ZIP の board_node_strong_enemy＝tile_rare_monster）・ライバル（紫の交差した剣）の3種類だけ（強敵マスは無い）
    //  replacesLandmarks：マスUIが種別を示すので、同じ意味の旧目印（道端の石碑・宝箱・イベントの物）は出さない ----
    tileUI: {
      // 2026-10-06：小型の立体マス（assets/fields/ch1a/tiles_v2/。ZIP claude_next_fix_assets_v2 の 05・06 を透過化。README.md）。宝箱は段階ごと（1＝normal・2＝rare・3＝special。4 は予約＝使わない）。
      //  合流は専用の絵が無いので白紙（tile_blank）。スタート・ゴールは下の sprites（従来）のまま
      discs: {
        stat_life: T2 + 'tile_stat_life.webp', stat_power: T2 + 'tile_stat_power.webp', stat_intelligence: T2 + 'tile_stat_intelligence.webp',
        stat_accuracy: T2 + 'tile_stat_accuracy.webp', stat_evasion: T2 + 'tile_stat_evasion.webp', stat_toughness: T2 + 'tile_stat_toughness.webp',
        normal: T2 + 'tile_blank.webp', merge: T2 + 'tile_blank.webp', branch: T2 + 'tile_branch.webp', event: T2 + 'tile_event.webp', rest: T2 + 'tile_rest.webp',
        wild: T2 + 'tile_wild_monster.webp', rare: T2 + 'tile_rare_monster.webp', rival: T2 + 'tile_rival.webp',
        treasure_normal: T2 + 'tile_treasure_1.webp', treasure_rare: T2 + 'tile_treasure_2.webp', treasure_special: T2 + 'tile_treasure_3.webp', treasure: T2 + 'tile_treasure_1.webp',
      },
      discSize: { w: 128, pow: 0.9, roadMax: 0.42, aspect: 0.78, flat: { near: 1, far: 0.8 } },
      // 2026-10-08 正式：マスの見た目の大きさは手前でも奥でも同じ（全背景共通の node-size token。画面の幅 × vw を min〜max px に収める）。
      //  カメラの拡大・縮小（奥へ進むと寄る・分岐で引く）はマスだけ逆に打ち消す（field-view の --inv）＝「奥へ行ったからマスが小さくなった」と見えない。分岐の道・橋の上・背景の切り替えの前後も同じ大きさ
      fixedSize: { vw: 0.18, min: 58, max: 78, aspect: 0.78 },
      sprites: {
        stat_life: TL + 'tile_stat_life.webp', stat_power: TL + 'tile_stat_power.webp', stat_intelligence: TL + 'tile_stat_intelligence.webp',
        stat_accuracy: TL + 'tile_stat_accuracy.webp', stat_evasion: TL + 'tile_stat_evasion.webp', stat_toughness: TL + 'tile_stat_toughness.webp',
        wild: TL + 'tile_wild_battle.webp', rare: TL + 'tile_rare_monster.webp', rival: TL + 'tile_rival.webp',
        treasure: TL + 'tile_treasure.webp', rest: TL + 'tile_rest.webp', event: TL + 'tile_event.webp', goal: TL + 'tile_chapter_goal.webp',
        branch: TL + 'tile_branch.webp', merge: TL + 'tile_merge.webp',   // 分かれ道・合流（2026-10-02。ZIP の 02_branching の board_node_branch／merge を透過化）
      },
      // 宝箱のマスに止まったとき、マスの脇に現れて開く宝箱（tier ごと。書いていない tier＝rare は従来の表示＝マスUIだけ）
      //  frames＝開封アニメーション（順に切り替え、最後の1枚が開いたままの姿＝open）。2026-10-03 正式4種類のうち normal＝chest_01・special＝chest_04（ほかは対応表待ち）
      chests: {
        normal: { closed: 'chest_01_base', open: 'chest_01_anim_04', frames: ['chest_01_anim_01', 'chest_01_anim_02', 'chest_01_anim_03', 'chest_01_anim_04'], w: 136 },
        special: { closed: 'chest_04_base', open: 'chest_04_anim_04', frames: ['chest_04_anim_01', 'chest_04_anim_02', 'chest_04_anim_03', 'chest_04_anim_04'], w: 150 },
      },
      // 大きさ（2026-10-03 試遊で最優先）：roadFit＝その地点で見えている道幅に対する割合（通常マス 0.55・能力 0.58・宝／イベント／休憩 0.62・バトル／分かれ道／合流／ゴール 0.66。道を覆わない）。
      //  fitScale＝共通の基準（2026-10-03 総監査。区分の比率は変えず全体を 0.72 倍＝実際の幅は道幅の 通常 40%・能力 42%・宝／イベント 45%・バトル等 48%。道と歩く道筋が見える）。
      //  roadFit が無いときの旧方式：基準 w × 奥行き^depthPow（背景の画素）。flat＝縦の潰れ（奥 far ほど平たい楕円・手前 near ほど円に近い。奥行き d で補間）。normal＝通常マスの大きさの倍率（控えめ）。
      //  pedestal＝道に刻まれたマス（ごく薄い接地影・細い金属の縁 rim。厚みは見せない＝thick 0。CSS だけ）。farOpacity＝いちばん奥のマスの濃さ（奥ほど控えめ）。ノードごとの上書きは BACKGROUNDS[].nodes の4番目 { s, f }
      size: { uniform: { w: 193, pow: 0.9, roadMax: 0.62, opacity: 1 }, roadFit: { normal: 0.55, stat: 0.58, mid: 0.62, big: 0.66 }, fitScale: 0.66, w: 186, depthPow: 0.82, flat: { near: 0.5, far: 0.28, dNear: 1.12, dFar: 0.4 }, normal: 0.78, thick: 0, rim: 0.011, farOpacity: 0.62 }, pedestal: true, base: { src: TL + 'pedestal_common.webp', scale: 1.25, h: 1.25, lift: 0.43, icon: 0.9 }, placeholder: false, replacesLandmarks: true,
      gates: { gate_left: TL + 'branch_gate_left.webp', gate_right: TL + 'branch_gate_right.webp' },   // 分かれ道で道の先に立てる左右の門（branches[].options[].gate）   // 表示の大きさ：基準 230px × 奥行き^0.65（手前 約250px・奥 約130px＝背景の画素。縦は 0.46 に潰して地面に置いた見え方）
    },
    // 演出の割り当て（config.assets のキー）。statUp＝能力マスの結果の枠（文字は HTML）。turnWarning.at＝警告を出す残りターン（未決＝空＝出さない。例：[5, 1]）
    effects: { statUp: 'fx_stat_up', turnWarning: { asset: 'fx_turn_warning', at: [] } },
    battleMarkers: false,
    landmarkVisibility: { stat: 'arrive', event: 'arrive', treasure: 'arrive' },   // 宝箱はマスUIがあるので、止まったときに現れる
    // ---- 歩行アニメ（2026-10-02 正式素材：ソラモの後ろ向き歩行 8カット。assets/monsters/solamo_walk_back/）。種族キーごと。無い種族は従来の画像＋CSS の上下動。
    //  その場歩行の絵：移動の間だけ 01→08 をループ（fps × 歩く速さ）、止まったら idle（01）。後ろ姿なので左右反転・前傾はしない（noFlip） ----
    monsterSprites: {
      // 2026-10-02 正式素材（ZIP mismon_walk_sprites_transparent。assets/monsters/{種族}_walk/README.md）：ガウル 6コマ（後ろ姿）・ノビトン 8コマ（横向き＝右向き）・ジオル 8コマ。
      //  移動の時間は種族で変えない（歩く速さは共通）。コマの速さだけ：ガウルは 6コマなので 9fps（1周 約0.67秒＝8コマの 12fps と同じ）。h は箱に対する高さ（体型の違い）
      gauru: { walk: { frames: [1, 2, 3, 4, 5, 6].map((i) => `./assets/monsters/gauru_walk/gauru_walk_0${i}.webp`), fps: 9, idle: 0, h: 1.05, noFlip: true } },
      nobiton: { walk: { frames: [1, 2, 3, 4, 5, 6, 7, 8].map((i) => `./assets/monsters/nobiton_walk/nobiton_walk_0${i}.webp`), fps: 12, idle: 0, h: 0.86, noFlip: true } },
      jiol: { walk: { frames: [1, 2, 3, 4, 5, 6, 7, 8].map((i) => `./assets/monsters/jiol_walk/jiol_walk_0${i}.webp`), fps: 12, idle: 0, h: 0.95, noFlip: true } },
      solamo: { walk: { frames: [1, 2, 3, 4, 5, 6, 7, 8].map((i) => `./assets/monsters/solamo_walk_back/solamo_walk_back_0${i}.webp`), fps: 12, idle: 0, h: 0.9, noFlip: true } },
    },
    monster: { h: 180, w: 150 },   // w＝体の幅（道の安全域の計算に使う。画像の見た目の幅）
    landmarks, foreground, branchOverlays: {},
  };
  if (root.MMCH) root.MMCH.registerConfig(cfg);
  root.MMCH_CONFIG_CH1A = cfg;
})(typeof window !== 'undefined' ? window : globalThis);
