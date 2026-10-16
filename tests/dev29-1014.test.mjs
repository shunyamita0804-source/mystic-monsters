// =========================================================
// 2026-10-14 開発29（iPhone の実機の指摘の最小差分）
//  D29-01 公開クレジット credits.html（ポケットサウンドの4行が見える・リンク）・設定の画面から1か所だけ
//  D29-02 観客の声の再生の gain だけ約 +6dB（旧→新）・曲・区間・既定（通常 1.0秒）・設定は不変
//  D29-03 決着の曲の間は飛ばせない（WIN 4.00秒／LOSE 5.00秒＝捕獲の段階で押下と Enter／Space を止める・時刻で必ず解ける・自動テストの既定は止めない）
//  D29-04 決着のあと旧 2D の決着のポーズ（poseSeq）・倒れる動き（.dead）を出さない＝正式の待機立ち絵（arena.js の fin）
//  D29-05 マスの上面の紋章を金の輪の近くまで（tiles_top_1012 の README・作り方）
//  D29-06 立体サイコロの正式の面＝正式デザイン A から（cube_1014 の sha256・A の sha256・面取りの帯と角の丸い飾りは出さない）
//  D29-07 固有スキルの正式エフェクト5枚（原本の sha256＝納品の一覧・派生・足もとの点・寄りの速さ）
//  D29-08 後ろから追うカメラ（project の回転・進む向きの角度・本編の Chapter 1 だけ・歩行の向きは回したあとの向きで選ぶ）
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const HTML = rd('index.html');
const sha = (p) => crypto.createHash('sha256').update(readFileSync(path.join(ROOT, p))).digest('hex');
const J = (x) => JSON.parse(JSON.stringify(x));

