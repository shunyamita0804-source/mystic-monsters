# レグナスの技の演出素材（2026-10-05 FINAL）

ZIP `regnas_move_assets_FINAL_2026-10-05`（RGBA PNG・最大辺 1024）。ゲームでは **縮小（高さ／辺 720）と WebP 化だけ**。絵は変えていない。動画・連番は使わず、静止ポーズ＋FX をコード（js/battle/rival-partner.js の Web Animations）で動かす。

## 使わない素材（市松模様が画素として焼き込まれている）

- `fx/11_claw_slash_medium.png`・`fx/12_claw_slash_large.png`：斬撃の中央（囲まれた所）に市松模様が不透明な画素として残っている。斬撃の白い光と明るさが重なり、安全に透明にできない＝リポジトリに置かない・使わない（透過の正しい素材が届けば差し替え）
  - 幻影クロー＝claw_slash_small を2つ重ねて代用、蒼刃乱舞＝claw_slash_small を大きく＋tail_slash_large

## 技との対応（README_技素材対応表 のとおり）

| 技 | ポーズ | FX |
|---|---|---|
| 1 きりさく | 01_slash_pose | 10_claw_slash_small |
| 2 しっぽアタック | 02_tail_attack_pose | 01_tail_slash_small |
| 3 竜眼ロック | 05_dragon_eye_lock_pose | 08_dragon_eye_lock（控えめ） |
| 4 残影ステップ | 06_afterimage_step_pose | （残像はコード） |
| 5 ドラゴンクラッシュ | 03_low_charge_pose | 05_forward_speed・04_collision_impact・06_ground_shockwave |
| 6 蒼光ブレス | 04_breath_pose | 07_soukou_breath |
| 7 スナイプファング | 03_low_charge_pose | 05_forward_speed・04_collision_impact（衝撃波なし） |
| 8 幻影クロー | 01_slash_pose＋残像 | 10_claw_slash_small ×2（11 の代用） |
| 9 蒼刃乱舞 | 07／08_soujin_ranbu_pose_a／b・01_slash_pose | 10_claw_slash_small（12 の代用）・02_tail_slash_large |
| 10 テイルサイクロン | 09／10／11_tail_cyclone_pose_start／spin／finish | 09_tail_cyclone・03_tail_slash_spin |

ポーズの向き：01〜05 は左向き、06〜11 は右向き（相手の方を向くように左右反転する＝FACE）。

## 元ファイルの sha256

| 元ファイル | sha256 |
|---|---|
| poses/01_slash_pose.png | 00dd45fd9a9758483ce383d432ac10fc4758f1591c2fa134dd400f9be53f5c3b |
| poses/02_tail_attack_pose.png | f826e68faf2f06d6941d0411dfa64dc0033e330fa6efcf1d2b981e4dd1bb44fd |
| poses/03_low_charge_pose.png | fa4509fc2ed4e1a5f967f04ca25e6820fb5914dbf9300c75abe1eccdc85e03b0 |
| poses/04_breath_pose.png | 9237e9c07db19ccee387bdace27266ea2cc11dc5a910f73bd1e96c265b3f2a9b |
| poses/05_dragon_eye_lock_pose.png | c1dcb85cc0e7f2489b3c041c04f27e3afe4a11a51e4910aa243460fd51ffe62d |
| poses/06_afterimage_step_pose.png | c6cd08ae76677a6ba972471708e3f8f9d9c9b6c8194647f8fc817312a99a6298 |
| poses/07_soujin_ranbu_pose_a.png | f118e1e255d558bc4d92790edac3609e5ea758bfce635e1094399ec2651fcf28 |
| poses/08_soujin_ranbu_pose_b.png | 9f5a528fd558bdc3c73c523e42d320d96c80c7155025a0cbb0617726a217c54d |
| poses/09_tail_cyclone_pose_start.png | 7431cc1af534b24ce4200263909e6ab3f9c3ca143c32bb7db68730b692b57f9d |
| poses/10_tail_cyclone_pose_spin.png | 9e1b636e6d6660a9b427af9ef04fc5b23a02570ee1d4504ac7c235257671fb75 |
| poses/11_tail_cyclone_pose_finish.png | 5e5eb33c9921e542dcccbc518c35f72f709236586f87557986abfb788b28910d |
| fx/01_tail_slash_small.png | 6d103516da9d83e923129b7cf90abac54b601987f23d9ba64802014dfab514b8 |
| fx/02_tail_slash_large.png | 99f4a90dfc2d843e12b56e2091a2f53979d85626c543858de5207c50fb402ab9 |
| fx/03_tail_slash_spin.png | 83c693b77ce413e328350f545f9aa1c62f00adeaf3a217299f853efffa84fa23 |
| fx/04_collision_impact.png | a3d0e7865ed07521e1e7b8b08357ec667575a20814ab764a86344c063adc6eed |
| fx/05_forward_speed.png | f1a3fb5eaf93f10be66156416f68e0e752f3a939a276a5f480cc7f30a9bf772f |
| fx/06_ground_shockwave.png | 9c2bb7ce4a874c87a4b71517223142d3b9cf552fcc79751971e8eaac62d1f818 |
| fx/07_soukou_breath.png | da37417e47193ecd4cc7c7117a579d6389eca0353d872f05d1fd2bf0231e27c8 |
| fx/08_dragon_eye_lock.png | d67f26ec4e0c142a26edaa50b5be19fde30d4c187dfca435c0234492a1bd48f7 |
| fx/09_tail_cyclone.png | 531b17ae2a163a7a578261615d2823856b97c2830a62c5233c8ddc8082b4795d |
| fx/10_claw_slash_small.png | d6f7ed672a3c2a3077c6e5e4a422e23db3faf5ef3c8c1cc93ee48ae08fe1949d |
| fx/11_claw_slash_medium.png | e46af1ff84c40d127b6f657114e0cbd8ccce40b0a36072cd6cc04ff943271294 |
| fx/12_claw_slash_large.png | 2e73efbeef17f18b7d6e1431acb28bc5d44084f18e962503c11fd67ea9acf031 |
