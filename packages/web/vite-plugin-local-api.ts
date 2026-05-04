import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import { generateImage, streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createXai } from '@ai-sdk/xai';
import { createOllama } from 'ollama-ai-provider-v2';

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

async function generateImageHandler(prompt: string, modelId: string, env: Record<string, string>, width?: number, height?: number, aspectRatio?: string) {
  const sep = modelId.indexOf(':');
  const provider = sep !== -1 ? modelId.slice(0, sep) : 'openai';
  const rawModelName = sep !== -1 ? modelId.slice(sep + 1) : modelId;
  let apiModelName = rawModelName;

  let model;

  if (provider === 'openai') {
    if (rawModelName === 'gpt-4o-image') apiModelName = 'gpt-image-1.5';
    const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY });
    model = openai.image(apiModelName);
  } else if (provider === 'xai') {
    const xai = createXai({ apiKey: env.XAI_API_KEY });
    model = xai.image(apiModelName);
  } else {
    throw new Error(`Unsupported image provider: ${provider}`);
  }

  let size: `${number}x${number}` | undefined = undefined;
  let finalAspectRatio: string | undefined = undefined;

  if (provider === 'openai') {
    if (width && height) {
      if (apiModelName === 'gpt-image-1.5') {
        if (width > height) size = '1792x1024';
        else if (height > width) size = '1024x1792';
        else size = '1024x1024';
      } else {
        if (width <= 256) size = '256x256';
        else if (width <= 512) size = '512x512';
        else size = '1024x1024';
      }
    } else {
      size = '1024x1024';
    }
  } else if (provider === 'xai') {
    finalAspectRatio = aspectRatio || '1:1';
  }

  const result = await generateImage({
    model,
    prompt,
    n: 1,
    size,
    aspectRatio: finalAspectRatio as any,
  });

  return result.image.base64;
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

  let model;

  if (provider === 'openai') {
    model = createOpenAI({ apiKey: env.OPENAI_API_KEY ?? '' })(modelName);
  } else if (provider === 'anthropic') {
    model = createAnthropic({ apiKey: env.ANTHROPIC_API_KEY ?? '' })(modelName);
  } else if (provider === 'xai') {
    model = createXai({ apiKey: env.XAI_API_KEY ?? '' })(modelName);
  } else if (provider === 'ollama') {
    model = createOllama({ baseURL: (env.OLLAMA_BASE_URL ?? 'http://localhost:11434') + '/api' })(modelName);
  } else {
    throw new Error(`Unknown provider: ${provider}`);  }

  const result = streamText({
    model,
    messages: messages.map(m => ({
      role: m.role as 'system' | 'user' | 'assistant',
      content: m.content,
    }))
  });

  for await (const chunk of result.textStream) {
    yield chunk;
  }
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

            try {
              const b64Json = await generateImageHandler(prompt, modelId, env, width, height, aspectRatio);
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
