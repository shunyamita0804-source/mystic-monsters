// =========================================================
// 2026-10-07 の差分（新プロローグ6枚・LEGEND の差し込み口・バトル画面の素材・リュウ／セドリック・冒険リアクション100件）の最小テスト
//  RX-01：100件の定義（id の重複なし・必須項目・種族ごと20件・モーションは共通15種・選択肢2〜3・結果は既存の仕組みだけ）
//  RX-02：発生の制御（通常マスで確率・同じ Chapter で重複なし・2ターン続けない・薬草は1回まで）と結果の反映（新しい永続パラメータを足さない）
//  DF-01：新プロローグ6枚（順・背景の実在・本文に「聖獣師」「バルド」を使わない）・レジェンド3人
//  DF-02：LEGEND は通常大会のランク（E〜S）に入らない・S クリアで挑戦の条件
//  DF-03：リュウ／セドリックのイベントの差し込み（index.html）・素材の実在
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (f) => readFileSync(path.join(ROOT, f), 'utf8');
const load = (f, name, w = {}) => { new Function('window', 'document', rd(f))(w, undefined); return w[name]; };

function engine() {
  const w = {}; w.window = w;
  new Function('window', rd('js/chapter/engine.js'))(w);
  return w;
}

test('RX-01：冒険リアクション100件の定義', () => {
  const R = load('js/chapter/reactions.js', 'MMREACT');
  assert.equal(R.EVENTS.length, 100);
  assert.equal(new Set(R.EVENTS.map((e) => e.id)).size, 100, 'id の重複なし');
  assert.equal(Object.keys(R.MOTIONS).length, 15, '共通モーション 15 種');
  for (const k of ['stop', 'lookPlayer', 'lookFina', 'lookAway', 'sniff', 'crouch', 'happy', 'tired', 'inspectGround', 'tailReaction', 'wingReaction', 'stoneReaction', 'alert', 'approach', 'backOff']) assert.ok(R.MOTIONS[k], k);
  for (let sp = 0; sp < 5; sp++) assert.equal(R.EVENTS.filter((e) => e.sp === sp).length, 20, `種族 ${sp} は20件`);
  const FINA = ['normal', 'smile', 'happy', 'surprised', 'troubled', 'worried', 'serious', 'guide'];
  for (const e of R.EVENTS) {
    assert.ok(e.title && e.line && R.MOTIONS[e.motion], e.id);
    assert.ok(FINA.includes(e.expression), `${e.id} フィナの表情 ${e.expression}`);
    assert.ok(e.choices.length >= 2 && e.choices.length <= 3, `${e.id} 選択肢`);
    for (const c of e.choices) {
      assert.ok(c.label, e.id);
      if (c.fx) {
        const keys = Object.keys(c.fx);
        assert.ok(keys.every((k) => ['fatigue', 'stat', 'amount', 'item'].includes(k)), `${e.id} 結果は疲れ・能力・アイテムだけ`);
        if (c.fx.fatigue != null) assert.ok(Math.abs(c.fx.fatigue) <= 5, `${e.id} 疲れの小変動`);
        if (c.fx.stat) assert.equal(c.fx.amount, 1, `${e.id} 能力はごく小さく`);
        if (c.fx.item) assert.equal(c.fx.item, 'herb', '既存のアイテム');
      }
    }
  }
  const all = JSON.stringify(R.EVENTS);
  assert.doesNotMatch(all, /親密度|信頼度|機嫌度|ガッツ|経験値|Lv\./, '新しいパラメータの文言なし');
});

