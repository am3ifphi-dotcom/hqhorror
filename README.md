# しずかな家 / hqhorror

和館を舞台にした 2D 本格ホラーゲーム。Canvas2D + WebGL ポストエフェクト、HTML5 / ES Modules / Vite。
**「シナリオは二の次で、とにかく雰囲気・アニメーション・演出に凝る」** という方針で作られています。

- 主人公: おとなしめな女の子「結衣（ゆい）」＋ 立ち絵つきのダイアログ
- 内部解像度 480×270 のピクセルアート（整数倍で拡大表示）
- 2D レイキャストの可視性ポリゴンによる動的ライティング（懐中電灯の円錐・蝋燭の揺らぎ）
- WebGL ポストエフェクト: フィルムグレイン / 色収差 / ビネット / 画面の歪み / ブルーム / フェード
- 天候と粒子: 雨・埃・霧・灰、雷によるフラッシュ
- 恐怖値（fear）が音楽・ノイズ・画面効果・幽霊の挙動を連動して変化
- 部屋 5 つ（玄関ホール / 廊下 / 子供部屋 / 書斎 / 地下室）、調べポイント 25、鍵の入手、チェイス、結末

---

## 遊び方

```bash
npm install
npm run dev          # http://localhost:5173
```

| 操作 | キー |
|---|---|
| 移動 | 矢印キー / WASD |
| 調べる・会話を進める | Z / Enter / Space |
| 走る | Shift（長押し） |
| 一時停止 | X / Esc |

初回画面の「画面をクリック」で音声を有効化してから開始してください（ブラウザの制約のため）。

その他のコマンド:

```bash
npm run build        # dist/ に静的ビルド
npm run preview      # ビルド結果を確認
npm run smoke        # ヘッドレスの通しテスト（jsdom）
node tools/verify_assets.mjs   # レベルデータ ↔ アトラスの参照整合性チェック
REAL2D=1 node tools/shot.mjs   # 実ラスタライズして tools/shots/*.png に書き出し
```

---

## 構成

```
index.html                ステージ（DOM の UI レイヤー + canvas）
src/style.css             すべての見た目（和文セリフ体のテキストボックス、レターボックス）
src/engine/core.js        入力・イージング・乱数・アトラス/シート読み込み
src/engine/audio.js       WebAudio 合成の BGM/環境音 + Kenney CC0 効果音の再生
src/engine/postfx.js      WebGL のポストプロセス
src/engine/fx.js          画面効果（シェイク/フラッシュ/グリッチ/フェード）と粒子
src/game/rooms.js         5 部屋のレイアウト・光源・ドア・調べポイント
src/game/world.js         タイル・当たり判定・遮蔽矩形・カメラ
src/game/actors.js        主人公と幽霊（8 方向アニメーション、懐中電灯）
src/game/lighting.js      可視性ポリゴンと暗闇/グローの合成
src/game/custom.js        手続き型プロップ（オルゴール・人形・鍵・祭壇・カーテン・階段）
src/game/script.js        シナリオ・イベント・チェイス・結末
src/ui/ui.js              ダイアログ・立ち絵・トースト・HUD
src/main.js               ディレクタ（コルーチン）とゲームループ
tools/                    アセット生成・取得・検証スクリプト
public/assets/            完成アセット（atlas, sprites, portrait, audio, fonts）
vendor_raw/               取得した外部アセットの生ファイルとライセンス原文
docs/                     外部アセット一覧 / 自作アセット一覧 / 制約と未検証事項
```

---

## クレジットとライセンス

外部アセットは以下です（詳細は **`docs/01-external-assets.md`**）。

- **LPC Revised**（OGA-BY 3.0）— キャラクター・タイル・家具のスプライト
- **Shippori Mincho**（SIL OFL 1.1）— フォント（サブセット化して同梱）
- **Kenney**（CC0 1.0）— 効果音（wav に変換して同梱）

自作したもの（立ち絵・BGM/環境音・手続き型プロップ・演出・コード）とその理由は
**`docs/02-self-made-assets.md`** に、取得できなかった外部アセットと**未検証の項目**は
**`docs/03-constraints.md`** にまとめています。

コード自体は MIT License です。

> ⚠️ **検証状況に関する重要な注記**
> このプロジェクトは**ブラウザの存在しない環境で開発**されたため、
> **「実際にブラウザで見て・聴いて確認した」という検証は一切行われていません。**
> 確認できているのは、開発サーバーからの HTTP 200、ヘッドレスの通しテスト
> （`npm run smoke`、全ルーム・全イベント通過・ランタイムエラー 0）、
> および @napi-rs/canvas による実ラスタライズ（`tools/shots/`）までです。
> WebGL のポストエフェクトはヘッドレスでは実行されないため**実機での動作は未検証**です
> （ただし WebGL が使えない場合に 2D 表示へ自動フォールバックする経路は検証済みです）。
