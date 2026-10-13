# AUDIO_CREDITS — 音源の出どころ・ライセンス・クレジット

ミスティックモンスターズ（Mystic Monsters）で使っている BGM・SE の記録。素材を足したら、この表と `js/audio/audio-registry.js` を更新する。
ZIP の README・LICENSE の原文は、受け取った ZIP の中にある（リポジトリには採用した音源ファイルだけを置き、ZIP はそのまま入れない）。

## 2026-10-07 正式採用の BGM 14曲（assets/audio/bgm/licensed_20261007/）

ユーザー提供の MP3（13曲）・WAV（1曲）を OGG Vorbis（q5）に変換しただけ（ユーザー指示 2026-10-07。曲の切り出し・加工はしない＝開始位置・ループ区間は registry の値で指定）。音量は registry の gain（BGM 約 -18 LUFS・セドリックの会話の場面は約 -20 LUFS）。**公開・商用リリースの前に、各曲の作者・出典の記録を保ち、それぞれの利用規約を再確認すること**（ユーザーのメモ）。

| 場面（registry） | ファイル | 曲名 / 作者 | 出典 | 長さ | 元の音量 | gain | 開始・ループ |
|---|---|---|---|---|---|---|---|
| PROLOGUE_1（平和な時代） | 01_prologue_peace.ogg | 穏やかで少しワクワクする今日 / 今川彰人オーケストラ | https://dova-s.jp/bgm/detail/6451 | 86秒 | -12.6 | 0.54 | 頭から・loop なし |
| PROLOGUE_2（厄災襲来） | 02_prologue_calamity.ogg | 悪魔との戦闘 / 今川彰人オーケストラ | https://dova-s.jp/bgm/detail/11157 | 99秒 | -9.0 | 0.35 | 頭から・loop なし |
| PROLOGUE_3（育成・共闘文化） | 03_prologue_hopeful.ogg | Hopeful / Fukagawa | https://dova-s.jp/bgm/detail/19898 | 90秒 | -10.9 | 0.44 | 頭から・loop なし |
| PROLOGUE_4（三人のレジェンド） | 04_prologue_legend_battle.ogg | 高貴なる戦闘 / 香居 | https://dova-s.jp/bgm/detail/22002 | 33秒 | -12.4 | 0.52 | 頭から・loop なし |
| PROLOGUE_5（大会文化） | 05_prologue_tournament.ogg | Tournament / Ebunny | https://pixabay.com/music/main-title-tournament-354188/ | 147秒 | -10.4 | 0.42 | 頭から・loop なし |
| PROLOGUE_6（旅立ち） | 06_prologue_departure.ogg | Bon Voyage! / HarumachiMusic | https://pixabay.com/music/main-title-bon-voyage-magnificent-bright-uplifting-orchestra-205093/ | 99秒 | -14.7 | 0.68 | 頭から・loop なし |
| CEDRIC（セドリックの大会前の導入） | 07_cedric_pre_tournament.ogg | REACH FOR the FATE / Keyta | https://dova-s.jp/bgm/detail/4664 | 381秒 | -9.5 | 0.3 | 0〜378.5秒 |
| TOURNAMENT_LOBBY_LOW／HIGH（大会1 対戦表） | 08_tournament_table_start17s.ogg | Battle - スタンバイフェイズ / lei | https://dova-s.jp/bgm/detail/9701 | 141秒 | -14.8 | 0.69 | 17秒から・17〜135.2秒 |
| TOURNAMENT_MATCHUP（大会2 対戦前比較） | 09_prebattle_compare_jingle.ogg | trumpetbuildup / theredshore | https://pixabay.com/ja/sound-effects/ミュージカル-trumpetbuildup-87758/ | 12秒 | -18.6 | 1.07 | ジングル・loop なし |
| RIVAL_BATTLE | 10_rival_battle.ogg | To The Death / Junipersona | https://pixabay.com/music/video-games-to-the-death-159171/ | 204秒 | -9.4 | 0.37 | 0〜202秒 |
| ARENA（闘技場の施設・画面は未実装） | 11_arena_swords_at_midnight_loop.ogg | Swords At Midnight Loop（Action RPG Battle Music pack） | https://chimera-forge-productions.itch.io/action-rpg-battle-music | 89秒 | -14.5 | 0.67 | ループ素材 |
| WILD_BATTLE | 12_wild_battle.ogg | 通常戦闘曲 - α / lei | https://dova-s.jp/bgm/detail/11060 | 111秒 | -10.7 | 0.43 | 0〜108秒 |
| RARE_WILD_BATTLE | 13_rare_monster_battle.ogg | 中ボスくらいの戦闘風 / Motoyuki | https://dova-s.jp/bgm/detail/12683 | 158秒 | -7.2 | 0.29 | ループ |
| TOURNAMENT_BATTLE_LOW／HIGH（公式ランク戦 E〜S） | 14_official_rank_battle.ogg | 戦いの旅路を征く / MATSU | https://dova-s.jp/bgm/detail/12447 | 236秒 | -13.7 | 0.61 | 0〜233.4秒 |

置き換えて外した旧い曲（記録は下の表に残す）：PGS「Battle Music 1」（旧 WILD_BATTLE）・「Battle Music 2」（旧 TOURNAMENT_BATTLE_LOW）・alkakrab「Battle of the Skies」（旧 RIVAL_BATTLE）・「Clash of Arcane Titans」（旧 TOURNAMENT_BATTLE_HIGH）。不採用（ユーザー指示）：「いざ出発！」「冒険への誘い」。

## 2026-10-12 正式採用：立体サイコロの SE（assets/audio/se/dice_1012/）＋比較試作（prototype/dice_1012/se/）

**正式採用（2026-10-12 ユーザー決定）**：assets/audio/se/dice_1012/dice_magic_b4_long_tap.ogg＝SE_REGISTRY の DICE_CUBE（gain 0.9）。Chapter 1 の世界のボードの立体サイコロ（MMDICE3D・1.30秒で止まる）だけが鳴らす。中身は比較デモの dice_magic_b4_long_tap.ogg と同じファイル（sha256 1872dcff07de6d1e81e99bed7cbc57400932173dca518dca89116bd76151da39）。A1・B4・C1（Pixabay）を編集・合成し、着地の「トンッ、ト、トン」は既存の正式 SE 05_small_monster_entry_steps_4step.ogg（ゲームの所有素材）の足音を切り出して重ねた。旧サイコロの DICE_THROW（01_dice_large_full.ogg）は Chapter 2・旧ボード・特訓のまま。原音（Pixabay の MP3）は編集・合成した1本にだけ使い、原音そのものはリポジトリ・公開サイトに置かない（Pixabay の規約：原音単体の再配布の禁止）。ゲームには OGG だけ（assets/audio の約束＝同じ音の別形式を置かない）。M4A は比較デモにだけ残す。

| ファイル | 使った原音 / 作者 | 出典 | ライセンス |
|---|---|---|---|
| dice_magic_b4.ogg／.m4a（0.93秒版）・dice_magic_b4_long.ogg／.m4a・dice_magic_b4_long_tap.ogg／.m4a（1.30秒版。_tap の着地音は既存の正式 SE 05_small_monster_entry_steps_4step を切り出した仮） | A1 "Magical Whoosh" / u_hyed0v3ux9 | https://pixabay.com/sound-effects/film-special-effects-magical-whoosh-148459/ | Pixabay Content License |
| 〃 | B4 "Slow Whoosh" / StudioKolomna | https://pixabay.com/sound-effects/film-special-effects-slow-whoosh-118247/ | Pixabay Content License |
| 〃（dice_magic_b2_old にも） | C1 "Magic Spell 02" / Universfield | https://pixabay.com/sound-effects/film-special-effects-magic-spell-02-250240/ | Pixabay Content License |
| dice_magic_b2_old.ogg／.m4a（旧回転音・不採用候補） | B2 "Spin Whoosh 1" / floraphonic（＋A1・C1） | https://pixabay.com/sound-effects/film-special-effects-spin-whoosh-1-186596/ | Pixabay Content License |

ライセンスの要約：https://pixabay.com/service/license-summary/ ・規約：https://pixabay.com/service/terms/ （クレジットは任意。権利の申し立てがあれば差し替えられるよう記録を残す）。

## 2026-10-12 正式採用：公式ランク戦の曲（assets/audio/bgm/licensed_20261012/）

ユーザー納品の MP3「公式ランク.mp3」（ZIP「Claude納品_公式ランク戦BGM」の 公式ランク戦BGM/。291.32秒・44.1kHz ステレオ・Final Cut Pro の書き出し。sha256 `cf02619bf0620055b71b1278159f3c121c626a1b9bffabd80f40a034a1eceaf0`）を OGG Vorbis（q5）に変換しただけ（曲の切り出し・加工はしない。メタデータは外した）。原本の MP3 はリポジトリに置かない（ユーザーが保管）。

- 曲名・作曲者・配布元・ライセンス：**要確認**（ZIP・指示書に記載が無い。ユーザーの「正式採用音源」という指示だけ。作り話はしない）
- 解析：-17.0 LUFS・真のピーク -1.7 dBFS・頭の無音なし・289.8秒から終わりのフェード（291.3秒で終わる）

| 場面（registry） | ファイル | 曲名 | 長さ | 元の音量 | gain | ループ |
|---|---|---|---|---|---|---|
| TOURNAMENT_BATTLE_LOW／HIGH（公式ランク戦 E〜S の実戦の間） | official_rank_battle.ogg | 公式ランク（要確認） | 291.3秒 | -17.0 LUFS | 0.89（約 -18） | 0〜289.6秒・頭へ 0.6秒のクロスフェード |

置き換えた曲：「戦いの旅路を征く / MATSU」（14_official_rank_battle.ogg）。ファイルは残し、入口の無い SPECIAL_BATTLE だけが使う（公式ランク戦の差し替えに巻き込まないため）。

## 2026-10-08 正式採用：街の曲（assets/audio/bgm/licensed_20261008/）

