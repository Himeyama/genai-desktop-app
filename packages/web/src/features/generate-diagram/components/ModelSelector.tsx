import { CustomSelect } from '@/components/ui/CustomSelect';
import { useSelectedModel } from '@/hooks/useSelectedModel';
import { findModelDisplayNameByModelId, MODELS } from '@/models';

export const ModelSelector = () => {
  const { selectedModelId, setSelectedModelId } = useSelectedModel();
  const { modelIds: availableModels } = MODELS;

  return (
    <div className='flex w-full min-w-0'>
      <CustomSelect
        label='LLM：'
        labelClassName='text-sm font-bold leading-tight shrink-0'
        isFullWidth
        value={selectedModelId}
        onChange={setSelectedModelId}
        options={availableModels.map((m) => ({
          value: m,
          label: findModelDisplayNameByModelId(m),
        }))}
      />
    </div>
  );
};
