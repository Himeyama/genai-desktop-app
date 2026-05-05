using System.Collections.Concurrent;
using System.ComponentModel;
using System.Text.Json;
using System.Text.Json.Serialization;
using Anthropic.Core;
using HtmlAgilityPack;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.FileProviders;
using OpenAI.Images;

namespace WebHostDesktopApp;

// ==========================================
// 1. Data Models (Mirroring vite-plugin-local-api.ts)
// ==========================================

public class SimpleMessage
{
    [JsonPropertyName("role")] public string Role { get; set; } = "";
    [JsonPropertyName("content")] public string Content { get; set; } = "";
}

public class Chat
{
    [JsonPropertyName("id")] public string Id { get; set; } = "";
    [JsonPropertyName("createdDate")] public string CreatedDate { get; set; } = "";
    [JsonPropertyName("chatId")] public string ChatId { get; set; } = "";
    [JsonPropertyName("usecase")] public string Usecase { get; set; } = "";
    [JsonPropertyName("title")] public string Title { get; set; } = "";
    [JsonPropertyName("updatedDate")] public string UpdatedDate { get; set; } = "";
}

public class StoredChat : Chat
{
    [JsonPropertyName("messages")] public List<Message> Messages { get; set; } = [];
}

public class Message
{
    [JsonPropertyName("id")] public string Id { get; set; } = "";
    [JsonPropertyName("createdDate")] public string CreatedDate { get; set; } = "";
    [JsonPropertyName("messageId")] public string MessageId { get; set; } = "";
    [JsonPropertyName("usecase")] public string Usecase { get; set; } = "";
    [JsonPropertyName("userId")] public string UserId { get; set; } = "";
    [JsonPropertyName("feedback")] public string Feedback { get; set; } = "";
    [JsonPropertyName("role")] public string Role { get; set; } = "";
    [JsonPropertyName("content")] public string Content { get; set; } = "";
}

public class SystemContext
{
    [JsonPropertyName("id")] public string Id { get; set; } = "";
    [JsonPropertyName("createdDate")] public string CreatedDate { get; set; } = "";
    [JsonPropertyName("systemContextId")] public string SystemContextId { get; set; } = "";
    [JsonPropertyName("systemContext")] public string SystemContextText { get; set; } = "";
    [JsonPropertyName("systemContextTitle")] public string SystemContextTitle { get; set; } = "";
}

// ==========================================
// 2. Stores (In-memory, like the original)
// ==========================================

public static class DataStore
{
    public const string LOCAL_USER_ID = "local-user";
    public static readonly ConcurrentDictionary<string, StoredChat> _store = new();
    public static readonly ConcurrentDictionary<string, SystemContext> _scStore = new();

    // Chat Operations
    public static List<Chat> ListChats() =>
        _store.Values.OrderByDescending(c => c.UpdatedDate).Cast<Chat>().ToList();

    public static Chat CreateChat()
    {
        string uuid = Guid.NewGuid().ToString();
        string now = DateTime.UtcNow.ToString("O");
        StoredChat chat = new()
        {
            Id = $"user#{LOCAL_USER_ID}#chat#{uuid}",
            CreatedDate = now,
            ChatId = $"chat#{uuid}",
            Usecase = "chat",
            Title = "新しいチャット",
            UpdatedDate = now,
            Messages = []
        };
        _store[uuid] = chat;
        return chat;
    }

    public static Chat? FindChat(string uuid) => _store.TryGetValue(uuid, out StoredChat? c) ? c : null;
    public static void DeleteChat(string uuid) => _store.TryRemove(uuid, out _);

    public static Chat? UpdateChatTitle(string uuid, string title)
    {
        if (_store.TryGetValue(uuid, out StoredChat? c))
        {
            c.Title = title;
            c.UpdatedDate = DateTime.UtcNow.ToString("O");
            return c;
        }
        return null;
    }

    public static List<Message> ListMessages(string uuid) =>
        _store.TryGetValue(uuid, out StoredChat? c) ? c.Messages : [];

