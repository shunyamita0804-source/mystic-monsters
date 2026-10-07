// =========================================================
// 冒険リアクションイベント `MMREACT`（2026-10-07）
//  冒険中（Chapter のフィールド）に、モンスターが非言語のしぐさ（立ち止まる・こちらを見る・匂いを嗅ぐ…）→ フィナがその様子を解釈して話す →
//  プレイヤーが小さな選択肢で応える → 小さな結果、を短く挟む。**モンスターは喋らない**（喋るのはフィナだけ）。
//  ・共通モーション 15 種（MOTIONS）＋データ 100 件（EVENTS）。1件ごとの個別アニメーションは作らない（データ駆動）。
//  ・結果は既存の仕組みだけ：疲れの小さな増減（MMCH.addFatigue／recover）・6能力の +1（そのまま m[key]。999 まで）・既存アイテム（薬草）・演出だけ。
//    新しい永続パラメータ（親密度・信頼度・機嫌など）は持たない。原案の「宝箱率補助」「イベント補助」「分岐補助」「ライフ気分」などは仕組みが無いので演出だけにしている。
//  ・発生：通常マス（何も起きないマス）に止まったとき・確率 CHANCE・同じ Chapter で同じイベントは出さない・2ターン続けて出さない・薬草は 1 Chapter に1回まで。
//    記録はその Chapter の配置の中（m.raise.field.rx＝[id…]・rxTurn・rxItem。配置と一緒に消える任意項目＝storySeen と同じ扱い）。
//  ・レグナス（81〜100）はプレイヤーが育てられない種族のため、今は出ない（データだけ。sp 4）。
//  ・自動テストは MM_QA_NO_STORY（harness の既定）で出さない。
// =========================================================
(function (root) {
  'use strict';
  const CHANCE = 0.4, ITEM = 'herb';
  const SP_KEY = ['soramo', 'gauru', 'nobiton', 'jiol', 'regnas'];

  // ---- 共通モーション（#bmonw の .mon に class を付けて CSS アニメーション。形・位置だけで色は変えない） ----
  const MOTIONS = Object.freeze({
    stop: { ms: 700, css: '30%{translate:0 0;scale:1 .97}60%{scale:1 1.02}100%{scale:1 1}' },
    lookPlayer: { ms: 900, css: '25%{translate:0 2%;scale:1.06}70%{translate:0 2%;scale:1.06}100%{translate:0 0;scale:1}' },
    lookFina: { ms: 900, css: '25%{translate:-6% 0;rotate:-6deg}70%{translate:-6% 0;rotate:-6deg}100%{translate:0 0;rotate:0deg}' },
    lookAway: { ms: 1000, css: '20%{scale:-1 1}75%{scale:-1 1}100%{scale:1 1}' },
    sniff: { ms: 1000, css: '15%{translate:0 4%;rotate:4deg}30%{translate:0 2%;rotate:-2deg}45%{translate:0 4%;rotate:4deg}60%{translate:0 2%;rotate:-2deg}100%{translate:0 0;rotate:0deg}' },
    crouch: { ms: 1000, css: '25%{translate:0 6%;scale:1.05 .9}75%{translate:0 6%;scale:1.05 .9}100%{translate:0 0;scale:1 1}' },
    happy: { ms: 1000, css: '15%{translate:0 -10%}30%{translate:0 0}45%{translate:0 -8%}60%{translate:0 0}75%{translate:0 -4%}100%{translate:0 0}' },
    tired: { ms: 1100, css: '30%{translate:0 5%;scale:1.03 .93;rotate:-3deg}80%{translate:0 5%;scale:1.03 .93;rotate:-3deg}100%{translate:0 0;scale:1 1;rotate:0deg}' },
    inspectGround: { ms: 1100, css: '20%{translate:3% 6%;rotate:8deg}50%{translate:-3% 6%;rotate:-6deg}80%{translate:0 5%;rotate:4deg}100%{translate:0 0;rotate:0deg}' },
    tailReaction: { ms: 900, css: '20%{rotate:5deg}40%{rotate:-5deg}60%{rotate:5deg}80%{rotate:-3deg}100%{rotate:0deg}' },
    wingReaction: { ms: 1000, css: '25%{scale:1.14 1.02;translate:0 -3%}60%{scale:1.14 1.02;translate:0 -3%}100%{scale:1 1;translate:0 0}' },
    stoneReaction: { ms: 1100, css: '30%{translate:0 3%;scale:1.03 .97}45%{translate:0 0;scale:1 1}55%{translate:1% 0}65%{translate:-1% 0}75%{translate:1% 0}100%{translate:0 0}' },
    alert: { ms: 900, css: '15%{translate:0 -4%;scale:1 1.04}30%{translate:0 0;scale:1}45%{translate:2% 0}60%{translate:-2% 0}100%{translate:0 0}' },
    approach: { ms: 1000, css: '35%{translate:0 6%;scale:1.1}75%{translate:0 6%;scale:1.1}100%{translate:0 0;scale:1}' },
    backOff: { ms: 1000, css: '35%{translate:0 -4%;scale:.9}75%{translate:0 -4%;scale:.9}100%{translate:0 0;scale:1}' },
  });

  // ---- 100 件（原案「6. 冒険リアクションイベント案」）：[番号, 種族, 題, モーション, フィナの表情, フィナの言葉, 選択肢[[文, 結果, 返しの文?]]]
  //  結果：'' 演出だけ ／ 'f-3' 疲れ −3 ／ 'f+1' 疲れ +1 ／ 'hi+1' 能力 +1（li po in hi ev de）／ 'item' 薬草（1 Chapter に1回。2回目からは演出だけ）
  const RAW = [
    // ソラモ（素直・可愛い・甘えんぼ気味・元気）
    [1, 0, '草の匂い', 'sniff', 'smile', 'ソラモが草をくんくんしてる。お腹すいてるみたいだよ？', [['薬草を見せる', 'f-3'], ['なでる', ''], ['先へ進む', '', 'ちょっと名残惜しそうについてきた。']]],
    [2, 0, 'しっぽふり', 'tailReaction', 'happy', 'こっちを見て、しっぽを大きく振ってる！ 褒めてほしいのかも！', [['たくさん褒める', '', 'うれしくて、くるくる回ってる！'], ['軽くうなずく', 'hi+1']]],
    [3, 0, '花畑に寄り道', 'stop', 'smile', '花を見て座り込んじゃった。きれいって思ってるのかな？', [['少し休む', 'f-5'], ['一緒に眺める', '', 'ソラモ、なんだか満足そう。'], ['急ぐ', 'f+1']]],
    [4, 0, '小石ころころ', 'inspectGround', 'smile', '前足で小石を転がして遊んでる。遊びたいのかも。', [['少し遊ばせる', 'f-2'], ['取り上げる', '', 'ちょっぴりしょんぼり…'], ['一緒に転がす', 'po+1']]],
    [5, 0, '耳ぴくぴく', 'alert', 'surprised', '耳がぴくぴく動いてる。近くに何かあるのかな？', [['探す', 'item'], ['そのまま進む', '']]],
    [6, 0, 'こっちを見る', 'lookPlayer', 'normal', 'ソラモがぴたっと止まって、こっちを見上げてる。どうしたのかな？', [['目線を合わせる', 'ev+1'], ['先を急ぐ', '', 'ちょっとだけ首をかしげて、ついてきた。']]],
    [7, 0, 'おひるね前兆', 'tired', 'troubled', 'あくびして、丸くなりそう。少し眠いみたい。', [['休ませる', 'f-4'], ['声をかける', '', 'はっと目を開けて、また歩き出した。']]],
    [8, 0, '水辺きらきら', 'lookFina', 'smile', '水面をじっと見つめてる。水遊びしたいのかな？', [['少し近づく', 'f-2'], ['覗き込ませる', 'hi+1'], ['やめておく', '']]],
    [9, 0, 'ぴょんと跳ねる', 'happy', 'happy', 'ぴょんって跳ねた！ 調子よさそう！', [['励ます', 'ev+1'], ['見守る', '', 'もう一回、ぴょんと跳ねた。']]],
    [10, 0, '葉っぱをくわえる', 'approach', 'surprised', '葉っぱをくわえて見せてくれてる。おみやげかな？', [['受け取る', 'item'], ['そのまま持たせる', '', '得意げに葉っぱをくわえて歩いてる。']]],
    [11, 0, '日だまり好き', 'stop', 'smile', '日だまりで座り込んじゃった。ここ、気に入ったみたい。', [['少し休む', 'f-3'], ['促す', '', 'しぶしぶ立ち上がって、ついてきた。']]],
    [12, 0, 'ふわ毛づくろい', 'tailReaction', 'normal', '胸の毛を整えてる。身だしなみ中かな？', [['待つ', 'hi+1'], ['よしよしする', '', '目を細めて、気持ちよさそう。']]],
    [13, 0, '足もとすりすり', 'approach', 'happy', '足もとに寄ってきた。甘えてるね。', [['なでる', 'f-2'], ['しゃがんで見る', '', 'ソラモの目がきらきらしてる。']]],
    [14, 0, '遠くを見つめる', 'lookAway', 'normal', '風の向こうを見てる。先が気になるのかな？', [['すぐ進む', '', '元気よく先頭を歩き出した。'], ['少し観察する', '', '一緒に遠くを眺めた。']]],
    [15, 0, 'びっくり後退', 'backOff', 'surprised', '影にびくっとしちゃった。だいじょうぶ、怖くないよ。', [['落ち着かせる', 'ev+1'], ['先に進む', '', 'ぴったりくっついて歩いてる。']]],
    [16, 0, '転びそうで踏ん張る', 'crouch', 'surprised', '段差でぐっと踏ん張った！ えらいえらい。', [['褒める', 'de+1'], ['手早く進む', '', 'ふんっと胸を張ってついてきた。']]],
    [17, 0, '木陰でごろり', 'tired', 'smile', 'ごろんって転がった。遊びたいのかな？', [['少し付き合う', 'f-2'], ['起こす', '', 'ぱっと起きて、また歩き出した。']]],
    [18, 0, '香りのする花', 'sniff', 'smile', '花に鼻先を近づけてる。気になる香り？', [['摘まないで見る', '', 'うっとりした顔をしてる。'], ['離れる', '']]],
    [19, 0, '前足でちょんちょん', 'inspectGround', 'happy', '前足で地面をちょんちょん。やる気十分だね！', [['出発！', 'po+1'], ['落ち着こう', 'ev+1']]],
    [20, 0, '勝ち気な笑顔', 'crouch', 'serious', '何かの気配に、前向きな顔をしてる。戦いたそう！', [['任せる', 'hi+1'], ['まだ待つ', '', 'ぐっとこらえて、隣に戻ってきた。']]],
    // ガウル（俊敏・誇り高い・風を感じる・少し負けず嫌い）
    [21, 1, '風を読む', 'wingReaction', 'normal', 'ガウルが翼を広げて、風向きを確かめてる。風を見てるんだね。', [['任せる', 'hi+1'], ['声をかける', '', 'ちらっとこちらを見て、また風を読んだ。']]],
    [22, 1, '羽づくろい', 'stop', 'normal', '素早く羽を整えてる。準備してるみたい。', [['見守る', 'ev+1'], ['褒める', '', '誇らしげに羽を揃えた。']]],
    [23, 1, '高い所を見る', 'lookAway', 'surprised', '上を見上げてそわそわしてる。飛びたいのかな？', [['励ます', 'po+1'], ['抑える', '']]],
    [24, 1, '地面を爪で払う', 'crouch', 'serious', '地面を爪で払ってる。負けたくない顔してる！', [['気合を入れる', 'po+1'], ['落ち着かせる', 'hi+1']]],
    [25, 1, '強い向かい風', 'wingReaction', 'normal', '向かい風に目を細めてる。平気そうだね。', [['そのまま進む', 'ev+1'], ['休ませる', 'f-2']]],
    [26, 1, '羽根を落とす', 'wingReaction', 'smile', '小さな羽根がふわっと舞った。なんだか縁起がよさそう。', [['拾う', 'item'], ['そのまま', '']]],
    [27, 1, '鋭い視線', 'alert', 'surprised', '遠くの気配をとらえたみたい。何か見つけた？', [['周囲を探す', '', '見回してみたけど、気配はもう遠くへ行ったみたい。'], ['無視する', '']]],
    [28, 1, '誇らしげに胸を張る', 'lookPlayer', 'happy', '胸を張ってこっちを見てる。見て見てって感じだね。', [['褒める', 'hi+1'], ['うなずく', '', 'ふふん、と満足そう。']]],
    [29, 1, '急かすように歩く', 'approach', 'normal', '少し前へ出て振り返った。先へ行きたいみたい。', [['速く進む', 'f+1'], ['ペースを保つ', '', 'しかたないなって顔で並んだ。']]],
    [30, 1, '小枝を弾く', 'tailReaction', 'surprised', '小枝をぴんっと弾いた。器用だね！', [['遊ばせる', 'ev+1'], ['先へ進む', '']]],
    [31, 1, '日差しで羽が光る', 'wingReaction', 'happy', '翼を広げて日差しを浴びてる。気分よさそう！', [['見守る', 'po+1'], ['褒める', '', '羽がきらっと光った。']]],
    [32, 1, '負けず嫌い反応', 'alert', 'serious', 'ほかのモンスターの気配にぴりっとしてる。負けたくないんだね。', [['煽る', 'po+1'], ['なだめる', 'hi+1']]],
    [33, 1, '旋回したがる', 'happy', 'smile', 'その場で身をひるがえしてる。体がうずうずしてる？', [['少し動かす', 'ev+1'], ['先を急ぐ', '']]],
    [34, 1, '羽ばたきの風', 'wingReaction', 'surprised', 'すごい、羽ばたきで風がきた！', [['喜ぶ', 'hi+1'], ['落ち着く', '', 'ガウルも少し落ち着いたみたい。']]],
    [35, 1, '嘴でこつこつ', 'inspectGround', 'normal', '地面を嘴で軽くつついてる。何か気になるのかな。', [['調べる', 'item'], ['スルー', '']]],
    [36, 1, '前のめり', 'crouch', 'serious', '一歩前に出た。やる気満々！', [['任せる', 'po+1'], ['控えめに', '', '少し下がって、隣で構えた。']]],
    [37, 1, '風待ち', 'stop', 'normal', '静かに待ってる。タイミングを見てるのかも。', [['待つ', 'hi+1'], ['進む', '']]],
    [38, 1, '軽い着地遊び', 'happy', 'happy', '小さく飛び移って遊んでる。軽いねえ。', [['褒める', 'ev+1'], ['見守る', '', 'もう一度、ふわりと着地した。']]],
    [39, 1, '羽をすぼめる', 'lookAway', 'troubled', 'ちょっと拗ねたみたいに羽を閉じちゃった。褒め足りなかった？', [['褒める', '', '羽が少しだけ開いた。'], ['そのまま', '']]],
    [40, 1, '戦意の火花', 'alert', 'serious', '敵の影に、鋭く構えてる。本気の顔だね。', [['突き進む', 'hi+1'], ['慎重にいく', 'ev+1']]],
    // ノビトン（のんびり・不思議・食いしん坊・眠そう・独特）
    [41, 2, 'のそのそ停止', 'stop', 'smile', 'ノビトンがのそのそ止まった。ん〜、急がないタイプだね。', [['待つ', 'f-2'], ['せかす', '', 'ちょっとだけ早足になった…気がする。']]],
    [42, 2, 'おなかすいた顔', 'lookPlayer', 'smile', '口先をふにゃっと動かしてる。食べ物ほしいのかな？', [['薬草を見せる', 'f-3'], ['水を見せる', 'f-3']]],
    [43, 2, '眠気もーど', 'tired', 'troubled', '目がとろ〜んとしてる。寝そうだよ？', [['休む', 'f-5'], ['起こす', '']]],
    [44, 2, 'くんくん探索', 'sniff', 'surprised', '匂いを嗅いで、道をそれたがってる。何か見つけた？', [['ついていく', 'item'], ['呼び戻す', '']]],
    [45, 2, 'ぷるんと伸びる', 'crouch', 'normal', '体をぐ〜っと伸ばしてる。準備運動かな？', [['待つ', 'de+1'], ['進む', '']]],
    [46, 2, '水たまり興味', 'inspectGround', 'smile', '水たまりを覗いてる。映ってるの見てるのかな。', [['近づく', 'f-2'], ['やめる', '']]],
    [47, 2, '丸くなる', 'tired', 'troubled', 'その場で丸くなっちゃった。完全に休憩する気だ…', [['少し休む', 'f-4'], ['声をかける', '', 'のっそり起き上がった。']]],
    [48, 2, '鼻先ぺたん', 'inspectGround', 'surprised', '地面に鼻先をぺたん。におい、強いのかな？', [['辺りを探す', '', 'ノビトンはしばらく嗅いで、満足したみたい。'], ['そのまま', '']]],
    [49, 2, 'やさしい見上げ', 'lookPlayer', 'happy', 'こっちを見上げてる。甘えてるねえ。', [['なでる', '', 'ふにゃっと笑った。'], ['笑う', '', 'つられて、ゆっくりしっぽを振った。']]],
    [50, 2, '重心どっしり', 'stoneReaction', 'normal', 'どっしり構えて動かない。ここ、気に入った？', [['少し待つ', 'de+1'], ['移動する', '']]],
    [51, 2, '食べられそう？', 'sniff', 'troubled', '草をじ〜っと見てる。それ、食べるのかな…？', [['止める', ''], ['見守る', '', 'もぐもぐ…ちょっと満足そう。']]],
    [52, 2, 'ぽてぽて歩き', 'happy', 'smile', '独特なテンポで歩いてる。かわいいけど、遅いかも。', [['合わせる', 'f-2'], ['急かす', 'hi+1']]],
    [53, 2, '石に寄りかかる', 'tired', 'normal', '石に寄りかかってる。休みたいのかな。', [['休憩', 'f-3'], ['先へ', '']]],
    [54, 2, '気配に反応', 'alert', 'surprised', '何か感じたみたい。', [['慎重に進む', 'hi+1'], ['普通に進む', '']]],
    [55, 2, '木の実見つけた', 'lookAway', 'smile', '木の実をじっと見てる。ほしいのかな。', [['取ってみる', 'item'], ['進む', '']]],
    [56, 2, 'ふわっと笑う顔', 'happy', 'happy', 'ふわっと笑った。うれしそうだね。', [['褒める', 'f-2'], ['見守る', '']]],
    [57, 2, '口先でつんつん', 'inspectGround', 'surprised', '何かをつんつんしてる。気になって仕方ないのかな。', [['調べる', '', '小さな虫だった。ノビトン、じっと見送ってる。'], ['やめる', '']]],
    [58, 2, 'のびーっと首', 'lookAway', 'normal', '首をのび〜っとのばしてる。遠く見てる？', [['見渡す', '', '一緒に遠くを見渡した。'], ['進む', '']]],
    [59, 2, 'ぽかぽか好き', 'stop', 'smile', '日向に居座ってる。ぬくいの好きなんだね。', [['休む', 'f-4'], ['促す', '']]],
    [60, 2, '不思議な気配', 'alert', 'surprised', '変な気配に先に気づいたみたい。鼻、すごいかも！', [['備える', 'hi+1'], ['気にしない', 'de+1']]],
    // ジオル（無口そう・謎めく・重厚）
    [61, 3, '岩のように停止', 'stoneReaction', 'troubled', 'ジオルがぴたりと止まった。……この子、ほんと喋るのかな。', [['見守る', 'de+1'], ['軽く叩く', '', 'コン、と硬い音がした。']]],
    [62, 3, '地面を見つめる', 'inspectGround', 'normal', 'じっと地面を見てる。何か感じてるのかな？', [['周囲を探る', '', '辺りを探ったけど、ジオルはもう前を向いていた。'], ['進む', '']]],
    [63, 3, '石を食べる？', 'stoneReaction', 'surprised', '小石の近くで止まってる。え、何食べるんだろうねっ？', [['石を差し出す', '', '……じっと見つめて、そっと地面に戻した。'], ['やめておく', '']]],
    [64, 3, 'どっしり構える', 'stoneReaction', 'smile', '動かない…でも頼もしいね。', [['褒める', 'de+1'], ['先を急ぐ', '']]],
    [65, 3, '結晶がかすかに光る', 'stop', 'surprised', '結晶がかすかに光ってる。きれい…気分いいのかな。', [['観察する', 'in+1'], ['先へ', '']]],
    [66, 3, '重い足取り', 'tired', 'troubled', '足取りが重いみたい。疲れてるのかも。', [['休ませる', 'f-5'], ['進む', '']]],
    [67, 3, '岩肌こすり', 'stoneReaction', 'normal', '岩に体を当ててる。体の手入れかな？', [['見守る', 'de+1'], ['移動する', '']]],
    [68, 3, '黙ってこちらを見る', 'lookPlayer', 'surprised', '……今、こっち見たよね？', [['手を振る', '', '……ほんの少し、首が動いた。'], ['うなずく', '', 'ジオルも、ゆっくりうなずいた…ように見えた。']]],
    [69, 3, '結晶の反射', 'stop', 'happy', '光を受けてきらめいてる。すごい、ちょっと神秘的。', [['褒める', 'in+1'], ['一緒に眺める', '', 'しばらく、きらきらを眺めた。']]],
    [70, 3, '段差を確かめる', 'inspectGround', 'normal', '慎重に足場を確かめてる。慎重派なんだね。', [['ゆっくり進む', 'ev+1'], ['任せる', '']]],
    [71, 3, '地鳴りみたいな一歩', 'stoneReaction', 'happy', 'ずしん！ 今の一歩、ちょっとかっこいい。', [['褒める', 'po+1'], ['進む', '']]],
    [72, 3, '結晶が共鳴', 'alert', 'surprised', '周りの鉱石に反応してる。何か通じてるのかな？', [['調べる', 'item'], ['離れる', '']]],
    [73, 3, '長い沈黙', 'stop', 'normal', '……考えごとしてるように見える。', [['待つ', 'in+1'], ['声をかける', '', '……ゆっくり歩き出した。']]],
    [74, 3, '岩陰が好き', 'backOff', 'smile', '日陰に寄っていく。落ち着くのかな？', [['休む', 'f-3'], ['進む', '']]],
    [75, 3, '音に鈍い？', 'lookAway', 'troubled', '呼んでもゆっくり反応…。聞こえてる…よね？', [['近づく', '', 'ようやくこちらを向いた。'], ['そのまま', '']]],
    [76, 3, '結晶の欠片', 'inspectGround', 'surprised', '足もとに小さな欠片。落ちたのかな？', [['拾う', 'item'], ['そのまま', '']]],
    [77, 3, '敵気配で重心低く', 'crouch', 'serious', '重心を低くした。守る気まんまんだ。', [['頼る', 'de+1'], ['慎重に', '']]],
    [78, 3, '土の匂い', 'inspectGround', 'smile', '地面に触れて止まってる。土が落ち着くのかな。', [['少し待つ', 'f-2'], ['先へ', '']]],
    [79, 3, '珍しく早い反応', 'approach', 'surprised', 'おっ、意外と速い！ 何か見つけたのかな。', [['追う', '', '……何も無かったみたい。ジオルは平然としてる。'], ['見守る', '']]],
    [80, 3, '静かな信頼', 'approach', 'smile', '隣に無言で立ってる。なんか、守ってくれてる感じする。', [['ありがとう', '', '……ほんの少し、近くなった気がする。'], ['そっと進む', '']]],
    // レグナス（ツンツン・誇り高い・クール。プレイヤーは育てられない＝今は出ない）
    [81, 4, 'つんと横を向く', 'lookAway', 'troubled', 'こっちを見たと思ったら、すぐそっぽ…。かわいくないなー😒', [['放っておく', '', '……反応、うすい。'], ['軽く褒める', '', 'ちらっとだけこちらを見た。']]],
    [82, 4, '地面を鋭く蹴る', 'crouch', 'normal', '地面を鋭く蹴った。早く行きたいって感じだね。', [['進む', 'ev+1'], ['落ち着かせる', '']]],
    [83, 4, '視線だけで威圧', 'alert', 'surprised', '鋭い目…。うわ、こわ…でも頼もしい。', [['任せる', 'hi+1'], ['慎重に', '']]],
    [84, 4, '近づくと離れる', 'backOff', 'troubled', '近づくと離れる…。なつかないねえ。', [['追わない', ''], ['もう一度寄る', '', 'すっと一歩、離れた。']]],
    [85, 4, 'しっぽぱたん', 'tailReaction', 'troubled', 'しっぽで地面をぱたん。機嫌、よくはなさそう。', [['そっとする', ''], ['話しかける', 'hi+1']]],
    [86, 4, '高い場所を見る', 'lookAway', 'normal', '景色より、先の敵を見てるのかな。', [['見渡す', '', '一緒に先を見渡した。'], ['進む', '']]],
    [87, 4, '小さな返事', 'lookFina', 'smile', 'ふふ、ちょっとだけ返事した？', [['笑う', '', 'ぷいっと横を向いた。'], ['褒める', '', '……悪い気は、していないみたい。']]],
    [88, 4, '水面確認', 'stop', 'smile', '水に姿を映して見てる。かっこつけてる？', [['そう言う', '', 'じろっとにらまれた。'], ['黙っておく', '']]],
    [89, 4, '岩場で機嫌よし', 'happy', 'happy', '足場の悪いところで活き活きしてる。得意そうだね。', [['任せる', 'ev+1'], ['ついていく', '']]],
    [90, 4, '敵前で低姿勢', 'crouch', 'serious', '狙ってる顔だ…。', [['先手を意識', 'hi+1'], ['様子を見る', '']]],
    [91, 4, '触らせない', 'backOff', 'troubled', '手を伸ばすと一歩引く…。ほんと、かわいくないなー😒', [['笑う', ''], ['無理しない', '']]],
    [92, 4, '風を浴びる', 'stop', 'smile', '風を浴びてる。こういうの好きそう。', [['少し待つ', 'f-2'], ['進む', '']]],
    [93, 4, 'ひとりで先を見る', 'approach', 'normal', '少し前に出た。先導したいのかな。', [['任せる', ''], ['呼び戻す', '', '振り返って、しぶしぶ戻ってきた。']]],
    [94, 4, 'しっぽで進路示し', 'tailReaction', 'surprised', 'しっぽで方向を示してる？ 案内してるつもり？', [['従う', ''], ['別の道を見る', '', 'ふん、と鼻を鳴らすような仕草をした。']]],
    [95, 4, '静かな護衛', 'approach', 'smile', '少し前を歩いてる。なんだかんだ、守ってるよね。', [['ありがとう', '', '聞こえないふりをしてる。'], ['そっとしておく', '']]],
    [96, 4, '気まぐれ停止', 'lookPlayer', 'surprised', '急に止まって振り返った。ついてきてるか確認した？', [['うなずく', 'ev+1'], ['急がせる', '']]],
    [97, 4, '傷を気にする', 'tired', 'worried', '足もとを少し気にしてる。無理してないかな？', [['休ませる', 'f-4'], ['進める', '']]],
    [98, 4, '勝負顔', 'crouch', 'serious', '顔つきが変わった。本気だね。', [['任せる', 'po+1'], ['慎重に', '']]],
    [99, 4, 'ほんの少し甘える', 'approach', 'surprised', 'えっ、今ちょっと可愛かったよね？', [['褒める', '', 'すぐにそっぽを向いた。'], ['何も言わない', '']]],
    [100, 4, '背中で語る', 'stop', 'smile', '無言で前を向いてる。うん、行こうか。', [['出発する', ''], ['少し休む', 'f-2']]],
  ];
  const STAT_KEYS = ['li', 'po', 'in', 'hi', 'ev', 'de'];
  const DEF_REPLY = ['うれしそうに見上げている。', '誇らしげに胸を張った。', 'のんびりと首をかしげた。', '……静かにうなずいた、気がする。', 'ふん、とそっぽを向いた。'];
  function parseFx(c) {
    if (!c) return null;
    if (c === 'item') return { item: ITEM };
    let x = /^f([+-]\d+)$/.exec(c); if (x) return { fatigue: +x[1] };
    x = /^(li|po|in|hi|ev|de)\+(\d)$/.exec(c); if (x) return { stat: x[1], amount: +x[2] };
    throw new Error(`冒険リアクションの結果が不正です：${c}`);
  }
  const EVENTS = Object.freeze(RAW.map(([n, sp, title, motion, ex, line, ch]) => Object.freeze({
    id: `rx${String(n).padStart(3, '0')}`, n, sp, species: SP_KEY[sp], title, motion, expression: ex, line,
    choices: Object.freeze(ch.map(([label, fx, reply]) => Object.freeze({ label, fx: parseFx(fx), reply: reply || null }))),
  })));

  const fieldOf = (m) => (m && m.raise && m.raise.field) || null;
  /** 発生の判定：通常マスに止まったとき。同じ Chapter で同じ id は出さない・2ターン続けない。rng は 0〜1 */
  function pick(m, opts = {}) {
    const f = fieldOf(m), r = m && m.raise; if (!f || !r) return null;
    const rng = opts.rng || Math.random, turn = r.turnsUsed | 0, seen = Array.isArray(f.rx) ? f.rx : [];
    if (turn < 1 || (f.rxTurn != null && turn - f.rxTurn < 2)) return null;
    if (opts.force == null && rng() >= (opts.chance != null ? opts.chance : CHANCE)) return null;
    const pool = EVENTS.filter((e) => e.sp === (m.sp | 0) && !seen.includes(e.id));
    if (!pool.length) return null;
    return opts.force ? (EVENTS.find((e) => e.id === opts.force) || null) : pool[Math.floor(rng() * pool.length) % pool.length];
  }
  function mark(m, id) { const f = fieldOf(m); if (!f) return; f.rx = (Array.isArray(f.rx) ? f.rx : []).concat(id); f.rxTurn = m.raise.turnsUsed | 0; }
  /** 選んだ結果を反映（既存の仕組みだけ）。戻り値＝{ kind, text, fatigue?, key?, amount?, item? } */
  function apply(S, m, ev, idx) {
    const c = ev.choices[idx] || ev.choices[0], fx = c.fx, f = fieldOf(m), M = root.MMCH;
    const flavor = () => ({ kind: 'none', text: c.reply || DEF_REPLY[ev.sp] || '' });
    if (!fx) return flavor();
    if (fx.fatigue != null && M) {
      const d = fx.fatigue < 0 ? -M.recover(m, { amount: -fx.fatigue }) : M.addFatigue(m, fx.fatigue);
      return d ? { kind: 'fatigue', fatigue: d, text: c.reply || '' } : flavor();
    }
    if (fx.stat) { const b = m[fx.stat] || 0; m[fx.stat] = Math.min(999, b + fx.amount); const a = m[fx.stat] - b; return a ? { kind: 'stat', key: fx.stat, amount: a, text: c.reply || '' } : flavor(); }
    if (fx.item) {
      if (!f || f.rxItem) return flavor();
      const P = root.MMP7; let ok = false;
      try { ok = !!(P && P.bagAdd && P.bagAdd(S, fx.item).ok); } catch (e) {}
      if (!ok && S && S.inv && Array.isArray(S.inv.vault)) { S.inv.vault.push({ id: fx.item }); ok = true; }
      if (!ok) return flavor();
      f.rxItem = 1; return { kind: 'item', item: fx.item, text: c.reply || '' };
    }
    return flavor();
  }
  // ---- モーションの CSS（このファイルから入れる） ----
  let cssDone = false;
  function ensureCss() {
    if (cssDone || typeof document === 'undefined') return; cssDone = true;
    const st = document.createElement('style'); st.id = 'mmreact-css';
    st.textContent = Object.entries(MOTIONS).map(([k, v]) => `@keyframes mrx-${k}{${v.css}}.chf-mon.mrx-${k} .mon{animation:mrx-${k} ${v.ms}ms cubic-bezier(.4,0,.3,1)}`).join('')
      + '@media (prefers-reduced-motion:reduce){.chf-mon[class*="mrx-"] .mon{animation:none!important}}';
    document.head.appendChild(st);
  }
  /** モンスターにモーションを1回。戻り値＝その長さ（ms） */
  function play(el, motion) {
    const mo = MOTIONS[motion]; if (!el || !mo) return 0; ensureCss();
    for (const k of Object.keys(MOTIONS)) el.classList.remove(`mrx-${k}`);
    void el.offsetWidth; el.classList.add(`mrx-${motion}`);
    setTimeout(() => el.classList.remove(`mrx-${motion}`), mo.ms + 60);
    return mo.ms;
  }
  root.MMREACT = Object.freeze({ CHANCE, MOTIONS, EVENTS, pick, mark, apply, play, parseFx });
})(typeof window !== 'undefined' ? window : globalThis);
