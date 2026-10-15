# NPC ボイスの差し替え台帳（2026-10-15 N04）

2026-10-13〜14 に入れた NPC のボイス（無料で作った声）は、商用のゲームに使えない認識（ユーザー通知 2026-10-15）。新しい声（有料プランで作り直し・週末に納品予定）が届くまで、ゲームでは一切鳴らさない。

## 今の状態

- **全停止**：js/audio/audio-manager.js の `VOICE_BLOCKED = true`。利用者の設定（localStorage `mmvoice` の on）に関係なく `MMAUDIO.voice()` は鳴らさず `blocked` を返す。ファイルも取りに行かない（load／prefetch しない）。設定の画面の「ボイス」は「準備中（新しい声の収録待ち）」の表示だけ。
- **ファイルは公開サイトから外した**：`assets/audio/voice/npc_1013/` の音声 54本（OGG 27・M4A 27）を git の今の木から削除＝GitHub Pages の配信から外れる（公開 URL で 404 になることを確認する）。
- **残したもの**：声の id・話者・台詞・出しどころ（js/audio/audio-registry.js の `VOICE_REGISTRY`＝`src` は空）、出しどころの設計（js/npc/voice-cues.js の `CUES`・`LINE_VOICE`、会話の行の `voice`）、その順番と時刻。台詞・会話・字幕は変えていない。
- **まだ残っているもの（報告）**：git の履歴（コミット 72fbfbc〜2f0c748 など）には旧ファイルが残る＝GitHub のリポジトリの過去のコミットからは取り出せる。履歴の書き換え（強制 push）は無断では行わない。GitHub Pages の CDN のキャッシュは `max-age=600`（約10分）で切れる。利用者の端末のブラウザのキャッシュに残っている分は消せない（ゲームからは再生しない）。

## 新しい声が届いたら（別の作業）

1. 新しい声のライセンス（商用のゲームでの利用・再配布の条件）と納品日を確かめる。旧い無料の声を「作り直したから」と戻さない。
2. 新しいフォルダ（例 `assets/audio/voice/npc_YYYYMMDD/`）に OGG と M4A を置き、README.md に元ファイル・sha256・ライセンスを書く。AUDIO_CREDITS.md にも書く。
3. `VOICE_REGISTRY` の該当の id の `src` に新しいファイルを書き、`gain` で約 −18 LUFS にそろえる（id を変えなければ、出しどころはそのまま鳴る）。
4. js/audio/audio-manager.js の `VOICE_BLOCKED` を false にし、設定の画面の「ボイス」の切り替えを戻す（index.html の trialRows は自動で戻る）。テスト（tests/voice-stop-1015.test.mjs）を新しい状態に合わせる。

## 対応表（26 の id）