    public static List<Message> CreateMessages(string uuid, List<IncomingMessageData> incoming)
    {
        if (!_store.TryGetValue(uuid, out StoredChat? c)) return [];
        string now = DateTime.UtcNow.ToString("O");
        List<Message> recorded = incoming.Select(m => new Message
        {
            Id = $"msg#{m.MessageId}",
            CreatedDate = m.CreatedDate ?? now,
            MessageId = m.MessageId,
            Usecase = m.Usecase,
            UserId = LOCAL_USER_ID,
            Feedback = "",
            Role = m.Role,
            Content = m.Content
        }).ToList();
        c.Messages.AddRange(recorded);
        c.UpdatedDate = now;
        return recorded;
    }

    // SystemContext Operations
    public static List<SystemContext> ListSystemContexts() =>
        _scStore.Values.OrderBy(c => c.CreatedDate).ToList();

    public static SystemContext CreateSystemContext(string title, string text)
    {
        string uuid = Guid.NewGuid().ToString();
        SystemContext sc = new()
        {
            Id = $"user#{LOCAL_USER_ID}#systemContext#{uuid}",
            CreatedDate = DateTime.UtcNow.ToString("O"),
            SystemContextId = $"systemContext#{uuid}",
            SystemContextText = text,
            SystemContextTitle = title
        };
        _scStore[uuid] = sc;
        return sc;
    }

    public static void DeleteSystemContext(string uuid) => _scStore.TryRemove(uuid, out _);

    public static SystemContext? UpdateSystemContextTitle(string uuid, string title)
    {
        if (_scStore.TryGetValue(uuid, out SystemContext? sc))
        {
            sc.SystemContextTitle = title;
            return sc;
        }
        return null;
    }
}

public class IncomingMessageData
{
    [JsonPropertyName("messageId")] public string MessageId { get; set; } = "";
    [JsonPropertyName("usecase")] public string Usecase { get; set; } = "";
    [JsonPropertyName("role")] public string Role { get; set; } = "";
    [JsonPropertyName("content")] public string Content { get; set; } = "";
    [JsonPropertyName("createdDate")] public string? CreatedDate { get; set; }
}

// ==========================================
// 3. AI Tools
// ==========================================

public static class AITools
{
    [Description("Web上で情報を検索します。ユーザーの質問に答えるために最新の情報が必要な場合に使用します。")]
    public static async Task<string> WebSearch([Description("検索クエリ")] string query)
    {
        try
        {
            Console.WriteLine($"[WebSearch] query: {query}");
            using HttpClient client = new();
            client.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
            string url = $"https://html.duckduckgo.com/html/?q={Uri.EscapeDataString(query)}";
            string html = await client.GetStringAsync(url);

            HtmlDocument doc = new();
            doc.LoadHtml(html);

            List<object> results = [];
            IEnumerable<HtmlNode>? nodes = doc.DocumentNode.SelectNodes("//div[contains(@class, 'result__body')]")?.Take(5);
            if (nodes != null)
            {
                foreach (HtmlNode? node in nodes)
                {
                    string title = node.SelectSingleNode(".//*[contains(@class, 'result__title')]")?.InnerText?.Trim() ?? "";
                    HtmlNode hrefNode = node.SelectSingleNode(".//a[contains(@class, 'result__url')]");
                    string href = hrefNode?.GetAttributeValue("href", "") ?? node.SelectSingleNode(".//*[contains(@class, 'result__url')]")?.InnerText?.Trim() ?? "";
                    string snippet = node.SelectSingleNode(".//*[contains(@class, 'result__snippet')]")?.InnerText?.Trim() ?? "";
                    if (!string.IsNullOrEmpty(title))
                    {
                        results.Add(new { title, url = href, snippet });
                    }
                }
            }
            return results.Count > 0 ? JsonSerializer.Serialize(results) : "{\"error\": \"検索結果が見つかりませんでした\"}";
        }
        catch (Exception ex)
        {
            return $"{{\"error\": \"検索に失敗しました: {ex.Message}\"}}";
        }
    }

