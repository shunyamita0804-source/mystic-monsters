// =========================================================
// 2026-10-07 正式UI回収（前回未送付の正式UI素材 ZIP 7つ）の最小テスト
//  UR-01：置いた素材はすべて index.html から使う・RGBA の PNG（透過）・表示の約2倍まで
//  UR-02：CSS は色を変えない・F ランクを出さない・プロフィールは正式の4行・処理は従来のボタンのまま
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HTML = readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const DIR = 'assets/ui/recovery_1006';
const walk = (d) => readdirSync(path.join(ROOT, d)).flatMap((f) => statSync(path.join(ROOT, d, f)).isDirectory() ? walk(`${d}/${f}`) : [`${d}/${f}`]);

test('UR-01：正式UI回収の素材（使う物だけ・RGBA の PNG・幅は 800px 以下）', () => {
  const files = walk(DIR).filter((f) => f.endsWith('.png'));
  assert.ok(files.length >= 40, `${files.length} 枚`);
  for (const f of files) {
    const b = readFileSync(path.join(ROOT, f));
    assert.equal(b.toString('ascii', 1, 4), 'PNG', f); assert.equal(b[25], 6, `${f} は RGBA`);
    assert.ok(b.readUInt32BE(16) <= 800, `${f} の幅`);
    const rel = f.slice(DIR.length + 1);
    assert.ok(HTML.includes(`recovery_1006/${rel}`) || (rel.startsWith('tournament/rank_') && HTML.includes('recovery_1006/tournament/rank_${RN[k]}.png')), `${rel} は index.html から使う`);
  }
});

test('UR-02：色を変えない・F ランクなし・プロフィールは4行・押す処理は従来のボタン', () => {
  const css = HTML.slice(HTML.indexOf('/* ===== 2026-10-07 正式UI回収'), HTML.indexOf('</style></head>'));
  assert.doesNotMatch(css, /filter|hue-rotate|saturate|grayscale|sepia|invert/);
  assert.doesNotMatch(css, /rank_F|ランクF/);
  assert.match(HTML, /const PROFILE_ROWS=\[\["所持金",[^\n]*\["大会の勝利",\(\)=>`\$\{S\.wins\|\|0\}<small>勝<\/small>`\]\];/, '正式のプロフィールの行は4つ');
  assert.match(HTML, /<button class="p11go" onclick="p11NameGo\(\)">登録する<\/button>/, '登録の処理は従来どおり');
  assert.match(HTML, /<button class="p10back" onclick="lobby\(\)" aria-label="街にもどる">/, '市場の戻るは従来のボタン（絵の左の四角の上）');
  assert.match(HTML, /const TOWN_NAMEPLATE="\.\/assets\/ui\/recovery_1006\/town\/nameplate_mistria\.png";/);
});
