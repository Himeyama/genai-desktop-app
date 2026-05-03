import { Link } from 'react-router';
import { useHighlight } from '@/hooks/useHighlight';

type Props = {
  href: string;
  label: string;
  description: string;
  onClick: () => void;
  highlightWords?: string[];
};

export const ExAppListCard = (props: Props) => {
  const { href, onClick, label, description, highlightWords = [] } = props;
  const { highlightText } = useHighlight();

  return (
    <Link
      to={href}
      className={`group flex h-full flex-col rounded-lg bg-white border border-gray-400 p-4 text-base hover:bg-blue-50 hover:border-gray-500 focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2 `}
      onClick={onClick}
    >
      <div className='flex h-full w-full flex-col'>
        <h3 className='text-lg font-bold leading-relaxed'>
          {highlightText(label, highlightWords)}
        </h3>
        <p className='mt-2 mb-3 text-base leading-relaxed'>
          {highlightText(description, highlightWords)}
        </p>
      </div>
    </Link>
  );
};
