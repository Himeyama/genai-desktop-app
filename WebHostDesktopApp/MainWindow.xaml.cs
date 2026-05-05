using Microsoft.UI;
using Microsoft.UI.Windowing;
using Microsoft.UI.Xaml;
using Microsoft.Web.WebView2.Core;

namespace WebHostDesktopApp;

/// <summary>
/// The application window. This hosts a WebView2 that displays web content.
/// </summary>
public sealed partial class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();

        ExtendsContentIntoTitleBar = true;
        SetTitleBar(AppTitleBar);

        if (AppWindow != null)
        {
            if (AppWindowTitleBar.IsCustomizationSupported())
            {
                var titleBar = AppWindow.TitleBar;
                titleBar.ButtonBackgroundColor = Colors.Transparent;
                titleBar.ButtonInactiveBackgroundColor = Colors.Transparent;
            }

            try
            {
                string iconPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Assets", "AppIcon.ico");
                if (File.Exists(iconPath))
                {
                    AppWindow.SetIcon(iconPath);
                }
            }
            catch { }
        }

        InitializeWebView2();
    }

    private async void InitializeWebView2()
    {
        // Allow fetch() from https://app.local (virtual host) to reach http://localhost:64249 (API server).
        // Must be set before EnsureCoreWebView2Async() launches the browser process.
        Environment.SetEnvironmentVariable("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS", "--disable-web-security --allow-running-insecure-content");
        await MyWebView.EnsureCoreWebView2Async();

        // Resolve the frontend folder.
        // Priority 1: 'frontend' folder next to the exe (publish.ps1 output).
        // Priority 2: Walk up to find the repo's packages/web/dist (dev build scenario).
        string folderPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "frontend");

        if (!Directory.Exists(folderPath))
        {
            DirectoryInfo? currentDir = new DirectoryInfo(AppDomain.CurrentDomain.BaseDirectory);
            while (currentDir != null && !Directory.Exists(Path.Combine(currentDir.FullName, "packages")))
            {
                currentDir = currentDir.Parent;
            }

            if (currentDir != null)
            {
                folderPath = Path.Combine(currentDir.FullName, "packages", "web", "dist");
                if (!Directory.Exists(folderPath))
                {
                    Directory.CreateDirectory(folderPath);
                    File.WriteAllText(Path.Combine(folderPath, "index.html"), "<h1>Waiting for web app build...</h1>");
                }
            }
            else
            {
                folderPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "packages", "web", "dist");
                if (!Directory.Exists(folderPath))
                {
                    Directory.CreateDirectory(folderPath);
                    File.WriteAllText(Path.Combine(folderPath, "index.html"), "<h1>Fallback path used. Waiting for web app build...</h1>");
                }
            }
        }

        folderPath = Path.GetFullPath(folderPath);

        MyWebView.CoreWebView2.SetVirtualHostNameToFolderMapping(
            "app.local",
            folderPath,
            CoreWebView2HostResourceAccessKind.Allow
        );

        // SPAルーティングの安全な対応
        // 物理的に存在する index.html を読み込み、Webアプリ(React/Vue等)が起動する直前に
        // ブラウザの履歴(URL)を /apps に書き換えることで、アプリ内のルーターに /apps から開始させる
        await MyWebView.CoreWebView2.AddScriptToExecuteOnDocumentCreatedAsync("window.history.replaceState(null, '', '/apps');");

        // CoreWebView2 を直接使用してナビゲートし、タイミングの問題を回避
        MyWebView.CoreWebView2.Navigate("https://app.local/index.html");
    }
}