| id | 話者 | 台詞 | 出しどころ（cue／会話の行） | 削除した旧ファイル（sha256 の先頭16文字） | 新しいファイル |
|---|---|---|---|---|---|
| `fina_hello` | フィナ | こんにちは | 会話の行の voice（序盤の最初の声かけ OPEN_TALK・旧フィナの紹介） | fina_hello_new.ogg（766fb3b74d9fa698）<br>fina_hello_new.m4a（a4f4b0c11975b598） | 未着 |
| `fina_yeah` | フィナ | やったね | 行の voice（初優勝・育成完了）＋cue fina.challengeOk（封印の遺跡門の成功） | fina_yeah.ogg（1588f55ca9945f99）<br>fina_yeah.m4a（d1cdf170b6d3c1b1） | 未着 |
| `fina_hmm` | フィナ | うーん | 行の voice（「……話は聞いてるんだけどな。」・初めての大会で優勝できなかった）＋cue fina.challengeNg | fina_hmm.ogg（fbb79971622541a3）<br>fina_hmm.m4a（bafbbb352fe83973） | 未着 |
| `fina_look` | フィナ | 見て見て | 行の voice（「見て、…」の行）＋cue fina.discover（宝の行き止まり・隠れ家・45秒は繰り返さない） | fina_look.ogg（19a3864a9c130a6f）<br>fina_look.m4a（20d8da3680499339） | 未着 |
| `fina_hey` | フィナ | もう | 行の voice（「もう、リュウったら……」） | fina_hey.ogg（2a1d20e887cf68a7）<br>fina_hey.m4a（e0509dd462ef8c75） | 未着 |
| `fina_giggle` | フィナ | えへへ | 行の voice（名前を呼ぶ・「ふふ、大丈夫。」・最初の相棒） | fina_giggle.ogg（d708489636186b98）<br>fina_giggle.m4a（b490c598a9849c0e） | 未着 |
| `fina_yes` | フィナ | うん | 行の voice（「うん。」で始まる行） | fina_yes.ogg（6f0874ef1b55c01f）<br>fina_yes.m4a（0fb45e27f8436ef7） | 未着 |
| `fina_wonder` | フィナ | なんだろう？ | 行の voice（初めてのレアのフィナの一言 ch1_first_rare） | fina_wonder.ogg（e7b67b0c707766a2）<br>fina_wonder.m4a（55c9f37e040ab6d3） | 未着 |
| `dan_hello` | ダン | よう、準備はできたか？ | cue facility.farm（ベースキャンプの再訪の入口） | dan_hello.ogg（64d5ec0274572363）<br>dan_hello.m4a（132b2660ec75ffff） | 未着 |
| `nick_hello` | ニック | 今日も元気そうだな | cue facility.ranch（牧場の再訪の入口） | nick_hello.ogg（1fc591ed4cd5ccfc）<br>nick_hello.m4a（4115afffb8222e26） | 未着 |
| `berna_welcome` | ベルナ | いらっしゃい | cue facility.shop（アイテム屋の再訪の入口） | berna_welcome.ogg（2545dcfad61cfd62）<br>berna_welcome.m4a（e81d256fd352f5ca） | 未着 |
| `karen_welcome` | カレン | いらっしゃい | cue facility.market（市場の入口） | karen_welcome.ogg（7fdf8167beb7d461）<br>karen_welcome.m4a（35ff09960c526879） | 未着 |
| `elliot_hello_OPTIONAL` | エリオット | やあ | cue facility.lab（研究所の再訪の入口） | elliot_hello_OPTIONAL.ogg（60f86182e9e7b906）<br>elliot_hello_OPTIONAL.m4a（ff130c4c3a688344） | 未着 |
| `cedric_opening` | セドリック | さあ！いよいよ開幕です！ | 行の voice（公式大会の開幕の会話の1行目 CEDRIC_EV.open） | cedric_opening.ogg（5427f8ff9f9f39ba）<br>cedric_opening.m4a（b6c16c3db98fed4b） | 未着 |
| `serge_welcome` | セルジュ | ようこそ | 行の voice（聖獣士登録の受付の1行目 OPEN_TALK.serge）＋cue facility.bureau（管理局の再訪の入口） | serge_welcome.ogg（7bf6ab448dbd05a0）<br>serge_welcome.m4a（192fb36c64b148cd） | 未着 |
| `genshin_ack` | ゲンシン | うむ | cue genshin.ack（特訓をやり終えた・0.35秒あと） | genshin_ack.ogg（09c5b0e462ced7d1）<br>genshin_ack.m4a（9ba82d6b20c5f9c7） | 未着 |
| `vargas_ack` | ヴァルガス | うむ | cue vargas.ack（闘技場（ロック中）でランクを認める一言・30秒は繰り返さない） | vargas_ack.ogg（16f17e474d306024）<br>vargas_ack.m4a（411b947caf98485c） | 未着 |
| `ryu_hello` | リュウ | よっ！ | cue ryu.appear（2026-10-13 開発27 で不採用＝off のまま） | ryu_hello.ogg（79f00c519e18ada9）<br>ryu_hello.m4a（cd212d1626c71fb6） | 未着 |
| `ryu_chuckle` | リュウ | へへっ | 行の voice（ライバル戦に負けたあとのボードの会話「へへっ、今日は俺の勝ちだな！」） | ryu_chuckle.ogg（81a8fe1cf1c6eac1）<br>ryu_chuckle.m4a（5a0adf55b51f6944） | 未着 |
| `ryu_praise` | リュウ | やるじゃん | 行の voice（ライバル戦に勝ったあとのボードの会話「やるじゃん！ …」） | ryu_praise.ogg（e6d314206f9b5f0b）<br>ryu_praise.m4a（d41c126f094597d6） | 未着 |
| `leona_greet` | レオナ | よく来ましたね | 【登録のみ】cue legend.leona.greet（off・三伝説の場面が未実装） | leona_greet.ogg（d9d26c74f737c4ee）<br>leona_greet.m4a（d5b156ec44359934） | 未着 |
| `leona_prebattle` | レオナ | あなたの信念が本物なら、その力を私に示してみなさい | 【登録のみ】cue legend.leona.battle（off） | leona_prebattle.ogg（0883100e02021d85）<br>leona_prebattle.m4a（7ea5e41520d98a22） | 未着 |
| `ragnas_greet` | ラグナス（人） | 来たか | 【登録のみ】cue legend.ragnas.greet（off） | ragnas_greet.ogg（bcb50fafb456ec8e）<br>ragnas_greet.m4a（a37dcd25589ef211） | 未着 |
| `ragnas_prebattle` | ラグナス（人） | お前の力見せてみろ！ | 【登録のみ】cue legend.ragnas.battle（off） | ragnas_prebattle.ogg（02d8c86637b4d03b）<br>ragnas_prebattle.m4a（08023fa1f06e9824） | 未着 |
| `astrad_greet` | アストラッド | 待っていた | 【登録のみ】（cue なし・場面が未実装） | astrad_greet.ogg（24385b57ddc04ce1）<br>astrad_greet.m4a（b44d5ea8293d9076） | 未着 |
| `astrad_prebattle` | アストラッド | 全力でこい！ | 【登録のみ】（cue なし・場面が未実装） | astrad_prebattle.ogg（478645adf4ca4775）<br>astrad_prebattle.m4a（e459fbb2ba583015） | 未着 |

