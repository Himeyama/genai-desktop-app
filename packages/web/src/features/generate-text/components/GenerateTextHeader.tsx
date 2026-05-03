import { ModelSelector } from './ModelSelector';

export const GenerateTextHeader = () => {
  return (
    <div className='mb-6 flex flex-col gap-4'>
      <h1 className='flex justify-start text-xl font-bold leading-relaxed lg:text-2xl font-bold leading-snug'>
        文章を生成
      </h1>
      <ModelSelector />
    </div>
  );
};
