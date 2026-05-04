import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';

// ===== Types =====
type Role = 'system' | 'user' | 'assistant';
type SimpleMessage = { role: Role; content: string };

type Chat = {
  id: string;
  createdDate: string;
  chatId: string;
  usecase: string;
  title: string;
  updatedDate: string;
};

type Message = {
  id: string;
  createdDate: string;
  messageId: string;
  usecase: string;
  userId: string;
  feedback: string;
  role: Role;
  content: string;
};

// ===== In-memory store =====
const LOCAL_USER_ID = 'local-user';
type StoredChat = Chat & { messages: Message[] };
const _store = new Map<string, StoredChat>();

type SystemContext = {
  id: string;
  createdDate: string;
  systemContextId: string;
  systemContext: string;
  systemContextTitle: string;
};
const _scStore = new Map<string, SystemContext>();

const systemContextStore = {
  list: (): SystemContext[] =>
    [..._scStore.values()].sort((a, b) => a.createdDate.localeCompare(b.createdDate)),

  create: (systemContextTitle: string, systemContext: string): SystemContext => {
    const uuid = crypto.randomUUID();
    const now = new Date().toISOString();
    const sc: SystemContext = {
      id: `user#${LOCAL_USER_ID}#systemContext#${uuid}`,
      createdDate: now,
      systemContextId: `systemContext#${uuid}`,
      systemContext,
      systemContextTitle,
    };
    _scStore.set(uuid, sc);
    return sc;
  },

  delete: (uuid: string) => _scStore.delete(uuid),

  updateTitle: (uuid: string, title: string): SystemContext | undefined => {
    const sc = _scStore.get(uuid);
    if (!sc) return undefined;
    sc.systemContextTitle = title;
    return sc;
  },
};

const chatStore = {
  list: (): Chat[] =>
    [..._store.values()]
      .sort((a, b) => b.updatedDate.localeCompare(a.updatedDate))
      .map(({ messages: _m, ...c }) => c),

  create: (): Chat => {
    const uuid = crypto.randomUUID();
    const now = new Date().toISOString();
    const chat: StoredChat = {
      id: `user#${LOCAL_USER_ID}#chat#${uuid}`,
      createdDate: now,
      chatId: `chat#${uuid}`,
      usecase: 'chat',
      title: '新しいチャット',
      updatedDate: now,
      messages: [],
    };
    _store.set(uuid, chat);
    const { messages: _m, ...rest } = chat;
    return rest;
  },

  find: (uuid: string): Chat | undefined => {
    const c = _store.get(uuid);
    if (!c) return undefined;
    const { messages: _m, ...rest } = c;
    return rest;
  },

  delete: (uuid: string) => _store.delete(uuid),

  updateTitle: (uuid: string, title: string): Chat | undefined => {
    const c = _store.get(uuid);
    if (!c) return undefined;
    c.title = title;
    c.updatedDate = new Date().toISOString();
    const { messages: _m, ...rest } = c;
    return rest;
  },

  listMessages: (uuid: string): Message[] => _store.get(uuid)?.messages ?? [],

  createMessages: (
    uuid: string,
    incoming: Array<{ messageId: string; usecase: string; role: string; content: string; createdDate?: string }>,
  ): Message[] => {
    const c = _store.get(uuid);
    if (!c) return [];
    const now = new Date().toISOString();
    const recorded = incoming.map((m) => ({
      id: `msg#${m.messageId}`,
      createdDate: m.createdDate ?? now,
      messageId: m.messageId,
      usecase: m.usecase,
      userId: LOCAL_USER_ID,
      feedback: '',
      role: m.role as Role,
      content: m.content,
    }));
    c.messages.push(...recorded);
    c.updatedDate = now;
    return recorded;
  },
};

