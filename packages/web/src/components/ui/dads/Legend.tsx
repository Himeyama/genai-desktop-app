import type { ComponentProps } from 'react';

export type LegendSize = 'lg' | 'md' | 'sm';

export type LegendProps = ComponentProps<'legend'> & {
  size?: LegendSize;
};

export const Legend = (props: LegendProps) => {
  const { children, className, size = 'md', ...rest } = props;

  return (
    <legend
      className={`flex w-fit items-center gap-2 text-gray-800 data-[size=lg]:text-lg font-bold leading-relaxed data-[size=md]:text-base font-bold leading-relaxed data-[size=sm]:text-base font-bold leading-relaxed ${className ?? ''}`}
      data-size={size}
      {...rest}
    >
      {children}
    </legend>
  );
};
