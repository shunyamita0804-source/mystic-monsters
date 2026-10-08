// =========================================================
// 2026-10-08 深層監査（64c6f5a）の修正・第1便
//  AF-01 H-05 名前の無害化：登録・市場・名前変更・合体・セーブの読み込み（セーブコード・スロット・起動）の全入口で、
//        HTML の記号は全角・制御文字／方向制御文字は除く・8文字。fight()（Phase 6）は変えない
//  AF-02 H-06 技管理の技名：牧場の器のルールは #app>.rn だけ（技名の span.rn＝Phase 6 と同じ class には当てない）
//  AF-03 M-03 決着（WIN!／LOSE）の時点で試合の内容（残りライフ%・与えたダメージ・命中回数）を保存＝決着の画面で閉じても順位の計算に実際の値
//  AF-04 M-02 大会の終わりの段階は始めたら rs.endSeen に保存＝再読み込みで流し直さない（続きの段階だけ）
//  AF-05 M-01 大会の終わりの正式の順・結果の画面を段階ごとに見せる・「次の画面」は next まで押せない（L-02）・セドリックの二重なし
//  AF-06 TEST_MODE のリリース対応（false で入口・処理とも出ない）
//  AF-07 M-05 合体の子も正式なランク解放の判定（継いだ旧 rk ではなく、その個体のクリア実績）
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { loadEngine, lcg } from './chapter-sim.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const HTML = rd('index.html');
const lineOf = (head) => { const i = HTML.indexOf(head); assert.ok(i >= 0, head); return HTML.slice(i, HTML.indexOf('\n', i)); };
/** 関数の本文（次の行頭が空白でない行まで＝続きの行は先頭が空白） */
const fnOf = (name) => { const h = `\nfunction ${name}(`, i = HTML.indexOf(h); assert.ok(i >= 0, h); const m = /\n(?=\S)/g; m.lastIndex = i + h.length; const e = m.exec(HTML); return HTML.slice(i + 1, e ? e.index : HTML.length); };
function load() {
  const E = loadEngine();
  new Function('window', rd('js/phase11/player.js'))(E.w);
  return { ...E, N: E.w.MMP11P };
}
const mon = (w, sp = 0, x = {}) => ({ sp, name: 'テスト', age: 0, span: 30, h: 0, rk: 0, fa: 0, st: 0, last: null, ...w.MMP10M.baseOf(sp), sk: [0, 1, 2, 3], eq: [0, 1, 2, 3, -1, -1], ...x });
const BAD = ['<!--', '<title>', '<style>', '"><img src=x onerror=alert(1)>', "a'b\"c`d\\e&f", 'x‮y​z\u0007', '  ', 'あいうえおかきくけこ'];