ユーザー提供の MP3「冒険への誘い(2).mp3」（ZIP Mismon_NextBatch_PART2_Market_Ryu_WorldMap_TownBGM_20261008 の town_bgm/。sha256 `b86897fa6a540ffc…`）を OGG Vorbis（q5）に変換しただけ（曲の切り出し・加工はしない）。（10-07 の一覧では不採用だった曲。2026-10-08 にユーザーが街の曲として正式採用）。

作者・出典・ライセンス（2026-10-08 ユーザー確認済み）：

- 曲名：冒険への誘い
- 作曲者：のる
- 配布元：OpenTracks（旧 DOVA-SYNDROME）
- 用途：街BGM
- ゲーム利用：可
- 商用利用：可
- 広告付き／アプリ内課金ゲーム：可
- MP3→OGG変換およびループ用編集：可
- クレジット表記：必須ではないが、ミスモンでは記載する

クレジット表記（統一）：

```
BGM「冒険への誘い」 / のる
OpenTracks（旧 DOVA-SYNDROME）
```

| 場面（registry） | ファイル | 曲名 | 長さ | 元の音量 | gain | ループ |
|---|---|---|---|---|---|---|
| TOWN（街。お知らせ・設定・プロフィールも） | town_bouken_e_no_izanai.ogg | 冒険への誘い | 182.7秒（179秒から末尾は無音） | -15.1 LUFS | 0.7（約 -18） | 0〜178.6秒・頭へ 1.2秒のクロスフェード |

置き換えて外した曲：HydroGene「Lively City」（02_lively_city.ogg。第5弾の仮採用の街の曲。下の表の記録は残す）。

## 使用中の素材（2026-10-02 夜・第1弾）

| 素材パック | 作者 | 配布元 | ライセンス | 商用利用 | クレジット | 置き場 |
|---|---|---|---|---|---|---|
| PGS Fantasy RPG Music Pack（BGM） | JP Soundworks（公開：Platonic Game Studio） | ZIP の README：https://www.youtube.com/c/JPSoundworks/ ・ https://store.steampowered.com/developer/platonicgamestudio | CC BY 4.0（https://creativecommons.org/licenses/by/4.0/）。README の原文：「You are free to use this for your Free and Commercial Projects … As long you credits JP SOUNDWORKS」「DO NOT REPOST OR SELL THIS MUSIC」 | 可（表記が条件） | **必須**：「Music by JP Soundworks (https://www.youtube.com/c/JPSoundworks/)」。「Pack Published by Platonic Game Studio」は任意 | assets/audio/bgm/pgs_fantasy_rpg/ |
| Interface SFX Pack 1（OGG 版・SE） | ObsydianX | https://obsydianx.itch.io/interface-sfx-pack-1（ZIP の Ogg/README.txt） | CC0 | 可 | 不要 | assets/audio/se/interface_sfx_pack_1/ |
| Free 25 Fantasy RPG Game Tracks Vol.3（BGM・Fx） | alkakrab（OGG の埋め込み情報 ARTIST=alkakrab・2023） | https://alkakrab.itch.io/free-25-fantasy-rpg-game-tracks | 配布ページに「Absolutely Free For Commercial use」（ユーザー確認 2026-10-03） | 可 | 必須ではない（出典はこの表に記録） | assets/audio/bgm/alkakrab_fantasy_rpg_vol3/・assets/audio/se/alkakrab_fantasy_rpg_vol3/ |
| High Quality 16-bit RPG Music（28曲） | HydroGene | https://hydrogene.itch.io/high-quality-16-bit-music | CC0 1.0（ユーザー確認 2026-10-03。商用可・クレジット不要・加工可） | 可 | 不要 | assets/audio/bgm/hydrogene_16bit_rpg/（2026-10-03 第5弾の仮採用・8曲） |
| Mix of SFX by Ivokard（SE） | Ivokard | ZIP の License.txt（SNS：https://www.youtube.com/@ivokard ほか） | CC0（Creative Commons Zero。「free to use in personal, educational and commercial projects」） | 可 | 不要 | assets/audio/se/ivokard/ |
| ミスティックモンスターズ正式素材（SE） | ユーザー（プロジェクト所有者）提供 | 2026-10-04 にチャットで受け取ったファイル「Mystic Monsters Start Button SE(1).mp3」 | ゲーム専用の正式素材（ユーザー提供） | 可 | 不要 | assets/audio/se/mystic_monsters_official/ |
| ミスティックモンスターズ正式素材（BGM 2曲・SE 15種）【2026-10-05】 | Mystic Monsters official／ユーザー（プロジェクト所有者）提供のゲーム所有素材 | ZIP mystic_monsters_next_claude_integration_bundle_2026-10-05.zip（01_title_bgm・02_prologue_bgm・03_official_se/ogg_game。WAV master は ZIP の中だけに保管＝リポジトリに置かない） | ゲーム専用の正式素材（ユーザー提供・ゲーム所有） | 可 | 不要（外部の作者へ帰属させない） | assets/audio/bgm/mystic_monsters_official/・assets/audio/se/mystic_monsters_official/ |

### 正式なクレジット表記（ゲーム内のクレジット画面・配布ページに載せる文）

```
Music by JP Soundworks (https://www.youtube.com/c/JPSoundworks/)
Pack Published by Platonic Game Studio
Music: "Free 25 Fantasy RPG Game Tracks Vol.3" by alkakrab (https://alkakrab.itch.io/free-25-fantasy-rpg-game-tracks)
Music: "High Quality 16-bit RPG Music" by HydroGene (CC0, https://hydrogene.itch.io/high-quality-16-bit-music)
Sound effects: Interface SFX Pack 1 by ObsydianX (CC0), Mix of SFX by Ivokard (CC0)
```

CC0 の3つ（HydroGene・ObsydianX・Ivokard）は表記不要だが、礼儀として載せる。

### 要確認（判断待ち）

- PGS Fantasy RPG Music Pack の README には CC BY 4.0 と並んで「DO NOT REPOST OR SELL THIS MUSIC」とある。このリポジトリは公開（GitHub Pages）なので、採用した OGG ファイルは誰でも取得できる状態になる。ゲームの素材として置くことは CC BY の範囲（表記つき）だが、「パックの再配布」と受け取られないよう、**ZIP 全体や未採用の曲は置かない**（今は採用した10曲だけ）。公開のままでよいかは仕様側の判断。

## 2026-10-03 第4弾の試遊で NG → 無音にした音（ファイルは外した。下の表の出どころ・ライセンスの記録は残す）

「NG の音を別の場面へ使い回さない」「似た音を判断で選ばない」「素材が無ければ無音」（ユーザー指示）。registry は `silent: true`（合成音にも落とさない）。

| 外した素材（パック・元ファイル） | 使っていた所 |
|---|---|
| alkakrab Vol.3「Ambient 4.ogg（Tranquil Radiance）」 | TOWN（街） |
| alkakrab Vol.3「Ambient 3.ogg（Lost River）」 | FARM（旧ファーム） |
| PGS「Event Music 4.ogg」 | 大会の受付・順位表・結果（TOURNAMENT_ENTRY・LOBBY_LOW／HIGH・RESULT） |
| alkakrab Vol.3「Fx 1.ogg」 | MATCHUP（対戦相手の発表＝大会の対戦前の画面） |
| Interface SFX Pack 1「confirm_style_1_004.ogg」 | 旧 TITLE_START（開始画面のタップ。第4弾で NG・2026-10-04 から正式素材 title_start.ogg） |
| Interface SFX Pack 1「confirm_style_5_001.ogg」 | UI_CONFIRM（通常のコマンドのタップ） |
| Ivokard「pluck_3.ogg」 | DICE_LAND（サイコロの着地） |
| Ivokard「ping.ogg」の DICE_ROLL への割り当て | DICE_ROLL（出目＝サイコロの停止の音。ping は EVENT ではそのまま） |
| Ivokard「pluck_5.ogg」 | TILE_STOP（通常マスに止まった） |

ほかに無音のまま：DICE_THROW（サイコロを振る）・DICE_STOP（サイコロが完全に止まったフレームの差し込み口）・STEP・TOURNAMENT_ARRIVAL（大会会場への到着）・TOURNAMENT_MATCHUP（BGM）・CHAPTER_1（BGM）。大会開始の演出の合成音（風切り音）も鳴らさない。

**2026-10-03 第5弾**：BGM の TOWN・FARM・CHAPTER_1・大会（TOURNAMENT_ENTRY・LOBBY_LOW／HIGH・TOURNAMENT_MATCHUP・RESULT）は、ユーザーが選んだ別の曲（HydroGene・下の表）を仮採用した。上の NG の曲そのものは使っていない（SE の MATCHUP・TOURNAMENT_ARRIVAL などは無音のまま）。OK のまま：CHAPTER_START（alkakrab Fx 2）・MARKET ほか。

## 使用したファイル（2026-10-03 の iPhone 試遊の結果で見直し）

### BGM（PGS Fantasy RPG Music Pack → assets/audio/bgm/pgs_fantasy_rpg/）

PGS の曲は「暫定の試遊用」。新しく採用しない（公開リポジトリから直接取得できるため。正式リリース前に再配布条件のはっきりした素材への置き換えを検討）。

| ZIP の元ファイル | リポジトリのファイル | 場面（registry） | 長さ | 元の音量（LUFS） | gain |
|---|---|---|---:|---:|---:|
| Event Music 1.ogg | （外した 2026-10-05）event_music_1.ogg | 旧 TITLE → 正式のタイトル曲に置き換え（パックのクレジットは残す） | 80秒 | -16.4 | 0.85 |
| Town-Village Theme 2.ogg | town_village_theme_2.ogg | MARKET（試遊で OK） | 61秒 | -16.9 | 0.9 |
| Town-Village Theme 3.ogg | town_village_theme_3.ogg | RANCH | 77秒 | -16.1 | 0.8 |
| Event Music 2.ogg | event_music_2.ogg | LABORATORY | 103秒 | -14.3 | 0.65 |
| Battle Music 1.ogg | battle_music_1.ogg | WILD_BATTLE（RARE_WILD_BATTLE は fallback で同じ曲。RIVAL_BATTLE は第3弾で alkakrab へ） | 104秒 | -13.1 | 0.58 |
| Battle Music 2.ogg | battle_music_2.ogg | TOURNAMENT_BATTLE_LOW（HIGH は第3弾で alkakrab へ） | 92秒 | -13.3 | 0.57 |
| Event Music 4.ogg | （外した）event_music_4.ogg | 旧 TOURNAMENT_LOBBY_LOW（受付・順位表・結果）→ 2026-10-03 第4弾で NG・無音 | 88秒 | -14.6 | 0.68 |

