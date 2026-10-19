// index.html の base64 埋め込み画像（data:image/…;base64,…）を assets/inline/ のファイルへ出し、
// index.html の同じ場所を相対パスの文字列に置き換える（バイト単位で同じ画像・コードは変えない）。
//   node tools/inline-images/extract.mjs            … 書き出す（index.html と assets/inline/ を更新）
//   node tools/inline-images/extract.mjs --check    … 書き出さずに件数だけ表示
// 置き換えの対応は assets/inline/manifest.json（パス・元の MIME・sha256・バイト数・使う場所）。
// 元に戻す確認：tools/inline-images/restore.mjs（パスを data URI へ戻すと元の index.html と1バイトも違わない）。
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT_DIR = 'assets/inline';
const CHECK = process.argv.includes('--check');
const html = readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const lines = html.split('\n');
const DATA_RE = /data:image\/([a-z+]+);base64,([A-Za-z0-9+/=]+)/g;

const lineOf = (prefix) => {
  const i = lines.findIndex((l) => l.startsWith(prefix));
  if (i < 0) throw new Error('行がありません：' + prefix);
  return lines[i];
};
const evalLine = (src, names) => new Function(src.replace(/^(let BPL=null;)?const /, 'var ') + `;return {${names}};`)();

// 中身の形式（拡張子は中身で決める）
function extOf(buf) {
  if (buf[0] === 0x89 && buf[1] === 0x50) return 'png';
  if (buf[0] === 0xff && buf[1] === 0xd8) return 'jpg';
  if (buf.slice(0, 4).toString() === 'RIFF' && buf.slice(8, 12).toString() === 'WEBP') return 'webp';
  throw new Error('知らない画像形式');
}

// 使う場所 → ファイル名（用途がわかる名前）
const named = [];   // [dataUri, base名（拡張子なし）, 使う場所の説明]
const pad = (n) => String(n).padStart(2, '0');
const RANK = ['E', 'D', 'C', 'B', 'A', 'S'];
const DOJO = ['po', 'in', 'hi', 'ev', 'de'];
const SKN = evalLine(lineOf('const SK='), 'SK').SK;

{ const { SKART } = evalLine(lineOf('const SKART='), 'SKART');
  SKART.forEach((u, k) => named.push([u, `skill_icon/skart_${pad(k)}`, `SKART[${k}]＝技の小さな絵（${SKN[k] ? SKN[k][0] : '?'}）`])); }
{ const { SFXL } = evalLine(lineOf('const SFXL='), 'SFXL');
  SFXL.forEach((u, k) => named.push([u, `skill_fx/sfxl_${pad(k)}`, `SFXL[${k}]＝技の効果の層（${SKN[k] ? SKN[k][0] : '?'}）`])); }
{ const { AS } = evalLine(lineOf('const AS='), 'AS');
  const card = { mkt: 'lab_card_market', soL: 'lab_card_soramo_left', soR: 'lab_card_soramo_right', gaL: 'lab_card_gauru_left', gaR: 'lab_card_gauru_right' };
  for (const [k, n] of Object.entries(card)) named.push([AS[k], `lab_card/${n}`, `AS.${k}＝研究所の図鑑の旧カード`]);
  for (const [sp, acts] of Object.entries(AS.spr)) for (const [act, fr] of Object.entries(acts)) fr.forEach((q, j) =>
    named.push([q[0], `sprite/${sp === 'so' ? 'soramo' : 'gauru'}_${act}_${j}`, `AS.spr.${sp}.${act}[${j}]＝旧 2D のポーズ（SPX）`])); }
{ const { SFR } = evalLine(lineOf('let BPL=null;const SFR='), 'SFR');
  for (const [k, v] of Object.entries(SFR)) v.f.forEach((fr, j) =>
    named.push([fr.u, `skill_frames/sfr_${pad(+k)}_${j}`, `SFR["${k}"].f[${j}]＝技の4コマ（${SKN[k] ? SKN[k][0] : '?'}）`])); }
{ const { NPI } = evalLine(lineOf('const NPI='), 'NPI');
  named.push([NPI.m, 'npc_old/npi_m_rina', 'NPI.m＝旧仕様の市場 NPC「リナ」（どこからも表示しない互換データ）']);
  named.push([NPI.f, 'npc_old/npi_f_dan_ranch', 'NPI.f＝旧仕様の牧場 NPC「ダン」（どこからも表示しない互換データ）']); }
{ const u = lineOf('const STOPART=').match(DATA_RE)[0];
  named.push([u, 'battle/stop_button', 'STOPART＝バトルの STOP ボタンの絵']); }
{ const { BTB } = evalLine(lineOf('const BTB='), 'BTB');
  BTB.forEach((b, i) => named.push([b[0], `battle_bg/btb_${pad(i)}_${i < 6 ? 'rank_' + RANK[i] : 'dojo_' + DOJO[i - 6]}`, `BTB[${i}]＝バトルの背景（${i < 6 ? 'ランク' + RANK[i] : '特訓 ' + DOJO[i - 6]}）`])); }

// 同じ中身は同じファイル（最初の名前）
const byData = new Map();
const manifest = [];
for (const [u, base, where] of named) {
  const m = u.match(/^data:image\/([a-z+]+);base64,([A-Za-z0-9+/=]+)$/);
  if (!m) throw new Error('data URI ではない：' + base);
  if (byData.has(u)) { byData.get(u).uses.push(where); continue; }
  const buf = Buffer.from(m[2], 'base64');
  if (buf.toString('base64') !== m[2]) throw new Error('base64 の往復が一致しない：' + base);
  const file = `${OUT_DIR}/${base}.${extOf(buf)}`;
  const e = { file, mime: 'image/' + m[1], bytes: buf.length, sha256: createHash('sha256').update(buf).digest('hex'), uses: [where], buf };
  byData.set(u, e); manifest.push(e);
}

// index.html の置き換え（文字列の中身だけ）
let found = 0;
const out = html.replace(DATA_RE, (all) => {
  const e = byData.get(all);
  if (!e) throw new Error('名前の無い画像が残った：' + all.slice(0, 60));
  found++;
  return e.file;
});
if (found !== named.length) throw new Error(`件数が合わない：本文 ${found}・名前 ${named.length}`);
if (/data:image\/[a-z+]+;base64,/.test(out)) throw new Error('base64 画像が残っている');

console.log(`base64 画像 ${found} 件 → ファイル ${manifest.length} 個（同じ中身 ${found - manifest.length} 件）`);
console.log(`index.html ${html.length} → ${out.length} 文字（${Buffer.byteLength(html)} → ${Buffer.byteLength(out)} バイト）`);
if (CHECK) process.exit(0);
for (const e of manifest) {
  mkdirSync(path.join(ROOT, path.dirname(e.file)), { recursive: true });
  writeFileSync(path.join(ROOT, e.file), e.buf);
}
writeFileSync(path.join(ROOT, OUT_DIR, 'manifest.json'),
  JSON.stringify(manifest.map(({ buf, ...e }) => e), null, 1) + '\n');
writeFileSync(path.join(ROOT, 'index.html'), out);
