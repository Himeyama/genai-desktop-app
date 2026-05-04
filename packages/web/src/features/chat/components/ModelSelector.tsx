import { CustomSelect } from '@/components/ui/CustomSelect';
import { useSelectedModel } from '@/hooks/useSelectedModel';
import { findModelDisplayNameByModelId, isModelAvailable, MODELS } from '@/models';

export const ModelSelector = () => {
  const { selectedModelId, setSelectedModelId } = useSelectedModel();
  const { modelIds: availableModels } = MODELS;

  return (
    <div className='mt-2 flex w-full min-w-0 items-end justify-start lg:mt-0 print:hidden'>
      <CustomSelect
        label='LLMモデル'
        labelClassName='text-sm font-bold leading-tight shrink-0'
        isFullWidth
        value={selectedModelId}
        onChange={setSelectedModelId}
        options={availableModels.map((m) => {
          return {
            value: m,
            label: findModelDisplayNameByModelId(m),
            disabled: !isModelAvailable(m),
          };
        })}
      />
    </div>
  );
};