外した曲（2026-10-03 の試遊で NG。ファイルも削除）：Town-Village Theme 1（TOWN）、Event Music 3（FARM）、Dungeon-Exploration Music 1（CHAPTER_1）。第3弾で TOWN・FARM は alkakrab へ。CHAPTER_1 はまだ無音（registry の silent）。

### SE（Interface SFX Pack 1 → assets/audio/se/interface_sfx_pack_1/）

| ファイル | 出来事 |
|---|---|
| （外した）confirm_style_1_004.ogg | 旧 TITLE_START（開始画面のタップ）→ 第4弾で NG・無音 |
| （外した）confirm_style_5_001.ogg | 旧 UI_CONFIRM（ボタン全般・街のコマンド）→ 第4弾で NG・無音 |
| confirm_style_4_001.ogg | UI_OPEN |
| back_style_4_002.ogg | UI_CANCEL |
| error_style_4_002.ogg | UI_ERROR |
| cursor_style_2.ogg | UI_SELECT |
| cursor_style_4.ogg | UI_TAB |
| confirm_style_3_004.ogg | STAT_UP |
| confirm_style_2_004.ogg | ROULETTE_STOP（技ルーレットの STOP） |
| confirm_style_6_001.ogg | CHEST_OPEN |
| confirm_style_6_004.ogg | VICTORY・CHAPTER_CLEAR |
| confirm_style_6_002.ogg | UNLOCK・REWARD |
| confirm_style_1_001.ogg | TOURNAMENT_START |

外した（試遊で NG）：confirm_style_4_002（旧 UI_CONFIRM）。

### SE（ミスティックモンスターズ正式素材 → assets/audio/se/mystic_monsters_official/）【2026-10-04】

| 元ファイル | リポジトリのファイル | 出来事 | 長さ | 元の音量 | gain |
|---|---|---|---:|---:|---:|
| Mystic Monsters Start Button SE(1).mp3（MP3 192kbps・44.1kHz・ステレオ・3.03秒。sha256 `9b2a3bf46dc9ca910bea5fee0157269bc91ff1a708637b3135af85ca092348fc`） | title_start.ogg（OGG Vorbis q6 に変換しただけ・EQ や長さは無加工。音が鳴るのは約1.9秒・以降は無音＝読み込み時に切る） | TITLE_START（開始画面の「タップしてはじめる」） | 3.03 | -14.1 LUFS・ピーク -1.6 dBFS | 0.8 |

- 鳴らし方：タップの瞬間（最初のタップ＝unlock と同時。デコードがまだなら終わりしだい・最大0.9秒以内に鳴らす＝合成のファンファーレには落とさない）→ ボタンが沈む → 約0.5秒で次の画面。音は画面の切り替えで止めない（余韻は自然に終わる）。MP3 は置かない（OGG だけ）。


### BGM・SE（ミスティックモンスターズ正式素材・ゲーム所有 → assets/audio/bgm|se/mystic_monsters_official/）【2026-10-05】

作者表記：Mystic Monsters official（ユーザー提供のゲーム所有素材）。外部のフリー素材の作者へ帰属させない。ファイルは ZIP の OGG を無加工でコピー（音量の差は registry の gain だけ）。

| リポジトリのファイル | 種類 | 出来事・場面 | 長さ | 元の音量（LUFS） | gain | sha256 |
|---|---|---|---:|---:|---:|---|
| ~~bgm/mystic_monsters_official/mystic_monsters_title_theme_official.ogg~~ | BGM | 【2026-10-05 PHASE B で廃止・ファイル削除】旧 TITLE（開始画面に BGM は無い＝TITLE は silent） | 38.919秒 | -13.0 | — | `7ad3bf877f1f817bcc2a19ac32f174a8d12da25d73137cb7a987b418c17e0f3c` |
| ~~bgm/mystic_monsters_official/mystic_monsters_prologue_bgm_official.ogg~~ | BGM | **2026-10-06 削除**（プロローグの音がプツプツ鳴る＝ユーザー指示でプロローグ BGM を一旦完全に削除。registry の PROLOGUE は silent）。旧：PROLOGUE（正式 v6・38.714秒・gain 0.64） | — | — | — | 元の sha256 64d05bc521b7deb53e08e18ef53189102382fb8838ab545191deca8983a859b0 |
| bgm/mystic_monsters_official/mystic_monsters_bureau_bgm_official.ogg | BGM | BUREAU（聖獣士管理局・聖獣士登録。ループ＝45.7秒の手前で頭へ 0.25秒のクロスフェード。会話が聞き取れるよう約 -20 LUFS）。2026-10-05 PHASE B 正式 v6（v1〜v5 は使わない） | 46.0秒 | -13.2 | 0.46 | `0fd1e1b8f593bdbae8d20414274bde12ba85f25347a5c45f6a004014a761be90` |
| se/mystic_monsters_official/01_dice_large_full.ogg | SE | DICE_THROW（1回の出目で1回。LAND・ROLL・STOP は silent のまま） | 2.05秒 | -21.0 | 0.95 | `9fd7d1ac264fc9cbc177c48ce1b37d514e17c1ba70be3a906a104a47e617fff0` |
| se/mystic_monsters_official/02_training_item_spawn.ogg | SE | TRAINING_ITEM_SPAWN（能力マスの道具が現れる） |  | -18.8 | 1.0 | `04cbf9a1fc4c3476500e750e947cbf13730c6c74b9ec9177d096444fb4a86281` |
| se/mystic_monsters_official/03_market_purchase_confirm.ogg | SE | MARKET_PURCHASE（市場の購入が成立したときだけ） |  | -16.8 | 1.02 | `a4a14ddfa428e77ecf9b3087d01020680bd107340cf2586f21e94fa5b0153221` |
| se/mystic_monsters_official/04_training_success.ogg | SE | TRAINING_SUCCESS（能力UP。STAT_UP の代わり＝二重にしない） |  | -12.0 | 0.63 | `7833ad86aa13e4d4851890fa84fd8d5f2be0990cf45f046431dfc622797dc2ce` |
| se/mystic_monsters_official/05_small_monster_entry_steps_4step.ogg | SE | MONSTER_ENTRY（Chapter 開始でモンスターが歩いて入る1回） |  | -23.4 | 1.12 | `26c6dbc683efd574a4224de2d27731559c9ba66e02ba761851e83d18cfeb09d4` |
| se/mystic_monsters_official/06_encounter_wild.ogg | SE | WILD_ALERT（野生の遭遇） |  | -18.0 | 1.05 | `311b2cbe09a479815f92185131889ed4a109966c0ac802386a7e5d8325445c77` |
| se/mystic_monsters_official/07_encounter_rare.ogg | SE | RARE_ALERT（レアの遭遇） |  | -13.4 | 0.74 | `a59dfafbb743273e33da24fdeca7fc5eba8b26125bf29bc623d60c4d5653283b` |
| se/mystic_monsters_official/08_encounter_rival.ogg | SE | RIVAL_APPEAR（ライバルの遭遇） |  | -16.0 | 1.0 | `6ad2ee5a92dde078f323e2421b47d45b0d412b110c30edd402b524d8c2552806` |
| se/mystic_monsters_official/09_treasure_open_tier1.ogg | SE | TREASURE_TIER_1（宝箱 normal） |  | -15.8 | 0.98 | `31b0815acc0f876aac4f57c51d416f678009f85f5ff96e24ce622531dfe618e0` |
| se/mystic_monsters_official/10_treasure_open_tier2.ogg | SE | TREASURE_TIER_2（宝箱 rare） |  | -16.3 | 1.01 | `28c162e2680fc7d730239836d6985c35d837be34472fbc9238397433910c2b8b` |
| se/mystic_monsters_official/11_treasure_open_tier3.ogg | SE | TREASURE_TIER_3（宝箱 special） |  | -14.9 | 0.88 | `752a7e9bd457e12ce7a2072e93a6eb8606c8ac3486ab7767ac25d95373deef46` |
| se/mystic_monsters_official/12_treasure_open_tier4.ogg | SE | TREASURE_TIER_4（登録のみ・未接続＝第4段階の宝箱は無い） |  | -12.2 | 0.65 | `f7983b6c9683b3ee1b5b2a5713dc0bd105fdc07e16cba3f9f292389e84ae0b84` |
| se/mystic_monsters_official/13_rest_recover.ogg | SE | REST_RECOVER（休む・休むマスで疲れが回復） |  | -17.3 | 1.11 | `b301bf53e24c87430ec54d3a9f3df497db6b8122730c9fd16e14325af5859250` |
| se/mystic_monsters_official/14_event_trigger.ogg | SE | EVENT_TRIGGER（イベントマスの出来事が始まる） |  | -16.0 | 1.0 | `2064d78d14301468da16f8cdca3727fcaead8649fd662eb188c12f05cb762d2a` |
| se/mystic_monsters_official/15_branch_select.ogg | SE | BRANCH_SELECT（分かれ道で道を選んだ） |  | -16.4 | 1.05 | `a9f26bfb3c7e109fb8ab9a140383ea9e14b8fb194bd312abab3d6cf2d7c0ac47` |

### SE（Mix of SFX by Ivokard → assets/audio/se/ivokard/）

