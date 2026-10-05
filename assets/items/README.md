# アイテムの正式アイコン

| ファイル | アイテム | 元 |
|---|---|---|
| herb.webp | 薬草（id herb・疲れを30回復） | ZIP mystic_monsters_claude_phaseB_assets_2026-10-05 の 02_opening_ui/herb_official.png（1350×1165・透過 PNG） |

- 2026-10-05 PHASE B：透過の余白を切り落とし、長い辺 256px に縮めて WebP（品質88）にしただけ（色・形は変えていない）。元ファイルの sha256：`a0adc3632672b2a701a00bff3ea6d05cb4cf70188a26da2e726677d2fa49af48`
- 使う場所：index.html の ITEM_ICON（itemIc）＝出発準備のバッグ・保管庫、ベースキャンプの「アイテム管理」、アイテム補給所の売却・アイテム図鑑、システム通知の帯（新人支援）。Chapter のアイテム（js/chapter/field-view.js の chfItems）は window.MM_ITEM_ICON。
- アイコンの無いアイテムは名前の文字だけ（新しいアイコンは作らない）。
