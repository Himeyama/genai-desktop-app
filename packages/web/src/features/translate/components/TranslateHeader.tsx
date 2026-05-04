import { Switch } from '@/components/ui/Switch';
import { ModelSelector } from './ModelSelector';

type Props = {
  auto: boolean;
  setAuto: (value: boolean) => void;
};

export const TranslateHeader = ({ auto, setAuto }: Props) => {
  return (
    <div className='flex flex-col gap-4'>
      <h1 className='flex justify-start text-xl font-bold leading-relaxed lg:text-2xl lg:leading-snug'>
        翻訳
      </h1>
      <div className='flex items-center gap-4'>
        <div className='min-w-0 flex-1'>
          <ModelSelector />
        </div>
        <div className='shrink-0'>
          <Switch label='即時翻訳' checked={auto} onSwitch={setAuto} />
        </div>
      </div>
    </div>
  );
};
