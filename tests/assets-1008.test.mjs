// =========================================================
// 2026-10-08 次便：正式素材の統合（セドリック・街BGM・リュウの表情・市場の木製UI・VS 専用勝負絵・ランク昇格 Final）
//  AS8-01 セドリックの大会前後＝ランク別の実況席 booth_X（ユーザー指示）を画面の幅に合わせて（cover で拡大しない）
//  AS8-02 市場の木製UI（中央・左右の札・左右のナビ）。カルーセルの処理は変えない
//  AS8-03 VS の専用勝負絵 5体（右向き・相手だけ反転）
//  AS8-04 ランク昇格 Final（段階ごとに4枚）・昇格の規則は変えない
//  AS8-05 リュウの表情5種（会話の立ち絵）・台詞は変えない
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const HTML = rd('index.html');
const ex = (p) => existsSync(path.join(ROOT, p));
const RK = ['E', 'D', 'C', 'B', 'A', 'S'];

test('AS8-01：セドリック＝大会前の導入も締めもランク別の実況席 booth_X（旧いアップ画像・顔・standing_UI は使わない）。画面の幅に合わせる', () => {
  for (const r of RK) { assert.ok(ex(`assets/tournament/cedric/opening_${r}.webp`), r); assert.ok(ex(`assets/tournament/cedric/booth_${r}.webp`), r); }
  assert.match(HTML, /const CED_SCENE=\(k,kind\)=>`\.\/assets\/tournament\/cedric\/\$\{kind\}_\$\{RN\[k\]\}\.webp`;/);
  assert.match(HTML, /scene:CED_SCENE\(k,"booth"\),noFig:true/); assert.doesNotMatch(HTML, /CED_SCENE\(k,"opening"\)/); assert.match(HTML, /scene:CED_SCENE\(rs\.rank,"booth"\),noFig:true/);
  assert.match(HTML, /\.mmtalk-nofig>\.mmtalk-scenebg\[style\*="booth_"\]\{background-size:100% auto;background-position:center top\}/);
});

test('AS8-02：市場の木製UI（assets/ui/market_wood/）＝中央・左右の札・左右のナビ。カルーセルの処理（p10Step・矢印・ドット）は変えない', () => {
  for (const f of ['plate_center', 'plate_side', 'arrow_left', 'arrow_right']) { assert.ok(ex(`assets/ui/market_wood/${f}.png`), f); assert.ok(HTML.includes(`./assets/ui/market_wood/${f}.png`), f); }
  assert.match(HTML, /<div class="p10plate"><b>\$\{s\.name\}<\/b><span>/);
  assert.match(rd('assets/ui/market_wood/README.md'), /b53f262bbc5606ac/);
});

test('AS8-03：VS の専用勝負絵＝5体（ソラモ・ガウル・ノビトン・ジオル・レグナス）。向きは待機立ち絵と同じ規則（相手のモンスターの絵だけ反転）', () => {
  assert.match(HTML, /const TB_VS=\["solamo","gauru","nobiton","jiol","regnas"\];/);
  for (const k of ['solamo', 'gauru', 'nobiton', 'jiol', 'regnas']) assert.ok(ex(`assets/tournament/vs_monsters/${k}_vs.webp`), k);
  assert.match(HTML, /<span class="mon">\$\{tbVs\(o,1\)\}<\/span><\/div><div class="tvsm me"><span class="mon">\$\{tbVs\(m,0\)\}<\/span>/);
  assert.match(rd('js/battle/arena.js'), /const FACE = \{ 0: 'R', 1: 'R', 2: 'R', 3: 'R', 4: 'R' \}/);
});

test('AS8-04：ランク昇格 Final（4枚を重ねる）。昇格の規則・大会の終わりの順は変えない。B1〜B7 は流さない', () => {
  for (const st of ['E_to_D', 'D_to_C', 'C_to_B', 'B_to_A', 'A_to_S']) for (const k of ['letter', 'frame', 'fx', 'plaque']) assert.ok(ex(`assets/tournament/rankup_final/${st}/${k}.webp`), `${st}/${k}`);
  assert.match(HTML, /function p9RankUpFinal\(st,to\)\{/);
  assert.match(rd('js/phase8/raising.js'), /TOUR_END_STEPS = Object\.freeze\(\['final', 'champion', 'firstReward', 'rankUp', 'cedricEnd', 'legendUnlock', 'next'\]\)/);
  assert.doesNotMatch(HTML.replace(/^const RANK_UP_FX=.*$/m, ''), /p9Frames\(RANK_UP_FX/);
});

test('AS8-05：リュウの表情5種（closeup）。全身は従来の正式の全身。台詞は変えない', () => {
  const N = rd('js/npc/npc.js');
  for (const k of ['normal', 'surprise', 'confident', 'serious', 'soft_smile']) { assert.ok(ex(`assets/npc/ryu/expr/${k}.webp`), k); assert.ok(N.includes(`${k}: RX('${k}')`), k); }
  assert.match(N, /views: \{ closeup: \{ \.\.\.RC \}, fullbody: \{ \.\.\.RV \} \} \}\);/);
  const r = HTML.slice(HTML.indexOf('OPEN_TALK.ryu=n=>['), HTML.indexOf('\n/** プロローグ'));
  assert.deepEqual([...r.matchAll(/npc:"ryu",expression:"(\w+)"/g)].map((m) => m[1]), ['surprise', 'confident', 'soft_smile', 'serious', 'confident']);
  for (const t of ['あれ？ フィナじゃないか！', '決まってるだろ。聖獣士になりに来たんだよ。……で、そっちは？', 'へえ、新人か。よろしくな、${n}。', 'オレは先に『はじまりの草原』へ行ってる。追いつけるもんなら、追いついてみな！']) assert.ok(r.includes(t), t);
});

test('AS8-06：モンスターの勝利演出＝種族ごとの正式の勝利画像（透過）を会場の上に。大会の終わりの順（final → champion → firstReward → rankUp → cedricEnd）は変えない', () => {
  assert.match(HTML, /const VICTORY_IMG=\["solamo","gauru","nobiton","jiol","regnas"\];/);
  for (const k of ['solamo', 'gauru', 'nobiton', 'jiol', 'regnas']) assert.ok(ex(`assets/tournament/victory/${k}_victory.webp`), k);
  assert.match(HTML, /src="\.\/assets\/tournament\/victory\/\$\{k\}_victory\.webp"/);
  assert.match(HTML, /registerTourEndHook\("champion",async\(\)=>\{const m=S\.m;p9EndMark\("champion"\);if\(!p9EndHere\(m\)\)return;const t=m\.raise&&m\.raise\.tour;if\(window\.MM_QA_NO_TOURFX\)return p9EndWait\(1900\);await p9VictoryShow\(m,t\?t\.rank:0\)\}\);/);
  assert.match(rd('js/phase8/raising.js'), /TOUR_END_STEPS = Object\.freeze\(\['final', 'champion', 'firstReward', 'rankUp', 'cedricEnd', 'legendUnlock', 'next'\]\)/);
});

test('AS8-07：世界地図の解放アイコン（透過・意匠は変えない）', () => {
  assert.ok(ex('assets/ui/worldmap_icon/worldmap_unlock.png'));
  assert.match(HTML, /MMNOTE\.show\(\{img:"\.\/assets\/ui\/worldmap_icon\/worldmap_unlock\.png",cmd:true,small:true,title:"世界地図が使えるようになった",se:"UNLOCK"\}\)/);
});
