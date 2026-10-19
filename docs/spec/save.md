# セーブデータ（持ち物の形・v6 の任意項目）

旧 CLAUDE.md §3 から移した節（文はそのまま・節の順も元のまま）。同じ事柄は日付の新しい記述が優先し、各節の「〇〇が優先」「以下は旧記録」などの注記に従う。本文の「§3「〇〇」」は旧 CLAUDE.md の節名＝移設先は docs/README.md の対応表で引く。

## この主題にかかわるほかの記録

- CLAUDE.md「セーブデータ」：version・キー・checkpoint の約束
- docs/history/spec-2026-10-07_11.md「深層監査の修正・第2便（2026-10-08）」：壊れたセーブ（大会の途中状態）
- docs/history/spec-2026-10-15_19.md「2026-10-17 統合便 v2」：初見プレイの隔離セーブ

---

### セーブデータ（旧 CLAUDE.md §2 の詳細の2行）

- **持ち物の形（2026-10-11）**：アイテム＝`{ id, n }`（n＝個数。**2個以上のときだけ n を持つ**＝1個は旧形式と同じ `{ id }`＝旧セーブは変えずに1個として読める）。バッグは同じアイテム1枠10個まで、保管庫は1種類1行（個数の上限なし）。読み込み（MMP8 の normalizeV6）で MMP7.tidyInventory＝同じアイテムをまとめ・枠を超えた分を保管庫へ（Chapter 進行中は消さず・動かさず、帰還のあと＝ベースキャンプ・出発準備・アイテム管理・アイテム屋の bagSettle で整理）。何度読み込んでも数は変わらない。§3「バッグ（2026-10-11 正式）」
- v6 に後から加えた任意項目（**2026-10-04 PHASE H：`S.fuseCnt`＝合体回数（聖獣士証）。それ以前の合体は数えられない**）：`S.raiseRec`（育成完了回数）、`S.npcFlags`（フィナの会話の表示済み記録）、個体の `m.raise.startStats`／`m.raise.endStats`（売却額の計算用）、`m.raise.field.introSeen`（その Chapter の導入演出を見たか。配置と一緒に消える）、`m.raise.field.arrivalSeen`（大会会場への到着の会話を見たか。2026-10-02。配置と一緒に消える）。**2026-10-14**：`m.raise.field.visualPattern`（景観 A／B／C）・`m.raise.field.route`（Chapter 1 の道 B／C。無い＝A）。**2026-10-04（第二段階）**：`S.npcFlags.story`（セーブ単位のチュートリアルの見た記録＝config.story の scope 'save'）、`S.npcFlags.first`（施設の初回訪問 { market, ranch, lab, arena, farm }。2026-10-04 追加アセットで train（特訓＝ゲンシン）・shop（アイテム屋）も）、`m.raise.evSeen`（帰還イベント 'retN'・噂 'rumor'。育成のあいだ残る）、`m.raise.pend.fx.kind === 'choice'`（2択の出来事を選ぶ前の途中状態。stage は 'resolve' のまま）。 **2026-10-05（次期総合改修）**：`S.npcFlags.op`（序盤の導線 'guide'＝フィナの声かけ済み・管理局へ案内中／'map'＝登録済み・出身地と世界地図の会話の前／'done'＝完了）、`S.npcFlags.worldMap`（世界地図の会話を見た＝管理局の地図に出身地の印）、`S.npcFlags.moment`（短いイベントの見た記録 { partner, sp0〜sp3, move, tour, tourEnd }）。**2026-10-06**：`S.npcFlags.support`（新人支援を受け取った＝1回だけ。2026-10-12 P2 から中身は 1000G＋ジャガイモ×10）。**2026-10-12 P2**：`m.raise.ate`（そのターンに食べた印＝「Chapter:使ったターン数」。1ターンに1個の判定。出発で消す）。薬草はバッグ（S.inv.bag の { id:'herb' }。いっぱいなら保管庫）。登録の判定は従来どおり `S.playerNamePending`（新しいゲームだけにある）＝登録済みの古いセーブは序盤の導線を出さない。 **2026-10-04（PHASE D）**：`S.npcFlags.chapter5`（S ランク優勝＝Chapter 5 の解放フラグ。画面は未実装）。
