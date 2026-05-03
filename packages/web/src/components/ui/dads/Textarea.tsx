import { type ComponentProps, forwardRef } from 'react';

export type TextareaProps = ComponentProps<'textarea'> & {
  isError?: boolean;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>((props, ref) => {
  const { className, isError, readOnly, ...rest } = props;

  return (
    <textarea
      className={`max-w-full rounded-lg border border-gray-600 bg-white p-4 text-base leading-relaxed text-gray-800 read-only:border-dashed focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-hidden aria-disabled:pointer-events-none aria-disabled:border-gray-300 aria-disabled:bg-gray-50 aria-disabled:text-gray-400 read-only:aria-disabled:border-solid aria-[invalid=true]:border-red-600 aria-disabled:forced-colors:border-[GrayText] aria-disabled:forced-colors:text-[GrayText] hover:[&:read-write]:border-gray-500 aria-[invalid=true]:[&:read-write]:hover:border-red-800 ${className ?? ''}`}
      aria-invalid={isError || undefined}
      readOnly={props['aria-disabled'] ? true : readOnly}
      ref={ref}
      {...rest}
    />
  );
});
