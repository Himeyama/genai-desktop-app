import { type ComponentProps, forwardRef } from 'react';

export type InputBlockSize = 'lg' | 'md' | 'sm';

export type InputProps = ComponentProps<'input'> & {
  isError?: boolean;
  blockSize?: InputBlockSize;
};

export const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  const { className, readOnly, isError, blockSize = 'lg', ...rest } = props;

  return (
    <input
      className={`max-w-full rounded-lg border border-gray-600 bg-white px-4 py-3 text-base leading-none text-gray-800 read-only:border-dashed focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-hidden aria-disabled:pointer-events-none aria-disabled:border-solid! aria-disabled:border-gray-300 aria-disabled:bg-gray-50 aria-disabled:text-gray-400 aria-[invalid=true]:border-red-600 data-[size=lg]:h-14 data-[size=md]:h-12 data-[size=sm]:h-10 aria-disabled:forced-colors:border-[GrayText] aria-disabled:forced-colors:text-[GrayText] hover:[&:read-write]:border-gray-500 aria-[invalid=true]:[&:read-write]:hover:border-red-800 ${className ?? ''}`}
      aria-invalid={isError || undefined}
      data-size={blockSize}
      readOnly={props['aria-disabled'] ? true : readOnly}
      ref={ref}
      {...rest}
    />
  );
});
