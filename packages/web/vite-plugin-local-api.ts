import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import { generateImage, streamText, tool, stepCountIs } from 'ai';
import { z } from 'zod';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createXai } from '@ai-sdk/xai';
import { createOllama } from 'ollama-ai-provider-v2';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import * as cheerio from 'cheerio';

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
  const sep = modelId.indexOf('/');
  const provider = sep !== -1 ? modelId.slice(0, sep) : 'openai';
  const rawModelName = sep !== -1 ? modelId.slice(sep + 1) : modelId;
  const apiModelName = rawModelName;

  // NOTE: DO NOT automatically convert openai model names to "dall-e-X".
  // Pass the requested modelName directly to the provider.
  // This is a strict rule to prevent repeated failures.

  let model;

  if (provider === 'openai') {
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

  // NOTE: We omit 'size' and 'response_format' enforcement to prevent proxy/backend validation errors
  // like "unknown parameter" or "argument not supported". The AI SDK defaults usually handle this.

  if (provider === 'xai') {
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
  useTools = false,
): AsyncGenerator<{ text: string; trace?: string }> {
  const sep = modelId.indexOf('/');
  if (sep === -1) throw new Error(`Invalid modelId "${modelId}". Use provider/model-name`);
  const provider = modelId.slice(0, sep);
  const modelName = modelId.slice(sep + 1);

  let model;

  if (provider === 'openai') {
    model = createOpenAI({ apiKey: env.OPENAI_API_KEY ?? '' }).chat(modelName);
  } else if (provider === 'anthropic') {
    model = createAnthropic({ apiKey: env.ANTHROPIC_API_KEY ?? '' })(modelName);
  } else if (provider === 'xai') {
    model = createXai({ apiKey: env.XAI_API_KEY ?? '' })(modelName);
  } else if (provider === 'ollama') {
    model = createOllama({ baseURL: (env.OLLAMA_BASE_URL ?? 'http://localhost:11434') + '/api' })(modelName);
  } else if (provider === 'openrouter') {
    model = createOpenRouter({ apiKey: env.OPENROUTER_API_KEY ?? '' })(modelName);
  } else {
    throw new Error(`Unknown provider: ${provider}`);
  }

  const result = streamText({
    model,
    messages: messages.map(m => ({
      role: m.role as 'system' | 'user' | 'assistant',
      content: m.content,
    })),
    ...(useTools && {
      stopWhen: stepCountIs(5),
      tools: {
        WebSearch: tool({
          description: 'Web上で情報を検索します。ユーザーの質問に答えるために最新の情報が必要な場合に使用します。',
          inputSchema: z.object({
            query: z.string().describe('検索クエリ'),
          }),
          execute: async ({ query }) => {
            try {
              console.log(`[WebSearch] query: ${query}`);
              const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
              const response = await fetch(url, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                  'Accept-Language': 'ja,en-US;q=0.7,en;q=0.3',
                },
              });
              if (!response.ok) return { error: `HTTP Error: ${response.status}` };
              const html = await response.text();
              const $ = cheerio.load(html);
              const results: Array<{ title: string; url: string; snippet: string }> = [];
              $('.result__body').each((i, el) => {
                if (i >= 5) return false;
                const title = $(el).find('.result__title').text().trim();
                const href = $(el).find('a.result__url').attr('href') ?? $(el).find('.result__url').text().trim();
                const snippet = $(el).find('.result__snippet').text().trim();
                if (title) results.push({ title, url: href, snippet });
              });
              return results.length > 0 ? results : { error: '検索結果が見つかりませんでした' };
            } catch (e) {
              console.error('[WebSearch] Error:', e);
              return { error: '検索に失敗しました' };
            }
          },
        }),
        WebFetch: tool({
          description: '指定されたURLのWebページの内容を取得し、テキストとして抽出します。WebSearchの結果を深掘りしたい場合に使用します。',
          inputSchema: z.object({
            url: z.string().describe('取得するWebページのURL'),
          }),
          execute: async ({ url }) => {
            try {
              console.log(`[WebFetch] url: ${url}`);
              const response = await fetch(url as string, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                },
              });
              if (!response.ok) {
                return { error: `HTTP Error: ${response.status}` };
              }
              const html = await response.text();
              const $ = cheerio.load(html);
              $('script, style, nav, header, footer, iframe, noscript').remove();
              let text = $('body').text();
              text = text.replace(/\s+/g, ' ').trim();
              return { content: text.substring(0, 5000) };
            } catch (e) {
              console.error('[WebFetch] Error:', e);
              return { error: 'ページの取得に失敗しました' };
            }
          },
        }),
      },
    }),
  });

  for await (const part of result.fullStream) {
    if (part.type === 'text-delta') {
      yield { text: part.text };
    } else if (part.type === 'tool-call') {
      yield {
        text: '',
        trace: `\n<!-- TOOL:${part.toolName} -->\n- 引数: \`${JSON.stringify(part.input)}\`\n`,
      };
    } else if (part.type === 'tool-result') {
      yield {
        text: '',
        trace: `\n\`\`\`json\n${JSON.stringify(part.output, null, 2)}\n\`\`\`\n`,
      };
    } else if (part.type === 'error') {
      yield {
        text: '',
        trace: `\n**エラー発生**: ${String(part.error)}\n`,
      };
    }
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
  const defaultModel = env.DEFAULT_MODEL ?? 'ollama/llama3.2';

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
        const teamsMatch = pathname.match(/^\/teams\/([^/]+)$/);
        const imageGenMatch = pathname === '/image/generate' && method === 'POST';

        if (!chatMatch && !predictMatch && !scMatch && !exAppsMatch && !teamsMatch && !imageGenMatch) return next();

        try {
          // ---- Teams routes ----
          if (teamsMatch && method === 'GET') {
            const [, teamId] = teamsMatch;
            if (teamId === '00000000-0000-0000-0000-000000000000') {
              return send(res, 200, {
                teamId: teamId,
                teamName: '共通アプリ',
                createdDate: new Date().toISOString(),
                updatedDate: new Date().toISOString()
              });
            }
            return send(res, 404, { error: 'Not found' });
          }

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
              // NOTE: Use a proper status code (like 400) and return `message` to match the frontend `ApiError` expectation
              return send(res, 400, { message: err instanceof Error ? err.message : String(err) });
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
                for await (const chunk of providerStream(modelId, messages, env, true)) {
                  res.write(`${JSON.stringify({ text: chunk.text, trace: chunk.trace })}\n`);
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
              for await (const chunk of providerStream(modelId, [{ role: 'user', content: prompt }], env)) {
                if (chunk.text) title += chunk.text;
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
