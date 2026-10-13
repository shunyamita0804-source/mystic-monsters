// =========================================================
// Audio Registry（2026-10-02）：正式な BGM・SE の対応表。ここだけを変えれば曲・SE を差し替えられる（画面やイベントのコードにファイル名は無い）
//  BGM_REGISTRY：場面（MMAUDIO.SCENES）→ { src, gain, loop, fallback }
//    src      ：ファイル（文字列）。配列なら先頭から順に、そのブラウザで再生できる形式を選ぶ（例：['….ogg', '….m4a']）
//    gain     ：素材ごとの音量の補正（1＝そのまま。素材の元音量の差をここで合わせる。ファイルは加工しない）
//    loop     ：既定 true
//    fallback ：この場面に曲が無いとき、代わりに使う場面（例：RARE_WILD_BATTLE は WILD_BATTLE の曲）。専用の曲が届いたら src を書く
//    登録の無い場面は index.html の合成音（LEGACY_BGM）で鳴る
//  SE_REGISTRY：出来事（MMAUDIO.SE）→ { src, gain }。登録の無い出来事は合成音（index.html の LEGACY_SE。表に無いものは鳴らない）
//  ファイルの置き場：assets/audio/bgm/<素材パック>/、assets/audio/se/<素材パック>/（出どころ・ライセンスは AUDIO_CREDITS.md）
//  音量の目安：BGM は約 -18 LUFS、SE は約 -16 LUFS に gain でそろえる（ピークが 0 dBFS を超えないよう上限あり）
//  【暫定】2026-10-02 夜の選定 → 2026-10-03 に iPhone の試遊の結果で見直し（NG は silent）→ 同日 第3弾（alkakrab Vol.3 を採用。HydroGene 16-bit は今回は不採用）→ 第4弾で NG の曲を無音に → 第5弾で街・ファーム・特訓・Chapter 1〜4・大会（受付〜結果）に HydroGene 16-bit を仮採用。曲名・解析で選んだもので、最終判断は試聴。PGS の曲は暫定の試遊用（新しく採用しない）
// =========================================================
(function (root) {
  'use strict';
  const BGM_DIR = './assets/audio/bgm/', SE_DIR = './assets/audio/se/';
  const PGS = BGM_DIR + 'pgs_fantasy_rpg/';            // PGS Fantasy RPG Music Pack（JP Soundworks。CC BY 4.0）
  const UI = SE_DIR + 'interface_sfx_pack_1/';        // Interface SFX Pack 1（ObsydianX。CC0）
  const IV = SE_DIR + 'ivokard/';                     // Mix of SFX by Ivokard（CC0）
  const AK = BGM_DIR + 'alkakrab_fantasy_rpg_vol3/';  // alkakrab「Free 25 Fantasy RPG Game Tracks Vol.3」（商用利用可・クレジット任意。AUDIO_CREDITS.md）
  const AKSE = SE_DIR + 'alkakrab_fantasy_rpg_vol3/'; // 同じパックの Fx（短い効果音）
  const HG = BGM_DIR + 'hydrogene_16bit_rpg/';         // HydroGene「High Quality 16-bit RPG Music」（CC0。AUDIO_CREDITS.md）
  const MMO = SE_DIR + 'mystic_monsters_official/';
  const MMO12 = SE_DIR + 'mystic_monsters_official_1012/';   // 2026-10-12 正式 SE 3種（ユーザー納品・Pixabay。MP3 を OGG Vorbis q5 に変換しただけ。AUDIO_CREDITS.md）   // ミスティックモンスターズの正式素材（ユーザー提供・2026-10-04。AUDIO_CREDITS.md）
  const LIC = BGM_DIR + 'licensed_20261007/';        // 2026-10-07 正式採用の BGM 14曲（DOVA-SYNDROME・Pixabay・itch.io。ユーザー提供の MP3／WAV を OGG Vorbis q5 に変換しただけ・曲の切り出しはしない。作者・出典は AUDIO_CREDITS.md）
  const LIC8 = BGM_DIR + 'licensed_20261008/';
  const LIC12 = BGM_DIR + 'licensed_20261012/';      // 2026-10-12 正式採用：公式ランク戦の曲（ユーザー納品「公式ランク.mp3」を OGG Vorbis q5 に変換しただけ。作曲者・出典は AUDIO_CREDITS.md＝要確認）       // 2026-10-08 正式採用：街の曲「冒険への誘い」（ユーザー提供の MP3 を OGG Vorbis q5 に変換しただけ。AUDIO_CREDITS.md）
  const CR = SE_DIR + 'crowd_1013/';                    // 2026-10-13 開発24：観客の声（Pixabay：DRAGON-STUDIO・Universfield。区間の切り出しはユーザー提供。AUDIO_CREDITS.md）
  const VO = './assets/audio/voice/npc_1013/';          // 2026-10-13 開発24：NPC のボイス（ユーザー提供の試遊素材）
  const MMB = BGM_DIR + 'mystic_monsters_official/';  // 同じく正式の BGM（2026-10-06：タイトル・プロローグ。ユーザー提供・ゲームの所有素材。AUDIO_CREDITS.md）

  // 書き方：{ src, gain, loopStart, loopEnd, loopXfade } ＝ファイルで鳴らす（loopEnd を書くと、曲の終わりのフェードアウトの前で loopStart へクロスフェードで戻る。秒）／{ fallback: '場面' } ＝ほかの場面の曲を使う／{ silent: true } ＝鳴らさない（合成音にも落とさない。試遊で「合わない」となった音の一時的な置き場）／行が無い ＝合成音
  //  【2026-10-03 実機試遊（iPhone）の結果】で NG になった音は silent にした（追加の音源パックで選び直す。行の横の「待ち」）
  const BGM_REGISTRY = {
    // ---- 開始画面・街・施設 ----
    TITLE:      { silent: true },   // 2026-10-05 PHASE B 正式：開始画面に BGM は無い（無音で開始画面 → 開始の音 TITLE_START → Scene 1 でプロローグ BGM）。旧タイトル曲（mystic_monsters_title_theme_official.ogg）は廃止・ファイルも置かない
    PROLOGUE:   { silent: true },   // 2026-10-06 重大修正：プロローグの音がプツプツ鳴る＝プロローグ BGM は一旦削除（鳴らさない・合成音にも落とさない。ファイルも置かない）。プロローグの時刻表・本文・スキップは変えない
                                     //  旧 54.2秒版と同じファイル名なので ?v=v6 で端末のキャッシュ（旧い曲）を使わない
    // 2026-10-07 正式：プロローグは Scene ごとに1曲（各曲の頭から・loop なし＝Scene は約7.8〜9.7秒。2026-10-08 に延長）。index.html の proPlay が Scene の切り替えで PROLOGUE_1〜6 へ（短いクロスフェード）
    PROLOGUE_1: { src: LIC + '01_prologue_peace.ogg', gain: 0.54, loop: false },          // 穏やかで少しワクワクする今日 / 今川彰人オーケストラ（-12.6 LUFS → 約 -18）
    PROLOGUE_2: { src: LIC + '02_prologue_calamity.ogg', gain: 0.35, loop: false, start: 0.6 },   // 2026-10-09 試遊（切り替えのあと曲が鳴り始めるのが遅い）：頭の約1.5秒は小さな音から盛り上がる＝0.6秒から（先に鳴らす 1.0秒と合わせて、Scene 2 の切り替えの瞬間に盛り上がりの頂点）。       // 悪魔との戦闘 / 今川彰人オーケストラ（-9.0）
    PROLOGUE_3: { src: LIC + '03_prologue_hopeful.ogg', gain: 0.44, loop: false },        // Hopeful / Fukagawa（-10.9）
    PROLOGUE_4: { src: LIC + '04_prologue_legend_battle.ogg', gain: 0.52, loop: false },  // 高貴なる戦闘 / 香居（-12.4）
    PROLOGUE_5: { src: LIC + '05_prologue_tournament.ogg', gain: 0.42, loop: false, start: 0.38 },     // Tournament / Ebunny（-10.4）。2026-10-08 監査 M-12：頭に 0.88秒の無音があり、先に鳴らす 0.5秒（PRO_AUDIO_LEAD）を越えて Scene 5 の切り替え直後に約0.38秒の無音＝0.38秒から鳴らす（ファイルは加工しない）
    PROLOGUE_6: { src: LIC + '06_prologue_departure.ogg', gain: 0.68, loop: false, start: 0.3 },   // 2026-10-09 試遊：頭の約0.3秒はほぼ無音＝0.3秒から。      // Bon Voyage! / HarumachiMusic（-14.7）
    CEDRIC:     { src: LIC + '07_cedric_pre_tournament.ogg', gain: 0.3, start: 1.3, loopStart: 1.3, loopEnd: 378.5, loopXfade: 1 },   // 2026-10-09 試遊（鳴り始めが遅い）：頭の約1.3秒の無音を飛ばす（ループも 1.3秒へ）。鳴らし始めはランク開始の演出と同時（index.html の p9TourOpen）。   // セドリックの大会前の導入：REACH FOR the FATE / Keyta（-9.5 → 会話が聞こえる約 -20）
    ARENA:      { src: LIC + '11_arena_swords_at_midnight_loop.ogg', gain: 0.67 },          // 闘技場の施設の曲：Swords At Midnight Loop（ループ素材・-14.5）。闘技場の画面は未実装（ロック中）＝登録だけで、今はどこからも鳴らさない
    BUREAU:     { src: MMB + 'mystic_monsters_bureau_bgm_official.ogg', gain: 0.46, loopStart: 0, loopEnd: 45.7, loopXfade: 0.25 },   // 2026-10-05 PHASE B 正式 v6：聖獣士管理局（46.0秒・-13.2 LUFS → gain 0.46 で約 -20＝会話が聞き取れる音量）。終わりの短いフェードの前で頭へ戻してループ
    TOWN:       { src: LIC8 + 'town_bouken_e_no_izanai.ogg', gain: 0.7, loopStart: 0, loopEnd: 178.6, loopXfade: 1.2 },     // 2026-10-08 正式採用「冒険への誘い」（-15.1 LUFS → 約 -18）。182.7秒のうち 179秒から末尾は無音＝曲が消えきる手前 178.6秒で頭へ 1.2秒のクロスフェード（ファイルは加工しない）。旧：HydroGene「Lively City」（第5弾の仮採用）     // 2026-10-03 第5弾の仮採用：HydroGene「Lively City」65秒・明るい長調（第4弾で NG の Tranquil Radiance は使わない）
    MARKET:     { src: PGS + 'town_village_theme_2.ogg', gain: 0.9 },   // 試遊で OK（変更しない）
    RANCH:      { src: PGS + 'town_village_theme_3.ogg', gain: 0.8 },   // 77秒・温かい【暫定】
    LABORATORY: { src: PGS + 'event_music_2.ogg', gain: 0.65 },        // 103秒・ゆっくり・神秘的【暫定】
    FARM:       { src: HG + '04_peaceful_village.ogg', gain: 0.87 }, // 2026-10-03 第5弾の仮採用：HydroGene「Peaceful Village」86秒・穏やか（第4弾で NG の Lost River は使わない）
    TRAINING:   { src: HG + '20_military_base.ogg', gain: 0.74 },    // 2026-10-03 第5弾の仮採用：HydroGene「Military Base」49秒・行進曲調（旧：合成音）
    // ---- Chapter ----（2026-10-05 試遊：buffer: true＝デコードした音で鳴らす（iPhone で途切れない・バトルから戻ったら続きから）。曲・音量・ループ区間は変えていない）
    CHAPTER_1:  { buffer: true, src: HG + '07_spirits_forest_full.ogg', gain: 1.1, loopStart: 27.344, loopEnd: 81.98, loopXfade: 0.2 },   // 2026-10-03 第5弾の仮採用：HydroGene「Spirits Forest」82秒＝前奏 27.3秒＋ループ部 54.6秒（配布の intro／loop と同じ境目）。2周目からはループ部だけ
    CHAPTER_2:  { buffer: true, src: HG + '17_unknown_island.ogg', gain: 0.86 },   // 2026-10-03 第5弾の仮採用：海岸。HydroGene「Unknown Island」57秒（旧：合成音）
    CHAPTER_3:  { buffer: true, src: HG + '14_traveling_the_sky.ogg', gain: 0.66 }, // 2026-10-03 第5弾の仮採用：空。HydroGene「Traveling the Sky」70秒（旧：合成音）
    CHAPTER_4:  { buffer: true, src: HG + '15_volcanic_crater.ogg', gain: 0.57 },  // 2026-10-03 第5弾の仮採用：火山。HydroGene「Volcanic Crater」86秒（旧：合成音）
    // ---- 大会：受付（到着・ランク選択）→ 順位表 → 対戦相手の発表・能力比較 → 実戦 ----
    //  2026-10-03 第5弾の仮採用：大会の受付 → 順位表 → 対戦前 → 結果は HydroGene「Royal Castle」1曲。ENTRY だけに曲を書き、ほかは fallback＝同じファイルなので場面が変わっても鳴らし直さない（頭出ししない）。
    //  実戦（battle）の前は fight() の bgm("battle") で止め、FIGHT! のあと大会の戦闘曲。バトル後の順位表・結果でまた Royal Castle（頭から）。旧：PGS Event Music 4（第4弾で NG・使わない）
    TOURNAMENT_ENTRY:       { src: HG + '03_royal_castle.ogg', gain: 0.68, loopStart: 0, loopEnd: 64.28, loopXfade: 0.08 },   // 大会会場への到着・受付・ランク選択。64秒（ファイルの終わりと頭の波形に段差があるので、ごく短いクロスフェードで戻す）
    TOURNAMENT_LOBBY_LOW:   { src: LIC + '08_tournament_table_start17s.ogg', gain: 0.69, start: 17, loopStart: 17, loopEnd: 135.2, loopXfade: 1 },   // 2026-10-07 正式：大会1 対戦表＝Battle - スタンバイフェイズ / lei。17〜31秒の落ち着いた部分から（2026-10-09 ユーザー確認）・ループも 17秒へ。135.5秒からは終わりのフェード。iPhone で頭（前奏）から鳴っていた件は audio-manager の開始位置の合わせ直しで対処
    TOURNAMENT_LOBBY_HIGH:  { fallback: 'TOURNAMENT_LOBBY_LOW' },   // B〜S の対戦表も同じ曲
    TOURNAMENT_MATCHUP:     { src: LIC + '09_prebattle_compare_jingle.ogg', gain: 1.07, loop: false },   // 2026-10-07 正式：大会2 対戦前比較＝trumpetbuildup / theredshore（約12秒の短いジングル・ループしない。-18.6）
    RESULT:                 { fallback: 'TOURNAMENT_ENTRY' },   // 大会の結果（勝ち・負け共通）：Royal Castle
    // ---- 実戦（「FIGHT!」の開始音のあとで始まる）----
    WILD_BATTLE:            { src: LIC + '12_wild_battle.ogg', gain: 0.43, loopStart: 0, loopEnd: 108, loopXfade: 0.5 },   // 2026-10-07 正式：通常戦闘曲 - α / lei（-10.7。108.2秒からの無音の前で戻す）
    RARE_WILD_BATTLE:       { src: LIC + '13_rare_monster_battle.ogg', gain: 0.29 },   // 2026-10-07 正式：中ボスくらいの戦闘風 / Motoyuki（-7.2）
    RIVAL_BATTLE:           { src: LIC + '10_rival_battle.ogg', gain: 0.37, loopStart: 0, loopEnd: 202, loopXfade: 0.5 },   // 2026-10-07 正式：To The Death / Junipersona（-9.4。202.3秒からの無音の前で戻す）
    TOURNAMENT_BATTLE_LOW:  { src: LIC12 + 'official_rank_battle.ogg', gain: 0.89, loopStart: 0, loopEnd: 289.6, loopXfade: 0.6 },   // 2026-10-12 正式：公式ランク戦（E〜S 共通・実戦の間だけ）＝ユーザー納品「公式ランク.mp3」（291.3秒・-17.0 LUFS・頭の無音なし・289.8秒から終わりのフェード＝その前で頭へ 0.6秒のクロスフェード）。旧「戦いの旅路を征く」は SPECIAL_BATTLE に残す
    TOURNAMENT_BATTLE_HIGH: { fallback: 'TOURNAMENT_BATTLE_LOW' },   // 2026-10-07 正式：B〜S も同じ公式ランク戦の曲
    SPECIAL_BATTLE:         { src: LIC + '14_official_rank_battle.ogg', gain: 0.61, loopStart: 0, loopEnd: 233.4, loopXfade: 0.5 },   // 入口が無い（旧「師匠との特訓」）。2026-10-12：公式ランク戦の曲の差し替えに巻き込まないよう、従来の曲（戦いの旅路を征く / MATSU）を直接指す            // 入口が無い（旧「師匠との特訓」）。将来の特殊戦は上位の曲を仮に使う
  };

  const SE_REGISTRY = {
    // ---- UI（Interface SFX Pack 1）----
    TITLE_START: { src: MMO + 'title_start.ogg', gain: 0.8 },   // 2026-10-04 正式素材「Mystic Monsters Start Button SE」（ユーザー提供・-14.1 LUFS → gain 0.8 で約 -16）。タップの瞬間に鳴らし、約0.5秒で次の画面へ（音は止めない＝余韻は画面の切り替えのあとも自然に終わる）
    UI_CONFIRM:  { silent: true },   // ボタン全般・街のコマンド（通常のコマンドのタップ）：2026-10-03 第4弾の試遊で NG → 無音（代わりの音は選ばない）
    UI_CANCEL:   { src: UI + 'back_style_4_002.ogg', gain: 0.95 },
    UI_ERROR:    { src: UI + 'error_style_4_002.ogg', gain: 0.7 },
    UI_OPEN:     { src: UI + 'confirm_style_4_001.ogg', gain: 0.8 },
    UI_SELECT:   { src: UI + 'cursor_style_2.ogg', gain: 2.5 },        // 元が小さい（-26 LUFS）
    UI_TAB:      { src: UI + 'cursor_style_4.ogg', gain: 3.5 },        // 元が小さい（-29 LUFS）
    // ---- Chapter ----
    CHAPTER_START: { src: AKSE + 'fx_2.ogg', gain: 3.0 },              // 第3弾試遊候補：alkakrab Fx 2（2秒・低くふくらんで消える音）。元が小さい（-28 LUFS）
    DICE_THROW: { src: MMO + '01_dice_large_full.ogg', gain: 0.95 },   // 2026-10-06 正式：投げる → 着地 → 短く転がる → 停止 を1本にした完成 SE（2.05秒）。投げ始めに1回だけ（1ロール1回）。下の LAND／ROLL／STOP は鳴らさない（同じ音を重ねない）
    DICE_CUBE:  { src: SE_DIR + 'dice_1013/dice_cube_throw_land.ogg', gain: 0.9 },   // 2026-10-13 開発25 E：投げる音 → 回る間は無音 → 着地「トンッ、ト、トン」＋止まる光（tools/dice1013/se_cut.py＝下の 1012 版と比較用の着地音なし版から作った派生。音の時刻は同じ）。旧 1012 版はファイルを残す
    // DICE_CUBE（旧・2026-10-12）：2026-10-12 開発23 B 正式採用：立体サイコロ（MMDICE3D・tempo long＝1.30秒で止まる）の1本（風 → 回る → トンッ、ト、トン → 止まる光）。Pixabay の A1／B4／C1 と正式 SE 05 の足音を編集・合成（AUDIO_CREDITS.md）。DICE_THROW（旧サイコロ・特訓）とは別＝二重に鳴らない
    DICE_LAND:  { silent: true },   // 2026-10-06：着地の音は DICE_THROW の完成 SE に含まれる（鳴らさない）。サイコロが地面に最初に触れた：2026-10-03 第4弾の試遊で NG → 無音（代わりの音は選ばない）
    DICE_ROLL:  { silent: true },   // 出目の面を見せ始めた（停止のあと）：2026-10-03 第4弾の試遊で NG → 無音（代わりの音は選ばない）
    DICE_STOP:  { silent: true },   // サイコロが見た目の上で完全に止まったフレーム（dice-renderer の dice.stop）。停止の音を将来入れるならここ（今は無音）
    STEP:       { silent: true },                                     // 2026-10-06：1マスごとの足音は無音のまま（正式の4歩の音は Chapter 開始の登場 MONSTER_ENTRY に1回だけ）。旧：1マスごとの足音（pluck_4）は試遊で NG。耳障りでない短い低い足音を追加パックから（止まるマスでは鳴らさない）
    TILE_STOP:  { silent: true },   // 通常マスに止まった：2026-10-03 第4弾の試遊で NG → 無音（代わりの音は選ばない）（マスの光る演出は残す）
    STAT_UP:    { src: UI + 'confirm_style_3_004.ogg', gain: 0.47 },  // 能力UP（特訓ボード・旧ボードの sfx(3)）【要試聴】。Chapter の能力マスは 2026-10-06 から TRAINING_ITEM_SPAWN → TRAINING_SUCCESS（こちらは鳴らさない）
    GOLD_GET:   { src: IV + 'bell.ogg', gain: 7.0 },                  // 元が小さい（-36 LUFS）
    CHEST_OPEN: { src: UI + 'confirm_style_6_001.ogg', gain: 0.85 },   // 段階の分からない宝箱だけ（Chapter の宝箱は 2026-10-06 から TREASURE_TIER_1〜3 のどれか1つ）
    EVENT:      { src: IV + 'ping.ogg', gain: 5.0 },   // 旧：出来事の結果。Chapter の出来事は 2026-10-06 から EVENT_TRIGGER（出来事が起きた瞬間）
    RIVAL_APPEAR: { src: MMO12 + 'rival_appear_epic_whoosh.ogg', gain: 0.76 },   // 2026-10-12 正式：ライバル（リュウ）の登場の瞬間だけ＝DRAGON-STUDIO「Epic Whoosh」（-13.6 LUFS → 約 -16）。旧：08_encounter_rival（ファイルは外した）   // 2026-10-06 正式：ライバル（リュウ）／固定の強敵の遭遇
    WILD_ALERT: { src: MMO + '06_encounter_wild.ogg', gain: 1.05 },   // 2026-10-06 正式：通常の野生の遭遇（旧：alkakrab Fx 3）
    RARE_ALERT: { src: MMO + '07_encounter_rare.ogg', gain: 0.74 },   // 2026-10-06 正式：レアの遭遇（野生の音を使い回さない）
    TOURNAMENT_ARRIVAL: { silent: true },   // 大会会場への到着：2026-10-03 第4弾の試遊で NG → 無音（代わりの音は選ばない）（ほかの Fx を使い回さない）
    // ---- 2026-10-06 正式 SE（ユーザー提供・ゲームの所有素材。-16 LUFS を目安に gain、ピーク -1 dBFS まで。ファイルは加工しない）----
    MONSTER_ENTRY:       { src: MMO + '05_small_monster_entry_steps_4step.ogg', gain: 1.12 },   // Chapter 開始でモンスターが画面の下から歩いて入る（4歩・0.72秒）＝1回だけ。1マスごとには鳴らさない
    TRAINING_ITEM_SPAWN: { src: MMO + '02_training_item_spawn.ogg', gain: 1.0 },   // 能力マス：特訓の道具がモンスターのそばに出た瞬間
    TRAINING_SUCCESS:    { src: MMO + '04_training_success.ogg', gain: 0.63 },     // 能力マス：特訓の動きのあと、能力UPの表示が出た瞬間（STAT_UP と重ねない）
    MARKET_PURCHASE:     { src: MMO + '03_market_purchase_confirm.ogg', gain: 1.02 },   // 市場：購入が成立した瞬間（シートを開いた・ボタンに触れた・所持金不足では鳴らさない）
    TREASURE_TIER_1:     { src: MMO + '09_treasure_open_tier1.ogg', gain: 0.98 },   // 宝箱 normal（tier ごとに1つだけ）
    TREASURE_TIER_2:     { src: MMO + '10_treasure_open_tier2.ogg', gain: 1.01 },   // 宝箱 rare
    TREASURE_TIER_3:     { src: MMO + '11_treasure_open_tier3.ogg', gain: 0.88 },   // 宝箱 special
    TREASURE_TIER_4:     { src: MMO + '12_treasure_open_tier4.ogg', gain: 0.65 },   // 正式素材として登録だけ（ゲームに第4の段階は無い＝どこからも鳴らさない。報酬・段階は作らない）
    REST_RECOVER:        { src: MMO + '13_rest_recover.ogg', gain: 1.11 },          // 「休む」・休むマスで疲れの回復が成立した瞬間
    EVENT_TRIGGER:       { src: MMO + '14_event_trigger.ogg', gain: 1.0 },          // 出来事のマスで出来事が始まった瞬間（休むマスの回復は REST_RECOVER）
    BRANCH_SELECT:       { src: MMO + '15_branch_select.ogg', gain: 1.05 },         // 分かれ道で道を選んだ瞬間
    // ---- 大会・バトル ----
    MATCHUP:       { src: MMO12 + 'vs_cinematic_swoosh_impact.ogg', gain: 0.58 },   // 2026-10-12 正式：VS の金色の斜線・VS のロゴが出る瞬間（tourVsShow の battle.matchup）＝Universfield「Cinematic Swoosh Impact」（-11.3 LUFS → 約 -16）。旧：2026-10-03 第4弾で NG の Fx 1 → 無音
    BATTLE_START:  { src: MMO12 + 'battle_start_cinematic_impact_boom_05.ogg', gain: 1.0 }, // 2026-10-12 正式：試合開始（「FIGHT!」）＝Universfield「Cinematic Impact Boom 05」（-16.6 LUFS）→ 0.45秒後に戦闘の BGM。旧：Ivokard bass_thud_electric（ファイルは外した）
    ROULETTE_STOP: { src: UI + 'confirm_style_2_004.ogg', gain: 0.45 },  // 技ルーレットの STOP（旧：攻撃の音 attack_1 が鳴っていた）【要試聴】
    BATTLE_ATTACK: { src: IV + 'attack_1.ogg', gain: 2.8 },
    BATTLE_HIT:    { src: IV + 'hit_1.ogg', gain: 3.3 },
    BATTLE_CRIT:   { src: IV + 'hit_2.ogg', gain: 1.4 },
    // BATTLE_MISS・BATTLE_BLOCK・BUFF・DEBUFF・HEAL・ROULETTE_TICK・BATTLE_INTRO・SWOOSH：合う素材が無い → 合成音
    // ---- 進行 ----
    VICTORY:          { src: UI + 'confirm_style_6_004.ogg', gain: 0.8 },
    CHAPTER_CLEAR:    { src: UI + 'confirm_style_6_004.ogg', gain: 0.8 },
    TOURNAMENT_START: { src: UI + 'confirm_style_1_001.ogg', gain: 0.65 },
    UNLOCK:           { src: UI + 'confirm_style_6_002.ogg', gain: 1.3 },
    REWARD:           { src: UI + 'confirm_style_6_002.ogg', gain: 1.3 },
    // ---- 2026-10-13 開発24：観客の声（公式大会の会場だけ・js/battle/crowd.js。ユーザー提供の派生＝Pixabay の3音源の区間を切り出し OGG／M4A にしたもの。AUDIO_CREDITS.md）----
    //  src は [OGG, M4A]＝そのブラウザで再生できる形式を1つだけ選ぶ（同じ音を二重に鳴らさない）。gain はユーザー指定の初期値（歓声 0.55・落胆 0.55・ブーイング 0.20）から。ブーイングは素材が約6dB大きい
    CROWD_HIT:        { src: [CR + 'hit_cheer_2p0_2p7_700ms.ogg', CR + 'hit_cheer_2p0_2p7_700ms.m4a'], gain: 0.55 },                       // 命中（-14.7 LUFS → 約 -20）
    CROWD_HIT_LONG:   { src: [CR + 'hit_cheer_2p0_3p0_1000ms.ogg', CR + 'hit_cheer_2p0_3p0_1000ms.m4a'], gain: 0.6 },                       // 同・1.0秒の版（比較用）
    CROWD_MISS:       { src: [CR + 'miss_disappointment_0p5_1p2_700ms.ogg', CR + 'miss_disappointment_0p5_1p2_700ms.m4a'], gain: 0.55 },   // ルーレットの MISS（技が出ない）
    CROWD_MISS_LONG:  { src: [CR + 'miss_disappointment_0p5_1p5_1000ms.ogg', CR + 'miss_disappointment_0p5_1p5_1000ms.m4a'], gain: 0.53 },
    CROWD_EVADE:      { src: [CR + 'evade_boo_0p0_0p6_600ms.ogg', CR + 'evade_boo_0p0_0p6_600ms.m4a'], gain: 0.2 },                         // 技を相手がかわした（-8.9 LUFS → 約 -23）
    CROWD_EVADE_LONG: { src: [CR + 'evade_boo_0p0_1p0_1000ms.ogg', CR + 'evade_boo_0p0_1p0_1000ms.m4a'], gain: 0.15 },                      // 同・1.0秒の版（-6.5 LUFS）
  };

  // ---- 2026-10-13 開発24：NPC のボイス（ユーザー提供の試遊素材。MP3 から OGG／M4A に変換したもの。AUDIO_CREDITS.md）----
  //  enabled:false にすれば、その声だけ鳴らさない（どこで鳴らすかは js/npc/voice-cues.js の CUES）。gain＝素材の音量の差をそろえる（約 -18 LUFS）。
  //  ボイスは SE・BGM とは別の音量・ON/OFF（MMAUDIO.setVoice。設定は localStorage mmvoice＝セーブとは別）
  const VOICE_REGISTRY = {
    fina_hello:  { src: [VO + 'fina_hello_new.ogg', VO + 'fina_hello_new.m4a'], npc: 'fina', gain: 0.88 },   // こんにちは（2026-10-13 開発25 追加便：ユーザー指定の新しい「こんにちは」（フィナ、こんにちはNew.mp3・-16.9）へ参照先だけ差し替え。旧 fina_hello.ogg／m4a（-19.9・gain 1.24）はファイルだけ残す）
    fina_yeah:   { src: [VO + 'fina_yeah.ogg', VO + 'fina_yeah.m4a'], npc: 'fina', gain: 1.22 },       // やったね（-19.7）
    fina_hmm:    { src: [VO + 'fina_hmm.ogg', VO + 'fina_hmm.m4a'], npc: 'fina', gain: 1.53 },         // うーん（-21.7）
    fina_look:   { src: [VO + 'fina_look.ogg', VO + 'fina_look.m4a'], npc: 'fina', gain: 1.05 },       // 見て見て（-18.4）
    fina_hey:    { src: [VO + 'fina_hey.ogg', VO + 'fina_hey.m4a'], npc: 'fina', gain: 1.4 },          // もう（-20.9）
    fina_giggle: { src: [VO + 'fina_giggle.ogg', VO + 'fina_giggle.m4a'], npc: 'fina', gain: 2.14 },   // えへへ（-24.6）
    fina_yes:    { src: [VO + 'fina_yes.ogg', VO + 'fina_yes.m4a'], npc: 'fina', gain: 1.32 },         // うん（-20.4）
    fina_wonder: { src: [VO + 'fina_wonder.ogg', VO + 'fina_wonder.m4a'], npc: 'fina', gain: 1.91 },   // なんだろう？（-24.2）
    dan_hello:     { src: [VO + 'dan_hello.ogg', VO + 'dan_hello.m4a'], npc: 'dan', gain: 1.03 },           // ダン（ベースキャンプ）：やあ（-18.3）
    nick_hello:    { src: [VO + 'nick_hello.ogg', VO + 'nick_hello.m4a'], npc: 'nick', gain: 2.4 },         // ニック（牧場）：やあ（-25.6）
    berna_welcome: { src: [VO + 'berna_welcome.ogg', VO + 'berna_welcome.m4a'], npc: 'shop', gain: 1.16 },  // ベルナ（アイテム屋）：いらっしゃい（-19.3）
    karen_welcome: { src: [VO + 'karen_welcome.ogg', VO + 'karen_welcome.m4a'], npc: 'karen', gain: 2.29 }, // カレン（市場）（-25.2）
    elliot_hello_OPTIONAL: { src: [VO + 'elliot_hello_OPTIONAL.ogg', VO + 'elliot_hello_OPTIONAL.m4a'], npc: 'elliot', gain: 1.16 },   // エリオット（研究所）：やあ（-19.3）。2026-10-13 開発25：ユーザーが正式に提供（同じ元ファイル・sha256 61e5821c…）＝再訪の挨拶に採用（id は開発24 のまま）
    // ---- 2026-10-13 開発25 追加便：NPC のボイス（ユーザー提供 ZIP「全NPCボイス15本_BGM3本」の MP3 を OGG Vorbis q4／AAC 128k に変換しただけ。AUDIO_CREDITS.md）----
    //  出しどころは js/npc/voice-cues.js（CUES・LINE_VOICE）。三伝説（レオナ・ラグナス）の声は【登録のみ】＝今のゲームに再会・対戦の場面が無い（enabled:false＝読み込みもしない。場面ができたら true にして CUES に足す）
    cedric_opening: { src: [VO + 'cedric_opening.ogg', VO + 'cedric_opening.m4a'], npc: 'cedric', gain: 1.51 },   // セドリック「さあ！いよいよ開幕です！」（-21.6）＝公式大会の開幕の会話の1行目（index.html の CEDRIC_EV.open）
    serge_welcome:  { src: [VO + 'serge_welcome.ogg', VO + 'serge_welcome.m4a'], npc: 'serge', gain: 1.17 },      // セルジュ「ようこそ」（-19.4）＝聖獣士登録の受付の1行目・聖獣士管理局の再訪の入口
    genshin_ack:    { src: [VO + 'genshin_ack.ogg', VO + 'genshin_ack.m4a'], npc: 'genshin', gain: 1.94 },        // ゲンシン「うむ」（-23.8）＝特訓をやり終えたときの「よくやった。…」
    vargas_ack:     { src: [VO + 'vargas_ack.ogg', VO + 'vargas_ack.m4a'], npc: 'vargas', gain: 2.39 },           // ヴァルガス「うむ」（-25.6）＝闘技場（ロック中）でランクを上げた子を認める一言「ランクを上げてきたか。……覚えておく。」
    ryu_hello:      { src: [VO + 'ryu_hello.ogg', VO + 'ryu_hello.m4a'], npc: 'ryu', gain: 1.16 },                // リュウ「よっ！」（-19.3）＝道中でリュウが現れた瞬間（ライバルの遭遇の演出）
    ryu_chuckle:    { src: [VO + 'ryu_chuckle.ogg', VO + 'ryu_chuckle.m4a'], npc: 'ryu', gain: 2.08 },            // リュウ「へへっ」（-24.4）＝ライバル戦でプレイヤーが負けたとき（リュウの勝ち）
    ryu_praise:     { src: [VO + 'ryu_praise.ogg', VO + 'ryu_praise.m4a'], npc: 'ryu', gain: 0.95 },              // リュウ「やるじゃん」（-17.6）＝ライバル戦でプレイヤーが勝ったとき
    leona_greet:      { src: [VO + 'leona_greet.ogg', VO + 'leona_greet.m4a'], npc: 'leona', gain: 0.9, enabled: false },          // レオナ「よく来ましたね」（-17.1）【登録のみ】三伝説の再訪の場面が未実装
    leona_prebattle:  { src: [VO + 'leona_prebattle.ogg', VO + 'leona_prebattle.m4a'], npc: 'leona', gain: 0.81, enabled: false },  // レオナ「さあ始めましょう」（-16.2）【登録のみ】三伝説との対戦が未実装
    ragnas_greet:     { src: [VO + 'ragnas_greet.ogg', VO + 'ragnas_greet.m4a'], npc: 'ragnas', gain: 0.96, enabled: false },     // ラグナス（人。リュウの相棒のレグナスとは別）「来たか」（-17.7）【登録のみ】
    ragnas_prebattle: { src: [VO + 'ragnas_prebattle.ogg', VO + 'ragnas_prebattle.m4a'], npc: 'ragnas', gain: 0.6, enabled: false }, // ラグナス「お前の力見せてみろ！」（-13.6）【登録のみ】
    //  アストラッドの声は無い：受け取った ZIP のアストラッドの2本（「来たか」「お前の力、見せてみろ！」）は使用禁止の旧音源＝取り込んでいない。新しい「待っていた」「全力でこい！」は未着
    //  エリオット（研究所）「やあ」は ZIP の「研究所、やあ(1).mp3」と上の elliot_hello_OPTIONAL が同じ元音源（sha256 61e5821c…）＝二重に登録しない
  };

  // ---- 2026-10-13 開発25 追加便：BGM の【候補】（ユーザー提供の MP3 を OGG Vorbis q5 に変換しただけ・assets/audio/bgm/candidates_1013/）----
  //  採用する場所と鳴らし始めの最終決定はユーザー待ち＝ここは MMAUDIO に登録しない（registerAll は bgm・se・voice しか読まない＝どの場面からも鳴らない）。
  //  試聴は開発用の試聴ページ（audio_candidates_1013・本編からはつながない）。採用が決まったら、その場面の BGM_REGISTRY の1行をこのファイルに書き換える（TITLE の silent・ARENA・公式戦の曲は今は変えていない）
  const BGM_CANDIDATES = {
    TITLE_CANDIDATE:         { src: BGM_DIR + 'candidates_1013/title_candidate.ogg', gain: 0.29, for: 'TITLE', note: 'Top画面BGM.mp3（230.9秒・-7.1 LUFS）。今の TITLE は silent（開始画面は無音＝正式）＝変えない' },
    ARENA_CANDIDATE:         { src: BGM_DIR + 'candidates_1013/arena_candidate.ogg', gain: 0.39, for: 'ARENA', note: '闘技場BGM.mp3（185.7秒・-9.7 LUFS）。今の ARENA（Swords At Midnight Loop）は変えない・闘技場の画面は未実装' },
    LEGEND_BATTLE_CANDIDATE: { src: BGM_DIR + 'candidates_1013/legend_battle_candidate.ogg', gain: 0.35, for: 'LEGEND_BATTLE', note: 'レジェンド戦BGM.mp3（271.6秒・-8.9 LUFS）。三伝説との対戦は未実装＝公式大会・野生・レア・ライバルの曲には使わない' },
  };

  root.MMAUDIO_REGISTRY = Object.freeze({ bgm: BGM_REGISTRY, se: SE_REGISTRY, voice: VOICE_REGISTRY, bgmCandidates: BGM_CANDIDATES });
  try { if (root.MMAUDIO && typeof root.MMAUDIO.registerAll === 'function') root.MMAUDIO.registerAll(root.MMAUDIO_REGISTRY); } catch (e) { /* 登録に失敗してもゲームは止めない（合成音で動く） */ }
})(typeof window !== 'undefined' ? window : globalThis);
