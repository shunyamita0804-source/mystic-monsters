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