// ===== AI providers =====
async function generateImage(prompt: string, modelName: string, apiKey: string, provider: string, width?: number, height?: number, aspectRatio?: string) {
  let apiUrl = 'https://api.openai.com/v1/images/generations';
  let apiModelName = modelName;

  if (provider === 'xai') {
    apiUrl = 'https://api.x.ai/v1/images/generations';
  } else {
    // Default to OpenAI
    if (modelName === 'gpt-4o-image') apiModelName = 'gpt-image-1.5';
  }

  const body: any = {
    model: apiModelName,
    prompt: prompt,
    n: 1,
  };

  if (provider === 'openai') {
    if (width && height) {
      if (apiModelName === 'gpt-image-1.5') {
        // dall-e-3 (gpt-4o-image mapped to gpt-image-1.5) supports: 1024x1024, 1024x1792, 1792x1024
        if (width > height) body.size = '1792x1024';
        else if (height > width) body.size = '1024x1792';
        else body.size = '1024x1024';
      } else {
        // dall-e-2 supports 256x256, 512x512, 1024x1024
        if (width <= 256) body.size = '256x256';
        else if (width <= 512) body.size = '512x512';
        else body.size = '1024x1024';
      }
    } else {
      body.size = '1024x1024';
    }
  } else if (provider === 'xai') {
    if (aspectRatio) {
      body.aspect_ratio = aspectRatio;
    } else {
      // default aspect ratio
      body.aspect_ratio = '1:1';
    }
    // xAI does NOT support 'size' parameter
    delete body.size;
  }

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`${provider} API error: ${res.status} ${errorText}`);
  }

  const data = await res.json() as any;

  if (data.data?.[0]?.b64_json) {
    return data.data[0].b64_json;
  } else if (data.data?.[0]?.url) {
    const imgRes = await fetch(data.data[0].url);
    if (!imgRes.ok) throw new Error('Failed to fetch generated image URL');
    const arrayBuffer = await imgRes.arrayBuffer();
    return Buffer.from(arrayBuffer).toString('base64');
  }

  throw new Error('No image generated in the response.');
}
async function* streamXAI(modelName: string, messages: SimpleMessage[], apiKey: string) {
  const { default: OpenAI } = await import('openai');
  const openai = new OpenAI({ apiKey: apiKey || undefined, baseURL: 'https://api.x.ai/v1' });
  const response = await openai.chat.completions.create({ model: modelName, messages, stream: true });
  for await (const chunk of response) {
    const text = chunk.choices[0]?.delta?.content ?? '';
    if (text) yield text;
  }
}

async function* streamOpenAI(modelName: string, messages: SimpleMessage[], apiKey: string) {
  const { default: OpenAI } = await import('openai');
  const openai = new OpenAI({ apiKey: apiKey || undefined });
  const response = await openai.chat.completions.create({ model: modelName, messages, stream: true });
  for await (const chunk of response) {
    const text = chunk.choices[0]?.delta?.content ?? '';
    if (text) yield text;
  }
}

async function* streamAnthropic(modelName: string, messages: SimpleMessage[], apiKey: string) {
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const anthropic = new Anthropic({ apiKey });
  const system = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n');
  const nonSystem = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
  const s = anthropic.messages.stream({
    model: modelName,
    max_tokens: 8096,
    ...(system ? { system } : {}),
    messages: nonSystem,
  });
  for await (const event of s) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      yield event.delta.text;
    }
  }
}

async function* streamOllama(modelName: string, messages: SimpleMessage[], baseUrl: string) {
  const res = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: modelName, messages, stream: true }),
  });
  if (!res.ok || !res.body) throw new Error(`Ollama error: ${res.status}`);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.trim()) continue;
      const data = JSON.parse(line) as { message?: { content?: string } };
      if (data.message?.content) yield data.message.content;
    }
  }
}

async function* providerStream(
  modelId: string,
  messages: SimpleMessage[],
  env: Record<string, string>,
): AsyncGenerator<string> {
  const sep = modelId.indexOf(':');
  if (sep === -1) throw new Error(`Invalid modelId "${modelId}". Use provider:model-name`);
  const provider = modelId.slice(0, sep);
  const modelName = modelId.slice(sep + 1);

  if (provider === 'openai') yield* streamOpenAI(modelName, messages, env.OPENAI_API_KEY ?? '');
  else if (provider === 'anthropic') yield* streamAnthropic(modelName, messages, env.ANTHROPIC_API_KEY ?? '');
  else if (provider === 'ollama') yield* streamOllama(modelName, messages, env.OLLAMA_BASE_URL ?? 'http://localhost:11434');
  else if (provider === 'xai') yield* streamXAI(modelName, messages, env.XAI_API_KEY ?? '');
  else throw new Error(`Unknown provider: ${provider}`);
}

// ===== Middleware helpers =====
const readBody = (req: IncomingMessage): Promise<unknown> =>
  new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => {
      const text = Buffer.concat(chunks).toString('utf-8');
      try { resolve(text ? JSON.parse(text) : {}); } catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });

const send = (res: ServerResponse, status: number, data: unknown) => {
  const body = JSON.stringify(data);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(body);
};

