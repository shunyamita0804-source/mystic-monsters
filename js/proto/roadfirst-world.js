// =========================================================
// Chapter 1 Pattern A 道路先行の試作 — 1枚の世界ビュー `MMRF_WORLD`（2026-10-10・絵なしの技術検証。正式ではない）
//
//  URL に ?chapterBoard=roadfirst&rfView=world を付けたときだけ js/proto/roadfirst-view.js が使う（それ以外は何もしない）。
//  方針（ユーザー決定 2026-10-10）：添付の全体マップ＝原本の座標（MMRF_DATA の 1024×1536 単位）を正式の世界座標として1枚の世界にする。
//    ・地面と道はこのファイルが canvas に描く（道の形は原本の地点の並びだけから＝作り道・欠けた道が起きない）。今は絵が無いので仮の色。
//      絵が届いたら drawGround／drawRoads の塗りをテクスチャに替えるだけ（A・B・C・D 群）。
//    ・地面の板を CSS 3D で手前に傾ける（tilt）。マス・モンスターは傾けずに立てて置く（板の上の点を同じ式で画面へ写す＝project）。
//    ・開始の俯瞰：傾けない真上で世界全体 → START へ寄りながら傾ける。追従：今の道で6マス先までが空いている所に入る倍率。
//  移動・サイコロ・保存は MMRF_CORE／MMRF_PLAY／roadfirst-view.js のまま（ここでは決めない・状態を持たない＝カメラは保存しない）。
//  純粋な関数（project・fitZoom・lookahead）は Node でも動く（tests/roadfirst-world-1010.test.mjs）。
// =========================================================
(function (root) {
  'use strict';
  const WORLD = { w: 1024, h: 1536 };
  const DEF = {
    tilt: 40,            // 地面を手前に傾ける角度（度）【検証用の値】
    persp: 900,          // 遠近の強さ（CSS の perspective・px）
    res: 2,              // 地面の canvas の細かさ（px／単位）
    chunk: 512,          // canvas の区画（px）
    roadW: 18,           // 道の幅（単位）
    tileW: 13,           // マスの幅（単位）。原本の間隔は中央値 21・枝の D_LLA／D_R5 は約15
    tilePx: [22, 58],    // 追従のときのマスの画面の大きさの下限・上限（px。俯瞰では下限なし）
    sMin: 1.3, sMax: 4.2,// 追従の倍率の範囲（px／単位・注視点の奥行きで）
    ahead: 6,            // 何マス先まで見せるか
    anchor: 0.70,        // モンスターを空いている所の上から何割の高さに置くか
    margin: 22,          // 空いている所の内側の余白（px）
    art: null,           // 2026-10-10 第1便の絵の試し貼り（&rfArt=1010）＝{ base }。無ければ仮の色のまま
    // 2026-10-12 試遊修正（本編の Chapter 1＝js/chapter/world-board.js が渡す。試作の既定は従来どおり）
    focus: false,        // true＝今の道筋（info.focus＝直前の数地点・今の地点・先の地点）以外のマスを薄くし、地面に道筋のまわりだけを明るく残す薄い幕
    veil: true,          // focus のとき地面の薄い幕も描くか（2026-10-12 試遊：本編は false＝地面の絵は暗くしない・マスの薄さだけで道筋を示す）
    monRatio: 0,         // >0＝モンスターの幅をその地点のマスの幅 × この倍率に（0＝従来の 24単位）
    zoomTau: 170,        // 追従の倍率を寄せる速さ（ms。大きいほどゆっくり）
    xray: false,         // 2026-10-12 試遊：true＝手前の景物（木・門など）が見えているマス・モンスターに重なるとき、その景物を半透明に（本編の Chapter 1 だけ）
    hideLm: null,
    // 2026-10-14 開発29（6）：後ろから追うカメラ（本編の Chapter 1 だけ・試作の既定は従来の北が上）。true＝進む向き（今の地点 → 先の数地点）が画面の上になるよう、地面の板を注視点のまわりで回す（yaw）。
    //   マス・景物・モンスターは立てたまま（project で同じ回転を通して置く）。回る速さ yawTau（ms）＝急に回らない・角を曲がるときもなめらか。止まっている間は最後の向きのまま
    visual: 'A',         // 2026-10-14 Chapter 1 B／C：景観のパターン（VISUAL の鍵。A＝従来のまま・B＝花と清流・C＝岩丘と遺跡。地点・道・判定は共通＝景物の混ぜ方と配置だけ）
    // 2026-10-16 QA（C案カメラ・試作。URL の ?qaCam=c|ccut のときだけ js/chapter/world-board.js が渡す。null＝従来のまま）：
    //   歩いている間は向き（yaw）と倍率を変えない（区間で安定）・止まったとき／分かれ道を選んだときだけ、進む向きとのずれが camTurnDeg 以上なら短く向きを変える
    //   （'c'＝camTurnMs で回す・'ccut'＝盤を少し暗くして向きを切り替える）。止まったときの小さな注視点のずれ（camDz px 未満）は追わない
    camMode: null, camTurnDeg: 50, camTurnMs: 600, camDz: 12,
    qaRoad: null,        // 2026-10-16 QA（A 道路の見た目・試作。URL の ?qaRoad=1|2 のときだけ js/chapter/world-board.js が渡す。null＝従来のまま）
    heading: false, yawTau: 420,        // 2026-10-13 開発27（11・15）：出さない目印の地点（例 ['START','LOWER_GATE','UPPER_GATE']＝門の飾りの絵だけを出さない。地点・道・門のマス・判定・イベントはそのまま。本編の Chapter 1 だけ）
  };
  // 第1便の絵（assets/proto/board_art_1010/README.md）。大きさは世界の単位
  const ART = {
    ground: { file: 'ground_grass.webp', tile: 128 },       // 草地のくり返し1枚＝128単位
    road: { file: 'road_flagstone.webp', tile: 46 },        // 道の中の敷石のくり返し1枚＝46単位
    strip: { file: 'strip_road_stone.webp', w: 23 },        // 第2便の追加：直線の石の道（縁石つき）を道筋に沿って並べる（幅＝縁石まで 23単位）
    // 景物の割合（p の合計 1）。第2便で針葉樹・茂み・石柱・小花を追加
    props: [{ key: 'tree', file: 'prop_tree.webp', w: 30, p: 0.30 }, { key: 'conifer', file: 'prop_conifer.webp', w: 17, p: 0.22 },
      { key: 'shrub', file: 'prop_shrub.webp', w: 17, p: 0.18 }, { key: 'rock', file: 'prop_rock.webp', w: 24, p: 0.12 },
      { key: 'flowers', file: 'prop_flowers.webp', w: 13, p: 0.10 }, { key: 'pillar', file: 'prop_pillar.webp', w: 11, p: 0.04 },
      { key: 'mossy', file: 'prop_mossy_rock.webp', w: 16, p: 0.04 }],   // 第4便：苔むした岩
    goal: { file: 'goal_arena.webp', w: 150, dy: 14, back: 4 },      // GOAL の後ろ（足もと＝GOAL の 14単位手前）
    terrain: { valley: { file: 'ground_valley.webp', tile: 72 }, water: { file: 'ground_water.webp', tile: 80 },   // 谷底は小さく＝遠く深く見せる
      cloud: { file: 'ground_cloud.webp', tile: 150 }, canopy: { row: 13 },   // 第4便：雲海（A6）・森の樹冠（B3 の帯を段に重ねたくり返し・段の間隔 13単位）
      edges: { grass: { file: 'edge_grass.webp', w: 22, shift: 5 }, rock: { file: 'edge_rock.webp', w: 22, shift: 5 },
        shore: { file: 'edge_shore.webp', w: 16, shift: 2 }, cloud: { file: 'edge_cloud.webp', w: 26, shift: 7 }, forest: { file: 'edge_forest.webp', w: 30, shift: 3, flip: true } }, depth: 0.32 },
    // 第4便：水辺の景物（谷の中の川に沿って並べる。滝は川の始まり）・山の岩峰（後半の山の区域の道から離れた所）
    water: { fall: { file: 'prop_waterfall.webp', w: 40 }, rocks: { file: 'prop_stream_rocks.webp', w: 17 }, lilies: { file: 'prop_lilies.webp', w: 15 }, reeds: { file: 'prop_reeds.webp', w: 12 }, every: 34 },
    peaks: { file: 'prop_peak.webp', at: [[160, 112, 62], [330, 96, 54], [700, 84, 56], [872, 96, 60], [994, 262, 50], [58, 486, 58], [236, 566, 50], [800, 560, 54]] },   // shift＝崖の帯を谷の側へずらす（岩肌が谷へ垂れる）・depth＝谷の暗さ
    // 決まった地点の目印（第2便・第3便）。along＝進む向きへずらす（行き止まりは奥へ）・side＝進む向きの右へずらす・z＝前後（負＝モンスターより奥）
    //   off＝地点からの決まったずれ（石像＝3本の道の分かれ目の奥の空き地）。門（START・下門・上門）は地点のすぐ奥で道をまたぐ＝モンスターは門の前に立つ。open＝隠れ家が開いている回の絵（st.randOpen）
    landmarks: [{ node: 'START', file: 'lm_start_gate.webp', w: 40, along: 7, z: -30 },
      { node: 'LOWER_GATE', file: 'lm_lower_gate.webp', w: 46, along: 3, z: -30 }, { node: 'UPPER_GATE', file: 'lm_upper_gate.webp', w: 52, along: 3, z: -30 },
      { node: 'CHALLENGE', file: 'lm_seal_gate.webp', w: 46, along: 14, z: -30 }, { node: 'STATUE', file: 'lm_lion.webp', w: 38, off: [-36, -21], z: -30 },
      { node: 'L_CHEST', file: 'lm_moss_tower.webp', w: 38, along: 20, z: -30 }, { node: 'R_CHEST', file: 'lm_watchpost.webp', w: 40, along: 20, z: -30 },
      { node: 'L_ALTAR', file: 'lm_forest_altar.webp', w: 46, along: 22, z: -30 }, { node: 'L_LATE_ALTAR', file: 'lm_cliff_shrine.webp', w: 40, along: 20, z: -30 },
      { node: 'REWARD5', file: 'lm_watch_statue.webp', w: 42, along: 20, z: -30 }, { node: 'R_SPECIAL', file: 'lm_rainbow_falls.webp', w: 44, along: 22, z: -30 },
      { node: 'RANDOM_DEN', file: 'lm_den_closed.webp', open: 'lm_den_open.webp', w: 42, along: 20, z: -30 }],
  };
  // 2026-10-14 Chapter 1 B／C（景観のパターン。ユーザー指示「Chapter1 B・Cパターン 最短完成・限定実装」）：
  //   A＝従来の「はじまりの草原」そのまま（seed・割合・密度は上の ART.props と同じ値＝scatter の出力はバイト単位で同じ。tests の VP-01）。
  //   B＝「花と清流の草原」：小花・茂み・木が多く針葉樹と岩が少ない。川の景物（睡蓮・渓流の岩・葦）を密に。
  //   C＝「岩丘と遺跡の草原」：岩・苔岩・石柱・遺跡の柱（rock_pillar）・岩棚（cliff_grass_chunk）が多く、道から離れた所に岩峰を足す。
  //   どれも既存の素材だけ（新しい絵は作らない）。道・地点・マス・固定の報酬・目印・大会会場・谷・雲海・森の範囲は共通。密度 density＝残す割合（大きいほど多い）・far＝道からの最大の距離
  const SKY3 = './assets/fields/ch3/sky_1016/';
  const VISUAL = {
    A: { key: 'A', name: 'はじまりの草原', desc: 'いまの草原のまま', seed: 0x1010, density: 0.62, far: 66, props: ART.props, water: { every: 34, reedEvery: 3 }, peaks: null },
    B: { key: 'B', name: '花と清流の草原', desc: '小花と清流が多い、明るい緑の草原', seed: 0x1021, density: 0.70, far: 72,
      props: [{ key: 'flowers', file: 'prop_flowers.webp', w: 14, p: 0.30 }, { key: 'shrub', file: 'prop_shrub.webp', w: 17, p: 0.24 }, { key: 'tree', file: 'prop_tree.webp', w: 30, p: 0.22 },
        { key: 'conifer', file: 'prop_conifer.webp', w: 17, p: 0.08 }, { key: 'reeds', file: 'prop_reeds.webp', w: 12, p: 0.06 }, { key: 'mossy', file: 'prop_mossy_rock.webp', w: 15, p: 0.05 },
        { key: 'rock', file: 'prop_rock.webp', w: 20, p: 0.03 }, { key: 'pillar', file: 'prop_pillar.webp', w: 11, p: 0.02 }],
      water: { every: 22, reedEvery: 2 }, peaks: null },
    C: { key: 'C', name: '岩丘と遺跡の草原', desc: '岩と石柱、遺跡の多い明るい高原', seed: 0x1032, density: 0.60, far: 72,
      props: [{ key: 'rock', file: 'prop_rock.webp', w: 24, p: 0.24 }, { key: 'mossy', file: 'prop_mossy_rock.webp', w: 17, p: 0.16 }, { key: 'pillar', file: 'prop_pillar.webp', w: 12, p: 0.14 },
        { key: 'ruin', file: 'rock_pillar.webp', w: 20, p: 0.08 }, { key: 'ledge', file: 'cliff_grass_chunk.webp', w: 24, p: 0.06 }, { key: 'tree', file: 'prop_tree.webp', w: 28, p: 0.12 },
        { key: 'conifer', file: 'prop_conifer.webp', w: 17, p: 0.10 }, { key: 'shrub', file: 'prop_shrub.webp', w: 16, p: 0.07 }, { key: 'flowers', file: 'prop_flowers.webp', w: 13, p: 0.03 }],
      water: { every: 34, reedEvery: 3 }, peaks: { n: 7, w: [44, 60], far: 92, gap: 110, seed: 0x1033 } },
    // 2026-10-18 Chapter 3「天空の浮島」：浮島の上の景物（ユーザー納品の Chapter 3 の正式素材 assets/fields/ch3/sky_1016/＋Chapter 1 の茂み・小花）。雲海の中には小さな浮島と雲（skyProps）
    S: { key: 'S', name: '天空の浮島', desc: '雲海に浮かぶ島々と白い空の橋', seed: 0x3031, density: 0.58, far: 64,
      props: [{ key: 'tree', file: SKY3 + 'C3_ENV_sky_flowering_tree.webp', w: 24, p: 0.24 }, { key: 'wflowers', file: SKY3 + 'C3_ENV_white_flower_patch.webp', w: 13, p: 0.28 },
        { key: 'crystal', file: SKY3 + 'C3_ENV_crystal_cluster_blue.webp', w: 13, p: 0.12 }, { key: 'column', file: SKY3 + 'C3_ARCH_white_column_single.webp', w: 8, p: 0.10 },
        { key: 'shrub', file: 'prop_shrub.webp', w: 15, p: 0.14 }, { key: 'flowers', file: 'prop_flowers.webp', w: 12, p: 0.12 }],
      water: { every: 34, reedEvery: 3 }, peaks: null, sky: true },   // peaks＝道から far 以上・谷／雲海／森の外・目印と岩峰から離れた所に n 個を足す（決まった乱数）
  };
  const visualOf = (o) => VISUAL[o && o.visual] || VISUAL.A;
  // 2026-10-14 Chapter 1 A／B／C 高品質化（skin 'hq1014'）：正式13点の派生（assets/fields/ch1a/board_hq_1014/・tools/boardhq1014/derive.py）で
  //   草地・道の敷石・谷の湿地・木・岩・小花の「絵だけ」を差し替える。地点・道の形・谷／雲海／森の範囲・景物の位置と数（scatter・waterProps・peaksOf の出力）は変えない＝
  //   描くときにファイル名を読み替えるだけ（k＝その景物の幅の倍率。縦長の岩柱を置くときだけ少し細く）。読めない絵は従来の絵へ戻す。o.skin が無ければ従来のまま（試作の既定）
  //   roadTile＝R のくり返し1枚の大きさ（単位。道の帯の石と同じ大きさ）・discCenter＝分かれ目・行き止まりの敷石の円は円の中心に R の中央を合わせる（R2 の上下のつなぎ目を出さない）
  const SKIN = {
    hq1014: { base: './assets/fields/ch1a/board_hq_1014/', roadTile: 57.5, discCenter: true,
      A: { ground: 'ground_a1.webp', road: 'road_r1.webp', strip: 'strip_r1.webp', water: 'water_w1.webp',
        props: { 'prop_tree.webp': ['tree_t1.webp', 1], 'prop_rock.webp': ['rockpillar_rp1.webp', 0.85], 'prop_flowers.webp': ['flowers_f1.webp', 1] } },
      B: { ground: 'ground_a2.webp', road: 'road_r1.webp', strip: 'strip_r1.webp', water: 'water_w1.webp',
        props: { 'prop_tree.webp': ['tree_t2.webp', 1], 'prop_rock.webp': ['rockpillar_rp1.webp', 0.85], 'prop_flowers.webp': ['flowers_f2.webp', 1] } },
      C: { ground: 'ground_a3.webp', road: 'road_r2.webp', strip: 'strip_r2.webp', water: 'water_w2.webp',
        props: { 'prop_tree.webp': ['tree_t1.webp', 1], 'prop_rock.webp': ['rockpillar_rp2.webp', 0.85], 'rock_pillar.webp': ['rockpillar_rp1.webp', 1], 'prop_flowers.webp': ['flowers_f1.webp', 1] } } },
  };
  /** その盤の skin（無ければ null）＝{ base, roadTile, discCenter, ground, road, strip, water, props } */
  const skinOf = (o) => { const K = SKIN[o && o.skin]; if (!K) return null; const v = K[visualOf(o).key] || K.A; return Object.assign({ key: o.skin, base: K.base, roadTile: K.roadTile, discCenter: K.discCenter }, v); };
  // 2026-10-11 地形の範囲（設計：68 Scene の表の景観の説明から）。谷＝輪になった道の内側（崩落の谷・中央の崖）＋石橋の下を横切る谷の腕。
  //   loop＝区間を順にたどった多角形（rev＝逆向き）・arms＝谷の腕の中心線と幅・bridges＝谷の上を渡る区間（道のまわりを陸にしない）・water＝谷の中の水（滝の側）
  const TERRAIN = [
    { id: 'collapse', edge: 'grass',   // 序盤の崩落の谷（Scene03〜20）。左の古石橋 EL02・右の滝の前の石橋 ER02
      loop: [['EL01'], ['EL02'], ['EL03'], ['EL04'], ['ER04', 1], ['ER03', 1], ['ER02', 1], ['ER01', 1]],
      arms: [{ line: [[300, 1150], [275, 1215], [230, 1310], [160, 1430], [95, 1560]], w: 48 }, { line: [[724, 1150], [749, 1212], [796, 1310], [868, 1430], [935, 1560]], w: 48 }],
      bridges: ['EL02', 'ER02'], water: [{ line: [[690, 1120], [749, 1212], [796, 1310], [868, 1430], [935, 1560]], w: 26 }] },
    { id: 'central', edge: 'rock',     // 中盤の中央の崖（Scene24〜33）。左の石橋 Q_L2・右の滝側の石橋 Q_R2
      loop: [['Q_L1'], ['Q_L2'], ['Q_L3'], ['Q_L4'], ['Q_R4', 1], ['Q_R3', 1], ['Q_R2', 1], ['Q_R1', 1]],
      arms: [{ line: [[410, 770], [372, 794], [325, 856], [262, 938]], w: 44 }, { line: [[614, 770], [652, 794], [699, 856], [762, 938]], w: 44 }],
      bridges: ['Q_L2', 'Q_R2'], water: [{ line: [[600, 745], [652, 794], [699, 856], [762, 938]], w: 22 }] },
    // 第4便（2026-10-11）：後半の山の区域＝左右の輪の内側が雲海（Scene36〜62「山並み」「雲海」）→ 真ん中の LATE_SAFE は雲海の上の尾根（中央の安全な尾根）
    { id: 'sky_l', kind: 'cloud', edge: 'cloud', loop: [['LATE_L1'], ['LATE_L_FAIL'], ['LATE_L_FAIL_JOIN'], ['LATE_L_DONE'], ['LATE_SAFE', 1]], arms: [], bridges: [], water: [] },
    { id: 'sky_r', kind: 'cloud', edge: 'cloud', loop: [['LATE_R1'], ['LATE_R2'], ['LATE_R3'], ['LATE_R_DONE'], ['LATE_SAFE', 1]], arms: [], bridges: [], water: [] },
    // 森（樹冠）：START の両側の針葉樹林（Scene01）・左の祭壇のまわり（Scene11〜13）・左下の岩棚の森。道のまわり・谷・目印のまわりは空ける
    { id: 'forest_s', kind: 'forest', edge: 'forest', wobble: 12, poly: [[300, 1352], [470, 1338], [470, 1536], [228, 1536]], arms: [], bridges: [], water: [] },
    { id: 'forest_se', kind: 'forest', edge: 'forest', wobble: 12, poly: [[554, 1338], [724, 1352], [796, 1536], [554, 1536]], arms: [], bridges: [], water: [] },
    { id: 'forest_w', kind: 'forest', edge: 'forest', wobble: 12, poly: [[0, 872], [300, 872], [452, 948], [248, 1036], [120, 1006], [0, 1010]], arms: [], bridges: [], water: [] },
    { id: 'forest_sw', kind: 'forest', edge: 'forest', wobble: 12, poly: [[0, 1262], [196, 1238], [214, 1330], [120, 1536], [0, 1536]], arms: [], bridges: [], water: [] },
  ];
  // 2026-10-14 Chapter 1 B／C 独立ルート：道のデータに art（景観の区域 terrain・岩峰 peaks・目印 landmarks）があればそれを使う（js/proto/roadfirst-routes.js の B／C）。
  //   無ければ A の定義（上の TERRAIN・ART.landmarks・ART.peaks.at）＝A の盤は従来と同じ。目印の file が './' で始まるときはそのままの場所（B／C の目印は assets/fields/ch1a/landmarks_bc_1014/）
  const terrainOf = (D) => (D && D.art && D.art.terrain) || TERRAIN;
  const plugOf = (D) => (D && D.art && D.art.sea3d && root.MMRF_SEA ? root.MMRF_SEA : D && D.art && D.art.volcano3d && root.MMRF_VOLC ? root.MMRF_VOLC : null);   // 2026-10-19：Chapter 2＝海（MMRF_SEA）・Chapter 4＝火山（js/proto/ch4-world.js の MMRF_VOLC）
  const lmOf = (D) => (plugOf(D) && plugOf(D).lm ? plugOf(D).lm(D) : null) || (D && D.art && D.art.landmarks) || ART.landmarks;   // 2026-10-16 Chapter 2：正式の目印（js/proto/ch2-world.js）
  const peaksBase = (D) => (D && D.art && D.art.peaks) || ART.peaks.at;
  const artUrl = (base, f) => (/^\.\//.test(f) ? f : base + f);
  const ROAD_LAND = 18;   // 道の中心から谷のふちまで（単位）＝道の両側に残す陸
  const APRON = 640;   // 世界の外に続ける草地の幅（単位）
  const rad = (d) => (d * Math.PI) / 180;

  // ---- 純粋な関数 ----
  /** 世界の点 (x, y) → 画面の点。cam＝{ tx, ty（注視点）, s, tilt（度）, P, ax, ay（注視点を写す画面の位置） }。k＝遠近の縮み */
  function project(cam, x, y, h) {
    let X0 = x - cam.tx, Y0 = y - cam.ty;
    if (cam.yaw) { const a = rad(cam.yaw), c = Math.cos(a), sn = Math.sin(a), rx = X0 * c - Y0 * sn; Y0 = X0 * sn + Y0 * c; X0 = rx; }   // 2026-10-14 開発29（6）：注視点のまわりで回す（CSS の rotate と同じ向き＝時計回りが正）
    const X = X0 * cam.s, Y = Y0 * cam.s, th = rad(cam.tilt);
    // 2026-10-15 Chapter 2 設計案の試作：h＝地面からの高さ（単位・上が正）。CSS の rotateX と同じ式（h が無い・0 なら従来と同じ）
    const Z = (h || 0) * cam.s, z = Y * Math.sin(th) + Z * Math.cos(th), k = cam.P / (cam.P - z);
    return { x: cam.ax + X * k, y: cam.ay + (Y * Math.cos(th) - Z * Math.sin(th)) * k, k, z };
  }
  /** 2026-10-14 開発29（6）：進む向き → 画面の上に向ける回転（度）。dx・dy は世界の座標の差（y は下向き）。北（上）へ進む＝0・東（右）へ＝−90・南（下）へ＝±180 */
  function headingYaw(dx, dy) { return -Math.atan2(dx, -dy) * 180 / Math.PI; }
  /** 角度の差（−180〜180） */
  function angDiff(a, b) { let d = (b - a) % 360; if (d > 180) d -= 360; if (d < -180) d += 360; return d; }
  /** 点がすべて rect（{ l, t, r, b }）の内側に入る最大の倍率（二分探索）。入らなければ sMin */
  function fitZoom(cam, pts, rect, sMin, sMax) {
    const ok = (s) => pts.every((p) => { const q = project(Object.assign({}, cam, { s }), p[0], p[1], p[2]); return q.x >= rect.l && q.x <= rect.r && q.y >= rect.t && q.y <= rect.b; });
    if (ok(sMax)) return sMax;
    if (!ok(sMin)) return sMin;
    let lo = sMin, hi = sMax;
    for (let i = 0; i < 18; i++) { const m = (lo + hi) / 2; if (ok(m)) lo = m; else hi = m; }
    return lo;
  }
  /** 今の地点から先の地点（6マス先まで・分かれ目のあとはそれぞれ3マスまで）。first＝最初の一歩の候補（MMRF_CORE.options の dst）。back＝枝を戻る途中の区間 */
  function lookahead(D, node, first, back, n, per) {
    n = n || DEF.ahead; per = per || 3;
    const fwd = {}; for (const e of D.edges) if (e[3] === 'forward') (fwd[e[0]] = fwd[e[0]] || []).push(e[1]);
    if (back && D.segments[back]) {   // 行き止まりから戻る途中：その枝を逆にたどる
      const list = D.segments[back][3], i = list.indexOf(node);
      return i > 0 ? list.slice(Math.max(0, i - n), i).reverse() : [];
    }
    const out = [], seen = new Set([node]);
    const walk = (id, left, nexts) => {
      if (left <= 0) return;
      const ns = (nexts || fwd[id] || []).filter((x) => !seen.has(x));
      const k = ns.length > 1 ? Math.min(left, per) : left;
      for (const x of ns) { seen.add(x); out.push(x); walk(x, k - 1); }
    };
    walk(node, n, first && first.length ? first : null);
    return out;
  }

  // ---- 画面 ----
  function create(host, D, P, o) {
    o = Object.assign({}, DEF, Object.fromEntries(Object.entries(o || {}).filter(([, v]) => v !== undefined)));
    const doc = host.ownerDocument;
    const wrap = doc.createElement('div'); wrap.className = 'rfw';
    const plane = doc.createElement('div'); plane.className = 'rfw-plane';
    const bb = doc.createElement('div'); bb.className = 'rfw-bb';
    const title = doc.createElement('div'); title.className = 'rfw-title';
    const TT = D.art && D.art.title;   // 2026-10-15 Chapter 2 の試作（js/proto/ch2-routes.js）だけ題字を持つ。無ければ従来どおり Chapter 1
    title.innerHTML = TT ? `<small>${TT.small}</small>${TT.name}<em>全体マップ${D.art && (D.art.sky || D.art.volcano3d) ? '' : '（設計案・試作）'}</em>` : '<small>CHAPTER 1</small>はじまりの草原<em>全体マップ</em>';
    wrap.appendChild(plane); wrap.appendChild(bb); wrap.appendChild(title); host.appendChild(wrap);
    const VIS = visualOf(o); wrap.dataset.visual = VIS.key;   // 2026-10-14 Chapter 1 B／C：景観のパターン（A＝従来）
    const SK = skinOf(o); if (SK) wrap.dataset.skin = SK.key;   // 2026-10-14 A／B／C 高品質化：絵の差し替え（無ければ従来の絵）
    // 2026-10-15 Chapter 2 A／B／C 設計案の試作（未承認）：道のデータが art.sea3d を持つときだけ海・海底の盆地・螺旋塔を js/proto/ch2-world.js（MMRF_SEA）で描く。
    //  Chapter 1 のデータには無い＝下の SEA の分かれ道はすべて通らない（従来どおり）
    //  2026-10-19 Chapter 4：道のデータが art.volcano3d を持つときは火山（js/proto/ch4-world.js の MMRF_VOLC）。火山の盤は平ら（SEA.flat）＝高さ（art.elev）でマスを持ち上げない・平面は preserve-3d にしない
    const SEA = plugOf(D), SEA3 = !!(SEA && !SEA.flat);
    const ELEV = (SEA3 && D.art.elev) || (!SEA && D && D.art && D.art.elev) || null, hOf = (id) => (ELEV && ELEV[id]) || 0;
    const scl = (s) => (SEA3 ? `scale3d(${s},${s},${s})` : `scale(${s})`);   // 高さのある子（海底・塔）は z も同じ倍率で
    if (SEA3) { wrap.classList.add('sea'); plane.style.transformStyle = 'preserve-3d'; }
    if (D && D.art && D.art.sky) wrap.classList.add('sky');   // 2026-10-18 Chapter 3（空の世界）
    const GA = (SEA && SEA.goal) || ART.goal;   // 大会会場の絵（2026-10-16 Chapter 2 は正式の ocean_arena）
    css(doc);
    const W = Math.ceil(WORLD.w * o.res), H = Math.ceil(WORLD.h * o.res);
    plane.style.width = WORLD.w + 'px'; plane.style.height = WORLD.h + 'px';
    // 地面と道を区画ごとの canvas に1回だけ描く（区画の大きさ chunk px）
    const chunks = [], art = {};
    // 2026-10-16 Chapter 2：海の世界は平面が preserve-3d（海底・塔の板のため）＝地面の区画が1枚ずつ別の 3D の層になり、層ごとの解像度の違いで区画の境目が直線に見えていた。
    //  地面の区画は平らな入れ物（.rfw-gnd）にまとめて1枚の層にする（Chapter 1 は平面が平ら＝従来どおり平面へ直接）
    let gnd = null; if (SEA3) { gnd = doc.createElement('div'); gnd.className = 'rfw-gnd'; Object.assign(gnd.style, { position: 'absolute', left: '0px', top: '0px', width: WORLD.w + 'px', height: WORLD.h + 'px' }); plane.appendChild(gnd); }
    for (let y = 0; y < H; y += o.chunk) for (let x = 0; x < W; x += o.chunk) {
      // 区画どうしを 1px 重ねる（境目に細い線が出ないように）
      const c = doc.createElement('canvas'); const cw = Math.min(o.chunk, W - x) + 2, ch = Math.min(o.chunk, H - y) + 2;
      c.width = cw; c.height = ch; c.className = 'rfw-chunk'; c._x = x - 1; c._y = y - 1;
      c.style.left = (x - 1) / o.res + 'px'; c.style.top = (y - 1) / o.res + 'px'; c.style.width = cw / o.res + 'px'; c.style.height = ch / o.res + 'px';
      (gnd || plane).appendChild(c); chunks.push(c);
    }
    // 2026-10-12：道筋のまわりだけを明るく残す薄い幕（地面の区画の上・マスや景物の下。世界の半分の細かさ）。o.focus のときだけ
    let veil = null, veilSig = '';
    if (o.focus && o.veil !== false) { veil = doc.createElement('canvas'); veil.className = 'rfw-veil'; veil.width = WORLD.w / 2; veil.height = WORLD.h / 2;
      Object.assign(veil.style, { left: '0px', top: '0px', width: WORLD.w + 'px', height: WORLD.h + 'px' }); }
    function paintVeil(ids) {
      const sig = ids.join(','); if (sig === veilSig) return; veilSig = sig; if (!veil) return;
      const g = veil.getContext('2d'); g.setTransform(0.5, 0, 0, 0.5, 0, 0); g.globalCompositeOperation = 'source-over';
      g.clearRect(0, 0, WORLD.w, WORLD.h); g.fillStyle = 'rgba(8,18,30,.46)'; g.fillRect(0, 0, WORLD.w, WORLD.h);
      const set = new Set(ids), lines = [];
      for (const e of D.edges) if (set.has(e[0]) && set.has(e[1])) lines.push([D.nodes[e[0]], D.nodes[e[1]]]);
      g.globalCompositeOperation = 'destination-out'; g.lineCap = 'round'; g.lineJoin = 'round';
      for (const [w, a] of [[92, 0.22], [72, 0.3], [54, 0.45], [38, 1]]) {   // 外ほど薄く消す＝ふちがやわらかい
        g.strokeStyle = `rgba(0,0,0,${a})`; g.fillStyle = g.strokeStyle; g.lineWidth = w;
        for (const [p, q] of lines) { g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke(); }
        for (const id of ids) { const n = D.nodes[id]; if (n) { g.beginPath(); g.arc(n[0], n[1], w / 2, 0, 7); g.fill(); } }
      }
      g.globalCompositeOperation = 'source-over';
    }
    function paintChunk(c) { const g = c.getContext('2d'); g.setTransform(o.res, 0, 0, o.res, -c._x, -c._y);
      const bx = [c._x / o.res, c._y / o.res, c.width / o.res, c.height / o.res];
      if (SEA) { SEA.ground(g, D, bx, art, HELP); SEA.roads(g, D, o, art, bx, HELP); return; }
      drawGround(g, D, bx[0], bx[1], bx[2], bx[3], art); drawTerrain(g, D, o, art, bx); drawRoads(g, D, o, art, bx); }
    // 区画は数フレームに分けて描く（1回の長い処理で画面を止めない。iPhone で開始の俯瞰が引っかからないように）。今の注視点に近い区画から
    let queue = [], painted = false, artDone = !o.art; const dead = () => typeof S !== 'undefined' && S.dead;   // artDone＝絵の読み込みが終わった（失敗した絵は仮の色で描く＝読み込みは必ず終わる）
    function paint(sync) {
      if (sync || !root.requestAnimationFrame) { queue = []; chunks.forEach(paintChunk); painted = true; return; }
      const c0 = (typeof S !== 'undefined' && S.cam) || { tx: WORLD.w / 2, ty: WORLD.h }; const d = (c) => Math.hypot(c._x / o.res + 128 - c0.tx, c._y / o.res + 128 - c0.ty);
      const idle = !queue.length; queue = chunks.slice().sort((a, b) => d(a) - d(b)); painted = false;
      const step = () => { if (dead()) return; const t0 = root.performance.now(); while (queue.length && root.performance.now() - t0 < 10) paintChunk(queue.shift());
        if (queue.length) root.requestAnimationFrame(step); else painted = true; };
      if (idle) root.requestAnimationFrame(step);
    }
    if (!o.art) paint(true);   // 絵を貼るときは読み込みが終わってから1回だけ描く（失敗したら仮の色で描く）
    // 2026-10-16 QA（A）：カメラの近くだけ、地面と道を高い解像度で描き直す層（js/qa/road-1016.js）。従来（qaRoad が null）は作らない
    const QR = o.qaRoad && root.MMQAR ? root.MMQAR : null;
    if (QR) art.qaRoad = o.qaRoad;
    // 2026-10-17 QA（道路画質 P0・Ch2 がぼける原因＝確定）：海の世界の平面は preserve-3d（海底・塔のため）。3D の中の層は「CSS の箱の大きさ × 画素比」で描かれ、
    //  カメラの倍率（最大 5.6）では描き直されない＝近くの区画（CSS 64px・canvas 642px）は約 190px に縮めて描かれてから 5.6倍に引き伸ばされていた（平面を flat にすると直る＝切り分けで確認）。
    //  → 海の世界の近くの区画は平面へ直接置き、CSS の箱を canvas の画素 ÷ 画素比にして transform で縮める（js/qa/road-1016.js の big）＝canvas の画素のまま合成。
    //  ?qaRoadHiBig=0 で従来（比較用）。.rfw-gnd（平らな入れ物）の中では箱を大きくしても入れ物の面に平たくまとめられる＝平面へ直接置く
    const BIG = SEA3 && !/[?&]qaRoadHiBig=0/.test((root.location && root.location.search) || '');
    const HI = QR ? QR.hiLayer({ doc, parent: BIG ? plane : (gnd || plane), big: BIG, WORLD, project, S: null, paintAt: (g, bx) => { if (SEA) { SEA.ground(g, D, bx, art, HELP); SEA.roads(g, D, o, art, bx, HELP); } else { drawGround(g, D, bx[0], bx[1], bx[2], bx[3], art); drawTerrain(g, D, o, art, bx); drawRoads(g, D, o, art, bx); } } }) : null;
    if (veil) plane.appendChild(veil);
    // マス（全地点・立てて置く）とモンスター
    // 2026-10-13 開発28（全景 → START へ寄るカメラのカクつき）：マス・景物・モンスターの大きさは、毎フレーム width を書き換えるのではなく
    //  決まった幅（base）に置いて transform の scale で見せる（width の変更＝レイアウト・再描画・ラスタが要素の数（約600）ぶん毎フレーム起きていた＝66〜91ms の Commit）。
    //  前後の順（zIndex）も画面の y ではなく世界の y で1回だけ決める（画面の y は世界の y に対して単調＝並びは同じ。毎フレームの zIndex の書き換えをなくす）
    // 2026-10-14 実機試遊①・㉒（モンスターがマスの下に潜る・景物がマスを覆う）：開発29（6）で地面の板を進む向きへ回す（yaw）ようになったのに、
    //  前後の順は回す前の世界の y のままだった＝向きが変わると「奥のマス」が手前のモンスターの上に描かれていた。→ 前後の順は回したあとの奥行き
    //  （x・sin(yaw)＋y・cos(yaw)）で決める。毎フレームは書き換えず、向きが 3° 以上変わったときだけ全部を決め直す（zSync）。北が上（yaw 0）では従来と同じ順
    const TB = o.tilePx[1], Z0 = 20000;
    let zYaw = 0;
    const zOf = (y, dz, x) => { const a = rad(zYaw); return Z0 + Math.round(((x || 0) * Math.sin(a) + y * Math.cos(a)) * 4) + (dz || 0); };
    const tiles = {};
    for (const id of Object.keys(D.nodes)) {
      const d = doc.createElement('div'); d.className = 'rfw-tile'; d.dataset.node = id; d.innerHTML = '<img alt="" draggable="false"><span></span>';
      d.style.width = TB + 'px'; d.style.zIndex = String(zOf(D.nodes[id][1], 0, D.nodes[id][0]));
      bb.appendChild(d); tiles[id] = { el: d, img: d.firstChild, lab: d.lastChild, src: '', mk: '', used: false };
    }
    const rootEl = host.closest ? host.closest('#rfp,.wbv') || wrap : wrap;   // 2026-10-11 本編の Chapter 1（js/chapter/world-board.js の .wbv）でも同じ描画
    const mon = doc.createElement('div'); mon.className = 'rfw-mon'; mon.innerHTML = `<img alt="" draggable="false" src="${o.monSrc || './assets/monsters/2p5d/solamo.webp'}">`; bb.appendChild(mon);
    const MB = Math.round(TB * Math.max(1, o.monRatio || 1)); mon.style.width = MB + 'px';   // モンスターの決まった幅（マスの幅 × 倍率。見せる大きさは scale）
    // 景物（木・岩）と GOAL の大会会場：立てて置く（第1便の絵があるときだけ）
    const props = [];
    if (o.art) {
      const base = o.art.base || './assets/proto/board_art_1010/';
      const load = (f) => new Promise((res) => { const im = new root.Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = base + f; });
      // skin の絵 → 読めなければ従来の絵（im._u＝実際に読めた URL。草地の外の帯にも同じ絵）
      const load2 = (k, f) => (SK && SK[k] ? new Promise((res) => { const im = new root.Image(); im.onload = () => { im._sk = true; res(im); }; im.onerror = () => res(null); im.src = SK.base + SK[k]; }) : Promise.resolve(null))
        .then((im) => im || load(f));
      // 2026-10-17 QA（道路画質・?qaRoadArt=raw|fix のときだけ）：草地・道の帯・敷石の円は新しい素材（js/qa/road-art-1017.js）→ 読めなければ上の skin → 従来の絵
      const QRA = !SEA && root.MMQRA && (root.MMQRA.mode || VIS.sky) ? root.MMQRA : null, q17 = QRA ? QRA.CH1[visualOf(o).key] || QRA.CH1.A : null;
      const load3 = (k, f) => (q17 ? QRA.load(q17[k]).then((im) => (im ? Object.assign(im, { _sk: true }) : load2(k, f))) : load2(k, f));
      const T = ART.terrain;
      const EK = Object.keys(T.edges);
      Promise.all([load3('ground', ART.ground.file), load3('road', ART.road.file), o.art.road === 'pattern' ? null : load3('strip', ART.strip.file),
        load(T.valley.file), load2('water', T.water.file), load(T.cloud.file), ...EK.map((k) => load(T.edges[k].file)), SEA ? SEA.load(load, base) : null]).then(([gi, ri, si, vi, wi, ci, ...ei]) => {
        if (S.dead) return; art.ground = gi; art.road = ri; art.strip = si;
        if (SEA) { art[SEA.flat ? 'volc' : 'sea'] = ei.pop(); vi = null; S.sea3d = SEA.build3d({ doc, plane, D, o, art, H: HELP, base }); }   // 2026-10-15 Chapter 2：谷・雲海・森は使わない（海・海底の盆地・塔）
        else ei.pop();
        if (ri && ri._sk) { art.roadTile = SK ? SK.roadTile : 57.5; art.discCenter = SK ? !!SK.discCenter : true; }   // R の石の大きさ＝道の帯の石にそろえる
        if (vi) { art.terrain = terrainMasks(doc, D, o); art.valley = vi; art.water = wi; art.cloud = ci; art.edges = {}; EK.forEach((k, i) => { art.edges[k] = ei[i]; });
          if (art.edges.forest) art.canopy = canopyTile(doc, art.edges.forest); }
        if (gi || ri) { paint(); wrap.classList.add('art'); } else paint();
        artDone = true;
        // 世界の外（端へ寄ったときに見える所）も同じ草地で続ける：平面の中の安い背景（canvas は世界の中だけ）
        if (gi) { const ap = doc.createElement('div'); ap.className = 'rfw-apron'; const m = APRON;
          Object.assign(ap.style, { left: -m + 'px', top: -m + 'px', width: WORLD.w + 2 * m + 'px', height: WORLD.h + 2 * m + 'px', backgroundImage: `url(${gi._qra ? gi.src : gi._sk ? SK.base + SK.ground : base + ART.ground.file})`,
            backgroundSize: gi._ppu ? `${gi.naturalWidth / gi._ppu}px ${gi.naturalHeight / gi._ppu}px` : `${ART.ground.tile}px ${ART.ground.tile}px`, backgroundPosition: gi._ppu ? `${m % (gi.naturalWidth / gi._ppu)}px ${m % (gi.naturalHeight / gi._ppu)}px` : `${m % ART.ground.tile}px ${m % ART.ground.tile}px` });   // 2026-10-17 QA：新しい草地は _ppu の大きさで
          if (SEA) SEA.apron(ap, base, m);   // 世界の外も海
          else if (D.art && D.art.sky) Object.assign(ap.style, { backgroundImage: `url(${base + ART.terrain.cloud.file})`, backgroundSize: `${ART.terrain.cloud.tile}px ${ART.terrain.cloud.tile}px`, backgroundPosition: `${m % ART.terrain.cloud.tile}px ${m % ART.terrain.cloud.tile}px` });   // 2026-10-18 Chapter 3：世界の外も雲海
          plane.insertBefore(ap, plane.firstChild); } });
      const add = (file, x, y, w, z, cls, h) => { const d = doc.createElement('img'); d.className = 'rfw-prop' + (cls ? ' ' + cls : ''); d.alt = ''; d.draggable = false;
        const sub = SK && SK.props[file], p = { el: d, x, y, w: sub ? w * sub[1] : w, z: z || 0, h: h || 0 };
        if (sub) { d.dataset.k = file; d.addEventListener('error', () => { d.src = base + file; p.w = w; p.base = 0; S.dirty = true; }, { once: true }); d.src = SK.base + sub[0]; }   // 読めなければ従来の絵・従来の幅
        else d.src = artUrl(base, file);
        // 2026-10-18 v2（iPhone 本編試遊・修正4・7）：建物（目印・門・塔・オベリスク・像・会場・岩峰）は半透明にしない＝実体は不透明のまま（透けるのは絵のアルファの所だけ）。
        //  半透明（xray）は木・岩・茂みなどの自然の景物だけ（マス・モンスターを隠すとき）
        p.arch = /rfw-lm|rfw-goal|rfw-peak/.test(cls || '') || /gate|tower|town|arch|pavilion|colonnade|column|pier|statue|obelisk|temple|shrine|lm_|L\d\d_/i.test(file);
        bb.appendChild(d); props.push(p); };
      for (const q of (SEA ? SEA.scatter(D, o, HELP) : scatter(D, o))) add(q.file, q.x, q.y, q.w, q.z || 0, q.cls, q.h);
      if (D.art && D.art.sky) for (const q of skyProps(D, o)) add(q.file, q.x, q.y, q.w, q.z || 0, 'rfw-sky');   // 2026-10-18 Chapter 3：雲海の中の小さな浮島・雲
      const gn = D.nodes.GOAL; if (gn) { add(GA.file, gn[0], gn[1] + GA.dy, GA.w, -40, 'rfw-goal'); const gp = props[props.length - 1]; gp.solid = true;
        // 2026-10-14 実機試遊⑭：大会会場は立てた絵（いつもカメラの方を向く）なので、置く位置も「カメラから見て GOAL のすぐ奥」に合わせる＝正面の階段の下に GOAL の円盤が来る。
        //  地面を進む向きへ回す（heading）本編だけ：GOAL から画面の奥の向きへ back だけ下げた点（回したあとの画面で真上）。試作（北が上）は従来の dy のまま。GOAL の地点・歩数・判定は変えない
        if (o.heading) gp.at = (c) => { const a = rad((c && c.yaw) || 0); return [gn[0] - GA.back * Math.sin(a), gn[1] - GA.back * Math.cos(a)]; }; }   // 2026-10-13 開発27（26）：大会会場（建物・門）は半透明にしない（xray で草地が透けて見えていた）
      for (const L of lmOf(D)) { if (o.hideLm && o.hideLm.includes(L.node)) continue; const at = landmarkAt(D, L); if (at) { add(L.file, at[0], at[1], L.w, L.z || 0, 'rfw-lm', hOf(L.node)); props[props.length - 1].L = L; } }
      for (const q of (SEA ? [] : waterProps(D, o))) add(q.file, q.x, q.y, q.w, q.z || 0, 'rfw-wp');   // 第4便：川の景物（B は密に）
      for (const [x, y, w] of peaksOf(D, o)) add(ART.peaks.file, x, y, w, -20, 'rfw-peak');   // 第4便：山の岩峰（C は足す）
    }
    const S = {
      cam: { tx: WORLD.w / 2, ty: WORLD.h / 2, s: 1, tilt: 0, P: o.persp, ax: 0, ay: 0, yaw: 0 }, goal: null, mon: null, monGoal: null, yawGoal: 0,
      raf: 0, last: 0, intro: null, view: null, frames: [], dead: false,
      // 2026-10-16 QA：向きの回り方の計測（見た目は変えない＝数えるだけ）。deg＝回った角度の合計・ms＝回っている時間・turns＝回り始めた回数・stops＝止まった回数
      qa: { deg: 0, ms: 0, turns: 0, rot: false, maxRate: 0, stops: 0, reorient: 0 }, yawTw: null, camOff: null,
    };
    if (HI) HI.setS(S);
    const CMODE = o.heading && (o.camMode === 'c' || o.camMode === 'ccut') ? o.camMode : null;
    // 2026-10-11：モンスターの足を地点に合わせる＝静止の立ち絵の実際の縦横比で上へずらす（旧：一律 0.92＝縦長・横長の絵で浮く・沈む）。読み込み前は 0.92
    { const mi = mon.firstChild, fit = () => { if (mi.naturalWidth) { S.monAh = (mi.naturalHeight / mi.naturalWidth) * (o.monFoot || 0.97); S.dirty = true; } }; if (mi.complete) fit(); else mi.addEventListener('load', fit, { once: true }); }
    function viewRect() { const v = o.view ? o.view() : null; const r = host.getBoundingClientRect(); return v || { W: r.width, H: r.height, top: 0, bottom: r.height, right: r.width }; }
    /** 俯瞰のカメラ（傾けない・世界全体が画面に入る） */
    function overviewCam(v) {
      const xs = Object.values(D.nodes).map((n) => n[0]), ys = Object.values(D.nodes).map((n) => n[1]);
      const x0 = Math.min(...xs) - 30, x1 = Math.max(...xs) + 30, y0 = Math.min(...ys) - 30, y1 = Math.max(...ys) + 30;
      const s = Math.min(v.W / (x1 - x0), (v.H - 70) / (y1 - y0));
      return { tx: (x0 + x1) / 2, ty: (y0 + y1) / 2, s, tilt: 0, P: o.persp, ax: v.W / 2, ay: v.H / 2 + 26 };
    }
    /** 追従のカメラ：モンスター（mx, my）と先の地点 pts が空いている所に入る倍率 */
    function followCam(v, mx, my, pts, yaw, mh) {
      const rect = { l: o.margin, r: v.right - o.margin, t: v.top + o.margin, b: v.bottom - o.margin };
      const fh = v.bottom - v.top, ax = (rect.l + rect.r) / 2, ay = v.top + fh * o.anchor;
      let tx = mx, ty = my;
      if (pts.length) {   // 画面の横の向き（回したあとの x）で、先の地点の左右の真ん中へ少し寄せる（回していなければ従来と同じ式）
        const a = rad(yaw || 0), c = Math.cos(a), sn = Math.sin(a), xs = pts.map((p) => (p[0] - mx) * c - (p[1] - my) * sn).concat(0);
        const mid = (Math.min(...xs) + Math.max(...xs)) / 2 * 0.6; tx = mx + mid * c; ty = my - mid * sn;
      }
      const cam = { tx, ty, s: o.sMax, tilt: o.tilt, P: o.persp, ax, ay, yaw: yaw || 0 };
      cam.s = fitZoom(cam, pts.concat([[mx, my, mh || 0]]), rect, o.sMin, o.sMax);
      return cam;
    }
    /** 景物の決まった幅（px）：いちばん寄ったときの大きさ（世界の幅 × 最大の倍率 × 手前の遠近）まで。絵の実際の幅より大きくしない（それ以上はぼやけるだけ） */
    function propBase(p) {
      const nat = p.el.naturalWidth || 0, want = Math.min(p.max || 1e9, Math.max(p.min || 0, p.w * o.sMax * 1.3));
      p.base = Math.max(8, Math.round(nat ? Math.min(nat, want) : Math.min(1024, want))); p.el.style.width = p.base + 'px';
      if (!nat) p.el.addEventListener('load', () => { p.base = 0; S.dirty = true; }, { once: true });   // 絵が読めたら実際の幅で決め直す（1回）
    }
    // 2026-10-15 N10：会場へ続く道のマス（GOAL から前向きの接続を逆にたどって、会場の絵の幅のうちにある地点）は、いつも会場の絵より手前に描く。
    //  道が曲がってカメラの向きと会場の向きがずれると、立てた会場の絵が GOAL の手前のマスを覆っていた（C の渦の中心など）。地点・道・GOAL の判定は変えない
    const apprIds = (() => { const gn = D.nodes.GOAL; if (!gn || !GA) return []; const R = GA.w * 0.95, rev = {};
      for (const e of D.edges) if (e[3] === 'forward') (rev[e[1]] = rev[e[1]] || []).push(e[0]);
      const seen = new Set(), q = ['GOAL'];
      for (let i = 0; i < q.length && i < 400; i++) for (const n of rev[q[i]] || []) { const v = D.nodes[n]; if (!seen.has(n) && v && Math.hypot(v[0] - gn[0], v[1] - gn[1]) <= R) { seen.add(n); q.push(n); } }
      return [...seen]; })();
    const apprZ = () => apprIds.reduce((m, id) => Math.min(m, zOf(D.nodes[id][1], 0, D.nodes[id][0])), Infinity);
    const propZ = (p) => (p.solid && S.goalZ != null ? Math.min(zOf(p.y, p.z, p.x), S.goalZ - 1, S.apprZ - 1) : zOf(p.y, p.z, p.x));
    { const gn = D.nodes.GOAL; S.goalZ = gn ? zOf(gn[1], 0, gn[0]) : null; S.apprZ = apprZ(); }
    /** 向き（yaw）に合わせて前後の順を決め直す（3° 以上変わったときだけ＝回っている間も数回だけ） */
    function zSync(yaw) {
      if (!o.heading || Math.abs(angDiff(zYaw, yaw || 0)) < 3) return;
      zYaw = yaw || 0;
      for (const id of Object.keys(tiles)) { const n = D.nodes[id]; tiles[id].el.style.zIndex = String(zOf(n[1], 0, n[0])); }
      { const gn = D.nodes.GOAL; S.goalZ = gn ? zOf(gn[1], 0, gn[0]) : null; S.apprZ = apprZ(); }
      for (const p of props) if (p.zi != null) { p.zi = propZ(p); p.el.style.zIndex = String(p.zi); }
      S.monZ = null;
    }
    function apply() {
      const c = S.cam;
      zSync(c.yaw);
      // カメラもモンスターも動いていなければ描き直さない（止まっている間は何もしない）
      const sig = [c.tx, c.ty, c.s * 100, c.tilt * 10, (c.yaw || 0) * 10, c.ax, c.ay, S.mon ? S.mon[0] : 0, S.mon ? S.mon[1] : 0, S.dirty ? 1 : 0].map((x) => Math.round(x * 10)).join(',');
      if (sig === S.sig) return; S.sig = sig; S.dirty = false;
      // 平面：注視点を原点に移して → 倍率 → 傾き → 画面の位置へ（project と同じ式。perspective-origin＝注視点の画面位置）
      wrap.style.perspective = c.P + 'px'; wrap.style.perspectiveOrigin = `${c.ax}px ${c.ay}px`;
      plane.style.transform = `translate(${c.ax}px,${c.ay}px) rotateX(${c.tilt}deg) ${scl(c.s)} rotate(${(c.yaw || 0).toFixed(3)}deg) translate(${-c.tx}px,${-c.ty}px)`;
      const v = S.view, Wd = v ? v.W : 400, Hd = v ? v.H : 800, xr = [];
      if (o.xray && S.mon) { const q = project(c, S.mon[0], S.mon[1], S.mon[2]), w = o.monRatio > 0 ? Math.max(c.s < 1 ? 14 : 30, Math.max(c.s < 1 ? 2 : o.tilePx[0], Math.min(o.tilePx[1], o.tileW * c.s * q.k)) * o.monRatio) : Math.max(c.s < 1 ? 14 : 40, Math.min(100, 24 * c.s * q.k)), h = w * (S.monAh || 0.92);
        xr.push([q.x - w / 2, q.y - h, q.x + w / 2, q.y, q.y + 2, w * h * 0.5]); }   // モンスターの箱（重なりの判定は半分で＝少しでも隠れたら）
      for (const [id, t] of Object.entries(tiles)) {
        const n = D.nodes[id], q = project(c, n[0], n[1], hOf(id));
        const w = Math.max(c.s < 1 ? 2 : o.tilePx[0], Math.min(o.tilePx[1], o.tileW * c.s * q.k)) * (t.k || 1);   // 2026-10-15 N08：t.k＝そのマスだけの大きさの倍率（ライバルのマス）
        const vis = q.x > -w && q.x < Wd + w && q.y > -w && q.y < Hd + w;
        if (!vis) { if (!t.hid) { t.el.style.display = 'none'; t.hid = true; } continue; }
        if (t.hid) { t.el.style.display = ''; t.hid = false; }
        t.el.style.transform = `translate(${(q.x - w / 2).toFixed(1)}px,${(q.y - w * 0.62).toFixed(1)}px) scale(${(w / TB).toFixed(4)})`;   // 幅は決まった base（TB）＝scale だけで大きさを変える（レイアウトなし）
        if (o.xray) xr.push([q.x - w / 2, q.y - w * 0.62, q.x + w / 2, q.y + w * 0.14, q.y, w * w * 0.76]);
        if (S.sea3d) { const oc = S.sea3d.occl(c, n[0], n[1], hOf(id), q); if (oc !== !!t.oc) { t.oc = oc; t.el.classList.toggle('occl', oc); } }   // 2026-10-15：塔のうしろのマスは薄く
      }
      for (const p of props) {
        if (p.at) { const xy = p.at(c); p.x = xy[0]; p.y = xy[1]; }
        const q = project(c, p.x, p.y, p.h), w = Math.min(p.max || 1e9, Math.max(p.min || 0, p.w * c.s * q.k));
        const vis = q.x > -w && q.x < Wd + w && q.y > -10 && q.y < Hd + w * 1.2 && w > 1.5;
        if (!vis) { if (!p.hid) { p.el.style.display = 'none'; p.hid = true; } continue; }
        if (p.hid) { p.el.style.display = ''; p.hid = false; }
        if (!p.base) propBase(p);
        p.el.style.transform = `translate(${(q.x - w / 2).toFixed(1)}px,${(q.y - w * (p.ah || 0.92)).toFixed(1)}px) scale(${(w / p.base).toFixed(4)})`;
        if (p.zi == null) { p.zi = propZ(p); p.el.style.zIndex = String(p.zi); }   // 2026-10-13 開発27（26）：半透明にしない大会会場は GOAL のマスより奥（マスを隠さない）。順は世界の y で1回だけ
        if (o.xray && !p.mark && !p.solid && !p.arch) {   // 手前の景物がマス・モンスターを隠す＝その景物だけ半透明（重なった面積がマス・モンスターの 22% 以上）
          const pz = Math.round(q.y) + (p.z || 0), x0 = q.x - w / 2, x1 = q.x + w / 2, y0 = q.y - w * (p.ah || 0.92), y1 = q.y;
          let thru = false;
          if (c.s >= 1) for (const r of xr) { if (r[4] >= pz) continue; const ow = Math.min(x1, r[2]) - Math.max(x0, r[0]), oh = Math.min(y1, r[3]) - Math.max(y0, r[1]); if (ow > 0 && oh > 0 && ow * oh > r[5] * 0.22) { thru = true; break; } }
          if (thru !== !!p.thru) { p.thru = thru; p.el.classList.toggle('thru', thru); }
        }
      }
      if (S.mon) {
        if (S.sea3d) S.sea3d.mon(S.mon[2], S.mon);   // 2026-10-15 Chapter 2：海底へ潜ると盆地の上の海面が薄くなる
        const q = project(c, S.mon[0], S.mon[1], S.mon[2]);
        const w = o.monRatio > 0 ? Math.max(c.s < 1 ? 14 : 30, Math.max(c.s < 1 ? 2 : o.tilePx[0], Math.min(o.tilePx[1], o.tileW * c.s * q.k)) * o.monRatio)   // 2026-10-12：その地点のマスの幅 × 倍率（マスと同じ式）
          : Math.max(c.s < 1 ? 14 : 40, Math.min(100, 24 * c.s * q.k));
        mon.style.transform = `translate(${(q.x - w / 2).toFixed(1)}px,${(q.y - w * (S.monAh || 0.92)).toFixed(1)}px) scale(${(w / MB).toFixed(4)})`;
        const mz = zOf(S.mon[1], 2, S.mon[0]); if (mz !== S.monZ) { S.monZ = mz; mon.style.zIndex = String(mz); }
      }
    }
    const lerp = (a, b, t) => a + (b - a) * t;
    const INTRO_SAMPLES = 24;   // 道筋の刻み（緩急は刻みに織り込む＝アニメーション自体は linear）
    const easeInOut = (u) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);
    /** 全景 → 到着地の道筋を全要素ぶん一度に作り、同じ時間軸で動かす（合成スレッド）。動けない環境（animate が無い）では旧来どおり最後の姿へ */
    function startIntroAnims(it, now) {
      const to = it.to(), from = it.from, v = S.view || viewRect(), Wd = v.W, Hd = v.H, dur = Math.max(1, it.dur);
      const cams = []; for (let i = 0; i <= INTRO_SAMPLES; i++) { const e = easeInOut(i / INTRO_SAMPLES), c = { P: o.persp, ax: to.ax, ay: to.ay };
        for (const k of ['tx', 'ty', 'tilt']) c[k] = lerp(from[k], to[k], e); c.s = Math.exp(lerp(Math.log(from.s), Math.log(to.s), e)); c.yaw = (from.yaw || 0) + angDiff(from.yaw || 0, to.yaw || 0) * e; cams.push(c); }
      zSync(to.yaw);   // 寄り終わりの向きで前後の順を決めておく（寄る間は小さい＝順の違いは見えない）
      const anims = [], can = typeof plane.animate === 'function';
      const run = (el, kf) => { if (!can) return; try { anims.push(el.animate(kf, { duration: dur, easing: 'linear', fill: 'forwards' })); } catch (e) { /* 動かせない要素は最後の姿へ */ } };
      wrap.style.perspective = o.persp + 'px'; wrap.style.perspectiveOrigin = `${to.ax}px ${to.ay}px`;
      run(plane, cams.map((c, i) => ({ transform: `translate(${c.ax}px,${c.ay}px) rotateX(${c.tilt}deg) ${scl(c.s)} rotate(${(c.yaw || 0).toFixed(3)}deg) translate(${-c.tx}px,${-c.ty}px)`, offset: i / INTRO_SAMPLES })));
      const tileW = (c, q) => Math.max(c.s < 1 ? 2 : o.tilePx[0], Math.min(o.tilePx[1], o.tileW * c.s * q.k));
      const onScreen = (q, w) => q.x > -w && q.x < Wd + w && q.y > -w && q.y < Hd + w;
      // 2026-10-14 Chapter 1 進入時のクラッシュ対策（iPhone で題字 → 全景の瞬間に落ちる）：寄る間は全要素が別々の層になる。
      //  要素の幅を決まった base のままにすると、全景で米粒ほどの要素も base の大きさの層を持つ（約570層）→ 寄る間だけ幅を「画面に見えている間の最大の大きさ」に縮め、
      //  scale はその幅に対する比（見えている間は 1 以下＝見た目・位置は同じ）。画面の外の刻みは 1 で止める（左上が基準＝小さくしても画面に入らない）。終わりで base に戻す
      const resized = [];
      const fit = (el, base, rs, on) => {
        const near = on.map((v, i) => v || on[i - 1] || on[i + 1]);   // 画面のふちを出入りする刻みの前後も含める（出入りの途中の大きさを変えない）
        const m = Math.max(...rs.filter((r, i) => near[i]), 0);
        if (!(m > 0) || m >= 0.98) return (r) => r;
        el.style.width = Math.max(1, base * m).toFixed(1) + 'px'; resized.push([el, base]);
        return (r, i) => (near[i] ? r / m : Math.min(1, r / m));
      };
      for (const [id, t] of Object.entries(tiles)) {
        const n = D.nodes[id], on = [], rs = [];
        const qs = cams.map((c) => { const q = project(c, n[0], n[1], hOf(id)), w = tileW(c, q) * (t.k || 1); on.push(onScreen(q, w)); rs.push(w / TB); return [q, w]; });
        if (!on.includes(true)) { if (!t.hid) { t.el.style.display = 'none'; t.hid = true; } continue; }
        if (t.hid) { t.el.style.display = ''; t.hid = false; }
        const sc = fit(t.el, TB, rs, on);
        run(t.el, qs.map(([q, w], i) => ({ transform: `translate(${(q.x - w / 2).toFixed(1)}px,${(q.y - w * 0.62).toFixed(1)}px) scale(${sc(rs[i], i).toFixed(4)})`, offset: i / INTRO_SAMPLES })));
      }
      for (const p of props) {
        if (!p.base) propBase(p); const on = [], rs = [];
        const qs = cams.map((c) => { const xy = p.at ? p.at(c) : [p.x, p.y], q = project(c, xy[0], xy[1], p.h), w = Math.min(p.max || 1e9, Math.max(p.min || 0, p.w * c.s * q.k)); on.push(q.x > -w && q.x < Wd + w && q.y > -10 && q.y < Hd + w * 1.2 && w > 1.5); rs.push(w / p.base); return [q, w]; });
        if (!on.includes(true)) { if (!p.hid) { p.el.style.display = 'none'; p.hid = true; } continue; }
        if (p.hid) { p.el.style.display = ''; p.hid = false; }
        if (p.zi == null) { p.zi = propZ(p); p.el.style.zIndex = String(p.zi); }
        const sc = fit(p.el, p.base, rs, on);
        run(p.el, qs.map(([q, w], i) => ({ transform: `translate(${(q.x - w / 2).toFixed(1)}px,${(q.y - w * (p.ah || 0.92)).toFixed(1)}px) scale(${sc(rs[i], i).toFixed(4)})`, offset: i / INTRO_SAMPLES })));
      }
      if (S.mon) {
        const kf = cams.map((c, i) => { const q = project(c, S.mon[0], S.mon[1], S.mon[2]), w = o.monRatio > 0 ? Math.max(c.s < 1 ? 14 : 30, tileW(c, q) * o.monRatio) : Math.max(c.s < 1 ? 14 : 40, Math.min(100, 24 * c.s * q.k));
          return { transform: `translate(${(q.x - w / 2).toFixed(1)}px,${(q.y - w * (S.monAh || 0.92)).toFixed(1)}px) scale(${(w / MB).toFixed(4)})`, offset: i / INTRO_SAMPLES }; });
        run(mon, kf);
      }
      run(title, [{ opacity: 1, offset: 0 }, { opacity: 0, offset: 0.45 }, { opacity: 0, offset: 1 }]);
      it.anims = anims; it.resized = resized; S.introResized = resized.length; it.end = now + (can ? dur : 0); S.introAnims = anims.length; it.final = Object.assign({}, cams[INTRO_SAMPLES]);   // 道筋の終点（寄り終わりはここから通常の追従へ＝途中で注視点が変わっても飛ばない）
    }
    /** 寄り終わり：最後の姿を通常の描画で置いてからアニメーションを外す（1フレームも飛ばない） */
    function finishIntro(it) {
      const done = it.done; S.intro = null;
      for (const [el, base] of it.resized || []) el.style.width = base + 'px';   // 寄る間だけ縮めた幅を決まった base へ戻す（下の apply と同じ処理の中＝1フレームも縮んだまま見えない）
      S.cam = Object.assign({}, it.final || it.to()); S.cam.P = o.persp; S.sig = ''; S.dirty = true; title.style.opacity = '0';   // 2026-10-13 開発28：keyframe の終点そのもの（動いている間に目標＝fitZoom が少し変わっていても、ここで飛ばず通常の追従で寄る）
      apply();
      for (const a of it.anims || []) { try { a.cancel(); } catch (e) {} }
      wrap.classList.remove('intro'); rootEl.classList.remove('rfw-intro');
      if (done) done();
    }
    // 2026-10-16 QA C案カメラ（?qaCam=c|ccut のときだけ）。従来（CMODE が null）はここを通らない
    let dimEl = null;
    function dim(on) {
      if (!dimEl) { dimEl = doc.createElement('div'); dimEl.className = 'rfw-qadim'; Object.assign(dimEl.style, { position: 'absolute', inset: '0', background: '#06101f', opacity: '0', pointerEvents: 'none', zIndex: '99999', transition: 'opacity .14s ease' }); wrap.appendChild(dimEl); }
      dimEl.style.opacity = on ? '0.5' : '0';
    }
    function camC(info, n, pts, instant) {
      const mh = hOf(info.node), moving = !!info.moving;
      let want = null;
      if (pts.length) { const k = pts.slice(0, 4), gx = k.reduce((a, p) => a + p[0], 0) / k.length - n[0], gy = k.reduce((a, p) => a + p[1], 0) / k.length - n[1]; if (Math.hypot(gx, gy) > 2) want = headingYaw(gx, gy); }
      if (!S.cInit) { if (want != null) S.yawGoal = want; S.cInit = true; }
      else if (!moving) {
        if (S.cStop !== info.node) { S.cStop = info.node; S.qa.stops++; }
        const d = want == null ? 0 : angDiff(S.yawGoal || 0, want);
        if (Math.abs(d) >= o.camTurnDeg || (info.pick && Math.abs(d) >= 20)) {   // 止まったとき＝ずれが大きいときだけ・分かれ道を選んだとき＝選んだ道へ
          S.yawGoal = (S.yawGoal || 0) + d; S.qa.reorient++;
          if (!instant && !S.intro) {
            const now = root.performance.now();
            if (CMODE === 'ccut') { dim(true); S.yawTw = { from: S.cam.yaw || 0, to: S.yawGoal, t0: now + 150, dur: 1, cut: true }; }
            else S.yawTw = { from: S.cam.yaw || 0, to: S.yawGoal, t0: now, dur: o.camTurnMs * Math.min(1.6, 0.6 + 0.4 * Math.abs(d) / 90) };   // 大きく向きを変えるほど少し長く（90°＝camTurnMs・180°＝1.4倍）＝速さの山を抑える
          }
        }
      }
      const g = followCam(S.view, n[0], n[1], pts, S.yawGoal || 0, mh), prev = S.goal;
      if (moving && prev) {   // 歩いている間：向き・横の寄せ・倍率を止めたときのまま（足りなければ引くだけ。寄らない）
        if (S.camOff) { g.tx = n[0] + S.camOff[0]; g.ty = n[1] + S.camOff[1]; }
        g.s = Math.min(prev.s, g.s);
      } else {
        S.camOff = [g.tx - n[0], g.ty - n[1]];
        if (prev && !instant && !S.yawTw && Math.abs(g.ax - prev.ax) < 1 && Math.abs(g.ay - prev.ay) < 1 && Math.abs(angDiff(prev.yaw || 0, g.yaw || 0)) < 0.01 && Math.abs(Math.log(g.s / prev.s)) < 0.06) {   // 止まったときの小さなずれは追わない（漂わない）
          const a = project(prev, g.tx, g.ty); if (Math.hypot(a.x - prev.ax, a.y - prev.ay) < o.camDz) { S.camOff = [prev.tx - n[0], prev.ty - n[1]]; return; }
        }
      }
      S.goal = g;
    }
    function tick(now) {
      if (S.dead) return;
      if (!wrap.isConnected) { S.last = 0; S.raf = root.requestAnimationFrame(tick); return; }   // 2026-10-11：本編で別の画面へ移っている間（要素は残して戻ったら付け直す）は何もしない
      const dt = S.last ? Math.min(64, now - S.last) : 16; S.last = now;
      if (S.frames.length < 600) S.frames.push(dt);
      S.view = viewRect();
      if (S.intro) {
        // 2026-10-13 開発28（全景 → START へ寄るカメラのカクつき）：寄る動きは Web Animations（合成スレッド）で1回だけ作る。
        //  旧：毎フレーム JS でカメラを進めて約600要素の transform を書き換えていた＝倍率が2倍ごとに変わるたびに全要素と地面の区画をラスタし直す波（66〜91ms のフレーム）。
        //  新：止めて見せる（hold）→ 全要素の道筋（keyframe）を一度に作って同じ時間軸で動かす → 終わったら通常の追従へ（計算は同じ project＝同じ道筋・同じ緩急）
        const it = S.intro;
        if (!painted && o.art && now - it.t0 < 3000) it.hold = now + it.holdMs;   // 区画を描き終えるまで俯瞰を止めておく（最大3秒）
        if (now < it.hold) { S.cam = Object.assign({}, it.from); }
        else if (!it.anims) startIntroAnims(it, now);
        if (it.anims) {   // 動いている間は合成スレッドに任せる（描き直さない）
          // 2026-10-13 開発28：終わりはアニメーションそのもので見る（約300個を作る間に開始時刻が1〜数フレーム遅れる＝時計で切ると終点の手前で止めて最後の姿へ飛んでいた）。時計は保険（+600ms）
          const a0 = it.anims[0], ct = a0 && a0.currentTime, over = !a0 || a0.playState === 'finished' || a0.playState === 'idle' || (typeof ct === 'number' && ct >= it.dur - 0.5) || now >= it.end + 600;
          if (over) finishIntro(it); else { S.raf = root.requestAnimationFrame(tick); return; }
        }
      } else if (S.goal) {
        const f = 1 - Math.exp(-dt / 170), g = S.goal;
        for (const k of ['tx', 'ty', 'ax', 'ay', 'tilt']) S.cam[k] = lerp(S.cam[k], g[k], f);
        const y0 = S.cam.yaw || 0;
        if (CMODE) {   // 2026-10-16 QA C案：向きは止まったとき・分かれ道を選んだときに決めた分だけ、決まった時間で回して止める（指数の長い尾を引かない）。緩急は smoothstep＝速さの山が平均の 1.5倍（二次の緩急は 2倍）
          const tw = S.yawTw;
          if (tw) { const u = Math.max(0, Math.min(1, (now - tw.t0) / tw.dur)); S.cam.yaw = tw.from + angDiff(tw.from, tw.to) * (u * u * (3 - 2 * u)); if (u >= 1) { S.cam.yaw = tw.to; S.yawTw = null; if (tw.cut) dim(false); } }
          else S.cam.yaw = g.yaw || 0;
        } else if (o.heading) { const d = angDiff(S.cam.yaw || 0, g.yaw || 0); S.cam.yaw = Math.abs(d) < 0.05 ? (g.yaw || 0) : (S.cam.yaw || 0) + d * (1 - Math.exp(-dt / o.yawTau)); }   // 2026-10-14 開発29（6）：近いほうへなめらかに回る
        S.cam.s = Math.exp(lerp(Math.log(S.cam.s), Math.log(g.s), (1 - Math.exp(-dt / o.zoomTau)) * 0.8));
        { const q = S.qa, dy = Math.abs(angDiff(y0, S.cam.yaw || 0)), rate = dy / Math.max(1, dt) * 1000;   // 計測だけ（2°/秒より速く回っている時間）
          q.deg += dy; const on = rate > 2; if (on) { q.ms += dt; if (!q.rot) q.turns++; if (rate > q.maxRate) q.maxRate = rate; } q.rot = on; }
      }
      if (S.monGoal) { if (!S.mon) S.mon = S.monGoal.slice(); const f = 1 - Math.exp(-dt / 70); S.mon[0] = lerp(S.mon[0], S.monGoal[0], f); S.mon[1] = lerp(S.mon[1], S.monGoal[1], f); S.mon[2] = lerp(S.mon[2] || 0, S.monGoal[2] || 0, f); }
      apply();
      if (HI && !S.intro && artDone && painted) HI.tick();   // 2026-10-16 QA（A）：近くの高い解像度の区画（数フレームに分けて描く）
      S.raf = root.requestAnimationFrame(tick);
    }
    const api = {
      el: wrap,
      /** 今の地点・先の地点・マスの見た目を渡す（roadfirst-view の render／cam から呼ぶ）。instant＝すぐ合わせる */
      update(info, instant) {
        const n = D.nodes[info.node]; if (!n) return;
        S.monGoal = [n[0], n[1], hOf(info.node)]; if (instant || !S.mon) S.mon = S.monGoal.slice();
        S.view = viewRect();
        const pts = (info.ahead || []).filter((id) => D.nodes[id]).map((id) => [D.nodes[id][0], D.nodes[id][1], hOf(id)]);
        if (CMODE) camC(info, n, pts, instant);
        else {
        if (o.heading && pts.length) {   // 2026-10-14 開発29（6）：進む向き＝今の地点 → 先の地点（最大4つ）の重心（分かれ道の手前は両方の道の真ん中・行き止まりから戻る間は戻る向き）
          const k = pts.slice(0, 4), gx = k.reduce((a, p) => a + p[0], 0) / k.length - n[0], gy = k.reduce((a, p) => a + p[1], 0) / k.length - n[1];
          if (Math.hypot(gx, gy) > 2) { const y0 = headingYaw(gx, gy); S.yawGoal = (S.yawGoal || 0) + angDiff(S.yawGoal || 0, y0); }
        }
        S.goal = followCam(S.view, n[0], n[1], pts, o.heading ? S.yawGoal : 0, hOf(info.node));
        }
        S.lastAhead = info.ahead || [];
        if (instant && !S.intro) S.cam = Object.assign({}, S.goal);
        S.dirty = true;
        if ('denOpen' in info) for (const p of props) if (p.L && p.L.open) { const f = info.denOpen ? p.L.open : p.L.file; if (p.f !== f) { p.el.src = artUrl(o.art.base || './assets/proto/board_art_1010/', f); p.f = f; } }
        const foc = o.focus ? new Set(info.focus || [info.node].concat(info.ahead || [])) : null;
        if (foc) paintVeil([...foc]);
        if (info.look || foc) for (const [id, t] of Object.entries(tiles)) {
          if (foc) { const far = !foc.has(id); if (far !== t.far) { t.el.classList.toggle('far', far); t.far = far; } }
          if (!info.look) continue;
          const L = info.look(id) || {}; if (L.src && L.src !== t.src) { t.img.src = L.src; t.src = L.src; }
          const m = L.mark || ''; if (m !== t.mk) { t.lab.textContent = m; t.mk = m; }
          const u = !!L.used; if (u !== t.used) { t.el.classList.toggle('used', u); t.used = u; }
          const k = L.k || 1; if (k !== (t.k || 1)) { t.k = k; t.el.classList.toggle('big', k > 1); S.dirty = true; }
          const c = info.node === id; if (c !== t.cur) { t.el.classList.toggle('cur', c); t.cur = c; }
        }
      },
      /** 開始の俯瞰 → START へ寄りながら傾ける。終わったら done */
      intro(done, opt) {
        const v = viewRect(); S.view = v; const from = overviewCam(v);
        if (S.goal) { const g = S.goal; from.tx += (g.ax - from.ax) / from.s; from.ty += (g.ay - from.ay) / from.s; from.ax = g.ax; from.ay = g.ay; }   // 注視点の画面の位置は最初から到着地のもの（傾き 0 の全景では見え方は同じ）＝寄る間に perspective-origin を変えない
        S.cam = Object.assign({}, from);
        const now = root.performance.now(), hold = (opt && opt.hold) ?? 1500, dur = (opt && opt.dur) ?? 1600;
        wrap.classList.add('intro'); rootEl.classList.add('rfw-intro'); title.style.opacity = '1';
        S.intro = { from, to: () => S.goal || from, t0: now, hold: now + hold, holdMs: hold, dur, done, anims: null, end: 0 };
      },
      skipIntro() { if (S.intro) { const it = S.intro; if (it.anims) finishIntro(it); else { const d = it.done; S.intro = null; wrap.classList.remove('intro'); rootEl.classList.remove('rfw-intro'); title.style.opacity = '0'; if (S.goal) S.cam = Object.assign({}, S.goal); if (d) d(); } } },
      inIntro: () => !!S.intro,
      /** 2026-10-12 開発21（C-3〜6）：描き終わったか＝絵の読み込み・地面と道の全区画・景物とマスの絵のデコードが終わった。Promise は true で解決（壊れたら false） */
      ready() {
        const imgs = () => [...bb.querySelectorAll('img')].filter((i) => i.getAttribute('src'));
        return new Promise((res) => {
          const chk = () => { if (S.dead) return res(false); if (!artDone || !painted) return root.requestAnimationFrame(chk);
            Promise.all(imgs().map((i) => (i.complete ? (i.decode ? i.decode().catch(() => {}) : null) : new Promise((r) => { i.addEventListener('load', r, { once: true }); i.addEventListener('error', r, { once: true }); })))).then(() => res(!S.dead)); };
          chk(); });
      },
      isReady: () => artDone && painted,
      /** 2026-10-11：地点の上に浮かぶ目印（レアの紋章など）。w＝世界の幅・min／max＝画面の画素の下限・上限（全景でも見える大きさ）。地面・道は描き直さない */
      marker(id, src, opt = {}) {
        const n = D.nodes[id]; if (!n) return null;
        let p = props.find((x) => x.mark === id);
        if (!p) { const d = doc.createElement('img'); d.className = 'rfw-prop rfw-mark' + (opt.cls ? ' ' + opt.cls : ''); d.alt = ''; d.draggable = false; d.decoding = 'async'; bb.appendChild(d); p = { el: d, x: n[0], y: n[1], mark: id }; props.push(p); }
        p.el.src = src; p.w = opt.w || 46; p.min = opt.min || 0; p.max = opt.max || 0; p.ah = opt.ah || 1.6; p.z = opt.z == null ? 60 : opt.z; p.el.dataset.node = id;
        p.base = 0; p.zi = null;   // 2026-10-13 開発28：決まった幅と前後の順は次の描画で決め直す（絵・大きさ・z が変わる）
        S.dirty = true; return p.el;
      },
      markerDim(id, dim) { const p = props.find((x) => x.mark === id); if (p) p.el.classList.toggle('dim', !!dim); },
      markerOff(id) { const i = props.findIndex((x) => x.mark === id); if (i >= 0) { props[i].el.remove(); props.splice(i, 1); } },
      goalApproach: () => apprIds.slice(),   // 2026-10-15 N10（確認用）
      yawGoal: () => (o.heading ? S.yawGoal || 0 : 0),
      /** 2026-10-16 QA：向きの回り方の計測（reset＝0 に戻す）。camMode＝C案のときの方式（null＝従来） */
      qa: (reset) => { const q = Object.assign({ camMode: CMODE }, S.qa); delete q.rot; if (reset) Object.assign(S.qa, { deg: 0, ms: 0, turns: 0, rot: false, maxRate: 0, stops: 0, reorient: 0 }); return q; },
      state: () => ({ yaw: S.cam.yaw || 0, yawGoal: S.yawGoal || 0, heading: !!o.heading, focus: o.focus ? veilSig.split(',').filter(Boolean) : null, cam: Object.assign({}, S.cam), goal: S.goal && Object.assign({}, S.goal), mon: S.mon && S.mon.slice(), view: S.view, intro: !!S.intro, introAnims: S.introAnims || 0, introResized: S.introResized || 0, ahead: S.lastAhead || [],
        visual: VIS.key, skin: SK ? SK.key : null, artSkin: art.ground ? { ground: !!art.ground._sk, road: !!(art.road && art.road._sk), strip: !!(art.strip && art.strip._sk), water: !!(art.water && art.water._sk) } : null, tiles: Object.keys(tiles).length, chunks: chunks.length, painted, res: o.res, tilt: o.tilt, props: props.length, art: !!(art.ground || art.road), rims: art.terrain ? art.terrain.rims.filter((r) => r.kind === 'valley').map((r) => r.pts.length) : null,
        rimKinds: art.terrain ? art.terrain.rims.reduce((a, r) => { a[r.kind] = (a[r.kind] || 0) + 1; return a; }, {}) : null }),
      project: (x, y) => project(S.cam, x, y),
      frames: (reset) => { const f = S.frames.slice(); if (reset) S.frames = []; return f; },
      destroy() { S.dead = true; root.cancelAnimationFrame(S.raf); if (HI) HI.destroy(); wrap.remove(); },
      qaRoad: () => (HI ? { mode: o.qaRoad, res: HI.R, tiles: HI.count(), pending: HI.pending(), bytes: HI.bytes(), paintMs: HI.paintMs ? HI.paintMs() : null } : null),
      opts: o,
    };
    S.raf = root.requestAnimationFrame(tick);
    return api;
  }

  // 仮の地面（絵が届いたら A 群のテクスチャ・B 群の縁に替える）：草地の色＋小さなまだら（決まった乱数）
  // 2026-10-17 QA（道路画質）：絵が _ppu（px／世界の1単位）を持つときはそれで倍率を決める（js/qa/road-art-1017.js の新しい素材だけ。従来の絵は持たない＝従来どおり）
  function pattern(g, im, tile) { const p = g.createPattern(im, 'repeat'); if (p && p.setTransform && root.DOMMatrix) p.setTransform(new root.DOMMatrix().scale(im._ppu ? 1 / im._ppu : tile / im.width)); return p; }
  function drawGround(g, D, x0, y0, w, h, art) {
    if (art && art.ground) { g.fillStyle = pattern(g, art.ground, ART.ground.tile); g.fillRect(x0, y0, w, h); if (art.ground._qra && root.MMQRA) root.MMQRA.macro(g, x0, y0, w, h); return; }
    if (D.art && Array.isArray(D.art.regions)) return drawSeaBlockout(g, D, x0, y0, w, h);   // 2026-10-15 Chapter 2 の試作：絵なしのブロックアウト（海・陸・海底・ガラス回廊・塔・会場島の仮の色）
    g.fillStyle = '#86b65a'; g.fillRect(x0, y0, w, h);
    let a = ((Math.floor(x0) * 73856093) ^ (Math.floor(y0) * 19349663)) >>> 0;
    const rnd = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    for (let i = 0; i < (w * h) / 90; i++) { g.fillStyle = rnd() < 0.5 ? 'rgba(60,110,40,.22)' : 'rgba(180,220,120,.22)'; const r = 1 + rnd() * 3; g.beginPath(); g.arc(x0 + rnd() * w, y0 + rnd() * h, r, 0, 7); g.fill(); }
  }
  /** 2026-10-15 Chapter 2 A／B／C 設計案の限定試作：絵が無いので区域（D.art.regions）を仮の色で塗る＝素材待ちの開発表示（正式アートではない）。Chapter 1 のデータには regions が無い＝通らない */
  const SEA_COLOR = { land: '#d9cfa6', seabed: '#1f6fa6', glass: '#9fe3f2', tower: '#e6e8ee', arena: '#f1e3b8' };
  function drawSeaBlockout(g, D, x0, y0, w, h) {
    g.fillStyle = D.art.sea || '#2d8fc4'; g.fillRect(x0, y0, w, h);
    for (const r of D.art.regions) { g.fillStyle = SEA_COLOR[r.kind] || '#cccccc'; g.beginPath(); r.poly.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.fill();
      if (r.kind === 'glass') { g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 3; g.stroke(); } }
    g.fillStyle = 'rgba(0,0,0,.55)'; g.font = '13px sans-serif';
    for (const r of D.art.regions) { const x = r.poly.reduce((a, p) => a + p[0], 0) / r.poly.length, y = r.poly.reduce((a, p) => a + p[1], 0) / r.poly.length; if (x >= x0 - 60 && x <= x0 + w + 60 && y >= y0 - 20 && y <= y0 + h + 20) g.fillText('素材待ち：' + r.id, x - 40, y); }
  }
  // 道：原本の区間ごとに地点を通るなめらかな帯（絵が届いたら C 群の帯の模様を貼る）。分かれ目・合流は小広場、行き止まりは踊り場（D 群）
  function drawRoads(g, D, o, art, bx) {
    const segs = Object.values(D.segments);
    const path = (ids) => { const p = ids.map((id) => D.nodes[id]); g.beginPath(); g.moveTo(p[0][0], p[0][1]);
      for (let i = 0; i < p.length - 1; i++) { const a = p[i - 1] || p[i], b = p[i], c = p[i + 1], d = p[i + 2] || c;
        g.bezierCurveTo(b[0] + (c[0] - a[0]) / 6, b[1] + (c[1] - a[1]) / 6, c[0] - (d[0] - b[0]) / 6, c[1] - (d[1] - b[1]) / 6, c[0], c[1]); } };
    g.lineCap = 'round'; g.lineJoin = 'round';
    const out = {}, inn = {}; for (const e of D.edges) if (e[3] === 'forward') { out[e[0]] = (out[e[0]] || 0) + 1; inn[e[1]] = (inn[e[1]] || 0) + 1; }
    const hubs = Object.keys(D.nodes).filter((id) => (out[id] || 0) > 1 || (inn[id] || 0) > 1);
    const ends = Object.keys(D.nodes).filter((id) => /dead_end/.test(D.nodes[id][2]));
    const disc = (id, r) => { const n = D.nodes[id]; g.beginPath(); g.arc(n[0], n[1], r, 0, 7); g.fill(); };
    const rt = (art && art.roadTile) || ART.road.tile, rp = art && art.road ? pattern(g, art.road, rt) : null;
    // skin：敷石の円は円の中心に R の中央を合わせる（円は R の1枚より小さい＝くり返しのつなぎ目が円の中に入らない）
    const centre = (id) => { if (!art.discCenter || !rp || !rp.setTransform || !root.DOMMatrix) return; const n = D.nodes[id], rw = art.road._ppu ? art.road.width / art.road._ppu : rt; rp.setTransform(new root.DOMMatrix().translate(n[0] - rw / 2, n[1] - rw / 2).scale(rw / art.road.width)); g.fillStyle = rp; };
    const SKYB = !!(D.art && D.art.sky);   // 2026-10-18 Chapter 3：雲海の上の道は空の橋
    if (rp && !SKYB) { g.strokeStyle = 'rgba(40,52,20,.28)'; g.lineWidth = o.roadW + 9; for (const s of segs) { path(s[3]); g.stroke(); } }   // 草へ落ちる薄い影
    if (rp && art.strip) {   // 直線の石の道を道筋に沿って並べる（分かれ目・合流・行き止まりは敷石の円で覆う）
      if (art.terrain && SKYB) {   // 2026-10-18 Chapter 3：空の橋の影は遠くの雲海へ薄くやわらかく落ちる
        for (const [dy, lw, a] of [[22, ART.strip.w + 26, 0.05], [18, ART.strip.w + 14, 0.07], [15, ART.strip.w + 4, 0.08]]) { g.strokeStyle = `rgba(30,60,110,${a})`; g.lineWidth = lw;
          for (const s of segs) { g.save(); g.translate(0, dy); path(s[3]); g.stroke(); g.restore(); } }
      } else if (art.terrain) {   // 谷の上を渡る石橋：下へ落ちる影（高さに見せる）
        g.strokeStyle = 'rgba(10,20,30,.42)'; g.lineWidth = ART.strip.w + 2;
        for (const id of terrainOf(D).flatMap((T) => T.bridges)) { const s = D.segments[id]; if (!s) continue; g.save(); g.translate(0, 10); path(s[3]); g.stroke(); g.restore(); }
      }
      const QA = art.qaRoad && root.MMQAR, cps = QA ? segs.map((s) => curvePts(s[3].map((id) => D.nodes[id]))) : null;
      if (QA && art.qaRoad === '2') QA.edgeShade(g, cps, ART.strip.w);
      if (QA) for (const P of cps) QA.meshStrip(g, P, art.strip, ART.strip.w, bx);   // 2026-10-16 QA（A）：曲線に沿った網（曲がり角で折れない）
      else for (const s of segs) stripAlong(g, curvePts(s[3].map((id) => D.nodes[id])), art.strip, ART.strip.w, bx);
      // 2026-10-18 iPhone 試遊（分岐の灰色の輪がチープ）：灰色の塗りの輪をやめ、道の帯と同じ縁石を円に沿って並べた「円形の広場」にする。
      //  道が入ってくる所は縁石を切る（道の縁石と広場の縁石がつながる）・中は R の敷石・外側に草へ落ちる薄い影
      const dirs = plazaDirs(D, segs);
      for (const id of hubs) plaza(g, D.nodes[id], ART.strip.w * 0.8, dirs[id] || [], art.strip, rp, () => centre(id), bx);
      for (const id of ends) plaza(g, D.nodes[id], ART.strip.w * 0.7, dirs[id] || [], art.strip, rp, () => centre(id), bx);
      if (SKYB && art.terrain) skyRails(g, D, segs, art, bx);   // 2026-10-18 Chapter 3：雲海の上だけ白い欄干と支柱（橋に見せる）
      if (QA && art.qaRoad === '2') { QA.edgeGrass(g, cps, ART.strip.w, bx, 1016); QA.tileShadows(g, D, 11, bx); }   // 2026-10-16 QA（A 2）：ふちにかかる草・マスの足もとの影
      return;
    }
    g.strokeStyle = rp ? '#8f8573' : '#6f6248'; g.lineWidth = o.roadW + 4; for (const s of segs) { path(s[3]); g.stroke(); }
    g.fillStyle = rp ? '#8f8573' : '#6f6248'; for (const id of hubs) disc(id, o.roadW * 0.8 + 2); for (const id of ends) disc(id, o.roadW * 0.75 + 2);
    g.strokeStyle = rp || '#e7dcc0'; g.lineWidth = o.roadW; for (const s of segs) { path(s[3]); g.stroke(); }
    g.fillStyle = rp || '#ece3ca'; for (const id of hubs) disc(id, o.roadW * 0.8); for (const id of ends) disc(id, o.roadW * 0.75);
  }

  /** 谷の多角形（区間を順にたどる） */
  const POLY_CACHE = new Map();
  function loopPoly(D, T) {
    if (T.poly) { if (!POLY_CACHE.has(T)) POLY_CACHE.set(T, wobble(T.poly, T.wobble || 0, T.id)); return POLY_CACHE.get(T); }
    const out = []; for (const [id, rev] of T.loop) { const s = D.segments[id]; if (!s) continue; const ns = s[3].map((n) => D.nodes[n]); (rev ? ns.slice().reverse() : ns).forEach((p) => out.push([p[0], p[1]])); }
    return out;
  }
  /** 多角形の辺を細かく分けて、決まった揺らぎ（いくつかの正弦の和）で外へ内へずらす＝森のふちを自然な形に。世界の端の上の点は動かさない */
  function wobble(poly, amp, seed) {
    if (!amp) return poly; let h = 0; for (const c of String(seed)) h = (h * 31 + c.charCodeAt(0)) % 997;
    const out = [], n = poly.length; let u = 0;
    for (let i = 0; i < n; i++) { const a = poly[i], b = poly[(i + 1) % n], L = Math.hypot(b[0] - a[0], b[1] - a[1]), k = Math.max(1, Math.round(L / 8)), nx = -(b[1] - a[1]) / (L || 1), ny = (b[0] - a[0]) / (L || 1);
      for (let j = 0; j < k; j++) { const t = j / k, x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t, e = x <= 0 || y >= WORLD.h || x >= WORLD.w || y <= 0;
        const w = e ? 0 : amp * (0.55 * Math.sin(u / 23 + h) + 0.3 * Math.sin(u / 9.7 + h * 1.7) + 0.15 * Math.sin(u / 4.1 + h * 0.3)); out.push([x + nx * w, y + ny * w]); u += L / k; } }
    return out;
  }
  function inPoly(poly, x, y) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
  function distLine(line, x, y) { let m = 1e9; for (let i = 0; i < line.length - 1; i++) { const a = line[i], b = line[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1; const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / L)); m = Math.min(m, Math.hypot(a[0] + dx * t - x, a[1] + dy * t - y)); } return m; }
  /** その点が谷か（純粋な関数＝景物の置き場所・テスト用。道のまわり ROAD_LAND は陸。石橋の区間のまわりは谷のまま） */
  function inValley(D, x, y) {
    const TR = terrainOf(D), segs = Object.entries(D.segments), bridges = new Set(TR.flatMap((T) => T.bridges));
    const IS = D.art && D.art.islands;   // 2026-10-18 Chapter 3：浮島の上は陸（雲海ではない）
    for (const T of TR) {
      const hit = inPoly(loopPoly(D, T), x, y) || T.arms.some((A) => distLine(A.line, x, y) <= A.w / 2);
      if (!hit) continue;
      if (IS && T.kind === 'cloud' && IS.some((P) => inPoly(P, x, y))) continue;
      const nearRoad = segs.some(([id, s]) => !bridges.has(id) && distLine(s[3].map((n) => D.nodes[n]), x, y) < ROAD_LAND);
      if (!nearRoad) return T.id;
    }
    return null;
  }
  /** 谷・雲海・森と水の範囲の画像（世界の1単位＝1px。区画ごとに切り抜きに使う）と、ふちの線（帯を並べる） */
  function terrainMasks(doc, D, o) {
    const mk = () => { const c = doc.createElement('canvas'); c.width = WORLD.w; c.height = WORLD.h; return c; };
    const M = { valley: mk(), cloud: mk(), forest: mk() }, water = mk(), wg = water.getContext('2d');
    const TR = terrainOf(D), bridges = new Set(TR.flatMap((T) => T.bridges));
    for (const T of TR) { const g = M[T.kind || 'valley'].getContext('2d'); g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.lineCap = g.lineJoin = 'round';
      const P = loopPoly(D, T); g.beginPath(); P.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.fill();
      for (const A of T.arms) { g.lineWidth = A.w; g.beginPath(); A.line.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke(); } }
    for (const [kind, cv] of Object.entries(M)) {   // 道のまわりは陸（谷だけ石橋の区間は谷の上を渡る）
      const g = cv.getContext('2d'); g.globalCompositeOperation = 'destination-out'; g.lineCap = g.lineJoin = 'round'; g.lineWidth = ROAD_LAND * 2;
      const SKYB = !!(D.art && D.art.sky);   // 2026-10-18 Chapter 3：雲海の上の道はすべて空の橋（道のまわりを陸にしない）。浮島（D.art.islands）だけが陸
      if (SKYB && kind === 'cloud') { g.fillStyle = '#000'; for (const P of D.art.islands || []) { g.beginPath(); P.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.fill(); } }
      for (const [id, s] of Object.entries(D.segments)) { if ((kind === 'valley' || (SKYB && kind === 'cloud')) && bridges.has(id)) continue; const P = curvePts(s[3].map((n) => D.nodes[n])); g.beginPath(); P.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke(); }
      if (kind !== 'valley') {   // 雲海・森：目印（石像・祭壇など）のまわりは岩棚・空き地にする。森は谷にかからない
        g.fillStyle = '#000'; for (const L of lmOf(D)) { const at = landmarkAt(D, L); if (at) { g.beginPath(); g.arc(at[0], at[1] - L.w * 0.18, L.w * 0.62, 0, 7); g.fill(); } }
        if (kind === 'forest') g.drawImage(M.valley, 0, 0);
      }
    }
    wg.strokeStyle = '#fff'; wg.lineCap = wg.lineJoin = 'round';
    for (const T of TR) for (const A of T.water || []) { wg.lineWidth = A.w; wg.beginPath(); A.line.forEach((p, i) => (i ? wg.lineTo(p[0], p[1]) : wg.moveTo(p[0], p[1]))); wg.stroke(); }
    wg.globalCompositeOperation = 'destination-in'; wg.drawImage(M.valley, 0, 0);
    const edgeAt = (kind) => (p) => { const T = TR.filter((t) => (t.kind || 'valley') === kind).find((t) => inPoly(loopPoly(D, t), p[0], p[1]) || t.arms.some((A) => distLine(A.line, p[0], p[1]) < A.w)); return T ? T.edge : kind === 'valley' ? ((TR.find((t) => (t.kind || 'valley') === 'valley') || TERRAIN[0]).edge) : kind; };
    const rims = [...rimsOf(M.valley, edgeAt('valley'), 'valley'), ...rimsOf(water, () => 'shore', 'water'), ...rimsOf(M.cloud, edgeAt('cloud'), 'cloud'), ...rimsOf(M.forest, edgeAt('forest'), 'forest')];
    return { valley: M.valley, cloud: M.cloud, forest: M.forest, water, rims };
  }
  /** 範囲の画像の輪郭（3単位の格子の marching squares → つないで → なめらかに）。範囲は進む向きの右側（帯の絵の上＝左＝外側） */
  function rimsOf(cv, edgeOf, kind) {
    const a = cv.getContext('2d').getImageData(0, 0, WORLD.w, WORLD.h).data, step = 3, nx = Math.ceil(WORLD.w / step) + 1, ny = Math.ceil(WORLD.h / step) + 1;
    const inside = (i, j) => { const x = Math.min(WORLD.w - 1, i * step), y = Math.min(WORLD.h - 1, j * step); return a[(y * WORLD.w + x) * 4 + 3] > 127; };
    const edges = [];
    for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
      const tl = inside(i, j), tr = inside(i + 1, j), br = inside(i + 1, j + 1), bl = inside(i, j + 1);
      const k = (tl ? 8 : 0) | (tr ? 4 : 0) | (br ? 2 : 0) | (bl ? 1 : 0); if (k === 0 || k === 15) continue;
      const T = [(i + 0.5) * step, j * step], R = [(i + 1) * step, (j + 0.5) * step], B = [(i + 0.5) * step, (j + 1) * step], L = [i * step, (j + 0.5) * step];
      const map = { 1: [[L, B]], 2: [[B, R]], 3: [[L, R]], 4: [[R, T]], 5: [[L, T], [R, B]], 6: [[B, T]], 7: [[L, T]], 8: [[T, L]], 9: [[T, B]], 10: [[T, R], [B, L]], 11: [[T, R]], 12: [[R, L]], 13: [[R, B]], 14: [[B, L]] };
      for (const e of map[k]) edges.push(e);
    }
    // 端の点でつなぐ（向きは問わない＝両方向へ伸ばす。向きはあとで範囲の側からそろえる）
    const key = (p) => p[0] + ',' + p[1], at = new Map();
    edges.forEach((e, i) => { for (const p of e) { const k = key(p); if (!at.has(k)) at.set(k, []); at.get(k).push(i); } });
    const used = new Set(), lines = [];
    const grow = (ln, tail) => { for (;;) { const k = key(tail ? ln[ln.length - 1] : ln[0]); const n = (at.get(k) || []).find((j) => !used.has(j)); if (n === undefined) return;
      used.add(n); const e = edges[n], nx = key(e[0]) === k ? e[1] : e[0]; if (tail) ln.push(nx); else ln.unshift(nx); } };
    for (let i = 0; i < edges.length; i++) { if (used.has(i)) continue; used.add(i); const ln = [edges[i][0], edges[i][1]]; grow(ln, true); grow(ln, false); if (ln.length > 6) lines.push(ln); }
    const inAt = (x, y) => x >= 0 && y >= 0 && x < WORLD.w && y < WORLD.h && a[((y | 0) * WORLD.w + (x | 0)) * 4 + 3] > 127;
    const smooth = (p) => { for (let it = 0; it < 3; it++) { const q = [p[0]]; for (let i = 0; i < p.length - 1; i++) { const A = p[i], B = p[i + 1]; q.push([A[0] * 0.75 + B[0] * 0.25, A[1] * 0.75 + B[1] * 0.25], [A[0] * 0.25 + B[0] * 0.75, A[1] * 0.25 + B[1] * 0.75]); } q.push(p[p.length - 1]); p = q; } return p; };
    return lines.map((ln) => {
      let vote = 0; for (let i = 0; i < ln.length - 1; i += 3) { const A = ln[i], B = ln[i + 1], dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) || 1, mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2;
        vote += inAt(mx - dy / L * 4, my + dx / L * 4) ? 1 : -1; }   // 右側（y が下向き）＝(-dy, dx)
      const p = vote >= 0 ? ln : ln.slice().reverse();
      return { pts: resample(smooth(p), 2.5), edge: edgeOf(p[0]), kind };
    });
  }
  /** 点の列をおよそ同じ間隔（d 単位）に間引く */
  function resample(p, d) { const out = [p[0]]; let acc = 0; for (let i = 1; i < p.length; i++) { acc += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); if (acc >= d || i === p.length - 1) { out.push(p[i]); acc = 0; } } return out; }
  let TMP = null;
  /** 谷（谷底の絵・水・岸）・崖のふち・雲海・森を描く。どの範囲にもかからない区画は何もしない・区画の外の帯は描かない */
  function drawTerrain(g, D, o, art, bx) {
    const m = art && art.terrain; if (!m) return;
    if (!m.bbox) { const xs = m.rims.flatMap((r) => r.pts.map((q) => q[0])), ys = m.rims.flatMap((r) => r.pts.map((q) => q[1])); m.bbox = [Math.min(...xs) - 30, Math.min(...ys) - 30, Math.max(...xs) + 30, Math.max(...ys) + 30]; }
    if (bx[0] > m.bbox[2] || bx[0] + bx[2] < m.bbox[0] || bx[1] > m.bbox[3] || bx[1] + bx[3] < m.bbox[1]) return;
    if (!TMP) TMP = g.canvas.ownerDocument.createElement('canvas');
    const tmp = TMP; if (tmp.width !== g.canvas.width || tmp.height !== g.canvas.height) { tmp.width = g.canvas.width; tmp.height = g.canvas.height; }
    const tg = tmp.getContext('2d'); tg.setTransform(g.getTransform());
    const sx = Math.max(0, Math.floor(bx[0])), sy = Math.max(0, Math.floor(bx[1])), sw = Math.min(WORLD.w, Math.ceil(bx[0] + bx[2])) - sx, sh = Math.min(WORLD.h, Math.ceil(bx[1] + bx[3])) - sy;
    const clip = (mask) => { tg.globalCompositeOperation = 'destination-in'; if (sw > 0 && sh > 0) tg.drawImage(mask, sx, sy, sw, sh, sx, sy, sw, sh); g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(tmp, 0, 0); g.restore(); };
    const layer = (im, tile, mask) => { if (!im) return; tg.globalCompositeOperation = 'source-over'; tg.clearRect(bx[0], bx[1], bx[2], bx[3]); tg.fillStyle = pattern(tg, im, tile); tg.fillRect(bx[0], bx[1], bx[2], bx[3]); clip(mask); };
    const edgesOf = (kind) => { for (const r of m.rims) { if (r.kind !== kind) continue; const E = art.edges && art.edges[r.edge], C = ART.terrain.edges[r.edge]; if (E && C) stripAlong(g, C.flip ? r.pts.slice().reverse() : r.pts, E, C.w, bx, C.shift); } };
    layer(art.valley, ART.terrain.valley.tile, m.valley);
    if (art.water) { layer(art.water, ART.terrain.water.tile, m.water); edgesOf('water'); }   // 川の岸（B2）も谷の暗さの下に入れる
    // 深さ：谷全体を少し暗く＋ふちの内側に崖の影（谷の範囲で切り抜く）
    tg.globalCompositeOperation = 'source-over'; tg.clearRect(bx[0], bx[1], bx[2], bx[3]);
    tg.fillStyle = `rgba(8,26,38,${ART.terrain.depth})`; tg.fillRect(bx[0], bx[1], bx[2], bx[3]);
    tg.lineJoin = tg.lineCap = 'round';
    for (const [lw, a] of [[46, 0.22], [26, 0.28]]) { tg.strokeStyle = `rgba(4,14,22,${a})`; tg.lineWidth = lw;
      for (const r of m.rims) { if (r.kind !== 'valley') continue; tg.beginPath(); r.pts.forEach((q, i) => (i ? tg.lineTo(q[0], q[1]) : tg.moveTo(q[0], q[1]))); tg.stroke(); } }
    clip(m.valley);
    edgesOf('valley');
    layer(art.cloud, ART.terrain.cloud.tile, m.cloud);
    if (D.art && D.art.sky) {   // 2026-10-18 Chapter 3：浮島のまわりの雲に落ちる影（島が浮いて見える）・雲海の明暗（くり返しを目立たなくする）
      tg.globalCompositeOperation = 'source-over'; tg.clearRect(bx[0], bx[1], bx[2], bx[3]); tg.lineJoin = tg.lineCap = 'round';
      for (const [lw, a] of [[70, 0.035], [56, 0.04], [44, 0.045], [32, 0.05], [22, 0.055], [12, 0.06]]) { tg.strokeStyle = `rgba(40,70,120,${a})`; tg.lineWidth = lw;
        for (const r of m.rims) { if (r.kind !== 'cloud') continue; if (!r.bb) { const xs = r.pts.map((q) => q[0]), ys = r.pts.map((q) => q[1]); r.bb = [Math.min(...xs) - 40, Math.min(...ys) - 40, Math.max(...xs) + 40, Math.max(...ys) + 46]; }
          if (r.bb[2] < bx[0] || r.bb[0] > bx[0] + bx[2] || r.bb[3] < bx[1] || r.bb[1] > bx[1] + bx[3]) continue;   // 区画にかからない輪郭は描かない（空の世界は輪郭が多い）
          tg.beginPath(); r.pts.forEach((q, i) => (i ? tg.lineTo(q[0], q[1] + 6) : tg.moveTo(q[0], q[1] + 6))); tg.stroke(); } }
      clip(m.cloud);
      if (root.MMQRA && root.MMQRA.macro) root.MMQRA.macro(g, bx[0], bx[1], bx[2], bx[3]);
    }
    edgesOf('cloud');
    if (art.canopy) layer(art.canopy.cv, art.canopy.tile, m.forest); edgesOf('forest');
  }
  /** 森の樹冠のくり返し（B3 の帯を段に重ねる。横は帯のくり返し・縦は段の間隔でつながる） */
  function canopyTile(doc, im) {
    const C = ART.terrain.edges.forest, ppu = im.height / C.w, step = Math.round(ART.terrain.canopy.row * ppu), rows = 4, H = step * rows;
    const cv = doc.createElement('canvas'); cv.width = im.width; cv.height = H; const g = cv.getContext('2d');
    g.fillStyle = '#2f5a24'; g.fillRect(0, 0, im.width, H);   // 樹冠のすき間＝暗い森の床
    // 上の段から下の段へ（下の段が上の段の影を隠す）。くり返しの継ぎ目をまたぐ写しは先に描く
    const row = (k, dy) => { const x = Math.round((k % rows) * im.width * 0.37) % im.width; for (const xx of [x, x - im.width]) g.drawImage(im, xx, k * step - im.height / 2 + dy); };
    for (let k = 0; k <= rows; k++) row(k, -H);
    for (let k = 0; k <= rows; k++) row(k, 0);
    return { cv, tile: im.width / ppu };
  }
  /** 地点を通るなめらかな線（drawRoads の path と同じ曲線）を細かい点の列に */
  function curvePts(p) {
    const out = [p[0]];
    for (let i = 0; i < p.length - 1; i++) { const a = p[i - 1] || p[i], b = p[i], c = p[i + 1], d = p[i + 2] || c;
      const c1 = [b[0] + (c[0] - a[0]) / 6, b[1] + (c[1] - a[1]) / 6], c2 = [c[0] - (d[0] - b[0]) / 6, c[1] - (d[1] - b[1]) / 6];
      const n = Math.max(2, Math.ceil(Math.hypot(c[0] - b[0], c[1] - b[1]) / 1.5));
      for (let k = 1; k <= n; k++) { const t = k / n, u = 1 - t;
        out.push([u * u * u * b[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * c[0], u * u * u * b[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * c[1]]); } }
    return out;
  }
  /** 2026-10-18 Chapter 3：空の橋の欄干（道の両ふちの白い手すりと支柱）。雲海の上だけ（浮島の上は描かない＝雲海の範囲の画像で切り抜く） */
  let RAIL_TMP = null;
  function skyRails(g, D, segs, art, bx) {
    const m = art.terrain; if (!m || !m.cloud) return;
    if (!RAIL_TMP) RAIL_TMP = g.canvas.ownerDocument.createElement('canvas');
    const tmp = RAIL_TMP; if (tmp.width !== g.canvas.width || tmp.height !== g.canvas.height) { tmp.width = g.canvas.width; tmp.height = g.canvas.height; }
    const tg = tmp.getContext('2d'); tg.setTransform(g.getTransform()); tg.globalCompositeOperation = 'source-over'; tg.clearRect(bx[0] - 2, bx[1] - 2, bx[2] + 4, bx[3] + 4);
    const off = ART.strip.w / 2 + 0.6;
    for (const sg of segs) {
      const P = curvePts(sg[3].map((id) => D.nodes[id])); if (bx && !P.some((q) => q[0] > bx[0] - 30 && q[0] < bx[0] + bx[2] + 30 && q[1] > bx[1] - 30 && q[1] < bx[1] + bx[3] + 30)) continue;
      for (const sd of [-1, 1]) {
        const L = P.map((q, i) => { const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], k = Math.hypot(dx, dy) || 1; return [q[0] - dy / k * off * sd, q[1] + dx / k * off * sd]; });
        const line = (w, c, dy) => { tg.strokeStyle = c; tg.lineWidth = w; tg.beginPath(); L.forEach((q, i) => (i ? tg.lineTo(q[0], q[1] + dy) : tg.moveTo(q[0], q[1] + dy))); tg.stroke(); };
        tg.lineCap = tg.lineJoin = 'round';
        line(2.6, 'rgba(60,70,92,.45)', 0.9); line(1.7, '#f6f1e3', 0); line(0.55, 'rgba(214,176,92,.9)', -0.35);   // 手すり（影・白・金の細い縁）
        let acc = 0; for (let i = 1; i < L.length; i++) { acc += Math.hypot(L[i][0] - L[i - 1][0], L[i][1] - L[i - 1][1]); if (acc < 7.5) continue; acc = 0;   // 支柱
          tg.fillStyle = 'rgba(60,70,92,.5)'; tg.beginPath(); tg.arc(L[i][0], L[i][1] + 0.8, 1.35, 0, 7); tg.fill();
          tg.fillStyle = '#fbf7ea'; tg.beginPath(); tg.arc(L[i][0], L[i][1], 1.05, 0, 7); tg.fill(); }
      }
    }
    const sx = Math.max(0, Math.floor(bx[0])), sy = Math.max(0, Math.floor(bx[1])), sw = Math.min(WORLD.w, Math.ceil(bx[0] + bx[2])) - sx, sh = Math.min(WORLD.h, Math.ceil(bx[1] + bx[3])) - sy;
    tg.globalCompositeOperation = 'destination-in'; if (sw > 0 && sh > 0) tg.drawImage(m.cloud, sx, sy, sw, sh, sx, sy, sw, sh);
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(tmp, 0, 0); g.restore();
  }
  /** 2026-10-18：地点に入ってくる道の向き（地点 → 道の先の点・ラジアン）。区間の始点と終点だけ */
  function plazaDirs(D, segs) {
    const out = {}, put = (id, a, b) => { (out[id] = out[id] || []).push(Math.atan2(b[1] - a[1], b[0] - a[0])); };
    for (const sg of segs) { const ids = sg[3]; if (!ids || ids.length < 2) continue; const P = curvePts(ids.map((id) => D.nodes[id])), at = (k) => P[Math.min(P.length - 1, Math.max(0, k))];
      put(ids[0], P[0], at(3)); put(ids[ids.length - 1], P[P.length - 1], at(P.length - 4)); }
    return out;
  }
  /** 2026-10-18：円形の広場（分かれ目・合流・行き止まり）。r＝縁石の外側の半径（単位）・dirs＝道が入ってくる向き・strip＝道の帯の絵（上の縁石の段を使う） */
  function plaza(g, n, r, dirs, strip, rp, centre, bx) {
    if (!n) return; const x = n[0], y = n[1];
    if (bx && (x + r + 6 < bx[0] || x - r - 6 > bx[0] + bx[2] || y + r + 6 < bx[1] || y - r - 6 > bx[1] + bx[3])) return;
    const CURB = 0.18, ppu = strip ? strip.height / ART.strip.w : 0, th = ART.strip.w * CURB, half = ART.strip.w / 2;
    // 外側の薄い影（草へ落ちる）
    const sh = g.createRadialGradient(x, y, r - 1, x, y, r + 4.5); sh.addColorStop(0, 'rgba(30,40,14,.34)'); sh.addColorStop(1, 'rgba(30,40,14,0)');
    g.fillStyle = sh; g.beginPath(); g.arc(x, y, r + 4.5, 0, 7); g.fill();
    // 中の敷石（R の中央を広場の中心に）
    if (rp) { centre(); if (g.fillStyle !== rp) g.fillStyle = rp; } else g.fillStyle = '#d8ccb0';
    g.beginPath(); g.arc(x, y, r - th * 0.5, 0, 7); g.fill();
    // 内側のふちの陰（縁石の足もと）
    const ao = g.createRadialGradient(x, y, r * 0.55, x, y, r - th * 0.5); ao.addColorStop(0, 'rgba(60,46,24,0)'); ao.addColorStop(1, 'rgba(60,46,24,.22)');
    g.fillStyle = ao; g.beginPath(); g.arc(x, y, r - th * 0.5, 0, 7); g.fill();
    if (!strip) return;
    // 縁石：道の入口（道の半幅ぶん）を切った円弧に、帯の上の縁石の段を短い切れ端で並べる
    const gap = Math.asin(Math.min(0.98, (half - th * 0.35) / (r - th / 2)));
    const blocked = (a) => dirs.some((d) => { let z = Math.abs(((a - d) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI); return z < gap; });
    const rm = r - th / 2, seg = 2.2, N = Math.max(12, Math.ceil(Math.PI * 2 * rm / seg)), sh2 = Math.round(strip.height * CURB);
    for (let i = 0; i < N; i++) {
      const a = (i + 0.5) / N * Math.PI * 2; if (blocked(a)) continue;
      const L = Math.PI * 2 * rm / N, sx = ((i * L * ppu) % (strip.width - L * ppu - 2)) || 0;
      g.save(); g.translate(x + Math.cos(a) * rm, y + Math.sin(a) * rm); g.rotate(a + Math.PI / 2);
      g.drawImage(strip, sx, 0, Math.max(1, L * ppu), sh2, -L / 2 - 0.25, -th / 2, L + 0.5, th); g.restore();
    }
  }
  /** 横長の帯の絵を点の列に沿って細い切れ端で並べる（帯の高さ＝幅 w・くり返す） */
  function stripAlong(g, pts, im, w, bx, shift) {
    const y0 = -w / 2 + (shift || 0);
    const ppu = im.height / w; let u = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 1e-6) continue;
      if (bx && (Math.max(a[0], b[0]) < bx[0] - w || Math.min(a[0], b[0]) > bx[0] + bx[2] + w || Math.max(a[1], b[1]) < bx[1] - w || Math.min(a[1], b[1]) > bx[1] + bx[3] + w)) { u += L; continue; }   // 区画の外は描かない
      let sx = (u * ppu) % im.width, sw = Math.min(L * ppu, im.width - sx);
      g.save(); g.translate(a[0], a[1]); g.rotate(Math.atan2(b[1] - a[1], b[0] - a[0]));
      g.drawImage(im, sx, 0, Math.max(1, sw), im.height, -0.35, y0, sw / ppu + 0.7, w);
      if (sw < L * ppu - 0.5) g.drawImage(im, 0, 0, L * ppu - sw, im.height, sw / ppu - 0.35, y0, L - sw / ppu + 0.7, w);   // 絵の端をまたぐ切れ端
      g.restore(); u += L;
    }
  }
  /** 目印の置き場所：地点から、その地点へ入ってくる向きに along 単位（負＝手前） */
  function landmarkAt(D, L) {
    const n = D.nodes[L.node]; if (!n) return null;
    if (L.off) return [n[0] + L.off[0], n[1] + L.off[1]];
    const e = D.edges.find((x) => x[1] === L.node && x[3] === 'forward') || null, f = D.edges.find((x) => x[0] === L.node && x[3] === 'forward') || null;
    const p = e ? D.nodes[e[0]] : null, q = f ? D.nodes[f[1]] : null;
    let dx = 0, dy = -1;
    if (p) { dx = n[0] - p[0]; dy = n[1] - p[1]; } else if (q) { dx = q[0] - n[0]; dy = q[1] - n[1]; }
    const k = Math.hypot(dx, dy) || 1, a = L.along || 0, sd = L.side || 0; return [n[0] + (dx * a - dy * sd) / k, n[1] + (dy * a + dx * sd) / k];
  }
  /** 折れ線の上に d 単位ごとの点（始点を含む） */
  function alongLine(line, d) { const out = [line[0]]; let rest = d; for (let i = 0; i < line.length - 1; i++) { const a = line[i], b = line[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]); let t = rest;
    while (t <= L) { out.push([a[0] + (b[0] - a[0]) * t / L, a[1] + (b[1] - a[1]) * t / L]); t += d; } rest = t - L; } return out; }
  /** 川の景物（決まった並び）：川の始まりに小さな滝、川筋に沿って渓流の岩と睡蓮を交互に、岸に葦。道（石橋）のまわりには置かない */
  function waterProps(D, o) {
    const VW = visualOf(o).water, W = Object.assign({}, ART.water, { every: VW.every }), RE = VW.reedEvery, out = [], segs = Object.values(D.segments).map((s) => s[3].map((n) => D.nodes[n]));
    const nearRoad = (x, y, r) => segs.some((l) => distLine(l, x, y) < r);
    for (const T of terrainOf(D)) for (const A of T.water || []) {
      const P = alongLine(A.line, W.every).filter((q) => q[1] < WORLD.h - 20 && q[0] < WORLD.w - 10); out.push({ file: W.fall.file, x: A.line[0][0], y: A.line[0][1] + 6, w: W.fall.w, z: -10 });
      P.slice(1).forEach((q, i) => {
        const r = P[Math.min(i + 2, P.length - 1)], dx = r[0] - q[0], dy = r[1] - q[1], L = Math.hypot(dx, dy) || 1, s = i % 2 ? 1 : -1;
        if (nearRoad(q[0], q[1], 24)) return;
        const P2 = i % 2 ? W.lilies : W.rocks; out.push({ file: P2.file, x: q[0] - dy / L * A.w * 0.12 * s, y: q[1] + dx / L * A.w * 0.12 * s, w: P2.w });
        const rx = q[0] + dy / L * (A.w * 0.5 + 3) * s, ry = q[1] - dx / L * (A.w * 0.5 + 3) * s;
        if (i % RE === 1 && !nearRoad(rx, ry, 24)) out.push({ file: W.reeds.file, x: rx, y: ry, w: W.reeds.w });
      });
    }
    return out;
  }
  /** 2026-10-18 Chapter 3：雲海の中の景物（小さな浮島・雲・滝）。決まった乱数・道と浮島から離す */
  const SKYP_CACHE = new Map();
  function skyProps(D) {
    const ck = 'sky:' + (D.route || 'A'); if (SKYP_CACHE.has(ck)) return SKYP_CACHE.get(ck);
    const segs = Object.values(D.segments).map((s) => s[3].map((n) => D.nodes[n])), IS = D.art.islands || [], rnd = mulberry(0x3077 + (D.route || 'A').charCodeAt(0)), out = [];
    const KINDS = [['C3_ENV_floating_island_small_green.webp', 34, 0.30], ['C3_ENV_floating_island_small_rock.webp', 26, 0.22], ['C3_ENV_floating_island_medium.webp', 50, 0.14], ['C3_ENV_cloud_puff_small.webp', 46, 0.34]];
    for (let y = 40; y < WORLD.h - 20; y += 78) for (let x = 30; x < WORLD.w; x += 78) {
      const px = x + (rnd() - 0.5) * 50, py = y + (rnd() - 0.5) * 50, r = rnd(), pick = rnd();
      if (r > 0.42) continue;
      if (segs.some((l) => distLine(l, px, py) < 44)) continue;
      if (IS.some((P) => inPoly(P, px, py) || P.some((q) => Math.hypot(q[0] - px, q[1] - py) < 34))) continue;
      const gn = D.nodes.GOAL; if (gn && Math.hypot(gn[0] - px, gn[1] - py) < ART.goal.w * 0.7) continue;
      if (out.some((q) => Math.hypot(q.x - px, q.y - py) < 70)) continue;
      let acc = 0, K = KINDS[KINDS.length - 1]; for (const k of KINDS) { acc += k[2]; if (pick < acc) { K = k; break; } }
      out.push({ file: SKY3 + K[0], x: Math.round(px), y: Math.round(py), w: Math.round(K[1] * (0.8 + rnd() * 0.4)), z: -24 });
    }
    // 浮島のふちから雲海へ落ちる滝（大きめの浮島のいくつか）
    let n = 0; for (const P of IS) { if (n >= 7) break; const c = P.reduce((a, q) => [a[0] + q[0] / P.length, a[1] + q[1] / P.length], [0, 0]); const r = Math.max(...P.map((q) => Math.hypot(q[0] - c[0], q[1] - c[1])));
      if (r < 44 || rnd() > 0.5) continue; const lo = P.reduce((a, q) => (q[1] > a[1] ? q : a)); if (segs.some((l) => distLine(l, lo[0], lo[1] + 14) < 30)) continue;
      out.push({ file: SKY3 + 'C3_FX_sky_waterfall_column.webp', x: Math.round(lo[0]), y: Math.round(lo[1] + 26), w: 14, z: -26 }); n++; }
    SKYP_CACHE.set(ck, out); return out;
  }
  /** 道の外に木と岩を散らす（決まった乱数・道とマスから離す・道の近くだけ）。第1便の検証用 */
  function scatter(D, o) {
    const pts = []; for (const s of Object.values(D.segments)) { const p = s[3].map((id) => D.nodes[id]);
      for (let i = 0; i < p.length - 1; i++) { const n = Math.max(1, Math.ceil(Math.hypot(p[i + 1][0] - p[i][0], p[i + 1][1] - p[i][1]) / 4)); for (let k = 0; k <= n; k++) pts.push([p[i][0] + (p[i + 1][0] - p[i][0]) * k / n, p[i][1] + (p[i + 1][1] - p[i][1]) * k / n]); } }
    const cell = 24, grid = new Map(), key = (x, y) => Math.floor(x / cell) + ',' + Math.floor(y / cell);
    for (const q of pts) { const k = key(q[0], q[1]); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(q); }
    const near = (x, y) => { let m = 1e9; const cx = Math.floor(x / cell), cy = Math.floor(y / cell);
      for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) for (const q of grid.get((cx + i) + ',' + (cy + j)) || []) m = Math.min(m, Math.hypot(q[0] - x, q[1] - y)); return m; };
    const VIS = visualOf(o), PK = peaksOf(D, o), PR = VIS.props;   // 2026-10-14 Chapter 1 B／C：seed・密度・割合はパターンごと（A は従来の値＝出力は同じ）
    const rnd = mulberry(VIS.seed);
    const out = [], gap = o.roadW / 2 + 10;
    for (let y = 10; y < WORLD.h; y += 30) for (let x = 10; x < WORLD.w; x += 30) {
      const px = x + (rnd() - 0.5) * 24, py = y + (rnd() - 0.5) * 24, d = near(px, py), r = rnd(), pick = rnd();
      if (d < gap || d > VIS.far || r > VIS.density || py < 150) continue;   // GOAL の会場のまわり（y<150）には置かない
      if (inValley(D, px, py)) continue;   // 谷の中には置かない
      if (D.art && D.nodes.GOAL && Math.hypot(D.nodes.GOAL[0] - px, D.nodes.GOAL[1] - py + 30) < ART.goal.w * 0.55) continue;   // B／C：大会会場のまわり（A は上の y<150 の規則のまま）
      if (lmOf(D).some((L) => { const at = landmarkAt(D, L); return at && Math.hypot(at[0] - px, at[1] - py) < L.w * 0.75; })) continue;   // 目印のまわりにも置かない
      if (PK.some(([x0, y0, w0]) => Math.hypot(x0 - px, y0 - py) < w0 * 0.6)) continue;   // 岩峰のまわりにも置かない
      let acc = 0, P = PR[PR.length - 1]; for (const c of PR) { acc += c.p; if (pick < acc) { P = c; break; } }
      out.push({ x: px, y: py, file: P.file, w: P.w * (0.8 + rnd() * 0.45) });
    }
    return out;
  }
  /** 決まった乱数（mulberry32） */
  function mulberry(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  /** 山の岩峰の位置 [x, y, w]：ART.peaks.at（全パターン共通）＋ C の追加（道から far 以上・谷／雲海／森の外・目印と岩峰から離れた所・決まった乱数）。1回だけ計算 */
  const PEAK_CACHE = new Map();
  function peaksOf(D, o) {
    const VIS = visualOf(o), X = VIS.peaks, B0 = peaksBase(D); if (!X) return B0;
    const ck = VIS.key + ':' + ((D && D.route) || 'A'); if (PEAK_CACHE.has(ck)) return PEAK_CACHE.get(ck);
    const segs = Object.values(D.segments).map((s) => s[3].map((n) => D.nodes[n])), rnd = mulberry(X.seed), out = B0.slice();
    const far = (x, y, pts, r) => pts.every((p) => Math.hypot(p[0] - x, p[1] - y) >= r);
    for (let tries = 0; tries < 4000 && out.length < B0.length + X.n; tries++) {
      const x = 40 + rnd() * (WORLD.w - 80), y = 170 + rnd() * (WORLD.h - 210), w = X.w[0] + rnd() * (X.w[1] - X.w[0]);
      if (segs.some((l) => distLine(l, x, y) < X.far)) continue;
      if (inValley(D, x, y) || terrainOf(D).some((T) => inPoly(loopPoly(D, T), x, y))) continue;
      if (!far(x, y, out, X.gap)) continue;
      if (lmOf(D).some((L) => { const at = landmarkAt(D, L); return at && Math.hypot(at[0] - x, at[1] - y) < L.w + w; })) continue;
      const gn = D.nodes.GOAL; if (gn && Math.hypot(gn[0] - x, gn[1] - y) < ART.goal.w) continue;
      out.push([Math.round(x), Math.round(y), Math.round(w)]);
    }
    PEAK_CACHE.set(ck, out); return out;
  }

  // 2026-10-15 Chapter 2 設計案の試作：js/proto/ch2-world.js（MMRF_SEA）へ渡す描画の部品（同じ帯・同じ曲線で描く）
  const HELP = { WORLD, ART, pattern, stripAlong, curvePts, inPoly, distLine, mulberry, project, landmarkAt, qa: () => root.MMQAR || null };
  let cssDone = false;
  function css(doc) {
    if (cssDone || doc.getElementById('rfw-css')) return; cssDone = true;
    const s = doc.createElement('style'); s.id = 'rfw-css';
    s.textContent = `:is(#rfp,.wbv) .rfw{position:absolute;inset:0;overflow:hidden;background:#86b65a;z-index:1}
:is(#rfp,.wbv) .rfw.sky{background:#bcd8f0}
:is(#rfp,.wbv) .rfw-plane{position:absolute;left:0;top:0;transform-origin:0 0;will-change:transform}
:is(#rfp,.wbv) .rfw-chunk{position:absolute;display:block}
:is(#rfp,.wbv) .rfw-bb{position:absolute;inset:0;pointer-events:none}
:is(#rfp,.wbv) .rfw-tile{position:absolute;left:0;top:0;transform-origin:0 0}
:is(#rfp,.wbv) .rfw-tile img{display:block;width:100%;height:auto}
:is(#rfp,.wbv) .rfw-tile span{position:absolute;left:0;right:0;top:30%;text-align:center;font:800 11px/1 "Noto Sans JP",sans-serif;color:#13233a;text-shadow:0 0 3px #fff,0 0 3px #fff}
:is(#rfp,.wbv) .rfw-tile span:empty{display:none}
:is(#rfp,.wbv) .rfw-tile.used img{opacity:.55}
:is(#rfp,.wbv) .rfw-tile.cur img{filter:drop-shadow(0 0 5px #fff6c0)}
:is(#rfp,.wbv) .rfw-tile{transition:opacity .35s}
:is(#rfp,.wbv) .rfw-tile.far{opacity:.22}
:is(#rfp,.wbv) .rfw-veil{position:absolute;display:block;pointer-events:none;transition:opacity .5s}
:is(#rfp,.wbv) .rfw.intro .rfw-tile.far{opacity:1}
:is(#rfp,.wbv) .rfw.intro .rfw-veil{opacity:0}
:is(#rfp,.wbv) .rfw-apron{position:absolute;pointer-events:none}
:is(#rfp,.wbv) .rfw-prop{position:absolute;left:0;top:0;transform-origin:0 0;pointer-events:none;user-select:none;-webkit-user-drag:none}
/* 2026-10-14 Chapter 1 進入時のクラッシュ対策：マス・景物の will-change は開始の俯瞰の外（追従の間）だけ。俯瞰では約540個が一度に画面に入る＝決まった幅（base）の層が一斉にできていた */
:is(#rfp,.wbv) .rfw:not(.intro) :is(.rfw-tile,.rfw-prop){will-change:transform}
:is(#rfp,.wbv) .rfw-prop{transition:opacity .25s}:is(#rfp,.wbv) .rfw-prop.thru{opacity:.32}
:is(#rfp,.wbv) .rfw-mark{filter:drop-shadow(0 0 6px rgba(190,110,255,.85));transition:opacity .5s,filter .5s}
:is(#rfp,.wbv) .rfw-mark.dim{opacity:.32;filter:none}
:is(#rfp,.wbv) .rfw.art{background:#7aa84c}:is(#rfp,.wbv) .rfw.sea{background:#1b5f8a}:is(#rfp,.wbv) .rfw-tile.occl{opacity:.3}
:is(#rfp,.wbv) .rfw-mon{position:absolute;left:0;top:0;will-change:transform;transform-origin:0 0}
:is(#rfp,.wbv) .rfw-mon img{display:block;width:100%;height:auto;filter:drop-shadow(0 3px 2px rgba(0,0,0,.45))}
:is(#rfp,.wbv) .rfw-title{position:absolute;left:0;right:0;top:calc(env(safe-area-inset-top,0px) + 18px);text-align:center;font-family:"Shippori Mincho",serif;font-weight:800;font-size:26px;color:#fff;text-shadow:0 2px 6px rgba(0,0,0,.6);opacity:0;pointer-events:none;z-index:3}
:is(#rfp,.wbv) .rfw-title small{display:block;font-size:12px;letter-spacing:.25em;font-family:"Noto Sans JP",sans-serif}
:is(#rfp,.wbv) .rfw-title em{display:block;font-style:normal;font-size:12px;font-family:"Noto Sans JP",sans-serif;opacity:.9}
#rfp.rfw-intro .rf-top,#rfp.rfw-intro .rf-tools,#rfp.rfw-intro .rf-bot{opacity:0;pointer-events:none;transition:opacity .4s}
#rfp.rfw-on .rf-cam{display:none}`;
    doc.head.appendChild(s);
  }

  /** 2026-10-12 開発21：出発の前に盤の絵を先に読み込んでおく（ブラウザの取り置き。描画はしない）。1回だけ */
  let pre = null;
  function warmArt(base, skin) {
    if (pre || !root.Image) return pre; base = base || './assets/proto/board_art_1010/';
    const K = SKIN[skin], sk = K ? [...new Set(['A', 'B', 'C'].flatMap((v) => [K[v].ground, K[v].road, K[v].strip, K[v].water, ...Object.values(K[v].props).map((q) => q[0])]))].map((f) => K.base + f) : [];
    const T = ART.terrain, files = [ART.ground.file, ART.road.file, ART.strip.file, ART.goal.file, ART.peaks.file, T.valley.file, T.water.file, T.cloud.file, ...Object.values(T.edges).map((e) => e.file),
      ...Object.values(VISUAL).filter((v) => !v.sky).flatMap((v) => v.props.map((p) => p.file)),   /* 2026-10-18：Chapter 3 の空の景物は Chapter 1 の出発では読まない */ ...ART.landmarks.map((l) => l.file), ...Object.values(ART.water).filter((w) => w && w.file).map((w) => w.file)];
    pre = [...[...new Set(files)].map((f) => artUrl(base, f)), ...sk].map((u) => { const im = new root.Image(); im.decoding = 'async'; im.src = u; return im; });
    return pre;
  }
  const api = { DEF, WORLD, ART, TERRAIN, VISUAL, SKIN, skinOf, visualOf, peaksOf, project, fitZoom, lookahead, headingYaw, angDiff, create, scatter, waterProps, curvePts, landmarkAt, inValley, loopPoly, warmArt };
  if (typeof module === 'object' && module.exports) module.exports = api; else root.MMRF_WORLD = api;
})(typeof window !== 'undefined' ? window : globalThis);