    [Description("指定されたURLのWebページの内容を取得し、テキストとして抽出します。WebSearchの結果を深掘りしたい場合に使用します。")]
    public static async Task<string> WebFetch([Description("取得するWebページのURL")] string url)
    {
        try
        {
            Console.WriteLine($"[WebFetch] url: {url}");
            using HttpClient client = new();
            client.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
            string html = await client.GetStringAsync(url);

            HtmlDocument doc = new();
            doc.LoadHtml(html);

            // Remove script, style, nav, header, footer, iframe, noscript
            HtmlNodeCollection nodesToRemove = doc.DocumentNode.SelectNodes("//script|//style|//nav|//header|//footer|//iframe|//noscript");
            if (nodesToRemove != null)
            {
                foreach (HtmlNode node in nodesToRemove) node.Remove();
            }

            string text = doc.DocumentNode.SelectSingleNode("//body")?.InnerText ?? "";
            text = System.Text.RegularExpressions.Regex.Replace(text, @"\s+", " ").Trim();
            if (text.Length > 5000) text = text[..5000];

            return JsonSerializer.Serialize(new { content = text });
        }
        catch (Exception ex)
        {
            return $"{{\"error\": \"ページの取得に失敗しました: {ex.Message}\"}}";
        }
    }
}

// ==========================================
// 4. API Server
// ==========================================

public static class LocalApiServer
{
    private static IChatClient CreateChatClient(string modelId)
    {
        int sep = modelId.IndexOf('/');
        string provider = sep != -1 ? modelId[..sep] : "openai";
        string modelName = sep != -1 ? modelId[(sep + 1)..] : modelId;

        // Vercel AI SDK compatible stream format building requires ChatOptions with Tools
        ChatOptions options = new()
        {
            Tools =
            [
                AIFunctionFactory.Create(AITools.WebSearch),
                AIFunctionFactory.Create(AITools.WebFetch)
            ]
        };

        if (provider == "openai")
        {
            string apiKey = Environment.GetEnvironmentVariable("OPENAI_API_KEY") ?? "";
            return new OpenAI.Chat.ChatClient(modelName, apiKey).AsIChatClient();
        }
        else if (provider == "anthropic")
        {
            string apiKey = Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY") ?? "";
            ClientOptions anthropicOptions = new() { ApiKey = apiKey };
            return new Anthropic.AnthropicClient(anthropicOptions).AsIChatClient(modelName);
        }
        else if (provider == "xai")
        {
            string apiKey = Environment.GetEnvironmentVariable("XAI_API_KEY") ?? "";
            OpenAI.OpenAIClientOptions openaiOptions = new() { Endpoint = new Uri("https://api.x.ai/v1") };
            OpenAI.Chat.ChatClient chatClient = new(modelName, new System.ClientModel.ApiKeyCredential(apiKey), openaiOptions);
            return chatClient.AsIChatClient();
        }
        else if (provider == "openrouter")
        {
            string apiKey = Environment.GetEnvironmentVariable("OPENROUTER_API_KEY") ?? "";
            OpenAI.OpenAIClientOptions openaiOptions = new() { Endpoint = new Uri("https://openrouter.ai/api/v1") };
            OpenAI.Chat.ChatClient chatClient = new(modelName, new System.ClientModel.ApiKeyCredential(apiKey), openaiOptions);
            return chatClient.AsIChatClient();
        }
        else if (provider == "ollama")
        {
            string baseUrl = Environment.GetEnvironmentVariable("OLLAMA_BASE_URL") ?? "http://localhost:11434";
            return new OllamaChatClient(new Uri(baseUrl), modelName);
        }

        throw new Exception($"Unknown provider: {provider}");
    }

