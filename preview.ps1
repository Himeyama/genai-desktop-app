# WebHostDesktopApp の API サーバー (port 64249) が起動済みか確認
$apiReady = $false
try {
    Invoke-WebRequest "http://localhost:64249/api/status" -TimeoutSec 2 -ErrorAction Stop | Out-Null
    $apiReady = $true
    Write-Host "API サーバー (port 64249) は起動済みです"
} catch {
    Write-Host "WebHostDesktopApp を起動します..."
    Start-Process dotnet -ArgumentList "run --project WebHostDesktopApp/WebHostDesktopApp.csproj -r win-x64"
    Write-Host "API サーバーの起動を待機中 (最大 60 秒)..."
    for ($i = 0; $i -lt 60; $i++) {
        Start-Sleep -Seconds 1
        try {
            Invoke-WebRequest "http://localhost:64249/api/status" -TimeoutSec 1 -ErrorAction Stop | Out-Null
            $apiReady = $true
            Write-Host "API サーバーが起動しました"
            break
        } catch { }
    }
}

if (-not $apiReady) {
    Write-Error "API サーバーの起動に失敗しました"
    exit 1
}

# Vite dev を WebHostDesktopApp の API に向けて起動 (HMR 有効)
$env:VITE_APP_API_ENDPOINT = "http://localhost:64249"
$env:VITE_APP_TEAM_ACCESS_CONTROL_API_ENDPOINT = "http://localhost:64249"
mise exec -- npm run dev -w packages/web
