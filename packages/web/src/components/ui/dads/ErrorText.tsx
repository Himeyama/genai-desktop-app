import type { ComponentProps } from 'react';

export type ErrorTextProps = ComponentProps<'p'>;

export const ErrorText = (props: ErrorTextProps) => {
  const { children, className, ...rest } = props;

  return (
    <p className={`text-base leading-tight text-red-600 ${className ?? ''}`} {...rest}>
      {children}
    </p>
  );
};