| ファイル | 出来事 |
|---|---|
| （外した）pluck_3.ogg | 旧 DICE_LAND → 第4弾で NG・無音 |
| ping.ogg | EVENT（旧 DICE_ROLL は第4弾で NG・無音） |
| （外した）pluck_5.ogg | 旧 TILE_STOP → 第4弾で NG・無音 |
| bell.ogg | GOLD_GET |
| bass_thud_electric.ogg | BATTLE_START（実戦の開始「FIGHT!」） |
| attack_1.ogg | BATTLE_ATTACK |
| hit_1.ogg | BATTLE_HIT |
| hit_2.ogg | BATTLE_CRIT |

外した（試遊で NG）：jump_2（DICE_THROW）・pluck_4（STEP）・powerup（STAT_UP）。第3弾で外した：bass_thud（MATCHUP は alkakrab Fx 1 へ）。まだ無音（silent）：DICE_THROW・STEP・TOURNAMENT_ARRIVAL（第3弾のパックにも合う音が無い）。

### BGM・Fx（alkakrab「Free 25 Fantasy RPG Game Tracks Vol.3」→ assets/audio/bgm|se/alkakrab_fantasy_rpg_vol3/）【2026-10-03 第3弾試遊候補】

受け取ったもの：OGG 版を4つの ZIP（Fantasy_RPG_Music_Pack・2・3・4）に分けたもの＝1つのパック（元の配布物には MP3／WAV もある。容量のため OGG だけを受け取った）。採用したファイルだけを置き、名前は「元の番号_曲名」の英小文字にした（中身はバイト単位で同一・無加工）。

| ZIP の元ファイル（曲名＝埋め込み情報） | リポジトリのファイル | 使う所 | 長さ | 元の音量（LUFS） | gain | ループ |
|---|---|---|---:|---:|---:|---|
| Ambient 4.ogg「Tranquil Radiance」 | （外した）bgm/…/ambient_4_tranquil_radiance.ogg | 旧 TOWN（街）→ 第4弾で NG・無音 | 129秒 | -16.3 | 0.8 | 0〜119秒・3秒のクロスフェード（119秒からの最後のフェードは使わない） |
| Ambient 3.ogg「Lost River」 | （外した）bgm/…/ambient_3_lost_river.ogg | 旧 FARM（旧ファーム）→ 第4弾で NG・無音 | 111秒 | -16.6 | 0.85 | 0〜105秒・3秒 |
| Action 2.ogg「Battle of the Skies」 | bgm/…/action_2_battle_of_the_skies.ogg | RIVAL_BATTLE（ライバル戦） | 117秒 | -15.2 | 0.74 | 0〜110秒・0.2秒（終わりの一撃のあとの余韻は使わない） |
| Action 1.ogg「Clash of Arcane Titans」 | bgm/…/action_1_clash_of_arcane_titans.ogg | TOURNAMENT_BATTLE_HIGH（大会 B〜S）・SPECIAL_BATTLE（fallback） | 89秒 | -14.8 | 0.71 | 0〜86.3秒・0.2秒 |
| Fx 2.ogg | se/…/fx_2.ogg | CHAPTER_START（Chapter 開始・スタート地点へのズームのあと） | 2秒 | -27.7 | 3.0 | — |
| Fx 3.ogg | （外した 2026-10-05）se/…/fx_3.ogg | 旧 WILD_ALERT → 正式 SE 06_encounter_wild に置き換え | 8秒 → 再生は2秒（最後の0.7秒で下げる） | -32.3 | 5.0 | — |
| Fx 1.ogg | （外した）se/…/fx_1.ogg | 旧 MATCHUP（対戦相手の発表）→ 第4弾で NG・無音 | 7秒 → 再生は2.6秒（最後の0.9秒で下げる） | -31.2 | 4.5 | — |

使っていない：Action 3「Stealthy Infiltration」（潜入の曲）、Action 4「Forest of Mysteries」・Action 5「Epic Quest」（Chapter 1 の候補だったが、解析で戦闘曲と同じくらい忙しい＝40ターン聞くには強すぎるため見送り）、Ambient 1・2・5〜10、Ambience 1〜5、Dark 1〜5（とても小さい・暗い環境音）。

### High Quality 16-bit RPG Music（HydroGene・CC0）

受け取ったもの：OGG 版を5つの ZIP（ogg1〜ogg5）に分けたもの＝1つのパック（28曲。戦闘曲・魔王城・Spirits Forest は intro／loop／full に分かれている）。埋め込みのタイトル・作者情報は無い（曲名はファイル名）。第3弾では「SFC 風のくっきりした音が街・主要施設で浮く恐れ」から見送ったが、**2026-10-03 第5弾でユーザーが下の8曲を仮採用**（BGM 整理の提案から選択）。ファイルは無加工（元の 320kbps OGG のまま。名前だけ「番号_曲名」の英小文字）。音量は gain で約 -18 LUFS に合わせた。

| ZIP の元ファイル | リポジトリのファイル（bgm/hydrogene_16bit_rpg/） | 使う所 | 長さ | 元の音量（LUFS） | gain | ループ |
|---|---|---|---:|---:|---:|---|
| ogg1「02. Lively City.ogg」 | 02_lively_city.ogg | TOWN（街。お知らせ・設定・プロフィールも） | 65秒 | -13.8 | 0.62 | ファイル全体（終わりにフェード・無音なし） |
| ogg1「03. Royal Castle.ogg」 | 03_royal_castle.ogg | TOURNAMENT_ENTRY（到着・受付・ランク選択）。LOBBY_LOW／HIGH・TOURNAMENT_MATCHUP・RESULT は fallback で同じ曲を続ける | 64秒 | -14.6 | 0.68 | 0〜64.28秒・0.08秒のクロスフェード（ファイルの終わりと頭の波形に段差があるため） |
| ogg1「04. Peaceful Village.ogg」 | 04_peaceful_village.ogg | FARM（ファーム・出発準備・アイテム屋・育成完了） | 86秒 | -16.8 | 0.87 | ファイル全体 |
| ogg2「07. Spirits Forest (full).ogg」 | 07_spirits_forest_full.ogg | CHAPTER_1 | 82秒 | -18.8 | 1.1 | 27.344〜81.98秒・0.2秒（full＝intro 27.34秒＋loop 54.64秒。波形の照合で境目を確認。2周目からは前奏を除くループ部だけ） |
| ogg3「14. Traveling the Sky.ogg」 | 14_traveling_the_sky.ogg | CHAPTER_3（空） | 70秒 | -14.4 | 0.66 | ファイル全体 |
| ogg3「15. Volcanic Crater.ogg」 | 15_volcanic_crater.ogg | CHAPTER_4（火山） | 86秒 | -13.1 | 0.57 | ファイル全体 |
| ogg3「17. Unknown Island.ogg」 | 17_unknown_island.ogg | CHAPTER_2（海岸） | 57秒 | -16.7 | 0.86 | ファイル全体 |
| ogg4「20. Military Base.ogg」 | 20_military_base.ogg | TRAINING（特訓。旧：合成音） | 49秒 | -15.4 | 0.74 | ファイル全体 |

Spirits Forest の intro／loop の別ファイルは置かない（full の1本でループ区間を指定）。使っていない：ほかの20曲（Battle Theme I〜IV・Demon King Castle・Holy Sanctuary など）。

## 受け取ったが今回は使っていない素材

| 素材 | 理由 |
|---|---|
| RPG Essentials Free（48ファイル・WAV のみ） | WAV は入れない・変換しない方針。ZIP の中にライセンスの記載が無い（表紙の Cover.png だけ）ため、配布元の利用条件を確かめるまで採用しない。候補は AUDIT の完了報告の「明日以降の候補」 |

## 2026-10-12 正式 SE 3種（ユーザー納品「正式SE3種と特訓チケット_納品済.zip」）

置き場：assets/audio/se/mystic_monsters_official_1012/（MP3 を OGG Vorbis q5 に変換しただけ・音は編集していない）。配布元はいずれも Pixabay（Pixabay Content License。公開前に各ページで利用条件を再確認＝納品 README の指示）。

| 用途（registry の鍵） | ファイル | 元ファイル（sha256） | 作者・出典 | gain |
|---|---|---|---|---|
| ライバルの登場の瞬間（RIVAL_APPEAR） | rival_appear_epic_whoosh.ogg | 01_ライバル登場_Epic_Whoosh.mp3（39b16caf2a0641f8f97494392dc960fabf89491ad6381f1b949da771a3f8b3f4） | DRAGON-STUDIO「Epic Whoosh」 https://pixabay.com/sound-effects/film-special-effects-epic-whoosh-478371/ | 0.76（-13.6 LUFS） |
| VS の金色の斜線・ロゴ（MATCHUP） | vs_cinematic_swoosh_impact.ogg | 02_VS登場_Cinematic_Swoosh_Impact.mp3（ad1e275980bc3cccc770908bb8bb3921f9274e4593fd35b0b33385dd247ee778） | Universfield「Cinematic Swoosh Impact」 https://pixabay.com/sound-effects/cinematic-swoosh-impact-454392/ | 0.58（-11.3 LUFS） |
| 試合開始「FIGHT!」（BATTLE_START） | battle_start_cinematic_impact_boom_05.ogg | 03_試合開始_Cinematic_Impact_Boom_05.mp3（824993119db92d61141199500533294aac3ea01b83e3410396a4c5f65aa54183） | Universfield「Cinematic Impact Boom 05」 https://pixabay.com/sound-effects/film-special-effects-cinematic-impact-boom-05-352465/ | 1.0（-16.6 LUFS） |

置き換えた旧音（「採用した音源だけを置く」の決まりでファイルは外した）：RIVAL_APPEAR＝mystic_monsters_official/08_encounter_rival.ogg、BATTLE_START＝ivokard/bass_thud_electric.ogg、MATCHUP＝無音（2026-10-03 第4弾で NG の Fx 1 は使わない）。

## 2026-10-13 開発24：観客の声 3種（assets/audio/se/crowd_1013/）