test('D29-01：公開クレジット＝credits.html に「効果音：ポケットサウンド」「https://pocket-se.info/」「使用音源：ゲームオーバー＃２」「https://pocket-se.info/archives/754/」が見える・設定の画面から1か所', () => {
  const c = rd('credits.html');
  const text = c.replace(/<style[\s\S]*?<\/style>/, '').replace(/<[^>]+>/g, '');
  for (const s of ['効果音：ポケットサウンド', 'https://pocket-se.info/', '使用音源：ゲームオーバー＃２', 'https://pocket-se.info/archives/754/']) assert.ok(text.includes(s), s);
  assert.match(c, /<a href="https:\/\/pocket-se\.info\/" target="_blank" rel="noopener noreferrer">/);
  assert.match(c, /<a href="https:\/\/pocket-se\.info\/archives\/754\/" target="_blank" rel="noopener noreferrer">/);
  assert.match(c, /<meta name="viewport" content="width=device-width/);
  assert.equal((HTML.match(/credits\.html/g) || []).length, 1, 'ゲームからの入口は1か所（設定）');
  assert.match(HTML, /<div class="pfrow tcred"><dt>音源クレジット<\/dt><dd><a class="tsnd" href="\.\/credits\.html" target="_blank" rel="noopener">ひらく<\/a><\/dd><\/div>/);
  assert.match(rd('AUDIO_CREDITS.md'), /ポケットサウンド/);
});

function loadRegistry() {
  const got = { bgm: {}, se: {} }, w = { MMAUDIO: { registerAll: (r) => { Object.assign(got.bgm, r.bgm); Object.assign(got.se, r.se); } } };
  new Function('window', rd('js/audio/audio-registry.js'))(w);
  return got;
}
test('D29-02：観客の声＝gain だけ約 +6dB（曲・区間・既定・設定は不変）', () => {
  const { se } = loadRegistry();
  const OLD = { CROWD_HIT: 0.55, CROWD_HIT_LONG: 0.6, CROWD_MISS: 0.55, CROWD_MISS_LONG: 0.53, CROWD_EVADE: 0.2, CROWD_EVADE_LONG: 0.15 };
  const NEW = { CROWD_HIT: 1.08, CROWD_HIT_LONG: 1.19, CROWD_MISS: 1.11, CROWD_MISS_LONG: 1.06, CROWD_EVADE: 0.39, CROWD_EVADE_LONG: 0.30 };
  for (const k of Object.keys(NEW)) {
    assert.equal(se[k].gain, NEW[k], k);
    const db = 20 * Math.log10(NEW[k] / OLD[k]); assert.ok(db > 5.5 && db < 7, `${k} +${db.toFixed(1)}dB`);
  }
  assert.match(se.CROWD_HIT_LONG.src[0], /hit_cheer_2p0_3p0_1000ms\.ogg$/); assert.match(se.CROWD_EVADE.src[0], /evade_boo_0p0_0p6_600ms\.ogg$/);
  const C = rd('js/battle/crowd.js'); assert.match(C, /const DEF = Object\.freeze\(\{ mode: 'long', level: 'std' \}\)/); assert.match(C, /GAINS = Object\.freeze\(\{ std: 1, soft: 0\.6 \}\)/);
});

test('D29-03：決着の曲の間は飛ばせない＝WIN 4000ms・LOSE 5000ms・#bt の中の押下と Enter／Space を捕獲の段階で止める・時刻で解ける・表へ戻ったときも見る', () => {
  assert.match(HTML, /const RJ_MS=\{win:4000,lose:4600\}/);   // 2026-10-14 実機試遊⑥（ユーザー指示「戻るのボタンをそれまでに出す」）：LOSE 5.00秒の曲が終わる前（4.6秒＋0.3秒のフェード）に「もどる」を出して押せる
  assert.match(HTML, /function resultJingle\(win,b\)\{if\(!b\|\|b\.dataset\.rj\)return;b\.dataset\.rj=win\?"win":"lose";try\{rjLock\(win,b\)\}catch\(e\)\{\}/, 'WIN!／LOSE の帯（1回）で止める');
  assert.match(HTML, /\["pointerdown","pointerup","mousedown","mouseup","touchstart","touchend","click","dblclick"\]\.forEach\(t=>document\.addEventListener\(t,e=>\{if\(!RJ\.until\|\|!RJ\.bt\|\|!\(e\.target instanceof Node\)\|\|!RJ\.bt\.contains\(e\.target\)\)return;if\(!rjLocked\(\)\)return;e\.stopImmediatePropagation\(\)/);
  assert.match(HTML, /function rjLocked\(\)\{if\(!RJ\.until\)return false;if\(Date\.now\(\)<RJ\.until&&RJ\.bt&&RJ\.bt\.isConnected\)return true;rjUnlock\(\);return false\}/, '時刻で判定（タイマーが止まっても解ける）');
  assert.match(HTML, /\["visibilitychange","pageshow","focus"\]/);
  assert.match(HTML, /function rjLock\(win,b\)\{if\(window\.MM_QA_NO_RJLOCK\)return;/);
  assert.match(rd('js/battle/arena.js'), /'#bt\[data-rjlock\] \.gow,#bt\[data-rjlock\] #go\{opacity:0!important;pointer-events:none!important\}'/, '止めている間は「もどる」を見せない（arena.js の CSS）');
  assert.match(rd('tests/e2e/harness.mjs'), /if \(!opt\.rjlock\) await ctx\.addInitScript\(\(\) => \{ window\.MM_QA_NO_RJLOCK = true; \}\)/);
  // fight()（Phase 6）は変えない：決着の帯のすぐ後に「もどる」を押せるようにする行はそのまま
  assert.match(HTML, / ban\(win\?"WIN!":"LOSE",win\?"#ffd23f":"#9aa0b5",1\);say\(res\);go\.disabled=false;gtx\("もどる"\);/);
});

test('D29-04：決着のあと旧 2D の決着のポーズ（poseSeq の SPX）・倒れる動き（.dead）を出さない＝正式の待機立ち絵（fin）。勝った自分は正式の勝利の絵のまま', () => {
  const A = rd('js/battle/arena.js');
  assert.match(A, /if \(ban && \/\^\(WIN!\|LOSE\)\/\.test\(ban\.textContent \|\| ''\)\) fin\(bt\);/);
  assert.match(A, /'#bt\.mma-fin \.mon>:not\(\.mma-win\):not\(\.mma-fin\)\{visibility:hidden!important;opacity:0!important\}'/);
  assert.match(A, /'#bt\.mma-fin \.mw\.dead,#bt\.mma-fin \.dead \.mon\{animation:none!important;transform:none!important;opacity:1!important;filter:none!important;transition:none!important\}'/);
  // 2026-10-15 N02：負けた側は正式 2.5D の「しょんぼり」（読めていなければ待機立ち絵）・勝った側は従来どおり
  assert.match(A, /im\.className = 'mma-fin' \+ \(la \? ' mma-lose' : ''\) \+ \(flipOf\(s, sp\) \? ' fl' : ''\);[^\n]*im\.src = src;/, '立ち絵＝待機立ち絵（idleSrc）または負けた姿・向きは flipOf');
  assert.match(HTML, /function poseSeq\(s,sp,seq,h\)/, 'fight() の旧のポーズの処理・旧の絵（SPX）は残す（技の演出でも使う）');
});

test('D29-05：マスの上面の紋章＝金の輪の近くまで（作り方・README）・円盤はそのまま', () => {
  const R = rd('assets/fields/ch1a/tiles_top_1012/README.md');
  assert.match(R, /2026-10-14 開発29（5）/); assert.match(R, /2026-10-14 実機試遊⑳/); assert.match(R, /FIT 0\.97/);
  assert.match(rd('tools/fx1011/tops_1014.py'), /FIT = '0\.97'/);   // 2026-10-14 実機試遊⑳：金の外枠の直前まで（旧 0.90）
  assert.match(rd('tools/fx1011/top_composite.py'), /comp\.putalpha\(base\.getchannel\('A'\)\)/, '外形・透明度は円盤のまま');
  for (const n of ['tile_stat_life', 'tile_stat_power', 'tile_stat_intelligence', 'tile_stat_accuracy', 'tile_stat_evasion', 'tile_stat_toughness', 'tile_wild_monster', 'tile_treasure', 'tile_meal', 'tile_rival', 'tile_event', 'tile_rare_monster']) assert.ok(existsSync(path.join(ROOT, `assets/fields/ch1a/tiles_top_1012/${n}.webp`)), n);
});

test('D29-06：立体サイコロ＝正式デザイン A（sha256）から作った6面（README の sha256）・面取りの帯と角の丸い飾りは出さない・動き／出目は不変', () => {
  const R = rd('assets/fields/ch1a/dice/cube_1014/README.md');
  assert.match(R, /cb3a716e4f47eac967b9056608af2a4cc65c7171b02506bab61f6b67302d265b/, '原本 A の sha256');
  for (let v = 1; v <= 6; v++) { const m = new RegExp(`\\| face_${v}\\.webp \\| ([0-9a-f]{64}) \\|`).exec(R); assert.ok(m, `face_${v}`); assert.equal(sha(`assets/fields/ch1a/dice/cube_1014/face_${v}.webp`), m[1]); }
  const ctx = { performance: { now: () => 0 } }; ctx.globalThis = ctx; vm.runInNewContext(rd('js/chapter/dice-cube.js'), ctx);
  const D = ctx.MMDICE3D;
  // 2026-10-14 実機試遊③：面の目の大きさ・角の飾りをそろえた対称版（cube_1014s＝cube_1014 の画素を並べ直しただけ）。cube_1014 はファイルだけ残す（上の sha256）
  assert.equal(D.SKIN.official, './assets/fields/ch1a/dice/cube_1014s/face_');
  { const R2 = rd('assets/fields/ch1a/dice/cube_1014s/README.md'); for (let v = 1; v <= 6; v++) { const m = new RegExp(`\\| face_${v}\\.webp \\| ([0-9a-f]{64}) \\|`).exec(R2); assert.ok(m, `1014s face_${v}`); assert.equal(sha(`assets/fields/ch1a/dice/cube_1014s/face_${v}.webp`), m[1]); } }
  const h = D.cubeHtml('official');
  assert.equal((h.match(/class="d3-f"/g) || []).length, 6); assert.equal((h.match(/class="d3-k"/g) || []).length, 6); assert.equal((h.match(/d3-e|class="d3-c"/g) || []).length, 0);
  assert.deepEqual(J(D.BASE), { 1: [0, 0], 6: [0, 180], 3: [0, -90], 4: [0, 90], 5: [-90, 0], 2: [90, 0] }, '出目の向きは不変');
  assert.match(rd('tools/dice1014/faces_from_a.py'), /T, L1, C, R1 = \(510, 28\), \(116, 200\), \(505, 328\), \(902, 198\)/);
});

test('D29-07：固有スキルの正式エフェクト5枚＝原本（納品の sha256）・派生 640・足もとの点・立ち絵の後ろ・寄りは 0.27秒', () => {
  const ORIG = { '01_Solamo_personality_adjusted.png': '2ebe1ccb7e83c4bf7a24c0757387ce7d9ee8ba36fad6a6737d97c0d22cd53f9a', '02_Gauru_personality_adjusted.png': 'ea26e4330c87d48b2b9cfddc75bfd46738f7718331da6c9488a677f3d20de657',
    '03_Nobiton_personality_adjusted.png': 'ce87ef55682a2ea37ecb9f14346c770e38b193b5de4f7ab15fbcec754ad75c91', '04_Geol_personality_adjusted.png': 'b98f7547c693783bba9130f917df5990f604fd4b41d4ffb7108a6523452739c7',
    '05_Regnas_personality_adjusted.png': 'fe391addefa9b0a544e5915649caee6855fdf4aa2214f957cc2b5da39bfc06bc' };
  for (const [f, h] of Object.entries(ORIG)) assert.equal(sha(`assets/battle/skill_fx_1014/original/${f}`), h, f);
  const R = rd('assets/battle/skill_fx_1014/README.md');
  for (const k of ['solamo', 'gauru', 'nobiton', 'jiol', 'regnas']) { const m = new RegExp(`\\| ${k} \\|[^\\n]*\\| ([0-9a-f]{64}) \\|`).exec(R); assert.ok(m, k); assert.equal(sha(`assets/battle/skill_fx_1014/${k}.webp`), m[1], k); }
  const S = rd('js/battle/rules.js');
  assert.match(S, /const CUT = Object\.freeze\(\{ in: 270, hold: 1740, out: 330, card: 170, calm: 1300, zMax: 1\.45,/);   // 2026-10-14 実機試遊⑪：寄り終わってから約0.7秒長く（hold 1040 → 1740）
  assert.match(S, /mw\.insertBefore\(im, mw\.firstChild\)/, '.mw の中の立ち絵の後ろ');
  assert.match(S, /'#bt \.mmskc-fx\{position:absolute;z-index:-1;/);
  assert.match(S, /\(fx \? '' : `<i class="mmskc-ring"/, '正式エフェクトがあれば仮の輪は出さない');
  assert.match(S, /se: 'SKILL_ACTIVATE'/, 'SE は従来の暫定のまま（音色は正式承認待ち）');
});

test('D29-08：後ろから追うカメラ＝project の回転（yaw）・進む向きの角度・本編の Chapter 1 だけ（試作の既定は北が上）', () => {
  const ctx = { performance: { now: () => 0 } }; ctx.globalThis = ctx; ctx.window = ctx; vm.runInNewContext(rd('js/proto/roadfirst-world.js'), ctx);
  const W = ctx.MMRF_WORLD;
  assert.equal(W.DEF.heading, false, '試作の既定は従来どおり');
  assert.ok(Math.abs(W.headingYaw(0, -1)) < 1e-9); assert.ok(Math.abs(W.headingYaw(1, 0) + 90) < 1e-9); assert.ok(Math.abs(Math.abs(W.headingYaw(0, 1)) - 180) < 1e-9); assert.ok(Math.abs(W.headingYaw(-1, 0) - 90) < 1e-9);
  assert.equal(W.angDiff(170, -170), 20); assert.equal(W.angDiff(-170, 170), -20);
  const cam = { tx: 100, ty: 100, s: 2, tilt: 0, P: 900, ax: 200, ay: 400 };
  for (const [dx, dy] of [[1, 0], [-1, 0.3], [0.6, 0.8], [0, 1]]) {   // 進む向きへ回すと、その向きの点は注視点の真上（画面の上）
    const yaw = W.headingYaw(dx, dy), q = W.project({ ...cam, yaw }, 100 + dx * 50, 100 + dy * 50);
    assert.ok(Math.abs(q.x - 200) < 1e-6 && q.y < 400, `${dx},${dy} → ${q.x},${q.y}`);
  }
  const q0 = W.project(cam, 150, 100), q1 = W.project({ ...cam, yaw: 0 }, 150, 100); assert.deepEqual([q0.x, q0.y], [q1.x, q1.y], 'yaw 0 は従来と同じ');
  const WB = rd('js/chapter/world-board.js');
  assert.match(WB, /const camOpts = \(\) => \(!QA_CAM \? \{ heading: true, yawTau: 600 \}/, '2026-10-16 夜間 QA：URL の ?qaCam が無いときは従来どおり');
  assert.match(WB, /zoomTau: CAM\.zoomTau, \.\.\.camOpts\(\), (\.\.\.\(QA_ROAD\(\) \? \{ qaRoad: QA_ROAD\(\) \} : \{\}\), )?visual: vis, skin: skinKey\(\) \}\);/, '本編の Chapter 1（2026-10-14 Chapter 1 B／C から visual・A／B／C 高品質化から skin も渡す）');   // 2026-10-14 実機試遊 Q12：曲がり角で回りすぎない（yawTau 420 → 600）
  assert.match(WB, /const r = pickDir\(ddx \* Math\.cos\(yw\) - ddy \* Math\.sin\(yw\), ddx \* Math\.sin\(yw\) \+ ddy \* Math\.cos\(yw\), SPR\.sets,/, '歩行の向きは回したあとの画面の向き');
  const RW = rd('js/proto/roadfirst-world.js');
  assert.match(RW, /rotate\(\$\{\(c\.yaw \|\| 0\)\.toFixed\(3\)\}deg\) translate\(\$\{-c\.tx\}px,\$\{-c\.ty\}px\)/, '地面の板も同じ回転（CSS の rotate）');
});
