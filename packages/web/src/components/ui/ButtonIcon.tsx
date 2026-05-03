import React, { ComponentProps, forwardRef } from 'react';
import { PiSpinnerGap } from 'react-icons/pi';

type Props = ComponentProps<'button'> & {
  loading?: boolean;
};

export const ButtonIcon = forwardRef<HTMLButtonElement, Props>((props, ref) => {
  const { className, children, loading, disabled, onClick, ...rest } = props;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button
      ref={ref}
      type='button'
      className={`relative flex min-h-9 min-w-9 items-center justify-center rounded p-1.5 text-xl after:absolute after:-inset-full after:m-auto after:h-11 after:w-11 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:-outline-offset-2 ${disabled || loading ? 'opacity-30' : ''} ${className ?? ''}`}
      onClick={handleClick}
      aria-disabled={disabled}
      {...rest}
    >
      {loading ? (
        <PiSpinnerGap aria-label='実行中' role='img' className='animate-spin' />
      ) : (
        children
      )}
    </button>
  );
});
