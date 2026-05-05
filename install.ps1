$ErrorActionPreference = 'Stop'

# ==============================================================================
# 設定
# ==============================================================================
$appName = "玄海"
$exeName = "genkai.exe"
$publishDir = Join-Path $PSScriptRoot "publish"
$installDir = Join-Path $env:LOCALAPPDATA $appName
$startMenuDir = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\$appName"

# ==============================================================================
# ヘルパー関数
# ==============================================================================
function Write-Step {
    param([string]$Message)
    Write-Host ">>> $Message" -ForegroundColor Cyan
}

function Invoke-WithRetry {
    param(
        [scriptblock]$Action,
        [int]$MaxRetries = 3,
        [int]$RetryWaitSeconds = 2
    )
    $attempt = 0
    while ($attempt -lt $MaxRetries) {
        try {
            & $Action
            return
        } catch {
            $attempt++
            Write-Warning "処理に失敗しました (試行 $attempt/$MaxRetries): $($_.Exception.Message)"
            if ($attempt -lt $MaxRetries) {
                Write-Host "  $RetryWaitSeconds 秒後に再試行します..." -ForegroundColor DarkGray
                Start-Sleep -Seconds $RetryWaitSeconds
            } else {
                Write-Error "最大再試行回数に達しました。"
                throw
            }
        }
    }
}

Write-Host ""
Write-Host "$appName — 直接インストール" -ForegroundColor Yellow
Write-Host ("=" * 40) -ForegroundColor DarkGray
Write-Host ""

# ==============================================================================
# 0. ビルドの実行
# ==============================================================================
Write-Step "アプリのビルドを実行"
$publishScript = Join-Path $PSScriptRoot "publish.ps1"
if (Test-Path $publishScript) {
    & $publishScript -SkipInstaller
    if ($LASTEXITCODE -and $LASTEXITCODE -ne 0) {
        Write-Error "ビルド (publish.ps1) に失敗しました。"
        exit $LASTEXITCODE
    }
} else {
    Write-Error "publish.ps1 が見つかりません。"
    exit 1
}

# ==============================================================================
# 1. 事前確認
# ==============================================================================
Write-Step "ビルド成果物の確認"
if (-not (Test-Path $publishDir)) {
    Write-Error "publish フォルダが見つかりません。先に ./publish.ps1 を実行してビルドを完了してください。"
    exit 1
}
Write-Host "  OK" -ForegroundColor Green

# ==============================================================================
# 2. プロセスの終了
# ==============================================================================
Write-Step "実行中のアプリを終了"
$processName = [System.IO.Path]::GetFileNameWithoutExtension($exeName)
$processes = Get-Process -Name $processName -ErrorAction SilentlyContinue
if ($processes) {
    Write-Host "  実行中のプロセスを終了しています..." -ForegroundColor DarkGray
    $processes | Stop-Process -Force -PassThru | Wait-Process -Timeout 15
    Start-Sleep -Seconds 2 # ファイルロック解除のための待機
}
Write-Host "  OK" -ForegroundColor Green

# ==============================================================================
# 3. ディレクトリの準備とクリーンアップ
# ==============================================================================
Write-Step "インストール先ディレクトリの準備"
Write-Host "  ターゲット: $installDir" -ForegroundColor DarkGray
if (Test-Path $installDir) {
    Write-Host "  既存のファイルをクリーンアップしています..." -ForegroundColor DarkGray
    Invoke-WithRetry -Action {
        Remove-Item -Path "$installDir\*" -Recurse -Force -ErrorAction Stop
    }
} else {
    New-Item -ItemType Directory -Path $installDir -Force | Out-Null
}
Write-Host "  OK" -ForegroundColor Green

# ==============================================================================
# 4. ファイルのコピー
# ==============================================================================
Write-Step "ファイルのインストール"
Invoke-WithRetry -Action {
    Copy-Item -Path "$publishDir\*" -Destination $installDir -Recurse -Force -ErrorAction Stop
}
Write-Host "  OK" -ForegroundColor Green

# ==============================================================================
# 5. ショートカットの作成
# ==============================================================================
Write-Step "スタートメニューのショートカット作成"
if (-not (Test-Path $startMenuDir)) {
    New-Item -ItemType Directory -Path $startMenuDir -Force | Out-Null
}

$shortcutPath = Join-Path $startMenuDir "$appName.lnk"
$targetPath = Join-Path $installDir $exeName

# WScript.Shell を利用してショートカットを作成
$wshShell = New-Object -ComObject WScript.Shell
$shortcut = $wshShell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $targetPath
$shortcut.WorkingDirectory = $installDir
$shortcut.IconLocation = "$targetPath,0"
$shortcut.Save()

Write-Host "  OK" -ForegroundColor Green

Write-Host ""
Write-Host ("=" * 40) -ForegroundColor DarkGray
Write-Host "インストールが完了しました！" -ForegroundColor Green
Write-Host "スタートメニューから「$appName」を起動できます。" -ForegroundColor Green
Write-Host ""