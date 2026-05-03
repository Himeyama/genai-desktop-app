import { type ComponentProps, forwardRef } from 'react';

export type RadioSize = 'sm' | 'md' | 'lg';

export type RadioProps = Omit<ComponentProps<'input'>, 'size'> & {
  size?: RadioSize;
  isError?: boolean;
};

export const Radio = forwardRef<HTMLInputElement, RadioProps>((props, ref) => {
  const { children, className, isError, onClick, size = 'sm', ...rest } = props;

  const handleDisabled = (e: React.MouseEvent<HTMLInputElement, MouseEvent>) => {
    e.preventDefault();
  };

  const radio = (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full has-[input:hover:not(:focus):not([aria-disabled="true"])]:bg-gray-400 data-[size=lg]:size-11 data-[size=md]:size-8 data-[size=sm]:size-6`}
      data-size={size}
    >
      <input
        className={`size-5/6 appearance-none rounded-full border-gray-600 bg-white before:hidden before:size-full before:bg-white before:[clip-path:circle(calc(5/16*100%))] checked:border-blue-600 checked:before:block checked:before:bg-blue-600 hover:border-black checked:hover:border-blue-800 checked:hover:before:bg-blue-800 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-hidden aria-disabled:border-gray-300! aria-disabled:bg-gray-50! aria-disabled:checked:before:bg-gray-300! data-error:border-red-600 data-error:checked:before:bg-red-600 data-error:hover:border-red-800 data-error:checked:hover:before:bg-red-800 data-[size=lg]:border-[calc(3/16*1rem)] data-[size=md]:border-[calc(2/16*1rem)] data-[size=sm]:border-[calc(2/16*1rem)] forced-colors:border-[ButtonText]! forced-colors:checked:border-[Highlight]! forced-colors:checked:before:bg-[Highlight]! forced-colors:aria-disabled:border-[GrayText]! forced-colors:aria-disabled:checked:before:bg-[GrayText]! ${className ?? ''}`}
        ref={ref}
        type='radio'
        onClick={props['aria-disabled'] ? handleDisabled : onClick}
        data-size={size}
        data-error={isError || null}
        {...rest}
      />
    </span>
  );

  return children ? (
    <label
      className='flex w-fit items-start py-2 data-[size=lg]:gap-3 data-[size=md]:gap-2 data-[size=sm]:gap-1'
      data-size={size}
    >
      {radio}
      <span
        className='text-gray-800 data-[size=lg]:pt-2.5 data-[size=lg]:text-base leading-tight data-[size=md]:pt-1 data-[size=md]:text-base leading-tight data-[size=sm]:pt-px data-[size=sm]:text-base leading-tight'
        data-size={size}
      >
        {children}
      </span>
    </label>
  ) : (
    radio
  );
});
