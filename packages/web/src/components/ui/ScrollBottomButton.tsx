import { PiArrowLineDown } from 'react-icons/pi';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';
import { useScreen } from '@/hooks/useScreen';

type Props = {
  className?: string;
};

export const ScrollBottomButton = (props: Props) => {
  const { className } = props;
  const { isAtBottom, scrollToBottom } = useScreen();

  // 最下部までスクロールが可能かどうか
  // すでに到達している場合は不可
  const scrollToBottomAvailable = !isAtBottom;

  return (
    <div
      className={`flex w-fit flex-col ${!scrollToBottomAvailable ? 'hidden' : ''} print:hidden ${className ?? ''}`}
    >
      <Tooltip placement='left'>
        <TooltipTrigger asChild>
          <button
            type='button'
            className={`flex h-11 w-11 items-center justify-center rounded-full border border-current bg-white text-2xl text-blue-600 hover:bg-blue-200 focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2 `}
            onClick={scrollToBottom}
          >
            <PiArrowLineDown role='img' aria-label='チャット下部へ戻る' />
          </button>
        </TooltipTrigger>
        <TooltipContent aria-hidden={true}>チャット下部へ戻る</TooltipContent>
      </Tooltip>
    </div>
  );
};