登録から外れていた旧ファイル（参照なし・同じく削除）：fina_hello.m4a（2742bddc067ff374）、fina_hello.ogg（625d793d2e681665）

## 削除した 54本の sha256（全桁）

```
b44d5ea8293d90762fb778a8fb80d52081e1f6140bd087c5c3d9e3be5d9f70d7  astrad_greet.m4a
24385b57ddc04ce19bb5fc5801b1ffbf34251c03df81b0ee76427fe9a7f9341b  astrad_greet.ogg
e459fbb2ba5830159fdc713ed7c3a9f0e242041cdc95b84270624e818a284977  astrad_prebattle.m4a
478645adf4ca4775ffcac4c45bd3f57bd53ad5a2ce39e42913d4f243aaa1fca8  astrad_prebattle.ogg
e81d256fd352f5cad3a47d6e9208979cb6a80e6f341ba8d9bc8dac240022c2fb  berna_welcome.m4a
2545dcfad61cfd62057c6719a403534ae5053ce537790265f038d95461686c92  berna_welcome.ogg
b6c16c3db98fed4be6f0594041f920b95a0a4a0cc66ad811d81684a3f3e01cad  cedric_opening.m4a
5427f8ff9f9f39bafeb88af00b6b6577115aecc4e68ee3a5152be34ff267a379  cedric_opening.ogg
132b2660ec75ffff09ba4fd592202a84e7207c46dfd210acfbb46222d4c3c9ff  dan_hello.m4a
64d5ec0274572363c8da363a4c50bb85a172fac8455036c701f2d71b3d7c57b5  dan_hello.ogg
ff130c4c3a68834426b6338ff483bd5cc771436502c3babc90f9e85f09963ba7  elliot_hello_OPTIONAL.m4a
60f86182e9e7b9067ac95397cb6398e14e082975fb6cf6a7570d2e77f43fbbd0  elliot_hello_OPTIONAL.ogg
b490c598a9849c0e7210e2347263a2c7f0c2f00619fb5f636ba57827d19f1249  fina_giggle.m4a
d708489636186b98369af6ee191a628ac3ee086b2da79349a1e19533c9582ace  fina_giggle.ogg
2742bddc067ff374cd672a62c09532995d1860b7e8a6f372d3ec89dba47e3a4c  fina_hello.m4a
625d793d2e6816654fdcfa07ad41813ed165e932fe89f9a5c93ab9d7012a75be  fina_hello.ogg
a4f4b0c11975b598fff7c318d7265ce543c63638cc00150d1d9702e69e84e66b  fina_hello_new.m4a
766fb3b74d9fa69871e498787de015529ff4493d5b13723216393342187ed113  fina_hello_new.ogg
e0509dd462ef8c7572974298a348f1176ad97eb8b9539fddb89f92f33edfa813  fina_hey.m4a
2a1d20e887cf68a78ab425cc6984cb394a1714d5ba6e906783e04046a7a6ebb6  fina_hey.ogg
bafbbb352fe839739d03754ddacc988a55b7daec038b12dea52bc9d58ebefe84  fina_hmm.m4a
fbb79971622541a38392dab047b375df5fa02636e879a3dbf93f37f2c8d39d40  fina_hmm.ogg
20d8da368049933907615be0231a8649b84d0813839d976da7d50e762a629f48  fina_look.m4a
19a3864a9c130a6f1ddf604dab6e8ef2b26594ae075a54394495fdedcee2cdeb  fina_look.ogg
55c9f37e040ab6d359a330f2b378f666f159cec06742030253d5dcce27268580  fina_wonder.m4a
e7b67b0c707766a20e9f57778c5b52f52807903aaeb32f61ec98ffde5cbb6276  fina_wonder.ogg
d1cdf170b6d3c1b197fffc11bf87a1b4ee325aa3c8d7f8ad71d8426f286b39da  fina_yeah.m4a
1588f55ca9945f99fd639a15f0fe0b5230c7f5223af8cacf33a564891fcb1403  fina_yeah.ogg
0fb45e27f8436ef7218cd0d62fd482a68dc428cbad7c51dd886e6c8ab6eb1bd0  fina_yes.m4a
6f0874ef1b55c01ff03205000a3c92614efba0124a3954b13ed0b3ad0650bcbc  fina_yes.ogg
9ba82d6b20c5f9c7819e9ae881f914c24cf7b66134c442e2532dc34247748fbd  genshin_ack.m4a
09c5b0e462ced7d12e5a405f73ff77b92d742637c462a3a7aa3b5827957ab39a  genshin_ack.ogg
35ff09960c5268795ea10f6d6432d5d042a091efd75cb3eec7ee0a16b9ff0b0e  karen_welcome.m4a
7fdf8167beb7d46165b92e586566c6c749d1d625bb75fa36a39deaf566d63546  karen_welcome.ogg
d5b156ec443599348395a2dd148c15ed3a790441f9e1e067b6cc1722426b2a40  leona_greet.m4a
d9d26c74f737c4ee55719b1ec8b84b05d9ca925302cd316d4bd3fef80f2ae00c  leona_greet.ogg
7ea5e41520d98a22a6fa5a83e1a1d9bd1483e981bd24fbb11070450d42d64d5a  leona_prebattle.m4a
0883100e02021d852aa0e740ebb794febf57c47ca151bb870d7f41390f279960  leona_prebattle.ogg
4115afffb8222e2624ca481116deee9e54c34f1da16092c19052c541f39966fa  nick_hello.m4a
1fc591ed4cd5ccfc4846331113b3dab480bbd8383877d09f6e2ed152104ae6b3  nick_hello.ogg
a37dcd25589ef211d957f2cb14b22e60ddd28fa954b846eaef9711fff46ea4ac  ragnas_greet.m4a
bcb50fafb456ec8ee784b5ef5f2b614238b67af7a2eb456feb19c06e96421b60  ragnas_greet.ogg
08023fa1f06e982478327e4bbbc9defe882f86d643d8478f22d5b3360410def6  ragnas_prebattle.m4a
02d8c86637b4d03bebee03c0bfddb1a0e56838d14f59272f8cfce79bda81d350  ragnas_prebattle.ogg
5a0adf55b51f6944390e6a4bb32b7d6cd44cc8d9cab881c6eecb604528929af0  ryu_chuckle.m4a
81a8fe1cf1c6eac1f7ccf11275b61a520083e9d71d9532628176c79302c0efa3  ryu_chuckle.ogg
cd212d1626c71fb697b40ae20970d36dd3b89b577dd04b89f5272c2be5ba825a  ryu_hello.m4a
79f00c519e18ada9992a2fb51478f6a75adbeea986d642205e40e45831c480fa  ryu_hello.ogg
d41c126f094597d60da364c653bad8192529fb58c97c29b15d6d60f924829d36  ryu_praise.m4a
e6d314206f9b5f0b2785c7951cd8e156a8c36f0a8552feec4eff0275fd8926a4  ryu_praise.ogg
192fb36c64b148cd74fc83d0d25f5c257d261ff71f1a555461b6e408b4bcb90a  serge_welcome.m4a
7bf6ab448dbd05a0062c1217c9c96505aa201c8c32e0443d96765790cefbbfa7  serge_welcome.ogg
411b947caf98485c058576915d7b527a3a58ebafbc389934314554999f5e2f31  vargas_ack.m4a
16f17e474d306024ccbade8312bcc316140606b6d94153f8de8db5f04f07a197  vargas_ack.ogg
```
