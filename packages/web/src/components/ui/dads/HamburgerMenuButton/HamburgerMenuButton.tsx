import { type ComponentProps, forwardRef } from 'react';

type HamburgerMenuButtonProps = ComponentProps<'button'>;

export const HamburgerMenuButton = forwardRef<HTMLButtonElement, HamburgerMenuButtonProps>(
  (props, ref) => {
    const { children, className, ...rest } = props;

    return (
      <button
        className={`flex w-fit touch-manipulation items-center rounded text-base leading-none hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2 ${className ?? ''}`}
        ref={ref}
        type='button'
        {...rest}
      >
        {children}
      </button>
    );
  },
);
