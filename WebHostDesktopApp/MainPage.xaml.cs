using Microsoft.UI.Xaml.Controls;
using Microsoft.Web.WebView2.Core;
using System;

// To learn more about WinUI, the WinUI project structure,
// and more about our project templates, see: http://aka.ms/winui-project-info.

namespace WebHostDesktopApp;

/// <summary>
/// The main content page displayed inside the application window.
/// Add your UI logic, event handlers, and data binding here.
/// </summary>
public sealed partial class MainPage : Page
{
    public MainPage()
    {
        InitializeComponent();

        InitializeWebView();
    }

    private async void InitializeWebView()
    {
        await AppWebView.EnsureCoreWebView2Async();
        
        AppWebView.CoreWebView2.AddWebResourceRequestedFilter("http://app.local/*", CoreWebView2WebResourceContext.All);
        AppWebView.CoreWebView2.WebResourceRequested += CoreWebView2_WebResourceRequested;
        
        AppWebView.Source = new Uri("http://app.local/");
    }

    private void CoreWebView2_WebResourceRequested(CoreWebView2 sender, CoreWebView2WebResourceRequestedEventArgs args)
    {
        Uri uri = new Uri(args.Request.Uri);
        if (uri.Host == "app.local")
        {
            args.Request.Uri = $"http://localhost:64249{uri.PathAndQuery}";
        }
    }
}
