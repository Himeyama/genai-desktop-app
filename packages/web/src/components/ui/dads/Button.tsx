// DADS v2.1.2
import { Slot } from './Slot';
import { type ComponentProps, forwardRef } from 'react';

export type ButtonVariant = 'solid-fill' | 'outline' | 'text';
export type ButtonSize = 'lg' | 'md' | 'sm' | 'xs';

export const buttonBaseStyle = `
 focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2
 aria-disabled:pointer-events-none forced-colors:aria-disabled:border-[GrayText] forced-colors:aria-disabled:text-[GrayText]
`;

export const buttonVariantStyle: { [key in ButtonVariant]: string } = {
  'solid-fill': `
 border-4
 border-double
 border-transparent
 bg-blue-600
 text-white
 hover:bg-blue-700
 
 active:bg-blue-900
 active:underline
 aria-disabled:bg-gray-300
 aria-disabled:text-gray-50
 `,
  outline: `
 border
 border-current
 bg-white
 text-blue-600
 hover:bg-blue-200
 
 
 active:bg-blue-300
 active:text-blue-900
 active:underline
 aria-disabled:bg-white
 aria-disabled:text-gray-300
 `,
  text: `
 text-blue-600

 hover:bg-blue-50
 
 
 active:bg-blue-100
 active:text-blue-900
 focus-visible:bg-gray-100
 aria-disabled:bg-transparent
 aria-disabled:focus-visible:bg-gray-100
 aria-disabled:text-gray-300
 `,
};

export const buttonSizeStyle: { [key in ButtonSize]: string } = {
  lg: 'min-w-[calc(136/16*1rem)] min-h-14 rounded-lg px-4 py-3 text-base font-bold leading-none',
  md: 'min-w-24 min-h-12 rounded-lg px-4 py-2 text-base font-bold leading-none',
  sm: 'relative min-w-20 min-h-9 rounded-md px-3 py-0.5 text-base font-bold leading-none after:absolute after:inset-x-0 after:-inset-y-full after:m-auto after:h-[44px]',
  xs: 'relative min-w-18 min-h-7 rounded px-2 py-0.5 text-sm font-bold leading-none after:absolute after:inset-x-0 after:-inset-y-full after:m-auto after:h-[44px]',
};

export type ButtonProps = {
  className?: string;
  variant?: ButtonVariant;
  size: ButtonSize;
} & (
  | ({ asChild?: false } & ComponentProps<'button'>)
  | { asChild: true; children: React.ReactNode }
);

export const Button = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
  const { asChild, children, className, variant, size, ...rest } = props;

  const classNames = `${buttonBaseStyle} ${buttonSizeStyle[size]} ${
    variant ? buttonVariantStyle[variant] : ''
  } ${className ?? ''}`;

  if (asChild) {
    return (
      <Slot className={classNames} {...rest}>
        {children}
      </Slot>
    );
  }

  const handleDisabled = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
  };

  return (
    <button
      className={classNames}
      onClick={props['aria-disabled'] ? handleDisabled : props.onClick}
      {...rest}
      ref={ref}
    >
      {children}
    </button>
  );
});
