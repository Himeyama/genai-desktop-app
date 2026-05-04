import type { GenerateImageParams, GenerateImageResponse, Model } from 'genai-web';
import { genUApi } from '@/lib/fetcher';

type CustomEndpointResponse = {
  images: { base64: string; mediaType: string }[];
  warnings?: unknown[];
};

export const useGenerateImage = () => {
  return {
    generateImage: async (params: GenerateImageParams, model: Model | undefined) => {
      const response = await genUApi.post<GenerateImageResponse>('/image/generate', {
        model: model,
        params: {
          ...params,
          stylePreset: params.stylePreset === '' ? undefined : params.stylePreset,
          initImage: params.initImage === '' ? undefined : params.initImage?.split(',')[1],
          maskImage: params.maskImage === '' ? undefined : params.maskImage?.split(',')[1],
        },
      });
      return response.data;
    },

    generateImageFromCustomEndpoint: async (
      prompt: string,
      endpointUrl: string,
      model: string,
      size?: string,
      aspectRatio?: string,
      seed?: number,
    ): Promise<string> => {
      const body: Record<string, unknown> = { model, prompt, n: 1 };
      if (size) body.size = size;
      if (aspectRatio) body.aspectRatio = aspectRatio;
      if (seed !== undefined) body.seed = seed;

      const url = `${endpointUrl.replace(/\/$/, '')}/v1/images/generate`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        let message: string;
        try {
          const errJson = await res.json();
          message = (errJson as { message?: string }).message ?? JSON.stringify(errJson);
        } catch {
          message = await res.text();
        }
        throw new Error(message);
      }

      const data = (await res.json()) as CustomEndpointResponse;
      return data.images[0].base64;
    },
  };
};