test('RX-02：発生の制御と結果の反映', () => {
  const w = engine(); load('js/chapter/reactions.js', 'MMREACT', w); const R = w.MMREACT;
  const m = { sp: 0, li: 100, po: 100, in: 100, hi: 100, ev: 100, de: 100, raise: { turnsUsed: 0, fatigue: 40, field: {} } };
  assert.equal(R.pick(m, { rng: () => 0 }), null, '最初のターンは出さない');
  m.raise.turnsUsed = 3;
  assert.equal(R.pick(m, { rng: () => 0.99 }), null, '確率で出ない');
  const e1 = R.pick(m, { rng: () => 0 }); assert.ok(e1 && e1.sp === 0, '種族のイベント');
  R.mark(m, e1.id);
  m.raise.turnsUsed = 4; assert.equal(R.pick(m, { rng: () => 0 }), null, '2ターン続けない');
  m.raise.turnsUsed = 5; const e2 = R.pick(m, { rng: () => 0 }); assert.notEqual(e2.id, e1.id, '同じ Chapter で重複しない');
  const keys0 = Object.keys(m).sort().join();
  const evF = R.EVENTS.find((e) => e.id === 'rx003');
  let r = R.apply({}, m, evF, 0); assert.deepEqual([r.kind, r.fatigue, m.raise.fatigue], ['fatigue', -5, 35]);
  r = R.apply({}, m, evF, 2); assert.deepEqual([r.kind, m.raise.fatigue], ['fatigue', 36]);
  const evS = R.EVENTS.find((e) => e.id === 'rx002'); r = R.apply({}, m, evS, 1); assert.deepEqual([r.kind, r.key, m.hi], ['stat', 'hi', 101]);
  r = R.apply({}, m, evS, 0); assert.equal(r.kind, 'none', '演出だけ');
  const S = { inv: { bag: [], vault: [] } }, evI = R.EVENTS.find((e) => e.id === 'rx005');
  r = R.apply(S, m, evI, 0); assert.deepEqual([r.kind, S.inv.vault.length], ['item', 1]);
  r = R.apply(S, m, evI, 0); assert.deepEqual([r.kind, S.inv.vault.length], ['none', 1], '薬草は1 Chapter に1回');
  assert.equal(Object.keys(m).sort().join(), keys0, '個体に新しい永続項目を足さない');
  assert.deepEqual(Object.keys(m.raise.field).sort(), ['rx', 'rxItem', 'rxTurn'], '記録は配置の中だけ（配置と一緒に消える）');
  const FV = rd('js/chapter/field-view.js');
  assert.match(FV, /tileKeyOf\(m, id\) === 'normal'[^\n]*reactionAt\(m\)/, '通常マスだけ');
  assert.match(FV, /async function reactionAt[\s\S]{0,200}MM_QA_NO_STORY/, '自動テストでは出さない');
  assert.ok(rd('index.html').includes('<script src="./js/chapter/reactions.js"></script>'));
});

test('DF-01：新プロローグ6枚・レジェンド3人', () => {
  const P = load('js/prologue/prologue.js', 'MMPRO');
  assert.equal(P.SLIDES.length, 6);
  const names = ['peace', 'calamity', 'culture', 'legends', 'tournament', 'departure'];
  P.SLIDES.forEach((s, i) => { assert.ok(s.bg.includes(`prologue_0${i + 1}_${names[i]}`), s.bg); assert.ok(existsSync(path.join(ROOT, s.bg.replace(/^\.\//, '').replace(/\?.*$/, ''))), s.bg); });
  assert.equal(P.CUES.scenes.length, 6);
  const txt = JSON.stringify(P.SLIDES);
  assert.doesNotMatch(txt, /聖獣師|バルド/);
  assert.deepEqual(P.LEGENDS.map((l) => [l.name, l.beast]), [['アストラッド', 'ゼルヴァーン'], ['レオナ', 'グリフェル'], ['ラグナス', 'ドラグノル']]);
  for (const f of ['astrad_full', 'leona_full', 'ragnas_full', 'zelvarn_monster', 'griffel_monster', 'dragnol_monster']) assert.ok(existsSync(path.join(ROOT, `assets/legends/${f}.webp`)), f);
});

test('DF-02：LEGEND は通常大会のランクに入らない', () => {
  const H = rd('js/phase8/raising.js');
  assert.match(H, /const LEGEND = Object\.freeze\(\{ id: 'LEGEND', after: 'S'/);
  const HTML = rd('index.html');
  assert.doesNotMatch(HTML.match(/function p9RankListHtml[^\n]*/)[0], /LEGEND/, 'ランク選択に LEGEND は無い');
});

test('DF-03：リュウ／セドリックのイベント・バトル画面の素材', () => {
  const HTML = rd('index.html');
  assert.ok(HTML.includes('async function opRyu()'), 'リュウの初対面');
  assert.ok(HTML.includes('f.ryuMet=0;save();opRyu()'), '登録 → 世界地図の会話のあと（市場の前）');
  assert.doesNotMatch(HTML, /同じように旅してるリュウ/);
  assert.ok(HTML.includes('async function p9TourOpen(k)'), 'セドリックの大会前導入');
  assert.ok(HTML.includes('さあ、いよいよ公式ランク${R}大会の開幕です！'));
  assert.ok(HTML.includes('聖獣士として歩み始めたばかりの駆け出しの挑戦者たち'));
  assert.ok(HTML.includes('それでは、参加者をご紹介しましょう！'));
  assert.ok(HTML.includes('MMP8.registerTourEndHook("cedricEnd"'), 'セドリックの締め＝大会の終わりの順の cedricEnd');
  assert.doesNotMatch(HTML.match(/function p9CompareScr[^\n]*/)[0], /p9Ced\(/, '大会2 にセドリックは出さない');
  for (const r of ['E', 'D', 'C', 'B', 'A', 'S']) assert.ok(existsSync(path.join(ROOT, `assets/battle/arena/arena_${r}.webp`)), r);
  for (const s of ['soramo', 'gauru', 'nobiton', 'jiol', 'regnas']) assert.ok(existsSync(path.join(ROOT, `assets/battle/idle/idle_${s}.webp`)), s);
  for (const f of ['arch', 'center_frame', 'stop', 'plate_normal', 'plate_selected', 'plate_miss']) assert.ok(existsSync(path.join(ROOT, `assets/battle/roulette/${f}.webp`)), f);
});
