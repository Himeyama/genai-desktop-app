# WebHostDesktopApp

このプロジェクトは、WinUI 3 と Windows App SDK を使用して構築されたデスクトップアプリケーションです。
内部に `WebView2` コントロールをホストし、ローカルの Web アプリケーション（主に `packages/web/dist` にビルドされた成果物）を表示します。

## 前提条件

このアプリケーションをビルド・実行するには、以下の環境が必要です。

- **OS**: Windows 10 (バージョン 1809 - ビルド 17763) 以降、または Windows 11
- **SDK / ツール**:
  - [.NET 9.0 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
  - Visual Studio 2022 (推奨) 
    - 「.NET デスクトップ開発」ワークロード
    - 「ユニバーサル Windows プラットフォーム開発」ワークロード
    - 「C++ によるデスクトップ開発」ワークロード (Windows App SDK のビルドに必要になる場合があります)
- **WebView2 ランタイム**: 通常は Windows 11 に標準インストールされています。Windows 10 の場合は[WebView2 ランタイム](https://developer.microsoft.com/microsoft-edge/webview2/)をインストールしてください。

## プロジェクト構成の特長

- **自己完結型 (Self-Contained)**: 
  Windows App SDK がシステムにインストールされていなくても実行できるように、`<WindowsAppSDKSelfContained>true</WindowsAppSDKSelfContained>` が設定されています。
- **CORS 回避設定**:
  WebView2 (`http://app.local`) から別のローカル API サーバー (`http://localhost:XXXX`) へリクエストを送る際の CORS エラーを回避するため、WebView2 起動時に `--disable-web-security` フラグが渡されるように構成されています。
- **Web アセットのマッピング**:
  WebView2 は仮想ホスト `app.local` を使用して、ソリューション内の `packages/web/dist` ディレクトリにあるファイルをサーブします。

## セットアップと起動手順

### 1. Web アプリケーションのビルド (必要な場合)

このデスクトップアプリは、別ディレクトリにある Web アプリケーションのビルド成果物 (`dist` フォルダ) を読み込みます。
事前に Web 側のプロジェクトでビルドを実行しておいてください。

※ Web側の `dist` フォルダが見つからない場合、アプリは一時的なフォールバックディレクトリを作成し、「Waiting for web app build...」というメッセージを表示して起動を継続します。

### 2. デスクトップアプリのビルドと実行

コマンドライン (PowerShell など) を開いて、この `WebHostDesktopApp.csproj` があるディレクトリに移動し、以下のコマンドを実行します。

#### コマンドラインからの実行

```powershell
# 依存関係の復元とビルド、実行
dotnet run --project WebHostDesktopApp.csproj -r win-x64
```

※ `-r win-x64` (Runtime Identifier) の指定は、Windows App SDK を自己完結型でビルドするために必要です。

#### ビルドのみを行う場合

```powershell
dotnet build -r win-x64
```

ビルドが完了すると、実行ファイルは以下のパスに出力されます。
`bin\Debug\net9.0-windows10.0.26100.0\win-x64\WebHostDesktopApp.exe`

### 3. Visual Studio からの実行 (オプション)

1. `WebHostDesktopApp.csproj` (または上位の `.sln` ファイル) を Visual Studio で開きます。
2. ターゲット プラットフォームを `x64` に設定します。
3. 起動プロファイルを `WebHostDesktopApp (パッケージなし)` または単にプロジェクト名に設定します。
4. `F5` キー (デバッグの開始) または `Ctrl + F5` キー (デバッグなしで開始) を押して実行します。

## トラブルシューティング

- **アプリが起動直後にクラッシュする場合**:
  - `bin\Debug\net9.0-windows10.0.26100.0\win-x64\error.log` が生成されていないか確認してください。ハンドルされない例外のスタックトレースが記録されます。
- **CORS エラーが発生する場合**:
  - `MainWindow.xaml.cs` の初期化で `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS` が正しく設定されているか確認してください。
- **Web 画面が表示されない / 404 になる場合**:
  - Web アプリの成果物が `packages/web/dist` フォルダに正しく配置されているか確認してください。アプリは実行ファイルの場所からディレクトリを遡って `packages` フォルダを探します。
