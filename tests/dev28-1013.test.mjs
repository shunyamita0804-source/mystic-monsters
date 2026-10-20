// =========================================================
// 2026-10-13 開発28（PHASE A）：開始画面の BGM・決着の曲（WIN 4秒／LOSE 5秒）・観客の声の既定・全景 → 盤のズームの滑らかさ・立体サイコロの面取り・固有スキルのシネマティックカメラ（Node で動かす部分）
//  D28-01 決着の曲＝registry の BATTLE_WIN／BATTLE_LOSE（OGG／M4A の対・gain）・ファイルの長さ（OGG のページと M4A の mvhd から 4.00秒／5.00秒）・sha256 は README のとおり・原本（フル尺・MP3）は置かない
//  D28-02 鳴らし方＝fight() の勝利の sfx(3) → BATTLE_WIN（旧 VICTORY は鳴らさない）・WIN!／LOSE の帯で resultJingle（戦闘の BGM を止める・LOSE は BATTLE_LOSE・1回だけ）・決着の曲は実戦の前に先読み・SE の名前の一覧
//  D28-03 クレジット＝ポケットサウンドの表記（必須）・red bears の規約・AUDIO_CREDITS.md と README
//  D28-04 開始画面の BGM＝TITLE は正式「Top画面BGM」の 7秒カット版（title_1013・OGG／M4A の対・長さ＝全尺の候補 −7.000秒・sha256・gain・ループ区間）・暫定の Hopeful は外した・全尺の候補は場面に使わない・開始ボタンでは鳴らさない（titlePress）・startGame で止める・「♪ タップで音楽」の印は title() の画面の作りを変えない
//  D28-05 観客の声の既定＝通常（1.0秒）。短い（0.7秒）は選べる
//  D28-06 立体サイコロ＝12本の辺の面取り・8つの角の飾り（8つの八分儀に1つずつ）・正式の面だけ（旧の無地には付けない）・止まったあと少し斜め・出目の向き（BASE）と乱数は変えない
//  D28-07 全景 → 盤＝Web Animations（合成スレッド）で動かす・毎フレームの幅／zIndex の書き換えなし・transform-origin 0 0
//  D28-08 固有スキルのカメラ＝cutCamera（全身が切れない倍率・中央へ・安全域）・全体 1.5〜2.1秒・足元の正式エフェクトは未納（null＝仮の輪）・発動の条件（ガウル＝ゴング／ソラモ＝20%以下の成立／ノビトン＝実際に効いたとき／ジオル＝耐えたときだけ／レグナス＝構えの成立）
//  D28-09 MM_BUILD と version.json＝2026-10-13-dev28
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const HTML = rd('index.html');
const sha = (p) => crypto.createHash('sha256').update(readFileSync(path.join(ROOT, p))).digest('hex');
const lineOf = (re) => HTML.split('\n').find((l) => re.test(l)) || '';
const J = (x) => JSON.parse(JSON.stringify(x));   // vm の別の realm の配列・オブジェクトを deepEqual で比べるため

function loadRegistry() {
  const got = { bgm: {}, se: {}, voice: {} }, w = { MMAUDIO: { registerAll: (r) => { Object.assign(got.bgm, r.bgm); Object.assign(got.se, r.se); Object.assign(got.voice, r.voice || {}); } } };
  new Function('window', rd('js/audio/audio-registry.js'))(w);
  return { ...got, raw: w };
}
/** OGG（Vorbis）の長さ＝最後のページの granule position ÷ サンプリング周波数（ページを頭から順にたどる） */
function oggSeconds(buf) {
  const id = buf.indexOf(Buffer.from('\x01vorbis', 'latin1')); assert.ok(id > 0, 'Vorbis の識別ヘッダ');
  const rate = buf.readUInt32LE(id + 12);
  let p = 0, last = 0n, pages = 0;
  while (p + 27 <= buf.length) {
    assert.equal(buf.toString('latin1', p, p + 4), 'OggS', `ページの境界 ${p}`);
    const g = buf.readBigUInt64LE(p + 6), nseg = buf[p + 26]; let body = 0;
    for (let i = 0; i < nseg; i++) body += buf[p + 27 + i];
    if (g !== 0xffffffffffffffffn) last = g;
    p += 27 + nseg + body; pages++;
  }
  assert.equal(p, buf.length, 'ページが最後まで読める'); assert.ok(pages > 2);
  return Number(last) / rate;
}
/** M4A（MP4）の長さ＝mvhd の duration ÷ timescale */
function m4aSeconds(buf) {
  assert.match(buf.subarray(4, 8).toString('latin1'), /ftyp/);
  const i = buf.indexOf(Buffer.from('mvhd', 'latin1')); assert.ok(i > 0, 'mvhd');
  const ver = buf[i + 4];
  if (ver === 0) return buf.readUInt32BE(i + 20) / buf.readUInt32BE(i + 16);
  return Number(buf.readBigUInt64BE(i + 28)) / buf.readUInt32BE(i + 24);
}

