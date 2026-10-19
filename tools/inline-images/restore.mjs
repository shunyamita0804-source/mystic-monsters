// assets/inline/manifest.json のパスを data URI に戻した index.html を標準出力へ（外部化の前と1バイトも違わないことの確認用）。
//   node tools/inline-images/restore.mjs > /tmp/index.restored.html
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const man = JSON.parse(readFileSync(path.join(ROOT, 'assets/inline/manifest.json'), 'utf8'));
let html = readFileSync(path.join(ROOT, 'index.html'), 'utf8');
for (const e of man) {
  const uri = `data:${e.mime};base64,` + readFileSync(path.join(ROOT, e.file)).toString('base64');
  const n = html.split(e.file).length - 1;
  if (n < 1) throw new Error('index.html に無い：' + e.file);
  html = html.split(e.file).join(uri);
}
process.stdout.write(html);
