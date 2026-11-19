# ぴこっと

ドットのいきものと毎日すごす育成ゲーム。
たまごからかえる子は、見た目が完全ランダムの「せかいに1ぴきだけ」のすがた。
少しずつことばや あなたの名前を覚え、着せ替えやおでかけを楽しめます。

制作：宵宮ゲームズ

## あそべること
- ことばを教えると覚えて、場面に合わせて使ってくれる
- 2〜3日目ごろに、あなたの名前をよんでくれる
- あかちゃん → こども → おとな に成長（耳・しっぽ・アクセは育ってのおたのしみ）
- しばらく会えないと さみしがるけど、会えた瞬間 とびきりの笑顔でむかえてくれる
- 着せ替え（あたま・かお・くび）
- おでかけ（こうえん・うみ・ほしのおか）で たからもの探し
- おやつキャッチ、きょうのおねがい、おみせ、しゃしん（Xにシェア）

## フォルダ構成
```
www/index.html        ゲーム本体（この1ファイルだけで動く）
server/               見た目の重複チェック用 Cloudflare Worker（任意）
capacitor.config.json iOS / Android アプリ化の設定
.github/workflows/    GitHub Pages への自動公開
```

## Webで公開（GitHub Pages）
1. このリポジトリを GitHub に push する
2. リポジトリの **Settings → Pages → Build and deployment → Source** を **GitHub Actions** にする
3. 以後、`main` に push するたびに自動で公開される
   （URL: `https://<ユーザー名>.github.io/<リポジトリ名>/`）

テスト用：URLの最後に `#debug` を付けると「+1日」「3日あける」「せいちょう」などのボタンが出ます。

## アプリ化（iOS / Android）
必要なもの：Node.js（v20以上）、Android Studio、iOS は Mac + Xcode。ストア公開には各ストアの開発者登録（有料）が必要です。

```
npm install
npx cap add android
npx cap add ios        # Macのみ
npx cap sync
npm run android        # Android Studio が開く
npm run ios            # Xcode が開く
```
`www/index.html` を直したら `npx cap sync` してからビルドしてください。
`capacitor.config.json` の `appId` はストアで一意である必要があり、一度ストアに出したら変更できません。

アプリ版だけの機能：
- 毎日の通知（翌日19時「まだかな…？」、3日後「さみしいよ…」）… @capacitor/local-notifications
- しゃしんを共有シートからシェア … @capacitor/share + @capacitor/filesystem

## キャラの見た目がかぶらないようにする（任意）
見た目は48bitの乱数（約281兆通り）から作るので、サーバーなしでもかぶることはほぼありません。
絶対にかぶらないようにするなら `server/` の Worker を公開します。

```
cd server
npx wrangler kv namespace create PETS     # 出てきたIDを wrangler.toml に貼る
npx wrangler deploy
```
発行されたURLを `www/index.html` 先頭近くの `const API_URL = '';` に入れてください。