ユーザー提供の派生ファイル（ZIP「開発24_バトル歓声ボイス_実装公開検証_最終パック」の 02_crowd_se/。元の MP3 から区間を切り出し、25ms のフェードイン・最大140ms のフェードアウト・振幅 ×0.84 をかけて OGG Vorbis q5 と AAC M4A 160kbps にしたもの＝ユーザー側の加工。リポジトリでは無加工）。
配布元はいずれも Pixabay（Pixabay Content License）。**ライセンスの要約ページ https://pixabay.com/service/license-summary/ は 2026-10-13 に確認**（無料・作者表記は任意・改変可・**素材そのものを単体で売る／配る（standalone）のは禁止**・商標などの制限）。各音源のページ（下の URL）は確認時にアクセスが拒否（403）されたため、作者・区間は納品の LICENSE_AND_SOURCES.txt の記載どおり。
ゲームの中の音（試合の結果の演出）としてだけ使う。音源パックとして配らない。**公開リポジトリのため、ファイルは個別にダウンロードできる状態**（2026-10-12 の Pixabay の正式 SE 3種と同じ扱い）＝気になる場合は要相談。

| 用途（registry の鍵） | ファイル（OGG／M4A の同じ音。再生できる1つだけを使う） | 元の音源・作者 | 採用区間 | gain | 元の音量 |
|---|---|---|---|---:|---:|
| 命中の歓声（CROWD_HIT・既定） | hit_cheer_2p0_2p7_700ms | 「Crowd Cheer and Applause」DRAGON-STUDIO https://pixabay.com/sound-effects/people-crowd-cheer-and-applause-406644/ | 2.0〜2.7秒（0.7秒） | 0.55 | -14.7 LUFS |
| 同・1秒（CROWD_HIT_LONG・比較用） | hit_cheer_2p0_3p0_1000ms | 同上 | 2.0〜3.0秒（1.0秒） | 0.6 | -15.5 |
| ルーレットの MISS の落胆（CROWD_MISS・既定） | miss_disappointment_0p5_1p2_700ms | 「Crowd Disappointment Reaction」Universfield https://pixabay.com/sound-effects/people-crowd-disappointment-reaction-352718/ | 0.5〜1.2秒（0.7秒） | 0.55 | -14.9 |
| 同・1秒（CROWD_MISS_LONG） | miss_disappointment_0p5_1p5_1000ms | 同上 | 0.5〜1.5秒（1.0秒） | 0.53 | -14.5 |
| 技をかわされたブーイング（CROWD_EVADE・既定） | evade_boo_0p0_0p6_600ms | 「Crowd Booing」DRAGON-STUDIO https://pixabay.com/sound-effects/people-crowd-booing-494319/ | 0.0〜0.6秒（0.6秒） | 0.2 | -8.9 |
| 同・1秒（CROWD_EVADE_LONG） | evade_boo_0p0_1p0_1000ms | 同上 | 0.0〜1.0秒（1.0秒） | 0.15 | -6.5 |

gain はユーザー指定の初期値（歓声 0.55・落胆 0.55・ブーイング 0.20）から。最終的な長さ・音量の判断は iPhone の試遊のあと（設定の「観客の声」短い／1秒／なし・「観客の音量」標準／控えめで聞き比べ）。

sha256：
- evade_boo_0p0_0p6_600ms.ogg：4a7da701071483294722c18791bfb2ee03fbeb5e76649f1cdd93675b5365457a
- evade_boo_0p0_1p0_1000ms.ogg：422b817954849094f4e50b4860318a8c8daeb86b5545d6242a96c27866bf5526
- hit_cheer_2p0_2p7_700ms.ogg：e2dce079363b0342a815a16a0ad2a4e21ca7a9ec4601917e678d9eaa324b1a4e
- hit_cheer_2p0_3p0_1000ms.ogg：bcad98e6ecfcc9f5aae550fbd9a347b2326bb4ccd58897770480490e5733d53c
- miss_disappointment_0p5_1p2_700ms.ogg：2630ba532ff266236d6538aa659dae28b95a68ec105b77328efdc8fb33d9a69a
- miss_disappointment_0p5_1p5_1000ms.ogg：1321b9f2a8bf38125de3ad454455467fd9554842d1bb2b988c54204701c553cc
- evade_boo_0p0_0p6_600ms.m4a：4cb4c362875be66af641448c01bf0efc925384e98159f146ffe5aafaaf00197a
- evade_boo_0p0_1p0_1000ms.m4a：02eb96e7245d75e69d477a13ac816191afecb2823328f23b58929e465cf31139
- hit_cheer_2p0_2p7_700ms.m4a：947ddb18f8af17c77ded79c00b5b55e588c22cbfc09367bb9540b058dd748ac8
- hit_cheer_2p0_3p0_1000ms.m4a：3c40fce0d032575b1a1f1fb1a6b54fe8c7db171259745b5b4daff516c898a63a
- miss_disappointment_0p5_1p2_700ms.m4a：1bb6692963b093ac4bf90b5aafb121867926926c214ce898dd59a23f4bbf7cd2
- miss_disappointment_0p5_1p5_1000ms.m4a：fa8d8c16e719133853c69426b4e5d3a2bcf1cd453ed18ecc5bf0505ec641f27b

## 2026-10-13 開発28：バトルの決着の短い曲（assets/audio/se/result_1013/）・開始画面の BGM・観客の声の既定

**決着の曲**（js/audio/audio-registry.js の BATTLE_WIN／BATTLE_LOSE。WIN!／LOSE の帯と同時に1回・そのとき戦闘の BGM は止める。野生・レア・ライバル・大会・修行で共通）：

| 用途 | ファイル | 元・作者・配布元 | ライセンス | 長さ | 元の音量 | gain |
|---|---|---|---|---|---|---|
| 勝ち（BATTLE_WIN） | win_fanfare12_4s.ogg／.m4a | 「ファンファーレ12」/ red bears https://www.nakano-sound.com/free/fn.html （先頭 4.00秒。ユーザー提供の完成ファイルをそのまま＝sha256 は assets/audio/se/result_1013/README.md） | 規約 https://www.nakano-sound.com/free/kiyaku.html ＝商用 OK・改変 OK・クレジット任意。音源そのものの二次配布・直接リンク禁止 | 4.000秒 | -9.1 LUFS（OGG）／-9.5（M4A） | 0.5 |
| 負け・降参（BATTLE_LOSE） | lose_gameover2_5s.ogg／.m4a | 「【効果音】ゲームオーバー＃２」/ ポケットサウンド https://pocket-se.info/archives/754/ （公式ページの「ダウンロード」から取得した gameover2.mp3・8.80秒・sha256 7028d3577d00d4e429e22e99a5a8e6504887d12895a054582d8c769271f9d761 の先頭 5.00秒。末尾 60ms のフェードだけ・48kHz） | 規約 https://pocket-se.info/rules/ ・FAQ https://pocket-se.info/faq/ ＝商用・ゲーム OK・加工 OK。**無料利用の条件＝クレジット表記またはリンク：「効果音：ポケットサウンド — https://pocket-se.info/」（この表と README に記載。公開ページにも載せる）**。直リンク・音素材そのものの二次配布・転売は禁止（ゲームに必要な5秒だけを組み込む・元のフル尺は置かない） | 5.000秒 | -11.1 LUFS | 0.63 |

旧 VICTORY（ObsydianX confirm_style_6_004）は登録だけ残し、バトルの勝利では鳴らさない（CHAPTER_CLEAR などのほかの場面は従来どおり）。

**開始画面の BGM（TITLE）**：ユーザー決定「タイトルに BGM を追加」（2026-10-05 PHASE B の無音を上書き）。候補「Top画面BGM」（assets/audio/bgm/candidates_1013/title_candidate.ogg＝BGM_CANDIDATES.TITLE_CANDIDATE）は作者・出典が納品物に無く未確認のため正式採用を**保留**。それまでの暫定＝権利確認済みの既存曲のうち候補にいちばん近い質感（テンポ 73.8 bpm → 80.7・明るさの重心 1733 Hz → 1774・静かな導入）の「Hopeful / Fukagawa」（DOVA-SYNDROME https://dova-s.jp/bgm/detail/19898 ・licensed_20261007/03_prologue_hopeful.ogg＝プロローグ Scene 3 と同じファイル・gain 0.44）。曲の減衰（84.0秒〜）の手前 83.8秒で頭（0.2秒）へ 1.2秒のクロスフェード（ファイルは加工しない）。候補の権利が確認できたら registry の TITLE の1行を替えるだけ。

**観客の声の既定**：短い 0.7秒 → 通常 1.0秒（CROWD_*_LONG）。iPhone の試遊「短すぎる」の判断。元の音源（Pixabay の3音源）は手元に無く、1.3〜1.8秒の再カットはできない（線形の伸長は不自然になるため行わない）＝今ある最長の 1.0秒を既定に。利用者が選んだ設定（localStorage mmcrowd）はそのまま。音源・gain は変えていない。

## 2026-10-13 開発27（17）：立体サイコロの SE＝着地の足音だけ（assets/audio/se/dice_1013/）

iPhone の試遊：投げ・回転・結果で重なる魔法的な「ヒュイン」だけを外す（好評の着地音は残す）。新しい音源は足していない。
- 作り方（tools/dice1013/se_cut.py）：A−B（下の A＝足音あり・B＝同じ合成の足音なし）＝足音「トンッ（0.88秒）、ト（1.115秒）、トン（1.275秒）」だけ。投げる風（A1 "Magical Whoosh"）・止まる光（C1 "Magic Spell 02"）は入らない。足音の大きさ・時刻は元のまま。
- 出力：dice_cube_throw_land.ogg（ファイル名は同じ・1.595秒・-25.5 LUFS（短い足音だけのため全体の値は下がる。足音そのものの大きさは変えていない）・ピーク -4.9 dBFS・sha256 89b4e05fa5389f2a72c111c3f2ecceb8c80ed92b1937b3900fd5606dc256e5cb）＝DICE_CUBE（gain 0.9 のまま）。下の開発25 の版は置き換えた。

## 2026-10-13 開発25：立体サイコロの SE の中間を無音に（assets/audio/se/dice_1013/）【試遊・ユーザー承認待ち】

