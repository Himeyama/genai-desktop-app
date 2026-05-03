import { type ComponentProps, forwardRef } from 'react';

export type SelectBlockSize = 'lg' | 'md' | 'sm';

export type SelectProps = ComponentProps<'select'> & {
  isError?: boolean;
  blockSize?: SelectBlockSize;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>((props, ref) => {
  const { children, className, isError, blockSize = 'lg', onKeyDown, onMouseDown, ...rest } = props;

  const handleDisabledKeyDown = (e: React.KeyboardEvent<HTMLSelectElement>) => {
    if (e.code !== 'Tab') {
      e.preventDefault();
    }
  };

  const handleDisabledMouseDown = (e: React.MouseEvent<HTMLSelectElement, MouseEvent>) => {
    e.preventDefault();
  };

  return (
    <span className='relative'>
      <select
        className={`w-full appearance-none rounded-lg border border-gray-600 bg-white py-[calc(11/16*1rem)] pr-10 pl-4 text-base leading-none text-gray-800 hover:border-black focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-hidden aria-disabled:pointer-events-none aria-disabled:border-gray-300 aria-disabled:bg-gray-50 aria-disabled:text-gray-400 aria-invalid:border-red-600 aria-invalid:hover:border-red-800 data-[size=lg]:h-14 data-[size=md]:h-12 data-[size=sm]:h-10 forced-colors:aria-disabled:border-[GrayText] forced-colors:aria-disabled:text-[GrayText] ${className ?? ''}`}
        aria-invalid={isError || undefined}
        data-size={blockSize}
        onMouseDown={props['aria-disabled'] ? handleDisabledMouseDown : onMouseDown}
        onKeyDown={props['aria-disabled'] ? handleDisabledKeyDown : onKeyDown}
        ref={ref}
        {...rest}
      >
        {children}
      </select>
      <svg
        aria-hidden={true}
        className={`pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 ${props['aria-disabled'] ? 'text-gray-400 forced-colors:text-[GrayText]' : 'text-gray-900 forced-colors:text-[CanvasText]'}`}
        fill='none'
        height='16'
        viewBox='0 0 16 16'
        width='16'
      >
        <path
          d='M13.3344 4.40002L8.00104 9.73336L2.66771 4.40002L1.73438 5.33336L8.00104 11.6L14.2677 5.33336L13.3344 4.40002Z'
          fill='currentColor'
        />
      </svg>
    </span>
  );
});
