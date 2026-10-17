# モンスターの鳴き声 14本（2026-10-17・7体×normal／sad）→ OGG Vorbis q5＋M4A AAC 128k（原本の MP3 は変えない・リポジトリに置かない）
#   python3 -I -B tools/monvoice1017/derive.py <展開した audio/ のフォルダ>
#   再生の gain＝聴感の音量（EBU R128 の I）を normal −15 LUFS・sad −18 LUFS に近づける（sad は +3dB まで＝機械的に大きくしない）・ピーク −1 dBFS まで
#   結果は tools/monvoice1017/derive.json（js/audio/audio-registry.js の CRY に書く gain）と assets/audio/voice/monster_1017/README.md
import sys, os, subprocess, hashlib, json, re
SRC = sys.argv[1]
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'assets', 'audio', 'voice', 'monster_1017')
KEYS = [('soramo', 'solamo', 'ソラモ'), ('gauru', 'gauru', 'ガウル'), ('nobiton', 'nobiton', 'ノビトン'), ('jiol', 'jiol', 'ジオル'), ('regnas', 'regnas', 'レグナス'), ('fulune', 'flurene', 'フルーネ'), ('razuck', 'razuck', 'ラズック')]
def sha(p): return hashlib.sha256(open(p, 'rb').read()).hexdigest()
def loud(p):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', p, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    I = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', r)[-1]); P = float(re.findall(r'Peak:\s+(-?[\d.]+) dBFS', r)[-1]); return I, P
os.makedirs(OUT, exist_ok=True)
rows = []
for fk, key, name in KEYS:
    for kind in ('normal', 'sad'):
        src = os.path.join(SRC, f'voice_{fk}_{kind}.mp3'); assert os.path.isfile(src), src
        I, P = loud(src); target = -15.0 if kind == 'normal' else -18.0
        db = target - I
        if kind == 'sad': db = min(db, 3.0)
        db = min(db, -1.0 - P)
        g = round(10 ** (db / 20), 3)
        base = os.path.join(OUT, f'{key}_{kind}')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-c:a', 'libvorbis', '-q:a', '5', base + '.ogg'], check=True)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', base + '.m4a'], check=True)
        rows.append({'id': f'cry_{key}_{kind}', 'key': key, 'name': name, 'kind': kind, 'orig': os.path.basename(src), 'origSha': sha(src), 'I': I, 'peak': P, 'gain': g,
                     'ogg': sha(base + '.ogg'), 'm4a': sha(base + '.m4a')})
json.dump(rows, open(os.path.join(ROOT, 'tools', 'monvoice1017', 'derive.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
with open(os.path.join(OUT, 'README.md'), 'w', encoding='utf-8') as f:
    f.write('# モンスターの鳴き声 14本（2026-10-17・7体×正式／悲しみ）\n\n')
    f.write('- 原本＝ZIP Mismon_MonsterVoice_7x2_20261017_Claude の audio/（MP3・48kHz・2ch・192kbps・1.032秒）。原本はリポジトリに置かない（sha256 は下の表・受領一覧と 14/14 一致）\n')
    f.write('- 派生＝OGG Vorbis q5（ゲーム）＋M4A AAC 128k（OGG を再生できない iPhone の古い版）。音の中身は変えない（無音の切り詰め・ノーマライズなし）＝音量は再生の gain だけ（tools/monvoice1017/derive.py）\n')
    f.write('- gain＝聴感の音量 normal −15 LUFS・sad −18 LUFS を目安（sad の持ち上げは +3dB まで）・ピーク −1 dBFS まで。iPhone の実機の聴取は未確認\n\n')
    f.write('| id | 種族 | 原本 | 原本 sha256 | I (LUFS) | peak (dBFS) | gain | ogg sha256 | m4a sha256 |\n|---|---|---|---|---|---|---|---|---|\n')
    for r in rows: f.write(f"| {r['id']} | {r['name']} | {r['orig']} | {r['origSha']} | {r['I']} | {r['peak']} | {r['gain']} | {r['ogg'][:16]}… | {r['m4a'][:16]}… |\n")
print(json.dumps([(r['id'], r['gain']) for r in rows]))
