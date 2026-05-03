import { ReactNode } from 'react';

type Props = {
  className?: string;
  isActive?: boolean;
  onClick: () => void;
  children: ReactNode;
  label?: string;
};

export const SketchButton = (props: Props) => {
  return (
    <button
      type='button'
      title={props.label}
      className={`flex size-8 cursor-pointer items-center justify-center rounded border focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2 ${
        props.isActive ? 'border-gray-800 bg-gray-200' : 'border-gray-400'
      } ${props.className ?? ''}`}
      onClick={props.onClick}
      aria-pressed={props.isActive}
    >
      {props.children}
    </button>
  );
};
