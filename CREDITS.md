# CREDITS / クレジット

『しずかな家』（hqhorror）で使用している素材の出典です。
詳細な一覧・ライセンス検証状況・加工内容は `docs/01-external-assets.md` を参照してください。
ゲーム内では **X / Esc → 一時停止** 画面の最下部にも同じ要約を表示しています。

---

## 画像 / Artwork

**LPC Revised** — <https://github.com/ElizaWy/LPC>

by **Eliza Wyatt (DeathsDarling), Lanea Zimmerman (Sharm), Stephen Challener (Redshrike),
Johannes Sjölund (Wulax), BlueCarrot16, BenCreating, Durrani, YuriNikolai,
Craftpix.net 2D Game Assets**

License: **OGA-BY 3.0** — <https://opengameart.org/content/oga-by-30-faq>

- 用途: 主人公と幽霊のキャラクターアニメーション、床・壁・ドア・窓・階段、家具・小物の全スプライト
- 加工: フレームを切り出して 1 枚のアトラス（1024×256, 90 フレーム）に再パック。キャラクターはパーツ（体・頭・髪・眉・胴衣・脚・靴）を合成して再構成。色調の改変はなし

## フォント / Font

**Shippori Mincho** — The Shippori Mincho Project Authors（<https://github.com/fontdasu/ShipporiMincho>）
npm: `@fontsource/shippori-mincho`

License: **SIL Open Font License 1.1**（原文: `public/assets/fonts/OFL.txt`）

- 用途: ゲーム内すべてのテキスト
- 加工: 使用文字のみに**サブセット化**（1.32 MB → 93 KB）。字形の改変はなし

## 効果音 / Sound effects

**Kenney** — <https://kenney.nl>（CC0 1.0 Universal のワンショット集。

License: **CC0 1.0 Universal**（原文: `vendor_raw/KENNEY-LICENSE.md`）

- 用途: 足音・きしみ・ドア開閉・ページめくり・布・金属・掛け金・落下・UI 音
- 加工: ogg → 44.1 kHz / 16-bit / モノラル wav に変換、無音トリム、ピーク正規化
- 注記: 本家サイトがこの環境から接続できなかったため、GitHub のミラー（<https://github.com/iwenzhou/kenney>）から取得しました。ミラー同梱のライセンス文は CC0 1.0 であることを確認していますが、**本家配布物との同一性は未検証です（推測です）**

## 自作 / Original work

- **立ち絵（主人公・結衣 4 種）**: 画像生成モデルによる生成＋背景除去・切り抜き（`tools/build_portrait.py`）。外部の立ち絵はライセンス検証可能な形で取得できなかったため自作
- **BGM・環境音（雨・風・低周波ドローン・雷・囁き・スタンガー・心音・オルゴール・ピアノ）**: WebAudio によるリアルタイム合成
- **手続き型プロップ**（オルゴール / 人形 / 鍵 / 祭壇 / カーテン / 階段）: `src/game/custom.js`
- **ライティング、ポストエフェクト、天候・粒子、UI、レベルデザイン、シナリオ、プログラム**: すべて本作のためのオリジナル

## ライセンス（本リポジトリのコード）

MIT License（外部アセットにはそれぞれ上記のライセンスが適用されます）。
