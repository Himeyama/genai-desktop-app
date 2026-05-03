import { type ComponentProps, forwardRef } from 'react';

export type CheckboxSize = 'sm' | 'md' | 'lg';

export type CheckboxProps = Omit<ComponentProps<'input'>, 'size'> & {
  size?: CheckboxSize;
  isError?: boolean;
};

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>((props, ref) => {
  const { children, isError, onClick, size = 'sm', ...rest } = props;

  const handleDisabled = (e: React.MouseEvent<HTMLInputElement, MouseEvent>) => {
    e.preventDefault();
  };

  const checkbox = (
    <span
      className={`flex shrink-0 items-center justify-center rounded-[calc(1/8*100%)] has-[input:hover:not(:focus):not([aria-disabled="true"])]:bg-gray-400 data-[size=lg]:size-11 data-[size=md]:size-8 data-[size=sm]:size-6`}
      data-size={size}
    >
      <input
        className={`size-3/4 appearance-none rounded-[calc(2/18*100%)] border-gray-600 bg-white bg-clip-padding before:hidden before:size-3.5 before:bg-white checked:border-blue-600 checked:bg-blue-600 checked:before:block checked:before:[clip-path:path('M5.6,11.2L12.65,4.15L11.25,2.75L5.6,8.4L2.75,5.55L1.35,6.95L5.6,11.2Z')] indeterminate:border-blue-600 indeterminate:bg-blue-600 indeterminate:before:block indeterminate:before:[clip-path:path('M3.25,7.75H10.75V6.25H3.25V7.75Z')] hover:border-black checked:hover:border-blue-800 checked:hover:bg-blue-800 indeterminate:hover:border-blue-800 indeterminate:hover:bg-blue-800 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-hidden aria-disabled:border-gray-300! aria-disabled:bg-gray-50! aria-disabled:before:border-gray-50 aria-disabled:checked:bg-gray-300! aria-disabled:indeterminate:bg-gray-300! data-error:border-red-600 data-error:checked:bg-red-600 data-error:indeterminate:bg-red-600 data-error:hover:border-red-800 data-error:checked:hover:bg-red-800 data-error:indeterminate:hover:bg-red-800 data-[size=lg]:border-[calc(3/16*1rem)] data-[size=lg]:before:origin-top-left data-[size=lg]:before:scale-[calc(27/14)] data-[size=md]:border-[calc(2/16*1rem)] data-[size=md]:before:origin-top-left data-[size=md]:before:scale-[calc(20/14)] data-[size=sm]:border-[calc(2/16*1rem)] forced-colors:border-[ButtonText]! forced-colors:before:bg-[HighlightText]! forced-colors:checked:border-[Highlight]! forced-colors:checked:bg-[Highlight]! forced-colors:indeterminate:border-[Highlight]! forced-colors:indeterminate:bg-[Highlight]! forced-colors:aria-disabled:border-[GrayText]! forced-colors:aria-disabled:checked:bg-[GrayText]!`}
        onClick={props['aria-disabled'] ? handleDisabled : onClick}
        ref={ref}
        type='checkbox'
        data-size={size}
        data-error={isError || null}
        {...rest}
      />
    </span>
  );

  return children ? (
    <label
      className='flex w-fit items-start py-2 data-[size=lg]:gap-2 data-[size=md]:gap-2 data-[size=sm]:gap-1'
      data-size={size}
    >
      {checkbox}
      <span
        className='text-gray-800 data-[size=lg]:pt-2.5 data-[size=lg]:text-base leading-tight data-[size=md]:pt-1 data-[size=md]:text-base leading-tight data-[size=sm]:pt-px data-[size=sm]:text-base leading-tight'
        data-size={size}
      >
        {children}
      </span>
    </label>
  ) : (
    checkbox
  );
});
