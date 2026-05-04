# genai-web — 源内 Web

政府向け生成AI Webインターフェース（源内 Web）のフロントエンドリポジトリです。

## プロジェクト概要

- **技術スタック**: React 19 / TypeScript / Vite / TailwindCSS / Biome
- **パッケージ構成**: `packages/web`（フロントエンドのみ）
- **認証**: AWS Cognito（本番環境）/ ローカル開発では認証不要
- **バックエンド**: AWS Lambda + DynamoDB（本番環境）/ Vite ミドルウェア（ローカル開発）

## 注意点
Windows のためコマンド実行時は `&&` は使用しない。

## mise のインストール
```ps1
winget install jdx.mise
```

## フロントエンドのビルド方法

```ps1
mise install
mise exec -- npm install
mise exec -- npm run build -w packages/web
```

`npm install` は Node.js バージョンが変わったとき（mise install 後など）にも再実行が必要。
ネイティブバインディング（rolldown）が正しいバージョンで入り直される。

## ビルド済みフロントエンドのサーバー起動方法
```ps1
mise exec -- npm run preview -w packages/web
```

## ローカル開発環境（AWS 不要・サーバーレス）

AI API は Vite 開発サーバーのミドルウェア（`vite-plugin-local-api.ts`）として動作するため、別プロセス不要。

### 準備：API キーの設定
`packages/web/.env.local` を編集して使用するプロバイダーのキーを記入する。

```
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
OLLAMA_BASE_URL=http://localhost:11434  # Ollama 使用時
DEFAULT_MODEL=ollama:gemma4:e4b
```

### 起動（1コマンドのみ）
```ps1
mise exec -- npm run dev -w packages/web
```

モデルは `provider:model-name` 形式。`provider` は `openai` / `anthropic` / `ollama` のいずれか。
`VITE_APP_MODEL_IDS` に JSON 配列形式で追加すると UI の選択肢に表示される。

### 現在設定済みモデル（`VITE_APP_MODEL_IDS`）
```
ollama:gemma4:e4b, ollama:qwen3.5:9b
anthropic:claude-opus-4-7, anthropic:claude-sonnet-4-6, anthropic:claude-haiku-4-5
openai:gpt-5.4, openai:gpt-5.4-mini, openai:gpt-5.4-nano
```
Ollama はローカル実行のためキー不要。OpenAI / Anthropic は `.env.local` にキーが必要。

## ローカル API プラグイン（`vite-plugin-local-api.ts`）

`VITE_APP_API_ENDPOINT` と `VITE_APP_TEAM_ACCESS_CONTROL_API_ENDPOINT` はどちらも `http://localhost:5173`（Vite 開発サーバー自身）を向いているため、フロントエンドの API コールはすべてこのプラグインで処理される。

### 実装済みルート
| メソッド | パス | 説明 |
|---------|------|------|
| GET/POST | `/chats` | チャット一覧・作成 |
| GET/DELETE | `/chats/:id` | チャット取得・削除 |
| PUT | `/chats/:id/title` | タイトル更新 |
| GET/POST | `/chats/:id/messages` | メッセージ一覧・追加 |
| GET/POST/DELETE/PUT | `/systemcontexts` | システムコンテキスト CRUD |
| GET | `/exapps` | AI アプリ一覧（空配列を返す） |
| POST | `/predict/stream` | ストリーミング推論 |
| POST | `/predict/title` | タイトル自動生成 |
| POST | `/image/generate` | 画像生成（各プロバイダの REST API を直接呼び出し） |

### 画像生成について
ローカル開発時の画像生成機能（`/image/generate`）では、Node.js用 `openai` SDK は使用せず、直接 `fetch` で各プロバイダの API を呼び出します。
- **OpenAI:** OpenAI API (`api.openai.com`) を呼び出します。フロントエンドのモデル名 `gpt-image-2` はそのまま利用し、`gpt-4o-image` は `gpt-image-1.5` へマッピングします。また解像度 (`size`) は AWS Titan UI用のプリセット値を DALL-E 2 / 3 がサポートするピクセルサイズに自動でフォールバックして送信します。
- **xAI:** xAI API (`api.x.ai`) を呼び出します。モデル名 `grok-imagine-image` などに対応し、APIが `size` パラメータをサポートしないため、代わりに `aspect_ratio` (例: `16:9`) へ動的にマッピングして送信します。

### 未実装ルートの追加方法
ルートが未実装だと Vite の SPA フォールバックが HTML を返す。フロントエンドの `parseResponseBody` は JSON パース失敗時に文字列をそのまま返すため、配列・オブジェクトを期待するコードが `xxx is not a function` エラーを出す。

新しいルートを追加するときは:
1. `pathname.match(...)` で `xxxMatch` 変数を定義
2. `if (!chatMatch && ... && !xxxMatch) return next();` に追加
3. `try` ブロック内にハンドラーを追加（機能不要なら空配列/空オブジェクトを返すだけでよい）

### Ollama の `provider:model-name` パース
`providerStream` は `modelId.indexOf(':')` で最初の `:` だけを区切り文字として使う。
`ollama:gemma4:e4b` → provider=`ollama`、modelName=`gemma4:e4b` と正しくパースされる。

## テスト・Lint

```ps1
mise exec -- npm run web:lint -w packages/web
mise exec -- npm run web:test -w packages/web
```

## 既知の修正済み問題

### `useFileUploadable.ts` — `Cannot read property 'flags' of undefined`
`MODELS.modelMetadata` には Bedrock モデルの ID しか登録されていない。`ollama:*` など未登録モデルは `undefined` を返すため、オプショナルチェーン `MODELS.modelMetadata[modelId]?.flags` が必要。

### SWR + 未実装 API ルート — `xxx.map/filter is not a function`
上記「未実装ルートの追加方法」を参照。
