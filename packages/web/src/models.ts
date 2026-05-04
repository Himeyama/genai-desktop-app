import { CRI_PREFIX_PATTERN, modelMetadata } from '@/lib/modelMetadata';
import type { Model } from 'genai-web';

const bedrockModelIds: string[] = (JSON.parse(import.meta.env.VITE_APP_MODEL_IDS) as string[])
  .map((name: string) => name.trim())
  .filter((name: string) => name);

const duplicateBaseModelIds = new Set(
  bedrockModelIds
    .map((modelId) => modelId.replace(CRI_PREFIX_PATTERN, ''))
    .filter((item, index, arr) => arr.indexOf(item) !== index),
);
const endpointNames: string[] = JSON.parse(import.meta.env.VITE_APP_ENDPOINT_NAMES)
  .map((name: string) => name.trim())
  .filter((name: string) => name);

const imageGenModelIds: string[] = (
  JSON.parse(import.meta.env.VITE_APP_IMAGE_MODEL_IDS) as string[]
)
  .map((name: string) => name.trim())
  .filter((name: string) => name);

const textModels = [
  ...bedrockModelIds.map((name) => ({ modelId: name, type: 'bedrock' }) as Model),
  ...endpointNames.map((name) => ({ modelId: name, type: 'sagemaker' }) as Model),
];
const imageGenModels = [
  ...imageGenModelIds.map((name) => ({ modelId: name, type: 'bedrock' }) as Model),
];

export const findModelByModelId = (modelId: string) => {
  const model = textModels.find((m) => m.modelId === modelId);
  if (!model) {
    return undefined;
  }
  return { ...model };
};

export const findModelDisplayNameByModelId = (modelId: string): string => {
  let displayName = modelMetadata[modelId]?.displayName ?? modelId;
  if (duplicateBaseModelIds.has(modelId.replace(CRI_PREFIX_PATTERN, ''))) {
    const matched = modelId.match(CRI_PREFIX_PATTERN);
    if (matched) {
      displayName += ` (${matched[1].toUpperCase()})`;
    }
  }
  return displayName;
};

export const isModelAvailable = (modelId: string): boolean => {
  const sep = modelId.indexOf('/');
  if (sep === -1) {
    return true;
  }
  const provider = modelId.slice(0, sep);
  if (provider === 'openai') return import.meta.env.VITE_APP_HAS_OPENAI_API_KEY ?? true;
  if (provider === 'anthropic') return import.meta.env.VITE_APP_HAS_ANTHROPIC_API_KEY ?? true;
  if (provider === 'xai') return import.meta.env.VITE_APP_HAS_XAI_API_KEY ?? true;
  if (provider === 'openrouter') return import.meta.env.VITE_APP_HAS_OPENROUTER_API_KEY ?? true;
  if (provider === 'ollama') return import.meta.env.VITE_APP_HAS_OLLAMA ?? true;
  
  return true;
};

export const MODELS = {
  modelIds: [...bedrockModelIds, ...endpointNames],
  modelMetadata,
  imageGenModelIds: imageGenModelIds,
  imageGenModels: imageGenModels,
};