test('D28-01：決着の曲＝BATTLE_WIN（red bears「ファンファーレ12」先頭 4.00秒）・BATTLE_LOSE（ポケットサウンド「ゲームオーバー＃2」先頭 5.00秒）。OGG／M4A の対・長さ・sha256・原本は置かない', () => {
  const { se } = loadRegistry();
  const W = se.BATTLE_WIN, Ls = se.BATTLE_LOSE;
  assert.deepEqual(W.src, ['./assets/audio/se/result_1013/win_fanfare12_4s.ogg', './assets/audio/se/result_1013/win_fanfare12_4s.m4a']);
  assert.deepEqual(Ls.src, ['./assets/audio/se/result_1013/lose_gameover2_5s.ogg', './assets/audio/se/result_1013/lose_gameover2_5s.m4a']);
  assert.deepEqual([W.gain, Ls.gain], [0.5, 0.63]);
  assert.ok(!W.silent && !Ls.silent);
  const dir = 'assets/audio/se/result_1013';
  assert.deepEqual(readdirSync(path.join(ROOT, dir)).sort(), ['README.md', 'lose_gameover2_5s.m4a', 'lose_gameover2_5s.ogg', 'win_fanfare12_4s.m4a', 'win_fanfare12_4s.ogg'], '原本（フル尺）・MP3 は置かない');
  const sec = {
    'win_fanfare12_4s.ogg': oggSeconds(readFileSync(path.join(ROOT, dir, 'win_fanfare12_4s.ogg'))), 'win_fanfare12_4s.m4a': m4aSeconds(readFileSync(path.join(ROOT, dir, 'win_fanfare12_4s.m4a'))),
    'lose_gameover2_5s.ogg': oggSeconds(readFileSync(path.join(ROOT, dir, 'lose_gameover2_5s.ogg'))), 'lose_gameover2_5s.m4a': m4aSeconds(readFileSync(path.join(ROOT, dir, 'lose_gameover2_5s.m4a'))) };
  assert.ok(Math.abs(sec['win_fanfare12_4s.ogg'] - 4) <= 0.02, `WIN の OGG は 4.00秒（${sec['win_fanfare12_4s.ogg']}）`);
  assert.ok(Math.abs(sec['lose_gameover2_5s.ogg'] - 5) <= 0.02, `LOSE の OGG は 5.00秒（${sec['lose_gameover2_5s.ogg']}）`);
  assert.ok(Math.abs(sec['win_fanfare12_4s.m4a'] - 4) <= 0.1 && Math.abs(sec['lose_gameover2_5s.m4a'] - 5) <= 0.1, `M4A も同じ長さ ${JSON.stringify(sec)}`);
  // README の sha256 のとおり（WIN はユーザー提供の完成ファイルをそのまま＝ZIP の sha256 と同じ）
  const readme = rd(dir + '/README.md');
  for (const f of ['win_fanfare12_4s.ogg', 'win_fanfare12_4s.m4a', 'lose_gameover2_5s.ogg', 'lose_gameover2_5s.m4a']) assert.ok(readme.includes(sha(`${dir}/${f}`)), `${f} の sha256 が README にある`);
  assert.equal(sha(`${dir}/win_fanfare12_4s.ogg`), '64ca7502674a4d97247b3a5edeac20654e6725e2daf8ae646245931311035cb9');
  assert.equal(sha(`${dir}/win_fanfare12_4s.m4a`), 'f9b9de572eb5c9909b7c1b194f9ae5f09965c4284ba1c2d328c1260c792271f0');
  assert.equal(readFileSync(path.join(ROOT, dir, 'win_fanfare12_4s.ogg')).subarray(0, 4).toString(), 'OggS');
  assert.ok(se.VICTORY && !se.VICTORY.silent, '旧 VICTORY は登録だけ残す（ほかの場面は従来どおり）');
  // 2026-10-14 ユーザー正式決定（実機試遊⑫）：固有スキルの発動の音＝Mixkit「Shot light energy flowing」（ID 2589）の先頭 3.500秒（OGG／M4A の対）。旧の暫定（宝箱の第4段階）はこの場面だけ置き換えた＝宝箱の第4段階の登録はそのまま
  assert.deepEqual(se.SKILL_ACTIVATE.src, ['./assets/audio/se/skill_1014/skill_activate_shot_light_energy_3p5s.ogg', './assets/audio/se/skill_1014/skill_activate_shot_light_energy_3p5s.m4a']);
  assert.ok(/12_treasure_open_tier4\.ogg$/.test(se.TREASURE_TIER_4.src), '宝箱の第4段階の音は変えていない');
  { const d = 'assets/audio/se/skill_1014/', so = oggSeconds(readFileSync(path.join(ROOT, d + 'skill_activate_shot_light_energy_3p5s.ogg'))), sm = m4aSeconds(readFileSync(path.join(ROOT, d + 'skill_activate_shot_light_energy_3p5s.m4a')));
    assert.ok(Math.abs(so - 3.5) <= 0.02 && Math.abs(sm - 3.5) <= 0.06, `3.500秒（OGG ${so}・M4A ${sm}）`); }
});

