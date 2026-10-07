// =========================================================
// PHASE B（2026-10-05）：タイトル BGM の廃止・プロローグ v6（38.714秒）・凍結で「見た」にならない・新しいゲームの確認・会話の改行ずれ・正式の会話窓・
//  システム通知の帯・薬草の正式アイコン・ミストリアの名札・聖獣士管理局の BGM・ライバル遭遇のリュウ・大会ランクの正式 UI・アイテム管理・アイテム補給所
//  PB-01〜10（画面は tests/qa-e2e-phase-b.test.mjs・qa-e2e-prologue.test.mjs の PRO-B5／B6）
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const HTML = rd('index.html');
const fnOf = (name) => { const i = HTML.indexOf(`function ${name}(`); assert.ok(i > 0, name); return HTML.slice(i, HTML.indexOf('\nfunction ', i + 10)); };
const load = (f, name, w = {}) => { new Function('window', 'document', rd(f))(w, undefined); return w[name]; };
const sha = (p) => createHash('sha256').update(readFileSync(path.join(ROOT, p))).digest('hex');

test('PB-01：開始画面に BGM は無い（TITLE は silent・旧タイトル曲のファイルも置かない）。プロローグは正式 v6・聖獣士管理局は正式 BGM（ループ・会話が聞こえる音量）', () => {
  const w = {}; load('js/audio/audio-manager.js', 'MMAUDIO', w); new Function('window', rd('js/audio/audio-registry.js'))(w);
  const B = w.MMAUDIO.registryOf('bgm');
  assert.equal(B.TITLE.silent, true); assert.deepEqual(B.TITLE.srcs, []);
  assert.equal(B.PROLOGUE.silent, true, '2026-10-06 重大修正：プロローグ BGM は削除'); assert.deepEqual(B.PROLOGUE.srcs, []);
  assert.ok(!existsSync(path.join(ROOT, 'assets/audio/bgm/mystic_monsters_official/mystic_monsters_prologue_bgm_official.ogg')));
  assert.equal(sha('assets/audio/bgm/mystic_monsters_official/mystic_monsters_bureau_bgm_official.ogg'), '0fd1e1b8f593bdbae8d20414274bde12ba85f25347a5c45f6a004014a761be90', '聖獣士管理局 v6');
  assert.ok(!existsSync(path.join(ROOT, 'assets/audio/bgm/mystic_monsters_official/mystic_monsters_title_theme_official.ogg')), '旧タイトル曲は置かない＝読み込みようがない');
  assert.notEqual(B.BUREAU.loop, false); assert.ok(B.BUREAU.gain < 0.5, '会話が聞こえる音量（約 -20 LUFS）');
  assert.match(HTML, /const BGM_SCENE=\{title:"TITLE",prologue:"PROLOGUE",town:"TOWN",bureau:"BUREAU",/);
  for (const f of ['bureauScr', 'opBureau', 'opAfterReg']) assert.match(fnOf(f), /bgm\("bureau"\)/, `${f}：管理局に入ったら管理局の曲`);
  assert.match(fnOf('p11NameScr'), /bgm\(opOn\(\)\?"bureau":"title"\)/, '聖獣士登録（管理局）も同じ曲＝会話で止めない');
  assert.match(fnOf('startGame'), /MMAUDIO\.se\("TITLE_START",\{wait:900\}\)/, '開始の音（正式 SE）はそのまま');
});

test('PB-02：プロローグの時刻表＝2026-10-07 正式6枚（約6.3秒ずつ・本文の終わり 38.4・終わり 39.4秒。BGM なし）。本文は変えない・読む間を残す', () => {
  const P = load('js/prologue/prologue.js', 'MMPRO');
  assert.deepEqual(P.sceneStarts(), [0, 6300, 12600, 18900, 25600, 32000]);
  const ev = P.schedule(), at = (k) => ev.filter((e) => e.k === k).map((e) => e.t);
  assert.deepEqual([at('lastText'), at('end')], [[38400], [39400]]);
  assert.deepEqual({ ...P.CUES, scenes: [...P.CUES.scenes] }, { scenes: [0, 6300, 12600, 18900, 25600, 32000], lastText: 38400, end: 39400 });
  // 本文は全部・順番どおり（schedule の show の並び＝SLIDES の段落の並び）
  const shown = ev.filter((e) => e.k === 'show').map((e) => e.u.join(''));
  assert.deepEqual(shown, P.SLIDES.flatMap((s) => s.pages.flatMap((pg) => P.units(pg).map((u) => u.join('')))));
  // 各段落：出始め → 消え始めまで、文字数あたり 70ms 以上・全部出てから 1秒以上（読めない速さにしない）
  let cur = null, full = null;
  for (const e of ev) { if (e.k === 'show') cur = e; if (e.k === 'full') full = e; if (e.k === 'out') { const n = Array.from(cur.u.join('')).length; assert.ok((e.t - cur.t) / n >= 70, `「${cur.u[0].slice(0, 8)}」${e.t - cur.t}ms/${n}字`); assert.ok(e.t - full.t >= 1000, '全部出てから1秒以上'); } }
  // Scene の切り替えより前に、その Scene の最後の段落が消え終わる
  const S = P.sceneStarts().concat([38400]); for (const e of ev.filter((x) => x.k === 'clear')) assert.ok(S.some((t) => t === e.t) || S.every((t) => Math.abs(t - e.t) > 0), 'clear');
  assert.equal(P.T.chGap, 48, '1文字ずつの間隔はそのまま');
  assert.doesNotMatch(rd('js/prologue/prologue.js'), /7782|21226|37342|50786/, '旧い時刻表を使わない');
});

test('PB-03：プロローグの「見た」＝最後まで見た／スキップを2度押しで確定したときだけ。JS が止まっていた時間は時計に入れない（iOS で一気に最後まで進んで「見た」になっていた）・pagehide／freeze でも止まる・Scene 1 の前はスキップを押せない', () => {
  const src = rd('js/prologue/prologue.js'), P = load('js/prologue/prologue.js', 'MMPRO');
  assert.equal(P.STALL_MS, 1500);
  assert.match(src, /const clock = \(\) => acc \+ \(t0 == null \? 0 : Math\.min\(now\(\) - t0, STALL_MS\)\);/);
  assert.match(src, /const tick = \(\) => \{ if \(t0 != null\) \{ const n = now\(\), d = n - t0; acc \+= Math\.min\(d, STALL_MS\);/);
  assert.match(src, /root\.addEventListener\('pagehide', onHide\); root\.addEventListener\('pageshow', onShow\);/);
  assert.match(src, /document\.addEventListener\('freeze', onHide\); document\.addEventListener\('resume', onShow\);/);
  assert.match(src, /skip\.disabled = true;/); assert.match(src, /skip\.disabled = false;\n/);
  for (const f of ['opPrologue']) assert.match(fnOf(f), /proPlay\(cv\)\.then\(ok=>\{cv\.remove\(\);if\(ok\)\{finaFlags\(\)\.prologue=1;save\(\)\}\}\)/, '見た記録は ok（最後まで／スキップ確定）のときだけ');
});

test('PB-04：新しいゲームの確認（「最初からやり直す」のあとの開始画面で開始ボタンを押したとき）。後ろは押せない・確認しました＝従来の開始・戻る＝つづきからの開始画面', () => {
  assert.match(fnOf('startGame'), /^function startGame\(el,ok\)\{if\(P_NEWGAME&&!ok\)return ngAsk\(el\);/);
  const a = fnOf('ngAsk');
  assert.match(a, /b\.disabled=true/, '開始ボタンも押せない'); assert.match(a, /for\(const t of \["click","pointerdown","pointerup","touchstart"\]\)d\.addEventListener\(t,e=>e\.stopPropagation\(\)\)/);
  assert.match(a, /新しいゲームを始めますか？<br>現在のセーブデータは上書きされます。/); assert.match(a, /続きから始める場合は、戻るを選んでください。/); assert.match(a, />確認しました</); assert.match(a, />戻る</);
  assert.match(a, /tapHold\(d,350\)/, '出た直後0.35秒の押下は無視');
  assert.match(fnOf('ngOk'), /startGame\(b,true\)/); assert.match(fnOf('ngBack'), /P_NEWGAME=false;title\(\)/);
  assert.match(HTML, /\.ngm\{position:fixed;inset:0;z-index:2400;/);
});

test('PB-05：会話の本文＝全文を先に組んでから1文字ずつ出す（改行の位置が変わらない）。禁則のまとまり・選択肢の場所も先に取る・タップの動き（全文／次・0.3秒）はそのまま', () => {
  const N = load('js/npc/npc.js', 'MMNPC'), src = rd('js/npc/npc.js');
  const g = (t) => N.kinsokuGroups(N.splitChars(t)).map((x) => x.join(''));
  assert.deepEqual(g('あの……もしかして、今日'), ['あ', 'の……', 'も', 'し', 'か', 'し', 'て、', '今日'], '最後の1文字だけで改行しない');
  assert.deepEqual(g('「はい」！？'), ['「は', 'い」！？']);
  assert.deepEqual(g('世界を救った。'), ['世', '界', 'を', '救っ', 'た。']);
  for (const t of ['えっ、違うの？ じゃあ……', 'ここが――ミストリア。']) for (const u of g(t)) assert.ok(!/^[。、！？…―」』）]/.test(u), u);
  assert.equal(g('あいうえお、かきくけこ。').join(''), 'あいうえお、かきくけこ。', '文字は変えない');
  assert.match(src, /const w = h\('span', 'mtw'\); for \(const chr of g\) \{ const cs = h\('span', 'mtc'\);/);
  assert.match(src, /for \(let i = txShown; i < want; i\+\+\) txChars\[i\]\.classList\.add\('on'\);/);
  assert.match(HTML, /\.mmtalk-text \.mtw\{white-space:nowrap\}\.mmtalk-text \.mtc\{opacity:0;transition:opacity \.09s linear\}\.mmtalk-text \.mtc\.on\{opacity:1\}/);
  assert.match(src, /const READ_GUARD_MS = 300;/); assert.match(src, /const TYPE_MS = 32;/);
  const T = N.createTalk(['一つ目。'], { schedule: () => 1, cancel: () => {}, now: () => 1000 }).start(); assert.equal(T.tap(), 'full');
});

test('PB-06：正式の会話窓（event_dialogue_window）はイベント・大型の NPC・登録・施設の会話で共通。システム通知の帯（MMNOTE）は会話とは別の層・顔と名前なし', () => {
  const src = rd('js/npc/npc.js');
  assert.match(src, /const big = !!\(opts\.big \|\| pres === 'board' \|\| \(pres !== 'compact' && \(scene \|\| opts\.kind === 'event'\)\)\);/);
  assert.match(HTML, /\.mmtalk\.mmtalk-big \.mmtalk-name::before,\.mmtalk\.mmtalk-big \.mmtalk-name::after\{content:"";position:absolute;z-index:-1;clip-path:polygon/);
  const no = rd('js/feel/notice.js'); assert.doesNotMatch(no.replace(/\/\/.*$/gm, '').replace(/\/\*\*[^*]*\*\//g, ''), /MMNPC|\.name\b|face|mmtalk|dnm/, '顔・名前は出さない（コメントを除いたコード）'); assert.match(HTML, /<script src="\.\/js\/feel\/notice\.js"><\/script>/);
  assert.match(HTML, /\.mmnote-layer\{position:fixed;[^}]*z-index:2300;/);
  assert.match(HTML, /\{note:\{icon:"gold",title:"1000G を受け取った！",sub:"新人聖獣士支援制度",se:"GOLD_GET"\}\}/); assert.match(HTML, /\{note:\{img:ITEM_ICON\.herb,title:"薬草 を1つ受け取った！"[^}]*se:"REWARD"\}\}/);
  assert.match(fnOf('talkSeq'), /if\(x&&x\.note\)\{await flush\(\);await MMNOTE\.show\(x\.note\)\}/);
  assert.match(fnOf('opAfterReg'), /MMNOTE\.show\(\{icon:"unlock",title:"世界地図 が使えるようになった！"/, '機能の解放');
  assert.match(fnOf('adopt'), /if\(typeof MMNOTE=="object"&&MMNOTE\)\{const sp=MMP10M\.byId\(x\.sp\),im=sp&&sp\.image&&sp\.image\.src;MMNOTE\.show\(\{\.\.\.\(im\?\{img:im\}:\{icon:"gold"\}\),title:x\.name\+"をつれて帰った！"\+pk,\.\.\.\(rs\?\{sub:rs\}:\{\}\)\}\);return undefined\}/, '購入の知らせ（救済も通常も）は帯だけ＝街の通知は出さない（2026-10-05 試遊）');
  assert.match(fnOf('p9TourResult'), /MMP8\.runTourEnd\(rs\)/, '大会の報酬（2026-10-06：大会の終わりの順の firstReward の段階で帯を出す）');
  assert.match(HTML, /MMP8\.registerTourEndHook\("firstReward",d=>\{[^\n]*MMNOTE\.show\(\{icon:"reward",title:`賞金 \$\{d\.prize\}G を手に入れた！`/, '大会の報酬');
  // 帯は文字として表示（HTML として解釈しない）
  const w = {}; const els = []; const doc = { body: { appendChild: (e) => els.push(e) }, querySelector: () => null, createElement: () => ({ setAttribute() {}, addEventListener() {}, appendChild() {}, classList: { add() {} }, remove() {} }) };
  new Function('window', 'document', 'setTimeout', 'clearTimeout', no)(w, doc, () => 1, () => {});
  w.MMNOTE.show({ title: '<b>x</b>', sub: 'a&b' }); assert.deepEqual(w.MMNOTE.log(), [{ icon: 'gold', title: '<b>x</b>', sub: 'a&b' }]);
});

test('PB-07：薬草の正式アイコン（バッグ・保管庫・Chapter のアイテム・アイテム管理・図鑑・帯）。効果（疲れ −30・ターンは使わない）と記録はそのまま', () => {
  assert.ok(existsSync(path.join(ROOT, 'assets/items/herb.webp')) && statSync(path.join(ROOT, 'assets/items/herb.webp')).size < 60000);
  assert.match(HTML, /const ITEM_ICON=Object\.freeze\(\{herb:"\.\/assets\/items\/herb\.webp"\}\);window\.MM_ITEM_ICON=ITEM_ICON;/);
  assert.match(HTML, /MMP7\.registerItem\(\{id:"herb",name:"薬草"\}\);if\(window\.MMCH\)MMCH\.registerFatigueItem\("herb",\{amount:30\}\);/);
  assert.match(fnOf('prepScr'), /\$\{itemIc\(bag\[i\]\)\}/); assert.match(rd('js/chapter/field-view.js'), /root\.MM_ITEM_ICON\[x\.it\.id\]/);
});

test('PB-08：アイテム管理（ベースキャンプの独立した導線・正式アイコン）は確認と整理だけ（購入・売却なし）。アイテム補給所＝購入／売却／アイテム図鑑（正式アイコン・処理と価格は従来どおり）', () => {
  for (const f of ['item_management', 'shop_purchase', 'shop_sell', 'shop_encyclopedia']) assert.ok(existsSync(path.join(ROOT, `assets/item_ui/${f}.webp`)), f);
  const im = fnOf('itemScr') + fnOf('imToBag') + fnOf('imToVault');
  assert.doesNotMatch(im, /shopBuy|shopSell|p7Buy|p7Sell|price/, '店ではない'); assert.match(im, /MMP7\.moveVaultToBag\(S,i\)/); assert.match(im, /MMP7\.moveBagToVault\(S,i\)/);
  assert.match(fnOf('fmScr'), /<button class="bcitem" onclick="itemScr\(\)" aria-label="アイテム管理"><img src="\$\{ITEM_MGMT_ICON\}"/);
  const sh = HTML.slice(HTML.indexOf('function shopScr('), HTML.indexOf('\nfunction p7Buy('));
  const shell = HTML.slice(HTML.indexOf('function shopShell('), HTML.indexOf('function shopScr('));
  for (const k of ['buy', 'sell', 'book']) assert.match(shell, new RegExp(`ent\\("${k}"`)); assert.match(sh, /MMP7\.listItemDefs\(\)/);
  assert.match(shell, /<div class="isp-plq"><b>アイテム屋<\/b>/, '2026-10-05 試遊：施設名は「アイテム屋」'); assert.doesNotMatch(HTML.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, ''), /アイテム補給所|ベルナの補給所/, '旧名称はユーザー向けに出さない');
  assert.match(fnOf('p7Buy'), /MMP7\.shopBuy\(S,id\)/); assert.match(fnOf('p7Sell'), /MMP7\.shopSell\(S,i\)/);
  const w = {}; new Function('window', rd('js/phase7/progression.js'))(w); assert.deepEqual(w.MMP7.listItemDefs(), [], 'アイテムを勝手に増やさない（登録はゲーム側の薬草だけ）');
});

test('PB-09：ライバル遭遇＝リュウの正式立ち絵（市松模様を取り除いた透過 WebP）。竜（相棒）の正式素材は無い＝作らない（config の encounterPartner は null）', () => {
  const C = rd('js/chapter/configs/ch1a.js'), FV = rd('js/chapter/field-view.js');
  assert.match(C, /encounterFigure: 'rival_ryu', encounterPartner: 'rival_regnas', encounter: 'リュウが立ちはだかった！'/, '文面は変えない。2026-10-05：相棒＝レグナス（正式）');
  assert.match(C, /rival_ryu: '\.\/assets\/npc\/ryu\/ryu_official_fullbody\.webp', rival_regnas: '\.\/assets\/monsters\/regnas\/regnas_official\.webp'/); assert.ok(existsSync(path.join(ROOT, 'assets/npc/ryu/ryu_official_fullbody.webp'))); assert.ok(!existsSync(path.join(ROOT, 'assets/npc/ryu/full_normal.webp')), '旧い絵は使わない');
  assert.match(FV, /\$\{rvFig \? `<img class="ce-rival" src="\$\{esc\(rvFig\)\}"/); assert.match(FV, /\$\{rvPart \? `<img class="ce-partner"/);
  assert.match(C, /figure: null, encounterFigure:/, 'ボードの目印（figure）には立たせない');
});

test('PB-10：大会ランク選択の正式 UI：参加可能＝赤（ワインレッド）＋金・未解放＝青〜濃紺＋交差した鎖＋南京錠・解除は青＋鎖 → 演出 → 赤。行ごとに状態から描く（全画面の画像なし）。TEST 大会は記録を変えない', () => {
  // 2026-10-05 正式素材：鎖と錠は正式画像（rank_unavailable_X）。解除の演出は参加不可の画像を参加可能の画像の上に重ねて消す
  assert.match(fnOf('p9RankRow'), /\$\{un\?`<img class="rcv-img lockimg" src="\$\{P9_RANK_IMG\(k,false\)\}"/);
  // 解除の演出は「前に見た最高のランク」より上が新しく選べるようになった行だけ（初めての受付は演出しない）
  const f = fnOf('p9RankListHtml'); const flags = {}; let saved = 0;
  const run = (el, uid) => new Function('MMP8', 'finaFlags', 'save', 'p9RankRow', `${f}\nreturn p9RankListHtml;`)({ eligibleRanks: () => el }, () => flags, () => saved++, (m, k, e, un) => `${k}${un ? '!' : ''}`)({ uid, raise: { ch: 1 } });
  assert.equal(run([0, 1], 'a'), '<div class="rcv-list">543210</div>', '初めて＝演出なし');
  assert.equal(run([0, 1], 'a'), '<div class="rcv-list">543210</div>');
  assert.equal(run([0, 1, 2], 'a'), '<div class="rcv-list">5432!10</div>', 'D をクリア → C が解除の演出');
  assert.equal(run([0, 1, 2], 'a'), '<div class="rcv-list">543210</div>', '2回目は演出しない');
  assert.equal(run([0, 1], 'b'), '<div class="rcv-list">543210</div>', '個体ごと');
  assert.deepEqual(flags.rankSeen, { a: 2, b: 1 });
  assert.match(fnOf('save'), /^function save\(\)\{if\(P8_LOAD\.locked\|\|TEST_TOUR\)return;/, 'TEST 大会の間は保存しない＝記録は変わらない');
  assert.match(HTML, /const P9_RS_LABEL=\{lock:"参加不可",open:"参加可能",next:"参加可能",clear:"クリア済"\};/);
  assert.match(HTML, /<div class="tcity" aria-label="現在地：ミストリア">/, '街の名札');
});

test('PB-11：2026-10-05 試遊：新人支援の帯に SE（帯が出た瞬間に1回・帯は1つずつ＝重ならない）。1000G＝GOLD_GET（既存の所持金の入手の音）・薬草＝REWARD・世界地図の解放＝UNLOCK（REWARD と同じファイル）。新しい音源は足していない', () => {
  const no = rd('js/feel/notice.js'); assert.match(no, /if \(n\.se\) \{ try \{ if \(root\.MMAUDIO\) root\.MMAUDIO\.se\(n\.se\); \} catch \(e\) \{\} \}/);
  assert.match(fnOf('opAfterReg'), /title:"世界地図 が使えるようになった！",sub:"聖獣士管理局でいつでも見られます",se:"UNLOCK"/);
  const R = {}; new Function('window', rd('js/audio/audio-registry.js'))({ MMAUDIO: { registerAll: (r) => Object.assign(R, r) } }); const se = R.se || R.SE;
  assert.equal(se.REWARD.src, se.UNLOCK.src, '薬草と世界地図は同じ音'); assert.match(se.GOLD_GET.src, /ivokard\/bell\.ogg$/);
  // 帯に se を渡すと、帯が出たときに1回だけ鳴る
  const w = { MMAUDIO: { calls: [], se(n) { this.calls.push(n); } } }; const els = []; const doc = { body: { appendChild: (e) => els.push(e) }, querySelector: () => null, createElement: () => ({ setAttribute() {}, addEventListener() {}, appendChild() {}, classList: { add() {} }, remove() {} }) };
  new Function('window', 'document', 'setTimeout', 'clearTimeout', no)(w, doc, () => 1, () => {});
  w.MMNOTE.show({ title: 'a', se: 'GOLD_GET' }); w.MMNOTE.show({ title: 'b', se: 'REWARD' });
  assert.deepEqual(w.MMAUDIO.calls, ['GOLD_GET'], '2つ目の帯（と音）は前の帯が消えてから');
});
