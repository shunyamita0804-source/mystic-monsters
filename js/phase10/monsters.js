// =========================================================
// Phase 10：正式モンスターマスター（window.MMP10M）
//  正式主要原種4体（ソラモ・ガウル・ノビトン・ジオル）の正式データを一か所で持つ。
//  ・通常6能力（ライフ・ちから・かしこさ・命中・回避・丈夫さ）は最大999
//  ・素早さは通常6能力とは別の正式ステータス：1〜10、数値が大きいほど速い（10が最速）
//  ・固有スキルは「データだけ」登録する（発動処理は後のバトル専用Phaseで実装。fight()・Battle Engineへは接続しない）
//  ・未確定の項目は null のまま持つ（推測で埋めない）。例：ジオルの英字表記、ソラモ・ガウル・ノビトンの性格
//  ・「正式データに登録されていること」と「市場で買えること」は別（市場の扱いは市場側で決める）
//  種族ID（0〜3）は既存セーブの m.sp と同じ番号。旧データの SP 配列（index.html）は現在の購入・生成処理が使う旧表で、
//  ソラモ・ガウルの初期能力はこのマスターと一致している（テストで確認）。
// =========================================================
(function (root) {
  'use strict';
  const STAT_KEYS = Object.freeze(['li', 'po', 'in', 'hi', 'ev', 'de']);
  const STAT_LABELS = Object.freeze({ li: 'ライフ', po: 'ちから', in: 'かしこさ', hi: '命中', ev: '回避', de: '丈夫さ' });
  const STAT_MAX = 999;
  const SPEED_MIN = 1, SPEED_MAX = 10;   // 大きいほど速い（1＝最も遅い、10＝最も速い）
  const isValidSpeed = (v) => Number.isInteger(v) && v >= SPEED_MIN && v <= SPEED_MAX;
  const fz = (o) => Object.freeze(o);

  // ---- 固有スキル（2026-10-06・5：4種ともバトルで発動＝js/battle/rules.js。値はこの params の1か所） ----
  //  id は種族の文字ID（solamo 等）に基づく安定した内部ID。
  //  params は正式説明文にある数値だけを機械可読にしたもの。hiddenParams はプレイヤー向け表示に出さない値。
  const UNIQUE_SKILLS = fz({
    unique_solamo: fz({ id: 'unique_solamo', species: 0, speciesKey: 'solamo', name: '逆境のひと踏ん張り', implemented: true,
      desc: 'ライフが20％以下になると、次に与えるダメージが1度だけ1.25倍になる。',
      params: fz({ lifeRatioAtMost: 0.2, damageMultiplier: 1.25, uses: 1 }), hiddenParams: fz([]) }),
    unique_gauru: fz({ id: 'unique_gauru', species: 1, speciesKey: 'gauru', name: '紅翼の猛攻', implemented: true,
      desc: '戦闘開始から3ターンの間、ちからとかしこさがそれぞれ5％アップする。',
      params: fz({ turnsFromStart: 3, statUpRatio: 0.05, stats: fz(['po', 'in']) }), hiddenParams: fz([]) }),
    unique_nobiton: fz({ id: 'unique_nobiton', species: 2, speciesKey: 'nobiton', name: 'ふしぎな嗅覚', implemented: true,
      // 状態異常＝まひ・ねむり（2026-10-06・5 正式。js/battle/rules.js）
      desc: '相手が状態異常の間、自分のちから・かしこさ・丈夫さがそれぞれ5％アップする。',
      params: fz({ condition: 'opponent_has_status_ailment', statUpRatio: 0.05, stats: fz(['po', 'in', 'de']) }), hiddenParams: fz([]) }),
    unique_jiol: fz({ id: 'unique_jiol', species: 3, speciesKey: 'jiol', name: '大地の守り', implemented: true,
      desc: '致命的なダメージを受けた際、確率で1度だけライフ1で耐えることがある。',
      params: fz({ chance: 0.1, surviveAtLife: 1, uses: 1 }), hiddenParams: fz(['chance']) }),
    // 2026-10-17 ラズック（正式10技性能表 Mismon_Razuck_FinalSkillData_20261017 の確定版）：相手の攻撃を連続で回避するたび、戦闘中の自分のちからが上がる（1回 ×1.15・2回 ×1.30・3回以上 ×1.50）。
    //  ダメージを受けたらリセット。表示は小さな「ちからUP」と倍率だけ（大きなカットインは入れない）。ラズックは未解禁＝QA 試遊の個体だけ（js/battle/rules.js）
    unique_razuck: fz({ id: 'unique_razuck', species: 6, speciesKey: 'razuck', name: '調子に乗る', implemented: true,
      desc: '相手の攻撃を連続で回避するたび、戦闘中の自分のちからが上がる（最大1.5倍）。ダメージを受けると元に戻る。',
      params: fz({ trigger: 'evade_streak', multipliers: fz([1.15, 1.30, 1.50]), resetOnDamage: true }), hiddenParams: fz([]) }),
    // 2026-10-18 カルシェル（正式納品 Mismon_Kalshell_OfficialPackage_ForDev_20261018・ユーザー承認済み）：被ダメージ時に20%の確率でそのダメージを25%軽減（被弾ごとに独立の抽選・発動回数の上限なし）。
    //  js/battle/rules.js の resolveWith（攻撃側の上乗せのあと・実際に受けるダメージに掛ける）。表示は小さな札だけ。カルシェルは未解禁（入手方法は未決）＝QA 試遊の個体だけ
    unique_kalshell: fz({ id: 'unique_kalshell', species: 7, speciesKey: 'kalshell', name: 'かたい貝殻', implemented: true,
      desc: '被ダメージ時に20%の確率で、そのダメージを25%軽減する。',
      params: fz({ trigger: 'on_damaged', chance: 0.2, damageCut: 0.25, uses: null }), hiddenParams: fz(['chance']) }),
    // 2026-10-19 ミュロル（正式納品「ミュロル 正式素材・仕様マスター」2026-10-19・ユーザー承認済み）：相手の攻撃でダメージを受けた際、20%の確率で攻撃した相手のちからを小ダウン（−10%・2ターン）。
    //  被弾ごとに独立の抽選・発動回数の上限なし・同じ効果は重複せず再発動で残りターンを更新。js/battle/rules.js の resolveWith（実際に受けたダメージのあと）。
    //  「ちから」の下げは既存の効果の区分 atk（＝攻撃系：ちから・かしこさの両方の計算に効く。フルーネ「はなのかおり」と同じ扱い）。表示は小さな札＋fight() の「〇〇の攻撃力が下がった！」
    unique_myurol: fz({ id: 'unique_myurol', species: 8, speciesKey: 'myurol', name: 'しめったはだ', implemented: true,
      desc: '相手の攻撃でダメージを受けた際、20%の確率で攻撃した相手のちからを小ダウン（-10%・2ターン）させる。',
      params: fz({ trigger: 'on_damaged', chance: 0.2, target: 'attacker', stat: 'atk', dir: 'down', size: 'small', turns: 2, stack: false, uses: null }), hiddenParams: fz(['chance']) }),
  });

  // ---- ライバル専用のモンスター（2026-10-05 正式）：リュウの相棒レグナス。プレイヤー用の SPECIES とは別の表＝市場・図鑑・合体・初期選択・特殊復元・牧場・野生の相手には出さない
  //  （プレイヤーの入手方法は未決。成長適性は未確定＝null。2026-10-05：正式技10個と固有スキルを登録＝ライバル戦だけで使う（js/battle/rival-partner.js。fight() は変えない））
  const RIVAL_MONSTERS = fz([
    fz({ key: 'regnas', name: 'レグナス', en: 'REGNAS', kind: '牙獣種', personality: '誇り高い・負けず嫌い', owner: 'ryu',
      base: fz({ li: 90, po: 115, in: 75, hi: 105, ev: 115, de: 100 }), speed: 8, style: '俊敏な牙獣種＋回避反撃型',
      uniqueSkill: fz({ id: 'unique_regnas', name: '蒼銀の反撃', implemented: true, /* 2026-10-05：ライバル戦だけ（js/battle/rival-partner.js。セーブしない） */ desc: '相手の攻撃を回避すると、次に与えるダメージが一度だけ1.20倍。効果は重複しない。',
        params: fz({ trigger: 'evade', damageMultiplier: 1.2, uses: 1, stack: false }), hiddenParams: fz([]) }),
      // 正式技10個（2026-10-05 正式。竜眼ロックの「竜」は この字）。命中 100% は必中ではない（回避の計算はほかの技と同じ）。support＝自分の強化（重ねがけしない・使い直すと残りターンを更新）
      //  習得：1〜4 初期・5 ちから特訓・6 かしこさ特訓・7 命中特訓・8 回避特訓・9／10 丈夫さ特訓（1回目は未習得の2つからランダムに1つ・2回目は残り）。プレイヤーは使えない（playerAvailable:false）
      //  rivalLoadout＝ライバル戦で使う技（最小構成＝初期の4技。強さ・難易度は従来のまま）。バトルへの組み込みは js/battle/rival-partner.js
      moves: fz({ list: fz([
        fz({ no: 1, id: 'kirisaku', name: 'きりさく', type: 'power', power: 80, accuracy: 90, critical: 10 }),
        fz({ no: 2, id: 'shippo_attack', name: 'しっぽアタック', type: 'power', power: 90, accuracy: 75, critical: 10 }),
        fz({ no: 3, id: 'ryugan_lock', name: '竜眼ロック', type: 'support', effect: fz({ target: 'self', stat: 'hi', size: 'small', ratio: 0.1, turns: 2, stack: false }) }),
        fz({ no: 4, id: 'zanei_step', name: '残影ステップ', type: 'support', effect: fz({ target: 'self', stat: 'ev', size: 'small', ratio: 0.1, turns: 2, stack: false }) }),
        fz({ no: 5, id: 'dragon_crash', name: 'ドラゴンクラッシュ', type: 'power', power: 110, accuracy: 80, critical: 15 }),
        fz({ no: 6, id: 'soukou_breath', name: '蒼光ブレス', type: 'wisdom', power: 105, accuracy: 85, critical: 10 }),
        fz({ no: 7, id: 'snipe_fang', name: 'スナイプファング', type: 'power', power: 95, accuracy: 100, critical: 10 }),
        fz({ no: 8, id: 'genei_claw', name: '幻影クロー', type: 'power', power: 90, accuracy: 85, critical: 35 }),
        fz({ no: 9, id: 'soujin_ranbu', name: '蒼刃乱舞', type: 'power', power: 130, accuracy: 90, critical: 25, finisher: true }),
        fz({ no: 10, id: 'tail_cyclone', name: 'テイルサイクロン', type: 'power', power: 125, accuracy: 95, critical: 20, finisher: true }),
      ]),
        learnset: fz({ initial: fz([1, 2, 3, 4]), po: fz([5]), in: fz([6]), hi: fz([7]), ev: fz([8]), de: fz([9, 10]), deRule: 'first_random_then_remaining' }),
        rivalLoadout: fz([1, 2, 3, 4]) }),
      growth: null, playerAvailable: false,
      image: fz({ src: './assets/monsters/2p5d/regnas.webp', w: 720, h: 699 }) }),   // 2026-10-11：2.5D 正式原本の表示用（assets/monsters/2p5d/README.md）。旧 regnas_official.webp はファイルだけ残す
  ]);
  const rivalMonster = (key) => RIVAL_MONSTERS.find((x) => x.key === key) || null;

  // ---- 正式技（2026-10-06 正式。ソラモ・ノビトン・ジオル・ガウル＋レグナスの技辞典の画像）。このゲームに「ガッツ」は無い（技のデータ・表示に使わない） ----
  //  type：power＝ちから／wisdom＝かしこさ／support＝補助（威力なし）／heal＝回復・補助／special＝特殊（どの能力で計算するかは未決＝要確認）。
  //  effects：{ target:'self'|'opponent', stat:'atk'（ちから・かしこさ＝攻撃力）|'de'（丈夫さ＝防御力）|'hi'|'ev', dir:'up'|'down', size:'small'|'medium'|'large', turns }。
  //    ダメージのある技の effects は命中して相手が倒れなかったときだけ（バトルエンジンの規則のまま）。
  //  ailment：状態異常（まひ・ねむり）の確率。heal：回復。どちらも今のバトルエンジン（Phase 6）には無い＝データだけ（ノビトンはまだバトルに出ない）。
  //  slot：今のバトルの技の番号（index.html の SK の番号）。ソラモ 0〜9・ガウル 10〜19 は「習得の枠」（初期・各特訓）をそのまま使い、中身だけ正式技へ（js/battle/official-moves.js が起動時に入れ替える）。
  //    ノビトン・ジオルは技の番号なし（市場に出ない・バトルに出ない）＝slot null。
  //  sheet：技アニメーションの正式資料（assets/moves/。技辞典で見る）。cuts：その資料のカット数。
  const E = (target, stat, dir, size, turns) => fz({ target, stat, dir, size, turns });
  const MV = (o) => fz({ effects: fz([]), ailment: null, heal: null, ...o, effects: fz(o.effects || []) });
  const sheetOf = (key, no, id) => `./assets/moves/${key}/${String(no).padStart(2, '0')}_${id}.webp`;
  const OFFICIAL_MOVES = fz({
    solamo: fz({ style: '万能型＋ピンチ時の逆転力', list: fz([
      MV({ no: 1, id: 'taiatari', name: 'たいあたり', type: 'power', power: 70, accuracy: 90, critical: 5, slot: 0, cuts: 4, desc: '低く構えて勢いをため、全身で相手にぶつかる。' }),
      MV({ no: 2, id: 'hikkaki', name: 'ひっかき', type: 'power', power: 60, accuracy: 100, critical: 10, slot: 1, cuts: 4, desc: 'するどいツメでひっかく。当たりやすい。' }),
      MV({ no: 3, id: 'shippo_attack', name: 'しっぽアタック', type: 'power', power: 85, accuracy: 80, critical: 10, slot: 2, cuts: 4, desc: 'しっぽを大きく振ってなぎはらう。' }),
      MV({ no: 4, id: 'star_crash', name: 'スタークラッシュ', type: 'power', power: 105, accuracy: 85, critical: 15, slot: 4, cuts: 4, desc: '星の光をまとって突進し、相手に激突する。' }),
      MV({ no: 5, id: 'hoshi_no_mamori', name: 'ほしのまもり', type: 'support', slot: 7, cuts: 4, desc: '星の光で身を包み、自分の命中と回避を少し上げる（2ターン）。',
        effects: [E('self', 'hi', 'up', 'small', 2), E('self', 'ev', 'up', 'small', 2)] }),
      MV({ no: 6, id: 'hoeru', name: '吠える', type: 'support', slot: 3, cuts: 4, desc: '大きな声で吠えて、相手の丈夫さを少し下げる（2ターン）。',
        effects: [E('opponent', 'de', 'down', 'small', 2)] }),
      MV({ no: 7, id: 'soramo_beam', name: 'ソラモビーム', type: 'wisdom', power: 90, accuracy: 85, critical: 10, slot: 5, cuts: 4, desc: 'エネルギーを集めて光のビームを放つ。' }),
      MV({ no: 8, id: 'sunakake', name: 'すなかけ', type: 'support', slot: 6, cuts: 4, desc: '砂をまいて、相手の命中を少し下げる（2ターン）。',
        effects: [E('opponent', 'hi', 'down', 'small', 2)] }),
      MV({ no: 9, id: 'stardust_ray', name: 'スターダストレイ', type: 'wisdom', power: 120, accuracy: 95, critical: 20, slot: 8, cuts: 4, desc: '星の力を集めて放つ強力な光線。' }),
      MV({ no: 10, id: 'star_fall', name: 'スターフォール', type: 'wisdom', power: 140, accuracy: 85, critical: 25, slot: 9, cuts: 4, desc: '夜空から無数の星を降らせる、ソラモの大技。' }),
    ]), removed: fz(['とっしん', 'ドリルアタック', '超スターダストレイ']) }),
    nobiton: fz({ style: '高ライフ・高耐久・低速。状態異常／デバフ／自己回復で粘る長期戦型', list: fz([
      MV({ no: 1, id: 'hana_binta', name: 'はなビンタ', type: 'power', power: 65, accuracy: 90, critical: 5, slot: null, cuts: 4, desc: '長い鼻でビンタする。' }),
      MV({ no: 2, id: 'zutsuki', name: 'ずつき', type: 'power', power: 80, accuracy: 75, critical: 10, slot: null, cuts: 4, desc: '頭から勢いよくぶつかる。' }),
      MV({ no: 3, id: 'hanamizu', name: 'はなみず', type: 'wisdom', power: 55, accuracy: 95, critical: 5, slot: null, cuts: 4, desc: '鼻水を飛ばし、相手の防御力を少し下げる（1ターン）。',
        effects: [E('opponent', 'de', 'down', 'small', 1)] }),
      MV({ no: 4, id: 'hitoyasumi', name: 'ひとやすみ', type: 'heal', slot: null, cuts: 4, desc: '休んで、自分の状態異常をすべて治し、最大ライフの20%を回復する（能力の上げ下げは残る）。',
        heal: fz({ lifeRatio: 0.2, cureAilments: true, clearStatChanges: false }) }),
      // 2026-10-14：No.5 は正式に「まきつく」（旧「ハンマーノーズ」威力105／命中80／CR15 は撤回）＝ダメージなし・相手の攻撃力 小DOWN 2ターン。
      //  技辞典の資料（assets/moves/nobiton/05_hammer_nose.webp）は旧ハンマーノーズの絵＝使わない（sheet: null＝「資料はまだありません」）
      MV({ no: 5, id: 'makitsuku', name: 'まきつく', type: 'support', slot: null, cuts: null, sheet: null, desc: '長い鼻でまきつき、相手の攻撃力を少し下げる（2ターン）。',
        effects: [E('opponent', 'atk', 'down', 'small', 2)] }),
      MV({ no: 6, id: 'nose_wave', name: 'ノーズウェーブ', type: 'wisdom', power: 90, accuracy: 90, critical: 10, slot: null, cuts: 4, desc: '鼻から不思議な波動を放つ。' }),
      MV({ no: 7, id: 'shibire_tsuki', name: 'しびれ突き', type: 'power', power: 75, accuracy: 100, critical: 10, slot: null, cuts: 4, desc: '鼻で鋭く突く。30%で相手を「まひ」にする。',
        ailment: fz({ kind: 'paralysis', label: 'まひ', chance: 0.3 }), formerName: 'ピンポイント突き' }),
      MV({ no: 8, id: 'mirage_nose', name: 'ミラージュノーズ', type: 'power', power: 100, accuracy: 90, critical: 30, slot: null, cuts: 4, desc: '幻のような動きで鼻を打ちつける。急所に当たりやすい。' }),
      MV({ no: 9, id: 'downer_mist', name: 'ダウナーミスト', type: 'special', power: 60, accuracy: 95, critical: 0, slot: null, cuts: 4, desc: '気だるい霧で包み、相手の攻撃力と防御力を下げる（中・2ターン）。20%で「ねむり」。',
        effects: [E('opponent', 'atk', 'down', 'medium', 2), E('opponent', 'de', 'down', 'medium', 2)], ailment: fz({ kind: 'sleep', label: 'ねむり', chance: 0.2 }) }),
      MV({ no: 10, id: 'gigant_nose', name: 'ギガントノーズ', type: 'power', power: 150, accuracy: 75, critical: 25, slot: null, cuts: 4, desc: '巨大化させた鼻で押しつぶす、ノビトンの大技。' }),
    ]), removed: fz(['くっつく']), renamed: fz({ 'ピンポイント突き': 'しびれ突き' }) }),
    // ジオル：2026-10-15 ユーザー正式承認（ZIP Mismon_Jiol_10Moves_Battle_Addendum_20261015 の 02_Jiol_Approved_Moves.tsv）。SK の番号＝40＋No−1（js/battle/rules.js が実行時に足す）。
    //  習得：初期＝No.1〜4・ちから特訓 No.5・かしこさ特訓 No.6・命中特訓 No.7・回避特訓 No.8・丈夫さ特訓 No.9／No.10（learn）。No.9・10＝必殺技（威力 120 以上）。追加効果は No.3 だけ（状態異常なし）
    //  cuts＝技アニメの本体のコマ数（js/battle/jiol-moves-data.js）。desc は承認表に無い＝効果のある No.3 だけ
    jiol: fz({ style: null, list: fz([
      MV({ no: 1, id: 'punch', name: 'パンチ', type: 'power', power: 70, accuracy: 95, critical: 5, slot: 40, cuts: 4, learn: 'initial', desc: null }),
      MV({ no: 2, id: 'kick', name: 'キック', type: 'power', power: 85, accuracy: 85, critical: 10, slot: 41, cuts: 4, learn: 'initial', desc: null }),
      MV({ no: 3, id: 'chikara_wo_tameru', name: '力をためる', type: 'support', accuracy: 100, slot: 42, cuts: 4, learn: 'initial', desc: '力をためて、自分の攻撃力を上げる（中・2ターン）。',
        effects: [E('self', 'atk', 'up', 'medium', 2)] }),
      MV({ no: 4, id: 'noshikakari', name: 'のしかかり', type: 'power', power: 95, accuracy: 75, critical: 10, slot: 43, cuts: 4, learn: 'initial', desc: null }),
      MV({ no: 5, id: 'ground_hammer', name: 'グランドハンマー', type: 'power', power: 115, accuracy: 80, critical: 15, slot: 44, cuts: 4, learn: 'po', desc: null }),
      MV({ no: 6, id: 'crystal_ray', name: 'クリスタルレイ', type: 'wisdom', power: 100, accuracy: 95, critical: 10, slot: 45, cuts: 4, learn: 'in', desc: null }),
      MV({ no: 7, id: 'ground_spike', name: 'グランドスパイク', type: 'power', power: 95, accuracy: 100, critical: 10, slot: 46, cuts: 4, learn: 'hi', desc: null }),
      MV({ no: 8, id: 'rock_upper', name: 'ロックアッパー', type: 'power', power: 105, accuracy: 90, critical: 20, slot: 47, cuts: 4, learn: 'ev', desc: null }),
      MV({ no: 9, id: 'geo_impact', name: 'ジオインパクト', type: 'power', power: 140, accuracy: 75, critical: 25, slot: 48, cuts: 12, learn: 'de', desc: null }),
      MV({ no: 10, id: 'crystal_nova', name: 'クリスタルノヴァ', type: 'wisdom', power: 145, accuracy: 90, critical: 20, slot: 49, cuts: 4, learn: 'de', desc: null }),
    ]) }),
    // ラズック：2026-10-17 正式確定（Mismon_Razuck_FinalSkillData_20261017・ユーザー最終決定）。SK の番号＝60＋No−1（js/battle/rules.js が実行時に足す）。
    //  習得：初期＝No.1〜4・ちから特訓 No.5・かしこさ特訓 No.6・命中特訓 No.7・回避特訓 No.8・丈夫さ特訓 No.9／No.10。命中 100% は必中ではない。追加効果は No.4・6・7 だけ
    //  ラズックは未解禁（市場・野生・合体・大会に出ない）＝今は QA 試遊モード（?mmQaTrial=1）の個体だけが使う
    razuck: fz({ style: '高回避・高命中の小型獣。連続回避で調子に乗る', list: fz([
      MV({ no: 1, id: 'kamitsuki', name: 'かみつき', type: 'power', power: 65, accuracy: 95, critical: 5, slot: 60, cuts: 4, learn: 'initial', sheet: null, desc: null }),
      MV({ no: 2, id: 'hikkaki', name: 'ひっかき', type: 'power', power: 60, accuracy: 100, critical: 10, slot: 61, cuts: 4, learn: 'initial', sheet: null, desc: null }),
      MV({ no: 3, id: 'subayai_ichigeki', name: 'すばやい一撃', type: 'power', power: 75, accuracy: 100, critical: 10, slot: 62, cuts: 4, learn: 'initial', sheet: null, desc: null }),
      MV({ no: 4, id: 'chokomaka', name: 'ちょこまか', type: 'support', accuracy: 100, slot: 63, cuts: 4, learn: 'initial', sheet: null, desc: '素早く動き回って、自分の回避を上げる（中・2ターン）。',
        effects: [E('self', 'ev', 'up', 'medium', 2)] }),
      MV({ no: 5, id: 'gajigaji_rush', name: 'ガジガジラッシュ', type: 'power', power: 85, accuracy: 90, critical: 15, slot: 64, cuts: 6, learn: 'po', sheet: null, desc: null }),
      MV({ no: 6, id: 'trick_shot', name: 'トリックショット', type: 'wisdom', power: 90, accuracy: 95, critical: 10, slot: 65, cuts: 4, learn: 'in', sheet: null, desc: '攻撃が命中したら、相手の命中を少し下げる（1ターン）。',
        effects: [E('opponent', 'hi', 'down', 'small', 1)] }),
      MV({ no: 7, id: 'kakuran_step', name: 'かく乱ステップ', type: 'support', accuracy: 100, slot: 66, cuts: 4, learn: 'hi', sheet: null, desc: 'フェイントで相手の狙いを狂わせ、相手の命中を下げる（中・2ターン）。',
        effects: [E('opponent', 'hi', 'down', 'medium', 2)] }),
      MV({ no: 8, id: 'shadow_bite', name: 'シャドーバイト', type: 'power', power: 110, accuracy: 80, critical: 15, slot: 67, cuts: 5, learn: 'ev', sheet: null, desc: null }),
      MV({ no: 9, id: 'mirage_dash', name: 'ミラージュダッシュ', type: 'power', power: 115, accuracy: 90, critical: 20, slot: 68, cuts: 6, learn: 'de', sheet: null, desc: null }),
      MV({ no: 10, id: 'razuck_rush', name: 'ラズックラッシュ', type: 'power', power: 125, accuracy: 90, critical: 20, slot: 69, cuts: 10, learn: 'de', sheet: null, desc: null }),
    ]) }),
    // フルーネ：2026-10-18 REV3 F0-4 正式採用（ZIP Mismon_Claude_PreCh3_…_REV3_20261018 の 10／11＝技性能表）。SK の番号＝50＋No−1（js/battle/rules.js が実行時に足す）。
    //  習得：初期＝No.1〜4・ちから特訓 No.5・かしこさ特訓 No.6・命中特訓 No.7・回避特訓 No.8・丈夫さ特訓 No.9（①）／No.10（②）。命中 100% は必中ではない。小＝10%・中＝20%
    //  No.9 ルートドレイン＝与えたダメージの50%を吸収（最大ライフまで）・No.7 しばりづる＝命中したとき25%で「まひ」（既存の3回）。旧「いのちのしずく／生命のしずく」は使わない
    //  フルーネは未解禁（市場・野生・合体・大会に出ない）＝今は QA 試遊モードの個体だけが使う
    flurene: fz({ style: '高ライフ・かしこさ寄りの植物系', list: fz([
      MV({ no: 1, id: 'tsuruuchi', name: 'つるうち', type: 'power', power: 60, accuracy: 100, critical: 5, slot: 50, cuts: 4, learn: 'initial', sheet: null, desc: null }),
      MV({ no: 2, id: 'tane_tobashi', name: 'たねとばし', type: 'wisdom', power: 65, accuracy: 95, critical: 10, slot: 51, cuts: 4, learn: 'initial', sheet: null, desc: null }),
      MV({ no: 3, id: 'hana_no_kaori', name: 'はなのかおり', type: 'support', accuracy: 100, slot: 52, cuts: 4, learn: 'initial', sheet: null, desc: '甘い香りで、相手のちからを少し下げる（2ターン）。',
        effects: [E('opponent', 'atk', 'down', 'small', 2)] }),
      MV({ no: 4, id: 'nekko_no_mamori', name: 'ねっこのまもり', type: 'support', accuracy: 100, slot: 53, cuts: 4, learn: 'initial', sheet: null, desc: '根を張って、自分の丈夫さを上げる（中・2ターン）。',
        effects: [E('self', 'de', 'up', 'medium', 2)] }),
      MV({ no: 5, id: 'konsai_press', name: 'こんさいプレス', type: 'power', power: 100, accuracy: 85, critical: 10, slot: 54, cuts: 5, learn: 'po', sheet: null, desc: null }),
      MV({ no: 6, id: 'bloom_ray', name: 'ブルームレイ', type: 'wisdom', power: 110, accuracy: 90, critical: 10, slot: 55, cuts: 4, learn: 'in', sheet: null, desc: null }),
      MV({ no: 7, id: 'shibari_zuru', name: 'しばりづる', type: 'wisdom', power: 70, accuracy: 90, critical: 5, slot: 56, cuts: 4, learn: 'hi', sheet: null, desc: 'つるで縛りつける。命中したとき25%で相手を「まひ」にする。',
        ailment: fz({ kind: 'paralysis', label: 'まひ', chance: 0.25 }) }),
      MV({ no: 8, id: 'hanakage_no_mai', name: 'はなかげのまい', type: 'support', accuracy: 100, slot: 57, cuts: 4, learn: 'ev', sheet: null, desc: '花の影で舞い、自分の回避を上げる（中・2ターン）。',
        effects: [E('self', 'ev', 'up', 'medium', 2)] }),
      MV({ no: 9, id: 'root_drain', name: 'ルートドレイン', formerNames: fz(['生命のしずく', 'いのちのしずく']), type: 'power', power: 110, accuracy: 90, critical: 10, slot: 58, cuts: 10, learn: 'de', deOrder: 1, drain: 0.5, sheet: null,
        desc: '両腕の蔦を相手に突き刺し、与えたダメージの50%だけライフを回復する（命中してダメージがあるときだけ・最大ライフまで）。' }),
      MV({ no: 10, id: 'root_tempest', name: 'ルートテンペスト', type: 'wisdom', power: 120, accuracy: 85, critical: 20, slot: 59, cuts: 5, learn: 'de', deOrder: 2, finisher: true, sheet: null, desc: null }),
    ]) }),
    // カルシェル：2026-10-18 正式納品（Mismon_Kalshell_OfficialPackage_ForDev_20261018 の 00_docs/01_正式素材仕様マスター＝ユーザー承認済み・独断変更不可）。SK の番号＝70＋No−1（js/battle/rules.js が実行時に足す）。
    //  習得：初期＝No.1〜4・ちから特訓 No.5・かしこさ特訓 No.6・命中特訓 No.7・回避特訓 No.8・丈夫さ特訓 No.9（①）／No.10（②）。命中 100% は必中ではない。追加効果は No.3・4・8 だけ（10%＝小）。No.9・10＝必殺技（威力 120 以上）
    //  カルシェルは未解禁（入手方法・出現場所は未決＝市場・野生・合体・大会に出ない）＝今は QA 試遊モード（?mmQaTrial=1）の個体だけが使う。cuts＝技アニメの本体のコマ数（js/battle/kalshell-moves-data.js）
    kalshell: fz({ style: '高い丈夫さと命中。殻で受け止める防御寄りのパワータイプ', list: fz([
      MV({ no: 1, id: 'hasamu', name: 'はさむ', type: 'power', power: 70, accuracy: 95, critical: 5, slot: 70, cuts: 4, learn: 'initial', sheet: null, desc: null }),
      MV({ no: 2, id: 'shell_tackle', name: 'シェルタックル', type: 'power', power: 80, accuracy: 85, critical: 10, slot: 71, cuts: 4, learn: 'initial', sheet: null, desc: null }),
      MV({ no: 3, id: 'awadama', name: 'あわだま', type: 'wisdom', power: 60, accuracy: 95, critical: 5, slot: 72, cuts: 4, learn: 'initial', sheet: null, desc: '泡を飛ばして、相手の命中を少し下げる（1ターン）。',
        effects: [E('opponent', 'hi', 'down', 'small', 1)] }),
      MV({ no: 4, id: 'kara_ni_komoru', name: 'からにこもる', type: 'support', accuracy: 100, slot: 73, cuts: 4, learn: 'initial', sheet: null, desc: '殻にこもって、自分の丈夫さを少し上げる（2ターン）。',
        effects: [E('self', 'de', 'up', 'small', 2)] }),
      MV({ no: 5, id: 'crash_claw', name: 'クラッシュクロー', type: 'power', power: 105, accuracy: 85, critical: 15, slot: 74, cuts: 5, learn: 'po', sheet: null, desc: null }),
      MV({ no: 6, id: 'aqua_burst', name: 'アクアバースト', type: 'wisdom', power: 95, accuracy: 90, critical: 10, slot: 75, cuts: 5, learn: 'in', sheet: null, desc: null }),
      MV({ no: 7, id: 'coral_spear', name: 'コーラルスピア', type: 'power', power: 95, accuracy: 100, critical: 10, slot: 76, cuts: 5, learn: 'hi', sheet: null, desc: null }),
      MV({ no: 8, id: 'shio_no_step', name: 'しおのステップ', type: 'support', accuracy: 100, slot: 77, cuts: 4, learn: 'ev', sheet: null, desc: '潮のように素早く動いて、自分の回避を少し上げる（2ターン）。',
        effects: [E('self', 'ev', 'up', 'small', 2)] }),
      MV({ no: 9, id: 'shell_breaker', name: 'シェルブレイカー', type: 'power', power: 120, accuracy: 80, critical: 15, slot: 78, cuts: 6, learn: 'de', deOrder: 1, finisher: true, sheet: null, desc: null }),
      MV({ no: 10, id: 'tidal_crash', name: 'タイダルクラッシュ', type: 'power', power: 125, accuracy: 85, critical: 20, slot: 79, cuts: 8, learn: 'de', deOrder: 2, finisher: true, sheet: null, desc: null }),
    ]) }),
    // ミュロル：2026-10-19 正式納品（ミュロル 正式素材・仕様マスター §3＝ユーザー承認済み・独断変更不可）。SK の番号＝80＋No−1（js/battle/rules.js の installMyurol が実行時に足す）。
    //  習得：初期＝No.1〜4・ちから特訓 No.5・かしこさ特訓 No.6・命中特訓 No.7・回避特訓 No.8・丈夫さ特訓 No.9（①）／No.10（②）。命中 100% は必中ではない。追加効果は No.4・8 だけ（自分へ 10%＝小・2ターン）。
    //  No.3 の正式名は「タックル」（旧名「ぷにタックル」は不採用）。No.10 マリンストリーム＝必殺技（威力 120 以上）・技アニメは津波 V2（背後から立ち上がる波・口先の水流の旧版は不採用）。
    //  ミュロルは未解禁（入手方法・出現場所は未決＝市場・野生・合体・大会に出ない）＝QA 試遊モード（?mmQaTrial=1）の個体だけが使う。cuts＝技アニメの本体のコマ数（js/battle/myurol-moves-data.js）
    myurol: fz({ style: 'ライフ・かしこさ・命中・回避がそろった水陸両用のかしこさ寄り。しめったはだで相手のちからを削ぐ', list: fz([
      MV({ no: 1, id: 'shippo_uchi', name: 'しっぽうち', type: 'power', power: 65, accuracy: 100, critical: 5, slot: 80, cuts: 4, learn: 'initial', sheet: null, desc: null }),
      MV({ no: 2, id: 'mizudeppo', name: 'みずでっぽう', type: 'wisdom', power: 70, accuracy: 95, critical: 5, slot: 81, cuts: 4, learn: 'initial', sheet: null, desc: null }),
      MV({ no: 3, id: 'tackle', name: 'タックル', type: 'power', power: 80, accuracy: 90, critical: 10, slot: 82, cuts: 4, learn: 'initial', sheet: null, desc: null }),
      MV({ no: 4, id: 'awa_no_mamori', name: 'あわのまもり', type: 'support', accuracy: 100, slot: 83, cuts: 4, learn: 'initial', sheet: null, desc: '泡の膜で身を包み、自分の丈夫さを少し上げる（2ターン）。',
        effects: [E('self', 'de', 'up', 'small', 2)] }),
      MV({ no: 5, id: 'tail_swing', name: 'テールスイング', type: 'power', power: 100, accuracy: 85, critical: 15, slot: 84, cuts: 5, learn: 'po', sheet: null, desc: null }),
      MV({ no: 6, id: 'aqua_bubble', name: 'アクアバブル', type: 'wisdom', power: 100, accuracy: 90, critical: 10, slot: 85, cuts: 5, learn: 'in', sheet: null, desc: null }),
      MV({ no: 7, id: 'bubble_snipe', name: 'バブルスナイプ', type: 'wisdom', power: 90, accuracy: 100, critical: 10, slot: 86, cuts: 5, learn: 'hi', sheet: null, desc: null }),
      MV({ no: 8, id: 'suisui_step', name: 'すいすいステップ', type: 'support', accuracy: 100, slot: 87, cuts: 4, learn: 'ev', sheet: null, desc: '水の流れに乗ってすいすい動き、自分の回避を少し上げる（2ターン）。',
        effects: [E('self', 'ev', 'up', 'small', 2)] }),
      MV({ no: 9, id: 'spiral_tail', name: 'スパイラルテール', type: 'power', power: 115, accuracy: 85, critical: 15, slot: 88, cuts: 7, learn: 'de', deOrder: 1, sheet: null, desc: null }),
      MV({ no: 10, id: 'marine_stream', name: 'マリンストリーム', type: 'wisdom', power: 125, accuracy: 85, critical: 20, slot: 89, cuts: 8, learn: 'de', deOrder: 2, finisher: true, sheet: null, desc: null }),
    ]) }),
    gauru: fz({ style: '高速・高火力・短期決戦型の両刀アタッカー', list: fz([
      MV({ no: 1, id: 'tsutsuku', name: 'つつく', type: 'power', power: 60, accuracy: 100, critical: 5, slot: 11, cuts: 4, desc: 'くちばしで素早くつつく。' }),
      MV({ no: 2, id: 'wind', name: 'ウィンド', type: 'wisdom', power: 65, accuracy: 95, critical: 5, slot: 12, cuts: 4, desc: '風をまとい、相手に風の力をぶつける。' }),
      MV({ no: 3, id: 'spiral_dive', name: 'スパイラルダイブ', type: 'power', power: 95, accuracy: 85, critical: 15, slot: 10, cuts: 4, desc: '体を回転させて急降下し、相手を貫く。', formerName: 'ドリルアタック' }),
      MV({ no: 4, id: 'sonic_move', name: 'ソニックムーブ', type: 'support', slot: 13, cuts: 4, desc: '高速で動いて残像を残し、自分の命中と回避を少し上げる（2ターン）。',
        effects: [E('self', 'hi', 'up', 'small', 2), E('self', 'ev', 'up', 'small', 2)] }),
      MV({ no: 5, id: 'kouyoku_slash', name: '紅翼スラッシュ', type: 'power', power: 110, accuracy: 90, critical: 15, slot: 14, cuts: 4, desc: '紅い翼で鋭く切り裂く。', formerName: 'ウイングアタック' }),
      MV({ no: 6, id: 'fireball', name: 'ファイアボール', type: 'wisdom', power: 100, accuracy: 90, critical: 10, slot: 15, cuts: 4, desc: '炎のエネルギーを凝縮した火の玉を放つ。' }),
      MV({ no: 7, id: 'sky_rush', name: 'スカイラッシュ', type: 'power', power: 125, accuracy: 85, critical: 20, slot: 17, cuts: 4, desc: '空から連続で襲いかかる。', formerName: 'バードアタック' }),
      MV({ no: 8, id: 'flare_ray', name: 'フレアレイ', type: 'wisdom', power: 120, accuracy: 90, critical: 15, slot: 16, cuts: 4, desc: '強大な炎の光線を一直線に放つ。', formerName: 'ファイアビーム' }),
      MV({ no: 9, id: 'feather_storm', name: 'フェザーストーム', type: 'wisdom', power: 145, accuracy: 70, critical: 20, slot: 18, cuts: 4, desc: '燃える羽根の嵐を巻き起こす。高火力だが当たりにくい大技。' }),
      MV({ no: 10, id: 'seinaru_honoo', name: '聖なる炎', type: 'wisdom', power: 115, accuracy: 90, critical: 15, slot: 19, cuts: 6, desc: '神聖な炎と光を広げて相手に届かせ、そのあと自分に加護が残る（ちから・かしこさ・命中・回避・丈夫さ 小・1ターン）。',
        effects: [E('self', 'atk', 'up', 'small', 1), E('self', 'hi', 'up', 'small', 1), E('self', 'ev', 'up', 'small', 1), E('self', 'de', 'up', 'small', 1)] }),
    ]), removed: fz(['ひっかき']) }),
  });
  // レグナス（技の数値は RIVAL_MONSTERS の1か所）の技辞典の画像：ZIP の並び（1 しっぽアタック…10 残影ステップ）とデータの no は違う＝id で引く
  const REGNAS_SHEET = fz({ shippo_attack: 1, kirisaku: 2, genei_claw: 3, soujin_ranbu: 4, tail_cyclone: 5, dragon_crash: 6, snipe_fang: 7, soukou_breath: 8, ryugan_lock: 9, zanei_step: 10 });
  /** 技辞典の一覧（種族の番号・文字ID・'regnas'）。[{ no, id, name, type, power, accuracy, critical, effects, ailment, heal, desc, slot, sheet }] */
  function movesOf(ref) {
    if (ref === 'regnas') {
      const r = rivalMonster('regnas');
      return r ? r.moves.list.map((m) => ({ ...m, effects: m.effect ? [{ target: m.effect.target, stat: m.effect.stat, dir: 'up', size: m.effect.size, turns: m.effect.turns }] : [],
        ailment: null, heal: null, desc: null, slot: 19 + m.no, sheet: sheetOf('regnas', REGNAS_SHEET[m.id], m.id) })) : [];
    }
    const s = typeof ref === 'string' ? (byKey(ref) || (ref === 'razuck' || ref === 'flurene' || ref === 'kalshell' || ref === 'myurol' ? pendingSpecies(ref) : null)) : byId(ref);   // 2026-10-17：ラズック・2026-10-18 フルーネ（登録のみの種族）も正式技の表を持つ
    const t = s && OFFICIAL_MOVES[s.key];
    return t ? t.list.map((m) => ({ ...m, sheet: m.sheet === null ? null : sheetOf(s.key, m.no, m.id) })) : [];   // sheet: null＝技辞典の資料なし（ノビトン No.5 まきつく＝旧資料はハンマーノーズのため使わない）
  }
  /** 技の番号（SK）→ 正式技（ソラモ・ガウルの 0〜19・レグナスの 20〜29）。無ければ null */
  function moveBySlot(k) {
    for (const key of ['solamo', 'gauru', 'regnas', 'jiol', 'razuck', 'flurene', 'kalshell', 'myurol']) { const m = movesOf(key).find((x) => x.slot === k); if (m) return { ...m, owner: key }; }
    return null;
  }

  // ---- 成長適性（2026-10-02 正式）：6能力それぞれに A〜E。能力マスに止まったときの上昇量はこの表だけで決まる（ランダム幅・失敗・大成功なし）。
  //  イベントによる能力変化（賢者 +20・薬草 +6 など）は適性の影響を受けない（イベント側の数値のまま）。
  const GROWTH_GRADES = fz(['A', 'B', 'C', 'D', 'E']);
  // 2026-10-08 正式（全 Chapter 共通の1つの表）：「適性 A の能力が、1体の育成を最後まで（Chapter 1〜4＋S の最終公式大会）終えたとき、開始 100 前後なら 250 前後」を基準に、
  //  実際の育成シミュレーションから逆算（旧表 A7 B6 C5 D4 E3 の比率のまま約3.5倍。旧：Chapter 1 だけ config の A5…E2 という二重の表）。
  const GROWTH_GAIN = fz({ A: 25, B: 21, C: 18, D: 14, E: 11 });
  // 2026-10-14 実機試遊⑲（ユーザー正式方針）：Chapter 1 は能力マスを増やして1回の上昇量を下げる（少しずつ・何度も伸びる）。Chapter 2→3→4 と1回の上昇量を穏やかに上げる。
  //  Chapter ごとの表（無い Chapter・最終ルートは Chapter 4 の表。Chapter の外＝GROWTH_GAIN）。値は tools/balance/sim-full.mjs の候補比較で決めた（報告書 G：
  //  初回の1体の得意能力の最終値の平均（300回・大会は全勝の想定）ソラモ 258・ガウル 289・ノビトン 273・ジオル 323＝4体平均 286（旧の配置と表では 234／263／245／305＝262））。
  //  window.MM_BALANCE_OVERRIDE.gainByCh（開発用の道具 tools/balance/sim-full.mjs だけが入れる）で上書きできる
  const GROWTH_GAIN_BY_CH = (() => {
    // 2026-10-15 追加B：Chapter 1 は能力マスが増えた分だけ1回の上昇を下げる（旧 A20 B18 C16 D12 E9 → A17 B15 C14 D10 E8・A＞B＞C＞D＞E のまま）。
    //  得意能力の最終値の平均（300回・大会は全勝の想定）ソラモ 261・ガウル 291・ノビトン 273・ジオル 327＝4体平均 288（変更前 258／289／273／323＝286）
    const T = { 1: fz({ A: 17, B: 15, C: 14, D: 10, E: 8 }), 2: fz({ A: 25, B: 23, C: 20, D: 16, E: 12 }), 3: fz({ A: 29, B: 27, C: 23, D: 18, E: 14 }), 4: fz({ A: 33, B: 30, C: 26, D: 20, E: 15 }) };
    const ov = root.MM_BALANCE_OVERRIDE && root.MM_BALANCE_OVERRIDE.gainByCh;
    if (ov && typeof ov === 'object') for (const c of Object.keys(ov)) if (T[c]) T[c] = fz({ ...T[c], ...ov[c] });
    return fz(T);
  })();
  const gainTable = (ch) => GROWTH_GAIN_BY_CH[ch] || (ch === 'final' || ch > 4 ? GROWTH_GAIN_BY_CH[4] : GROWTH_GAIN);
  const G6 = (li, po, iN, hi, ev, de) => fz({ li, po, in: iN, hi, ev, de });
  // ---- 正式主要原種 ----
  //  tagline：市場などで使う短い紹介文。ソラモ・ガウルは既存ゲーム内の説明文、ノビトンは正式プロフィール資料の文。未提供は null。
  const SPECIES = fz([
    fz({ id: 0, key: 'solamo', name: 'ソラモ', en: 'SORAMO', kind: '獣種', personality: null, formerNames: fz([]),
      base: fz({ li: 100, po: 100, in: 100, hi: 100, ev: 100, de: 100 }), speed: 5, uniqueSkill: 'unique_solamo', tagline: 'バランス型',
      growth: G6('C', 'C', 'C', 'C', 'C', 'C'),
      image: fz({ src: './assets/monsters/2p5d/solamo.webp', w: 720, h: 688 }), }),   // 2026-10-11：2.5D 正式原本の表示用。旧 2D は assets/monsters/solamo.png（ファイルだけ残す）
    fz({ id: 1, key: 'gauru', name: 'ガウル', en: 'GAURU', kind: '鳥種', personality: null, formerNames: fz(['ハヤテ']),
      base: fz({ li: 80, po: 110, in: 110, hi: 90, ev: 90, de: 60 }), speed: 7, uniqueSkill: 'unique_gauru', tagline: '攻撃に特化したアタッカー',
      growth: G6('D', 'B', 'B', 'C', 'B', 'E'),
      image: fz({ src: './assets/monsters/2p5d/gauru.webp', w: 720, h: 663 }), }),
    fz({ id: 2, key: 'nobiton', name: 'ノビトン', en: 'NOBITON', kind: '獣種', personality: null, formerNames: fz([]),
      base: fz({ li: 140, po: 80, in: 120, hi: 100, ev: 70, de: 110 }), speed: 2, uniqueSkill: 'unique_nobiton', growth: G6('B', 'D', 'D', 'D', 'E', 'C'), tagline: 'のびる・たれる・くっつく。不思議な鼻（くち）を持つ、マイペースなモンスター。',
      image: fz({ src: './assets/monsters/2p5d/nobiton.webp', w: 720, h: 657 }),
      silhouette: fz({ src: './assets/monsters/2p5d/nobiton_silhouette.webp', w: 720, h: 657 }) }),
    // ジオル：英字表記は正式仕様に未記載のため null（推測で決めない）
    fz({ id: 3, key: 'jiol', name: 'ジオル', en: null, kind: '岩石種', personality: 'のんびり・おとなしい', formerNames: fz([]),
      base: fz({ li: 120, po: 150, in: 80, hi: 70, ev: 30, de: 160 }), speed: 1, uniqueSkill: 'unique_jiol', tagline: null, growth: G6('C', 'A', 'E', 'D', 'E', 'A'),   // 成長適性（2026-10-02 正式）
      image: fz({ src: './assets/monsters/2p5d/jiol.webp', w: 720, h: 667 }), }),
  ]);
  // ---- 登録のみ・未解禁のモンスター（2026-10-15 N11 正式：フルーネ）----
  //  SPECIES（市場・図鑑・合体・野生・大会の相手・初期選択が読む表）とも RIVAL_MONSTERS とも別の表＝byId／byKey では引けない
  //  ＝どの画面にも出ない・入手できない・バトルに出ない。解禁はユーザーの指示があってから（unlocked:false のまま）。
  //  番号 5 は予約だけ（セーブの m.sp に入ることは無い）。SPECIES の 0〜3・レグナスのバトルの絵の番号 4（js/battle/rival-partner.js の SPRITE）と重ならない。
  //   調べた表：SPECIES・index.html の IMG（＝SPECIES＋IMG[4]）と旧 SP（2種）・VICTORY_IMG（0〜4）・js/battle/arena.js の IDLE／SCALE（0〜4）・
  //   js/battle/rules.js の SPECIES（0〜4）・MMP8L の種族数（SP.length）・MMCH.foeSpecies（SP.length）・reactions（ev.sp 0〜4）＝5 はどこにも無い（tests/flurene-1015.test.mjs）。
  //  技は名前と習得区分だけ（威力・命中・クリティカル・効果は未提供＝持たない）。learn：initial＝初期・po／in／hi／ev／de＝その特訓・deOrder＝丈夫さの何回目。
  //  固有スキルは原文の効果だけ（回復量の丸め・判定の順・二重発動の防ぎ方は未確定＝params なし・バトルに入れない）。
  //  画像：原本（1254×1254 の透過 PNG）はリポジトリに置かない。表示用の派生＝tools/next1015/derive.py（README.md に sha256）。
  const PENDING_SPECIES = fz([
    fz({ id: 5, key: 'flurene', name: 'フルーネ', en: null, kind: '植物系', personality: null, formerNames: fz([]), unlocked: false, playerAvailable: false,
      base: fz({ li: 150, po: 70, in: 110, hi: 90, ev: 60, de: 70 }), speed: 4, growth: G6('A', 'E', 'C', 'D', 'E', 'D'),
      uniqueSkill: fz({ id: 'unique_flurene', name: '生命の芽吹き', implemented: false, params: null,
        desc: '攻撃を受けた後、残りライフが最大ライフの50％以下になり、生き残っていた場合、1戦闘に1回だけ最大ライフの10％を回復する。' }),
      moves: OFFICIAL_MOVES.flurene.list,   // 2026-10-18 REV3 F0-4：正式10技（上の OFFICIAL_MOVES.flurene の1か所）
      image: fz({ src: './assets/monsters/2p5d/flurene.webp', w: 705, h: 720 }),
      battleIdle: fz({ src: './assets/battle/idle/idle_flurene.webp', w: 730, h: 720 }),
      tourIcon: fz({ src: './assets/tournament/icons_1015/icon_flurene.webp', w: 256, h: 256 }) }),
    // 2026-10-17 ラズック（正式10技性能表・ユーザー最終決定）：番号 6（予約）。能力・成長・素早さ・固有スキル・技は確定。入手・解禁は未決（unlocked:false）
    //  絵：正式の 2.5D 立ち絵はリポジトリに無い＝バトル待機の参考画像（Razuck_BattleIdle_FinalAlpha_Reference.png・透過）から作った派生を QA だけで使う（art:'reference'）。
    //  対戦表・VS・表情・技カードは制作候補（ユーザーの美術承認前）＝QA の比較だけ（tools/razuck1017/derive_art.py・README に sha256）
    fz({ id: 6, key: 'razuck', name: 'ラズック', en: null, kind: '小型獣', personality: null, formerNames: fz([]), unlocked: false, playerAvailable: false, art: 'reference',
      base: fz({ li: 100, po: 75, in: 75, hi: 115, ev: 120, de: 75 }), speed: 9, growth: G6('D', 'D', 'E', 'B', 'A', 'E'),
      uniqueSkill: UNIQUE_SKILLS.unique_razuck,
      image: fz({ src: './assets/battle/idle/idle_razuck.webp', w: 0, h: 0 }),
      battleIdle: fz({ src: './assets/battle/idle/idle_razuck.webp', w: 0, h: 0 }),
      tourIcon: fz({ src: './assets/tournament/icons_1015/icon_razuck.webp', w: 256, h: 256 }) }),
    // 2026-10-18 カルシェル（正式納品 Mismon_Kalshell_OfficialPackage_ForDev_20261018＝Kalshell_DevAssets_Part01〜07・ユーザー承認済みの仕様と素材）：番号 7（予約）。
    //  能力・成長適性・素早さ・固有スキル「かたい貝殻」・10技（OFFICIAL_MOVES.kalshell＝SK 70〜79）は確定。**入手方法・出現場所は未決**（ユーザーが後日決める）＝unlocked:false・
    //  市場・野生・合体・大会・初期所持・図鑑には出ない（byId／byKey では引けない）。種族表示名「甲殻種」は【要確認／仮置き】＝kind は null（確定表示しない・候補は kindCandidate）。
    //  プロフィール画像は納品に無い（全モンスター一括制作の予定）＝profileImage null（捏造しない）。絵・声の派生＝tools/kalshell1018/（各 README に原本と派生の sha256）。体格サイズ 3（js/battle/move-tune-1015.js の SIZE）
    fz({ id: 7, key: 'kalshell', name: 'カルシェル', en: null, kind: null, kindCandidate: '甲殻種【要確認／仮置き】', motif: 'ヤドカリ＋巻き貝＋海系', size: 3, personality: null, formerNames: fz([]),
      unlocked: false, playerAvailable: false, obtain: null,
      base: fz({ li: 105, po: 90, in: 70, hi: 100, ev: 65, de: 130 }), speed: 4, growth: G6('C', 'C', 'D', 'C', 'D', 'A'),
      uniqueSkill: UNIQUE_SKILLS.unique_kalshell,
      moves: OFFICIAL_MOVES.kalshell.list,
      image: fz({ src: './assets/monsters/2p5d/kalshell.webp', w: 720, h: 680 }),
      battleIdle: fz({ src: './assets/battle/idle/idle_kalshell.webp', w: 859, h: 720 }),
      tourIcon: fz({ src: './assets/tournament/icons_1015/icon_kalshell.webp', w: 256, h: 256 }),
      vsArt: fz({ src: './assets/tournament/vs_1017/vs_kalshell.webp', w: 512, h: 512 }),
      profileImage: null }),
    // 2026-10-19 ミュロル（正式納品「ミュロル 開発本体向け 正式素材仕様一式」PART01〜07・ユーザー承認済みの仕様マスターと採用状態一覧）：番号 8（予約）。
    //  能力・成長適性・素早さ・サイズ 2・固有スキル「しめったはだ」・10技（OFFICIAL_MOVES.myurol＝SK 80〜89）は確定。**入手方法は未決**（仕様マスターの「出現想定：Chapter2 野生モンスター」は想定だけ＝出現させない）＝unlocked:false・
    //  市場・野生・合体・大会・初期所持・図鑑には出ない（byId／byKey では引けない）。種族表示名「水棲種」は［要確認／仮置き］＝kind は null（確定表示しない・候補は kindCandidate）。
    //  プロフィール画像は納品に無い（全モンスター一括制作の予定）＝profileImage null（捏造しない）。絵・声の派生＝tools/myurol1019/（各 README に原本と派生の sha256）。体格サイズ 2（js/battle/move-tune-1015.js の SIZE）
    fz({ id: 8, key: 'myurol', name: 'ミュロル', en: null, kind: null, kindCandidate: '水棲種【要確認／仮置き】', motif: 'ウーパールーパー系の水陸両用モンスター', size: 2, personality: null, formerNames: fz([]),
      unlocked: false, playerAvailable: false, obtain: null,
      base: fz({ li: 110, po: 70, in: 105, hi: 100, ev: 95, de: 80 }), speed: 6, growth: G6('C', 'E', 'C', 'B', 'C', 'E'),
      uniqueSkill: UNIQUE_SKILLS.unique_myurol,
      moves: OFFICIAL_MOVES.myurol.list,
      image: fz({ src: './assets/monsters/2p5d/myurol.webp', w: 720, h: 646 }),
      battleIdle: fz({ src: './assets/battle/idle/idle_myurol.webp', w: 928, h: 720 }),
      tourIcon: fz({ src: './assets/tournament/icons_1015/icon_myurol.webp', w: 256, h: 256 }),
      vsArt: fz({ src: './assets/tournament/vs_1017/vs_myurol.webp', w: 512, h: 512 }),
      profileImage: null }),
  ]);
  /** 登録のみの種族（番号でも文字IDでも）。無ければ null。画面の処理には使わない（解禁していない） */
  const pendingSpecies = (ref) => PENDING_SPECIES.find((x) => (typeof ref === 'string' ? x.key === ref : x.id === ref)) || null;
  // ---- 種族IDの役割（二重管理にしない：1つの種族レコードが両方を持つ） ----
  //  id（0〜3の番号）…既存互換用。セーブの m.sp・旧SP表・fight() などの既存コードは番号のまま使う（変更・削除しない）。
  //  key（solamo 等） …新規参照用。画像アセット・マスター参照・市場・将来の技／亜種／合体／図鑑はこちらを使う。
  //  個体データ（セーブ）には番号だけを保存し、文字IDは keyOf(m.sp) でその都度引く（保存しないので食い違いが起きない）。
  const byId = (sp) => SPECIES.find((s) => s.id === sp) || null;
  const byKey = (key) => SPECIES.find((s) => s.key === key) || null;
  const keyOf = (sp) => { const s = byId(sp); return s ? s.key : null; };
  const idOf = (key) => { const s = byKey(key); return s ? s.id : null; };
  const pick = (ref) => (typeof ref === 'string' ? byKey(ref) : byId(ref));
  /** 正式画像（番号でも文字IDでも引ける）。画面はここからだけ画像を取る */
  const imageOf = (ref) => { const s = pick(ref); return s ? s.image : null; };
  const silhouetteOf = (ref) => { const s = pick(ref); return (s && s.silhouette) || null; };
  const speedOf = (sp) => { const s = byId(sp); return s ? s.speed : null; };
  const baseOf = (sp) => { const s = byId(sp); return s ? { ...s.base } : null; };
  const skillOf = (sp) => { const s = byId(sp); return s ? UNIQUE_SKILLS[s.uniqueSkill] : null; };
  /** プレイヤー向けの固有スキル説明（内部専用の数値は出さない。説明文自体が内部数値を含まない） */
  // 成長適性：個体に正式な適性（m.growth＝合体個体など将来用）があればそれ、無ければ種族の適性。種族の適性が未登録（今は4原種とも登録済み）なら
  //  GROWTH_UNREGISTERED（C＝【暫定】。新しい種族は SPECIES の growth を書くだけ）。上昇量は GROWTH_GAIN の1か所だけで決める
  const GROWTH_UNREGISTERED = 'C';
  const isGrade = (g) => GROWTH_GRADES.includes(g);
  function growthOf(m, key) {
    const own = m && m.growth && typeof m.growth === 'object' ? m.growth[key] : null; if (isGrade(own)) return own;
    const s = m ? byId(m.sp) : null, g = s && s.growth ? s.growth[key] : null;
    return isGrade(g) ? g : GROWTH_UNREGISTERED;
  }
  /** 能力マスの上昇量。ch＝Chapter（省略＝個体の今の Chapter。Chapter の外は Chapter 2 の表＝従来の GROWTH_GAIN） */
  const growthGain = (m, key, ch) => { const c = ch != null ? ch : (m && m.raise && m.raise.ch != null ? m.raise.ch : null); return (c == null ? GROWTH_GAIN : gainTable(c))[growthOf(m, key)]; };
  const growthRegistered = (sp) => { const s = byId(sp); return !!(s && s.growth); };
  const skillText = (sp) => { const k = skillOf(sp); return k ? { name: k.name, desc: k.desc } : null; };

  /**
   * 個体の素早さ（正式フィールド名 speed）を保証する：種族 → 正式マスター → speed → 個体。
   *  ・speed が無い／1〜10の整数でない個体だけ、その種族の正式値を入れる（既存の正しい値は変えない）
   *  ・正式マスターに無い種族は何もしない
   *  新しい個体の生成時とセーブ（v4〜v6）の読み込み時に、MMP8 の補正フックから呼ばれる。
   */
  function ensureSpeed(m) {
    if (!m || isValidSpeed(m.speed)) return m;
    const v = speedOf(m.sp);
    if (v != null) m.speed = v;
    return m;
  }
  if (root.MMP8 && typeof root.MMP8.addIndividualNormalizer === 'function') root.MMP8.addIndividualNormalizer(ensureSpeed);

  // ---- お金と市場（正式値。ゲームの購入処理・初期所持金への反映は市場Step〔Step 4〕で行う） ----
  // 2026-10-06 正式：新しいゲームの所持金は 0G。聖獣士登録の新人支援で 1000G（index.html の grantSupport）→ 市場で 500G の1体を迎えて 500G 残る。
  //  旧（2026-10-05 まで）：初期 300G＋市場で 500G に満たなければ補填＝初回購入救済。救済の判定は古いセーブの詰み防止として残す（通常の新規プレイでは所持金が足りるので出ない）
  const ECONOMY = fz({ initialGold: 0, marketPrice: 500 });
  //  市場に存在するモンスター（並び順＝カルーセルの順）。ジオルは市場に存在しない（入れない）。
  //  status：'sale'（販売中）／'waiting'（入荷待ち＝購入不可。ロック・未解放ではない）
  const MARKET_CATALOG = fz([
    fz({ key: 'solamo', status: 'sale', price: ECONOMY.marketPrice }),
    fz({ key: 'gauru', status: 'sale', price: ECONOMY.marketPrice }),
    fz({ key: 'nobiton', status: 'waiting' }),
  ]);

  // ---- 市場での購入（Phase 10 Step 4） ----
  // 2026-10-04 PHASE H3：牧場は最大20体（正式。旧「手持ち＋牧場で8体・牧場7体」は正式ではない）。所持上限＝牧場20＋連れている1体（旧ルールと同じ組み立て）
  // 2026-10-06：牧場は最大8体（ユーザー指示「牧場上限は8体・0/8」。2026-10-04 PHASE H3 の 20体から戻した）。所持上限＝牧場8＋連れている1
  const RANCH_LIMIT = 20, OWN_LIMIT = RANCH_LIMIT + 1;   // 2026-10-14 ユーザー正式決定：牧場は最大20体（連れている1体＝所持21体）。旧 2026-10-06 の8体は撤回
  const marketItem = (key) => MARKET_CATALOG.find((c) => c.key === key) || null;
  /**
   * 初回購入救済：手持ち0体・牧場0体・所持金が500G未満のときだけ、市場での購入操作の時点で所持金を500Gにする。
   *  「所持金500G未満ならいつでも補填」ではない（1体でも所有していれば補填しない）。ゲーム開始時や他の画面では起きない。
   *  1体以上所有しているときの行き詰まりは、下の継続用救済（continueRescueApplies）が別の条件で扱う。
   */
  const firstPurchaseRescueApplies = (S, owned) => owned === 0 && (S.g || 0) < ECONOMY.marketPrice;
  // ---- 継続用救済（初回救済とは別の独立した条件。市場価格・購入条件・合体料金は変えない） ----
  //  次の育成を続けられる個体（未育成・育成中）が手持ち・牧場に1体もおらず（＝全員が育成完了）、所持金が500G未満で、
  //  今の個体数と所持金では合体（200G）もできない（または合体の画面へ行けない）ときだけ、通常販売中の500Gのモンスターの購入を確定する時点で
  //  不足分を補い、所持金を500Gにして通常どおり購入する（購入後は0G）。
  //  補填は purchase()（購入の確定処理）の中だけで行い、確定前の所持金には加えない（アイテム購入・合体費用には使えない）。
  //  手持ち・牧場とも0体のときは初回救済の対象で、ここでは扱わない。所持上限（OWN_LIMIT）の判定もこれまでどおり先に行う。
  const FUSION_COST = 200;   // 合体費用（index.html の fuse() と同じ値。判定の参照用で、合体料金はここでは決めない）
  //  合体を今プレイヤーが使えるか（画面から合体へ行けるか）。合体の処理（fuse など）が残っていても、画面から行けなければ使えない扱い。
  //  2026-09-30：合体は牧場から外し、研究所の合体UIは未実装 → 既定は「使えない」。研究所の合体UIを作ったら、
  //  その画面を出す側で MMP10M.setFusionAccess(() => true)（または開ける条件を返す関数）を登録すれば、救済の判定に合体が戻る。セーブには持たない。
  let fusionAccess = () => false;
  function setFusionAccess(fn) { fusionAccess = typeof fn === 'function' ? fn : () => false; }
  function fusionAvailable(S) { try { return !!fusionAccess(S); } catch (e) { return false; } }
  const ownedMonsters = (S) => [S && S.m, ...(S && Array.isArray(S.box) ? S.box : [])].filter(Boolean);
  const raiseStateOf = (m) => { const P7 = root.MMP7; return P7 && typeof P7.raiseState === 'function' ? P7.raiseState(m) : ((m && m.raise && m.raise.state) || 'none'); };
  function continueRescueApplies(S, key, owned) {
    const c = marketItem(key);
    if (!S || !c || c.status !== 'sale' || c.price !== ECONOMY.marketPrice) return false;   // 通常販売中の500Gのモンスターだけ
    if ((S.g || 0) >= ECONOMY.marketPrice) return false;                                        // 500G以上なら通常どおり代金だけ
    const mons = ownedMonsters(S);
    if (!mons.length || owned !== mons.length) return false;                                     // 0体は初回救済の対象
    if (!mons.every((m) => raiseStateOf(m) === 'done')) return false;                            // 未育成・育成中の個体がいれば発動しない
    if (fusionAvailable(S) && mons.length >= 2 && (S.g || 0) >= FUSION_COST) return false;      // 合体を使えて、今の所持金で合体できるなら発動しない
    return true;
  }
  /** 購入できるか：not_in_market（市場に無い：ジオルなど）/ waiting（入荷待ち）/ full（所持上限 OWN_LIMIT）/ no_money
   *  rescue＝初回救済（従来どおり）、continueRescue＝継続用救済（確定時に不足分を補填） */
  function canPurchase(S, key, owned) {
    const c = marketItem(key);
    if (!c) return { ok: false, reason: 'not_in_market' };
    if (c.status !== 'sale') return { ok: false, reason: 'waiting' };
    if (owned >= OWN_LIMIT) return { ok: false, reason: 'full' };
    const rescue = firstPurchaseRescueApplies(S, owned);
    if (!rescue && (S.g || 0) < c.price) {
      if (continueRescueApplies(S, key, owned)) return { ok: true, price: c.price, rescue: false, continueRescue: true };
      return { ok: false, reason: 'no_money' };
    }
    return { ok: true, price: c.price, rescue };
  }
  /** 代金の支払い（個体の生成は既存の個体生成処理で行う）。救済が発生したら、この確定処理の中でだけ所持金を500Gにしてから支払う */
  function purchase(S, key, owned) {
    const c = canPurchase(S, key, owned); if (!c.ok) return c;
    const before = S.g || 0;
    if (c.rescue || c.continueRescue) S.g = ECONOMY.marketPrice;
    S.g -= c.price;
    const r = { ok: true, key, price: c.price, rescued: c.rescue, before, after: S.g };
    if (c.continueRescue) Object.assign(r, { continueRescued: true, topUp: ECONOMY.marketPrice - before });
    return r;
  }

  // ---- モンスター売却（牧場） ----
  //  未育成＝50G。育成完了＝100G＋育成中に増えた6能力（ライフ・ちから・かしこさ・命中・回避・丈夫さ）の合計（上限150G）
  //  ＋その個体自身の最高到達公式ランクの加算（E25・D50・C75・B100・A125・S150G、未到達0G）。最終売却額は最大400G（市場価格500G未満）。
  //  能力上昇＝育成開始時（m.raise.startStats）と育成完了時（m.raise.endStats）の差（1回の育成全体。MMP8 が記録）。
  //  記録の無い旧セーブは推測せず0G（基本額とランク加算だけ）。育成中の個体がいるとき・最後の1体は売却できない。
  const SELL = fz({ unraised: 50, base: 100, gainCap: 150, max: 400, rankBonus: fz([25, 50, 75, 100, 125, 150]) });
  const SELL_STATS = fz(['li', 'po', 'in', 'hi', 'ev', 'de']);
  const statsOk = (x) => !!x && typeof x === 'object' && SELL_STATS.every((k) => Number.isFinite(x[k]));
  const statTotal = (x) => SELL_STATS.reduce((a, k) => a + x[k], 0);
  function topRankOf(m) { const rc = m && m.prog && Array.isArray(m.prog.rankClr) ? m.prog.rankClr : []; let h = -1; rc.forEach((v, i) => { if (v === true && i < SELL.rankBonus.length) h = i; }); return h; }
  /** 売却額（個体単体の見積もり）：{ok, kind:'unraised'|'done', price, base, gain（上限後）, gainRaw（上限前）, gainKnown, rankIdx, rank} / 育成中は raising */
  function sellQuote(m) {
    if (!m) return { ok: false, reason: 'not_found' };
    const st = raiseStateOf(m);
    if (st === 'none') return { ok: true, kind: 'unraised', price: SELL.unraised };
    if (st !== 'done') return { ok: false, reason: 'raising' };
    const r = m.raise || {}, known = statsOk(r.startStats) && statsOk(r.endStats);
    const gainRaw = known ? Math.max(0, statTotal(r.endStats) - statTotal(r.startStats)) : 0, gain = Math.min(SELL.gainCap, gainRaw);
    const rankIdx = topRankOf(m), rank = rankIdx >= 0 ? SELL.rankBonus[rankIdx] : 0;
    return { ok: true, kind: 'done', price: Math.min(SELL.max, SELL.base + gain + rank), base: SELL.base, gain, gainRaw, gainKnown: known, rankIdx, rank };
  }
  /** 売却できるか：raising（育成中の個体がいる）/ not_found / last（最後の1体） */
  function canSell(S, uid) {
    const mons = ownedMonsters(S);
    if (mons.some((x) => { const s = raiseStateOf(x); return s !== 'none' && s !== 'done'; })) return { ok: false, reason: 'raising' };
    const m = uid == null ? null : mons.find((x) => x.uid === uid);
    if (!m) return { ok: false, reason: 'not_found' };
    if (mons.length <= 1) return { ok: false, reason: 'last' };
    const q = sellQuote(m); if (!q.ok) return q;
    return { ...q, m };
  }
  /** 売却の確定：選んだ個体だけを手持ち・牧場から外し、売却額を1回だけ加える（同じ個体はもう見つからないので二重にならない） */
  function sell(S, uid) {
    const c = canSell(S, uid); if (!c.ok) return c;
    const before = S.g || 0, m = c.m;
    if (S.m === m) S.m = null; else { const j = S.box.indexOf(m); if (j < 0) return { ok: false, reason: 'not_found' }; S.box.splice(j, 1); }
    S.g = before + c.price;
    return { ok: true, uid, name: m.name, sp: m.sp, kind: c.kind, price: c.price, before, after: S.g };
  }

  // ---- ノビトンの入荷条件（正式：育成完了5回後） ----
  //  育成完了回数は MMP8.raiseDoneCount（育成完了1回につき1回だけ加算。購入・合体・再読込では増えない）。
  //  条件を満たしても販売（購入）は始めない：販売に必要な正式データ（技・入荷イベントなど）が未確定のため、
  //  MARKET_CATALOG の status は 'waiting'（購入不可）のまま。ここは条件の判定と表示用の値だけを返す。
  const NOBITON_STOCK_RAISES = 5;
  function nobitonStock(S) {
    const P8 = root.MMP8, done = P8 && typeof P8.raiseDoneCount === 'function' ? P8.raiseDoneCount(S) : 0;
    return { need: NOBITON_STOCK_RAISES, done, met: done >= NOBITON_STOCK_RAISES,
      fromStart: !!(P8 && typeof P8.raiseCountFromStart === 'function' && P8.raiseCountFromStart(S)) };
  }

  root.MMP10M = fz({ STAT_KEYS, STAT_LABELS, STAT_MAX, SPEED_MIN, SPEED_MAX, isValidSpeed, UNIQUE_SKILLS, SPECIES, RIVAL_MONSTERS, rivalMonster, OFFICIAL_MOVES, movesOf, moveBySlot,
    byId, byKey, keyOf, idOf, imageOf, silhouetteOf, speedOf, baseOf, skillOf, skillText, ensureSpeed, ECONOMY, MARKET_CATALOG,
    GROWTH_GRADES, GROWTH_GAIN, GROWTH_GAIN_BY_CH, GROWTH_UNREGISTERED, growthOf, growthGain, growthRegistered,
    PENDING_SPECIES, pendingSpecies,
    OWN_LIMIT, RANCH_LIMIT, marketItem, canPurchase, purchase, FUSION_COST, setFusionAccess, fusionAvailable, continueRescueApplies, SELL, sellQuote, canSell, sell, NOBITON_STOCK_RAISES, nobitonStock });
})(typeof window !== 'undefined' ? window : globalThis);
