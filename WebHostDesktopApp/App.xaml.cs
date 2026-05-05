using Microsoft.UI.Xaml;

namespace WebHostDesktopApp;

/// <summary>
/// Provides application-specific behavior to supplement the default Application class.
/// </summary>
public partial class App : Application
{
    private Window? _window;
    
    /// <summary>
    /// Initializes the singleton application object.  This is the first line of authored code
    /// executed, and as such is the logical equivalent of main() or WinMain().
    /// </summary>
    public App()
    {
        InitializeComponent();
        UnhandledException += App_UnhandledException;
    }

    private void App_UnhandledException(object sender, Microsoft.UI.Xaml.UnhandledExceptionEventArgs e)
    {
        e.Handled = true;
        try
        {
            string errorPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "error.log");
            File.WriteAllText(errorPath, e.Exception.ToString() + "\n" + e.Message);
        }
        catch { }
    }

    /// <summary>
    /// Invoked when the application is launched.
    /// </summary>
    /// <param name="args">Details about the launch request and process.</param>
    protected override async void OnLaunched(LaunchActivatedEventArgs args)
    {
        // ローカルAPIサーバーをバックグラウンドで起動
        await LocalApiServer.StartAsync(64249);

        _window = new MainWindow();
        _window.Activate();
    }
}
