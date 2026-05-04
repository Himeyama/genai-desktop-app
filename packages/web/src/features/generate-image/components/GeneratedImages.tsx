import { Base64Image } from '@/features/generate-image/components/Base64Image';
import { useGenerateImageStore } from '@/features/generate-image/stores/useGenerateImageStore';

type Props = {
  generating: boolean;
  selectedImageIndex: number;
  setSelectedImageIndex: (index: number) => void;
};

export const GeneratedImages = (props: Props) => {
  const { generating, selectedImageIndex } = props;

  const { image } = useGenerateImageStore();

  return (
    <>
      <div className='flex items-center justify-center mb-6'>
        <Base64Image
          className='min-h-60 max-w-lg min-w-60'
          imageBase64={image[selectedImageIndex].base64}
          loading={generating}
          error={image[selectedImageIndex].error}
          errorMessage={image[selectedImageIndex].errorMessage}
          format={'image/png'}
        />
      </div>
    </>
  );
};
