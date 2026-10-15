// 2026-10-15 次回便（12項目）の N01〜N03・N05〜N10（N04＝voice-stop-1015・N11／N12＝flurene-1015）
//  NX-01 N01 技の一覧＝1技1行（.dskg.n01）・技名が先・右に分類と威力／命中／クリ（威力の無い補助技は「—」）・未習得はロック
//  NX-02 N02 決着の煙・光の層（fx.js の showEnd）を呼ばない・負けた側＝正式 2.5D の「しょんぼり」（先読み）・敗北の専用の絵の受け皿 DEFEAT_ART
//  NX-03 N03 選択肢＝紺の楕円＋金枠・イベント名＝名札（name_label_blank）・START などのボタンは対象外
//  NX-04 N05 HUD＝横1列・左右いっぱい・Turn の数字はオレンジ・等幅の数字
//  NX-05 N06 宝箱のカットインにフィナと「見て見て！」なし・中央
//  NX-06 N07 運命の分かれ道（改名）・左右の矢印・帯の CSS は #wbw の中（旧 .wbv の中の指定＝見えていなかった）・出目と進む側
//  NX-07 N08 ライバルのマス 1.25 倍・影は正式の輪郭だけから作った派生（README）・会ったあとは外す
//  NX-08 N09 ルーレットの技カードは class mvc（旧 card＝汎用 .card と衝突）・contain・MISS の板は変えない
//  NX-09 N10 会場へ続く道のマスは会場の絵より手前（apprIds・propZ）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (f) => readFileSync(path.join(ROOT, f), 'utf8');
const HTML = rd('index.html'), WB = rd('js/chapter/world-board.js'), AR = rd('js/battle/arena.js'), RW = rd('js/proto/roadfirst-world.js');

test('NX-01：N01 技の一覧＝1技1行・技名が先・右に分類と数値（補助は「—」）・未習得はロック', () => {
  assert.match(HTML, /<div class="dskg n01">\$\{cards\}<\/div>/);
  assert.match(HTML, /\.dskg\.n01\{grid-template-columns:1fr;gap:9px\}/);
  assert.match(HTML, /grid-template-areas:"nm nm" "img st"/);
  assert.match(HTML, /<b>\$\{x\[0\]\}<\/b><div class="dska\$\{mvNew\(k\)\?" mvc":""\}">/, '技名を先（上）に');
  assert.match(HTML, /<span class="dsc">\$\{x\[1\]\?\(x\[7\]=="p"\?"✊ ちから":"📖 かしこさ"\):"✨ 補助"\}<\/span>/);
  assert.match(HTML, /<small>威力<\/small><em>\$\{x\[1\]\?Math\.round\(x\[1\]\*100\):"—"\}<\/em>/);
  assert.match(HTML, /<small>クリ<\/small><em>\$\{x\[1\]\?Math\.round\(x\[9\]\*100\)\+"%":"—"\}<\/em>/);
  assert.match(HTML, /<div class="dsk dsq \$\{x\[7\]=="p"\?"kp":"ki"\}" aria-label="まだ覚えていない技"><b>？？？<\/b><div class="dska dslock">/);
  assert.match(HTML, /onclick="\$\{ok\?`skd\(\$\{k\}\)`:`skd\(\$\{k\}\)`\}"/, 'タップで詳細（従来どおり）');
});

test('NX-02：N02 決着の煙・光の層を出さない・負けた側＝「しょんぼり」・専用の絵の受け皿', () => {
  const FX = rd('js/battle/fx.js');
  assert.match(FX, /if \(n\.id === 'ban'\) return;/); assert.doesNotMatch(FX, /showEnd\('victory'\)|showEnd\('defeat'\)/);
  assert.match(AR, /const DEFEAT_ART = Object\.freeze\(\{\}\);/);
  assert.match(AR, /X\.info\(sp, 'sad'\)/); assert.match(AR, /\['hit', 'dodge', 'sad'\]\.forEach/, '開始時に先読み');
  assert.match(AR, /const loser = win \? 1 : 0;/);
  assert.match(AR, /height:calc\(118% \* var\(--mma-k,1\) \* var\(--rh,1\)\)/, '負けた姿は正式の比率（hRel）');
  for (const k of ['soramo', 'gauru', 'nobiton', 'jiol', 'regnas']) assert.ok(existsSync(path.join(ROOT, `assets/monsters/reactions_1012/${k}/03_sad.webp`)), k);
});

