// 2026-10-18 REV3 P0-F：旧ボードの素材・コードのうち、どこからも参照されていないファイルを探す（削除の候補の根拠）。
//  参照の検索先＝index.html・js/**・tests/**・tools/**・prototype/**・docs/** の .js/.mjs/.html/.json/.py/.css（README.md・*.txt は数えない）。
//  名前（ファイル名）・ディレクトリ名＋番号の組み立て（例：ch1_bg_${n}）も拾えるよう、ファイル名の語幹と「語幹から数字を除いた形」で検索する。
//  node tools/rev3_1018/unref.mjs <対象のディレクトリ…>
import fs from 'node:fs'; import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const SRC_DIRS = ['index.html', 'js', 'tests', 'tools', 'prototype', 'docs', 'credits.html'];
const EXT = /\.(m?js|html|json|py|css)$/;
const texts = [];
const walk = (p) => { const f = path.join(ROOT, p); if (!fs.existsSync(f)) return; const st = fs.statSync(f); if (st.isDirectory()) { for (const n of fs.readdirSync(f)) walk(path.join(p, n)); } else if (EXT.test(p) && !/rev3_1018\/unref/.test(p)) texts.push([p, fs.readFileSync(f, 'utf8')]); };
SRC_DIRS.forEach(walk);
const out = [];
const targets = process.argv.slice(2);
const files = []; const walkT = (p) => { const f = path.join(ROOT, p); const st = fs.statSync(f); if (st.isDirectory()) { for (const n of fs.readdirSync(f)) walkT(path.join(p, n)); } else files.push(p); };
targets.forEach(walkT);
for (const p of files) {
  if (/README|\.md$|\.txt$/.test(p)) continue;
  const base = path.basename(p), stem = base.replace(/\.[^.]+$/, ''), loose = stem.replace(/\d+$/, '');
  const hits = texts.filter(([tp, t]) => tp !== p && (t.includes(base) || t.includes(stem + '.') || t.includes("'" + stem + "'") || t.includes('"' + stem + '"'))).map(([tp]) => tp);
  const looseHits = hits.length ? [] : texts.filter(([tp, t]) => tp !== p && loose.length > 4 && t.includes(loose)).map(([tp]) => tp);
  out.push([p, hits.length, looseHits.length, [...hits, ...looseHits].slice(0, 4).join(' ')]);
}
console.log(out.map((r) => r.join('\t')).join('\n'));