指示＝「投げる音 → 回っている間は無音 → 着地音」・重複なし。新しい音源は足していない（既存の2本から作った派生）。
- 元：A＝assets/audio/se/dice_1012/dice_magic_b4_long_tap.ogg（2026-10-12 正式採用。sha256 1872dcff07de6d1e81e99bed7cbc57400932173dca518dca89116bd76151da39）、B＝prototype/dice_1012/se/dice_magic_b4_long.ogg（同じ回転音で着地の打音なし。sha256 faac8bf30c6536a59ac41065623df51472613408b0f2d075fcaf41cb4c116bc3）。原音の出典は上の 2026-10-12 の表（Pixabay Content License）と既存の正式 SE 05_small_monster_entry_steps_4step
- 作り方（tools/dice1013/se_cut.py）：0〜0.46秒＝A の投げる音（0.34〜0.46秒でフェードアウト）／0.46〜0.855秒＝無音／0.855〜1.10秒＝A−B（1回目の着地の打音だけ）／1.10秒〜＝A（2回目・最後の着地「ト、トン」）。サイコロの動き（I1 0.90・I2 1.14・L 1.30秒）は変えていない
- 出力：dice_cube_throw_land.ogg（1.595秒・48kHz・Vorbis q5・-17.6 LUFS・ピーク -4.5 dBFS・sha256 3b31b4e75b1a6a53ca0f0d0c8123017131216e18222087e93767b65ea2d4b710）＝SE_REGISTRY の DICE_CUBE（gain 0.9 のまま）。A のファイルは残す（ほかから参照しない・戻すときは registry の1行）

## 2026-10-13 開発24：NPC のボイス（assets/audio/voice/npc_1013/）【試遊採用】

ユーザー提供の音声（ZIP の 03_voices/。元の MP3 から OGG Vorbis／AAC M4A に変換したもの＝ユーザー側の変換。リポジトリでは無加工。新しい台詞の生成・切り貼りはしていない）。
**音声の生成元（合成音声サービスなど）とその利用規約・声の権利関係は、会話からは特定できていない＝公開前の確認事項**（ユーザーが自作・利用許可を持つ前提で試遊に組み込む）。好みに合わなければ、設定の「ボイス」をオフ、または js/audio/audio-registry.js の VOICE_REGISTRY の enabled／js/npc/voice-cues.js の CUES の on を false にするだけで止められる（ファイルを消すときは VOICE_REGISTRY の行も消す）。

| id | 話者・台詞 | 元ファイル（sha256） | 長さ | 元の音量 | gain | 既定 |
|---|---|---|---:|---:|---:|---|
| fina_hello | fina「こんにちは」 | フィナ、こんにちは(2).mp3（be4614955bd5c261f318f588cfd915cdc5285e0256c079f1c396138c7159ec27） | 1.071秒 | -19.9 LUFS | 1.24 | ON |
| fina_yeah | fina「やったね」 | フィナ、やったね！(1).mp3（1a358eddb1bfd14650250b0da490394e2baa23ebd4a41022930656b3d25bfdae） | 0.993秒 | -19.7 LUFS | 1.22 | ON |
| fina_hmm | fina「うーん」 | フィナ、うーん(2).mp3（f14e08c7ba54b5b4aaf76792d1de60b1ae18e98f75d1096a868f541cdff4d5ce） | 1.489秒 | -21.7 LUFS | 1.53 | ON |
| fina_look | fina「見て見て」 | フィナ、見て見て(2).mp3（7e5989722540d36c7eeb27536c53409cde06c7bf246348567c6f4a6580c40b00） | 1.149秒 | -18.4 LUFS | 1.05 | ON |
| fina_hey | fina「もう」 | フィナ、もう！(2).mp3（5c598602227f68f6cd2b91ce70dc4da77cd973581d8e4a6b6768642735d2818d） | 1.071秒 | -20.9 LUFS | 1.4 | ON |
| fina_giggle | fina「えへへ」 | フィナ、えへへ(2).mp3（9986ea4c048a7b85c96a2bd6b5e11c6597ca7153dbb92a323ab6fe22fdb59782） | 0.914秒 | -24.6 LUFS | 2.14 | ON |
| fina_yes | fina「うん」 | フィナ、うん(2).mp3（6b08051b715ad9b6dcd5ee70bb42e16e95a65c12ae394db715ae97b71a78b607） | 0.601秒 | -20.4 LUFS | 1.32 | ON |
| fina_wonder | fina「なんだろう」 | フィナ、なんだろう？(1).mp3（2d7f4a5a20f217db8187d0935897ab31a524a5a2ab9e4b2cae92cdee9b501595） | 1.149秒 | -24.2 LUFS | 1.91 | ON |
| dan_hello | dan「やあ」 | ダン、やあ(3).mp3（6333d51e8f8b38a220fa5e2d1f0cfca37ed93401e4f82b1897163561c58cce92） | 0.679秒 | -18.3 LUFS | 1.03 | ON |
| nick_hello | nick「やあ」 | 牧場、やあ(1).mp3（93ac8f805b3d87c13092f06d4e27ea5b8f0a7caf6bc1f374fd5ac19f5368c2ec） | 0.914秒 | -25.6 LUFS | 2.4 | ON |
| berna_welcome | berna「いらっしゃい」 | アイテム屋、いらっしゃい(2).mp3（59b71f04d2a99173b8a8f00fcd07eb2b441f7eccdf02e5dc3601d344eac58a4b） | 0.993秒 | -19.3 LUFS | 1.16 | ON |
| karen_welcome | karen「市場の挨拶」 | 市場ボイス(1).mp3（8913fb3fc498229fe66e94531f7f68cceac70a5eff68ade11f1abac71c3a9c4e） | 0.914秒 | -25.2 LUFS | 2.29 | ON |
| elliot_hello_OPTIONAL | elliot「やあ」 | 研究所、やあ.mp3（61e5821c7b97d7b7c29ea4408e7b27876a2c6e749f3adf666a9cb5626d877e58） | 0.757秒 | -19.3 LUFS | 1.16 | ON（2026-10-13 開発25：ユーザーが開発25 の ZIP で同じ MP3（sha256 一致）を研究所の再訪の挨拶として提供＝既存の OGG／M4A をそのまま有効化。id 名は互換のため OPTIONAL のまま） |

変換したファイルの sha256：
- berna_welcome.ogg：2885eedb01288d031c8c55229ea1aa168d583fd7c19db5d12a9b4f16aa3779be
- dan_hello.ogg：14f8e2eff84e40ff92ac3e277f7d63e29a63a2d929d0d35c039db1226744c751
- elliot_hello_OPTIONAL.ogg：60f86182e9e7b9067ac95397cb6398e14e082975fb6cf6a7570d2e77f43fbbd0
- fina_giggle.ogg：128dd2785d6cddc7b2ce977d872d71e1281c1797ef280ff4705be301fe9faa3e
- fina_hello.ogg：625d793d2e6816654fdcfa07ad41813ed165e932fe89f9a5c93ab9d7012a75be
- fina_hey.ogg：0c8dc7bbf060ba246a01ff4a8a851390679e4c05c407cfe7d50efd2e67d33eac
- fina_hmm.ogg：efbb76da020ba5f92a9d4a914f3f5306fba2387a50b6e5821839ce1f999bd860
- fina_look.ogg：8173b2160c82cb13b855fcd0afaa9595519ed439ef7035f6f99adfce442d575a
- fina_wonder.ogg：b5542fec30eb45a501f7974c5662aca6dc643d23acc5855de4ba875b8049566c
- fina_yeah.ogg：cf8640e2e949f0fa33428d0f6ba48958fd2f1d37b18f6fb6c9a4ff0688b13c42
- fina_yes.ogg：7a5b1da316c84f5fb893ea05082452654b4abf70512043fcc515f3aa5446689b
- karen_welcome.ogg：7fdf8167beb7d46165b92e586566c6c749d1d625bb75fa36a39deaf566d63546
- nick_hello.ogg：48709a946f1d22536c8b4d8b2a336609d385f2f1da17d6a302216176eb9326a7
- berna_welcome.m4a：46c1556288dd56d1d55104447db157b05c2629cc053183e6fb2813305009c5f9
- dan_hello.m4a：e69310a3101149a4ea3804516d348b24ef7b43b1ff31626c673d99ba813070d7
- elliot_hello_OPTIONAL.m4a：ff130c4c3a68834426b6338ff483bd5cc771436502c3babc90f9e85f09963ba7
- fina_giggle.m4a：eab35ffcf979e3d1308c513a64b117c814d1e7704da2b65c53f98d2b82cae832
- fina_hello.m4a：2742bddc067ff374cd672a62c09532995d1860b7e8a6f372d3ec89dba47e3a4c
- fina_hey.m4a：6c54b5286de62e3f8276fbdb0953bde89611bbe598ae4aabcf21c6d98b966b5b
- fina_hmm.m4a：92104f88f971620f645e8f66a8e69bbcae8ec1fd0826d054f27e0224396d8ecb
- fina_look.m4a：5c603006a92e9086d4724bf53d3409c465e6eddfeb32212cfab46940ffe37f5e
- fina_wonder.m4a：dc068539afdef01a6bdd029f56dafeb6a57af66af3e7a405ea2de451880e9f32
- fina_yeah.m4a：afa692c7cb4ae3ebd238265e67698f9a32ad52c61f9fcc729441baa393b0e9fc
- fina_yes.m4a：869d4607529e886a17265a1dd7c001e48a34f9664a3c87de74ba05b4e3465db3
- karen_welcome.m4a：35ff09960c5268795ea10f6d6432d5d042a091efd75cb3eec7ee0a16b9ff0b0e
- nick_hello.m4a：3a89ce23edf8464ba219f0eaa3e44cafc80a22ace01b6ecd4931d7bdfab0c98f

## 2026-10-13 開発25 追加便：NPC のボイス 12本・BGM の候補 3曲（ユーザー提供 ZIP「全NPCボイス15本_BGM3本」）【試遊・ユーザー承認待ち＝main 未統合】

