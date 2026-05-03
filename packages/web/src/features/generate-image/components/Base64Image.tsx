import { PiFileX, PiImageLight } from 'react-icons/pi';
import { ProgressIndicator } from '@/components/ui/dads/ProgressIndicator';

type CommonProps = {
  className?: string;
  error?: boolean;
  errorMessage?: string;
  imageBase64: string | null;
  loading?: boolean;
  width?: number;
  height?: number;
};

type ContentProps = CommonProps & {
  src: string;
};

const Base64ImageContent = (props: ContentProps) => {
  const { error, errorMessage, imageBase64, loading, src, width, height } = props;

  if (error) {
    return (
      <span className='flex w-full flex-col items-center'>
        <PiFileX className={`${errorMessage ? 'size-1/4' : 'size-1/2'} text-red-600`} />
        <span className='text-xs text-red-600'>エラー</span>

        {errorMessage && (
          <span className='w-full text-sm wrap-break-word text-gray-600'>{errorMessage}</span>
        )}
      </span>
    );
  }

  if (!imageBase64 || imageBase64 === '') {
    return loading ? (
      <ProgressIndicator />
    ) : (
      <PiImageLight role='img' aria-label='画像未生成' className='size-3/4 text-gray-400' />
    );
  }

  return (
    <img
      src={src}
      alt=''
      width={width}
      height={height}
      className='size-full rounded-[calc(3/16*1rem)]'
    />
  );
};

type Props = CommonProps & {
  clickable?: boolean;
  format: string; // image/png等
  onClick?: () => void;
};

const baseStyles = 'flex items-center justify-center rounded border border-gray-400';

export const Base64Image = (props: Props) => {
  const { clickable, format, imageBase64, onClick, className, error, errorMessage, loading } =
    props;

  const handleClick = () => {
    if (!clickable) {
      return;
    }
    onClick?.();
  };

  const src = imageBase64?.startsWith('data')
    ? imageBase64
    : `data:${format};base64,${imageBase64}`;

  return clickable ? (
    <button
      type='button'
      className={`${baseStyles} cursor-pointer outline-offset-1 hover:ring-1 hover:ring-white focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2 ${className ?? ''}`}
      onClick={handleClick}
    >
      <Base64ImageContent
        error={error}
        src={src}
        imageBase64={imageBase64}
        loading={loading}
        errorMessage={errorMessage}
      />
    </button>
  ) : (
    <div className={`${baseStyles} ${className ?? ''}`}>
      <Base64ImageContent
        error={error}
        src={src}
        imageBase64={imageBase64}
        loading={loading}
        errorMessage={errorMessage}
      />
    </div>
  );
};
