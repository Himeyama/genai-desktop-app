import type { ComponentProps } from 'react';

export type RequirementBadgeProps = ComponentProps<'span'> & {
  isOptional?: boolean;
};

export const RequirementBadge = (props: RequirementBadgeProps) => {
  const { children, className, isOptional, ...rest } = props;

  return (
    <span
      className={`inline-block text-base leading-none text-red-800 data-[is-optional]:text-gray-800 ${className ?? ''}`}
      data-is-optional={isOptional || undefined}
      {...rest}
    >
      {children}
    </span>
  );
};
