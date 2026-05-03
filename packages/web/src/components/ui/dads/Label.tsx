import type { ComponentProps } from 'react';

export type LabelSize = 'lg' | 'md' | 'sm';

export type LabelProps = ComponentProps<'label'> & {
  size?: LabelSize;
};

export const Label = (props: LabelProps) => {
  const { children, className, size = 'md', ...rest } = props;

  return (
    <label
      className={`flex w-fit items-center gap-2 text-gray-800 data-[size=lg]:text-lg font-bold leading-relaxed data-[size=md]:text-base font-bold leading-relaxed data-[size=sm]:text-base font-bold leading-relaxed ${className ?? ''}`}
      data-size={size}
      {...rest}
    >
      {children}
    </label>
  );
};