test('D28-02：鳴らし方＝勝利の sfx(3) は BATTLE_WIN（旧 VICTORY は鳴らさない）・WIN!／LOSE の帯で resultJingle（戦闘の BGM を止める・LOSE は BATTLE_LOSE・帯の再描画でも1回）・実戦の前に先読み・SE の名前の一覧', () => {
  const sfx = lineOf(/^function sfxEventOf\(/);
  assert.match(sfx, /if\(AU\.fight3==1\)\{setTimeout\(battleBgmGo,450\);return "BATTLE_START"\}return "BATTLE_WIN"\}/, 'バトル中の2回目の sfx(3)＝勝利＝BATTLE_WIN');
  assert.doesNotMatch(sfx.split('//')[0], /VICTORY/, 'コードの中では旧 VICTORY を返さない');
  const rj = lineOf(/^function resultJingle\(/);
  assert.match(rj, /^function resultJingle\(win,b\)\{if\(!b\|\|b\.dataset\.rj\)return;b\.dataset\.rj=win\?"win":"lose";(?:try\{rjLock\(win,b\)\}catch\(e\)\{\})?try\{MMAUDIO\.stopBgm\(\{fade:"quick"\}\)\}catch\(e\)\{\}clearTimeout\(AU\.btT\);AU\.btT=null;AU\.btScene=null;if\(!win\)try\{MMAUDIO\.se\("BATTLE_LOSE"\)\}catch\(e\)\{\}[\s\S]*monCry\(sp,"sad",5000,here,\{gapMs:0,when:here\}\)[\s\S]*rjNextScene\(\)[\s\S]*\}/, '1回だけ（data-rj）・戦闘の BGM を短く止める・保留中の戦闘曲（battleBgmGo の予約）も取り消す・LOSE の曲');
  const ban = lineOf(/^function ban\(/);
  assert.match(ban, /resultJingle\(/, 'fight() の決着の帯（ban＝Phase 6 の外の関数）から呼ぶ');
  assert.match(ban, /"WIN!"/); assert.match(ban, /"LOSE"/);
  assert.match(HTML.match(/if\(k=="battle"\)\{battleBgmArm[^\n]*/)[0], /MMAUDIO\.prefetchSe\("BATTLE_WIN"\);MMAUDIO\.prefetchSe\("BATTLE_LOSE"\)/, '実戦の曲を構えるときに決着の曲を先に読む');
  assert.match(rd('js/audio/audio-manager.js'), /'BATTLE_WIN', 'BATTLE_LOSE', 'SKILL_ACTIVATE',/, 'SE の名前の一覧（ホワイトリスト）');
  // fight()（Phase 6）そのものは変えない＝tests/phase7.test.mjs のハッシュ。ここでは fight() の中に新しい呼び出しが無いことだけ
  assert.match(HTML, /\nconst P8_FIGHT=fight;/);
  assert.deepEqual(HTML.split('\n').filter((l) => /resultJingle\(/.test(l)).map((l) => l.replace(/\(.*$/, '(')), ['function resultJingle(', 'function ban('], '呼ぶのは ban() だけ（fight() の中には入れない）');
});

test('D28-03：クレジット＝ポケットサウンドの表記（無料利用の条件・必須）・red bears の規約・AUDIO_CREDITS.md と README の両方', () => {
  const credits = rd('AUDIO_CREDITS.md'), readme = rd('assets/audio/se/result_1013/README.md');
  for (const t of [credits, readme]) {
    assert.ok(t.includes('効果音：ポケットサウンド — https://pocket-se.info/'), 'ポケットサウンドのクレジット表記');
    assert.ok(t.includes('https://pocket-se.info/archives/754/'), '取得元のページ');
    assert.ok(t.includes('red bears') && t.includes('https://www.nakano-sound.com/free/kiyaku.html'), 'red bears の規約');
    assert.ok(t.includes('7028d3577d00d4e429e22e99a5a8e6504887d12895a054582d8c769271f9d761'), '元の gameover2.mp3 の sha256（原本は置かない）');
  }
  assert.ok(credits.includes('## 2026-10-13 開発28'));
  assert.doesNotMatch(readme, /\.mp3\)/);
});

test('D28-04：開始画面の BGM＝TITLE は正式「Top画面BGM」の 7秒カット版（2026-10-13 追記）＝OGG／M4A の対・長さは全尺の候補 −7.000秒・sha256 は README のとおり・gain 0.29・末尾の無音の手前でループ・暫定の Hopeful は外した・全尺の候補は場面に使わない・開始ボタンでは鳴らさない・startGame で止める・「♪ タップで音楽」', () => {
  const { bgm, raw } = loadRegistry();
  const T = bgm.TITLE, dir = 'assets/audio/bgm/title_1013';
  assert.ok(T && !T.silent, `TITLE は無音ではない（${JSON.stringify(T)}）`);
  assert.deepEqual(J(T.src), [`./${dir}/title_official_from7s.ogg`, `./${dir}/title_official_from7s.m4a`], 'OGG と iPhone 用 M4A の対（再生できる1つだけ）');
  assert.equal(T.gain, 0.29, '-7.0 LUFS → 約 -17.8');
  assert.deepEqual([T.loopStart, T.loopEnd, T.loopXfade], [0, 220.8, 1.2], 'ループ＝頭（原曲 7.000秒）から 220.8秒（221.8秒からの無音の手前）へ');
  const ogg = readFileSync(path.join(ROOT, dir, 'title_official_from7s.ogg')), m4a = readFileSync(path.join(ROOT, dir, 'title_official_from7s.m4a'));
  assert.equal(ogg.subarray(0, 4).toString(), 'OggS'); assert.match(m4a.subarray(4, 8).toString('latin1'), /ftyp/);
  const dOgg = oggSeconds(ogg), dM4a = m4aSeconds(m4a), dFull = oggSeconds(readFileSync(path.join(ROOT, 'assets/audio/bgm/candidates_1013/title_candidate.ogg')));
  assert.ok(Math.abs(dOgg - 223.95) < 0.06 && Math.abs(dM4a - 223.95) < 0.06, `長さ 223.95秒（OGG ${dOgg.toFixed(3)}・M4A ${dM4a.toFixed(3)}）`);
  assert.ok(Math.abs(dFull - dOgg - 7.0) < 0.06, `全尺の候補（${dFull.toFixed(3)}秒）の 7.000秒地点から＝冒頭 7秒は流さない`);
  assert.ok(T.loopEnd < dOgg - 2 && T.loopEnd > dOgg - 4, 'loopEnd は末尾の無音（約2.1秒）の手前');
  const readme = rd(`${dir}/README.md`);
  assert.equal(sha(`${dir}/title_official_from7s.ogg`), '4c2f24c5909da09ea55e9647a0606f2ab094ed8313ddedd87aaf262699e24be4', 'ZIP の OGG をそのまま');
  assert.equal(sha(`${dir}/title_official_from7s.m4a`), '3d8e5dd52cba278a9a189e66522b1b38c672014dbc1cd78a9ba68a4c55d81a53', 'ZIP の M4A をそのまま');
  for (const f of ['title_official_from7s.ogg', 'title_official_from7s.m4a']) assert.ok(readme.includes(sha(`${dir}/${f}`)), `${f} の sha256 が README に`);
  assert.ok(readme.includes('7.000秒') && readme.includes('Top画面BGM(1).mp3'), 'README＝原曲の 7.000秒地点から');
  assert.ok(!readdirSync(path.join(ROOT, dir)).some((f) => /\.mp3$/i.test(f)), '原本の MP3 は置かない');
  assert.ok(!/hopeful/.test(String(T.src)) && /03_prologue_hopeful\.ogg$/.test(String(bgm.PROLOGUE_3.src)), '暫定の Hopeful は TITLE から外し、PROLOGUE_3 はそのまま');
  assert.ok(!Object.values(bgm).some((e) => e && /candidates_1013/.test(String(e.src))), '全尺の候補はどの場面にも登録しない（試聴ページ用に残すだけ）');
  const reg = rd('js/audio/audio-registry.js');
  assert.match(reg, /BGM_CANDIDATES/, '候補は試聴用の表（BGM_CANDIDATES）に残す');
  assert.ok(existsSync(path.join(ROOT, 'assets/audio/bgm/candidates_1013/title_candidate.ogg')));
  const credits = rd('AUDIO_CREDITS.md');
  assert.ok(credits.includes('開発28 追記：開始画面の BGM') && credits.includes('7.000秒') && credits.includes('title_official_from7s'), 'AUDIO_CREDITS.md に記録');
  assert.ok(!/title_1013[^\n]*(CC0|CC BY|DOVA|作者：[^未])/.test(credits), '作者・ライセンス文を作らない（納品物に無い）');
  // 開始ボタン（pointerdown）＝保留中の TITLE を始めない。startGame＝BGM を止める（開始の音 TITLE_START と重ねない）
  assert.match(lineOf(/^function titlePress\(/), /if\(on\)try\{const A=window\.MMAUDIO,st=A\.status\(\);if\(st\.pendingScene==="TITLE"\)A\.stopBgm\(\{fade:"none"\}\)\}catch\(x\)\{\}/);
  assert.match(lineOf(/^function startGame\(/), /unlock\(\);try\{MMAUDIO\.stopBgm\(\{fade:"quick"\}\)\}catch\(e\)\{\}/);
  // 「♪ タップで音楽」の印＝title() のあとに足す（title() の中身・画面の作りは従来のまま。TD-2）
  const th = HTML.slice(HTML.indexOf('function titleHint('), HTML.indexOf('function titleSound('));
  assert.match(th, /st\.pendingScene==="TITLE"&&!st\.muted/, 'まだ鳴らせていない間だけ・ミュート中は出さない');
  assert.match(th, /b\.dataset\.nsfx="1"/, '印のタップで決定音を鳴らさない');
  assert.match(lineOf(/^title=\(function\(f\)/), /titleHint\(\)/);
  assert.ok(HTML.indexOf('function title(){') < HTML.indexOf('\nfunction togh(') && HTML.indexOf('\nfunction togh(') < HTML.indexOf('function titleHint('), 'title() → togh() → titleHint の順（title() の領域に足さない）');
  assert.doesNotMatch(lineOf(/^function title\(\)/), /tsndhint/);
  assert.match(HTML, /\.mmtscr \.tsndhint\{position:fixed;/);
});

test('D28-05：観客の声の既定＝通常（1.0秒の CROWD_*_LONG）。短い（0.7秒）・なしは選べる・設定の鍵（mmcrowd）は従来のまま', () => {
  const src = rd('js/battle/crowd.js');
  assert.match(src, /const DEF = Object\.freeze\(\{ mode: 'long', level: 'std' \}\);/);
  assert.match(src, /KEY = 'mmcrowd'/);
  assert.match(HTML, /\{mode:"long",level:"std"\}/, '設定の画面の既定も同じ');
  const { se } = loadRegistry();
  for (const k of ['HIT', 'MISS', 'EVADE']) { assert.ok(se['CROWD_' + k] && se['CROWD_' + k + '_LONG'], k); }
});

test('D28-06：立体サイコロ＝12本の辺の面取り・8つの角の飾り（部品の定義。2026-10-14 開発29 から正式の面＝A の絵では出さない）・止まったあと少し斜め（前 11°・横 9°）・出目の向き（BASE）と乱数は変えない', () => {
  const ctx = { performance: { now: () => 0 } }; ctx.globalThis = ctx; vm.runInNewContext(rd('js/chapter/dice-cube.js'), ctx);
  const D = ctx.MMDICE3D;
  assert.equal(D.EDGES.length, 12); assert.equal(D.CORNERS.length, 8);
  assert.equal(D.EDGES.filter((e) => e[0]).length, 8, '縦の4本と z に平行な4本は立てる');
  const oct = new Set();
  for (const tf of D.CORNERS) {
    const m = /^rotateY\((-?[\d.]+)deg\) rotateX\((-?[\d.]+)deg\) translateZ\(calc\(var\(--s\)\*\.7506\)\) rotateZ\((-?[\d.]+)deg\)$/.exec(tf); assert.ok(m, tf);
    const b = +m[1] * Math.PI / 180, a = +m[2] * Math.PI / 180;
    const x = Math.cos(a) * Math.sin(b), y = -Math.sin(a), z = Math.cos(a) * Math.cos(b);   // rotateY(β)・rotateX(α) で +Z を回した向き＝角の中心
    for (const v of [x, y, z]) assert.ok(Math.abs(Math.abs(v) - 1 / Math.sqrt(3)) < 0.002, `角の中心の向き (${x.toFixed(3)}, ${y.toFixed(3)}, ${z.toFixed(3)})`);
    oct.add(`${x > 0 ? '+' : '-'}${y > 0 ? '+' : '-'}${z > 0 ? '+' : '-'}`);
  }
  assert.equal(oct.size, 8, '8つの角にひとつずつ');
  const off = D.cubeHtml('official'), plain = D.cubeHtml();
  // 2026-10-14 開発29（2）：正式の面は正式デザイン A の絵（面取り・角の飾りは絵の中）＝面取りの帯・角の丸い飾りは出さず、中の金の芯（.d3-k）6枚だけ。EDGES・CORNERS の形（部品の定義）は残す
  assert.equal((off.match(/class="d3-e/g) || []).length, 0); assert.equal((off.match(/class="d3-c"/g) || []).length, 0); assert.equal((off.match(/class="d3-k"/g) || []).length, 6);
  assert.equal((off.match(/class="d3-f"/g) || []).length, 6);
  assert.equal((plain.match(/class="d3-e|class="d3-c"/g) || []).length, 0, '旧の無地の面には付けない');
  const src = rd('js/chapter/dice-cube.js');
  assert.match(src, /FRONT = o\.skin \? 'rotateX\(-11deg\) rotateY\(-9deg\)' : 'rotateX\(-6deg\) rotateY\(0deg\)'/);
  assert.match(src, /\.d3z\[data-skin="official"\] \.d3-f\{inset:0;border-radius:7%/, '正式の面（A）＝面はいっぱい・角は小さく丸く');
  assert.match(src, /\.d3-c\{/); assert.match(src, /\.d3-e\{/);
  // 出目の向きと乱数（DC-01・DC-02 と同じ条件）
  assert.deepEqual(Object.keys(D.BASE).map(Number).sort(), [1, 2, 3, 4, 5, 6]);
  const lines = src.split('\n').filter((l) => /Math\.random/.test(l));
  assert.ok(lines.length >= 1 && lines.every((l) => /k: i \+ Math\.floor\(Math\.random\(\) \* 4\), dir:/.test(l)), '乱数は回り方の見た目だけ');
});

test('D28-07：全景 → 盤のズーム＝Web Animations（linear・刻みに緩急）で動かす・終わったら最終の姿を入れて消す・毎フレームの幅と zIndex の書き換えなし（transform だけ）・transform-origin 0 0', () => {
  const src = rd('js/proto/roadfirst-world.js');
  assert.match(src, /const INTRO_SAMPLES = 24;/);
  assert.match(src, /anims\.push\(el\.animate\(kf, \{ duration: dur, easing: 'linear', fill: 'forwards' \}\)\)/);
  assert.match(src, /function startIntroAnims\(it, now\)/); assert.match(src, /function finishIntro\(it\)/);
  assert.match(src, /S\.introAnims = anims\.length;/);
  // マス・景物・モンスター：幅は作るときに1回（scale で大きさ）・前後の順は世界の y から1回（zOf）
  assert.match(src, /d\.style\.width = TB \+ 'px'; d\.style\.zIndex = String\(zOf\(D\.nodes\[id\]\[1\], 0, D\.nodes\[id\]\[0\]\)\);/);   // 2026-10-14 実機試遊①：前後の順は回したあとの奥行き（x・y）から
  assert.match(src, /const MB = Math\.round\(TB \* Math\.max\(1, o\.monRatio \|\| 1\)\); mon\.style\.width = MB \+ 'px';/);
  assert.match(src, /scale\(\$\{\(w \/ TB\)\.toFixed\(4\)\}\)/); assert.match(src, /scale\(\$\{\(w \/ MB\)\.toFixed\(4\)\}\)/);
  for (const c of ['.rfw-plane', '.rfw-tile', '.rfw-prop', '.rfw-mon']) assert.match(src, new RegExp(`:is\\(#rfp,\\.wbv\\) ${c.replace('.', '\\.')}\\{[^}]*transform-origin:0 0`), c);
  const apply = src.slice(src.indexOf('function apply('), src.indexOf('function apply(') + 6000);
  assert.doesNotMatch(apply, /style\.width\s*=/, 'apply（毎フレーム）では幅を書かない');
  assert.doesNotMatch(apply, /\.style\.fontSize/, '');
});

test('D28-08：固有スキルのカメラ＝cutCamera（全身が切れない倍率・入らなければ寄らない・横は中央・縦は安全域）・全体 1.5〜2.1秒・足元の正式エフェクト（2026-10-14 開発29）・発動の条件（ガウル／ソラモ／ノビトン／ジオル／レグナス）', () => {
  const E = loadRules();
  const R = E.R, CUT = R.CUT;
  const total = CUT.in + CUT.hold + CUT.out;
  assert.ok(total >= 2100 && total <= 2600, `全体 ${total}ms（2026-10-14 実機試遊⑪：寄り終わってから約0.7秒長く見せる＝hold 1040 → 1740）`); assert.equal(CUT.hold, 1740); assert.ok(CUT.calm >= 900 && CUT.calm <= 1500, '視差を減らす設定＝短く');
  assert.equal(CUT.zMax, 1.45); assert.equal(CUT.se, 'SKILL_ACTIVATE');   // 2026-10-14 開発29（3）：1.3 → 1.45・寄りは 0.27秒
  assert.ok(CUT.in >= 200 && CUT.in <= 350, `寄り ${CUT.in}ms`);
  // 2026-10-14 開発29（4）：足元の正式エフェクト5枚（assets/battle/skill_fx_1014/）が届いた＝仮の輪ではなく専用の絵
  assert.deepEqual(Object.keys(R.SKILL_FX).sort(), ['gauru', 'jiol', 'nobiton', 'regnas', 'solamo']);
  for (const [k, v] of Object.entries(R.SKILL_FX)) { assert.equal(v.src, `./assets/battle/skill_fx_1014/${k}.webp`); assert.ok(v.ax > 0.4 && v.ax < 0.6 && v.ay > 0.6 && v.ay < 0.8 && v.w > 1, k); }
  // (a) 小さな対象＝1.3倍・横は画面の中央・縦は安全域の中央
  let c = R.cutCamera({ left: 20, top: 300, width: 150, height: 180 }, 390, 844, 120, 506, 1.3);
  assert.equal(c.k, 1.3); assert.equal(c.fx, 195); assert.ok(c.fy >= 120 + 180 * 1.3 / 2 && c.fy <= 506 - 180 * 1.3 / 2, `縦 ${c.fy}`);
  assert.equal(Math.round(c.dx), Math.round(195 - 95));
  // (b) 背の高い対象＝全身が安全域に入る倍率まで（切らない）
  c = R.cutCamera({ left: 20, top: 200, width: 150, height: 340 }, 390, 844, 120, 506, 1.3);
  assert.ok(c.k < 1.3 && c.k >= 1 && 340 * c.k <= 506 - 120 - 8 + 1e-9, `k ${c.k}`);
  // (c) 横に広い対象＝画面の幅に入る倍率まで
  c = R.cutCamera({ left: 0, top: 300, width: 360, height: 100 }, 390, 844, 120, 506, 1.3);
  assert.ok(Math.abs(c.k - 370 / 360) < 1e-9);
  // (d) 入らなければ 1（引かない・寄らない）
  c = R.cutCamera({ left: 0, top: 100, width: 380, height: 500 }, 390, 844, 120, 506, 1.3);
  assert.equal(c.k, 1);
  // 発動の条件（判定・計算は変えない＝notes の skill の印だけ）
  // ガウル：最初の行動で倍率が入ったとき（ゴングの演出が先に出ていればそちら＝st.cut）
  let b = battle(E, unit('ガウル', 1, {}), unit('ソラモ', 0, { li: 9999 }));
  let r = b.act('A', 11); assert.deepEqual(J(r.rules.notes.filter((n) => n.skill).map((n) => [n.skill, n.side])), [['gauru', 'A']]);
  r = b.act('A', 11); assert.equal(r.rules.notes.filter((n) => n.skill).length, 0, '各バトルの各側で1回');
  // ソラモ：20% 以下になった行動で成立（1回）。次の攻撃で消費（badge）
  b = battle(E, unit('ソラモ', 0, { li: 100 }), unit('ガウル', 1, { li: 999 }));
  r = b.act('A', 0); assert.equal(r.rules.notes.filter((n) => n.skill === 'solamo').length, 0);
  b.sess.currentLife.A = 21; r = b.act('B', 11);
  assert.deepEqual(J(r.rules.notes.filter((n) => n.skill === 'solamo').map((n) => [n.skill, n.side])), [['solamo', 'A']]); assert.equal(b.st.armed.A, true);   // 相手のガウルの最初の行動（gauru の印）と同じ行動
  r = b.act('A', 0); assert.equal(r.rules.notes.filter((n) => n.skill).length, 0, '消費は演出ではなく札'); assert.ok(r.rules.notes.some((n) => n.badge === '逆境のひと踏ん張り！'));
  b.sess.currentLife.A = 10; r = b.act('B', 11); assert.equal(r.rules.notes.filter((n) => n.skill === 'solamo').length, 0, '1バトル1回');
  // ノビトン：相手が状態異常の間に実際に効いた行動だけ（毎ターンではない）
  b = battle(E, unit('ノビトン', 2, {}), unit('ガウル', 1, { li: 9999 }));
  r = b.act('A', 30); assert.equal(r.rules.notes.filter((n) => n.skill === 'nobiton').length, 0, '相手が状態異常でなければ出ない');
  R.applyAilment(b.st, 'B', 'sleep');
  r = b.act('A', 30); assert.deepEqual(J(r.rules.notes.filter((n) => n.skill).map((n) => n.skill)), ['nobiton']);
  r = b.act('A', 30); assert.equal(r.rules.notes.filter((n) => n.skill).length, 0, '1回だけ');
  // ジオル：耐えたときだけ（倒れたときは出ない）
  b = battle(E, unit('ガウル', 1, { po: 500 }), unit('ジオル', 3, { li: 10 }));
  r = b.act('A', 14, () => 0.05); assert.equal(r.endured, true); assert.deepEqual(J(r.rules.notes.filter((n) => n.skill === 'jiol').map((n) => [n.skill, n.side])), [['jiol', 'B']]);   // 同じ行動に攻める側のガウルの印も付く
  b = battle(E, unit('ガウル', 1, { po: 500 }), unit('ジオル', 3, { li: 10 }));
  r = b.act('A', 14, () => 0.5); assert.equal(r.ko, true); assert.equal(r.rules.notes.filter((n) => n.skill === 'jiol').length, 0, '倒れたら出ない');
  // レグナス：構えの成立（回避）で1回・構え中の再回避では出さない（rival-partner.js）
  const RP = rd('js/battle/rival-partner.js');
  assert.match(RP, /if \(!st\.armed\) \{ st\.armed = true; setTimeout\(\(\) => \{ try \{ window\.MMRULES && MMRULES\.skillCut && MMRULES\.skillCut\(1, 'regnas'\); \} catch \(e\) \{[^}]*\} \}, 720\); \}/);
  // 画面側：ゴング＝fight() の ban('FIGHT!')・決着の帯で片付け・待ち行列
  const src = rd('js/battle/rules.js');
  assert.match(src, /if \(tt === 'FIGHT!'\) \{ try \{ gong\(\); \}/); assert.match(src, /const END_BAN = \/\^\(K\\\.O\\\.!\|TIME UP\|降参\|WIN!\|LOSE\)\$\/;/);
  assert.match(src, /if \(END_BAN\.test\(tt\)\) \{ try \{ clearCuts\(\); \}/);
  assert.match(src, /rules\.notes\.forEach\(\(n\) => \{ if \(n\.skill\) setTimeout\(\(\) => skillCut\(idx\(n\.side\), n\.skill\), 720\);/);
  assert.match(src, /#bt\.mmsk-cut \.bui,#bt\.mmsk-cut #msg,#bt\.mmsk-cut \.gow,#bt\.mmsk-cut>\.ban\.sm\{opacity:0!important;visibility:hidden!important/, 'STOP・コマンド・説明を隠す（display:none は使わない）');
  assert.doesNotMatch(src, /filter: 'drop-shadow|hue-rotate/, '絵の色を変えない');
  assert.deepEqual(J(R.cutQueue()), []); assert.equal(R.cutActive(), false);
});

test('D28-09：MM_BUILD と version.json は同じ値（公開のたびに上げる。2026-10-14 Chapter 1 A／B／C 高品質化＝2026-10-14-ch1hq → 進入時のクラッシュ対策＝2026-10-14-ch1fix → 実機試遊47項目＝2026-10-14-play47 → 研究所の一言の重なり＝2026-10-14-play47b → NPC のボイスの全停止＝2026-10-15-next12 → 比較画面・QA 試遊＝2026-10-15-cmpqa → フルーネの技アニメ・歩行＝2026-10-15-flanim → ジオルの正式10技＝2026-10-15-jiol10 → 作業ブランチの iPhone 6件＝2026-10-16-ip6 → 夜間 QA B＝2026-10-16-qa-b1 → C＝2026-10-16-qa-c1 → A＝2026-10-16-qa-a1）', () => {
  const b = /const MM_BUILD="([^"]+)";/.exec(HTML); assert.ok(b);
  { const v = JSON.parse(rd('version.json')); assert.equal(v.build, b[1]); assert.deepEqual(Object.keys(v).filter((k) => !['build', 'branch', 'base'].includes(k)), []); } assert.equal(b[1], '2026-10-20-full2');   // 2026-10-20 追加指示（広場・門・完走率の定義）・2026-10-20 通し試遊の品質改善（道路・広場・門・成長量）＝full1。2026-10-19 P0：Chapter 2 の盤（遠近・近くの層＝p0b1 → 欄干・影・広場・塔・門＝p0b2 → 正面向きの港の門＝p0b3）   // 被弾・回避の差し替えで横へ跳ねない   // 2026-10-19 追加指令（巨大火山・分岐の見た目）   // 2026-10-19 次便一括（Chapter 4・ミュロル・旧仕様の撤去）   // 2026-10-19 夜間 GO   // 2026-10-18 Pre-Ch3 修正＋Chapter 3   // 2026-10-18 REV3   // 2026-10-17 統合便 v2（version.json に branch・base＝元のコミット＝QA トップの表示）。   // 2026-10-17 道路画質 QA の作業ブランチ（claude/qa-road-1017）。2026-10-16 夜間 QA の作業ブランチ（claude/qa-bca-1016）
});

// ---- js/battle/rules.js を Node で動かす（tests/battle-rules-1006.test.mjs と同じ組み立て） ----
const M = (() => { const w = {}; new Function('window', rd('js/phase10/monsters.js'))(w); return w.MMP10M; })();
function loadRules() {
  const sk = HTML.match(/const SK=(\[.*?\]);/s)[1], eff = HTML.match(/const EFF=(\{.*?\});/s)[1];
  const sp = HTML.match(/const SP=(\[.*?\]\]);/s)[1], djp = HTML.match(/DJP=(\[\{.*?\}\]);/s)[1];
  const ctx = vm.createContext({ console, setTimeout, clearTimeout });
  ctx.window = ctx; ctx.MMP10M = M;
  vm.runInContext(rd('js/battle-bridge.js') + '\n' + rd('js/integration/adapter.js'), ctx);
  vm.runInContext(`var SK=${sk};var EFF=${eff};var SP=${sp};var DJP=${djp};var SKART=new Array(20).fill(0).map((_,i)=>"art"+i);var SFR={};for(let i=0;i<20;i++)SFR[i]={f:[],id:i};var SKM=new Array(20).fill(0).map((_,i)=>["m"+i]);var BPL=null;`, ctx);
  const base = ctx.MMBattle;
  vm.runInContext(rd('js/battle/official-moves.js'), ctx);
  vm.runInContext('MMMOVES.install()', ctx);
  vm.runInContext(rd('js/battle/rules.js'), ctx);
  assert.equal(vm.runInContext('MMRULES.install()', ctx), true);
  return { ctx, R: ctx.MMRULES, B: base, AD: ctx.MMAdapter, SK: ctx.SK, EFF: ctx.EFF };
}
const unit = (name, sp, v) => ({ name, sp, li: v.li ?? 300, po: v.po ?? 100, in: v.in ?? 100, hi: v.hi ?? 100, ev: v.ev ?? 100, de: v.de ?? 100, eq: [] });
function battle(E, a, b) {
  const pl = [a, b];
  const sess = E.B.createBattleSession({ unitA: E.AD.legacyUnitToIndividualLike(a, 'p'), unitB: E.AD.legacyUnitToIndividualLike(b, 'e'), battleType: 'official', rng: () => 0.5 });
  const bs = { A: E.AD.legacyUnitToStats(a), B: E.AD.legacyUnitToStats(b) };
  const mv = (k) => E.AD.moveFromLegacySK(E.SK[k], E.EFF[k], { id: 'sk' + k, powerScale: 100 });
  const FIX = { hitRng: () => 0, damageRng: () => 0.5, criticalRng: () => 0.99 };
  const act = (side, k, rnd = () => 0.99, rng = FIX) => E.R.resolveWith((o) => E.B.resolveAction(o), { session: sess, baseStats: bs, attackerSide: side, move: mv(k), rng }, pl, rnd);
  return { sess, st: E.R.stateOf(sess), act, pl };
}
