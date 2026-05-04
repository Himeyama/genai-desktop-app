import { useState } from 'react';
import { useLocation } from 'react-router';
import { PageTitle } from '@/components/PageTitle';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { APP_TITLE } from '@/constants';
import { useGenerateImageHandler } from '@/features/generate-image/hooks/useGenerateImageHandler';
import { useReset } from '@/features/generate-image/hooks/useReset';
import { useSetDefaultValues } from '@/features/generate-image/hooks/useSetDefaultValues';
import { useGenerateImageStore } from '@/features/generate-image/stores/useGenerateImageStore';
import { useChat } from '@/hooks/useChat';
import { useSelectedModel } from '@/hooks/useSelectedModel';
import { findModelDisplayNameByModelId, MODELS } from '@/models';
import { GeneratedImages } from './components/GeneratedImages';
import { GenerateImageAssistant } from './components/GenerateImageAssistant';
import { ImageGeneratorForm } from './components/ImageGeneratorForm';
import { SketchMaskDialogs } from './components/SketchMaskDialogs';
import { Canvas } from './types';

export const GenerateImagePage = () => {
  const {
    prompt,
    setPrompt,
    negativePrompt,
    setNegativePrompt,
    resolution,
    stylePreset,
    setStylePreset,
    initImage,
    setInitImage,
    maskImage,
    setMaskImage,
    chatContent,
    setChatContent,
    clear,
  } = useGenerateImageStore();

  const { pathname } = useLocation();
  const { loading: loadingChat, clear: clearChat } = useChat(pathname);
  const { selectedModelId, setSelectedModelId } = useSelectedModel();

  const [generating, setGenerating] = useState(false);
  const [isOpenSketch, setIsOpenSketch] = useState(false);
  const [isOpenMask, setIsOpenMask] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const { modelIds } = MODELS;
  const { handleGenerateImage, onClickRandomSeed } = useGenerateImageHandler(setGenerating);

  const [width, height] = resolution.label.split('x').map((v) => Number(v));

  useReset();

  useSetDefaultValues();

  const onChangeInitImageBase64 = (s: Canvas) => {
    setInitImage(s);
    setIsOpenSketch(false);
  };

  const onChangeMaskImageBase64 = (s: Canvas) => {
    setMaskImage(s);
    setIsOpenMask(false);
  };

  const clearAll = () => {
    setSelectedImageIndex(0);
    clear();
    clearChat();
  };

  return (
    <>
      <PageTitle title={`画像を生成${APP_TITLE ? ` | ${APP_TITLE}` : ''}`} />
      <div className='h-full'>
        <div className='grid h-full grid-rows-[auto_minmax(0,1fr)]'>
          <div className='border-b border-b-black px-4 pt-4 pb-2 lg:px-6'>
            <h1 className='mb-1 flex justify-start text-xl font-bold leading-relaxed lg:text-2xl font-bold leading-snug'>
              画像を生成
            </h1>
            <div className='mt-2 flex w-full'>
              <CustomSelect
                label='LLM：'
                labelClassName='text-sm font-bold leading-tight'
                value={selectedModelId}
                onChange={setSelectedModelId}
                options={modelIds.map((m) => {
                  return { value: m, label: findModelDisplayNameByModelId(m) };
                })}
              />
            </div>
          </div>

          <div>
            <div className='grid h-full grid-cols-[1fr_24rem] grid-rows-1'>
              <div className='min-h-0 border-r border-r-solid-gray-420'>
                <GenerateImageAssistant
                  modelId={selectedModelId}
                  onChangeModel={setSelectedModelId}
                  modelIds={modelIds}
                  content={chatContent}
                  onChangeContent={setChatContent}
                  isGeneratingImage={generating}
                  onUpdateParams={(p, np, sp) => {
                    if (p !== prompt || np !== negativePrompt || (sp ?? '') !== stylePreset) {
                      setSelectedImageIndex(0);
                      setPrompt(p);
                      setNegativePrompt(np);
                      if (sp !== undefined) {
                        setStylePreset(sp);
                      }
                    }
                  }}
                />
              </div>

              <div className='min-h-0 overflow-x-clip overflow-y-auto [scrollbar-gutter:stable]'>
                <div className='py-3 pr-3 pl-4'>
                  <h2 className='mb-4 text-lg font-bold leading-relaxed lg:text-xl font-bold leading-snug'>
                    画像生成結果
                  </h2>

                  <GeneratedImages
                    generating={generating}
                    selectedImageIndex={selectedImageIndex}
                    setSelectedImageIndex={setSelectedImageIndex}
                  />

                  <ImageGeneratorForm
                    loadingChat={loadingChat}
                    generating={generating}
                    selectedImageIndex={selectedImageIndex}
                    setSelectedImageIndex={setSelectedImageIndex}
                    setIsOpenSketch={setIsOpenSketch}
                    setIsOpenMask={setIsOpenMask}
                    generateImage={handleGenerateImage}
                    clearAll={clearAll}
                    onClickRandomSeed={() => onClickRandomSeed(selectedImageIndex)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SketchMaskDialogs
        width={width}
        height={height}
        initImage={initImage}
        maskImage={maskImage}
        isOpenSketch={isOpenSketch}
        isOpenMask={isOpenMask}
        onCloseSketch={() => setIsOpenSketch(false)}
        onCloseMask={() => setIsOpenMask(false)}
        onChangeInitImage={onChangeInitImageBase64}
        onChangeMaskImage={onChangeMaskImageBase64}
      />
    </>
  );
};