test('AF-01：H-05 名前の正規化（記号は全角・制御文字／見えない方向制御を除く・8文字・空なら既定）', () => {
  const { N } = load();
  for (const v of BAD) {
    for (const r of [N.sanitize(v), N.monsterName(v, 1), N.cleanName(v, 'ソラモ')]) {
      assert.doesNotMatch(r, /[<>&"'`\\\u0000-\u001f‪-‮​-‏]/, `記号が残らない：${JSON.stringify(v)} → ${r}`);
      assert.ok(Array.from(r).length <= 8 && r.length > 0, `1〜8文字：${r}`);
    }
  }
  assert.equal(N.sanitize('<!--'), '＜!--'); assert.equal(N.sanitize('  '), 'アルト'); assert.equal(N.monsterName('', 1), 'ガウル', '空なら種族名');
  assert.equal(N.cleanName('', null), '', '名前変更は空なら空（画面が「名前を入力してください」）');
  assert.equal(N.sanitize('ソラモ'), 'ソラモ', 'ふつうの名前は変えない'); assert.equal(N.monsterName('🐉🐉🐉🐉🐉🐉🐉🐉🐉', 0), '🐉🐉🐉🐉🐉🐉🐉🐉', '絵文字は1文字（半分にしない）');
});

test('AF-01b：H-05 セーブの読み込み（起動・スロット・セーブコード＝MMP8.migrateSave の補正）で、プレイヤー名・連れている子・牧場の子の名前を整える', () => {
  const { P8, w, N } = load();
  const S = P8.newSave(); S.m = P8.initIndividual(S, mon(w, 1, { name: '"><img src=x onerror=alert(1)>' })); S.box = [P8.initIndividual(S, mon(w, 0, { name: '<!--' })), P8.initIndividual(S, mon(w, 0, { name: '' }))];
  S.playerName = '<b>アルト</b>'; delete S.playerNamePending;
  const o = P8.migrateSave(JSON.parse(JSON.stringify(S)));
  assert.equal(o.m.name, N.monsterName('"><img src=x onerror=alert(1)>', 1)); assert.doesNotMatch(o.m.name, /[<>"]/);
  assert.equal(o.box[0].name, '＜!--'); assert.equal(o.box[1].name, 'ソラモ', '空の名前は種族名'); assert.equal(o.playerName, '＜b＞アルト＜/');
  const ok = P8.newSave(); ok.m = P8.initIndividual(ok, mon(w, 0, { name: 'ソラ' })); ok.playerName = 'ユウ'; delete ok.playerNamePending;
  const o2 = P8.migrateSave(JSON.parse(JSON.stringify(ok))); assert.equal(o2.m.name, 'ソラ'); assert.equal(o2.playerName, 'ユウ', '正常なセーブは変えない');
});

test('AF-01c：H-05 全入口が正規化を通る（登録・市場・名前変更・合体・購入）。セーブコード・スロットは migrateSave（補正つき）。fight() は変えない', () => {
  assert.match(fnOf('mkgo'), /adopt\(i,MMP11P\.monsterName\(e&&e\.value,i\)\)/, '市場の名付け');
  assert.match(fnOf('adopt'), /if\(nm\)x\.name=MMP11P\.monsterName\(nm,x\.sp\);/, '購入（どの呼び出し元からでも）');
  assert.match(fnOf('rnRename'), /const v=MMP11P\.cleanName\(e&&e\.value,null\);if\(!v\)return farm\("名前を入力してください。","n"\);/, '牧場の名前変更');
  assert.match(HTML, /c\.name=MMP11P\.monsterName\(cname\(a,b\),c\.sp\);/, '合体の子');
  assert.match(fnOf('p11NameGo'), /MMP11P\.confirmName\(S,/, '登録（近道）'); assert.match(fnOf('opConfirm'), /const n=MMP11P\.sanitize\(v\);/, '登録（序盤の導線）');
  assert.match(fnOf('imp'), /MMP8\.migrateSave\(/, 'セーブコード'); assert.match(fnOf('slotLoad'), /MMP8\.migrateSave\(/, 'スロット');
  assert.match(rd('js/phase11/player.js'), /root\.MMP8\.addSaveNormalizer\(normalizeSave\)/);
  assert.doesNotMatch(lineOf('async function fight('), /MMP11P/, 'fight() は変えない');
});

test('AF-02：H-06 牧場の器のルールは #app>.rn だけ（技名の span.rn に当てない）。Phase 6 の .rw .rn は従来どおり', () => {
  const css = HTML.slice(0, HTML.indexOf('</style>'));
  assert.doesNotMatch(css, /(^|[}\n])\.rn\{/, '裸の .rn{ は無い');
  assert.match(css, /\n#app>\.rn\{margin:-16px -16px 0;/);
  assert.match(css, /\.rw \.rn\{position:relative;z-index:2;flex:1;/, 'ルーレットの技名の規則はそのまま');
  assert.match(lineOf('  const rows=m.eq.map('), /<span class="rn">/, '技管理の技名の class は変えない（Phase 6 と同じ見た目）');
});

/** Chapter key のゴールで大会を始めた状態 */
function tourAt(E, key, rank, opt = {}) {
  const { P7, P8, w } = E; const S = P8.newSave(); S.m = P8.initIndividual(S, mon(w, 0, opt.mon)); P7.ensureProg(S.m); const m = S.m;
  for (const r of opt.cleared || []) m.prog.rankClr[r] = true;
  if (key > 1) Object.assign(m.raise, { state: 'farm', ch: key, log: Array.from({ length: key - 1 }, (_, i) => ({ ch: i + 1, reachedGoal: true })) });
  assert.equal(P8.depart(S, m, lcg(5)).ok, true);
  Object.assign(m.raise, { node: P8.boardOf(m).goal, goal: true, pend: null });
  assert.equal(P8.startTournament(S, m, rank, 77).ok, true);
  return { S, m };
}

test('AF-03：M-03 決着（fight() の adv()＝save() の直前）で試合の内容を入れる → 決着の画面で閉じて再読み込みしても、実際の値で記録される', () => {
  const E = load(), { P8, w } = E;
  const { S, m } = tourAt(E, 1, 0);
  assert.equal(P8.beginBattle(S, m, { kind: 'league', rank: 0 }).ok, true);
  const stats = { me: { life: 37, dmg: 412, hits: 6 }, opp: { life: 0, dmg: 190, hits: 3 } };
  const adv = new Function('S', 'MMP8', 'window', 'MMRULES', `${fnOf('adv')}\nreturn adv;`)(S, P8, { MMRULES: { battleStats: () => stats } }, { battleStats: () => stats });
  S.wins = (S.wins || 0) + 1; adv();   // fight() の決着：勝利数を足して adv() → save()
  assert.deepEqual(m.raise.battle.stats, stats); assert.equal(m.raise.battle.done, true);
  // ここで閉じる（「もどる」を押さない）→ 再読み込み
  const S2 = P8.migrateSave(JSON.parse(JSON.stringify(S))), m2 = S2.m;
  assert.deepEqual(m2.raise.battle.stats, stats, 'セーブに残る');
  const f = P8.finishBattle(S2, m2, lcg(3)); assert.equal(f.matchWon, true);
  const lg = m2.raise.tour.league, mt = lg.rounds.flat().find((x) => x.st);
  assert.ok(mt, '試合に内容が記録された'); assert.equal(JSON.stringify(mt.st).includes('412'), true, '実際の与えたダメージ');
  // 練習試合では入れない（大会の順位の計算にだけ使う）
  const E2 = load(), { P8: Q } = E2; const S3 = Q.newSave(); S3.m = Q.initIndividual(S3, mon(E2.w)); E2.P7.ensureProg(S3.m);
  S3.m.raise.battle = { kind: 'practice', snap: {} };
  new Function('S', 'MMP8', 'window', 'MMRULES', `${fnOf('adv')}\nreturn adv;`)(S3, Q, { MMRULES: { battleStats: () => stats } }, { battleStats: () => stats })();
  assert.equal(S3.m.raise.battle.stats, undefined);
  void w;
});

test('AF-04：M-02 大会の終わりの段階は始めたら result.endSeen に保存（persist）＝再読み込み後は流し直さない・途中なら続きの段階だけ', async () => {
  const E = load(), { P8 } = E;
  const ran = []; for (const st of P8.TOUR_END_STEPS) P8.registerTourEndHook(st, (d) => { ran.push(d.step); });
  const res = { rank: 1, place: 1, won: true, firstClear: true, reward: { firstClear: true, prize: 200, tickets: 1, bonus: [], rankUp: { from: 1, to: 2, unlocked: 2 } } };
  let saves = 0; const out = await P8.runTourEnd(res, { persist: () => { saves++; } });
  assert.deepEqual(out, ['final', 'champion', 'firstReward', 'rankUp', 'cedricEnd', 'next']); assert.deepEqual(ran, out);
  assert.deepEqual(res.endSeen, out); assert.equal(saves, out.length, '段階ごとに保存');
  ran.length = 0; const again = JSON.parse(JSON.stringify(res));
  assert.deepEqual(await P8.runTourEnd(again, { persist: () => {} }), [], '再読み込み後は何も流さない'); assert.deepEqual(ran, []);
  const mid = { ...JSON.parse(JSON.stringify(res)), endSeen: ['final', 'champion'] };
  assert.deepEqual(await P8.runTourEnd(mid), ['firstReward', 'rankUp', 'cedricEnd', 'next'], '途中で閉じたら続きから');
  assert.equal(P8.tourEndSeen(mid, 'rankUp'), true); assert.equal(P8.tourEndSeen({}, 'final'), false);
  assert.match(fnOf('p9TourResult'), /MMP8\.runTourEnd\(rs,\{persist:\(\)=>save\(\)\}\)/);
});

test('AF-05：M-01 大会の終わりの正式の順＝最終順位 → 優勝ならモンスターの勝利演出 → 初回報酬 → ランクアップ／解放 → セドリックの締め → 次の画面。試合単位の報酬は出さない', () => {
  assert.match(rd('js/phase8/raising.js'), /TOUR_END_STEPS = Object\.freeze\(\['final', 'champion', 'firstReward', 'rankUp', 'cedricEnd', 'legendUnlock', 'next'\]\)/);
  const R = fnOf('p9TourResult');
  assert.match(R, /<div class="p9tour p9end\$\{ec\} /, '始めた段階＝e-段階名（再読み込みでも同じ見え方）');
  assert.match(R, /<div class="p9wmon" aria-hidden="true"><div class="mon">\$\{msv\(m\)\}<\/div><\/div>/, '優勝＝モンスターの正式画像の勝利演出');
  assert.match(R, /\$\{cedricOn\(\)\?"":p9Ced\(/, 'セドリックの静的な一言は締めの会話を出さないときだけ（二重にしない）');
  assert.equal((R.match(/class="p9btn[^"]*p9endbtn"\$\{dis\}/g) || []).length, 2, '次の画面のボタンは next まで押せない（L-02）');
  const css = HTML.slice(0, HTML.indexOf('</style>'));
  assert.match(css, /\.p9tour\.p9end:not\(\.e-final\) \.p9lose,\.p9tour\.p9end:not\(\.e-champion\) \.p9win,\.p9tour\.p9end:not\(\.e-champion\) \.p9rw,\.p9tour\.p9end:not\(\.e-firstReward\) \.p9rw\.fc\{display:none\}/);
  for (const st of ['final', 'champion', 'firstReward', 'rankUp', 'cedricEnd', 'legendUnlock', 'next']) assert.match(HTML, new RegExp(`registerTourEndHook\\("${st}",[^\\n]*p9EndMark\\("${st}"\\)`), st);
  assert.match(HTML, /registerTourEndHook\("firstReward",async d=>\{[^\n]*if\(p9EndHere\(m\)\)await p9EndWait\(d\.bagUnlocked\?3600:2700\)\}\);/, '帯を見せてからランクアップへ');
  assert.match(HTML, /CEDRIC_EV\.close\(rs,rs\.reward&&rs\.reward\.rankUp,m&&m\.name\)/, '締めの文はデータから（再読み込みでも同じ）');
  assert.doesNotMatch(HTML.match(/registerTourEndHook\("rankUp"[^\n]*\n[^\n]*\n[^\n]*/)[0], /setTimeout\(r,2600\)/, '固定の 2.6 秒待ちはやめた（前の段階が待つ）');
});

test('AF-06：TEST_MODE のリリース対応＝1か所の定数。false なら街の入口も testTour() の処理も無い', () => {
  assert.match(HTML, /\nconst TEST_MODE=(true|false);/);
  assert.equal((HTML.match(/\nconst TEST_MODE=/g) || []).length, 1, '定義は1か所');
  const expr = HTML.match(/\$\{(TEST_MODE&&!S\.playerNamePending\?`<button class="ttest"[^`]*`:"")\}/)[1];
  assert.equal(new Function('TEST_MODE', 'S', `return ${expr};`)(false, {}), '');
  let touched = false; const S = { get playerNamePending() { touched = true; return false; } };
  const tt = new Function('TEST_MODE', 'S', 'TEST_TOUR', `${fnOf('testTour')}\nreturn testTour;`)(false, S, null);
  assert.equal(tt(), undefined); assert.equal(touched, false, 'false なら何もしない');
  const refs = HTML.split('\n').filter((l) => l.length < 50000 && /TEST_MODE/.test(l) && !/^\s*\/\//.test(l));
  assert.ok(refs.every((l) => /const TEST_MODE=|TEST_MODE&&!S\.playerNamePending|if\(!TEST_MODE\|\|TEST_TOUR|TEST_MODE のときだけ|TEST_MODE を false/.test(l)), '入口と処理の2か所だけで使う');
});

test('AF-07：M-05 合体の子（旧 rk を継ぐ・クリア実績は空）も正式なランク解放の判定＝D の初回優勝で C 解放の昇格', () => {
  const E = load(), { P8 } = E;
  const { S, m } = tourAt(E, 2, 1, { mon: { rk: 4 } });   // 合体の子：c.rk=max(親の rk)（旧フィールド）
  assert.deepEqual(P8.eligibleRanks(m, 2), [0, 1], '継いだ rk 4 では選べるランクは増えない（実績なし＝D まで）');
  while (m.raise.tour.status === 'league') { P8.beginBattle(S, m, { kind: 'league', rank: 1 }); S.wins = (S.wins || 0) + 1; P8.markBattleDone(S); P8.finishBattle(S, m, lcg(4)); }
  const r = m.raise.tour.result; assert.equal(r.won, true);
  assert.deepEqual(r.reward.rankUp, { from: 1, to: 2, unlocked: 2 }, 'D 優勝 → C 解放（合体の子でも昇格が出る）');
  assert.deepEqual(P8.eligibleRanks(m, 2), [0, 1, 2]);
});
