import { ModelSelector } from './ModelSelector';

export const DiagramHeader = () => {
  return (
    <div className='mb-6 flex flex-col gap-4'>
      <h1 className='flex justify-start text-xl font-bold leading-relaxed lg:text-2xl font-bold leading-snug'>
        ダイアグラムを生成
      </h1>
      <ModelSelector />
    </div>
  );
};