    public static Task StartAsync(int port = 64249)
    {
        WebApplicationBuilder builder = WebApplication.CreateBuilder();
        builder.WebHost.UseUrls($"http://localhost:{port}");
        builder.Services.AddCors(o => o.AddDefaultPolicy(p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

        WebApplication app = builder.Build();
        app.UseCors();

        // 静的ファイルの配信設定 (フロントエンド)
        string webRootPath = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..", "packages", "web", "dist"));
        if (!Directory.Exists(webRootPath))
            webRootPath = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "frontend"));
        if (Directory.Exists(webRootPath))
        {
            app.UseStaticFiles(new StaticFileOptions
            {
                FileProvider = new PhysicalFileProvider(webRootPath),
                RequestPath = ""
            });

            // API 以外のリクエストでファイルが存在しない場合は index.html を返す (SPA ルーティング用)
            app.MapFallbackToFile("index.html", new StaticFileOptions
            {
                FileProvider = new PhysicalFileProvider(webRootPath)
            });
        }
        else
        {
            Console.WriteLine($"[Warning] Web root path not found: {webRootPath}");
        }

        app.MapGet("/api/status", () => new { status = "running", timestamp = DateTime.UtcNow });
        app.MapGet("/exapps", () => Results.Ok(new List<object>()));

        app.MapGet("/teams/{teamId}", (string teamId) =>
        {
            if (teamId == "00000000-0000-0000-0000-000000000000")
            {
                return Results.Ok(new
                {
                    teamId = teamId,
                    teamName = "共通アプリ",
                    createdDate = DateTime.UtcNow.ToString("O"),
                    updatedDate = DateTime.UtcNow.ToString("O")
                });
            }
            return Results.NotFound(new { error = "Not found" });
        });

        app.MapGet("/systemcontexts", () => Results.Ok(DataStore.ListSystemContexts()));
        app.MapPost("/systemcontexts", async (HttpContext context) =>
        {
            using JsonDocument doc = await JsonDocument.ParseAsync(context.Request.Body);
            string title = doc.RootElement.GetProperty("systemContextTitle").GetString() ?? "";
            string text = doc.RootElement.GetProperty("systemContext").GetString() ?? "";
            return Results.Ok(DataStore.CreateSystemContext(title, text));
        });
        app.MapDelete("/systemcontexts/{id}", (string id) =>
        {
            DataStore.DeleteSystemContext(id.Replace("systemContext#", ""));
            return Results.Ok(new { });
        });
        app.MapPut("/systemcontexts/{id}/title", async (string id, HttpContext context) =>
        {
            using JsonDocument doc = await JsonDocument.ParseAsync(context.Request.Body);
            string title = doc.RootElement.GetProperty("title").GetString() ?? "";
            SystemContext? sc = DataStore.UpdateSystemContextTitle(id.Replace("systemContext#", ""), title);
            return sc != null ? Results.Ok(new { systemContext = sc }) : Results.NotFound(new { error = "Not found" });
        });

        app.MapGet("/chats", () => Results.Ok(new { data = DataStore.ListChats() }));
        app.MapPost("/chats", () => Results.Ok(new { chat = DataStore.CreateChat() }));
        app.MapGet("/chats/{id}", (string id) =>
        {
            Chat? chat = DataStore.FindChat(id);
            return chat != null ? Results.Ok(new { chat }) : Results.NotFound(new { error = "Not found" });
        });
        app.MapDelete("/chats/{id}", (string id) =>
        {
            DataStore.DeleteChat(id);
            return Results.Ok(new { });
        });
        app.MapPut("/chats/{id}/title", async (string id, HttpContext context) =>
        {
            using JsonDocument doc = await JsonDocument.ParseAsync(context.Request.Body);
            string title = doc.RootElement.GetProperty("title").GetString() ?? "";
            Chat? chat = DataStore.UpdateChatTitle(id, title);
            return chat != null ? Results.Ok(new { chat }) : Results.NotFound(new { error = "Not found" });
        });
        app.MapGet("/chats/{id}/messages", (string id) => Results.Ok(new { messages = DataStore.ListMessages(id) }));
        
        app.MapPost("/chats/{id}/messages", async (string id, HttpContext context) =>
        {
            JsonElement root = await JsonSerializer.DeserializeAsync<JsonElement>(context.Request.Body);
            List<IncomingMessageData> inMsgs = JsonSerializer.Deserialize<List<IncomingMessageData>>(root.GetProperty("messages").GetRawText()) ?? [];
            return Results.Ok(new { messages = DataStore.CreateMessages(id, inMsgs) });
        });

        app.MapPost("/predict/stream", async (HttpContext context) =>
        {
            JsonElement root = await JsonSerializer.DeserializeAsync<JsonElement>(context.Request.Body);
            string modelId = Environment.GetEnvironmentVariable("DEFAULT_MODEL") ?? "ollama/llama3.2";
            if (root.TryGetProperty("model", out JsonElement modelProp) && modelProp.TryGetProperty("modelId", out JsonElement idProp))
            {
                modelId = idProp.GetString() ?? modelId;
            }

            List<ChatMessage> messages = [];
            if (root.TryGetProperty("messages", out JsonElement msgsProp))
            {
                foreach (JsonElement msg in msgsProp.EnumerateArray())
                {
                    string? role = msg.GetProperty("role").GetString();
                    string content = msg.GetProperty("content").GetString() ?? "";
                    messages.Add(new ChatMessage(role == "system" ? ChatRole.System : role == "user" ? ChatRole.User : ChatRole.Assistant, content));
                }
            }

            context.Response.Headers.ContentType = "text/plain; charset=utf-8";
            context.Response.Headers.CacheControl = "no-cache";

            try
            {
                IChatClient chatClient = CreateChatClient(modelId);

                ChatOptions options = new()
                {
                    Tools =
                    [
                        AIFunctionFactory.Create(AITools.WebSearch),
                        AIFunctionFactory.Create(AITools.WebFetch)
                    ]
                };

                IChatClient functionCallingClient = new ChatClientBuilder(chatClient)
                    .UseFunctionInvocation()
                    .Build();

                IAsyncEnumerable<ChatResponseUpdate> stream = functionCallingClient.GetStreamingResponseAsync(messages, options);

                await foreach (ChatResponseUpdate update in stream)
                {
                    if (!string.IsNullOrEmpty(update.Text))
                    {
                        string chunk = JsonSerializer.Serialize(new { text = update.Text });
                        await context.Response.WriteAsync($"{chunk}\n");
                    }
                    
                    if (update.Contents != null)
                    {
                        JsonSerializerOptions jOpts = new() { Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping };
                        foreach(AIContent content in update.Contents)
                        {
                            if (content is FunctionCallContent funcCall)
                            {
                                string traceStr = $"\n**{funcCall.Name}**\n- 引数: `{JsonSerializer.Serialize(funcCall.Arguments, jOpts)}`\n";
                                string traceChunk = JsonSerializer.Serialize(new { text = "", trace = traceStr }, jOpts);
                                await context.Response.WriteAsync($"{traceChunk}\n");
                            }
                            else if (content is FunctionResultContent funcResult)
                            {
                                string traceStr = $"\n```json\n{JsonSerializer.Serialize(funcResult.Result, jOpts)}\n```\n";
                                string traceChunk = JsonSerializer.Serialize(new { text = "", trace = traceStr }, jOpts);
                                await context.Response.WriteAsync($"{traceChunk}\n");
                            }
                        }
                    }
                }

                string endChunk = JsonSerializer.Serialize(new { text = "", stopReason = "end_turn" });
                await context.Response.WriteAsync($"{endChunk}\n");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Stream Error] {ex}");
                string errChunk = JsonSerializer.Serialize(new { text = "", stopReason = "error", trace = ex.Message });
                await context.Response.WriteAsync($"{errChunk}\n");
            }
        });

