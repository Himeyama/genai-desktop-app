const fs = require('fs');
const file = 'packages/web/vite-plugin-local-api.ts';
let code = fs.readFileSync(file, 'utf-8');

const originalImageGenMatch = `          if (imageGenMatch) {
            type ImageGenBody = { model?: { modelId?: string }; params: { textPrompt: Array<{ text: string }> } };
            const body = (await readBody(req)) as ImageGenBody;
            const modelId = body.model?.modelId ?? 'openai:gpt-image-2';
            const prompt = body.params.textPrompt?.[0]?.text ?? '';

            const sep = modelId.indexOf(':');
            const provider = sep !== -1 ? modelId.slice(0, sep) : 'openai';
            const modelName = sep !== -1 ? modelId.slice(sep + 1) : modelId;

            const apiKey = env[\`\${provider.toUpperCase()}_API_KEY\`] ?? '';

            try {
              const b64Json = await generateImage(prompt, modelName, apiKey, provider);
              return send(res, 200, b64Json);`;

const newImageGenMatch = `          if (imageGenMatch) {
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

            const apiKey = env[\`\${provider.toUpperCase()}_API_KEY\`] ?? '';

            try {
              const b64Json = await generateImage(prompt, modelName, apiKey, provider, width, height, aspectRatio);
              return send(res, 200, b64Json);`;

code = code.replace(originalImageGenMatch, newImageGenMatch);

const originalGenerateImage = `async function generateImage(prompt: string, modelName: string, apiKey: string, provider: string) {
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
    body.size = '1024x1024';
  }

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: \`Bearer \${apiKey}\`,
    },
    body: JSON.stringify(body),
  });`;

const newGenerateImage = `async function generateImage(prompt: string, modelName: string, apiKey: string, provider: string, width?: number, height?: number, aspectRatio?: string) {
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
      body.size = \`\${width}x\${height}\`;
    } else {
      body.size = '1024x1024';
    }
  } else if (provider === 'xai') {
    if (aspectRatio) {
      // mapping standard aspect ratios to pixel sizes that Grok Image might support
      // or just passing it if Grok API supports aspect_ratio natively, wait, Grok uses 'size' usually
      const ratioMap: Record<string, string> = {
        '1:1': '1024x1024',
        '16:9': '1280x720', // or 1024x576, but standard might be 1280x720 for 16:9
        '9:16': '720x1280',
        '4:3': '1024x768',
        '3:4': '768x1024',
        '3:2': '1200x800',
        '2:3': '800x1200',
        '5:4': '1000x800',
        '21:9': '1536x640',
      };
      body.size = ratioMap[aspectRatio] || '1024x1024';
    } else if (width && height) {
      body.size = \`\${width}x\${height}\`;
    } else {
      body.size = '1024x1024';
    }
  }

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: \`Bearer \${apiKey}\`,
    },
    body: JSON.stringify(body),
  });`;

code = code.replace(originalGenerateImage, newGenerateImage);
fs.writeFileSync(file, code);
console.log('Fixed sizes in local plugin.');