ユーザー提供の MP3（元のファイル名・データのまま。sha256 は ZIP の 02_音源一覧とSHA256.csv と全部一致）を、リポジトリの側で **OGG Vorbis（-q:a 4・44.1kHz ステレオ）と AAC M4A（128k）に変換しただけ**（ffmpeg。EQ・音量・長さ・ピッチは変えていない・メタデータは外した）。元の MP3 はリポジトリに置かない。音量の差は registry の `gain`（約 -18 LUFS にそろえる。測り方は既存のボイスと同じ ffmpeg ebur128＝既存の fina_hello.ogg が -19.9 で一致）。
**音声・曲の生成元（合成音声サービス・作曲者など）とその利用規約・商用利用の条件は、ZIP に記載が無く未確認＝公開前の確認事項**（ZIP の 00_必ず読む.txt も「各音源の商用利用に必要な生成元の規約等は別途確認」）。

| id | 話者・台詞 | 元ファイル（sha256） | 長さ | 元の音量 | gain | 既定・出しどころ |
|---|---|---|---:|---:|---:|---|
| fina_hello（参照先＝fina_hello_new） | フィナ「こんにちは」（新） | フィナ、こんにちはNew.mp3（1f34af0fdc3ef7326a6044de0ab2af26d306add3e30aed91fb6b2abf51642d4e） | 1.149秒 | -16.9 LUFS | 0.88 | ON・従来の fina_hello の場面のまま（旧 fina_hello.ogg／m4a はファイルだけ残す） |
| cedric_opening | セドリック「さあ！いよいよ開幕です！」 | セドリック、さあ！いよいよ開幕です！.mp3（a42def5298b746d9ca660b8e8769a4711bbc294563dc37d857cbaf45fba77cc3） | 2.194秒 | -21.6 LUFS | 1.51 | ON・公式大会の開幕の会話の1行目 |
| serge_welcome | セルジュ「ようこそ」 | セルジュ、ようこそ.mp3（5c90e34ce74e947ef52b28c7a7b7b27ea2014313d822c2b079ca1a6a54f89598） | 0.993秒 | -19.4 LUFS | 1.17 | ON・聖獣士登録の受付の1行目・聖獣士管理局の再訪 |
| genshin_ack | ゲンシン「うむ」 | ゲンシン、うむ.mp3（7ebe1ae8f0713d86cd0e4aa839f37b652d17ea7757a37f1619462874adaa0f91） | 0.757秒 | -23.8 LUFS | 1.94 | ON・特訓をやり終えたとき |
| vargas_ack | ヴァルガス「うむ」 | ヴァルガス、うむ.mp3（20ff1775940ce0d18de15994bbb0218ab986d5078f7351818dba1d6e260c3ba6） | 0.679秒 | -25.6 LUFS | 2.39 | ON・闘技場（ロック中）でランクを認める一言のときだけ |
| ryu_hello | リュウ「よっ！」 | リュウ、よっ！.mp3（200a11c6aa24455a90fdddf22601fde64f13d712193ab5ed625e6b9e86521dfc） | 0.914秒 | -19.3 LUFS | 1.16 | ON・道中のライバルの遭遇でリュウが現れた瞬間 |
| ryu_chuckle | リュウ「へへっ」 | リュウ、へへっ.mp3（70cf3ff438b586941c574bccda73db1a02f628e345a5210ba3b5d64773eccdb3） | 0.836秒 | -24.4 LUFS | 2.08 | ON・ライバル戦でプレイヤーが負けた決着 |
| ryu_praise | リュウ「やるじゃん」 | リュウ、やるじゃん.mp3（e09131b2d8725487205d7d428b0c22b30fd6a127521f9df0137650bdb5d1f650） | 1.071秒 | -17.6 LUFS | 0.95 | ON・ライバル戦でプレイヤーが勝った決着 |
| leona_greet | レオナ「よく来ましたね」 | レオナ、よく来ましたね.mp3（53a04493029b0ef9d7750218193ffd2f98a33b7955b21816d962c73f52ca0a44） | 1.306秒 | -17.1 LUFS | 0.9 | 登録のみ（enabled:false・場面が未実装） |
| leona_prebattle | レオナ「さあ始めましょう」 | レオナ、さあ始めましょう.mp3（9ea9a186a1b2fc22878d39cf27581c2a42e65b11e23f35431892ff30acfa1764） | 1.802秒 | -16.2 LUFS | 0.81 | 登録のみ |
| ragnas_greet | ラグナス「来たか」 | ラグナス、来たか.mp3（dc6ca36410a14acb5548a209894b87df9a514c00408844ec6df271e76b056830） | 0.993秒 | -17.7 LUFS | 0.96 | 登録のみ |
| ragnas_prebattle | ラグナス「お前の力見せてみろ！」 | ラグナス、お前の力見せてみろ！.mp3（dd38fd192c8522a925787b7f20ef8fd1e8984c7bd43a6685b93b8c79aac14d46） | 2.351秒 | -13.6 LUFS | 0.6 | 登録のみ |

取り込んでいないもの：
- **アストラッド「来たか」（d3ad7bda81895d2c9dcbe5a32ced1abfa6dde42509d719c4343a95dbfd1ec552）・「お前の力、見せてみろ！」（3f485d20eb83871cba3fbcb0d0071f410e238b1cca4a62f617793e25ea1938f5）＝使用禁止の旧音源**（2026-10-13 の実装指示）。新しい「待っていた」「全力でこい！」は受け取った ZIP に無い＝未着（アストラッドの声は登録していない）。
- 研究所「やあ」（研究所、やあ(1).mp3・61e5821c7b97d7b7c29ea4408e7b27876a2c6e749f3adf666a9cb5626d877e58）＝開発24 の elliot_hello_OPTIONAL と同じ元音源＝二重に登録しない。

変換したファイルの sha256（OGG／M4A）：
- fina_hello_new：f7ee69d402c9a14fd145770765c0ae4fc40d21ddd0a19799b9eef3d60f852cb7／a7e11053d81fdbc9d01851f574e7b4dd682754f1d7a2c97915440e0eef45fddf
- cedric_opening：5427f8ff9f9f39bafeb88af00b6b6577115aecc4e68ee3a5152be34ff267a379／b6c16c3db98fed4be6f0594041f920b95a0a4a0cc66ad811d81684a3f3e01cad
- serge_welcome：7bf6ab448dbd05a0062c1217c9c96505aa201c8c32e0443d96765790cefbbfa7／192fb36c64b148cd74fc83d0d25f5c257d261ff71f1a555461b6e408b4bcb90a
- genshin_ack：09c5b0e462ced7d12e5a405f73ff77b92d742637c462a3a7aa3b5827957ab39a／9ba82d6b20c5f9c7819e9ae881f914c24cf7b66134c442e2532dc34247748fbd
- vargas_ack：16f17e474d306024ccbade8312bcc316140606b6d94153f8de8db5f04f07a197／411b947caf98485c058576915d7b527a3a58ebafbc389934314554999f5e2f31
- ryu_hello：79f00c519e18ada9992a2fb51478f6a75adbeea986d642205e40e45831c480fa／cd212d1626c71fb697b40ae20970d36dd3b89b577dd04b89f5272c2be5ba825a
- ryu_chuckle：81a8fe1cf1c6eac1f7ccf11275b61a520083e9d71d9532628176c79302c0efa3／5a0adf55b51f6944390e6a4bb32b7d6cd44cc8d9cab881c6eecb604528929af0
- ryu_praise：e6d314206f9b5f0b2785c7951cd8e156a8c36f0a8552feec4eff0275fd8926a4／d41c126f094597d60da364c653bad8192529fb58c97c29b15d6d60f924829d36
- leona_greet：bf6f0a80d2ab81dac99d0acd103670afa44a5af2f5c816df84e1ff833522e79c／ab8b741acea99a36231505d9d1fb2421fedc87220eeffec7c081bbeed71d4d86
- leona_prebattle：5385274790b791133b69662911fcd73d576036091f87cb7d0b79951ad8befab2／f78bd4989eea385566126f38428db21bf96724866feb07176ee5ef61dfeaaeab
- ragnas_greet：bcb50fafb456ec8ee784b5ef5f2b614238b67af7a2eb456feb19c06e96421b60／a37dcd25589ef211d957f2cb14b22e60ddd28fa954b846eaef9711fff46ea4ac
- ragnas_prebattle：02d8c86637b4d03bebee03c0bfddb1a0e56838d14f59272f8cfce79bda81d350／08023fa1f06e982478327e4bbbc9defe882f86d643d8478f22d5b3360410def6

**BGM の候補 3曲（assets/audio/bgm/candidates_1013/・OGG Vorbis q5）＝試聴だけ・どの場面からも鳴らない**（js/audio/audio-registry.js の BGM_CANDIDATES＝MMAUDIO に登録しない。採用する場所と鳴らし始めは未決＝ユーザーの判断待ち）：

| 候補 | 元ファイル（sha256） | 長さ | 元の音量 | gain（目安） | 今の正式（変えていない） |
|---|---|---:|---:|---:|---|
| TITLE_CANDIDATE（title_candidate.ogg・d032ae4f001caad1338fd8e1e29e32f443f9ee18736273e76bb9b88172afba25） | Top画面BGM.mp3（00c152d2f41d24950a44177ee4b01a8e0aee4b07791b70336cc999010d193df1） | 230.9秒（頭に約0.56秒・終わりに約1.7秒の無音） | -7.1 LUFS | 0.29 | TITLE＝silent（開始画面は無音） |
| ARENA_CANDIDATE（arena_candidate.ogg・db1bbbd34c5b4774a282ad9cfc36eadd7befb17ce1f3fdf7eadb3d362157ec31） | 闘技場BGM.mp3（55fe44454bf329fc2402c23b6a4f96f64cc61d10b9321ff00f3577ec0823e611） | 185.7秒 | -9.7 LUFS | 0.39 | ARENA＝Swords At Midnight Loop（闘技場の画面は未実装） |
| LEGEND_BATTLE_CANDIDATE（legend_battle_candidate.ogg・28f56e01360c7887c7d92df0291af1de7c98ab3324a84456b44e3a27d060f542） | レジェンド戦BGM.mp3（47d9dfa4b86572bdb1f357a976f91b91183779b57b6ddf337e7ce7bf96b87a18） | 271.6秒（終わりに約1.3秒の無音） | -8.9 LUFS | 0.35 | 三伝説との対戦は未実装（公式大会・野生・レア・ライバルの曲は変えていない） |

