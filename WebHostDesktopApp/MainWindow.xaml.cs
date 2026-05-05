using Microsoft.UI;
using Microsoft.UI.Windowing;
using Microsoft.UI.Xaml;
using Microsoft.Web.WebView2.Core;

// To learn more about WinUI, the WinUI project structure,
// and more about our project templates, see: http://aka.ms/winui-project-info.

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
        // Set environment variable to pass arguments to the WebView2 browser process
        Environment.SetEnvironmentVariable("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS", "--disable-web-security");
        
        await MyWebView.EnsureCoreWebView2Async();
        
        // Map the virtual host name to the local directory
        // The exe will be deep in bin/x64/Debug/net9.0-windows10.0.xxxxx/win-x64/
        string folderPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "..", "..", "..", "packages", "web", "dist");
        // Fallback or simpler approach is to search up from BaseDirectory until we find packages
        DirectoryInfo? currentDir = new DirectoryInfo(AppDomain.CurrentDomain.BaseDirectory);
        while (currentDir != null && !Directory.Exists(Path.Combine(currentDir.FullName, "packages")))
        {
            currentDir = currentDir.Parent;
        }
        
        if (currentDir != null)
        {
            folderPath = Path.Combine(currentDir.FullName, "packages", "web", "dist");
            // Ensure the web dist directory exists, if not we will just map to the base dir to prevent crashing immediately
            if (!Directory.Exists(folderPath))
            {
                 Directory.CreateDirectory(folderPath);
                 File.WriteAllText(Path.Combine(folderPath, "index.html"), "<h1>Waiting for web app build...</h1>");
            }
        }
        else
        {
            // fallback
             folderPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "packages", "web", "dist");
             if (!Directory.Exists(folderPath))
             {
                 Directory.CreateDirectory(folderPath);
                 File.WriteAllText(Path.Combine(folderPath, "index.html"), "<h1>Fallback path used. Waiting for web app build...</h1>");
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
