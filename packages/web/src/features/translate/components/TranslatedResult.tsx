import { useRef } from 'react';
import { useLocation } from 'react-router';
import { Markdown } from '@/components/Markdown';
import { ButtonCopy } from '@/components/ui/ButtonCopy';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Button } from '@/components/ui/dads/Button';
import { ProgressIndicator } from '@/components/ui/dads/ProgressIndicator';
import { useTranslateStore } from '@/features/translate/stores/useTranslateStore';
import { useChat } from '@/hooks/useChat';
import { LANGUAGES } from '../constants';

type Props = {
  typingTextOutput: string;
  translatedSentence: string;
};

export const TranslatedResult = (props: Props) => {
  const { typingTextOutput, translatedSentence } = props;

  const { language, setLanguage } = useTranslateStore();

  const { pathname } = useLocation();
  const { loading, continueGeneration, getStopReason } = useChat(pathname);

  const copyTextRef = useRef<HTMLDivElement>(null);

  const showResult = !loading && translatedSentence !== '';
  const stopReason = getStopReason();

  return (
    <div className='flex min-h-0 w-full flex-1 flex-col gap-1 lg:w-1/2'>
      <h3 className='sr-only'>翻訳結果</h3>

      <div className='flex flex-none items-end lg:h-16'>
        <CustomSelect
          label='翻訳する言語：'
          labelClassName='text-sm font-bold leading-tight'
          value={language}
          className='mb-1'
          options={LANGUAGES.map((l) => {
            return { value: l, label: l };
          })}
          onChange={setLanguage}
        />
      </div>

      <div className='flex min-h-0 flex-1 flex-col rounded-lg border border-gray-400 overflow-hidden'>
        <div className='flex-1 overflow-y-auto p-4 flex flex-col'>
          <div className='flex-none' ref={copyTextRef}>
            <Markdown>{typingTextOutput}</Markdown>
          </div>

          {loading && <ProgressIndicator className='my-0.5 flex-none' />}

          <div className='flex-1 min-h-0' />

          {stopReason === 'max_tokens' && (
            <div className='mt-4 flex-none'>
              <Button variant='outline' size='md' onClick={() => continueGeneration()}>
                続きを出力
              </Button>
            </div>
          )}
          {showResult && (
            <div className='mt-4 flex w-full flex-none justify-end gap-1'>
              <ButtonCopy text={translatedSentence} targetRef={copyTextRef} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