        app.MapPost("/predict/title", async (HttpContext context) =>
        {
            JsonElement root = await JsonSerializer.DeserializeAsync<JsonElement>(context.Request.Body);
            string modelId = Environment.GetEnvironmentVariable("DEFAULT_MODEL") ?? "ollama/llama3.2";
            if (root.TryGetProperty("model", out JsonElement modelProp) && modelProp.TryGetProperty("modelId", out JsonElement idProp))
                modelId = idProp.GetString() ?? modelId;
            string prompt = root.TryGetProperty("prompt", out JsonElement promptProp) ? promptProp.GetString() ?? "" : "";

            try
            {
                IChatClient chatClient = CreateChatClient(modelId);
                ChatResponse response = await ChatClientExtensions.GetResponseAsync(chatClient, prompt);
                return Results.Ok(response.Messages.LastOrDefault()?.Text?.Trim() ?? "");
            }
            catch (Exception ex)
            {
                return Results.Problem(ex.Message);
            }
        });

        // ---------------------------------
        // Image Generation
        // ---------------------------------
        app.MapPost("/image/generate", async (HttpContext context) =>
        {
            try
            {
                JsonElement root = await JsonSerializer.DeserializeAsync<JsonElement>(context.Request.Body);
                string modelId = "openai/gpt-4o-image";
                if (root.TryGetProperty("model", out JsonElement modelProp) && modelProp.TryGetProperty("modelId", out JsonElement idProp))
                {
                    modelId = idProp.GetString() ?? modelId;
                }

                string prompt = "";
                if (root.TryGetProperty("params", out JsonElement paramsProp) && paramsProp.TryGetProperty("textPrompt", out JsonElement promptsProp) && promptsProp.GetArrayLength() > 0)
                {
                    prompt = promptsProp[0].GetProperty("text").GetString() ?? "";
                }

                int sep = modelId.IndexOf('/');
                string provider = sep != -1 ? modelId[..sep] : "openai";
                string rawModelName = sep != -1 ? modelId[(sep + 1)..] : modelId;
                string apiModelName = rawModelName;

                // NOTE: DO NOT automatically convert openai model names to "dall-e-X".
                // Pass the requested modelName (e.g. gpt-4o-image, gpt-image-2) directly to the provider,
                // as the backend might be routing through a proxy or an updated provider implementation.
                // This is a strict rule to prevent repeated failures.

                if (provider == "openai")
                {
                    string apiKey = Environment.GetEnvironmentVariable("OPENAI_API_KEY") ?? "";
                    if (string.IsNullOrEmpty(apiKey)) return Results.BadRequest(new { message = "OPENAI_API_KEY is missing." });

                    ImageClient imageClient = new(apiModelName, apiKey);
                    OpenAI.Images.ImageGenerationOptions options = new();

                    GeneratedImage image = await imageClient.GenerateImageAsync(prompt, options);
                    
                    string base64 = "";
                    if (image.ImageBytes != null)
                    {
                        base64 = Convert.ToBase64String(image.ImageBytes.ToArray());
                    }
                    else if (image.ImageUri != null)
                    {
                        using HttpClient hc = new();
                        byte[] bytes = await hc.GetByteArrayAsync(image.ImageUri);
                        base64 = Convert.ToBase64String(bytes);
                    }
                    
                    return Results.Text(JsonSerializer.Serialize(base64), "application/json");
                }
                else if (provider == "xai")
                {
                    string apiKey = Environment.GetEnvironmentVariable("XAI_API_KEY") ?? "";
                    if (string.IsNullOrEmpty(apiKey)) return Results.BadRequest(new { message = "XAI_API_KEY is missing." });

                    OpenAI.OpenAIClientOptions openaiOptions = new() { Endpoint = new Uri("https://api.x.ai/v1") };
                    ImageClient imageClient = new(apiModelName, new System.ClientModel.ApiKeyCredential(apiKey), openaiOptions);
                    OpenAI.Images.ImageGenerationOptions options = new();

                    GeneratedImage image = await imageClient.GenerateImageAsync(prompt, options);
                    
                    string base64 = "";
                    if (image.ImageBytes != null)
                    {
                        base64 = Convert.ToBase64String(image.ImageBytes.ToArray());
                    }
                    else if (image.ImageUri != null)
                    {
                        using HttpClient hc = new();
                        byte[] bytes = await hc.GetByteArrayAsync(image.ImageUri);
                        base64 = Convert.ToBase64String(bytes);
                    }
                    
                    return Results.Text(JsonSerializer.Serialize(base64), "application/json");
                }
                else
                {
                    return Results.BadRequest(new { message = $"Unsupported image provider: {provider}" });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Image Generation Error] {ex}");
                return Results.BadRequest(new { message = ex.Message });
            }
        });

        _ = app.RunAsync();
        return Task.CompletedTask;
    }
}
