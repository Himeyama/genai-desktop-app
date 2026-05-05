$ErrorActionPreference = 'Stop'
$totalSteps = 9
$step = 0

function Write-Step {
    param([string]$Message)
    $script:step++
    Write-Host "[$script:step/$totalSteps] $Message" -ForegroundColor Cyan
}

function Invoke-Step {
    param([string]$Message, [scriptblock]$Action)
    Write-Step $Message
    & $Action
    if ($LASTEXITCODE -and $LASTEXITCODE -ne 0) {
        Write-Error "失敗しました（終了コード $LASTEXITCODE）: $Message"
        exit $LASTEXITCODE
    }
}

Write-Host ""
Write-Host "玄海 — 発行" -ForegroundColor Yellow
Write-Host ("=" * 40) -ForegroundColor DarkGray
Write-Host ""

# 1. mise チェック
Write-Step "mise の確認"
if (-not (Get-Command mise -ErrorAction SilentlyContinue)) {
    Write-Error "mise が見つかりません。'winget install jdx.mise' でインストールしてください。"
    exit 1
}
Write-Host "  mise: OK" -ForegroundColor Green

# 2. mise install
Invoke-Step "ツールチェーンのセットアップ (mise install)" {
    mise install
}

# 3. npm install
Invoke-Step "依存パッケージのインストール (npm install)" {
    mise exec -- npm install
}

# 4. dotnet publish
Invoke-Step ".NET アプリのパブリッシュ (win-x64)" {
    if (Test-Path publish) {
        Write-Host "  既存の publish フォルダを削除します..." -ForegroundColor DarkGray
        Remove-Item -Recurse -Force publish
    }
    dotnet publish .\WebHostDesktopApp\WebHostDesktopApp.csproj -r win-x64 -p:SelfContained=true -o publish
}

# 5. フロントエンドビルド（出力先を publish/frontend に直接指定）
Invoke-Step "フロントエンドのビルド → publish/frontend" {
    # packages/web から見た相対パスで outDir を指定
    mise exec -- npm run build -w packages/web -- --outDir ../../publish/frontend
}


# 6. バージョンの取得（yy.M.d）
Write-Step "バージョンの取得"
$now = Get-Date
$version = $now.ToString("yy") + "." + $now.Month + "." + $now.Day
Write-Host "  バージョン: $version" -ForegroundColor Green

# 7. 日付の取得（yyyyMMdd）
Write-Step "日付の取得"
$date = $now.ToString("yyyyMMdd")
Write-Host "  日付: $date" -ForegroundColor Green

# 8. publish の容量（KiB）
Write-Step "publish フォルダの容量を取得"
$sizeBytes = (Get-ChildItem -Recurse publish | Measure-Object -Property Length -Sum).Sum
$size = [math]::Ceiling($sizeBytes / 1024)
Write-Host "  容量: $size KiB" -ForegroundColor Green

# 9. NSIS でインストーラーをビルド
$script:nsisVersion = $version
$script:nsisDate    = $date
$script:nsisSize    = $size
Invoke-Step "NSIS でインストーラーをビルド" {
    & 'C:\Program Files (x86)\NSIS\makensis.exe' /INPUTCHARSET UTF8 "/DVERSION=$script:nsisVersion" "/DDATE=$script:nsisDate" "/DSIZE=$script:nsisSize" installer.nsi
}

Write-Host ""
Write-Host ("=" * 40) -ForegroundColor DarkGray
Write-Host "完了しました！ 出力ファイル: publish\, Install.exe" -ForegroundColor Green
Write-Host ""
