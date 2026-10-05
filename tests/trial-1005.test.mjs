// =========================================================
// 実機試遊の修正（2026-10-05）＋リュウ／レグナスの正式素材
//  TR-01〜08（画面は tests/qa-e2e-trial-1005.test.mjs）。Chapter の BGM は tests/audio-manager.test.mjs の AUDIO-28、新人支援の SE は tests/phase-b-1005.test.mjs の PB-11
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const HTML = rd('index.html');
const fnOf = (name) => { const i = HTML.indexOf(`function ${name}(`); assert.ok(i > 0, name); return HTML.slice(i, HTML.indexOf('\nfunction ', i + 10)); };
const sha = (p) => createHash('sha256').update(readFileSync(path.join(ROOT, p))).digest('hex');
const webpSize = (p) => { const b = readFileSync(path.join(ROOT, p)); const t = b.toString('ascii', 12, 16); if (t === 'VP8X') return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)]; if (t === 'VP8L') { const v = b.readUInt32LE(21); return [1 + (v & 0x3fff), 1 + ((v >> 14) & 0x3fff)]; } return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff]; };

test('TR-01：名前を決めたあと名前の画面を再表示しない＝確認の前に管理局の背景だけ（opShell）にし、確認と登録完了は1つの会話。「書き直す」のときだけ名前の画面へ', () => {
  const c = fnOf('opConfirm');
  assert.match(c, /^function opConfirm\(v\)\{const n=MMP11P\.sanitize\(v\);opShell\(\);/, '確認の会話を出す前に名前の画面を片付ける');
  assert.match(c, /branches:\{ok:OPEN_TALK\.done\(n\),fix:OPEN_TALK\.fix\}/, '確認 → 登録完了は同じ会話（切れ目で下の画面が見えない）');
  assert.match(c, /MMP11P\.confirmName\(S,n\)/); assert.match(c, /if\(c==="ok"\)\{register\(\);return opAfterReg\(\)\}/);
  assert.match(c, /if\(S\.playerNamePending\)\{p11NameScr\(\);const e=\$\("#p11nm"\);if\(e\)e\.value=v\}/, '書き直す＝入力した名前のまま名前の画面へ');
  assert.match(fnOf('opAfterReg'), /if\(!\$\("\.opbu"\)\)opShell\(\);/);
});

test('TR-02：聖獣士管理局の通常の画面＝どのコマンドも選ばれていない・パネルは開いていない・セルジュは高さで決まる（巨大にしない）', () => {
  const b = fnOf('bureauScr');
  assert.match(b, /const all=tab=="ach",cardOn=tab=="card",idle=!all&&!cardOn;/);
  assert.match(b, /<div class="bubody">\$\{all\?ach:cardOn\?card\+ach:""\}<\/div>/, '通常はパネルなし');
  assert.match(b, /<button class="bub\$\{cardOn\?" on":""\}" onclick="bureauScr\('card'\)">聖獣士証<\/button>/, '押したコマンドだけ選ばれた見た目');
  assert.match(HTML, /\.bu \.bunpc\{position:absolute;right:0;bottom:70px;--nsh:min\(34dvh,280px\);height:var\(--nsh\);/);
  assert.match(fnOf('opAfterReg'), /f\.op="done";f\.finaIntro=1;save\(\);lobby\(/, '序盤の導線は街で終わる（管理局の画面に会話の状態を残さない）');
});

test('TR-03：世界地図：リベルナを光らせるのは序盤の案内（open）だけ。通常の地図（viewer）は印と名前だけ', () => {
  const W = rd('js/opening/worldmap.js'), v = W.slice(W.indexOf('function viewer('));
  assert.match(v, /querySelectorAll\('\.wm-pin\[data-spot="liberna"\]'\)\.forEach\(\(e\) => e\.classList\.add\('still'\)\)/);
  assert.match(HTML, /\.wmap\.view \.wm-pin\.still \.wm-ring\{display:none;animation:none\}/);
  assert.doesNotMatch(W.slice(W.indexOf('function open('), W.indexOf('function viewer(')), /still/, '序盤の案内は従来どおり光る');
});

test('TR-04：アイテム屋＝施設の画面（名札「アイテム屋」・ベルナ・購入／売却／アイテム図鑑の正式アイコン）。旧名称「アイテム補給所」は出さない。処理・商品・価格は従来どおり', () => {
  const sh = fnOf('shopShell'), s = fnOf('shopScr');
  assert.match(sh, /<div class="isp-plq"><b>アイテム屋<\/b>/); assert.match(sh, /\$\{shopLook\(ex\)\.bg\}/);
  for (const k of ['buy', 'sell', 'book']) assert.match(sh, new RegExp(`ent\\("${k}"`));
  assert.match(HTML, /SHOP_ICON=Object\.freeze\(\{buy:"\.\/assets\/item_ui\/shop_purchase\.webp",sell:"\.\/assets\/item_ui\/shop_sell\.webp",book:"\.\/assets\/item_ui\/shop_encyclopedia\.webp"\}\)/);
  assert.match(s, /MMP7\.getShopCatalog\(\)/); assert.match(fnOf('p7Buy'), /MMP7\.shopBuy\(S,id\)/); assert.match(fnOf('p7Sell'), /MMP7\.shopSell\(S,i\)/);
  const code = HTML.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, '');
  assert.doesNotMatch(code, /アイテム補給所|ベルナの補給所/); assert.doesNotMatch(rd('js/npc/npc.js'), /補給所/);
  assert.match(HTML, /\.isp-plq b\{font:800 19px\/1\.3 "Shippori Mincho"/, '施設名は Shippori Mincho');
  assert.match(fnOf('itemScr'), /アイテム管理/, 'ベースキャンプの「アイテム管理」は別の画面のまま');
});

test('TR-05：ベースキャンプ：「出発する」は下のバーから 72px（低い画面は 50px）。モンスターの下に名前・種類の帯を出さない', () => {
  assert.match(HTML, /\.fm\.fm2\.bc \.bcgo\{position:absolute;left:50%;top:auto;bottom:calc\(var\(--bcbar\) \+ 72px \+ env\(safe-area-inset-bottom,0px\)\);/);
  assert.match(HTML, /#app \.fm\.bc \.bcgo,\.fm\.fm2\.bc \.bcgo\{bottom:calc\(var\(--bcbar\) \+ 50px \+ env\(safe-area-inset-bottom,0px\)\)\}/);
  assert.match(fnOf('fmScr'), /\*\/setTimeout\(\(\)=>\{if\(S\.m!==m\|\|!document\.querySelector\("\.fm"\)\)return;if\(st=="none"\)npcFirst\("farm"\);else if\(st=="farm"\)farmReturn\(m\)/, '初回訪問・帰還イベントの呼び出しがコメントに入っていない（次の Chapter の曲の先読みの行）');
  assert.match(fnOf('fmScr'), /<div class="bcmonw"><div class="fmmon mon">\$\{msv\(m\)\}<\/div><\/div>/); assert.doesNotMatch(fnOf('fmScr'), /bcname|sp\.kind/);
});

test('TR-06：Chapter へ入るときの白っぽい一瞬：フィールドの器の後ろ（#app・ページ）を器と同じ濃紺に。Chapter 開始の演出（MMCHI）はそのまま', () => {
  assert.match(HTML, /#app:has\(>\.chfw\)\{overflow:hidden;background:#0b1636\}/);
  assert.match(HTML, /html:has\(#app>\.chfw\),html:has\(#app>\.chfw\) body\{background:#0b1636\}/);
  assert.match(HTML, /@keyframes chfwin\{from\{opacity:0\}\}/);
});

test('TR-07：Chapter の HUD：特訓チケットは所持金の右（既存の S.trainTix・1行に収める）。新しいセーブ項目は作らない', () => {
  const FV = rd('js/chapter/field-view.js');
  assert.match(FV, /tix = \(gS\(\) && gS\(\)\.trainTix\) \| 0/);
  assert.match(FV, /<div class="chh-gold chip" id="chgold">\$\{COIN_SVG\}<b>[^<]*<\/b><\/div>\s*<div class="chh-tix chip" id="chtix" title="特訓チケット"><span>特訓チケット<\/span><b>×\$\{tix\}<\/b><\/div>/, '所持金のすぐ右');
  assert.match(HTML, /\.chh-chips\{flex-wrap:nowrap;min-width:0\}/);
});

test('TR-08：リュウ（正式の全身）＋レグナス（正式の相棒）。元の JPEG は ZIP の sha256 と一致・透過 WebP は加工は背景除去と縮小だけ。レグナスはプレイヤー用（市場・図鑑・合体・初期選択・牧場）に出さない', () => {
  assert.equal(sha('assets/npc/ryu/original/ryu_official_fullbody_2026-10-05.jpg'), 'b9bca1841042ace8f4519fb8e6ec8c415c80a3c333a7ea869a335306100020f0');
  assert.equal(sha('assets/monsters/regnas/original/regnas_official_latest_2026-10-05.jpg'), '470fbcaf0c0c9e52336cd8c11dd5c26f7f98336fbf6dbecd4b16e7d395286371');
  assert.deepEqual(webpSize('assets/npc/ryu/ryu_official_fullbody.webp'), [406, 960]); assert.deepEqual(webpSize('assets/monsters/regnas/regnas_official.webp'), [663, 900]);
  assert.ok(!existsSync(path.join(ROOT, 'assets/npc/ryu/full_normal.webp')), '旧いリュウの絵は使わない');
  const w = {}; new Function('window', rd('js/phase10/monsters.js'))(w); const M = w.MMP10M, r = M.rivalMonster('regnas');
  assert.deepEqual([r.name, r.en, r.kind, r.personality, r.speed, r.style], ['レグナス', 'REGNAS', '竜種', '誇り高い・負けず嫌い', 8, '俊敏な地上竜＋回避反撃型']);
  assert.deepEqual({ ...r.base }, { li: 90, po: 115, in: 75, hi: 105, ev: 115, de: 100 });
  assert.equal(r.uniqueSkill.name, '蒼銀の反撃'); assert.equal(r.uniqueSkill.desc, '相手の攻撃を回避すると、次に与えるダメージが一度だけ1.20倍。効果は重複しない。'); assert.equal(r.uniqueSkill.implemented, true, '2026-10-05：ライバル戦だけで発動（js/battle/rival-partner.js）');
  assert.equal(r.moves.list.length, 10, '2026-10-05：正式技10個'); assert.equal(r.playerAvailable, false);
  assert.ok(!M.SPECIES.some((x) => x.key === 'regnas'), 'プレイヤー用の種族の表には入れない'); assert.equal(M.SPECIES.length, 4);
  assert.ok(!JSON.stringify(M.MARKET_CATALOG).includes('regnas'), '市場に出さない');
  assert.doesNotMatch(HTML.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, ''), /regnas|レグナス/, '図鑑・合体・初期選択・牧場（index.html）には出さない');
  assert.doesNotMatch(rd('js/phase7/progression.js'), /regnas/, '合体の規則に入れない');
  const C = rd('js/chapter/configs/ch1a.js'); assert.match(C, /encounterFigure: 'rival_ryu', encounterPartner: 'rival_regnas'/);
  const rv = {}; new Function('window', rd('js/phase8/rival.js'))(rv); assert.equal(rv.MMRIVAL.CONFIG.partner, 'regnas');
  assert.match(HTML, /\.chf-enc2\.t-rival \.ce-stage:has\(\.ce-partner\) \.ce-rival\{left:31%;/);
});

test('TR-09：購入の知らせ「〇〇をつれて帰った！」はシステム通知の帯（MMNOTE＝自動で消える・タップで消える）だけ。街の案内欄（lobby の msg）には出さない・セーブに入れない', () => {
  const a = fnOf('adopt');
  assert.match(a, /lobby\(\(\(\)=>\{[\s\S]*?if\(typeof MMNOTE=="object"&&MMNOTE\)\{[^}]*MMNOTE\.show\(\{\.\.\.\(im\?\{img:im\}:\{icon:"gold"\}\),title:x\.name\+"をつれて帰った！"\+pk,\.\.\.\(rs\?\{sub:rs\}:\{\}\)\}\);return undefined\}/, '帯があれば街の通知は undefined（出さない）');
  assert.doesNotMatch(a, /S\.(msg|note|lastMsg)\s*=/, 'セーブ（S）に一時的な知らせを入れない');
  const no = rd('js/feel/notice.js'); assert.match(no, /const MS = 2600;/); assert.match(no, /el\.addEventListener\('click', \(e\) => \{ e\.stopPropagation\(\); if \(Date\.now\(\) - shownAt > 350\) close\(\); \}\);/);
  assert.doesNotMatch(no, /localStorage|save\(/, '帯は保存しない（再読み込みで出ない）');
});

test('TR-10：Lv の表記をユーザー向けに出さない。バトル開始の演出（intro）は Lv を消した。fight()（Phase 6）の HUD の Lv は fight() を変えずに CSS で隠す（内部の lvv は fight() の表示用だけ）', () => {
  const intro = HTML.slice(HTML.indexOf('async function intro(pl){'), HTML.indexOf('\nasync function fight('));
  assert.doesNotMatch(intro.replace(/\/\/[^\n]*/g, ''), /Lv|lvv/);
  assert.match(HTML, /\n#bt \.hn1>span\{display:none\}/);
  const fightSrc = HTML.slice(HTML.indexOf('async function fight('), HTML.indexOf('\n$("#snd").textContent'));
  assert.match(fightSrc, /<span>Lv\.\$\{lvv\(pl\[s\]\)\}<\/span>/, 'fight() は変えていない（Phase 6）＝表示だけ CSS で消す');
  // fight() と intro の外のコード（画像データの長い行・コメントを除く）に、ユーザー向けの Lv／LEVEL／レベルの表記は無い
  let code = ''; const [fa, fb] = [HTML.indexOf('async function fight('), HTML.indexOf('\n$("#snd").textContent')];
  for (let i = 0; i < HTML.length;) { const n = HTML.indexOf('\n', i), e = n < 0 ? HTML.length : n + 1; if (!(i >= fa && i < fb) && e - i < 50000) code += HTML.slice(i, e); i = e; }
  code = code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:"'`])\/\/[^\n]*/g, '$1');
  const hits = [...code.matchAll(/.{0,30}(?:\bLv\b|Lv\.|LEVEL|レベル).{0,30}/g)].map((m) => m[0]).filter((x) => !/^const lvv=|MMFEEL/.test(x));
  assert.deepEqual(hits.filter((x) => !/const lvv=x=>/.test(x)), []);
});