// ===== Plugin =====
export function localApiPlugin(env: Record<string, string>): Plugin {
  const defaultModel = env.DEFAULT_MODEL ?? 'ollama:llama3.2';

  return {
    name: 'vite-plugin-local-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const { pathname } = new URL(req.url ?? '/', 'http://localhost');
        const method = req.method?.toUpperCase() ?? 'GET';

        const chatMatch = pathname.match(/^\/chats(?:\/([^/]+))?(?:\/([^/]+))?$/);
        const predictMatch = pathname.match(/^\/predict\/(stream|title)$/);
        const scMatch = pathname.match(/^\/systemcontexts(?:\/([^/]+))?(?:\/([^/]+))?$/);
        const exAppsMatch = pathname === '/exapps' && method === 'GET';
        const imageGenMatch = pathname === '/image/generate' && method === 'POST';

        if (!chatMatch && !predictMatch && !scMatch && !exAppsMatch && !imageGenMatch) return next();

        try {
          // ---- Image Generation ----
          if (imageGenMatch) {
            type ImageGenBody = { 
              model?: { modelId?: string }; 
              params: { 
                textPrompt: Array<{ text: string }>;
                width?: number;
                height?: number;
                aspectRatio?: string;
              } 
            };
            const body = (await readBody(req)) as ImageGenBody;
            const modelId = body.model?.modelId ?? 'openai:gpt-image-2';
            const prompt = body.params.textPrompt?.[0]?.text ?? '';
            const width = body.params.width;
            const height = body.params.height;
            const aspectRatio = body.params.aspectRatio;
            
            const sep = modelId.indexOf(':');
            const provider = sep !== -1 ? modelId.slice(0, sep) : 'openai';
            const modelName = sep !== -1 ? modelId.slice(sep + 1) : modelId;
            
            const apiKey = env[`${provider.toUpperCase()}_API_KEY`] ?? '';
            
            try {
              const b64Json = await generateImage(prompt, modelName, apiKey, provider, width, height, aspectRatio);
              return send(res, 200, b64Json);
            } catch (err) {
              console.error('[ImageGen Local API Error]', err);
              return send(res, 500, { error: err instanceof Error ? err.message : String(err) });
            }
          }

          // ---- Chat routes ----
          if (chatMatch) {
            const [, seg1, seg2] = chatMatch;

            if (!seg1) {
              if (method === 'GET') return send(res, 200, { data: chatStore.list() });
              if (method === 'POST') return send(res, 200, { chat: chatStore.create() });
            }
            if (seg1 && !seg2) {
              if (method === 'GET') {
                const chat = chatStore.find(seg1);
                return chat ? send(res, 200, { chat }) : send(res, 404, { error: 'Not found' });
              }
              if (method === 'DELETE') { chatStore.delete(seg1); return send(res, 200, {}); }
            }
            if (seg1 && seg2 === 'title' && method === 'PUT') {
              const body = (await readBody(req)) as { title: string };
              const chat = chatStore.updateTitle(seg1, body.title);
              return chat ? send(res, 200, { chat }) : send(res, 404, { error: 'Not found' });
            }
            if (seg1 && seg2 === 'messages') {
              if (method === 'GET') return send(res, 200, { messages: chatStore.listMessages(seg1) });
              if (method === 'POST') {
                type InMsg = { messageId: string; usecase: string; role: string; content: string };
                const body = (await readBody(req)) as { messages: InMsg[] };
                return send(res, 200, { messages: chatStore.createMessages(seg1, body.messages) });
              }
            }
          }

          // ---- SystemContext routes ----
          if (scMatch) {
            const [, seg1, seg2] = scMatch;
            const scId = (id: string) => id.replace(/^systemContext#/, '');

            if (!seg1) {
              if (method === 'GET') return send(res, 200, systemContextStore.list());
              if (method === 'POST') {
                const body = (await readBody(req)) as { systemContextTitle: string; systemContext: string };
                return send(res, 200, systemContextStore.create(body.systemContextTitle, body.systemContext));
              }
            }
            if (seg1 && !seg2) {
              if (method === 'DELETE') { systemContextStore.delete(scId(seg1)); return send(res, 200, {}); }
            }
            if (seg1 && seg2 === 'title' && method === 'PUT') {
              const body = (await readBody(req)) as { title: string };
              const sc = systemContextStore.updateTitle(scId(seg1), body.title);
              return sc
                ? send(res, 200, { systemContext: sc })
                : send(res, 404, { error: 'Not found' });
            }
          }

          // ---- ExApps routes ----
          if (exAppsMatch) return send(res, 200, []);

          // ---- Predict routes ----
          if (predictMatch) {
            type PredictBody = { model?: { modelId?: string }; messages?: Array<{ role: string; content: string }>; prompt?: string };
            const body = (await readBody(req)) as PredictBody;
            const modelId = body.model?.modelId ?? defaultModel;
            const messages: SimpleMessage[] = (body.messages ?? []).map((m) => ({
              role: m.role as Role,
              content: m.content,
            }));

            if (predictMatch[1] === 'stream') {
              res.writeHead(200, {
                'Content-Type': 'text/plain; charset=utf-8',
                'Cache-Control': 'no-cache',
                'Transfer-Encoding': 'chunked',
              });
              try {
                for await (const text of providerStream(modelId, messages, env)) {
                  res.write(`${JSON.stringify({ text })}\n`);
                }
                res.write(`${JSON.stringify({ text: '', stopReason: 'end_turn' })}\n`);
              } catch (err) {
                res.write(`${JSON.stringify({ text: '', stopReason: 'error', trace: String(err) })}\n`);
              }
              return res.end();
            }

            if (predictMatch[1] === 'title') {
              let title = '';
              const prompt = body.prompt ?? '';
              for await (const text of providerStream(modelId, [{ role: 'user', content: prompt }], env)) {
                title += text;
              }
              return send(res, 200, title.trim());
            }
          }
        } catch (err) {
          console.error('[Local API Error]', err);
          return send(res, 500, { error: err instanceof Error ? err.message : String(err) });
        }

        next();
      });
    },
  };
}