test('NX-03：N03 選択肢＝紺の楕円＋金枠（44px 以上）・イベント名＝名札・ほかのボタンは対象外', () => {
  assert.match(HTML, /\.mmtalk \.mmtalk-choice,\.mmtalk\.mmtalk-big \.mmtalk-choice\{box-sizing:border-box;height:auto;min-height:46px;[^}]*border:1\.5px solid #e0b861;border-image:none;border-radius:999px;background:linear-gradient\(#1c3373,#0d1a45\)/);
  assert.match(WB, /\.wbw \.wbcard \.cap\{[^}]*background:url\(\.\/assets\/ui\/recovery_1006\/talk\/name_label_blank\.png\) center\/100% 100% no-repeat;color:#1d2442/);
  const i = HTML.indexOf('N03：会話・出来事の選択肢'), blk = HTML.slice(i, HTML.indexOf('</style>', i));
  assert.doesNotMatch(blk, /#brollbtn|\.wbdgo|\.chwing|\.p9btn/, 'START・サイコロ・コマンドは変えない');
});

test('NX-04：N05 HUD＝横1列・左右いっぱい・今の Turn はオレンジ・等幅の数字', () => {
  assert.match(WB, /\.wbw \.wbh \.chh-chips\{display:grid;grid-template-columns:minmax\(0,1\.06fr\) minmax\(0,\.92fr\) minmax\(0,1\.04fr\) minmax\(0,1\.1fr\);gap:5px;margin-right:-46px;/);
  assert.match(WB, /\.wbw \.wbh \.chh-turn b\{color:#ff9d2e;/);
  assert.match(WB, /\.wbw \.wbh \.chh-chips \.chip b\{font-variant-numeric:tabular-nums\}/);
  assert.match(WB, /<div class="chh-turn chip">Turn <b id="chturn">/, '4項目の順・数値の処理は従来どおり');
});

test('NX-05：N06 宝箱のカットイン＝フィナと「見て見て！」なし・宝箱と中身は中央', () => {
  assert.doesNotMatch(WB, /wbtr-fina|wbtr-say/); assert.doesNotMatch(WB.replace(/\/\/.*$/gm, ''), /見て見て/);
  assert.match(WB, /\.wbw \.wbtr-chest\{position:absolute;left:50%;top:36%;/);
  assert.match(WB, /\.wbw \.wbtr-card\{position:absolute;left:50%;right:auto;width:min\(86%,340px\);margin-left:calc\(min\(86%,340px\) \/ -2\);/);
  assert.match(WB, /const CHEST = Object\.freeze\(\{ normal: 'chest_01', special: 'chest_04' \}\);/, '宝箱の絵は従来どおり');
});

test('NX-06：N07 運命の分かれ道（改名）・左右の矢印・帯は #wbw の中・出目と進む側', () => {
  assert.match(WB, /Q: \{ h: '運命の分かれ道', p: 'サイコロの出目で進む道が決まる。', lr: true \}/);
  assert.match(WB, /<span class="l"><b>← 左の道<\/b><small>奇数（1・3・5）<\/small><\/span><span class="r"><b>右の道 →<\/b><small>偶数（2・4・6）<\/small><\/span>/);
  assert.doesNotMatch(WB.replace(/\/\/.*$/gm, ''), /運命のサイコロ/);
  assert.match(WB, /\n\.wbw \.wbdband\{position:absolute;left:0;right:0;z-index:29;/); assert.doesNotMatch(WB, /\.wbv \.wbdband/);
  assert.match(WB, /el\.classList\.add\('done', e\.kind === 'Q' \? \(e\.die % 2 \? 'go-l' : 'go-r'\) : e\.kind === 'CHALLENGE' \? \(e\.die >= 5 \? 'ok' : 'ng'\) : 'x'\);/);
  assert.match(WB, /<button type="button" class="p9btn wbdgo">サイコロを振る<\/button>/, '強制の「振る」は従来どおり（左右は選べない）');
});

test('NX-07：N08 ライバルのマス 1.25 倍・影は正式の輪郭から作った派生・会ったあとは外す', () => {
  assert.match(WB, /const RIVAL_TILE_K = 1\.25, RIVAL_MARK = '\.\/assets\/chapter\/rival_mark_1015\/rival_silhouette\.webp';/);
  assert.match(WB, /else if \(role === 'mandatory_rival'\) \{ out\.src = TOP \+ 'tile_rival\.webp'; out\.k = RIVAL_TILE_K; \}/);
  assert.match(WB, /if \(f\.rivalMet\) \{ if \(V\.world\.markerOff\) V\.world\.markerOff\('RIVAL'\); return; \}/);
  assert.match(WB, /rareMark\(m\); rivalMark\(m\); fxPreload\(\);/);
  assert.match(RW, /const k = L\.k \|\| 1; if \(k !== \(t\.k \|\| 1\)\) \{ t\.k = k;/);
  assert.match(RW, /Math\.min\(o\.tilePx\[1\], o\.tileW \* c\.s \* q\.k\)\) \* \(t\.k \|\| 1\);/);
  assert.ok(existsSync(path.join(ROOT, 'assets/chapter/rival_mark_1015/rival_silhouette.webp')));
  const R = rd('assets/chapter/rival_mark_1015/README.md'); assert.match(R, /輪郭（アルファ）だけ/); assert.match(R, /rival_mark\.py/);
});

test('NX-08：N09 ルーレットの技カード＝class mvc（旧 card は汎用 .card と衝突）・contain・MISS の板は変えない', () => {
  assert.match(AR, /<div class="ic\$\{d\.card \? ' mvc' : ''\}">/); assert.doesNotMatch(AR, /' card' : ''/);
  assert.match(AR, /'#bt \.mmr \.pl \.ic\.mvc\{padding:0;border:0;border-radius:6%;box-shadow:none;background:#0b1430\}'/);
  assert.match(AR, /'#bt \.mmr \.pl \.ic\.mvc img\{object-fit:contain;object-position:50% 50%\}'/);
  assert.match(AR, /'#bt \.mmr \.pl\.ms \.ic,#bt \.mmr \.pl\.ms \.nm\{display:none\}'/, 'MISS の板は従来どおり（No.26）');
  assert.match(HTML, /\n\.card\{background:var\(--card\);border:2px solid var\(--line\);border-radius:18px;padding:12px\}/, '汎用の .card はそのまま（衝突は arena 側の名前で避ける）');
});

test('NX-09：N10 会場へ続く道のマスは会場の絵より手前（GOAL・道・判定は不変）', () => {
  assert.match(RW, /const apprIds = \(\(\) => \{ const gn = D\.nodes\.GOAL; if \(!gn \|\| !ART\.goal\) return \[\]; const R = ART\.goal\.w \* 0\.95/);
  assert.match(RW, /const propZ = \(p\) => \(p\.solid && S\.goalZ != null \? Math\.min\(zOf\(p\.y, p\.z, p\.x\), S\.goalZ - 1, S\.apprZ - 1\) : zOf\(p\.y, p\.z, p\.x\)\);/);
  assert.equal((RW.match(/S\.apprZ = apprZ\(\);/g) || []).length, 2, '作るときと向きが変わったとき');
  assert.match(RW, /goal: \{ file: 'goal_arena\.webp', w: 150, dy: 14, back: 4 \}/, '会場の大きさ・位置は従来どおり');
});
