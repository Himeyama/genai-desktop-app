import type { ComponentProps } from 'react';

type Props = ComponentProps<'button'> & {
  label?: string;
};

export const NotificationBannerClose = (props: Props) => {
  const { className, label, ...rest } = props;

  return (
    <button
      className={`-mr-3 inline-flex items-center gap-1 self-start rounded-md px-3 pt-1 pb-1.5 text-gray-900 hover:bg-gray-50 focus-visible:bg-gray-100 focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2 ${className ?? ''}`}
      type='button'
      {...rest}
    >
      <svg
        aria-hidden={true}
        className='mt-0.5 size-6'
        fill='none'
        height='24'
        viewBox='0 0 24 24'
        width='24'
      >
        <g>
          <path
            d='m6.4 18.6-1-1 5.5-5.6-5.6-5.6 1.1-1 5.6 5.5 5.6-5.6 1 1.1L13 12l5.6 5.6-1 1L12 13l-5.6 5.6Z'
            fill='currentColor'
          />
        </g>
      </svg>
      <span className='text-base leading-none'>{label ?? '閉じる'}</span>
    </button>
  );
};