## 2026-10-13 開発26：確定ボイス 15本（ユーザー提供 ZIP「ミスモン開発26_確定ボイス15本_PR24最小差分」）【試遊・ユーザー承認待ち＝main 未統合】

ZIP の同梱の OGG／M4A をそのまま置いた（リポジトリの側では変換・加工していない。ZIP の manifest_voice15.json によると、新しい13本は loudnorm I=-19 LUFS・TP=-2 dBTP で OGG q5／AAC 128k に変換したもの、アストラッドの2本は以前に検証済みの公式補足パックの派生）。元の MP3（original_MP3/）はリポジトリに置かない（ユーザーが保管）。sha256・長さは manifest と全部一致し、30ファイルとも最後までデコードできることを確認した。
同じ id のファイルは中身だけ差し替えた（フィナ8本・ダン・ニック・ベルナ・レオナ2本＝出しどころ・登録 id は変えていない）。上の開発24・開発25 追加便の表の元ファイル・sha256・音量は差し替え前の記録。gain＝約 -18 LUFS にそろえる従来の計算（10^((-18.04−LUFS)/20)。LUFS は manifest の OGG の値）。
**声の生成元・利用規約・商用利用の条件は、ZIP に記載が無く未確認＝公開前の確認事項**（確認済みとはしていない）。

| id（ファイル） | 話者・台詞 | 元ファイル（sha256） | 長さ | 音量 | gain | 既定 |
|---|---|---|---:|---:|---:|---|
| fina_hello（fina_hello_new） | フィナ「こんにちは！」 | フィナ、こんにちは確定版.mp3（138baa8677fa636402f7152f636f116e0f26fe09b7217440ca3d6c2c25eb6d7c） | 1.071秒 | -19.03 LUFS | 1.12 | ON・従来の場面のまま |
| fina_yeah | フィナ「やったね！」 | フィナ、やったね！確定版.mp3（b8c8a5af315b8059dc763ef3bb24bfb873eb5a50e844ff6b75f6d36265bd7e49） | 0.993秒 | -19.07 LUFS | 1.13 | ON・従来の場面のまま |
| fina_hmm | フィナ「うーん……」 | フィナ、うーん、、確定版.mp3（3745ed6a066924fc8e38869725131f9cb217843bd7e75d11a1137084cea58a78） | 1.646秒 | -18.94 LUFS | 1.11 | ON・従来の場面のまま |
| fina_look | フィナ「見て見て！」 | フィナ、見て見て！確定版.mp3（37b9ea61dd7489e050b5d4f4cc5a3bfa8ea5cf2635d77c49f0a75a171df9b498） | 0.993秒 | -19.04 LUFS | 1.12 | ON・従来の場面のまま |
| fina_hey | フィナ「もう！」 | フィナ、もう！確定版.mp3（8164f8aee112f14f59ad2cb642d219243c4a43c9ece3e8face382f569b3ae06e） | 1.228秒 | -19.1 LUFS | 1.13 | ON・従来の場面のまま |
| fina_giggle | フィナ「えへへっ」 | フィナ、えへへっ確定版.mp3（c8e1ec7038ac8fd5d565fd6a017d98895f5ef400dda6864d1e18c0138969c8de） | 0.914秒 | -19.04 LUFS | 1.12 | ON・従来の場面のまま |
| fina_yes | フィナ「うん！」 | フィナ、うん！確定版.mp3（f9a1596748e8781b9d6a7bec65c8250807bc4ddaa154ae3b3dae77f989922bf4） | 0.679秒 | -18.99 LUFS | 1.12 | ON・従来の場面のまま |
| fina_wonder | フィナ「なんだろう？」 | フィナ、なんだろう？確定版.mp3（8b18f46f924d8bf6235e769db064fba374940e20accb9f1bbaf3e82893a2f73f） | 1.071秒 | -18.99 LUFS | 1.12 | ON・従来の場面のまま |
| berna_welcome | ベルナ「いらっしゃい」 | ベルナ、いらっしゃい確定版.mp3（80fa83329146c8cd81e8a3bfd6fae9693831c1d42dc3148b51cbf43708597c24） | 0.993秒 | -18.97 LUFS | 1.11 | ON・従来の場面のまま |
| nick_hello | ニック「今日も元気そうだな」 | ニック、今日も元気そうだな確定版.mp3（1fc2679a0c552c121e8edbaf1c2d9cdb69818926a87ac4fdf9eb97ad353b170f） | 1.802秒 | -19.06 LUFS | 1.12 | ON・従来の場面のまま |
| dan_hello | ダン「よう、準備はできたか？」 | ダン、よう準備はできたか？確定版.mp3（3e92502950bcd8a73b440bcb43dd8c29729bfafa2842c49fdf71257243a7d018） | 2.038秒 | -19.02 LUFS | 1.12 | ON・従来の場面のまま |
| leona_greet | レオナ「よく来ましたね」 | レオナ、よく来ましたね確定版.mp3（0564a6ff38bb379de90794d88ff460eff23f9a560e73101f0b13952cd65a20fa） | 1.489秒 | -19.1 LUFS | 1.13 | 登録のみ（enabled:false） |
| leona_prebattle | レオナ「あなたの信念が本物なら、その力を私に示してみなさい」 | レオナ、バトル導入前確定版.mp3（340fa01910eb90701ca2eed214be0c9511766a2d23a65ae399e1c4ec0d1b15c1） | 5.0秒 | -18.5 LUFS | 1.05 | 登録のみ（enabled:false） |
| astrad_greet | アストラッド「待っていた」 | 追補ZIP/astrad_greet.mp3（583cd34c927407d052dd161734252ff68e74f6a9fad49c76dc84ff1e1c8a9603） | 1.411秒 | -19.26 LUFS | 1.15 | 登録のみ（enabled:false・新規） |
| astrad_prebattle | アストラッド「全力でこい！」 | 追補ZIP/astrad_prebattle.mp3（9b6f8a5361ecbccf2101475d39c1339d6600de51709856dbefbdb114484430ea） | 1.228秒 | -19.24 LUFS | 1.15 | 登録のみ（enabled:false・新規） |

アストラッドの2本は、使用禁止の旧音源（「来たか」d3ad7bda…・「お前の力、見せてみろ！」3f485d20…）とは別の新しい声（元の sha256 が違う）。旧音源は今回も取り込んでいない。

ファイルの sha256（OGG／M4A）：
- fina_hello_new：766fb3b74d9fa69871e498787de015529ff4493d5b13723216393342187ed113／a4f4b0c11975b598fff7c318d7265ce543c63638cc00150d1d9702e69e84e66b
- fina_yeah：1588f55ca9945f99fd639a15f0fe0b5230c7f5223af8cacf33a564891fcb1403／d1cdf170b6d3c1b197fffc11bf87a1b4ee325aa3c8d7f8ad71d8426f286b39da
- fina_hmm：fbb79971622541a38392dab047b375df5fa02636e879a3dbf93f37f2c8d39d40／bafbbb352fe839739d03754ddacc988a55b7daec038b12dea52bc9d58ebefe84
- fina_look：19a3864a9c130a6f1ddf604dab6e8ef2b26594ae075a54394495fdedcee2cdeb／20d8da368049933907615be0231a8649b84d0813839d976da7d50e762a629f48
- fina_hey：2a1d20e887cf68a78ab425cc6984cb394a1714d5ba6e906783e04046a7a6ebb6／e0509dd462ef8c7572974298a348f1176ad97eb8b9539fddb89f92f33edfa813
- fina_giggle：d708489636186b98369af6ee191a628ac3ee086b2da79349a1e19533c9582ace／b490c598a9849c0e7210e2347263a2c7f0c2f00619fb5f636ba57827d19f1249
- fina_yes：6f0874ef1b55c01ff03205000a3c92614efba0124a3954b13ed0b3ad0650bcbc／0fb45e27f8436ef7218cd0d62fd482a68dc428cbad7c51dd886e6c8ab6eb1bd0
- fina_wonder：e7b67b0c707766a20e9f57778c5b52f52807903aaeb32f61ec98ffde5cbb6276／55c9f37e040ab6d359a330f2b378f666f159cec06742030253d5dcce27268580
- berna_welcome：2545dcfad61cfd62057c6719a403534ae5053ce537790265f038d95461686c92／e81d256fd352f5cad3a47d6e9208979cb6a80e6f341ba8d9bc8dac240022c2fb
- nick_hello：1fc591ed4cd5ccfc4846331113b3dab480bbd8383877d09f6e2ed152104ae6b3／4115afffb8222e2624ca481116deee9e54c34f1da16092c19052c541f39966fa
- dan_hello：64d5ec0274572363c8da363a4c50bb85a172fac8455036c701f2d71b3d7c57b5／132b2660ec75ffff09ba4fd592202a84e7207c46dfd210acfbb46222d4c3c9ff
- leona_greet：d9d26c74f737c4ee55719b1ec8b84b05d9ca925302cd316d4bd3fef80f2ae00c／d5b156ec443599348395a2dd148c15ed3a790441f9e1e067b6cc1722426b2a40
- leona_prebattle：0883100e02021d852aa0e740ebb794febf57c47ca151bb870d7f41390f279960／7ea5e41520d98a22a6fa5a83e1a1d9bd1483e981bd24fbb11070450d42d64d5a
- astrad_greet：24385b57ddc04ce19bb5fc5801b1ffbf34251c03df81b0ee76427fe9a7f9341b／b44d5ea8293d90762fb778a8fb80d52081e1f6140bd087c5c3d9e3be5d9f70d7
- astrad_prebattle：478645adf4ca4775ffcac4c45bd3f57bd53ad5a2ce39e42913d4f243aaa1fca8／e459fbb2ba5830159fdc713ed7c3a9f0e242041cdc95b84270624e818a284977
