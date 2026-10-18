// 2026-10-18 REV3 D1：NPC 有料ボイス 60本＋モンスターの鳴き声 14本の発火台帳（コードから作る＝手で書かない）
//  node tools/rev3_1018/voice_ledger.mjs > docs/rev3_1018/voice_ledger.tsv
import fs from 'node:fs'; import path from 'node:path'; import vm from 'node:vm';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const ctx = { window: {}, console }; ctx.window = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/audio/audio-registry.js'), 'utf8'), ctx);
const R = ctx.MMAUDIO_REGISTRY, V = R.voice || R.VOICE || {};
const cues = fs.readFileSync(path.join(ROOT, 'js/npc/voice-cues.js'), 'utf8');
const files = ['index.html', 'js/npc/npc-events.js', 'js/npc/voice-cues.js', 'js/chapter/world-driver.js', 'js/chapter/world-board.js', 'js/chapter/field-view.js', 'js/chapter/configs/ch1a.js'];
const alias = {}; for (const [k, v] of Object.entries(V)) if (v && v.alias) alias[k] = v.alias;
const canon = (id) => alias[id] || id;
const uses = {};
const add = (id, where) => { const c = canon(id); (uses[c] = uses[c] || new Set()).add(where); };
for (const f of files) {
  const s = fs.readFileSync(path.join(ROOT, f), 'utf8').split('\n');
  s.forEach((ln, i) => {
    if (ln.length > 20000) return;
    for (const m of ln.matchAll(/voice\s*:\s*["']([A-Za-z0-9_]+)["']/g)) add(m[1], `${f}:${i + 1}`);
    for (const m of ln.matchAll(/VO\(\s*'[a-z]+'\s*,\s*'[a-z_]+'\s*,\s*'([a-z0-9_]+)'/g)) add(m[1], `${f}:${i + 1}`);
  });
}
// cue の on:false（意図的に止めた）
const cueOff = new Set([...cues.matchAll(/voice:\s*'([A-Za-z0-9_]+)',\s*on:\s*false/g)].map((m) => canon(m[1])));
const cueOn = new Set([...cues.matchAll(/voice:\s*'([A-Za-z0-9_]+)',\s*on:\s*true/g)].map((m) => canon(m[1])));
const rows = [['id', '話者', '台詞（書き起こし）', '状態', '使う場所（コードの行）']];
for (const [id, v] of Object.entries(V)) {
  if (!v || v.alias || /^cry_/.test(id)) continue;
  const u = uses[id] ? [...uses[id]] : [];
  const noSrc = !v.src || (Array.isArray(v.src) && !v.src.length);
  const st = noSrc ? '音源なし（有料 60本に無い「うむ」＝鳴らない）' : v.enabled === false ? '登録のみ（場面が未実装）' : cueOff.has(id) && !u.some((w) => !/voice-cues/.test(w)) ? '意図的に未使用（cue off）' : (u.length ? '使用中' : '未配置（意味の合う場面なし）');
  rows.push([id, v.npc || '', v.line || '', st, u.filter((w) => !/voice-cues/.test(w) || cueOn.has(id)).join(' ')]);
}
// 鳴き声 14本（R.cry）：出しどころは種類ごとに同じ（種族は連れている子・相手）
const CRY_WHERE = { normal: '市場の仲間入り（index.html gotShow）・合体の誕生（fuse）・牧場でタップ（rnPick）・野生／レアの遭遇＝相手（world-board encounter・field-view）・イベント＝能力マス／出来事／冒険リアクション／宝箱／宝の行き止まり／食事／分かれ道（world-board evCry・field-view evCry）・大会の優勝（p9VictoryShow）。Chapter の開始では鳴かない（REV3 D2）',
  sad: 'バトルの LOSE の曲のあと（index.html resultJingle）' };
for (const [id, v] of Object.entries(R.cry || {})) { const k = /_sad$/.test(id) ? 'sad' : 'normal'; const sp = id.replace(/^cry_/, '').replace(/_(normal|sad)$/, '');
  rows.push([id, 'モンスター（' + sp + '）', k === 'sad' ? '悲しみ' : '正式', ['flurene', 'razuck', 'regnas'].includes(sp) ? (sp === 'regnas' ? '使用中（ライバルの相棒＝相手として鳴くのは野生・レアだけ＝今は鳴る場面なし）' : '登録のみ（未解禁＝QA の試聴だけ）') : '使用中', CRY_WHERE[k]]); }
console.log(rows.map((r) => r.join('\t')).join('\n'));
