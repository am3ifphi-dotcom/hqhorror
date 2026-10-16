# 外部アセット一覧 / External asset list

項目: 名称・種別・用途 / 入手元 URL / 作者 / ライセンスと検証状態 / 必要クレジット文 / 加工の有無

> **検証についての前提（重要）**
> この開発環境にはブラウザが存在せず、スクリーンショットによる目視確認は一切できていません。
> 本ドキュメントの「検証済み」はすべて **(a) ファイルとして取得できた / (b) ライセンス文面を実際に読んだ / (c) 開発サーバーから HTTP 200 が返る / (d) ヘッドレス描画・スモークテストで読み込みエラーが出ない** という意味です。
> **「ブラウザで見て意図どおりに表示・再生された」ことを保証するものではありません。** 未確認項目は必ず「未検証」と明示しています。

---

## 1. LPC Revised（キャラクター／タイル／家具のスプライト）

| 項目 | 内容 |
|---|---|
| 種別 | ピクセルアート・スプライトシート（PNG） |
| 用途 | 主人公「結衣」と白い幽霊の歩行・待機・走行・リアクション 8 方向アニメーション（64px/frame）、床・壁・ドア・窓・階段・家具・小物の全タイル・プロップ（32px grid） |
| 入手元 | <https://github.com/ElizaWy/LPC> （blobless clone、`tools/fetch_lpc.sh` で必要ファイルのみ取得。取得した生 PNG は `vendor_raw/lpc/`、クレジット原文は `vendor_raw/lpc/CREDITS-LPC-REVISED.txt` と `vendor_raw/lpc/credits/`） |
| 作者 | クレジット原文に記載された貢献者: **Eliza Wyatt (DeathsDarling), Lanea Zimmerman (Sharm), Stephen Challener (Redshrike), Johannes Sjölund (Wulax), BlueCarrot16, BenCreating, Durrani, YuriNikolai, Craftpix.net 2D Game Assets** |
| ライセンス | **OGA-BY 3.0**（CC-BY 3.0 から技術的制限条項を除いたもの） |
| 検証状態 | **ライセンス: 検証済み**（リポジトリ同梱の `Credits.txt` に “This pack is licensed OGA-BY 3.0” と明記。原文を `vendor_raw/lpc/CREDITS-LPC-REVISED.txt` として保存）／**読み込み: 部分的に検証済み**（アトラス化後の PNG が HTTP 200 で配信され、ヘッドレス描画で参照フレーム 78 種すべてが解決することを確認。**ブラウザ上での見た目は未検証**） |
| 必要クレジット | 下記「クレジット文」を参照（OGA-BY 3.0 は作者のクレジット表示が必須） |
| 加工の有無 | **あり**。① `tools/build_char.py` で LPC のパーツ（body / head / hair / eyebrows / torso / legs / feet）を合成して 1 枚のキャラクターシートに再構成、幽霊側は既存の「_Alternate Colors/White」パレットを選択して生成。② `tools/extract.py` + `tools/build_atlas.py` で各シートから 32px グリッド／連結領域抽出でフレームを切り出し、`public/assets/atlas.png`（1024×256, 90 フレーム）+ `atlas.json` に再パック。③切り出し時に余白トリムを実施。**色調変更（色相・彩度の作り直し）はしていません。** ゲーム側のライティング（暗さ・色被り）は実行時の合成です。 |

### 使用したファイル（代表）

