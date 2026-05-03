import type { ComponentProps } from 'react';

export const StatusBadge = (props: ComponentProps<'span'>) => {
  const { className, children, ...rest } = props;

  return (
    <span
      className={`inline-block rounded-lg bg-gray-600 p-2 text-base leading-none text-white outline-1 outline-transparent ${className ?? ''}`}
      {...rest}
    >
      {children}
    </span>
  );
};
