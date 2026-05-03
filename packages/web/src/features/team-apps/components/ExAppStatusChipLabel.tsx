import { ExAppStatus } from 'genai-web';
import { ChipLabel } from '@/components/ui/dads/ChipLabel';

const statusStyle: { [key in ExAppStatus]: string } = {
  draft: 'border-gray-700! bg-gray-50 text-gray-800',
  published: 'border-green-800! bg-green-50 text-green-900',
};

type Props = {
  status: ExAppStatus;
};

export const ExAppStatusChipLabel = (props: Props) => {
  const { status } = props;

  return (
    <ChipLabel className={`text-sm leading-tight ${statusStyle[status]}`}>
      <span className='sr-only'>ステータス：</span>
      {status === 'published' ? '公開中' : '下書き'}
    </ChipLabel>
  );
};