- `Characters/Body/Body 01 - Feminine, Thin/Ivory/*`
- `Characters/Head/Head 01 - Feminine/Ivory/*` および `_Alternate Colors/White/*`（幽霊）
- `Characters/Hair/Medium 08 - Bob, Bangs/Black/*`、`Characters/Hair/Medium 02 - Curly/White/*`（幽霊）
- `Characters/Clothing/Feminine, Thin/{Torso,Legs,Feet}/Shirt 01 - Longsleeve Shirt|Pants 02 - Leggings|Shoes 01 - Shoes/{White,Navy,Black}/*`
- `Structure/{Walls,Floor,Doors,Windows,Stairs,Wall Borders,Pillars}/*`
- `Objects/Furniture/*`（Barrel, Cabinet, Chest, Cauldron, Clock Grandfather, Fireplace, Mirror, Dresser, Desk, Planter, Lighting, Countertop, Crate, Beds/*, Seating/*, Rugs/*）
- `Objects/Wall Items/*`（Portraits, Landscape, Curtains, Lighting, Mirrors）
- `Objects/Small Items/*`（Boxes, Buckets, Dishes, Flowers, Baskets, Dungeon Elements, Fire, Fabric/*）

完全な一覧は `tools/fetch_lpc.sh` の `get` 行を参照してください（どのファイルを取得したかの唯一の正確な記録です）。

---

## 2. Shippori Mincho（日本語フォント）

| 項目 | 内容 |
|---|---|
| 種別 | ウェブフォント（woff2） |
| 用途 | すべての UI テキスト（ダイアログ、名前、章タイトル、トースト、タイトル画面） |
| 入手元 | npm `@fontsource/shippori-mincho` → <https://github.com/fontsource/shippori-mincho>（オリジナル: <https://github.com/fontdasu/ShipporiMincho>） |
| 作者 | **The Shippori Mincho Project Authors**（fontdasu/ShipporiMincho） |
| ライセンス | **SIL Open Font License 1.1** |
| 検証状態 | **ライセンス: 検証済み**（`node_modules/@fontsource/shippori-mincho/LICENSE` の文面を確認。複製を `public/assets/fonts/OFL.txt` に保存）／**読み込み: 部分的に検証済み**（`GET /assets/fonts/shippori-mincho-subset.woff2` が HTTP 200 / 93 KB、CSS から参照されている。**文字が実際に目的の書体で描画されたかは未検証**） |
| 必要クレジット | SIL OFL 1.1 に基づく著作権表示（OFL.txt を同梱。OFL はクレジット表示義務は緩いが、フォント名の変更禁止・再配布時のライセンス同梱が条件） |
| 加工の有無 | **あり**。`tools/build_font.py` で fontTools により**サブセット化**（ゲーム内で使用しうる文字 7,445 字＋安全域のかな・約物・ASCII のみ。1.32 MB → 93 KB）。グリフ形状の改変はなし。 |

---

## 3. Kenney 効果音（One-shot SFX）

| 項目 | 内容 |
|---|---|
| 種別 | 効果音（ogg → wav 変換） |
| 用途 | 足音 8 種、きしみ、ドア開閉、ページめくり、布、金属、掛け金、落下音、UI 決定／移動音 |
| 入手元 | <https://github.com/iwenzhou/kenney>（Kenney 氏の「Asset Pack 1」のサードパーティ・ミラー。本家 kenney.nl はこの環境からは**接続不可**）。取得した 31 ファイルの ogg は `vendor_raw/kenney_sfx/`、ライセンス文は `vendor_raw/KENNEY-LICENSE.md` |
| 作者 | **Kenney**（<https://kenney.nl>） ※ミラー経由のためミラー管理者が同じファイルを再配布したものです |
| ライセンス | **CC0 1.0 Universal（パブリックドメイン）** |
| 検証状態 | **ライセンス: 検証済み**（ミラー同梱の `LICENSE.md` の文面が CC0 1.0 であることを確認・保存）／**ファイルの出自: 一部未検証**（ミラーの README は「Kenney donation Asset Pack 1（2014 年版）のコピー」と説明していますが、**本家サイトでの同一性は確認できていません（推測です）**）。**再生音の聴感確認は未検証**（波形は数値として生成できていますが、試聴していません） |
| 必要クレジット | CC0 のためクレジット義務はありません（表記は善意によるものです） |
| 加工の有無 | **あり**。`tools/build_audio.py` で ogg → 44.1 kHz / 16-bit / モノラル wav に変換（ステレオはモノラル化、前後の無音トリム、ピーク正規化）。19 ファイル / 652 KB。 |

対応表（出力 wav ← 入力 ogg）: `step_00..07 ← footstep00..07`、`creak_01/02 ← creak1/2`、`door_open ← doorOpen_1`、`door_close ← doorClose_1`、`page ← bookFlip1`、`cloth ← cloth1`、`metal ← metalClick`、`latch ← metalLatch`、`thud ← dropLeather`、`ui_move ← rollover1`、`ui_ok ← click1`。

---

## 4. 取得を試みて失敗した外部アセット

以下は**取得できていません**。代替は「自作」で賄っています（→ `03-constraints.md`）。

| 用途 | 試した入手元 | 結果 |
|---|---|---|
| 立ち絵（キャラクター全身肖像） | OpenGameArt.org / itch.io | ドメイン自体が**ブロック**され接続不可 |
| BGM / アンビエント / 環境音 | Freesound.org / OpenGameArt.org | **ブロック**され接続不可 |
| 和風ホラー BGM | GitHub 上の CC0 音源を検索 | 条件（ライセンス明記・実在・DL 可）を満たすものが**見つからず** |
| Google Fonts の CSS / jsDelivr 配信 | fonts.googleapis.com / cdn.jsdelivr.net | **ブロック**。npm（registry.npmjs.org）経由のセルフホストに切り替え |
| raw.githubusercontent.com 直リンク | raw.githubusercontent.com | **ブロック**。blobless clone 経由で回避 |

---

## クレジット文（ゲーム内 / README 用）

```
Artwork: "LPC Revised" — https://github.com/ElizaWy/LPC
  by Eliza Wyatt (DeathsDarling), Lanea Zimmerman (Sharm),
     Stephen Challener (Redshrike), Johannes Sjölund (Wulax),
     BlueCarrot16, BenCreating, Durrani, YuriNikolai,
     Craftpix.net 2D Game Assets
  License: OGA-BY 3.0 — https://opengameart.org/content/oga-by-30-faq
  (modified: frames re-packed into one atlas, character parts composited)

Font: "Shippori Mincho" — The Shippori Mincho Project Authors
  (https://github.com/fontdasu/ShipporiMincho)
  License: SIL Open Font License 1.1 (subset build)

Sound effects: CC0 1.0 one-shots by Kenney (https://kenney.nl)
  (re-encoded to 44.1 kHz mono wav, trimmed & normalised)

Everything else (portrait art, ambience, music, code, level design,
procedural props) is original work produced for this project.
```
