// =========================================================
// Chapterフィールドの画面（Chapterフィールドエンジン js/chapter/engine.js の見せ方）
//  「すごろくの駒が動く画面」ではなく「育てているモンスターと一緒にフィールドを旅する画面」にする。
//  ・ノード・線・番号・通常の地点は見せない（?chdebug=1 のときだけ点と道筋を出す）。内部は node 式のまま。
//  ・カメラ：モンスターを画面の中央より少し下に置き、進む向きの先を多く見せる（三人称の「一緒に先を見ている」構図）。
//    移動が始まると少し遅れて追いかけ（followDelay）、進行方向へ先読み（lookAhead）、移動中は少し引き（zoom.move）、着いたら軽く寄る（zoom.stop）。
//    停止地点（石碑・宝箱・イベント）に着いたときだけ、その物のほうへ少し寄る（focus）。分岐では少し引いて2つの道を見せる。
//  ・視差：遠景（背景の上の帯）・奥の環境素材・道（背景＋停止地点＋モンスター）・手前の草や岩を、少しずつ違う速さで動かす（config.parallax）。
//  ・歩き：道の曲線（MMCH.routeBetween）に沿って歩く。出目が決まると約0.1秒の構え → 加速 → 地点ごとに距離・地形で速さが変わる → 最後の20〜30%で減速 → 着地。
//    見た目（上下動・前傾・向き・影）は monsterAnimator（既定は CSS のクラス）。正式な歩行アニメが届いたら registerMonsterAnimator で差し替えるだけ。
//  ・停止地点：モンスターは道の上の点（node.mx/my）に止まり、目印（石碑・宝箱・木陰など）は道の脇（landmarkPos）に置く。二つの位置は別。
//    能力＝道端の古代石碑（普段は光らず、止まった時だけ0.6秒光る）、イベント＝内容に応じた自然物（config.eventPool[].asset）、宝箱＝草むらの脇、
//    バトル＝目印を置かない（着いた時に草むらが揺れて現れる）。ライバルは config.battleTypes.rival.figure（asset key）で立ち姿を置ける（今は素材なし）。
//  ・背景の切り替え：フィールドの端まで歩く → カメラが前へ → 短い暗転 → 次のフィールドの入口の少し手前から歩いて入る（向きを保つ）。
//  ・下の操作欄（command deck）：中央の START（1タップでサイコロを振る）、4コマンド（アイテム・休む・技設定・ステータス）。
//    サイコロは START を押すまで画面に出さない（2026-10-01）。START → 出目・ターン・疲れを確定して保存 → サイコロが出現して回り、自動で減速して停止面 → 移動 → 消える → START が押せる。
//    STOP の操作は廃止（MMCHD の manualStop は使わない）。START は演出・移動・停止処理が終わるまで押せない（busy ＋ disabled）。
//  ・道の安全域：モンスターの x は常に背景ごとの道の中央線の安全域（fieldScenes[].road → MMCH.clampToRoad）に収める（setMonPos。歩きの途中も同じ）。
//  重ね順（.chf-cam の中）：遠景の帯（far）→ 背景 → 奥の環境（back）→ 道（背景の上の物・モンスター：足元の y で前後）→ 手前の環境（front）→ 効果（fx）。UI は .chf-ui。
//  進行（出目・移動・分岐・停止地点・休む・疲れ・セーブ）は MMP8／MMCH。ここは描画と演出と、ボタンからの呼び出しだけ。
//  index.html の board() から、エンジンが担当する Chapter のときだけ chfBoard() が呼ばれる。
// =========================================================
(function (root) {
  'use strict';
  const STEP_MS = 260;              // 1地点ぶんの移動の基準（距離・地形で 200〜350ms に変わる）
  const FACING = 'left';            // 正式モンスター画像の向き（右へ進むときだけ左右反転）
  // 既定の見せ方（config.motion／config.camera／config.parallax で上書きできる。Chapter・Pattern ごとの座標の特別扱いは書かない）
  const DEF = {
    motion: { stepMs: 430, minMs: 320, maxMs: 620, baseLen: 150, windupMs: 100, landMs: 170, enterMs: 300, fadeMs: 320,
      terrain: { grass: { speed: 1 }, slope: { speed: 0.86 }, bridge: { speed: 1, fixed: true }, forest: { speed: 0.9 }, highland: { speed: 0.92 } } },
    camera: { anchorY: 0.64, lookAhead: 0.11, followDelay: 110, followTau: 150, settleTau: 240, zoomTau: 240, focusMix: 0.38,
      zoom: { idle: 1, move: 0.98, stop: 1.02, branch: 0.93, focus: 1.03 } },
    parallax: { far: 0.94, back: 0.97, road: 1, front: 1.14, canopy: 0.6 },
  };
  const V = { key: null, field: null, cfg: null, g: null, sc: null, cam: { x: 0, y: 0, z: 1, S: 1, tx: 0, ty: 0 }, tgt: { x: 0, y: 0, z: 1 }, par0: null, raf: 0, last: 0, hold: 0,
    moving: false, intro: false, facing: 1, look: [0, -1], focus: null, skip: null, pre: new Set(), monPos: null, calm: false, animator: null, seedTuft: 1 };
  const $ = (s) => document.querySelector(s);
  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // 開発用の表示（?chdebug=1 のときだけ。本番の URL では出ない）：道路中央ライン・道の端・マスの中心と ID・背景の範囲（enter／playable／handoff）・今の背景・カメラの注視点
  const debug = () => { try { return !!root.MM_CHDEBUG || /(^|[?&])chdebug=1(&|$)/.test(root.location.search); } catch (e) { return false; } };
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const isObj = (o) => !!o && typeof o === 'object' && !Array.isArray(o);
  const calmMode = () => !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches);
  // index.html の let／const（S・save・msv・LAB）は window のプロパティにならないため、名前で直接読む
  const gS = () => { try { return S; } catch (e) { return undefined; } };
  const doSave = () => { try { save(); } catch (e) {} };
  // 歩行スプライトの種族は全コマを重ねて置き、見せるコマだけ切り替える（src を差し替えない＝再読み込み・ちらつきなし。停止の絵が先頭）
  const monHtml = (m) => { const sp = spriteSetOf(m); if (sp) { const I = sp.idle || 0, ord = [I, ...sp.frames.map((_, i) => i).filter((i) => i !== I)]; return `<span class="chf-spr" data-f="${I + 1}" style="--sprh:${sp.h || 0.9}">${ord.map((i) => `<img src="${esc(sp.frames[i])}" data-i="${i}" class="${i === I ? 'on' : ''}" alt="" draggable="false" decoding="async">`).join('')}</span>`; } try { return msv(m); } catch (e) { return ''; } };
  /** 歩行スプライト（config.monsterSprites[種族キー].walk＝{ frames:[…], fps, idle, h, noFlip }）。無い種族は従来の画像＋CSS の上下動 */
  function spriteSetOf(m) {
    const cfg = V.cfg || (root.MMCH && m ? MMCH.configFor(m) : null), P = root.MMP10M, key = P && m ? P.keyOf(m.sp) : null;
    const set = cfg && cfg.monsterSprites && key ? cfg.monsterSprites[key] : null;
    return set && set.walk && Array.isArray(set.walk.frames) && set.walk.frames.length ? set.walk : null;
  }
  const labOf = (k) => { try { return LAB[k] || k; } catch (e) { return k; } };

  /** エンジンが担当する Chapter の進行中か */
  function chfActive(m) { return !!(root.MMCH && m && m.raise && P7().inChapter(m) && MMCH.DRIVER.handles(m.raise.ch) && MMCH.fieldOf(m)); }
  const P7 = () => root.MMP7, P8 = () => root.MMP8;
  const asset = (cfg, k) => (cfg.assets && cfg.assets[k]) || '';
  const sceneOf = (cfg, id) => cfg.fieldScenes.find((s) => s.id === id);
  /** 演出の素材（config.effects[key] → config.assets[その値]）。無ければ null＝今までどおりの表示 */
  const effectAsset = (key) => { const c = V.cfg; if (!c || !key) return null; const k = (c.effects || {})[key] || key; return (c.assets || {})[k] || null; };
  const MO = () => ({ ...DEF.motion, ...((V.cfg && V.cfg.motion) || {}), terrain: { ...DEF.motion.terrain, ...(((V.cfg && V.cfg.motion) || {}).terrain || {}) } });
  // カメラ：既定 ← config.camera（Pattern 全体）← fieldScenes[].camera（背景ごとの上書き）
  const CA = () => { const c = (V.cfg && V.cfg.camera) || {}, s = (V.sc && V.sc.camera) || {}; return { ...DEF.camera, ...c, ...s, zoom: { ...DEF.camera.zoom, ...(c.zoom || {}), ...(s.zoom || {}) } }; };
  const PX = () => ({ ...DEF.parallax, ...((V.cfg && V.cfg.parallax) || {}) });
  const monH = () => ((V.cfg && V.cfg.monster && V.cfg.monster.h) || 176);

  // ---------------------------------------------------------
  // 停止地点の見た目（配置の割り当てから）。目印の位置は道の脇（モンスターの止まる位置とは別）
  // ---------------------------------------------------------
  function lookOf(cfg, a) {
    const L = cfg.nodeLook || {};
    if (!a) return null;
    if (cfg.tileUI && cfg.tileUI.replacesLandmarks && ['stat', 'event', 'treasure'].includes(a.t)) {   // マスUIが種別を示す：同じ意味の旧目印は出さない
      const ch = a.t === 'treasure' && (cfg.tileUI.chests || {})[a.tier || 'normal'];   // 宝箱の正式素材（tier ごと。無い tier は出さない）
      return ch ? { ...L.treasure, w: ch.w || (L.treasure || {}).w, key: ch.closed, openKey: ch.open, frames: ch.frames || null, cls: `tr tr-${a.tier || 'normal'} chest` } : null;
    }
    if (a.t === 'stat') return { ...L.stat, key: `stat_${a.k}`, cls: `st st-${a.k}` };
    if (a.t === 'event') {
      const e = (cfg.eventPool || []).find((x) => x.id === a.ev), tier = a.tier || 'normal';
      const nat = e && e.asset ? { ...(L.eventNature || L.event), key: e.asset, ...(e.look || {}) } : { ...L.event, key: `event_${tier}`, ...((e && e.look) || {}) };   // 内容に応じた自然物（無ければ tier の目印を小さく）
      return { ...nat, cls: `ev ev-${tier}${e && e.asset ? ' nat' : ''}` };
    }
    if (a.t === 'treasure') return { ...L.treasure, key: `treasure_${a.tier || 'normal'}`, cls: `tr tr-${a.tier || 'normal'}` };
    if (a.t === 'battle') {
      const bt = (cfg.battleTypes || {})[a.bt || 'wild'] || {};
      if (bt.figure && asset(cfg, bt.figure)) return { ...(L.figure || L.battle), key: bt.figure, cls: `fig fig-${a.bt}` };   // ライバル本人など（素材が届いたら config だけ）
      if (cfg.battleMarkers) return { ...L.battle, key: bt.asset || `battle_${a.bt || 'wild'}`, cls: `bt-${a.bt || 'wild'}` };   // 旧：石碑を常設（既定では出さない）
      return null;   // バトルは目印を置かない（着いた時に草むらが揺れて現れる）
    }
    return null;
  }
  /** 道の向き（曲線の接線。無ければ前後のノード） */
  function tangentAt(g, sc, id) {
    const n = g.nodes[id], c = g.curves[n.path];
    let a = n, b = n;
    if (c) { const i = c.s.findIndex((s) => s >= n.s); const p0 = c.pts[Math.max(0, i - 1)], p1 = c.pts[Math.min(c.pts.length - 1, i + 1)]; a = { x: p0[0], y: p0[1] }; b = { x: p1[0], y: p1[1] }; }
    else { const prev = Object.keys(g.conn).find((k) => (g.conn[k] || []).includes(id)), next = (g.conn[id] || [])[0]; a = prev ? g.nodes[prev] : n; b = next ? g.nodes[next] : n; }
    let tx = (b.x - a.x) * sc.w, ty = (b.y - a.y) * sc.h; const len = Math.hypot(tx, ty) || 1; return [tx / len, ty / len];
  }
  /** 道の脇の位置：道の向きに直角な方向へ（奥行きで縮める）。道が横向き（橋の上など）なら手前／奥へずらす */
  function sideOffset(g, sc, id, side, gap) {
    const n = g.nodes[id], [tx, ty] = tangentAt(g, sc, id);
    let nx = -ty, ny = tx * 0.45;   // 直角方向（上下は奥行きのため浅く）
    let k = Math.hypot(nx, ny) || 1; nx /= k; ny /= k;
    // 道が横へ曲がる所（急なカーブ）でも目印は道の横へ（真上・真下に置くとモンスターと重なる）。まっすぐな道（|nx|≒1）は変わらない
    if (Math.abs(nx) < 0.9) { nx = (nx < 0 ? -1 : 1) * 0.9; ny = Math.sign(ny || 1) * Math.sqrt(1 - 0.81); }
    return { dx: nx * side * gap * n.d, dy: ny * side * gap * n.d * 0.6 };
  }
  /** 目印の足元の位置（背景の画素）と大きさ。node.lm（config.nodeOverrides）があればそれを優先 */
  function landmarkPos(cfg, g, sc, id, look) {
    const n = g.nodes[id], o = n.lm || {}, P = (cfg.paths || []).find((p) => (p.key || p.id) === n.path) || {}, PL = P.landmark || {};   // 道ごとの置き方（橋の上では欄干ぎわ＝gapScale を小さく）
    const side = look.side === 0 ? 0 : PL.fixedSide ? PL.fixedSide : (PL.side || n.side || 1) * (look.side || 1),   // fixedSide：その道の物はいつもその側（分岐の左右の道＝外側。もう一方の道へはみ出さない）
      off = side ? sideOffset(g, sc, id, side, (look.gap || 96) * (PL.gapScale || 1)) : { dx: 0, dy: 0 };
    const x = o.x != null ? o.x * sc.w : n.x * sc.w + off.dx, y = o.y != null ? o.y * sc.h : n.y * sc.h + off.dy;
    const d = (o.depth != null ? o.depth : n.d) * (o.scale || 1);
    return { x, y, d, side, opacity: o.opacity != null ? o.opacity : (look.opacity != null ? look.opacity : 1), anchor: o.anchor || look.anchor || 'foot' };
  }

  // ---------------------------------------------------------
  // フィールド（背景1枚ぶん）の DOM
  // ---------------------------------------------------------
  const rnd01 = () => { V.seedTuft = (V.seedTuft * 1664525 + 1013904223) >>> 0; return V.seedTuft / 4294967296; };
  /** 足元を隠す草（手前の草の帯から一部を切り出す。config.assets.grass_front） */
  function tuftHtml(cfg, w) {
    const src = asset(cfg, (cfg.nodeLook && cfg.nodeLook.tuft) || 'grass_front'); if (!src) return '';
    return `<i class="chf-tuft" style="width:${(w * 1.15).toFixed(0)}px;background-image:url(${src});background-position:${(-rnd01() * 700).toFixed(0)}px 100%"></i>`;
  }
  function envHtml(cfg, sc, L, i) {
    const w = L.w, src = asset(cfg, L.asset), front = L.layer === 'front';
    const z = front ? 6000 + i : Math.round(L.y * sc.h), sink = L.sink || 0;   // 高さは画像の縦横比（CSS の aspect は img に任せる）
    const hz = L.haze || 0, filt = hz ? `filter:saturate(${(1 - 0.32 * hz).toFixed(3)}) contrast(${(1 - 0.22 * hz).toFixed(3)}) brightness(${(1 + 0.06 * hz).toFixed(3)}) blur(${(hz * 1.1).toFixed(2)}px);` : '';
    const sh = L.shadow ? `<i class="chf-esh" style="--o:${L.shadow}"></i>` : '';
    return `<div class="chf-env${front ? ' fr' : ''}" data-asset="${esc(L.asset)}" style="left:${(L.x * sc.w).toFixed(1)}px;top:${(L.y * sc.h).toFixed(1)}px;width:${w}px;z-index:${z};--sink:${sink}">${sh}<img src="${src}" alt="" draggable="false" decoding="async" style="${filt}${L.flip ? 'transform:scaleX(-1);' : ''}${L.opacity != null ? `opacity:${L.opacity};` : ''}"></div>`;
  }
  /** 手前を横切る草・岩（config.foreground[field]）：道の少し手前に置き、モンスターが通るとき一瞬手前を横切る */
  function fgHtml(cfg, sc, F, i) {
    const src = asset(cfg, F.asset); if (!src) return '';
    const w = F.w || 220, h = F.h || Math.round(w * 0.34), y = F.y * sc.h;
    return `<i class="chf-fg" data-asset="${esc(F.asset)}" style="left:${(F.x * sc.w).toFixed(1)}px;top:${y.toFixed(1)}px;width:${w}px;height:${h}px;z-index:${Math.round(y) + 2};background-image:url(${src});background-position:${(-(F.slice || 0) * 700).toFixed(0)}px 100%;${F.flip ? 'transform:translate(-50%,-100%) scaleX(-1);' : ''}${F.opacity != null ? `opacity:${F.opacity};` : ''}"></i>`;
  }
  function nodeObjHtml(cfg, g, sc, m, id) {
    const f = MMCH.fieldOf(m), n = g.nodes[id], a = f.nodeAssignments[id] || (['strong', 'rival'].includes(n.kind) ? { t: 'battle', bt: n.kind } : null), look = lookOf(cfg, a);
    if (!look) return '';
    const P = landmarkPos(cfg, g, sc, id, look), d = P.d;
    const used = (a.t === 'event' && f.consumedEvents.includes(id)) || (a.t === 'treasure' && f.openedTreasures.includes(id)) || (a.t === 'stat' && f.clearedStats.includes(id));
    const w = look.w ? look.w * d : 0, size = look.w ? `width:${w.toFixed(1)}px;` : `height:${(look.h * d).toFixed(1)}px;`;
    const far = clamp((1 - n.d) * 1.1, 0, 0.7);   // 遠景ほど淡く小さく（透明度だけ。色は変えない）
    const vis = ((cfg.landmarkVisibility || {})[a.t] || 'always') === 'arrive' && !used;   // 着いたときに初めて現れる目印
    return `<div class="chf-obj ${look.cls}${used ? ' used' : ''}${vis ? ' hid' : ''}" data-id="${id}" data-t="${a.t}" data-side="${P.side}" style="left:${P.x.toFixed(1)}px;top:${P.y.toFixed(1)}px;z-index:${Math.round(P.y)};--sink:${look.sink || 0};--d:${d};opacity:${(P.opacity * (1 - far * 0.35)).toFixed(2)}"><i class="chf-osh"></i><i class="chf-glow"></i><img src="${asset(cfg, used && look.openKey ? look.openKey : look.key)}"${look.openKey ? ` data-open="${esc(asset(cfg, look.openKey) || '')}"` : ''}${look.frames ? ` data-frames="${esc(look.frames.map((k) => asset(cfg, k) || '').join('|'))}"` : ''} alt="" draggable="false" decoding="async" style="${size}">${look.tuft === false ? '' : tuftHtml(cfg, w || (look.h * d) * 0.7)}</div>`;
  }
  // ---------------------------------------------------------
  // マスUI（config.tileUI）：各マスの座標（ノードの止まる位置 mx・my）に、マス種別ごとの表示素材を地面に置く。
  //  正式素材は未着：sprites に種類ごとの画像を書けば差し替わる（座標はそのまま。探す順＝種別名 → まとめた種類 → normal）。
  //  素材が無い種類は、位置確認専用の仮表示（点線の楕円と「仮 #通し番号」。正式デザインではない）。tileUI が無い config は何も出さない
  // ---------------------------------------------------------
  const TILE_GROUP = { stat_life: 'stat', stat_power: 'stat', stat_intelligence: 'stat', stat_accuracy: 'stat', stat_evasion: 'stat', stat_toughness: 'stat', rest: 'event', wild: 'battle', rare: 'battle', strong: 'battle', rival: 'battle' };
  /** マスの種別名：分かれ道・合流（骨格の branch／merge）はその名前、それ以外は配置の割り当てから（MMCH.nodeTypeName） */
  function tileKeyOf(m, id) { const g = MMCH.graphFor(m), n = g && g.nodes[id]; if (n && (n.kind === 'branch' || n.kind === 'merge')) return n.kind; const a = MMCH.typeAt(m, id); return MMCH.nodeTypeName(a); }
  function tileSpriteOf(cfg, key) { const T = (cfg && cfg.tileUI && cfg.tileUI.sprites) || {}; return T[key] || T[TILE_GROUP[key]] || T.normal || null; }
  /**
   * マスの見た目の大きさ（背景の画素）：幅＝基準 × 奥行き^depthPow × 倍率、縦の潰れ（flat）＝奥行きで変える（奥ほど平たい楕円・手前ほど円に近い）。
   *  size.flat が数なら従来どおり一定、{ near, far, dNear, dFar } なら奥行きで補間。ノードごとの上書きは path.tileLook（node.look＝{ s, f }）
   */
  /** マスの大きさの区分（size.roadFit のキー）：通常マス＝normal（小さめ）・能力＝stat（小）・宝・イベント・休憩＝mid（中）・バトル・分かれ道・合流・ゴール＝big（中〜やや大） */
  function tileFitKind(key) { if (key === 'normal') return 'normal'; const g = TILE_GROUP[key] || key; return g === 'stat' ? 'stat' : (g === 'battle' || key === 'branch' || key === 'merge' || key === 'goal') ? 'big' : 'mid'; }
  /** その地点で見えている道幅（背景の画素）：絵の道幅と、その奥行きのカメラで画面に入る幅（縦長の画面は幅で決まる＝背景の幅 ÷ ズーム）の小さいほう */
  function seenRoadW(sc, n) { const r = sc && MMCH.roadAt(sc, n.my); if (!r || !sc.depth || !sc.zoom) return 0; return Math.min(2 * r.half * sc.w, sc.w / zoomAt(sc, n.d)); }
  function tileBox(T, n, key, sc) {
    const S = T.size || {}, W0 = S.w || 170, dp = S.depthPow != null ? S.depthPow : 1, L = n.look || {};
    let flat = S.flat || 0.34;
    if (isObj(flat)) { const t = clamp((n.d - (flat.dFar != null ? flat.dFar : 0.4)) / ((flat.dNear != null ? flat.dNear : 1.12) - (flat.dFar != null ? flat.dFar : 0.4)), 0, 1); flat = flat.far + (flat.near - flat.far) * t; }
    // 2026-10-03：size.roadFit があれば、幅＝その地点で見えている道幅 × 区分ごとの割合（通常 55%・能力 58%・宝／イベント 62%・バトル 66%。道を覆わない）。無ければ従来の 基準 × 奥行き^depthPow
    //  fitScale＝区分の比率を保ったまま全体を縮める共通の基準（2026-10-03 総監査：動画で「道に対して大きすぎる」→ 0.72）
    // 2026-10-03 夜（試遊で「マスの大きさがバラバラ」）：size.uniform があれば、マスの種類・背景の道幅に関係なく、外側の土台の大きさは奥行きだけで決める（w × 奥行き^pow）。
    //  道の絵が細い所だけ、見えている道幅 × roadMax を上限にする（道を覆わない）。種類の違いは中の紋様・色だけで見せる
    const U = S.uniform;
    if (U) { const cap = sc ? seenRoadW(sc, n) * (U.roadMax || 0.62) : 0, w0 = U.w * Math.pow(n.d, U.pow != null ? U.pow : 1) * (L.s || 1), w = cap > 0 ? Math.min(w0, cap) : w0, f = L.f || flat;
      return { w, h: w * f, f, op: U.opacity != null ? U.opacity : 1, th: 0, rim: Math.max(1.2, w * (S.rim != null ? S.rim : 0.018)) }; }
    const road = S.roadFit && sc ? seenRoadW(sc, n) : 0;
    const w = road ? road * (S.roadFit[tileFitKind(key)] || S.roadFit.stat || 0.58) * (S.fitScale || 1) * (L.s || 1) : W0 * Math.pow(n.d, dp) * (L.s || 1) * (key === 'normal' && S.normal ? S.normal : 1), f = L.f || flat;
    const t = clamp((n.d - 0.4) / (1.12 - 0.4), 0, 1), op = S.farOpacity != null ? S.farOpacity + (1 - S.farOpacity) * t : 1;   // 奥のマスほど控えめ（UI のアイコンに見えない）
    return { w, h: w * f, f, op, th: Math.max(0, w * f * (S.thick != null ? S.thick : 0.12)), rim: Math.max(1.2, w * (S.rim != null ? S.rim : 0.018)) };
  }
  /**
   * 2026-10-06：小型の立体マス（tileUI.discs＝種別名 → 画像。宝箱は段階ごとに treasure_normal・treasure_rare・treasure_special）。絵そのものが厚みのある円盤なので、台座・土台は敷かない。
   *  大きさ＝discSize.w × 奥行き^pow（背景の画素。見えている道幅 × roadMax を上限）、縦＝幅 × aspect（絵の縦横比）× 奥ほど少し平たく（flat.far〜near）。
   *  マスの上面の中心をノードの止まる位置に合わせる（.chf-tile.disc の translate）。書いていない種類（スタート・ゴール）は従来の表示
   */
  function discKeyOf(m, id, key) { if (key !== 'treasure') return key; const a = MMCH.typeAt(m, id); return a && a.tier ? `treasure_${a.tier}` : key; }
  function discBox(T, n, sc) {
    const Z = T.discSize || {}, L = n.look || {}, cap = sc ? seenRoadW(sc, n) * (Z.roadMax || 0.42) : 0, w0 = (Z.w || 130) * Math.pow(n.d, Z.pow != null ? Z.pow : 0.9) * (L.s || 1), w = cap > 0 ? Math.min(w0, cap) : w0;
    const F = Z.flat || { near: 1, far: 0.8 }, t = clamp((n.d - 0.4) / (1.12 - 0.4), 0, 1), f = (Z.aspect || 0.8) * (F.far + (F.near - F.far) * t);
    return { w, h: w * f };
  }
  /** 2026-10-08：マスの見た目の大きさ（全背景共通の node-size token。画面の px）。config.tileUI.fixedSize が無い config は null＝従来の奥行きの大きさ */
  function nodeToken(T) { const F = T && T.fixedSize; if (!F) return null; const w = viewport().W || 390; return clamp(w * (F.vw || 0.18), F.min || 56, F.max || 80); }
  function tilesHtml(cfg, g, sc, m, ids) {
    const T = cfg.tileUI; if (!T) return '';
    const tok = nodeToken(T), fx = tok ? ' fx' : '';   // fx：カメラの拡大を打ち消して、いつも同じ見た目の大きさ（CSS の --inv。camApply が毎フレーム更新）
    const ped = !!T.pedestal, base = T.base && T.base.src ? T.base : null;   // 共通の台座（地面 → 薄い接地影 → 石の台座（厚み）→ 金属の縁 → マスの絵）。base＝正式の共通土台の画像（2026-10-03。有れば CSS の台座の代わりに敷く）
    return ids.map((id) => {
      const n = g.nodes[id], key = tileKeyOf(m, id); if (key === 'start') return '';
      const dk = T.discs ? discKeyOf(m, id, key) : null, dsrc = dk && (T.discs[dk] || T.discs[key]);
      if (dsrc) { const B = tok ? { w: tok, h: tok * (T.fixedSize.aspect || 0.78) } : discBox(T, n, sc); return `<i class="chf-tile disc${fx}" data-id="${id}" data-type="${key}" style="left:${(n.mx * sc.w).toFixed(1)}px;top:${(n.my * sc.h).toFixed(1)}px;width:${B.w.toFixed(1)}px;height:${B.h.toFixed(1)}px;--d:${n.d}"><img class="chf-ticon" src="${esc(dsrc)}" alt="" draggable="false" decoding="async"></i>`; }
      const src = tileSpriteOf(cfg, key), B = tileBox(T, n, key, sc), no = g.order.indexOf(id) + 1;
      if (tok) { B.w = tok * 1.12; B.h = B.w * B.f; B.rim = Math.max(1.2, B.w * ((T.size && T.size.rim) || 0.018)); B.op = 1; }
      const box = `left:${(n.mx * sc.w).toFixed(1)}px;top:${(n.my * sc.h).toFixed(1)}px;width:${B.w.toFixed(1)}px;height:${B.h.toFixed(1)}px;--d:${n.d};--f:${B.f.toFixed(3)}${ped ? `;--th:${B.th.toFixed(1)}px;--rim:${B.rim.toFixed(1)}px;--op:${B.op.toFixed(2)}` : ''}`;
      const under = base ? `<img class="chf-tbase" src="${esc(base.src)}" alt="" draggable="false" decoding="async" style="--bs:${base.scale || 1.25};--bh:${base.h || 1.25};--bl:${base.lift != null ? base.lift : 0.43}">` : ped ? '<i class="chf-tsh"></i><i class="chf-tped"></i>' : '';
      const u = T.size && T.size.uniform ? ' u' : '';   // 大きさの共通の基準（size.uniform）と、見え方を少し強くする CSS（.u）
      if (src) return `<i class="chf-tile${ped ? ' ped' : ''}${base ? ' pb' : ''}${u}${fx}" data-id="${id}" data-type="${key}" style="${box}${base ? `;--bi:${base.icon || 0.9}` : ''}">${under}<img class="chf-ticon" src="${esc(src)}" alt="" draggable="false" decoding="async"></i>`;   // 使ったマス（能力・イベント・宝箱）は chfBoard で .used（少し暗く）
      if (ped && key === 'normal') return `<i class="chf-tile ped k-normal${base ? ' pb' : ''}${u}${fx}" data-id="${id}" data-type="normal" style="${box}">${under}${base ? '' : '<i class="chf-tface"></i>'}</i>`;   // 通常マス：絵は無く、土台（または台座の石の面）だけ   // 通常マス：絵は無く、台座の石の面だけ（控えめ）
      return T.placeholder === false && !debug() ? '' : `<i class="chf-tile ph" data-id="${id}" data-type="${key}" style="${box}" title="仮表示（位置確認用）"><b>仮 #${no}</b></i>`;
    }).join('');
  }
  /** 今いるマスだけ縁を少し明るく（.cur） */
  function markCur(id) { document.querySelectorAll('#chf .chf-tile.cur').forEach((e) => { if (e.dataset.id !== id) e.classList.remove('cur'); }); const t = document.querySelector(`#chf .chf-tile[data-id="${id}"]`); if (t) t.classList.add('cur'); }
  /** 分岐の道（config.branches[].options の id）どうしが同じ分かれ道か */
  function sameBranchGroup(cfg, a, b) { return (cfg.branches || []).some((B) => B.options.some((o) => o.id === a) && B.options.some((o) => o.id === b)); }
  /** 分岐の道の上の物を隠すか：その分かれ道でまだ道を選んでいない間は、どちらの道の物も隠す（選ぶ前に両方の道の全体を見せない） */
  function branchHidden(cfg, n, fb) { return !!(n && n.branch && !(fb && sameBranchGroup(cfg, n.branch, fb))); }
  function sceneHtml(m, fieldId) {
    const cfg = MMCH.configFor(m), g = MMCH.graphFor(m), sc = sceneOf(cfg, fieldId), PXk = PX();
    const env = (cfg.landmarks[fieldId] || []), back = env.filter((L) => L.layer !== 'front' && (L.haze || 0) >= 0.15), road = env.filter((L) => L.layer !== 'front' && (L.haze || 0) < 0.15), front = env.filter((L) => L.layer === 'front');
    const ids = g.order.filter((id) => g.nodes[id].field === fieldId), fb = MMCH.fieldOf(m).branch;
    // 分岐の道の物：選ぶ前はどちらの道も出さない（.brhide。選んだ道だけ chfPick で現れる）。選んだ後は、選ばなかった道の物を出さない
    const objs = ids.filter((id) => !(fb && g.nodes[id].branch && sameBranchGroup(cfg, g.nodes[id].branch, fb) && g.nodes[id].branch !== fb)).map((id) => { const h = nodeObjHtml(cfg, g, sc, m, id); return branchHidden(cfg, g.nodes[id], fb) ? h.replace('class="chf-obj ', 'class="chf-obj brhide ') : h; }).join('');
    const fg = ((cfg.foreground || {})[fieldId] || []).map((F, i) => fgHtml(cfg, sc, F, i)).join('');
    const dbg = debug() ? ids.map((id) => { const n = g.nodes[id]; return `<i class="chf-dbg k-${n.kind}" style="left:${n.x * sc.w}px;top:${n.y * sc.h}px"><b>${id}<small> #${g.order.indexOf(id)}</small></b></i>`; }).join('') + debugRoutes(g, sc, ids) + '<i class="chf-dbgcam" id="chfdbgcam"></i>' : '';
    const farBand = sc.farBand ? `<div class="chf-pg chf-far" data-k="${sc.farBand.k != null ? sc.farBand.k : PXk.far}"><img class="chf-farimg" src="${sc.bg}" alt="" draggable="false" style="--to:${((sc.farBand.to || 0.34) * 100).toFixed(1)}%"></div>` : '';
    return `<div class="chf-cam" id="chfcam" style="width:${sc.w}px;height:${sc.h}px">${farBand}<img class="chf-bg" src="${sc.bg}" alt="${esc(sc.name)}" draggable="false">
      <div class="chf-pg chf-back" data-k="${PXk.back}">${back.map((L, i) => envHtml(cfg, sc, L, i)).join('')}</div>
      <div class="chf-pg chf-road" data-k="${PXk.road}">${tilesHtml(cfg, g, sc, m, ids)}${road.map((L, i) => envHtml(cfg, sc, L, i)).join('')}${objs}${fg}${dbg}
        <div class="chf-mon${spriteSetOf(m) ? ' spr' : ''}" id="bmonw" style="--mh:${monH()}px"><i class="chf-msh"></i><div class="chf-flip"><div class="chf-lean"><div class="chf-bob"><div class="mon">${monHtml(m)}</div></div></div></div></div></div>
      <div class="chf-pg chf-front" data-k="${PXk.front}">${front.map((L, i) => envHtml(cfg, sc, L, i)).join('')}</div>
      <div class="chf-fx" id="chffx"></div></div>`;
  }
  function debugRoutes(g, sc, ids) {
    const segs = [];
    for (const id of ids) for (const to of (g.conn[id] || [])) { const r = MMCH.routeBetween(g, id, to); if (r.length) segs.push(`<polyline points="${r.map((p) => `${(p[0] * sc.w).toFixed(1)},${(p[1] * sc.h).toFixed(1)}`).join(' ')}"/>`); }
    // 道路中央ライン（太い線）・道の端（点線）・背景の範囲の横線（enter＝青・playable＝緑・handoff＝橙・exit＝赤）
    const C = sc.road && Array.isArray(sc.road.center) ? [...sc.road.center].sort((a, b) => b[0] - a[0]) : [], pl = (f) => C.map((c) => `${(f(c) * sc.w).toFixed(1)},${(c[0] * sc.h).toFixed(1)}`).join(' ');
    const road = C.length ? `<polyline class="ctr" points="${pl((c) => c[1])}"/>${C.every((c) => Number.isFinite(c[2])) ? `<polyline class="edge" points="${pl((c) => c[1] - c[2])}"/><polyline class="edge" points="${pl((c) => c[1] + c[2])}"/>` : ''}` : '';
    const P = sc.play || {}, hl = (y, k, t) => (Number.isFinite(y) && y > 0 ? `<line class="${k}" x1="0" x2="${sc.w}" y1="${(y * sc.h).toFixed(1)}" y2="${(y * sc.h).toFixed(1)}"/><text class="${k}" x="6" y="${(y * sc.h - 6).toFixed(1)}">${t} ${y}</text>` : '');
    const lines = hl(P.enter, 'enter', 'enter') + (P.playable ? hl(P.playable[0], 'play', 'playable') + hl(P.playable[1], 'play', 'playable') : '') + hl(P.handoff, 'handoff', 'handoff') + hl(P.exit, 'exit', 'exit');
    return `<svg class="chf-dbgsvg" width="${sc.w}" height="${sc.h}" viewBox="0 0 ${sc.w} ${sc.h}">${road}${lines}${segs.join('')}</svg>`;
  }
  /** 開発用：カメラの注視点（背景の画素）と今の背景の札 */
  function dbgCam() { const c = $('#chfdbgcam'); if (c) { c.style.left = `${V.tgt.x.toFixed(1)}px`; c.style.top = `${V.tgt.y.toFixed(1)}px`; } }
  function dbgScene() {
    if (!V.dbg) return; const fv = $('#chf'); if (!fv || !V.sc) return; let b = $('#chfdbgsc'); if (!b) { fv.insertAdjacentHTML('beforeend', '<div class="chf-dbgsc" id="chfdbgsc"></div>'); b = $('#chfdbgsc'); }
    const P = V.sc.play || {}; b.textContent = `scene ${V.sc.key || V.sc.id}「${V.sc.name}」 node ${(($('#bmonw') || {}).dataset || {}).node || '-'} playable ${(P.playable || []).join('〜')} handoff ${P.handoff != null ? P.handoff : '-'}`;
  }
  function overlayHtml(cfg, m) {
    const f = MMCH.fieldOf(m), o = f && f.branch && (cfg.branchOverlays || {})[f.branch];
    return o && o.field === V.field ? `<div class="chf-canopy" style="background-image:url(${asset(cfg, o.asset)});opacity:${o.opacity || 1}"></div>` : '';
  }
  /** 次のフィールドの画像を先読み（1回だけ） */
  function preloadField(cfg, fieldId) {
    const sc = sceneOf(cfg, fieldId); if (!sc || V.pre.has(`${cfg.chapterId}:${cfg.patternId}:${fieldId}`)) return;
    V.pre.add(`${cfg.chapterId}:${cfg.patternId}:${fieldId}`);
    [sc.bg, ...(cfg.landmarks[fieldId] || []).map((L) => asset(cfg, L.asset))].forEach((src) => { const im = new Image(); im.decoding = 'async'; im.src = src; });
  }
  function buildScene(m, fieldId, keepVeil, keepOld) {
    const fv = $('#chf'); if (!fv) return;
    V.field = fieldId; V.sc = sceneOf(V.cfg, fieldId); V.seedTuft = (MMCH.fieldOf(m).layoutSeed + fieldId * 97) >>> 0;
    SPR.set = spriteSetOf(m); SPR.frame = -1;   // 歩行スプライト（種族ごと。無ければ従来の画像）
    fv.querySelectorAll((keepVeil ? '.chf-cam,.chf-canopy' : '.chf-cam,.chf-canopy,.chf-veil').split(',').map((q) => (keepOld ? `${q}:not(.chf-xout)` : q)).join(',')).forEach((e) => e.remove());   // keepOld：クロスフェード中の前の背景（.chf-xout）は残す（前の背景の上で消えていく）   // 前のフィールドの DOM は捨てる（画像を積み上げない）。背景の切り替え中（keepVeil）は暗転を残し、新しい背景の上で明けていく（以前は暗転ごと消えて、真っ暗から新しい背景へ一瞬で切り替わっていた）
    fv.insertAdjacentHTML('afterbegin', sceneHtml(m, fieldId) + overlayHtml(V.cfg, m));
    V.par0 = null; V.focus = null;
    for (const f of MMCH.nextFields(V.g, fieldId)) preloadField(V.cfg, f);   // 次に入る背景（つながりの先。背景IDの連番は前提にしない）
    preloadChests(fv);
    { const R = (V.cfg.battleTypes || {}).rival || {}; for (const k of [R.encounterFigure, R.encounterPartner]) { const u = k && asset(V.cfg, k); if (u && typeof Image !== 'undefined') { const im = new Image(); im.decoding = 'async'; im.src = u; } } }   // 2026-10-05 PHASE B：ライバルの遭遇の立ち絵を先に読む（遭遇の瞬間に読み込みが間に合わず出ない、を防ぐ）
  }
  /** 宝箱の開封アニメーションの絵を先に読む（開ける瞬間に絵が抜けないように。同じ絵は1回だけ） */
  const CHEST_PRE = new Set();
  function preloadChests(fv) {
    if (typeof Image === 'undefined') return;
    fv.querySelectorAll('.chf-obj:not(.used) img[data-frames]').forEach((im) => im.dataset.frames.split('|').forEach((src) => {
      if (!src || CHEST_PRE.has(src)) return; CHEST_PRE.add(src); const x = new Image(); x.decoding = 'async'; x.src = src;
    }));
  }

  // ---------------------------------------------------------
  // カメラ（rAF で滑らかに追従。モンスターに固定せず、少し遅れて・少し先を見る）
  // ---------------------------------------------------------
  function zoomAt(sc, d) { const c = sc.depth, dmin = c[c.length - 1][1], t = clamp((d - dmin) / (1 - dmin), 0, 1); return sc.zoom.far + (sc.zoom.near - sc.zoom.far) * t; }
  function viewport() { const fv = $('#chf'); return fv ? { W: fv.clientWidth, H: fv.clientHeight } : { W: 390, H: 680 }; }
  /** 注視点（背景の画素）：モンスターの体の中心 ＋ 進む向きの先読み ＋ 停止地点の物のほうへの寄り */
  function focusPoint(px, py, d) {
    const C = CA(), { W } = viewport(), S0 = V.cam.S || 1, mh = monH() * d;
    let fx = px, fy = py - mh * 0.45;
    const la = (C.lookAhead * W) / S0;   // 先読み（画面幅の一定割合を背景の画素へ）
    fx += V.look[0] * la; fy += V.look[1] * la * 0.8;
    if (V.focus) { fx += (V.focus.x - fx) * V.focus.mix; fy += (V.focus.y - fy) * V.focus.mix; }
    return [fx, fy];
  }
  function camApply() {
    const cam = $('#chfcam'); if (!cam || !V.sc) return;
    const { W, H } = viewport(), sc = V.sc, C = CA(), base = Math.max(W / sc.w, H / sc.h), d = V.monPos ? V.monPos.d : 1;
    const S = base * zoomAt(sc, d) * V.cam.z;
    let tx = W / 2 - V.cam.x * S, ty = H * C.anchorY - V.cam.y * S;
    tx = sc.w * S <= W ? (W - sc.w * S) / 2 : clamp(tx, W - sc.w * S, 0);
    const top = sc.play && sc.play.exit ? -sc.play.exit * sc.h * S : 0;   // play.exit＝この背景のカメラが見てよい奥の端（0＝画像の上端まで）
    const lo = H - sc.h * S - (V.camLoose || 0);   // camLoose：下の選択シートに隠れる高さだけ、画像の下端より下まで動いてよい（分かれ道。見えない所なので空白は見えない）
    ty = sc.h * S <= H ? (H - sc.h * S) / 2 : clamp(ty, lo, Math.max(lo, top));
    V.cam.S = S; V.cam.tx = tx; V.cam.ty = ty;
    cam.style.transform = `translate3d(${tx.toFixed(2)}px,${ty.toFixed(2)}px,0) scale(${S.toFixed(4)})`;
    cam.style.setProperty('--inv', (1 / S).toFixed(4));   // 2026-10-08：マス（.chf-tile.fx）だけカメラの拡大を打ち消す＝手前でも奥でも同じ見た目の大きさ（transform だけ＝レイアウトの再計算なし）
    if (V.dbg) dbgCam(tx, ty, S);
    // 視差：グループごとに少し違う速さ（フィールドに入った時のカメラ位置からの差で動かす）
    if (!V.par0) V.par0 = { tx, ty };
    const dx = (tx - V.par0.tx) / S, dy = (ty - V.par0.ty) / S;
    cam.querySelectorAll('.chf-pg').forEach((pg) => { const k = parseFloat(pg.dataset.k); if (!Number.isFinite(k) || k === 1) return; pg.style.transform = `translate3d(${(dx * (k - 1)).toFixed(2)}px,${(dy * (k - 1)).toFixed(2)}px,0)`; });
    const cp = $('#chf .chf-canopy'); if (cp) { const k = PX().canopy; cp.style.transform = `translate3d(${(dx * (k - 1) * S * 0.5).toFixed(2)}px,${(dy * (k - 1) * S * 0.5).toFixed(2)}px,0)`; }
  }
  function camTick(now) {
    V.raf = 0;
    const dt = Math.min(64, now - (V.last || now)); V.last = now;
    const C = CA(), tau = V.moving ? C.followTau : C.settleTau, k = 1 - Math.exp(-dt / tau), kz = 1 - Math.exp(-dt / C.zoomTau);
    if (now >= V.hold) { V.cam.x += (V.tgt.x - V.cam.x) * k; V.cam.y += (V.tgt.y - V.cam.y) * k; }
    V.cam.z += (V.tgt.z - V.cam.z) * kz;
    camApply();
    const done = Math.abs(V.tgt.x - V.cam.x) < 0.15 && Math.abs(V.tgt.y - V.cam.y) < 0.15 && Math.abs(V.tgt.z - V.cam.z) < 0.0005 && !V.moving;
    if (done) { V.cam.x = V.tgt.x; V.cam.y = V.tgt.y; V.cam.z = V.tgt.z; camApply(); V.last = 0; }
    else V.raf = requestAnimationFrame(camTick);
  }
  function camKick() { if (!V.raf && $('#chfcam')) { V.last = 0; V.raf = requestAnimationFrame(camTick); } }
  /** 注視点を更新（instant：その場で合わせる＝再読み込み・背景の切り替え・視差効果を減らす設定） */
  function camTarget(px, py, d, instant) {
    const [fx, fy] = focusPoint(px, py, d);
    V.tgt.x = fx; V.tgt.y = fy;
    if (instant || V.calm) { V.cam.x = fx; V.cam.y = fy; V.cam.z = V.tgt.z; V.hold = 0; if (V.raf) { cancelAnimationFrame(V.raf); V.raf = 0; } camApply(); }
    else camKick();
  }
  function camZoom(kind) { V.tgt.z = CA().zoom[kind] != null ? CA().zoom[kind] : 1; if (!V.calm) camKick(); else { V.cam.z = V.tgt.z; camApply(); } }
  /** 停止地点の物のほうへ少し寄る（mix＝寄せる割合）。null で戻す */
  function camFocus(obj, mix, zoom) {
    if (obj && obj.x != null) { V.focus = { x: obj.x, y: obj.y, mix: mix != null ? mix : CA().focusMix }; if (zoom) V.tgt.z = zoom; }
    else { V.focus = null; V.tgt.z = CA().zoom.idle; }
    if (V.monPos) camTarget(V.monPos.x, V.monPos.y, V.monPos.d, false);
  }

  // ---------------------------------------------------------
  // モンスター（位置・向き・歩きの見た目）
  // ---------------------------------------------------------
  /** 歩きの見た目の差し込み口。正式な歩行アニメ（idle／walk／run のスプライト）が届いたら registerMonsterAnimator({ set(el, state, info) }) で差し替える。移動・カメラの処理は変えない */
  const DEFAULT_ANIMATOR = {
    id: 'css',
    /** state：idle／ready／walk／land／rest。info：{ speed（0〜1）, dir:[dx,dy], calm } */
    set(el, state, info) {
      if (!el) return;
      el.classList.remove('rest', 'ready', 'walk', 'land');
      if (state !== 'idle') el.classList.add(state);
      if (state === 'walk') el.style.setProperty('--spd', String(clamp((info && info.speed) || 1, 0.6, 1.4)));
    },
  };
  /**
   * 歩行スプライトの再生（config.monsterSprites。その場歩行の絵を順に切り替えるだけ。フィールド上の位置は moveAlong が動かす）。
   *  walk の間だけ frames を 01→…→末尾→01 とループ（fps × 歩く速さ。歩き出し・止まる前の減速では少しゆっくり）。それ以外（idle／ready／land／rest）は止めて idle の絵（既定 01）
   */
  const SPR = { raf: 0, phase: 0, last: 0, speed: 1, frame: -1, set: null };
  function sprShow(i) {
    const box = $('#bmonw .chf-spr'); if (!box || !SPR.set) return;
    if (box.dataset.f === String(i + 1)) { SPR.frame = i; return; }
    const next = box.querySelector(`img[data-i="${i}"]`); if (!next || !next.complete) return;   // 読み込み前のコマには切り替えない（ちらつきを防ぐ）
    const cur = box.querySelector('img.on'); if (cur) cur.classList.remove('on');
    next.classList.add('on'); box.dataset.f = String(i + 1); SPR.frame = i;
  }
  function sprTick(now) {
    const set = SPR.set; if (!set) { SPR.raf = 0; return; }
    const dt = Math.min(100, now - (SPR.last || now)); SPR.last = now;
    SPR.phase += (dt / 1000) * (set.fps || 12) * (0.55 + 0.45 * clamp(SPR.speed, 0, 1));
    sprShow(Math.floor(SPR.phase) % set.frames.length);
    SPR.raf = requestAnimationFrame(sprTick);
  }
  function sprStop() { if (SPR.raf) cancelAnimationFrame(SPR.raf); SPR.raf = 0; SPR.phase = 0; SPR.last = 0; if (SPR.set) sprShow(SPR.set.idle || 0); }
  const SPRITE_ANIMATOR = {
    id: 'sprite',
    set(el, state, info) {
      DEFAULT_ANIMATOR.set(el, state, info);   // 影・構え・着地の CSS はそのまま（上下動は絵に任せる＝.spr では止める）
      if (!el || !el.querySelector('.chf-spr')) { sprStop(); return; }
      if (state === 'walk' && !(info && info.calm)) {
        SPR.speed = (info && info.speed != null) ? info.speed : 1;
        if (!SPR.raf) { SPR.last = 0; SPR.raf = requestAnimationFrame(sprTick); }
      } else if (SPR.raf || SPR.frame !== (SPR.set.idle || 0)) sprStop();
    },
  };
  function registerMonsterAnimator(a) { if (!a || typeof a.set !== 'function') throw new Error('MMCHV：animator は set(el, state, info) を持つこと'); V.animator = a; }
  const anim = (state, info) => (V.animator || (SPR.set ? SPRITE_ANIMATOR : DEFAULT_ANIMATOR)).set($('#bmonw'), state, info);
  const monW = () => ((V.cfg && V.cfg.monster && V.cfg.monster.w) || monH() * 0.8);
  /** 道の安全域に収めた x（背景の画素）。体の半幅ぶん内側（fieldScenes[].road が無い背景はそのまま） */
  function roadX(x, y, d) { if (!V.sc || !V.sc.road || !MMCH.clampToRoad) return x; return MMCH.clampToRoad(V.sc, x / V.sc.w, y / V.sc.h, (monW() * d * 0.5) / V.sc.w).x * V.sc.w; }
  function setMonPos(x, y, d) {
    const w = $('#bmonw'); if (!w) return;
    x = roadX(x, y, d);
    V.monPos = { x, y, d };
    w.style.left = `${x.toFixed(1)}px`; w.style.top = `${y.toFixed(1)}px`; w.style.zIndex = String(Math.round(y) + 1);
    w.style.setProperty('--d', d.toFixed(3));
  }
  function depthAtY(y) { return MMCH.depthOf(V.sc, y / V.sc.h); }
  function face(dx) {
    if (Math.abs(dx) < 3) return;
    const right = dx > 0, flip = FACING === 'left' ? right : !right, fl = $('#bmonw .chf-flip');
    if (fl) fl.classList.toggle('r', SPR.set && SPR.set.noFlip ? false : flip);   // 後ろ姿の歩行スプライトは左右反転しない（尻尾の位置が入れ替わるため）
    V.facing = right ? 1 : -1;
  }
  function lean(deg) { if (SPR.set && SPR.set.noFlip) deg = 0; const l = $('#bmonw .chf-lean'); if (l) l.style.setProperty('--lean', `${deg.toFixed(2)}deg`); }
  /** 今いる地点に置く（再読み込み・戻ってきたとき）。向きは次の地点のほう */
  function placeMon(id, instant) {
    const n = V.g && V.g.nodes[id]; if (!n || !$('#bmonw')) return;
    const x = n.mx * V.sc.w, y = n.my * V.sc.h;
    setMonPos(x, y, n.d); $('#bmonw').dataset.node = id;
    const nx = (V.g.conn[id] || []).map((k) => V.g.nodes[k]).find((q) => q && q.field === n.field);
    if (nx) { const dx = (nx.mx - n.mx) * V.sc.w, dy = (nx.my - n.my) * V.sc.h, L = Math.hypot(dx, dy) || 1; V.look = [dx / L, dy / L]; face(dx); }
    lean(0); anim('idle');
    camTarget(x, y, n.d, instant);
  }
  /** 点列（背景の画素）に沿って歩く。ms：かかる時間、prof：速度の形（[加速の割合, 減速の割合]） */
  function moveAlong(pts, ms, prof) {
    return new Promise((ok) => {
      const seg = [0]; for (let i = 1; i < pts.length; i++) seg.push(seg[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
      const total = seg[seg.length - 1] || 1, [a, b] = prof, vmax = 1 / (1 - a / 2 - b / 2);
      const f = (t) => (t < a ? vmax * t * t / (2 * a) : t < 1 - b ? vmax * (a / 2 + (t - a)) : 1 - vmax * (1 - t) * (1 - t) / (2 * b));
      const vel = (t) => (t < a ? vmax * t / a : t < 1 - b ? vmax : vmax * (1 - t) / b);
      const t0 = performance.now(); let raf = 0;
      const at = (s) => { for (let i = 1; i < pts.length; i++) if (s <= seg[i]) { const r = (seg[i] - seg[i - 1]) ? (s - seg[i - 1]) / (seg[i] - seg[i - 1]) : 0; return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * r, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * r, i]; } const e = pts[pts.length - 1]; return [e[0], e[1], pts.length - 1]; };
      const frame = (now) => {
        const t = clamp((now - t0) / ms, 0, 1), s = f(t) * total, [x, y, i] = at(s), prev = V.monPos || { x, y };
        const dx = x - prev.x, dy = y - prev.y;
        setMonPos(x, y, depthAtY(y));
        if (Math.hypot(dx, dy) > 0.5) { const L = Math.hypot(dx, dy); V.look = [dx / L, dy / L]; face(dx); }
        lean(V.calm ? 0 : 4 * vel(t) / vmax);   // 速いほど少し前傾
        anim('walk', { speed: vel(t) / vmax, dir: V.look, calm: V.calm });
        if (!V.calm) camTarget(x, y, V.monPos.d, false);
        if (t < 1) raf = requestAnimationFrame(frame); else { if (V.calm) camTarget(x, y, V.monPos.d, true); ok(); }
      };
      raf = requestAnimationFrame(frame);
    });
  }
  /** 1地点ぶんの時間：画面上の距離と地形で 200〜350ms（config.motion） */
  function stepDuration(pts, toId) {
    const M = MO(), n = V.g.nodes[toId], T = M.terrain[n.terrain] || M.terrain.grass, S = V.cam.S || 1;
    let len = 0; for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    const rel = T.fixed ? 1 : Math.pow(clamp((len * S) / M.baseLen, 0.55, 1.8), 0.6);
    return clamp(M.stepMs * rel / (T.speed || 1), M.minMs, M.maxMs) * (V.calm ? 0.5 : 1);
  }
  /**
   * 1地点ぶん歩く（first：この出目の最初の一歩＝構えてから加速、last：最後の一歩＝減速して着地）。
   * 別のフィールドへ入るときは switchField（端まで歩く → 暗転 → 入口の手前から歩いて入る）
   */
  async function walkTo(m, id, first, last) {
    const n = V.g.nodes[id]; if (!n) return;
    const w = $('#bmonw'), cur = w && w.dataset.node;
    if (first && V.pickLean) { await wait(V.pickLean); V.pickLean = 0; V.focus = null; }   // 分岐で選んだ道のほうへ寄ってから（寄りを解いて歩き出す。選んだ道が次の背景でも同じ）
    if (n.field !== V.field) {
      await switchField(m, n.field, id, cur, last);
      if (last) { V.moving = false; lean(0); anim('land'); camZoom('stop'); await wait(V.calm ? 20 : MO().landMs); anim('idle'); }   // 背景をまたいで止まるときも歩きを止めて停止の姿勢へ
      return;
    }
    const route = MMCH.routeBetween(V.g, cur, id).map((p) => [p[0] * V.sc.w, p[1] * V.sc.h]);
    const pts = route.length >= 2 ? route : [[V.monPos.x, V.monPos.y], [n.mx * V.sc.w, n.my * V.sc.h]];
    const M = MO(), C = CA();
    if (first) {   // 構え：進む向きを見て、少し溜めてから歩き出す。カメラは少し引き、少し遅れて追いかける
      const dx = pts[pts.length - 1][0] - pts[0][0]; face(dx);
      anim('ready'); camZoom('move'); V.moving = true;
      await wait(V.calm ? 20 : M.windupMs);
      V.hold = performance.now() + (V.calm ? 0 : C.followDelay);   // 歩き出してから少し遅れて追いかける
    }
    await moveAlong(pts, stepDuration(pts, id), [first ? 0.3 : 0.05, last ? 0.3 : 0.05]);
    if (w) w.dataset.node = id; markCur(id); if (!last) feel('step', { id });   // 1マスごとの足音（出来事 step → SE STEP）。止まるマスでは鳴らさない（止まった音と重ねない）
    if (last) {   // 着地：小さな上下動のあと、目的地点へ軽く寄る
      V.moving = false; lean(0); anim('land'); camZoom('stop');
      await wait(V.calm ? 20 : M.landMs);
      anim('idle'); setTimeout(() => { if (V.tgt.z === CA().zoom.stop && !V.focus) camZoom('idle'); }, 700);
    }
    const ov = $('#chf .chf-canopy'), f = MMCH.fieldOf(m);
    if (!ov && f && f.branch && (V.cfg.branchOverlays || {})[f.branch] && V.cfg.branchOverlays[f.branch].field === V.field) { const fv = $('#chf'); if (fv) fv.insertAdjacentHTML('beforeend', overlayHtml(V.cfg, m)); }
    const nx = (V.g.conn[id] || []).map((k) => V.g.nodes[k]).find((x) => x && x.field !== V.field); if (nx) preloadField(V.cfg, nx.field);
  }
  /**
   * 背景の切り替え（クロスフェード。config.backgroundTransition.type 'crossfade'。2026-10-02 Chapter 1）：止まらずに歩き続けたまま、景色だけが前の背景から次の背景へ溶けて変わる。
   *  1) 前の背景の最後のマスから、進む向きへそのまま歩き続ける（減速しない）
   *  2) 次の背景を前の背景の「下」に作る。モンスターは次の背景の入口の少し手前に置き、画面上の位置が前の背景のモンスターと重なるようにカメラを合わせる
   *  3) 前の背景（上）を ms かけて透明にしながら、次の背景の入口のマスへ歩いて入る（カメラはいつもの追従で自然に戻る）。背景の境目はマスではない（出目に数えない）
   */
  // ---- 2026-10-08（正式ボード）：背景ごとの play＝{ enter, playable, handoff, exit }（config.fieldScenes[].play）。歩く道は道路中央ライン（road）から作る ----
  /** 道路中央ライン上の点（背景の画素）。r＝半幅に対する横の位置（-1〜1。左右の道はその割合を保つ） */
  function roadPt(sc, y, r) { const R = MMCH.roadAt(sc, y); return R ? [(R.x + r * R.half) * sc.w, y * sc.h] : null; }
  /** ノードが道のどこにあるか（中央＝0・左右の道＝±LANE_K） */
  function laneRatio(sc, n) { const R = n && MMCH.roadAt(sc, n.y); return R && R.half > 0 ? clamp((n.x - R.x) / R.half, -0.9, 0.9) : 0; }
  /** y0 → y1 の道路中央ラインに沿った点列（同じ横の割合 r） */
  function roadSpan(sc, y0, y1, r) { const pts = [], k = Math.max(2, Math.ceil(Math.abs(y1 - y0) / 0.012)); for (let i = 0; i <= k; i++) { const p = roadPt(sc, y0 + (y1 - y0) * i / k, r); if (p) pts.push(p); } return pts; }
  /** 点列を歩く時間：マスの間（約1列ぶん）と同じ速さ。k＝倍率 */
  function spanMs(pts, k) { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); const M = MO(); return V.calm ? 40 : clamp(M.stepMs * (L / 117) * (k || 1), 200, 620); }
  /** 次の背景の画像を先にデコード（最大 0.45秒。溶ける途中で空の画面・白を見せない） */
  function bgReady(sc) {
    if (!sc || typeof Image === 'undefined') return Promise.resolve();
    const im = new Image(); im.decoding = 'async'; im.src = sc.bg;
    const p = im.decode ? im.decode().catch(() => {}) : new Promise((ok) => { im.onload = im.onerror = ok; });
    return Promise.race([p, wait(450)]);
  }
  /**
   * 背景の切り替えのつなぎ（2026-10-08）：カメラは画像の端より外へ出せないため、次の背景の入口ではモンスターの画面の位置・大きさが前の背景と少し違うことがある。
   *  新しい背景のモンスターを、前の背景のモンスターと同じ画面の位置・大きさから始め、歩いて入る間に本来の位置・大きさへなめらかに戻す（individual transform の translate・scale だけ。
   *  道の上の位置・カメラ・進行には触れない）＝溶けている間に2匹が別の場所に見えない・瞬間移動に見えない。視差を減らす設定では何もしない
   */
  function matchCut(nm, oldPos, ms) {
    if (!nm || !oldPos || V.calm || !nm.animate || !(root.CSS && CSS.supports && CSS.supports('scale', '1'))) return;
    const r = nm.getBoundingClientRect(); if (!r.width || !r.height || !oldPos.height) return;
    const S = V.cam.S || 1, k = clamp(oldPos.height / r.height, 0.35, 2.5);
    const dx = (oldPos.left + oldPos.width / 2) - (r.left + r.width / 2), dy = oldPos.bottom - r.bottom;
    if (Math.abs(dx) < 2 && Math.abs(dy) < 2 && Math.abs(k - 1) < 0.03) return;
    // #bmonw の個別の translate は transform（奥行きの scale(--d)）より外側・カメラ（S 倍）の内側＝画面の px ÷ S（背景の画素）
    // 個別の scale は transform-origin（50% 94%＝箱の中の点）のまわりに縮むが、足元（止まる点）は transform の translate(-50%,-94%) で箱の原点へ動いている＝その差 (1 − k) × origin だけ足元がずれるので打ち消す
    const ox = nm.offsetWidth * 0.5, oy = nm.offsetHeight * 0.94, tx = dx / S - (1 - k) * ox, ty = dy / S - (1 - k) * oy;
    try { nm.animate([{ translate: `${tx.toFixed(1)}px ${ty.toFixed(1)}px`, scale: String(k.toFixed(3)) }, { translate: '0px 0px', scale: '1' }], { duration: Math.max(260, ms), easing: 'cubic-bezier(.25,.6,.3,1)' }); } catch (e) {}
  }
  /** 見せ場の視線誘導（fieldScenes[].cue）：入ってくる間だけ、カメラが少しそちらを見る。止まったら自然に戻す（操作は止めない） */
  function cueStart() { const c = !V.calm && V.sc && V.sc.cue; if (!c) return null; V.focus = { x: c.x * V.sc.w, y: c.y * V.sc.h, mix: c.mix != null ? c.mix : 0.2, cue: true }; return c; }
  function cueEnd(c) { if (!c) return; setTimeout(() => { if (V.focus && V.focus.cue) { V.focus = null; if (V.monPos) camTarget(V.monPos.x, V.monPos.y, V.monPos.d, false); } }, c.ms || 650); }
  /**
   * 背景の切り替え（クロスフェード。config.backgroundTransition.type 'crossfade'）：止まらずに歩き続けたまま、景色だけが前の背景から次の背景へ溶けて変わる。
   *  1) 前の背景の最後のマスから、道路中央ラインに沿って handoff（受け渡しの地点）まで歩く（減速しない）。同時に次の背景の画像をデコードしておく
   *  2) 次の背景を前の背景の「下」に作る。モンスターは次の背景の enter（入口の手前）に置き、画面上の位置が前の背景のモンスターと重なるようにカメラを合わせる
   *  3) 前の背景（上）を ms かけて透明にしながら、道路中央ラインに沿って入口のマスへ歩いて入る（カメラはいつもの追従で自然に戻る）。境目はマスではない（出目に数えない）
   *  play の無い背景（Chapter 2 など）は従来どおり（進む向きへ out だけ歩く → 入口の back 手前から歩いて入る）
   */
  async function crossField(m, fieldId, id, fromId, last) {
    const fv = $('#chf'); if (!fv) return;
    const M = MO(), T = V.cfg.backgroundTransition || {}, xf = V.calm ? 0 : (T.ms || 520), from = V.g.nodes[fromId], out = V.look, ext = (T.out != null ? T.out : 80) * (from ? from.d : 1);
    const dec = bgReady(sceneOf(V.cfg, fieldId));
    V.moving = true;
    const H0 = V.sc.play && from && from.field === V.field ? roadSpan(V.sc, from.y, V.sc.play.handoff, laneRatio(V.sc, from)) : null;
    if (H0 && H0.length >= 2) { H0[0] = [V.monPos.x, V.monPos.y]; await moveAlong(H0, spanMs(H0, 0.8), [0.05, 0.05]); }
    else { const p0 = [V.monPos.x, V.monPos.y], p1 = [p0[0] + out[0] * ext, p0[1] + out[1] * ext]; await moveAlong([p0, p1], V.calm ? 40 : (T.outMs || 260), [0.05, 0.05]); }
    await dec;
    const old = $('#chfcam'), om = $('#bmonw'), oldPos = om ? om.getBoundingClientRect() : null;
    if (old) { old.id = 'chfcam-old'; old.classList.add('chf-xout'); old.querySelectorAll('[id]').forEach((e) => { e.id = `${e.id}-old`; }); }
    buildScene(m, fieldId, true, true);
    const n = V.g.nodes[id], nx = (V.g.conn[id] || []).map((k) => V.g.nodes[k]).find((q) => q && q.field === fieldId);
    const ex = n.mx * V.sc.w, ey = n.my * V.sc.h;
    const E = V.sc.play && V.sc.play.enter > n.y ? roadSpan(V.sc, V.sc.play.enter, n.y, laneRatio(V.sc, n)) : null;
    let sx, sy, dir = out;
    if (E && E.length >= 2) { E[E.length - 1] = [ex, ey]; [sx, sy] = E[0]; const dx = E[1][0] - E[0][0], dy = E[1][1] - E[0][1], L = Math.hypot(dx, dy) || 1; dir = [dx / L, dy / L]; }
    else {
      if (nx) { const dx = (nx.mx - n.mx) * V.sc.w, dy = (nx.my - n.my) * V.sc.h, L = Math.hypot(dx, dy) || 1; dir = [dx / L, dy / L]; }
      const back = (T.back != null ? T.back : 90) * n.d; sx = ex - dir[0] * back; sy = ey - dir[1] * back;
    }
    V.look = dir; face(dir[0]);
    setMonPos(sx, sy, depthAtY(sy)); camTarget(sx, sy, V.monPos.d, true);
    anim('walk', { speed: 1, dir: dir, calm: V.calm }); if (SPR.set) sprShow(Math.floor(SPR.phase) % SPR.set.frames.length);   // 新しい背景のモンスターも最初のフレームから歩きの姿（前の背景と同じコマ）
    // 画面上のモンスターの位置は matchCut が前の背景と合わせる（2026-10-08：カメラはずらさない＝画像の端で止まったカメラが次のフレームで跳ねない）
    const nm = $('#bmonw');
    if (old) { if (xf) { old.style.transition = `opacity ${xf}ms ease-in-out`; void old.offsetWidth; old.style.opacity = '0'; setTimeout(() => old.remove(), xf + 40); } else old.remove(); }
    const cue = cueStart();
    const P = E && E.length >= 2 ? E : [[sx, sy], [ex, ey]], ems = V.calm ? 40 : Math.max(E ? spanMs(P, 0.85) : 0, M.enterMs, E ? 0 : (T.enterMs || 0));
    matchCut(nm, oldPos, ems);
    await moveAlong(P, ems, [0.05, last ? 0.3 : 0.05]);
    cueEnd(cue);
    if (nm) nm.dataset.node = id; markCur(id);
    const fd = $('#chfd'); if (fd) fd.textContent = V.sc.name;
    dbgScene();
  }
  async function switchField(m, fieldId, id, fromId, last) {
    if ((V.cfg.backgroundTransition || {}).type === 'crossfade') return crossField(m, fieldId, id, fromId, last);
    const fv = $('#chf'); if (!fv) return;
    const M = MO(), ms = (V.cfg.backgroundTransition || {}).ms || 700, half = V.calm ? 40 : ms * 0.42;
    // 1) 今のフィールドの端から、そのまま進む向きへ少し歩き続ける。カメラも前へ・少し寄る
    const from = V.g.nodes[fromId], out = V.look, ext = 70 * (from ? from.d : 1);
    fv.insertAdjacentHTML('beforeend', '<div class="chf-veil"></div>'); const veil = fv.querySelector('.chf-veil'); void veil.offsetWidth;
    V.tgt.z = CA().zoom.focus; V.moving = true;
    const p0 = [V.monPos.x, V.monPos.y], p1 = [p0[0] + out[0] * ext, p0[1] + out[1] * ext];
    veil.classList.add('on');
    await moveAlong([p0, p1], V.calm ? 40 : M.fadeMs, [0.05, 0.4]);
    await wait(half * 0.3);
    // 2) 次のフィールド：入口の少し手前（進む向きの後ろ）に置き、カメラはその場で合わせる
    buildScene(m, fieldId, true);
    const n = V.g.nodes[id], nx = (V.g.conn[id] || []).map((k) => V.g.nodes[k]).find((q) => q && q.field === fieldId);
    let dir = [0, -1]; if (nx) { const dx = (nx.mx - n.mx) * V.sc.w, dy = (nx.my - n.my) * V.sc.h, L = Math.hypot(dx, dy) || 1; dir = [dx / L, dy / L]; }
    V.look = dir; face(dir[0]);
    const ex = n.mx * V.sc.w, ey = n.my * V.sc.h, back = 64 * n.d, sx = ex - dir[0] * back, sy = ey - dir[1] * back;
    V.cam.z = CA().zoom.move; V.tgt.z = CA().zoom.idle;
    setMonPos(sx, sy, n.d); camTarget(sx, sy, n.d, true);
    const veil2 = fv.querySelector('.chf-veil'); if (veil2) { veil2.classList.add('on'); void veil2.offsetWidth; veil2.classList.remove('on'); setTimeout(() => veil2.remove(), V.calm ? 60 : ms * 0.6); }
    // 3) 入口へ歩いて入る（向きはそのまま）
    await moveAlong([[sx, sy], [ex, ey]], V.calm ? 40 : M.enterMs, [0.05, 0.3]);
    const w = $('#bmonw'); if (w) w.dataset.node = id; markCur(id);
    V.moving = false;
    const fd = $('#chfd'); if (fd) fd.textContent = V.sc.name;
  }

  // ---------------------------------------------------------
  // HUD・下の操作欄（command deck）
  // ---------------------------------------------------------
  /**
   * HUD（2026-10-03 品質向上で全面刷新）：上に細い進行ライン（START → GOAL。今の位置に育成中の子の小さな顔。進み具合は MMCH.progressOf＝道の上の位置）、
   *  その下に小さな情報のチップ（Turn・疲れ・所持金・特訓チケット）。背景を隠しすぎない。id（chturn・chfat・chgold）と .chh-turn・.chh-menu は従来どおり
   */
  const COIN_SVG = '<img class="chh-ic" src="./assets/ui/gold/coin.png" alt="" aria-hidden="true" draggable="false">';   // 2026-10-08 正式：お金（ゴールド）のアイコン（旧：SVG の硬貨）
  function faceSrc(m) { const sp = root.MMP10M && MMP10M.byId ? MMP10M.byId(m.sp) : null; return sp && sp.image ? sp.image.src : ''; }
  function hudHtml(m) {
    const r = m.raise, cfg = V.cfg, fat = MMCH.fatigue(m), lv = fat >= 80 ? 'hi' : fat >= 50 ? 'mid' : 'lo';
    const pr = MMCH.progressOf ? MMCH.progressOf(m) : null, pc = Math.round(clamp(pr ? pr.p : 0, 0, 1) * 1000) / 10, tix = (gS() && gS().trainTix) | 0, fs = faceSrc(m);
    return `<header class="chh" data-p="${pc}"><div class="chh-top"><div class="chh-l chh-prog"><div class="chh-cap"><small>Chapter <b>${cfg.chapterId}</b> / ${P7().CHAPTER_COUNT}</small><b class="chh-nm">${esc(cfg.title)}</b><span class="chh-fd" id="chfd">${esc(V.sc ? V.sc.name : '')}</span></div>
      <div class="chh-line" role="img" aria-label="ゴールまでの進み具合 ${Math.round(pc)}%"><span class="chh-se">START</span><div class="chh-track"><i class="chh-fill" style="width:${pc}%"></i><span class="chh-face" id="chface" style="left:${pc}%">${fs ? `<img src="${fs}" alt="" decoding="async">` : ''}</span></div><span class="chh-se g">GOAL</span></div></div>
      <button class="p9mbtn chh-menu" onclick="p9Menu()" aria-label="メニュー">☰</button></div>
      <div class="chh-r chh-chips"><div class="chh-turn chip">Turn <b id="chturn">${Math.min(r.turnsUsed + (P8().boardPhase(m) === 'roll' ? 1 : 0), r.turnLimit)}</b><small> / ${r.turnLimit}</small></div>
      <div class="chh-fat chip f-${lv}" id="chfat"><span>疲れ</span><b>${fat}</b><i style="--f:${fat}%"></i></div>
      <div class="chh-gold chip" id="chgold">${COIN_SVG}<b>${(gS() && gS().g) | 0}</b></div>
      <div class="chh-tix chip" id="chtix" title="特訓チケット"><span>特訓チケット</span><b>×${tix}</b></div></div></header>`;
  }
  function refreshHud(m) { const h = $('#chf-ui .chh'); if (h) h.outerHTML = hudHtml(m); }
  const ICON = {
    item: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 9h10l1.2 10.5a1 1 0 0 1-1 1.1H6.8a1 1 0 0 1-1-1.1Z"/><path d="M9 9V7a3 3 0 0 1 6 0v2"/><path d="M12 12v5"/></svg>',
    rest: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 16h16"/><path d="M6 16V9a2 2 0 0 1 2-2h5"/><path d="M13 7h3a3 3 0 0 1 3 3v6"/><path d="M5 20v-4M19 20v-4"/></svg>',
    skill: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19l9-9"/><path d="M13 5l6 6-3 3-6-6z"/><path d="M4 20l2-2"/><path d="M15 3l1.5 1.5M19.5 8L21 9.5"/></svg>',
    status: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19h16"/><path d="M7 16v-5M12 16V6M17 16v-8"/></svg>',
  };
  // 4コマンド（放射状）：左上＝アイテム、右上＝休む、左下＝技設定（既存の技管理 hall('w')）、右下＝ステータス（既存の hall('st')）。新しい画面は作らない
  const CMDS = [
    { k: 'item', cls: 'chitem', pos: 'tl', on: 'chfItems()', label: 'アイテム' },
    { k: 'rest', cls: 'chrest', pos: 'tr', on: 'chfRest()', label: '休む' },
    { k: 'skill', cls: 'chskill', pos: 'bl', on: 'chfOpen(\'w\')', label: '技設定' },
    { k: 'status', cls: 'chstatus', pos: 'br', on: 'chfOpen(\'st\')', label: 'ステータス' },
  ];
  const DIST = { 1: 'すぐ先まで進む', 2: '少し先まで進む', 3: 'ずっと先まで進む' };
  /**
   * 下の操作欄。中央は START（1タップでサイコロを振る）。サイコロは START を押すまで出さない（出現〜停止面〜移動の間、START は押せない）。
   *  config.deck（START の正式画像と押せる領域）があれば画像の操作欄、無ければ CSS の操作欄（Pattern・Chapter ごとに config だけで変えられる）
   */
  function deckHtml(m, ph, msg) {
    const r = m.raise, cfg = V.cfg;
    const canRoll = P8().canRoll(m), canRest = P8().canRest(m), tired = ph === 'roll' && !canRoll && MMCH.fatigue(m) >= 100, R = MMCH.rulesOf(cfg).fatigueRules;
    let def = '';
    if (ph === 'roll') def = r.turnsUsed === 0 ? `<b>${esc(cfg.title)}</b>　旅のはじまり。START でサイコロを振ろう。` : tired ? '疲れがたまって動けない…休もう。' : 'START でサイコロを振る。休むこともできる。';
    else if (ph === 'move' || ph === 'resolve') def = '移動中…';
    else if (ph === 'branch') def = `分かれ道だ。どちらへ進む？（のこり${r.pend.left}）`;
    else if (ph === 'battle') { const fx = r.pend.fx || {}, bt = (cfg.battleTypes || {})[fx.battleType || 'wild'] || { label: 'モンスター' }; def = `${esc(bt.label)}が現れた！`; }
    else if (ph === 'goal') def = '大会会場に着いた！'; else if (ph === 'timeup') def = `${r.turnLimit}ターンを使い切った…`;
    const rollOn = ph === 'roll' && canRoll, idle = ph === 'roll';
    const D = cfg.deck;
    if (D && D.start) {
      // 画像の操作欄：画像は飾り、押せる領域は透明なボタン（文字は読み上げ・テスト用に残し、見た目は画像）。サイコロの絵は置かない（START を押したときだけ MMCHD が出す）
      const H = D.hit || {}, box = (k) => { const h = H[k] || {}; return `style="left:${(h.x * 100).toFixed(1)}%;top:${(h.y * 100).toFixed(1)}%;width:${(h.w * 100).toFixed(1)}%;height:${(h.h * 100).toFixed(1)}%"`; };
      const center = ph === 'roll'
        ? `<div class="chstopw chstopw-img${rollOn ? ' on' : ''}" ${box('center')}><button class="chstop chstop-img" id="brollbtn" data-nsfx="1" onclick="chfRoll()"${canRoll ? '' : ' disabled'} aria-label="START（サイコロを振る）"><b>START</b></button></div>`
        : `<div class="chstopw chstopw-img" ${box('center')}><button class="chstop chstop-img wait" disabled aria-label="移動中"><b>${ph === 'move' || ph === 'resolve' ? r.pend.roll : '…'}</b></button></div>`;
      const wing = (c) => { const on = c.k === 'rest' ? canRest : idle; return `<button class="chwing chwing-img ${c.cls} chw-${c.pos}${c.k === 'rest' && tired ? ' must' : ''}" ${box(c.pos)} onclick="${c.on}"${on ? '' : ' disabled'}><b>${c.label}</b>${c.k === 'rest' ? `<small>疲れ −${R.rest}</small>` : ''}</button>`; };
      const ctl = `<div class="chcmd chcmd-img" style="--deckar:${D.aspect || 3.116}"><img class="chdeck-bg" src="${esc(D.start)}" alt="" draggable="false">${CMDS.map(wing).join('')}${center}</div>`;
      return `<div class="chdeck chdeck-img" id="chdock"><p class="chmsg" id="bmsg">${msg || def}</p>${ctl}</div>`;
    }
    const center = ph === 'roll'
      ? `<div class="chstopw${rollOn ? ' on' : ''}"><button class="chstop" id="brollbtn" data-nsfx="1" onclick="chfRoll()"${canRoll ? '' : ' disabled'} aria-label="START（サイコロを振る）"><span class="chstop-rim"></span><span class="chstop-dome"></span><b>START</b></button><small class="chstop-cap">サイコロを振る</small></div>`
      : `<div class="chstopw"><button class="chstop wait" disabled aria-label="移動中"><span class="chstop-rim"></span><span class="chstop-dome"></span><b>${ph === 'move' || ph === 'resolve' ? r.pend.roll : '…'}</b></button></div>`;
    const wing = (c) => { const on = c.k === 'rest' ? canRest : idle; return `<button class="chwing ${c.cls} chw-${c.pos}${c.k === 'rest' && tired ? ' must' : ''}" onclick="${c.on}"${on ? '' : ' disabled'}>${ICON[c.k]}<b>${c.label}</b>${c.k === 'rest' ? `<small>疲れ −${R.rest}</small>` : ''}</button>`; };
    const ctl = `<div class="chcmd">${CMDS.filter((c) => c.pos[0] === 't').map(wing).join('')}${center}${CMDS.filter((c) => c.pos[0] === 'b').map(wing).join('')}</div>`;
    return `<div class="chdeck" id="chdock"><p class="chmsg" id="bmsg">${msg || def}</p>${ctl}</div>`;
  }
  /** 操作欄だけを描き直す（START ↔ 移動中） */
  function refreshDeck(m, msg) { const d = $('#chdock'); if (d) d.outerHTML = deckHtml(m, P8().boardPhase(m), msg); }
  function sheetHtml(m, ph) {
    const r = m.raise, cfg = V.cfg;
    if (ph === 'branch') {
      const br = (cfg.branches || []).find((b) => b.at === r.node) || { options: [] };
      return `<div class="chsheet chbr"><h3>分かれ道</h3>${r.pend.opts.map((id) => { const o = br.options.find((x) => x.to === id) || { label: 'この先へ', desc: '' };
        const gi = o.gate && ((cfg.tileUI || {}).gates || {})[o.gate];
        return `<button class="chroute k-${esc(o.id || '')}${gi ? ' gi' : ''}" onclick="chfPick('${id}')">${gi ? `<img class="chroute-gate" src="${esc(gi)}" alt="" draggable="false">` : ''}<b>${esc(o.label)}</b><small>${esc(o.desc)}</small></button>`; }).join('')}</div>`;
    }
    if (ph === 'battle') {
      const fx = r.pend.fx || {}, bt = (cfg.battleTypes || {})[fx.battleType || 'wild'] || { label: 'モンスター' };
      // 2026-10-07 試遊：何が起きたか一瞬で分かるように＝見出しは遭遇の文（「野生のモンスターが現れた！」など）・小さく種類・周りを暗くして下の操作欄より前へ
      return `<div class="chsheet chbat"><small class="chbat-kind">${esc(bt.label)}</small><h3>${esc(bt.encounter || bt.label)}</h3>${bt.note ? `<p class="p9s chbat-note">${esc(bt.note)}</p>` : ''}<p class="p9s">バトルの後は疲れ +${MMCH.rulesOf(cfg).fatigueRules.battle}。賞金・ランクアップはありません。</p><button class="p9btn" onclick="bBattleGo()">バトルする</button><button class="p9btn2" onclick="bBattleSkip()">やめておく</button></div>`;
    }
    if (ph === 'goal') return `<div class="chsheet chgoal">${root.p8GoalHtml ? root.p8GoalHtml(m) : ''}</div>`;
    if (ph === 'timeup') return `<div class="chsheet"><h3>⌛ ターン終了</h3><p class="p9s">ゴールできなかったため、このChapterの公式大会には参加できません。Chapterは終了し、次のChapterへ進めます（育成失敗ではありません）。</p><button class="p9btn" onclick="p8EndChapter()">Chapterを終えてベースキャンプへ</button></div>`;
    return '';
  }

  // ---------------------------------------------------------
  // 画面（board() から）
  // ---------------------------------------------------------
  function chfBoard(msg) {
    const m = gS() && gS().m; if (!chfActive(m)) return false;
    const r = m.raise, ph = P8().boardPhase(m), f = MMCH.fieldOf(m);
    V.cfg = MMCH.configFor(m); V.g = MMCH.graphFor(m); V.calm = calmMode(); V.dbg = debug();
    evArtPreload(m);   // 2026-10-04（追加アセット）：この配置の出来事の挿絵を少しずつ先読み
    rfxPreload();   // 能力UPの道具・結果演出
    if (!V.foeWarm && root.MMP10M && typeof Image !== 'undefined') { V.foeWarm = 1; setTimeout(() => (MMP10M.SPECIES || []).forEach((x) => { if (x.image) { const im = new Image(); im.decoding = 'async'; im.src = x.image.src; } }), 1200); }   // 2026-10-04 G3：遭遇の演出で見せる相手の正式画像（4枚）
    const node = V.g.nodes[r.node] || V.g.nodes[V.g.start], key = `${m.uid}:${f.chapterId}:${f.patternId}:${f.layoutSeed}`;
    if (root.MMCHD) { if (V.diceCfg !== (V.cfg.dice || V.cfg)) { MMCHD.configure({ ...(V.cfg.dice || {}), sides: MMCH.rulesOf(V.cfg).diceSides }); V.diceCfg = V.cfg.dice || V.cfg; } MMCHD.preload(); }   // 面の数は rules.diceSides（停止面が無い出目は数字で出す）
    const app = $('#app'), same = V.key === key && V.field === node.field && $('#chf');
    unscroll();   // 前の画面（ステータス・技管理・出発準備など）で残ったスクロール量を消す（HUD・操作欄は画面の固定位置に出す）
    if (!same) {
      V.key = key; V.field = null; V.moving = false; V.focus = null; V.tgt.z = 1; V.cam.z = 1;
      app.innerHTML = `<div class="chfw" id="chfw"><div class="chf" id="chf"></div><div class="chf-ui" id="chf-ui"></div></div>`;
      buildScene(m, node.field);
      placeMon(r.node, true);
      anim('rest');
    } else { const w = $('#bmonw'); if (w && w.dataset.node !== r.node) placeMon(r.node, true); }
    // 停止地点の状態（開けた宝箱・使ったイベント）を反映
    document.querySelectorAll('#chf .chf-obj,#chf .chf-tile').forEach((e) => { const id = e.dataset.id; e.classList.toggle('used', f.consumedEvents.includes(id) || f.openedTreasures.includes(id) || f.clearedStats.includes(id)); });
    markCur(r.node); dbgScene();
    // ゴールに着いたあと：config.arrival があれば到着イベント（専用の背景・フィナの会話）→ 大会受付。マス・サイコロ・操作欄は出さない
    if (ph === 'goal' && V.cfg.arrival) { chfArrive(m, same); return true; }
    $('#chfw').classList.remove('arrive'); { const o = $('#chfarr'); if (o) o.remove(); }
    // 2026-10-04：大会のある Chapter で到着イベントが無いとき（Chapter 2 など）も、ゴールでは Chapter 1 と同じランク選択（index.html の p9ReceptionHtml）を会場のロビーの背景の上に。HUD・操作欄は出さない
    if (ph === 'goal' && root.p9ReceptionHtml && (P8().chapterRule(m.raise.ch) || {}).tournament) { $('#chf-ui').innerHTML = `<div class="chrcv bg" id="chrcv" style="--lobby:url(${root.P9_LOBBY_BG || ''})">${root.p9ReceptionHtml(m)}</div>`; return true; }
    $('#chf-ui').innerHTML = hudHtml(m) + sheetHtml(m, ph) + deckHtml(m, ph, msg);
    if (ph !== 'branch') V.camLoose = 0;
    if (ph === 'branch') branchCamera(m); else if (V.focus && ph === 'roll') camFocus(null);
    if (ph === 'branch') setTimeout(() => { if (onField() && P8().boardPhase(m) === 'branch') storyAt(m, 'branch'); }, 350);   // 2026-10-04：初めての分かれ道（チュートリアル。config.story の trigger 'branch'）
    // Chapter に入った直後（出発してまだ何もしていない）：旅路全体の俯瞰図 → スタート地点へ寄る演出（js/chapter/intro.js）。
    //  「初回」の判定（2026-10-01）＝育成個体 × Chapter ごとに1回：この Chapter の配置 m.raise.field（出発のたびに作り直され、Chapter の終了・育成放棄で消える）に
    //  introSeen を記録する（演出を始める前に保存）。同じ育成の再読み込み・再開では出さず、新しい育成個体（育成放棄のあとの別の個体を含む）や次の Chapter では出す。
    //  sessionStorage などセーブの外の記録では判定しない（タブが閉じられると消え、新旧の個体の区別も保証できないため）
    if (!same && ph === 'roll' && r.turnsUsed === 0 && r.node === V.g.start && root.MMCHI && V.cfg.intro && !f.introSeen && !root.MM_QA_NO_INTRO) chfIntro(m, key);   // MM_QA_NO_INTRO：自動テスト専用（tests/e2e/harness.mjs）
    if (ph === 'roll' && !V.intro) turnWarning(m);
    if (ph === 'roll' && r.turnsUsed === 0 && !V.intro && !(f.storySeen || []).length) setTimeout(() => { if (onField() && !V.intro && !busyGet()) storyAt(m, 'start'); }, 450);   // Chapter に入った最初の一言（導入演出のあと）
    // 再開した移動・停止地点の処理は少し後で。その間に別の画面へ移ったら何もしない（次にフィールドを開いたとき1回だけ処理する）
    if (ph === 'move') setTimeout(() => { if (onField()) chfContinue(); }, 300); else if (ph === 'resolve') setTimeout(() => { if (onField()) chfResolve(); }, 300);
    if (V.winPending) { V.winPending = false; if (ph === 'roll') winFx(); }   // 道中の野生バトルに勝って戻ったとき（大会・Chapter クリアでは出さない）
    return true;
  }
  /** 道中の野生バトルの勝利（2026-10-04 追加アセット 03_wild_battle_victory）：フィールドに戻った直後に短く（約1秒。その間は操作しない） */
  async function winFx() { if (busyGet()) return; busySet(true); try { await wait(V.calm ? 0 : 120); await resultFx('win', '野生モンスターに勝利！'); } finally { busySet(false); } }
  /**
   * 残りターンの警告（config.effects.turnWarning＝{ asset, at:[残りターン…] }）。短く出して消える（約1.3秒・操作は止めない）。
   *  出すターンは at に書いた残りターンだけ（空なら出さない＝正式な発火ターンは未決）。同じターンに二度は出さない
   */
  function turnWarning(m) {
    const W = (V.cfg.effects || {}).turnWarning, t = MMCH.turnInfo(m); if (!W || !Array.isArray(W.at) || !W.at.length || !t || t.limit == null) return;
    const key = `${m.raise.ch}:${t.used}`; if (!W.at.includes(t.left) || V.warned === key) return; V.warned = key;
    const src = effectAsset(W.asset), ui = $('#chf-ui'); if (!ui || !src) return;
    ui.insertAdjacentHTML('beforeend', `<div class="chf-twarn" style="background-image:url(${esc(src)})"><b>残り ${t.left} ターン</b></div>`);
    const el = ui.querySelector('.chf-twarn:last-child'); setTimeout(() => el && el.remove(), V.calm ? 900 : 1400);
  }
  /**
   * モンスターの登場（2026-10-04 G3）：間（MON_ENTER.gap）→ 画面の下の外から開始地点まで歩いて入る（歩行アニメつき・減速して止まる）→ 待機の姿勢。
   *  位置は CSS の個別の translate だけを動かす（道の上の位置 transform・向き・前傾には触れない）。視差を減らす設定では、短いフェードだけ
   */
  const MON_ENTER = { gap: 300, ms: 820 };
  async function monEnter(quick) {   // quick＝開始の演出を飛ばした（間なし・短く）
    const fw = $('#chfw'), w = $('#bmonw'); if (!fw) return;
    if (!w || !w.animate || V.calm || !(root.CSS && CSS.supports && CSS.supports('translate', '0 1px'))) { fw.classList.remove('chf-monwait'); return; }
    await wait(quick ? 0 : MON_ENTER.gap); if (!$('#bmonw') || !onField()) { fw.classList.remove('chf-monwait'); return; }
    const r = w.getBoundingClientRect(), sc = (w.offsetHeight ? r.height / w.offsetHeight : 1) || 1;
    const dy = Math.max(120, ((root.innerHeight || 800) - r.top + 12) / sc);   // 画面の下の外（カメラの拡大を考えた距離）
    w.style.translate = `0 ${dy.toFixed(0)}px`; fw.classList.remove('chf-monwait'); w.dataset.enter = '1';
    anim('walk', { speed: 1 }); feel('monster.enter');   // 2026-10-06：画面の下から歩いて入る（正式の4歩の音を1回だけ。1マスごとには鳴らさない）
    const a = w.animate([{ translate: `0 ${dy.toFixed(0)}px` }, { translate: '0 0' }], { duration: quick ? 420 : MON_ENTER.ms, easing: 'cubic-bezier(.22,.62,.3,1)', fill: 'forwards' });
    try { await a.finished; } catch (e) {}
    w.style.translate = ''; try { a.cancel(); } catch (e) {} delete w.dataset.enter;
    anim('land'); await wait(quick ? 60 : 170); anim('rest');
  }
  async function chfIntro(m, key) {
    if (busyGet() || V.intro) return;   // 二重に始めない
    const f = MMCH.fieldOf(m); if (!f) return;
    f.introSeen = true; doSave();   // 先に「見た」を保存（演出の途中で再読み込みしても二度出ない）。この個体のこの Chapter の配置と一緒に消える
    const w = $('#chfw'); V.intro = true; busySet(true); lockUi(true);
    if (w) w.classList.add('chf-intro');   // イントロ中は UI・ソラモ・マスを出さない
    let res = null, cued = false;
    const onTitle = () => { cued = true; feel('chapter.start'); };   // 開始の音：Chapter 名が読めるようになった瞬間（ズームの前）。飛ばしたときは最後に1回
    try { res = await MMCHI.play(V.cfg, { key, host: w, chapterId: V.cfg.chapterId, title: V.cfg.title, patternId: f.patternId, calm: V.calm, onTitle }); }
    catch (e) {}
    finally {
      // FIELD 1 の正式な開始状態：ソラモ・マス・UI を出す（飛ばしたときも同じ。途中の状態では止まらない）
      //  2026-10-04 G3：育成中のモンスターはその場に急に出さない＝背景・マス・UI が出て少し間をおいてから、画面の下から歩いて開始地点へ入る（全種族共通）。入り終わるまで START は押せない
      const w2 = $('#chfw'); if (w2) { w2.classList.add('chf-uiin', 'chf-monwait'); w2.classList.remove('chf-intro'); setTimeout(() => w2.classList.remove('chf-uiin'), 420); }
      if (res && res.skipped) await wait(350);   // 飛ばしたタップが下の START に届かないよう少し待ってから操作できる
      try { await monEnter(!!(res && res.skipped)); } catch (e) { const w3 = $('#chfw'); if (w3) w3.classList.remove('chf-monwait'); }
      V.intro = false; busySet(false);
    }
    if (onField() && chfActive(m) && P8().boardPhase(m) === 'roll') { refreshDeck(m); if (!cued) feel('chapter.start'); setTimeout(() => { if (onField() && !busyGet()) storyAt(m, 'start'); }, 350); }
  }
  // ---------------------------------------------------------
  // 大会会場への到着（config.arrival）：最後のマス（ゴール）に着いたら、通常のフィールド進行を終える。
  //  到着イベント専用の背景（マスもサイコロも無い）へクロスフェード → フィナの短い会話（この個体のこの Chapter で1回＝m.raise.field.arrivalSeen）
  //  → 大会受付（index.html の p9ReceptionHtml：ランク選択 → 参加 → 開始演出 → セドリックの進行）。再読み込みでは会話を見たなら受付から
  // ---------------------------------------------------------
  function arrivalLines(A) {
    const S = gS() || {}, nm = root.MMP11P ? MMP11P.sanitize(S.playerName) : (S.playerName || 'アルト');
    return (A.talk || []).map((l) => ({ ...l, text: String(l.text || '').split('{name}').join(nm) }));
  }
  function receptionHtml(m) { return `<div class="chrcv" id="chrcv">${root.p9ReceptionHtml ? root.p9ReceptionHtml(m) : (root.p8GoalHtml ? root.p8GoalHtml(m) : '')}</div>`; }
  async function chfArrive(m, fromField) {
    const A = V.cfg.arrival, L = A.lobby || null, f = MMCH.fieldOf(m), w = $('#chfw'), ui = $('#chf-ui'); if (!w || !ui) return;
    if (busyGet() && $('#chfarr')) return;   // 演出・会話の途中で呼ばれた：続きはそのまま
    let ov = $('#chfarr');
    // 2026-10-04 G4：門前（A.bg）→ 会場の中のロビー（A.lobby.bg）。名前の札も門前 → 会場の中へ切り替える
    if (!ov) { w.insertAdjacentHTML('beforeend', `<div class="chf-arrive" id="chfarr" style="--fade:${V.calm ? 0 : (A.fadeMs || 900)}ms;--lfade:${V.calm ? 0 : ((L && L.fadeMs) || 800)}ms"><img class="chf-arrive-bg" src="${esc(A.bg)}" alt="" draggable="false">${L ? `<img class="chf-arrive-lobby" src="${esc(L.bg)}" alt="" draggable="false">` : ''}<div class="chf-arrive-name"><small>CHAPTER ${esc(V.cfg.chapterId)}　到着</small><b>${esc(A.name || '')}</b>${L ? `<b class="in">${esc(L.name || '')}</b>` : ''}</div></div>`); ov = $('#chfarr'); }
    ui.innerHTML = '';   // HUD・操作欄（START・4コマンド）・マスの UI を消す
    w.classList.add('arrive');
    if (f.arrivalSeen) { ov.classList.add('now', 'on', 'in'); ui.innerHTML = receptionHtml(m); return; }   // 再読み込み：会場の中（ロビー）のランク選択から
    busySet(true);
    if (root.bgm) root.bgm('chapter');   // 大会会場・受付の BGM（ゴールでは TOURNAMENT_ENTRY）
    try {
      if (L && typeof Image !== 'undefined') { const im = new Image(); im.decoding = 'async'; im.src = L.bg; }   // ロビーの絵を先に読む
      if (fromField && !V.calm) await wait(500);   // ゴールに着いた姿を少し見せてから
      if (!fromField) ov.classList.add('now');
      ov.classList.add('on');
      await wait(V.calm || !fromField ? 0 : (A.fadeMs || 900) + 200);
      if (!$('#chfarr')) return;
      feel('tournament.arrive');   // 大会会場へ着いた音（TOURNAMENT_ARRIVAL）
      if (L) {   // 門前を短く見せてから、会場の中へ入る
        await wait(V.calm ? 0 : (A.gateMs || 1300));
        if (!$('#chfarr')) return;
        ov.classList.add('in');
        await wait(V.calm ? 0 : (L.fadeMs || 800) + 150);
        if (!$('#chfarr')) return;
      }
      if (root.MMNPC && !root.MM_QA_NO_ARRIVAL && (A.talk || []).length) await MMNPC.talk(arrivalLines(A), { kind: 'event', presentation: 'major', big: true });
      f.arrivalSeen = true; doSave();
    } finally { busySet(false); }
    const u2 = $('#chf-ui'); if ($('#chfarr') && u2 && chfActive(m) && P8().boardPhase(m) === 'goal') u2.innerHTML = receptionHtml(m);
  }
  /** 分岐：少し引いて、2つの道の入口が視界に入るようにする */
  /** 分かれ道：それぞれの道の入口（最初の1地点）だけに小さな光の印と道の名前を出す（その先の地点は出さない。画像は使わない） */
  function branchHints(m, ns) {
    const fx = $('#chffx'); if (!fx) return; fx.querySelectorAll('.chf-brhint').forEach((e) => e.remove());
    const br = (V.cfg.branches || []).find((b) => b.at === m.raise.node) || { options: [] };
    for (const n of ns) { const o = br.options.find((x) => x.to === n.id) || {}; fx.insertAdjacentHTML('beforeend', `<i class="chf-brhint" data-id="${esc(n.id)}" style="left:${(n.mx * V.sc.w).toFixed(1)}px;top:${(n.my * V.sc.h).toFixed(1)}px;--d:${n.d}"><b>${esc(o.label || '')}</b></i>`); }
  }
  function branchCamera(m) {
    const r = m.raise, opts = (r.pend && r.pend.opts) || [], ns = opts.map((id) => V.g.nodes[id]).filter((n) => n && n.field === V.field);
    if (!V.monPos) return;
    if (ns.length) {
      // 2026-10-08：同じ背景の左右の道（分岐 A・B）：少し引いて、モンスターを下の選択シートより上に、左右の道の入口と先の数マスを同時に見せる（マスの大きさは変わらない）
      const cx = ns.reduce((s, n) => s + n.mx, 0) / ns.length * V.sc.w, cy = ns.reduce((s, n) => s + n.my, 0) / ns.length * V.sc.h;
      const sh = $('#chf-ui .chbr'), fv = $('#chf');
      if (sh && fv) {
        const { H } = viewport(), z = CA().zoom.branch, St = (V.cam.S || 1) / (V.cam.z || 1) * z, fr = fv.getBoundingClientRect(), want = sh.getBoundingClientRect().top - fr.top - 14;
        V.camLoose = Math.max(0, fr.bottom - sh.getBoundingClientRect().top);
        camFocus({ x: (cx + V.monPos.x) / 2, y: V.monPos.y - (want - CA().anchorY * H) / St }, 1, z);
      } else camFocus({ x: cx, y: cy }, 0.5, CA().zoom.branch);
      branchHints(m, ns);
    }
    else if (((V.cfg.tileUI || {}).gates)) {   // 道の先が別の背景で、左右の門がある：門とモンスターを、下の選択シートより上に見せる（モンスターを画面の 4割の高さへ）
      const { H } = viewport(), S = V.cam.S || 1, mh = monH() * V.monPos.d, up = Math.max(0, (CA().anchorY - 0.4) * H / S);
      camFocus({ x: V.monPos.x, y: V.monPos.y - mh * 0.45 + up }, 1, CA().zoom.branch); branchGates(m);
    } else camFocus({ x: V.monPos.x + V.look[0] * 160 * V.monPos.d, y: V.monPos.y + V.look[1] * 160 * V.monPos.d }, 0.5, CA().zoom.branch);   // 道の先が別の背景：進む向きの先を見せて少し引く
  }
  /**
   * 分かれ道の左右の門（config.branches[].options[].gate → config.tileUI.gates の画像。side：-1＝左・1＝右）：道の先（進む向きの少し前）の左右に立て、その下に道の名前。
   *  道の先が別の背景へ続く分かれ道用（左右の道がそれぞれ別の背景へ入る）。選ぶと消える（chfPick）
   */
  function branchGates(m) {
    const fx = $('#chffx'), br = (V.cfg.branches || []).find((b) => b.at === m.raise.node), G = (V.cfg.tileUI || {}).gates || {}; if (!fx || !br || !V.monPos) return;
    fx.querySelectorAll('.chf-brgate').forEach((e) => e.remove());
    const d = V.monPos.d, [lx, ly] = V.look, ahead = 70 * d, lat = 140 * d, h = 175 * d;   // マスのすぐ先の左右（道の上）
    for (const o of br.options) {
      const src = G[o.gate]; if (!src) continue;
      const sd = o.side || 0, x = V.monPos.x + lx * ahead - ly * lat * sd, y = V.monPos.y + ly * ahead + lx * lat * sd;
      fx.insertAdjacentHTML('beforeend', `<i class="chf-brgate${sd < 0 ? ' l' : sd > 0 ? ' r' : ''}" data-id="${esc(o.id)}" style="left:${x.toFixed(1)}px;top:${y.toFixed(1)}px;height:${h.toFixed(1)}px;--d:${d}"><img src="${esc(src)}" alt="" draggable="false"><b>${esc(o.label || '')}</b></i>`);
    }
  }
  const onField = () => !!$('#chf') && !!$('#bmonw');
  /**
   * HUD と操作欄を常に画面の固定位置に出すため、フィールドの器（.chfw）を囲む #app・main・ページのスクロール量を 0 に戻す。
   *  原因（2026-10-01）：#app は縦スクロールできる器で、前の画面でスクロールした量（ステータス・技管理・出発準備の下の方を見ていた）や、
   *  画面の登場アニメ（translateY 12px）の 0.3秒の間に #app がはみ出して受け付けたスクロール量が、フィールドを描いた後も残ることがあった。
   *  .chfw は #app の中の position:relative なので、その量だけ HUD（上）が画面の外へ押し上げられていた。CSS でも #app:has(>.chfw) を overflow:hidden にし、登場アニメは不透明度だけにしている
   */
  function unscroll() { try { for (const e of [$('#app'), document.querySelector('main'), document.scrollingElement, document.body]) if (e && e.scrollTop) e.scrollTop = 0; if (root.scrollX || root.scrollY) root.scrollTo(0, 0); } catch (e) {} }
  function setMsg(t) { const b = $('#bmsg'); if (b) b.innerHTML = t; }
  /** 出目の小さな表示（HUD の下・右上）：サイコロの停止面が主で、文字は補助。短く出て自然に消える */
  function rollToast(v, fat) {
    const ui = $('#chf-ui'); if (!ui) return; const old = ui.querySelector('.chroll'); if (old) old.remove();
    const d = document.createElement('div'); d.className = 'chroll'; d.setAttribute('aria-live', 'polite'); d.innerHTML = `<small>出目</small><b>${v}</b><span>${DIST[v] || ''}</span><em>疲れ +${fat}</em>`; ui.appendChild(d);
    setTimeout(() => { d.classList.add('out'); setTimeout(() => d.remove(), 300); }, V.calm ? 900 : 1500);
  }
  /** 技設定・ステータス（既存のファーム画面 hall('w')／hall('st')。Chapter中でも開ける従来どおりの画面。移動中は開かない） */
  function chfOpen(id) { const m = gS() && gS().m; if (!chfActive(m) || busyGet() || P8().boardPhase(m) !== 'roll') return; try { hall(id); } catch (e) {} }
  function lockUi(on, except) { document.querySelectorAll('#chf-ui button').forEach((b) => { if (on && !(except && b.matches(except))) b.disabled = true; }); }

  /** メインの操作（START）の手ごたえ：沈む → 小さく跳ね返る → 元へ（transform だけ。光らせない）。視差を減らす設定では待たない */
  function pressKick(el) {
    if (!el || V.calm || !el.animate) return Promise.resolve();
    const a = el.animate([{ transform: 'scale(1)' }, { transform: 'scale(.9)', offset: 0.35, easing: 'cubic-bezier(.3,0,.6,1)' }, { transform: 'scale(1.05)', offset: 0.72, easing: 'ease-out' }, { transform: 'scale(1)' }], { duration: 210, easing: 'ease-out' });
    return Promise.race([a.finished.catch(() => {}), wait(260)]);
  }
  /**
   * START（1タップ）：出目・ターン消費・疲れを確定して保存（演出の前。中断・再読み込みで振り直せない）→ サイコロが START の位置から出現して回り、
   *  自動で減速して停止面（dice_stop_N）→ 少し見せて消える → 1地点ずつ移動 → 停止処理 → START に戻る。
   *  演出・移動・停止処理の間は busy（bBusy＋MMCHD.isLocked）で、START も4コマンドも受け付けない（連打しても1ターンしか進まない）
   */
  async function chfRoll() {
    const m = gS() && gS().m; if (!chfActive(m) || busyGet() || !P8().canRoll(m)) return;
    busySet(true); lockUi(true);
    try {
      const r = P8().roll(gS(), m); doSave();
      refreshHud(m);   // サイコロの音は MMCHD が出来事（dice.throw）として出す（合成音の直接呼び出しは廃止＝二重に鳴らさない）
      const host = $('#chfw') || $('#chf-ui') || document.body, hr = host.getBoundingClientRect(), bt = $('#brollbtn');
      const from = bt ? (() => { const b = bt.getBoundingClientRect(); return { x: b.left + b.width / 2 - hr.left, y: b.top + b.height / 2 - hr.top }; })() : null;   // START の位置から出現する
      const fv = $('#chf'), fr = fv ? fv.getBoundingClientRect() : hr;
      refreshDeck(m, 'サイコロを振った…'); lockUi(true);
      await pressKick($('#brollbtn'));   // START の手ごたえ：押す → 小さく戻る → サイコロが出る（約0.2秒。強い光り方はしない）
      if (root.MMCHD) await MMCHD.play(r.value, { host, from, land: { x: fr.left + fr.width / 2 - hr.left, y: fr.top + fr.height * 0.44 - hr.top } });   // 着地はモンスターの頭より上（モンスターを隠さない）。自動停止
      rollToast(r.value, m.raise.pend ? m.raise.pend.fatigueAdded || 0 : 0); refreshDeck(m, ''); lockUi(true); fatFly(m.raise.pend ? m.raise.pend.fatigueAdded || 0 : 0);   // 2026-10-04 PHASE E：疲れの増減の小さな表示
    } finally { busySet(false); }
    chfContinue();
  }
  async function chfContinue(picked) {
    const m = gS() && gS().m; if (!chfActive(m) || busyGet() || !m.raise.pend) return;
    busySet(true);
    try {
      let first = true; V.lastFields = [];
      const seenField = () => { const n = V.g.nodes[m.raise.node]; if (n && !V.lastFields.includes(n.field)) V.lastFields.push(n.field); };
      // 分かれ道で選んだ道の最初の地点（chooseBranch で地点は進んでいる）：まずそこまで歩く。残りの出目が 0 ならそこで止まる（以前は歩かずに、前の背景のまま停止処理をしていた）
      if (picked && $('#bmonw') && $('#bmonw').dataset.node !== m.raise.node) { await walkTo(m, m.raise.node, true, m.raise.pend.stage !== 'move'); first = false; }
      while (m.raise.pend && m.raise.pend.stage === 'move') {
        if (!$('#bmonw')) break;
        const s = P8().step(gS(), m); doSave(); seenField();
        const last = !(m.raise.pend && m.raise.pend.stage === 'move');
        if (s.node) await walkTo(m, s.node, first, last);
        first = false;
      }
      if (V.moving) { V.moving = false; anim('idle'); }
    } finally { busySet(false); }
    if (!onField()) return;   // 移動の途中で別の画面へ移った：続きは次にフィールドを開いたとき
    const st = m.raise.pend && m.raise.pend.stage;
    if (st === 'branch') return chfBoard();
    if (st === 'resolve') return chfResolve();
    return chfBoard();
  }
  function chfPick(id) {
    const m = gS() && gS().m; if (!chfActive(m) || busyGet()) return;
    const r = P8().chooseBranch(gS(), m, id); if (!r.ok) return chfBoard(); doSave(); feel('branch.select', { id });   // 2026-10-06：道を選んだ瞬間（BRANCH_SELECT）
    const sh = $('#chf-ui .chbr'); if (sh) sh.remove(); document.querySelectorAll('#chf .chf-brhint,#chf .chf-brgate').forEach((e) => e.remove());
    V.camLoose = 0;   // シートが消えたので、カメラは画像の中へ戻る（追従でなめらかに）
    const fb = MMCH.fieldOf(m).branch || V.g.nodes[id].branch;   // 選んだ道（f.branch は最初の1歩で記録される）
    document.querySelectorAll('#chf .chf-obj').forEach((e) => { const n = V.g.nodes[e.dataset.id]; if (!n || !n.branch || !sameBranchGroup(V.cfg, n.branch, fb)) return; if (n.branch === fb) e.classList.remove('brhide'); else e.classList.add('gone'); });
    const n = V.g.nodes[id];   // 選んだ道のほうへ少し寄ってから歩き出す（別の背景へ続く道なら、進む向きの先へ）
    if (n && n.field === V.field) camFocus({ x: n.mx * V.sc.w, y: n.my * V.sc.h }, 0.45, CA().zoom.idle);
    else if (V.monPos) camFocus({ x: V.monPos.x + V.look[0] * 140 * V.monPos.d, y: V.monPos.y + V.look[1] * 140 * V.monPos.d }, 0.4, CA().zoom.idle);
    V.pickLean = V.calm ? 0 : 160;   // 寄る時間（歩き出す前に walkTo が待ち、そのあと寄りを解く）
    chfContinue(true);
  }
  async function chfRest() {
    const m = gS() && gS().m; if (!chfActive(m) || busyGet() || !P8().canRest(m)) return;
    busySet(true); lockUi(true);
    let res;
    try {
      const before = MMCH.fatigue(m); res = P8().rest(gS(), m); doSave(); if (MMCH.fatigue(m) < before) feel('rest.recover');   // 2026-10-06：疲れの回復が成立した瞬間（REST_RECOVER）
      const w = $('#bmonw'); if (w) { w.insertAdjacentHTML('beforeend', '<i class="chf-zz">Z<small>z</small></i>'); anim('rest'); w.classList.add('resting'); }
      restVeil(); refreshHud(m); fatFly(MMCH.fatigue(m) - before); setMsg(`ひと休みした。　疲れ −${before - MMCH.fatigue(m)}`);   // 2026-10-04 PHASE E：落ち着いた回復の帯＋疲れの増減
      await wait(900);
      if (w) { w.classList.remove('resting'); const z = w.querySelector('.chf-zz'); if (z) z.remove(); }
    } finally { busySet(false); }
    if (onField()) chfBoard(`ひと休みした。疲れ ${MMCH.fatigue(m)}` + (res && res.timeUp ? '　ターンを使い切った…' : ''));
  }
  // ---- 停止地点の結果（短く。タップで早送り） ----
  /**
   * 結果の小さな窓（.chpop）。onShow(d)＝出たあとの演出（数値のカウントアップなど。終わるまで閉じる時計を始めない）。
   *  ms＝見せる時間（MMFEEL の LEVEL の余韻）。タップで早く閉じられる（V.skip）
   */
  function popup(html, cls, ms, frame, onShow) {
    const ui = $('#chf-ui'); if (!ui) return wait(0);
    const d = document.createElement('div'); d.className = `chpop ${cls || ''}${frame ? ' framed' : ''}`; d.innerHTML = html; ui.appendChild(d);
    if (frame) d.style.backgroundImage = `url(${frame})`;   // 演出の枠（画像に文字は入れない。能力名・数値は HTML）
    return new Promise((ok) => { let done = false; const end = () => { if (done) return; done = true; d.classList.add('out'); setTimeout(() => { d.remove(); ok(); }, 160); };
      V.skip = end; d.addEventListener('click', end);
      Promise.resolve(onShow ? onShow(d) : null).catch(() => {}).then(() => { if (!done) setTimeout(end, ms); }); });
  }
  // ---- Game Feel（2026-10-02。js/feel/game-feel.js の MMFEEL）：出来事の重さ（LEVEL）ごとに「間」と「余韻」を変える。値は MMFEEL.MOTION の1か所 ----
  const FEEL = () => root.MMFEEL || null;
  const feel = (n, d) => { try { const F = FEEL(); if (F) F.emit(n, d); } catch (e) {} };
  const beatOf = (lv) => (V.calm ? 0 : (FEEL() ? FEEL().beat(lv) : 0));
  const holdOf = (lv, def) => (V.calm ? Math.min(400, def || 400) : (FEEL() ? FEEL().hold(lv) : def));
  const countUp = (el, a, b, ms, f) => (FEEL() && !V.calm ? FEEL().countUp(el, a, b, ms, f) : (el && (el.textContent = f ? f(b) : String(b)), Promise.resolve()));
  const bump = (el) => { if (FEEL()) FEEL().bump(el); };
  /** モンスターの反応：小さく跳ねて、足元に光の輪（能力が上がった・宝を見つけた）。絵の色は変えない */
  function monReact(kind) {
    const w = $('#bmonw'), fx = $('#chffx'); if (!w) return;
    w.classList.remove('react'); void w.offsetWidth; w.classList.add('react'); setTimeout(() => w.classList.remove('react'), 700);
    if (fx && V.monPos && !V.calm) { fx.insertAdjacentHTML('beforeend', `<i class="chf-mring k-${kind || 'up'}" style="left:${V.monPos.x.toFixed(1)}px;top:${V.monPos.y.toFixed(1)}px;--d:${V.monPos.d}"></i>`); const r = fx.querySelector('.chf-mring:last-child'); setTimeout(() => r && r.remove(), 900); }
  }
  /** 所持金：報酬の「+N G」が HUD の所持金へ飛んで、HUD の数字が増えて小さく弾む（from＝HUD に出していた額） */
  async function goldToHud(from, to, srcEl) {
    const g = $('#chgold'), b = g && g.querySelector('b'); if (!g || !b || to === from) { if (b) b.textContent = String(to); return; }
    const ui = $('#chf-ui');
    if (ui && srcEl && !V.calm && g.animate) {
      const hr = ui.getBoundingClientRect(), sr = srcEl.getBoundingClientRect(), gr = g.getBoundingClientRect();
      const chip = document.createElement('div'); chip.className = 'chf-gfly'; chip.textContent = `+${to - from}G`; chip.style.left = `${sr.left + sr.width / 2 - hr.left}px`; chip.style.top = `${sr.top + sr.height * 0.6 - hr.top}px`; ui.appendChild(chip);
      const dx = gr.left + gr.width / 2 - (sr.left + sr.width / 2), dy = gr.top + gr.height / 2 - (sr.top + sr.height * 0.6);
      const a = chip.animate([{ transform: 'translate(-50%,-50%) scale(1)', opacity: 1 }, { transform: `translate(calc(-50% + ${(dx * 0.5).toFixed(0)}px), calc(-50% + ${(dy * 0.5 - 30).toFixed(0)}px)) scale(1.05)`, opacity: 1, offset: 0.45 }, { transform: `translate(calc(-50% + ${dx.toFixed(0)}px), calc(-50% + ${dy.toFixed(0)}px)) scale(.6)`, opacity: 0.2 }], { duration: 520, easing: 'cubic-bezier(.4,0,.6,1)', fill: 'forwards' });
      await Promise.race([a.finished.catch(() => {}), wait(700)]); chip.remove();
    }
    feel('gold.get'); bump(g); await countUp(b, from, to, 420);
  }
  /** 疲れの HUD：回復・増加を数字の動きで見せる（2026-10-04 第二段階 PHASE E：増減の小さな表示＋チップの色の段階も合わせる） */
  async function fatigueHud(from, to) { const f = $('#chfat'), b = f && f.querySelector('b'); if (!b || from === to) return; fatFly(to - from); bump(f); await countUp(b, from, to, 360); fatLevel(to); }
  /** 疲れのチップの段階（lo／mid／hi）と目盛りを今の値に合わせる */
  function fatLevel(v) { const f = $('#chfat'); if (!f) return; f.classList.remove('f-lo', 'f-mid', 'f-hi'); f.classList.add(v >= 80 ? 'f-hi' : v >= 50 ? 'f-mid' : 'f-lo'); const i = f.querySelector('i'); if (i) i.style.setProperty('--f', `${v}%`); }
  /** 疲れの増減（「+5」「−30」）をチップの脇に短く浮かべる（2026-10-04 PHASE E。大きな演出はしない） */
  function fatFly(delta) {
    const ui = $('#chf-ui'), f = $('#chfat'); if (!ui || !f || !delta || V.calm) return;
    const hr = ui.getBoundingClientRect(), fr = f.getBoundingClientRect(); const d = document.createElement('i'); d.className = `chf-fatfly ${delta > 0 ? 'up' : 'dn'}`; d.textContent = delta > 0 ? `+${delta}` : `−${-delta}`;
    d.style.left = `${fr.left + fr.width / 2 - hr.left}px`; d.style.top = `${fr.bottom - hr.top + 2}px`; ui.appendChild(d); setTimeout(() => d.remove(), 1000);
  }
  // ---- 2026-10-04 第二段階 PHASE E：能力UPの成長演出（光 → 能力のアイコン → 「ちから +5」→ ゲージ（999 を最大とした絶対の目盛り・正式色）→ 粒子）。0.6〜1.2秒・タップで短縮 ----
  const STAT_COLOR_DEF = { li: '#f2c14e', po: '#d9534f', in: '#5cb85c', hi: '#f06292', ev: '#7fd4e8', de: '#4c7bd9' };   // 正式色（index.html の STAT_COLOR と同じ。あればそちら）
  const statColor = (k) => ((root.STAT_COLOR || {})[k]) || STAT_COLOR_DEF[k] || '#ffe08a';
  const STAT_TILE = { li: 'stat_life', po: 'stat_power', in: 'stat_intelligence', hi: 'stat_accuracy', ev: 'stat_evasion', de: 'stat_toughness' };
  const gaugePct = (v) => Math.round(Math.min(999, Math.max(0, v | 0)) / 999 * 1000) / 10;
  /** 成長の行（能力ごと）。before＝上がる前の値・after＝上がった後の値。複数の能力は縦に並べて重ねない */
  function growRows(m, gains) {
    return gains.map(({ key, amount }) => { const after = (m[key] | 0), before = Math.max(0, after - amount), ic = tileSpriteOf(V.cfg, STAT_TILE[key]);
      return `<div class="chf-grow" data-key="${key}" style="--c:${statColor(key)}"><span class="chf-grow-ic">${ic ? `<img src="${ic}" alt="" decoding="async">` : ''}</span><b class="chf-grow-t">${esc(labOf(key))} <span class="cnt">${amount >= 0 ? '+0' : '−0'}</span></b><div class="chf-gauge" role="img" aria-label="${esc(labOf(key))} ${after}（999 まで）"><i style="width:${gaugePct(before)}%" data-to="${gaugePct(after)}"></i></div><span class="chf-sparks" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></span></div>`; }).join('');
  }
  /** 成長演出を動かす：アイコンが浮く → 数値が上がる → ゲージが伸びる → 粒子（約0.55秒。残りは余韻＝popup の ms） */
  async function growPlay(d, gains) {
    const rows = [...d.querySelectorAll('.chf-grow')]; if (!rows.length) return;
    rows.forEach((r) => r.classList.add('on'));
    await wait(V.calm ? 0 : 140);
    await Promise.all(rows.map((r, i) => { const g = gains[i] || gains[0], c = r.querySelector('.cnt'); return countUp(c, 0, Math.abs(g.amount), (FEEL() ? Math.min(FEEL().MOTION.count[3], 260) : 260), (v) => `${g.amount >= 0 ? '+' : '−'}${v}`); }));
    rows.forEach((r) => { const i = r.querySelector('.chf-gauge i'); if (i) i.style.width = `${i.dataset.to}%`; r.classList.add('grown'); });
    await wait(V.calm ? 0 : 260);
  }
  /** 休憩・回復の落ち着いた演出：画面にやわらかい青の帯を一瞬かぶせる（絵の色は変えない。約0.9秒） */
  function restVeil() { const ui = $('#chf-ui'); if (!ui || V.calm) return; const v = document.createElement('i'); v.className = 'chf-restveil'; ui.appendChild(v); setTimeout(() => v.remove(), 1000); }
  // ---- 2026-10-04（追加アセット）：能力UPの道具6種・Chapter の短い結果演出3種（全モンスター・全 Chapter 共通の素材。画像に数値・結果は無い＝能力名・値は HTML）。
  //  config.resultFx で上書きできる（{ tools:{ li… }, rest, event, wildWin }）。どれも短く（0.7〜1.0秒）・タップで飛ばせる・視差を減らす設定では出さない ----
  const RFX_DEF = { tools: { li: 'assets/chapter/stat_tools/li_hurdle.webp', po: 'assets/chapter/stat_tools/po_weight.webp', in: 'assets/chapter/stat_tools/in_grimoire.webp', hi: 'assets/chapter/stat_tools/hi_target.webp', ev: 'assets/chapter/stat_tools/ev_balls.webp', de: 'assets/chapter/stat_tools/de_shield.webp' },
    rest: 'assets/chapter/result_fx/rest.webp', event: 'assets/chapter/result_fx/event_result.webp', wildWin: 'assets/chapter/result_fx/wild_victory.webp' };
  const RFX_MS = { tool: 760, rest: 900, event: 700, win: 1000 };
  function rfxSrc(kind, key) { const C = (V.cfg && V.cfg.resultFx) || {}; if (kind === 'tool') return ((C.tools || {})[key]) || RFX_DEF.tools[key] || null; return C[kind] || RFX_DEF[kind] || null; }
  /** 道具・結果の絵を先読み（フィールドを開いたとき1回。小さな WebP 9枚） */
  function rfxPreload() { if (V.rfxWarm || typeof Image === 'undefined') return; V.rfxWarm = 1; setTimeout(() => [...Object.values(RFX_DEF.tools), RFX_DEF.rest, RFX_DEF.event, RFX_DEF.wildWin].forEach((src) => { const im = new Image(); im.decoding = 'async'; im.src = src; }), 900); }
  /**
   * 短い結果演出：絵（道具／焚き火／紋章）が浮かぶ → 下に実際の結果の文（例「ちから +6」「疲れ −30」）→ 消える。
   *  kind＝tool（能力マス。key＝能力）・rest（休むマス）・event（出来事の結果）・win（道中の野生バトルの勝利）。文は呼び出し側が実際の値から作る
   */
  function resultFx(kind, caption, key) {
    const ui = $('#chf-ui'), src = rfxSrc(kind === 'win' ? 'wildWin' : kind, key); if (!ui || !src || V.calm) return wait(0);
    const d = document.createElement('div'); d.className = `chf-rfx k-${kind}`; d.setAttribute('role', 'status'); if (key) { d.dataset.key = key; d.style.setProperty('--c', statColor(key)); }
    d.innerHTML = `<i class="rfx-glow"></i><img class="rfx-im" src="${esc(src)}" alt="" draggable="false" decoding="async">${caption ? `<b class="rfx-tx">${esc(caption)}</b>` : ''}`;
    ui.appendChild(d);
    return new Promise((ok) => { let done = false; const end = () => { if (done) return; done = true; d.classList.add('out'); setTimeout(() => { d.remove(); ok(); }, 180); };
      V.skip = end; d.addEventListener('click', end); setTimeout(end, RFX_MS[kind] || 800); });
  }
  // ---- 2026-10-06：能力UPのアクション（0.8〜1.5秒）。能力ごとの道具（RFX_DEF.tools の絵）をモンスターのそばに置き、モンスターが短い動きで特訓する。
  //  形・位置の変化だけ（絵の色は変えない・新しい絵は作らない・全種族共通）。モンスターは .chf-lean を translate／scale／rotate（個別のプロパティ＝歩きの傾きと重ならない）で動かす。
  //  tool＝道具の置き場所（足元から、モンスターの高さに対する割合 dx・dy）と大きさ s、mon＝モンスターの動き、tk＝道具の動き。タップで飛ばせる・視差を減らす設定では出さない ----
  const TRAIN_ACT = {
    li: { ms: 1050, tool: { dx: 0, dy: -0.5, s: 0.78, back: 1 }, mon: [{ translate: '0 0', scale: '1 1' }, { translate: '0 2%', scale: '1.06 .9', offset: 0.18 }, { translate: '0 -46%', scale: '.96 1.06', offset: 0.45 }, { translate: '0 -8%', scale: '1 1', offset: 0.7 }, { translate: '0 1%', scale: '1.06 .92', offset: 0.82 }, { translate: '0 0', scale: '1 1' }],
      tk: [{ opacity: 0, translate: '0 10%' }, { opacity: 1, translate: '0 0', offset: 0.14 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }] },   // ハードルを跳び越える
    po: { ms: 1150, tool: { dx: 0, dy: -0.98, s: 0.62 }, mon: [{ scale: '1 1' }, { scale: '1.08 .88', offset: 0.22 }, { scale: '.97 1.05', offset: 0.42 }, { scale: '1.08 .88', offset: 0.62 }, { scale: '.97 1.05', offset: 0.8 }, { scale: '1 1' }],
      tk: [{ opacity: 0, translate: '0 30%' }, { opacity: 1, translate: '0 12%', offset: 0.22 }, { translate: '0 -14%', offset: 0.42 }, { translate: '0 12%', offset: 0.62 }, { opacity: 1, translate: '0 -14%', offset: 0.8 }, { opacity: 0, translate: '0 -20%' }] },   // ウェイトを持ち上げる
    in: { ms: 1200, tool: { dx: 0.66, dy: -0.5, s: 0.6 }, mon: [{ rotate: '0deg' }, { rotate: '-6deg', offset: 0.25 }, { rotate: '5deg', offset: 0.55 }, { rotate: '-3deg', offset: 0.78 }, { rotate: '0deg' }],
      tk: [{ opacity: 0, translate: '0 18%', rotate: '-8deg' }, { opacity: 1, translate: '0 0', rotate: '-4deg', offset: 0.2 }, { translate: '0 -8%', rotate: '4deg', offset: 0.55 }, { opacity: 1, translate: '0 -4%', rotate: '-2deg', offset: 0.82 }, { opacity: 0, translate: '0 -14%', rotate: '0deg' }] },   // 魔導書を読んで考える
    hi: { ms: 1100, tool: { dx: 0.32, dy: -0.78, s: 0.6, back: 1 }, mon: [{ translate: '0 0', scale: '1 1' }, { translate: '0 3%', scale: '1.04 .95', offset: 0.18 }, { translate: '6% -14%', scale: '1 1', offset: 0.32 }, { translate: '0 0', offset: 0.5 }, { translate: '0 3%', scale: '1.04 .95', offset: 0.6 }, { translate: '6% -14%', scale: '1 1', offset: 0.74 }, { translate: '0 0', scale: '1 1' }],
      tk: [{ opacity: 0, scale: '.8' }, { opacity: 1, scale: '1', rotate: '0deg', offset: 0.16 }, { rotate: '-7deg', offset: 0.36 }, { rotate: '0deg', offset: 0.5 }, { rotate: '-7deg', offset: 0.78 }, { opacity: 1, rotate: '0deg', offset: 0.88 }, { opacity: 0, scale: '1' }] },   // 的をねらって飛びかかる
    ev: { ms: 1150, tool: { dx: -0.8, dy: -0.5, s: 0.46 }, mon: [{ translate: '0 0', rotate: '0deg' }, { translate: '-24% -4%', rotate: '-7deg', offset: 0.28 }, { translate: '0 0', rotate: '0deg', offset: 0.46 }, { translate: '24% -4%', rotate: '7deg', offset: 0.68 }, { translate: '0 0', rotate: '0deg' }],
      tk: [{ opacity: 0, translate: '0 0' }, { opacity: 1, translate: '40% 0', offset: 0.2 }, { translate: '160% -10%', offset: 0.5 }, { opacity: 1, translate: '260% 0', offset: 0.8 }, { opacity: 0, translate: '320% 0' }] },   // 飛んでくるボールを左右にかわす
    de: { ms: 1100, tool: { dx: 0, dy: -0.42, s: 0.78, back: 1 }, mon: [{ scale: '1 1', translate: '0 0' }, { scale: '1.07 .93', translate: '0 2%', offset: 0.25 }, { scale: '1 1', translate: '0 -3%', offset: 0.42 }, { scale: '1.07 .93', translate: '0 2%', offset: 0.62 }, { scale: '1 1', translate: '0 0' }],
      tk: [{ opacity: 0, scale: '.85' }, { opacity: 1, scale: '1', offset: 0.18 }, { scale: '1.08', offset: 0.3 }, { scale: '1', offset: 0.45 }, { scale: '1.08', offset: 0.68 }, { opacity: 1, scale: '1', offset: 0.84 }, { opacity: 0, scale: '1' }] },   // 盾を構えて踏んばる
  };
  /** 能力UPのアクション：道具を置く → モンスターが特訓の動き → 頭の上に実際の結果（例「ちから +3」）→ 消える。モンスターの位置が分からないときは従来の結果演出（resultFx） */
  function trainAct(key, caption) {
    const A = TRAIN_ACT[key], fx = $('#chffx'), w = $('#bmonw'), lean = w && w.querySelector('.chf-lean'), src = rfxSrc('tool', key);
    if (!A || !fx || !lean || !V.monPos || !src || !lean.animate) return resultFx('tool', caption, key);
    if (V.calm) return wait(0);
    feel('train.item', { key });   // 2026-10-06：特訓の道具が出た瞬間（TRAINING_ITEM_SPAWN）
    const d = V.monPos.d, mh = monH() * d, T = A.tool, tw = mh * T.s, x = V.monPos.x + T.dx * mh, y = V.monPos.y + T.dy * mh;
    const tool = document.createElement('i'); tool.className = `chf-tact k-${key}`; tool.style.cssText = `left:${x.toFixed(1)}px;top:${y.toFixed(1)}px;width:${tw.toFixed(1)}px;--c:${statColor(key)}`;
    tool.innerHTML = `<img src="${esc(src)}" alt="" draggable="false" decoding="async">`;
    const road = w.parentElement; if (T.back && road) road.insertBefore(tool, w); else fx.appendChild(tool);   // back＝モンスターの先（後ろ姿なので奥＝モンスターの後ろに描く）。ほかは手前（効果の層）
    const ui = $('#chf-ui'), tx = document.createElement('b'); tx.className = 'chf-tact-tx'; tx.style.setProperty('--c', statColor(key)); tx.textContent = caption || '';
    if (ui && caption) { const hr = ui.getBoundingClientRect(), r = w.getBoundingClientRect(), tr = tool.getBoundingClientRect(), top = Math.min(r.top + r.height * 0.1, tr.bottom - tr.width * 0.9);   /* 道具の絵は読み込み前だと高さ0＝幅から見積もる */ tx.style.left = `${(r.left + r.width / 2 - hr.left).toFixed(0)}px`; tx.style.top = `${Math.max(hr.top + 70, top - 4 - hr.top).toFixed(0)}px`; ui.appendChild(tx); }   // 結果の文は道具・モンスターの上（重ねない）
    const am = lean.animate(A.mon, { duration: A.ms, easing: 'ease-in-out' }), at = tool.animate(A.tk, { duration: A.ms, easing: 'ease-in-out', fill: 'forwards' });
    return new Promise((ok) => { let done = false; const end = () => { if (done) return; done = true; try { am.cancel(); at.cancel(); } catch (e) {} tool.remove(); tx.classList.add('out'); setTimeout(() => { tx.remove(); ok(); }, 160); };
      V.skip = end; am.finished.then(end, end); setTimeout(end, A.ms + 400); });
  }
  /** 宝箱の開封の光の粒（宝箱の位置から。約0.8秒） */
  function chestSparks(obj) { const fx = $('#chffx'); if (!fx || !obj || V.calm) return; const P = objPoint(obj) || V.monPos; if (!P) return; fx.insertAdjacentHTML('beforeend', `<span class="chf-csparks" style="left:${P.x.toFixed(1)}px;top:${P.y.toFixed(1)}px;--d:${P.d || 1}"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span>`); const e = fx.querySelector('.chf-csparks:last-child'); setTimeout(() => e && e.remove(), 900); }
  function fxText(fx) {
    const L = (k) => labOf(k);
    if (fx.kind === 'chstat') return { h: `<small>${L(fx.key)}のマス</small><b>${L(fx.key)} +${fx.amount}</b>`, c: 'ok stat', frame: 'statUp', t: `${L(fx.key)} +${fx.amount}` };   // 能力マス：成長適性の値だけ上がる（失敗・大成功なし）
    if (fx.kind === 'treasure') { const tl = { normal: '宝箱', rare: '珍しい宝箱', special: '特別な宝箱' }[fx.tier] || '宝箱', gain = fx.reward && fx.reward.kind === 'gold' ? `+${fx.reward.amount}G` : ''; return { h: `<small>道端で${tl}を見つけた！</small><b>${gain || '…'}</b>`, c: `tr tr-${fx.tier}`, t: `${tl}を開けた！ ${gain}` }; }
    if (fx.kind === 'flavor') return { h: `<small>出来事</small><b>${esc(fx.text || '')}</b>`, c: `ev ev-${fx.tier || 'normal'}`, t: fx.text || '' };   // 2026-10-04：効果の無い出来事（会話だけ）
    if (fx.ev) {
      let eff = '';
      if (fx.kind === 'fatigue') eff = `疲れ −${fx.recovered}`; else if (fx.kind === 'stat') eff = `${L(fx.key)} ${fx.amount >= 0 ? '+' : '−'}${Math.abs(fx.amount)}`;
      else if (fx.kind === 'multi') eff = fx.gains.map((x) => `${L(x.key)}+${x.amount}`).join(' '); else if (fx.kind === 'gold') eff = `+${fx.amount}G`;
      if (fx.fatigueAdded > 0) eff += `　疲れ +${fx.fatigueAdded}`;   // 少し疲れて能力が上がる出来事（stat_tired）
      return { h: `<small>${esc(fx.text)}</small><b>${eff}</b>`, c: `ev ev-${fx.tier || 'normal'}`, t: `${fx.text} ${eff}` };
    }
    return null;
  }
  const objPoint = (obj) => obj ? { x: parseFloat(obj.style.left), y: parseFloat(obj.style.top) } : null;
  /**
   * 野生・ライバルとの遭遇（LEVEL 4）：止まって一瞬の静止 → 草むらが揺れて「！」（予兆）→ 野生はカットイン → バトルの案内。
   *  音は WILD_ALERT（将来ここで BGM をバトルへ切り替えられる＝MMAUDIO.scene('BATTLE', { fade:'quick' }) はバトル開始のとき）
   */
  async function encounter(m, bt) {
    const fx = $('#chffx'), w = $('#bmonw'); if (!fx || !w || !V.monPos) return;
    V.moving = false; anim('idle');
    // 2026-10-04 G3（実機で「遭遇の文が出た瞬間に右下へ古い草の断片が一瞬見える」）：予兆の草むら（.chf-rustle＝手前の草の帯を切り出した細い帯。画像の読み込みが遅いと
    //  文の直前に現れ、壊れた UI の断片に見えた）は出さない。順序：止まる → 短い静止 →「！」→「！」を消す → 遭遇の演出（予兆の物は演出を出す前に必ず無い）
    const BT = (V.cfg.battleTypes || {})[bt] || {};
    fx.querySelectorAll('.chf-rustle,.chf-alert').forEach((e) => e.remove());
    await wait(V.calm ? 0 : Math.max(380, beatOf(4)));   // 止まった直後の静止（「何かいる…」の間）
    if (BT.noRustle) return encounterShow(BT, bt, m);
    const d = V.monPos.d;
    fx.insertAdjacentHTML('beforeend', `<i class="chf-alert" style="left:${V.monPos.x.toFixed(1)}px;top:${(V.monPos.y - monH() * d * 1.02).toFixed(1)}px;--d:${d}">！</i>`);
    await wait(V.calm ? 0 : 420);   // 「！」を見せてから
    fx.querySelectorAll('.chf-rustle,.chf-alert').forEach((e) => e.remove());
    await encounterShow(BT, bt, m);
  }
  /** 野生・レアの相手の正式画像（MMCH.foeSpecies で決まる種族。バトルの相手と同じ） */
  function foeImage(m) {
    const P = root.MMP10M, n = typeof root.battleFoeCount === 'function' ? root.battleFoeCount() : 0;   // バトルの相手になれる種族の数（index.html の SP＝バトルの相手を選ぶ表）
    if (!P || !P.byId || !(n > 0) || !MMCH.foeSpecies) return null;
    const sp = P.byId(MMCH.foeSpecies(m, n)); return sp && sp.image ? { src: sp.image.src, name: sp.name } : null;
  }
  /**
   * 遭遇の演出（2026-10-04 G3。デザイン参考 D／E の構図）：
   *  野生＝自然・神秘的・少しの緊張：周りを少し暗く → 足元に金と翠の魔法陣 → 正式のモンスター（今回の相手。バトルの相手と同じ種族）→ ENCOUNTER の帯 → 文。赤い刃の交差（旧カットイン）は使わない
   *  レア＝同じ作り＋淡い後光・光の粒・札、ライバル＝赤と金の差し色・RIVAL の帯・赤い魔法陣（リュウの正式な立ち絵は無い＝人物は描かない）
   *  絵と文は同じフレームで出し、その瞬間に音（野生 wild.alert／ライバル rival.appear）。読める間だけ見せて消えてからバトルの案内
   */
  async function encounterShow(BT, bt, m) {
    const ui = $('#chf-ui'), text = BT.encounter || '', rival = bt === 'rival', cue = rival ? 'rival.appear' : bt === 'rare' ? 'rare.alert' : 'wild.alert';   // 2026-10-06：野生・レア・ライバルは別の正式 SE
    if (!ui || V.calm || !text) { feel(cue, { battleType: bt }); if (text) setMsg(text); await wait(V.calm ? 300 : 600); return; }
    const foe = rival ? null : foeImage(m), tone = esc(BT.tone || bt);
    // 2026-10-05 PHASE B（「ライバルの竜が表示されない」）：原因＝ライバルの遭遇は人物も相棒も描かない作り（foe＝null・figure＝null）で、竜（リュウの相棒）の正式素材がリポジトリ・受け取ったどの ZIP にも無い。
    //  ライバル本人＝正式の立ち絵（config.battleTypes.rival.encounterFigure）、相棒＝encounterPartner（素材が届いたら config の1行。無い間は何も描かない＝新しい竜を作らない）
    const rvFig = rival && BT.encounterFigure ? asset(V.cfg, BT.encounterFigure) : null, rvPart = rival && BT.encounterPartner ? asset(V.cfg, BT.encounterPartner) : null;
    const motes = Array.from({ length: rival ? 14 : 10 }, (_, i) => `<i class="ce-mote" style="--x:${(10 + ((i * 41) % 80)).toFixed(0)}%;--dl:${(i * 0.09).toFixed(2)}s;--s:${(3 + (i % 3) * 2)}px"></i>`).join('');
    const label = rival ? 'RIVAL' : 'ENCOUNTER';
    // 2026-10-06（試遊修正）：野生の遭遇だけ、相手は正体の分からない黒いシルエット（画像の色は変えず、絵の形を mask にした黒い面）・画面の中央付近に。
    //  img（今回の相手＝バトルの相手と同じ種族）は形と位置の基準として置くだけ（見せない・名前は出さない）。レア・ライバルは従来どおり
    const sil = bt === 'wild' && !!foe, silBox = sil ? `<i class="ce-sil" aria-hidden="true" style="-webkit-mask-image:url('${esc(foe.src)}');mask-image:url('${esc(foe.src)}')"></i>` : '';
    ui.insertAdjacentHTML('beforeend', `<div class="chf-enc chf-enc2 t-${tone}${BT.aura ? ' aura' : ''}${sil ? ' sil' : ''}" role="status" aria-label="${esc(text)}">
      <i class="ce-veil"></i>${rival ? `<div class="ce-top"><span>✦ ${label} ✦</span></div>` : ''}
      <div class="ce-stage">${BT.aura ? '<i class="ce-halo"></i>' : ''}<i class="ce-circle"></i><i class="ce-circle in"></i>${motes}${foe ? `<img class="ce-mon" src="${esc(foe.src)}" alt="${sil ? '？？？' : esc(foe.name)}" draggable="false">` : ''}${silBox}${rvFig ? `<img class="ce-rival" src="${esc(rvFig)}" alt="${esc(BT.name || 'ライバル')}" draggable="false">` : ''}${rvPart ? `<img class="ce-partner" src="${esc(rvPart)}" alt="" draggable="false">` : ''}</div>
      ${rival ? '' : `<div class="ce-band"><span>${label}</span></div>`}${BT.badge ? `<em class="ce-badge">${esc(BT.badge)}</em>` : ''}<b class="ce-tx">${esc(text)}</b></div>`);
    const el = ui.querySelector('.chf-enc2:last-child');   // 旧い名前 chf-enc も持つ（待ち合わせ・監査のテストが使う。見た目は .chf-enc2 だけ）
    feel(cue, { battleType: bt });   // 絵と文が出た瞬間
    await wait(rival ? 1350 : 1500);   // 読める間（文＋絵）
    if (el) { el.classList.add('out'); await wait(220); el.remove(); }
  }
  /**
   * 宝箱の開封アニメーション（2026-10-03 正式素材：config.tileUI.chests[tier].frames＝4枚）。見た目だけ（中身・報酬・セーブは resolveLanding の結果のまま）。
   *  1枚 110ms で切り替え、最後の1枚（開いたまま）で止まる。視差を減らす設定では最後の1枚だけ。先読みは buildScene のとき（preloadChests）
   */
  async function chestFrames(im) {
    const fr = im && im.dataset.frames ? im.dataset.frames.split('|').filter(Boolean) : [];
    if (!fr.length) return;
    if (V.calm) { im.src = fr[fr.length - 1]; return; }
    for (const src of fr) { im.src = src; await wait(110); }
  }
  /** 通常マス（LEVEL 1）：足元のマスが軽く光るだけ（何も起きない。テンポを落とさない） */
  function touchTile(tile) { if (!tile) return; tile.classList.remove('touch'); void tile.offsetWidth; tile.classList.add('touch'); feel('tile.stop'); }
  async function chfResolve() {
    const m = gS() && gS().m; if (!chfActive(m) || busyGet() || !onField() || !m.raise.pend || m.raise.pend.stage !== 'resolve') return;
    busySet(true);
    let tail = '', card = null, evStarted = false;   // evStarted＝出来事の音（EVENT_TRIGGER）を鳴らした（2択のあとで重ねない）。card＝出来事の挿絵（evCardOpen。途中で止まっても finally で必ず消す）
    try {
      const id = m.raise.node, g0 = (gS().g) | 0, f0 = MMCH.fatigue(m), r = P8().resolveLanding(gS(), m); doSave();
      let fx = r.fx || {};
      // 2026-10-04（第二段階）：選択肢のある出来事＝会話（最後の行に2択）→ 選ぶ → 選んだ効果（選ぶまで結果は決まらない・使った印も付かない。再読み込みでは同じ選択肢がもう一度出る）
      if (fx.kind === 'choice') {
        const t0 = $(`#chf .chf-tile[data-id="${id}"]`); if (t0) { t0.classList.remove('hit'); void t0.offsetWidth; t0.classList.add('hit'); }
        await wait(beatOf(2));
        feel('event', { ev: fx.ev }); evStarted = true;   // 2026-10-06：2択の出来事も、始まった瞬間に1回（EVENT_TRIGGER）
        card = await evCardOpen(fx.ev);   // 2026-10-04（追加アセット）：挿絵 → イベント名 → フィナの会話（最後に選択肢）
        const pick = await choiceTalk(fx, card);
        let r2 = P8().resolveChoice(gS(), m, pick); if (!r2.ok) r2 = P8().resolveChoice(gS(), m, (fx.options[0] || {}).id); doSave();
        if (r2.ok) { Object.assign(r, r2); fx = r2.fx || {}; }
      }
      const T = fxText(fx), obj = $(`#chf .chf-obj[data-id="${id}"]`), tile = $(`#chf .chf-tile[data-id="${id}"]`);
      refreshHud(m);
      // HUD は結果の演出が届くまで前の値（所持金・疲れ）を見せ、演出に合わせて動かす
      const g1 = (gS().g) | 0, f1 = MMCH.fatigue(m), gb = $('#chgold b'), fb = $('#chfat b'); if (gb) gb.textContent = String(g0); if (fb && (fx.kind === 'fatigue' || fx.fatigueAdded > 0)) { fb.textContent = String(f0); fatLevel(f0); }
      const gold = g1 - g0;
      if (fx.kind === 'chstat') {
        // 能力UP（LEVEL 3）：間 → マスが光る → モンスターが反応 → 能力UPの枠（数値は +0 から上がる）→ 余韻
        await wait(beatOf(3)); if (tile) { tile.classList.remove('hit'); void tile.offsetWidth; tile.classList.add('hit'); }
        await wait(V.calm ? 0 : 160); monReact('up');
        await wait(V.calm ? 0 : 150);   // モンスターの反応を見せてから枠
        setMsg(T.t);
        await trainAct(fx.key, `${labOf(fx.key)} +${fx.amount}`);   // 2026-10-06：能力に対応する道具をそばに置き、モンスターが短い特訓の動き（0.8〜1.5秒）→ 実際に上がった能力名・値 → 既存の成長演出
        // 2026-10-04 PHASE E：成長演出（能力のアイコンが浮く → 「ちから +5」→ 正式色のゲージが伸びる（999 を最大とした目盛り）→ 粒子）。枠は正式素材 frame_stat_up のまま。0.6〜1.2秒・タップで短縮
        const gains = [{ key: fx.key, amount: fx.amount }];
        feel('stat.up', { key: fx.key, amount: fx.amount });   // 2026-10-06：能力UPの表示が出る瞬間（TRAINING_SUCCESS）。道具が出た瞬間は trainAct の train.item
        await popup(`<small>${esc(labOf(fx.key))}のマス</small>${growRows(m, gains)}`, `${T.c} grow`, Math.min(holdOf(3, 800), 300), T.frame ? effectAsset(T.frame) : null, (d) => growPlay(d, gains));
        tail = T.t;
      } else if (fx.kind === 'treasure') {
        // 宝箱（LEVEL 3）：間 → 宝箱が現れる → 揺れて開く → 報酬 → 所持金へ
        await wait(beatOf(3)); if (tile) { tile.classList.remove('hit'); void tile.offsetWidth; tile.classList.add('hit'); }
        const P = objPoint(obj); if (P) camFocus(P, 0.45, CA().zoom.focus);
        if (obj && obj.classList.contains('hid')) { obj.classList.remove('hid'); await wait(V.calm ? 0 : 300); }
        if (obj) { obj.classList.add('shake'); await wait(V.calm ? 0 : 320); obj.classList.remove('shake'); const im = obj.querySelector('img[data-open]'); await chestFrames(im); if (im && im.dataset.open) im.src = im.dataset.open; obj.classList.add('open', 'hit'); }
        feel(['normal', 'rare', 'special'].includes(fx.tier) ? `chest.open.${fx.tier}` : 'chest.open', { tier: fx.tier }); monReact('treasure'); /* 2026-10-06：段階ごとに1つだけ（TREASURE_TIER_1〜3） */ chestSparks(obj);   // 2026-10-04 PHASE E：開封の光の粒
        setMsg(T.t);
        await popup(T.h, T.c, holdOf(3, 900), null, async (d) => { await wait(V.calm ? 0 : 260); if (gold > 0) await goldToHud(g0, g1, d.querySelector('b') || d); });
        if (obj) { obj.classList.remove('hit'); obj.classList.add('used'); }
        camFocus(null); tail = T.t;
      } else if (fx.ev && fx.kind !== 'none') {
        // イベント（LEVEL 2〜3）：間 → マスが光る → 出来事の文 → 結果（所持金・疲れは HUD まで動かす）
        await wait(beatOf(2)); if (tile) { tile.classList.remove('hit'); void tile.offsetWidth; tile.classList.add('hit'); }
        const restTile = tileKeyOf(m, id) === 'rest' && fx.kind === 'fatigue';
        if (!restTile && !evStarted) feel('event', { ev: fx.ev });   // 2026-10-06：出来事が始まった瞬間（EVENT_TRIGGER）。休むマスの回復は結果のときに REST_RECOVER
        if (!card) card = await evCardOpen(fx.ev);   // 2026-10-04（追加アセット）：挿絵のある出来事は、背景を暗く → 挿絵 → イベント名 → 会話
        await eventLines(fx, card);   // 2026-10-04：出来事の会話（挿絵があれば共通会話の小さな窓、無ければフィナの吹き出し。eventPool[].lines）→ 結果
        await evCardClose(card); card = null;   // 挿絵を消してから能力UP・疲れの演出
        if (fx.kind === 'stat' || fx.kind === 'multi') monReact(fx.amount < 0 ? 'down' : 'up'); else if (fx.kind === 'fatigue') { monReact('rest'); restVeil(); }
        setMsg(T.t);
        // 2026-10-04（追加アセット）：休むマス＝焚き火（疲れの回復。ライフではない）、ほかの出来事＝共通の結果の紋章。文は実際の効果（T.h の値）
        { const eff = (T.t || '').slice(String(fx.text || '').length).trim(); if (restTile) { feel('rest.recover'); await resultFx('rest', `疲れ −${fx.recovered}`); } else if (eff) await resultFx('event', eff); }
        // 2026-10-04 PHASE E：能力が動く出来事は成長のゲージ（複数の能力は縦に並べる）。休憩は青の帯＋疲れの増減。少し疲れる出来事（stat_tired）は疲れの増減も見せる
        const eg = fx.kind === 'stat' ? [{ key: fx.key, amount: fx.amount }] : fx.kind === 'multi' ? fx.gains.map((x) => ({ key: x.key, amount: x.amount })) : [];
        const eh = eg.length ? `<small>${esc(fx.text)}</small>${growRows(m, eg)}` : T.h;
        await popup(eh, `${T.c}${eg.length ? ' grow' : ''}`, holdOf(fx.tier === 'special' ? 3 : 2, 1200), null, async (d) => { await wait(V.calm ? 0 : 200); if (eg.length) await growPlay(d, eg); if (gold > 0) await goldToHud(g0, g1, d.querySelector('b') || d); if (fx.kind === 'fatigue') await fatigueHud(f0, f1); else if (fx.fatigueAdded > 0 && f1 !== f0) await fatigueHud(f0, f1); });
        tail = T.t;
      } else if (fx.kind === 'battle') { if (tile) { tile.classList.remove('hit'); void tile.offsetWidth; tile.classList.add('hit'); } await encounter(m, fx.battleType); }
      else touchTile(tile);   // 通常マス・分かれ道・合流：最小限
      if (fx.kind !== 'battle' && V.focus) camFocus(null);   // 寄り・ズームを戻す（次の操作の前にいつもの見え方へ）
      if (gb && gold > 0 && gb.textContent !== String(g1)) gb.textContent = String(g1);   // 念のため（演出を飛ばしたとき）
      if (r.goal) tail = `${tail}　大会会場に着いた！`.trim(); else if (r.timeUp) tail = `${tail}　ターンを使い切った…`.trim();
      if (!fx.ev && !['chstat', 'treasure', 'battle', 'choice'].includes(fx.kind) && tileKeyOf(m, id) === 'normal' && !r.goal && !r.timeUp) await reactionAt(m);   // 2026-10-07：冒険リアクション（通常マスだけ）
      await showReaction(m, fx);
      await storyAt(m, 'land', { fx, goal: !!r.goal });
    } finally { if (card) await evCardClose(card); busySet(false); }
    if (onField()) chfBoard(tail || undefined);
  }
  // ---- 2026-10-04（第二段階・追加アセット）：イベントの挿絵カード（config.eventPool[].image・title）。
  //  背景（フィールド）を少し暗くし、横長の挿絵を画面の上寄りに大きく（全面背景にはしない・上下を切らない 3:2）→ 下にイベント名の札。
  //  会話は共通会話の小さな窓（compact）で下に出す＝挿絵を隠さない。終わったら挿絵を消してから既存の能力UP・疲れの演出。挿絵の無い出来事は従来どおり ----
  const evDefOf = (id) => ((V.cfg && V.cfg.eventPool) || []).find((e) => e.id === id) || null;
  async function evCardOpen(evId) {
    const e = evDefOf(evId), ui = $('#chf-ui'); if (!e || !e.image || !ui || !onField()) return null;
    ui.querySelectorAll('.chf-evc,.chroll,.chf-fina,.chf-rustle,.chf-excl').forEach((x) => x.remove());   // 前の表示を残さない（出目の札・吹き出し・予兆）
    const d = document.createElement('div'); d.className = 'chf-evc'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', e.title || 'イベント'); d.dataset.ev = e.id;
    d.innerHTML = `<div class="chf-evc-dim"></div><figure class="chf-evc-card"><img src="${esc(e.image)}" alt="" decoding="async"><figcaption><b>${esc(e.title || '')}</b></figcaption></figure>`;
    ui.appendChild(d);
    const img = d.querySelector('img');   // 読み込み（デコード）を待ってから出す＝白い一瞬を出さない（先読み evArtPreload 済みなら即座）
    try { if (img.decode) await Promise.race([img.decode(), wait(1500)]); } catch (_) {}
    void d.offsetWidth; d.classList.add('on');
    await wait(V.calm ? 60 : 380);
    return d;
  }
  async function evCardClose(d) { if (!d || !d.isConnected) return; d.classList.remove('on'); d.classList.add('out'); await wait(V.calm ? 40 : 260); d.remove(); }
  /** この配置で起こりうる出来事の挿絵だけを、少しずつ先読み（一括で読み込まない。1枚ずつ間を空ける） */
  function evArtPreload(m) {
    const f = m && m.raise && m.raise.field; if (!f || typeof Image === 'undefined') return; const key = `${f.layoutSeed}:${f.chapterId}`; if (V.evArtKey === key) return; V.evArtKey = key;
    const ids = [...new Set(Object.values(f.nodeAssignments || {}).map((a) => a && a.ev).filter(Boolean))];
    const srcs = ids.map((id) => (evDefOf(id) || {}).image).filter(Boolean);
    // 1枚ずつ順に（読み終えてから次へ）。フィールドを離れた・別の配置になったら続けない（ほかの画面で読み込みを起こさない）
    const live = () => V.evArtKey === key && onField() && chfActive(gS() && gS().m);
    const next = (i) => {
      if (i >= srcs.length) return; if (!live()) { if (V.evArtKey === key) V.evArtKey = null; return; }   // 戻ってきたら続きから（読み終えた分はキャッシュ）
      const im = new Image(); im.decoding = 'async'; const go = () => setTimeout(() => next(i + 1), 700); im.onload = go; im.onerror = go; im.src = srcs[i];
    };
    if (srcs.length) setTimeout(() => next(0), 1500);
  }
  // ---- 2026-10-04（第二段階）：イベントの会話と選択肢（js/chapter/events.js の MMEVT。キューで順に出す＝フィナの会話・演出・遭遇が重ならない） ----
  const queued = (fn) => (root.MMEVT ? MMEVT.run(fn) : fn());
  /** 出来事の会話（eventPool[].lines＝フィナの吹き出しを順に）。自動テスト（MM_QA_NO_STORY）では出さない */
  async function eventLines(fx, card) {
    const L = Array.isArray(fx.lines) ? fx.lines : [];
    if (card) {   // 挿絵がある：共通会話（フィナの半身＋小さな窓。タップで進む ▼）で読む。自動テスト（MM_QA_NO_STORY）では挿絵だけ短く見せる
      if (!L.length || root.MM_QA_NO_STORY || !root.MMNPC || !onField()) { await wait(V.calm ? 120 : 420); return; }
      const lines = L.map((l) => (root.MMEVT ? MMEVT.lineOf(l) : { npc: 'fina', expression: l.expression || 'normal', text: l.text }));
      await queued(() => MMNPC.talk(lines, { kind: 'event', presentation: 'compact' })); return;
    }
    if (!L.length || root.MM_QA_NO_STORY || !onField()) return;
    await queued(async () => { for (const l of L) { if (!onField()) break; const x = root.MMEVT ? MMEVT.lineOf(l) : { expression: l.expression, text: l.text }; await finaBubble({ text: x.text, expression: x.expression || 'normal' }); } });
  }
  /** 選択肢のある出来事：会話（最後の行に選択肢）→ 選んだ id。自動テスト・会話UIが無いときは最初の候補（MM_QA_CHOICE で指定できる） */
  async function choiceTalk(fx, card) {
    const E = root.MMEVT, first = (fx.options && fx.options[0] && fx.options[0].id) || null;
    if (!E || !root.MMNPC || root.MM_QA_NO_STORY) { if (card) await wait(V.calm ? 120 : 420); return E ? E.autoChoice(fx) : first; }
    const id = await queued(() => MMNPC.talk(E.choiceLines(fx), { kind: 'event', presentation: card ? 'compact' : 'board' }));   // 挿絵があるときは小さな窓（挿絵を隠さない）。無いときはボードの大きな窓（2026-10-04 G2）
    return (fx.options || []).some((o) => o.id === id) ? id : first;
  }
  // ---- 同行者（フィナ）のリアクションの差し込み口：停止地点の結果 → MMCH.companionReaction（config.companion.reactions）→ 登録した描画（既定は何も出さない。会話UIは未決） ----
  //  既定の描画：フィナの小さな吹き出し（.chf-fina：顔・名前・一言。約1.6秒で消える。config.companion.reactions に本文があるときだけ出る＝本文は未決）
  const FINA_FACE = './assets/npc/fina/closeup/';
  async function finaBubble(rx) {
    const ui = $('#chf-ui'); if (!ui || !rx || !rx.text) return;
    const old = ui.querySelector('.chf-fina'); if (old) old.remove();
    const d = document.createElement('div'); d.className = 'chf-fina'; d.setAttribute('aria-live', 'polite');
    // 2026-10-03 夜（試遊で「どこを押せば進むか分からない」）：会話欄の右下に「タップで進む ▼」（点滅）。会話欄のタップで進む。この会話の間だけ START でも進む
    //  （START の上に透明な「会話を進める」ボタンを重ねる＝サイコロは振らない）。出てから0.3秒の押下は無視（直前の操作の取り違え防止）。読める長さが過ぎたら自動でも進む
    d.innerHTML = `<img src="${FINA_FACE}${esc(rx.expression || 'normal')}.webp" alt=""><div><b>フィナ</b><span>${esc(rx.text)}</span></div><i class="chf-fina-go" aria-hidden="true">タップで進む<em>▼</em></i>`;
    ui.appendChild(d);
    const st = $('#brollbtn') || $('#chdock .chstop'), host = st && st.parentElement;   // 移動・結果の間の START は押せない飾り（id なし）＝その枠に重ねる
    let go = null; if (host) { go = document.createElement('button'); go.type = 'button'; go.className = 'chf-fina-st'; go.setAttribute('aria-label', '会話を進める'); go.dataset.nsfx = '1'; host.appendChild(go); }
    // 読める長さだけ見せる（文字数に合わせる・タップで次へ）。通常マスでは出さない（節目だけ）
    const ms = V.calm ? 900 : Math.min(4200, 1600 + 80 * String(rx.text).length), t0 = Date.now();
    await new Promise((ok) => { const t = root.MM_QA_FINA_AUTO || root.MM_QA_NO_STORY ? setTimeout(ok, ms) : null; /* 2026-10-06：タップで進む（自動では次へ進まない＝自分のペースで読む）。自動テストだけ読める長さで進む */ const next = (e) => { if (e) { e.preventDefault(); e.stopPropagation(); } if (Date.now() - t0 < 300) return; clearTimeout(t); ok(); }; d.addEventListener('click', next); if (go) go.addEventListener('click', next); });
    if (go) go.remove();
    d.classList.add('out'); await wait(220); d.remove();
  }
  /**
   * Chapter のイベント（config.story。MMCH.storyEvents）：節目のフィナの一言など。trigger＝'start'（Chapter に入った最初）／'land'（止まったあと）。
   *  1つ選んで（優先度の高いもの）その行を順に出す。見たら記録（この個体のこの Chapter で1回）。自動テストでは出さない（MM_QA_NO_STORY）
   */
  async function storyAt(m, trigger, ctx = {}) {
    if (!root.MMCH || !MMCH.storyEvents || root.MM_QA_NO_STORY || !onField()) return;
    const P = root.MMP10M, S0 = gS(), flags = S0 ? (S0.npcFlags = (S0.npcFlags && typeof S0.npcFlags === 'object' && !Array.isArray(S0.npcFlags)) ? S0.npcFlags : {}) : null;   // scope 'save'（チュートリアル）の見た記録＝S.npcFlags.story
    const ev = MMCH.storyEvents(m, trigger, { ...ctx, flags, visitedFields: V.lastFields || [], species: P && P.keyOf ? P.keyOf(m.sp) : null, raiseCount: (S0 && S0.raiseRec) | 0 })[0];
    if (!ev) return;
    MMCH.markStory(m, ev.id, flags); doSave();
    await queued(async () => {
      if (!onField()) return;
      if (ev.presentation === 'talk' && root.MMNPC) { await MMNPC.talk((ev.lines || []).map((l) => ({ npc: l.speaker || 'fina', expression: l.expression || 'normal', text: l.text })), { kind: 'fina', presentation: 'board' }); return; }   // 2026-10-04 G2：チュートリアル（宝箱の説明など）はボードの大きな窓（操作欄の上・操作欄は押せない）
      for (const l of ev.lines || []) { if (!onField()) break; await finaBubble({ text: l.text, expression: l.expression || 'normal' }); }
    });
  }
  /**
   * 冒険リアクションイベント（2026-10-07。js/chapter/reactions.js の MMREACT）：通常マスに止まったとき、確率で
   *  モンスターのしぐさ（共通モーション）→ フィナの解釈（小さな会話窓・最後に選択肢）→ 選んだ小さな結果（疲れ・能力 +1・薬草・演出だけ）。モンスターは喋らない。
   *  発生の記録は配置の中（m.raise.field.rx）。自動テストは MM_QA_NO_STORY で出さない
   */
  async function reactionAt(m) {
    const R = root.MMREACT; if (!R || !root.MMNPC || root.MM_QA_NO_STORY || !onField()) return;
    const ev = R.pick(m); if (!ev) return;
    R.mark(m, ev.id); doSave();
    await queued(async () => {
      if (!onField()) return;
      const w = $('#bmonw'); await wait(beatOf(1)); const ms = R.play(w, ev.motion); await wait(V.calm ? 0 : Math.min(ms, 900));
      const id = await MMNPC.talk([{ npc: 'fina', expression: ev.expression, text: ev.line, choices: ev.choices.map((c, i) => ({ id: String(i), label: c.label })) }], { kind: 'fina', presentation: 'compact' });
      const f0 = MMCH.fatigue(m), res = R.apply(gS(), m, ev, id == null ? 0 : +id); doSave();
      const f1 = MMCH.fatigue(m); refreshHud(m); const fb = $('#chfat b'); if (fb && f1 !== f0) { fb.textContent = String(f0); fatLevel(f0); }
      const nm = (k) => { const d = root.MMP7 && root.MMP7.getItemDef(k); return d ? d.name : k; };
      if (res.kind === 'stat') monReact('up');   // +1 は小さな結果＝能力UPの音（TRAINING_SUCCESS）は鳴らさない
      else if (res.kind === 'fatigue' && res.fatigue < 0) monReact('rest');
      else if (res.kind === 'item') monReact('treasure');
      else R.play(w, ev.sp === 4 ? 'lookAway' : ev.sp === 3 ? 'stoneReaction' : 'happy');
      const eff = res.kind === 'stat' ? `${labOf(res.key)} +${res.amount}` : res.kind === 'fatigue' ? `疲れ ${res.fatigue < 0 ? '−' : '+'}${Math.abs(res.fatigue)}` : res.kind === 'item' ? `${nm(res.item)} を見つけた！` : '';
      const head = esc(res.text || ev.title);
      setMsg(eff ? `${head}　${esc(eff)}` : head);
      await popup(eff ? `<small>${head}</small><b>${esc(eff)}</b>` : `<small>${esc(ev.title)}</small><b>${head}</b>`, 'ev ev-normal rx', holdOf(2, 1000), null, async () => { if (f1 !== f0) await fatigueHud(f0, f1); });
    });
  }
  let reactionRenderer = (rx) => finaBubble(rx);
  function registerReactionRenderer(fn) { reactionRenderer = typeof fn === 'function' ? fn : null; }
  async function showReaction(m, fx) {
    if (!reactionRenderer) return;
    try { const rx = MMCH.companionReaction(m, fx); if (rx) await reactionRenderer(rx, { m, fx, calm: V.calm }); } catch (e) {}
  }
  // ---- アイテム（疲れ回復）：サイコロを振る前だけ。正式な回復アイテムが登録されていなければ、使えるものは無い ----
  function chfItems() {
    const m = gS() && gS().m; if (!chfActive(m) || busyGet() || P8().boardPhase(m) !== 'roll') return;
    const bag = (gS().inv && gS().inv.bag) || [], list = bag.map((it, i) => ({ it, i, eff: MMCH.fatigueItemEffect(it.id) })).filter((x) => x.eff);
    const ui = $('#chf-ui'); if (!ui) return; chfItemsClose();
    const nm = (id) => { const d = root.MMP7 && root.MMP7.getItemDef(id); return d ? d.name : id; };   // 2026-10-06：p7ItemName は index.html の const（window には無い）＝アイテムの名前は MMP7 の登録から
    ui.insertAdjacentHTML('beforeend', `<div class="chsheet chitems" id="chitems"><h3>アイテム</h3>${list.length ? list.map((x) => `<button class="p9btn2" onclick="chfItemUse(${x.i})">${root.MM_ITEM_ICON && root.MM_ITEM_ICON[x.it.id] ? `<img class="itic" src="${esc(root.MM_ITEM_ICON[x.it.id])}" alt="" decoding="async">` : ''}${esc(nm(x.it.id))}<small>${x.eff.full ? '疲れ 全回復' : `疲れ −${x.eff.amount}`}</small></button>`).join('') : '<p class="p9s">疲れを回復できるアイテムを持っていません。</p>'}<button class="p9btn2" onclick="chfItemsClose()">閉じる</button></div>`);
  }
  function chfItemsClose() { const d = $('#chitems'); if (d) d.remove(); }
  function chfItemUse(i) { const m = gS() && gS().m; if (!chfActive(m) || busyGet()) return; const r = MMCH.useFatigueItem(gS(), m, i); if (!r.ok) return chfItemsClose(); doSave(); chfBoard(`疲れ −${r.recovered}`); }
  // bBusy は index.html の let（別のスクリプトからも同じ名前で読み書きできる）
  function busyGet() { try { return !!bBusy || !!(root.MMCHD && MMCHD.isLocked()); } catch (e) { return !!(root.MMCHD && MMCHD.isLocked()); } }
  function busySet(v) { try { bBusy = v; } catch (e) {} }
  root.addEventListener && root.addEventListener('resize', () => { const m = gS() && gS().m; if ($('#chf') && chfActive(m) && V.monPos && !V.moving) { V.par0 = null; camTarget(V.monPos.x, V.monPos.y, V.monPos.d, true); } });

  Object.assign(root, { chfActive, chfBoard, chfRoll, chfRest, chfPick, chfContinue, chfResolve, chfItems, chfItemsClose, chfItemUse, chfOpen });
  root.MMCHV = Object.freeze({ STEP_MS, FACING, DEFAULTS: DEF, MON_ENTER, RESULT_FX: RFX_DEF, RESULT_FX_MS: RFX_MS, TRAIN_ACT, resultFxSrc: rfxSrc,
    queueWin: () => { V.winPending = true; },
    state: () => ({ field: V.field, cam: { ...V.cam }, target: { ...V.tgt }, key: V.key, moving: V.moving, look: [...V.look], focus: V.focus ? { ...V.focus } : null, monster: V.monPos ? { ...V.monPos } : null, animator: (V.animator || DEFAULT_ANIMATOR).id }),
    lookOf, sideOffset, landmarkPos: (id) => { const n = V.g && V.g.nodes[id]; if (!n) return null; const m = gS() && gS().m, a = MMCH.fieldOf(m).nodeAssignments[id] || (['strong', 'rival'].includes(n.kind) ? { t: 'battle', bt: n.kind } : null), look = lookOf(V.cfg, a); return look ? landmarkPos(V.cfg, V.g, V.sc, id, look) : null; },
    zoomAt, registerMonsterAnimator, MON_ENTER, registerReactionRenderer, focusPoint, tileKeyOf, tileSpriteOf, tileBox, discBox, discKeyOf, seenRoadW, tileFitKind, roadX: (x, y, d) => roadX(x, y, d != null ? d : depthAtY(y)), stepDuration: (from, to) => { const r = MMCH.routeBetween(V.g, from, to).map((p) => [p[0] * V.sc.w, p[1] * V.sc.h]); return stepDuration(r, to); } });
})(typeof window !== 'undefined' ? window : globalThis);
