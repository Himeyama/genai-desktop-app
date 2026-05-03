import { ModelSelector } from './ModelSelector';

export const TranslateHeader = () => {
  return (
    <div className='mb-6 flex flex-col gap-4'>
      <h1 className='flex justify-start text-xl font-bold leading-relaxed lg:text-2xl font-bold leading-snug'>
        翻訳
      </h1>
      <ModelSelector />
    </div>
  );
};
