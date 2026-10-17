// =========================================================
// 施設の NPC イベント `MMNPCE`（2026-10-04 第二段階）：初回訪問の会話（フィナ ↔ NPC ↔ フィナ）・再訪の一言（進行状態で変わる）・Chapter の帰還イベント（ダン＋フィナ）・噂
//  ・データだけを持つ（画面の処理・セーブは index.html 側）。会話の行は共通会話（MMNPC）の形＝{ npc, expression, side, text }
//  ・初回（first）＝100%・1回だけ（記録は S.npcFlags.first[施設]。2026-10-04：train＝特訓・shop＝アイテム屋を追加）。表情（expression）は 2026-10-04 の正式差分（js/npc/npc.js の EXPR）。再訪（revisit）＝条件つきの一言は条件を満たしたとき、ふつうの一言は chance で。直前と同じ一言は避ける（S.npcFlags.rv[施設]）
//  ・帰還（returnEvent）＝Chapter を終えてファームへ戻ったとき1回（記録は m.raise.evSeen）。Chapter ごとに文面が違う。噂（rumor）は次の Chapter があるとき1回だけ添える（新しい固有名詞は作らない）
//  ・カレンは「〜わよ」「〜だわ」を使わない。ヴァルガスは条件を断言しない。文面はすべて【暫定】
// =========================================================
(function (root) {
  'use strict';
  const fz = Object.freeze;
  const F = (expression, text, extra) => ({ npc: 'fina', expression, side: 'left', text, ...(extra || {}) });
  const N = (npc, expression, text, extra) => ({ npc, expression, side: 'right', text, ...(extra || {}) });

  // ---- 初回訪問（2026-10-17 正式：有料版ボイスの台本＝フィナ 021〜027 → 施設の NPC 001。字幕は実際の発話の書き起こし）----
  //  VO(話者, 表情, 声, [[声の頭からの ms, 字幕], …], 側)＝1本の声を最初の行で1回だけ鳴らし、続きの字幕（sub）はその時刻に自動で進む（js/npc/npc.js。声を鳴らし直さない）。
  //  声が OFF・鳴らせないときはタップで進む。最後の行（声なし）は今までの案内（操作の手がかり）を残したもの。順＝市場カレン・牧場ニック・ベースキャンプダン・研究所エリオット・闘技場ヴァルガス・アイテム屋ベルナ・特訓ゲンシン
  const VO = (npc, expression, voice, chunks, side) => chunks.map(([ms, text], i) => ({ npc, expression, side: side || (npc === 'fina' ? 'left' : 'right'), text, ...(i === 0 ? { voice, voiceWait: 4000 } : { sub: ms }) }));
  const FIRST = fz({
    market: [...VO('fina', 'guide', 'fina_021', [[0, 'カレン、モンスターたちの調子はどう？'], [2580, 'この人、初めて市場に来たんだ。相棒選びを手伝ってくれない？']]),
      ...VO('karen', 'welcome', 'karen_001', [[0, 'フィナ、いらっしゃい。もちろん。初めまして、私はカレン。'], [4780, 'ここにはいろんな個性のモンスターがいるよ。'], [7780, '強さも大事だけど、何より自分が一緒に育てたいと思える子を選んでね。'], [12980, 'きっと素敵な相棒になるから。']]),
      N('karen', 'guide', '気になる子をタップすると、詳しく見られるよ。')],
    ranch: [...VO('fina', 'guide', 'fina_022', [[0, 'ニック、こんにちは。'], [1660, '今日はこの人に牧場を見せてあげたいんだ。モンスターたちのこと、教えてくれる？']]),
      ...VO('nick', 'gentle', 'nick_001', [[0, 'おお、フィナ。元気そうだな。'], [2700, '初めまして、俺はニックだ。この牧場じゃ、モンスターたちを預かって世話してる。'], [9220, 'どんな子にもそれぞれの良さがあるからな。'], [12220, '安心して任せてくれ。しっかり面倒を見るからな。']]),
      F('smile', '次に育てる子を決める時も、ここに来ればいいね。')],
    lab: [...VO('fina', 'guide', 'fina_024', [[0, 'エリオット、その石板……また夢中になってる。'], [4880, 'あの、ちょっといい？ 今日はこの人に研究所を案内したいんだけど。']]),
      ...VO('elliot', 'smile', 'elliot_001', [[0, 'おや、フィナさん。ちょうどいいところへ。'], [3020, 'この石板に刻まれた記号、並び方が実に面白くてね。'], [7780, 'ああ、失礼。初めまして、エリオットです。'], [11400, 'ここではモンスターの記録と、新しい命が生まれる仕組みを研究しているんだ。'], [16620, '君の相棒のことも、ぜひ教えてほしいな。']]),
      F('smile', '図鑑と合体、それに配合表だね。育てた後も大事な場所になりそう。')],
    arena: [...VO('fina', 'guide', 'fina_025', [[0, 'ヴァルガスさん、初めまして。'], [3140, '闘技場での挑戦について、お話を伺ってもよろしいでしょうか？']]),
      ...VO('vargas', 'grin', 'vargas_001', [[0, 'ほう、ここまで来たか。見事だ。'], [3700, '私はヴァルガス。この闘技場では特別な大会が開催される。'], [9200, 'しっかり鍛錬をして臨むことだ。']]),
      F('guide', '今の実力を知るには一番分かりやすい場所だね。負けても育成そのものが終わるわけじゃないよ。')],
    train: [...VO('fina', 'normal', 'fina_027', [[0, 'ゲンシンさん、今日はこの人の相棒に特訓を受けさせたくて、'], [4180, 'ここでの鍛え方を教えてもらえますか？']]),
      ...VO('genshin', 'guide', 'genshin_001', [[0, 'フィナか。特訓じゃな。'], [3320, '強さに近道はない。'], [6020, '己と向き合い、日々鍛えることじゃ。']]),
      F('normal', '特訓では技を覚えられることもあるよ。準備ができたら挑戦してみよう。')],
    shop: [...VO('fina', 'normal', 'fina_026', [[0, 'ベルナさん、旅に必要な道具を揃えたいんだけど、'], [3320, 'この人、ここのお店は初めてなの。おすすめのアイテム、教えてもらえる？']]),
      ...VO('shop', 'smile', 'berna_001', [[0, 'おやおや、フィナちゃんじゃないかい。今日は新しいお客さんを連れてきたんだね。'], [6780, 'ここには冒険に役立つ道具などがたくさん揃っているよ。'], [12220, '旅の支度は大事だからね。慌てずゆっくり見ておいき。']]),
      F('normal', '持っていける数には限りがあるから、必要なものを選ぼう。')],
    // ベースキャンプ（記録は従来の S.npcFlags.first.farm）
    farm: [...VO('fina', 'smile', 'fina_023', [[0, 'ダン、また何か直してるの？'], [2520, '今日はこの人の旅支度をお願いしたくてさ。ちょっと見てもらえる？']]),
      ...VO('dan', 'normal', 'dan_001', [[0, 'お、フィナ。来るなら先に言ってくれよ。ま、いいけどな。'], [5540, 'そっちは初めましてだな。俺はダン。'], [9060, 'このベースキャンプじゃ、旅に出る前の準備や休息を手伝ってる。'], [13620, '必要な時は気軽に頼ってくれよ。']]),
      F('guide', 'アイテム、特訓、技の確認だね。準備ができたら「出発する」で Chapter 1「はじまりの草原」へ行こう！')],
  });
  /** 施設の初回の会話で鳴らす声（先に圧縮のまま取ってくる＝MMAUDIO.voiceWarm） */
  const firstVoices = (fac) => (FIRST[fac] || []).filter((l) => l.voice).map((l) => l.voice);
  const FACILITIES = fz(Object.keys(FIRST));
  function first(fac) { const L = FIRST[fac]; return L ? L.map((l) => ({ ...l })) : null; }

  // ---- 再訪の一言（ctx＝進行状態：hasMon・box（牧場の数）・full（所持上限）・gold・raiseDone・rank（S.br：-1〜5）・fatigue・tickets・items・state（none/farm/done/board）・canDepart・gateBlocked・canFuse）
  //  when の無い行＝ふつうの一言（chance で出る）。when のある行＝条件を満たしたとき（必ず出る。複数あれば重みで1つ） ----
  const REVISIT = fz({
    market: { npc: 'karen', expression: 'welcome', chance: 0.6, lines: [   // 2026-10-04：表情＝再訪のあいさつは歓迎（02）・条件（満員・所持金不足）は考える（03）
      { id: 'm_again', text: 'またモンスターを見に来たの？' },   // 2026-10-17：「いらっしゃい。」は1行目（カレン 002 の声と字幕）
      { id: 'm_new', text: '新しい子が欲しくなったの？' },
      { id: 'm_which', text: '今日はどの子を見ていく？' },
      { id: 'm_none', when: (c) => !c.hasMon, expression: 'guide', text: 'まだ一緒に旅する子がいないのね。ゆっくり選んでいって。' },
      { id: 'm_full', when: (c) => c.full, expression: 'think', text: '牧場がいっぱいなの。迎えるなら、牧場で整理してからね。' },
      { id: 'm_done', when: (c) => c.raiseDone >= 1 && !c.full, text: '育て終えた子がいるのね。次の子も、きっといい出会いになるよ。' },
      { id: 'm_poor', when: (c) => c.hasMon && c.gold < 500 && !c.full, expression: 'think', text: '今の所持金だと、新しい子はまだ難しいかも。大会でがんばってね。' },
    ] },
    ranch: { npc: 'nick', expression: 'normal', chance: 1, lines: [   // 表情：ふだん＝通常（01）・成長を見た一言＝感心（04）
      { id: 'r_hi', text: 'やぁ。今日も元気そうだな。' },
      { id: 'r_face', expression: 'gentle', text: 'いい顔つきになってきたな。' },
      { id: 'r_grow', text: 'この子なら、もう少し伸びそうだ。' },
      { id: 'r_leave', text: '心配するな。こっちで見ておく。' },
      { id: 'r_what', text: 'さて、今日はどうする？' },
      { id: 'r_empty', when: (c) => c.box === 0, text: 'まだ預かってる子はいないな。育て終えたら、ここで見ておくよ。' },
      { id: 'r_many', when: (c) => c.box >= 3, text: 'にぎやかになってきたな。みんな元気だ。' },
      { id: 'r_rank', when: (c) => c.rank >= 2, expression: 'impressed', text: 'ランクCまで来たのか。たいしたもんだ。' },
      { id: 'r_done', when: (c) => c.raiseDone >= 1 && c.box >= 1 && c.box < 3, expression: 'impressed', text: '育て終えた子は、ここでゆっくり過ごしてるよ。' },
    ] },
    lab: { npc: 'elliot', expression: 'normal', chance: 1, lines: [   // 表情：ふだん＝通常（01）・図鑑＝小さな笑顔（02）・合体＝思考（03）・育成の記録＝発見（04）
      { id: 'l_hello', text: 'こんにちは。何を調べてみましょうか。' },
      { id: 'l_book', expression: 'smile', text: '図鑑の記録も、少しずつ埋まってきましたね。' },
      { id: 'l_look', text: '気になる子がいたら、記録を見てみましょう。' },
      { id: 'l_fuse', when: (c) => c.canFuse, expression: 'analyze', text: '育て終えた子が2体いますね。合体を考えてみるのも面白いですよ。' },
      { id: 'l_done', when: (c) => c.raiseDone >= 1 && !c.canFuse, expression: 'discover', text: '育成を終えた記録、拝見しました。興味深いですね。' },
    ] },
    arena: { npc: 'vargas', expression: 'normal', chance: 1, lines: [   // 表情：ふだん＝威厳（01）・挑戦を受ける一言＝不敵な笑み（02）・厳しい一言（03）・認める（04）
      { id: 'a_not', text: 'ここは闘技場だ。今はまだ、その時ではない。' },
      { id: 'a_ready', expression: 'stern', text: '準備が整ってから来い。' },
      { id: 'a_again', expression: 'grin', text: '挑む覚悟ができたら、また来い。' },
      { id: 'a_rank', when: (c) => c.rank >= 1, expression: 'acknowledge', text: 'ランクを上げてきたか。……覚えておく。' },
    ] },
    farm: { npc: 'dan', expression: 'normal', chance: 1, lines: [   // 表情：ふだん＝通常（01）・出発前＝励ます（02）・疲れ／条件不足＝注意（03）・成長＝認める（04）
      { id: 'f_calm', text: '今日も落ち着いてるな。いい調子だ。' },
      { id: 'f_face', expression: 'proud', text: '少しずつだが、顔つきが変わってきた。' },
      { id: 'f_pace', text: '無理はさせない。この子のペースで育てよう。' },
      { id: 'f_watch', text: 'この子のことは、ちゃんと見ておく。' },
      { id: 'f_tired', when: (c) => c.fatigue >= 60, expression: 'caution', text: 'だいぶ腹をすかせてるな。何か食わせてやれ。' },
      { id: 'f_tix', when: (c) => c.tickets > 0 && c.state === 'farm', text: '特訓チケットがあるなら、出発前に使っておくのも手だ。' },
      { id: 'f_items', when: (c) => c.items > 0 && c.state !== 'done', text: '持ち物は確かめたか。使えるものは持っていけ。' },
      { id: 'f_gate', when: (c) => c.gateBlocked, expression: 'caution', text: '次へ進むには、大会で結果を出す必要があるな。' },
      { id: 'f_ready', when: (c) => c.canDepart && c.state === 'farm' && c.fatigue < 60, expression: 'cheer', text: '準備ができたら、次の Chapter へ行こう。' },
      { id: 'f_done', when: (c) => c.state === 'done', expression: 'proud', text: 'よくここまで育てたな。この子は、牧場でゆっくりさせてやろう。' },
    ] },
    // 2026-10-04（追加アセット）：アイテム屋（おばあちゃん）。毎回は話さない（ふつうの一言は無し＝条件のときだけ）。購入成立の一言は buy（画面側が購入のあとに出す）
    shop: { npc: 'shop', expression: 'normal', chance: 0, lines: [
      { id: 's_tired', when: (c) => c.fatigue >= 60, expression: 'worry', text: '少しお腹がすいているみたいね。何か食べさせてあげなさい。' },
      { id: 's_bag', when: (c) => c.fatigue < 60 && c.bag <= 1, expression: 'normal', text: '備えがあるだけで、旅はずいぶん楽になるものよ。' },
    ], buy: { id: 's_buy', expression: 'recommend', text: 'はい、これで大丈夫。気をつけて行ってらっしゃい。' } },
  });
  /**
   * 再訪の一言を1つ選ぶ。{ id, text, npc, expression } か null（chance で出ないとき）。
   *  ctx.last＝直前に出した id（同じ文章の連打を避ける）。rnd＝乱数（テストで固定できる）
   */
  function revisit(fac, ctx = {}, rnd = Math.random) {
    const R = REVISIT[fac]; if (!R) return null;
    const ok = R.lines.filter((l) => { try { return !l.when || !!l.when(ctx); } catch (e) { return false; } });
    const cond = ok.filter((l) => l.when), plain = ok.filter((l) => !l.when);
    let pool = cond.length ? cond : plain;
    if (!cond.length && rnd() >= (Number.isFinite(R.chance) ? R.chance : 1)) return null;
    if (pool.length > 1 && ctx.last) pool = pool.filter((l) => l.id !== ctx.last);
    if (!pool.length) return null;
    const l = pool[Math.floor(rnd() * pool.length) % pool.length];
    return { id: l.id, text: l.text, npc: R.npc, expression: l.expression || R.expression };
  }

  // ---- Chapter の帰還イベント（ファームへ戻ったとき。ダン＋フィナ。Chapter ごとに違う文面） ----
  const RETURN = fz({
    1: [F('happy', '戻ったよ、ダン！ 最初の旅、ちゃんと終えてきた。'), N('dan', 'proud', 'おかえり。いい顔になってきたな。数字だけじゃなく、動きも変わってきた。'), F('smile', '次へ行く前に、一度状態を確認しておこう。')],
    2: [F('smile', '海の道は長かった…。でも、この子はずっと元気だったよ。'), N('dan', 'proud', '潮風の中を歩くと、体の芯が鍛えられる。悪くない旅だったようだな。'), F('guide', '次の Chapter の前に、技と持ち物を整えておこうね。')],
    3: [F('happy', '空に近い道から戻ったよ！ 高いところ、少し怖かったけど…。'), N('dan', 'proud', 'よく戻った。目つきが変わったな。ここから先は、相手も強くなる。'), F('serious', 'うん。特訓も使って、しっかり仕上げていこう。', { voice: 'fina_yes' })],
    4: [F('smile', '火山の道も越えてきたよ。この子、本当に強くなった。'), N('dan', 'proud', 'ああ。ここまで来れば、もう立派なものだ。最後まで見届けよう。'), F('guide', '最終ルートの前に、もう一度、全部確認しよう。')],
  });
  const OUTCOME = fz({
    won: N('dan', 'proud', '大会でも勝ってきたんだな。たいしたもんだ。'),
    lost: N('dan', 'normal', '大会は惜しかったな。次につなげよう。'),
    timeup: F('troubled', '…今回は会場に間に合わなかった。次は時間に気をつけるね。'),
  });
  /** 噂（次の Chapter があるとき1回だけ）：具体的な名前は作らない */
  const RUMOR = (nextName) => [F('normal', `そういえば、次の「${nextName}」の話、聞いた？`), N('dan', 'caution', 'ああ。珍しいモンスターを見た者がいるらしい。気をつけて行け。'), F('smile', '気をつける。…でも、ちょっと楽しみ。')];
  /**
   * 帰還イベントの行。ch＝終えた Chapter、ctx＝{ reachedGoal, declined, won, placed, nextName, rumor }。無ければ null。
   *  戻り値＝{ lines, rumor:true|false }（rumor を添えたら true。呼ぶ側が「噂は見た」を記録する）
   */
  function returnEvent(ch, ctx = {}) {
    const base = RETURN[ch]; if (!base) return null;
    const lines = base.map((l) => ({ ...l }));
    const extra = ctx.reachedGoal === false ? OUTCOME.timeup : ctx.won ? OUTCOME.won : (ctx.placed != null && !ctx.declined) ? OUTCOME.lost : null;
    if (extra) lines.splice(2, 0, { ...extra });
    let rumor = false;
    if (ctx.rumor && ctx.nextName) { lines.push(...RUMOR(ctx.nextName)); rumor = true; }
    return { lines, rumor };
  }

  // ---- 短いイベント（2026-10-05）：最初の1回だけ（記録は S.npcFlags.moment[key]）。吹き出し1〜3・新しい画像なし・ゲームの仕組みどおりのことだけを話す。文面は【暫定】 ----
  //  partner＝最初の相棒を迎えた直後（街）／sp＝その種族を初めて育成する出発（ダン。育成開始の掛け合いに添える）／move＝特訓で初めて技を覚えた／tour＝初めての公式大会（大会進行の最初）／
  //  tourWon・tourLost＝初めての大会の結果（優勝／優勝できなかった）
  const MOMENT = fz({
    partner: (n) => [F('happy', `${n}が、最初の相棒だね！`, { voice: 'fina_giggle' }), F('guide', '育成を始めるときは、街の下の「ベースキャンプ」から。準備ができたら行ってみよう！')],
    sp: (sp) => [N('dan', 'normal', `${sp}を育てるのは初めてか。伸びやすい能力は、種族ごとに違う。`), N('dan', 'normal', '研究所の図鑑で、成長の傾向を確かめておくといい。')],
    move: (mv) => [N('genshin', 'approve', `「${mv}」か。いい技を覚えたな。`), N('genshin', 'guide', '空いている枠があれば、そこに入る。入れ替えるなら技管理だ。'), F('smile', 'バトルの前に、技の並びも確認しておこうね。')],
    tour: () => [F('guide', '初めての公式大会だね。全員と1回ずつ戦う総当たり戦だよ。'), F('smile', '一度負けても、まだ終わりじゃない。最後に1位なら優勝！')],
    tourWon: () => [F('happy', '初優勝だね！ 本当にすごいよ！', { voice: 'fina_yeah' }), F('smile', 'この調子で、もっと上のランクも目指していこう！')],
    tourLost: () => [F('troubled', '悔しいね…。', { voice: 'fina_hmm' }), F('smile', 'でも、育てた能力はなくならないよ。次につなげよう！')],
  });
  /** 短いイベントの行（無ければ null）。arg＝名前などの差し込み（呼ぶ側で p11Esc は不要＝会話は文字として表示） */
  function moment(key, arg) { const f = MOMENT[key]; return f ? f(arg).map((l) => ({ ...l })) : null; }

  root.MMNPCE = fz({ FACILITIES, FIRST, REVISIT, RETURN, MOMENT, first, firstVoices, revisit, returnEvent, moment });
})(typeof window !== 'undefined' ? window : globalThis);
