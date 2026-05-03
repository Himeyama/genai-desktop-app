import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useLocation } from 'react-router';
import { AutoResizeTextarea } from '@/components/ui/AutoResizeTextarea';
import { Button } from '@/components/ui/dads/Button';
import { ErrorText } from '@/components/ui/dads/ErrorText';
import { Label } from '@/components/ui/dads/Label';
import { RequirementBadge } from '@/components/ui/dads/RequirementBadge';
import { SupportText } from '@/components/ui/dads/SupportText';
import { Textarea } from '@/components/ui/dads/Textarea';
import { useTranslateStore } from '@/features/translate/stores/useTranslateStore';
import { useChat } from '@/hooks/useChat';
import { TranslateFormSchema, translateFormSchema } from '../schema';
import { TranslatedResult } from './TranslatedResult';

type Props = {
  typingTextOutput: string;
  translatedSentence: string;
  getTranslation: (sentence: string, language: string, context: string) => void;
};

export const TranslateForm = (props: Props) => {
  const { typingTextOutput, translatedSentence, getTranslation } = props;

  const { sentence, setSentence, additionalContext, setAdditionalContext, language } =
    useTranslateStore();

  const { pathname } = useLocation();
  const { loading } = useChat(pathname);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TranslateFormSchema>({
    mode: 'onSubmit',
    resolver: zodResolver(translateFormSchema),
    values: {
      sentence,
      additionalContext,
    },
  });

  const onSubmit = handleSubmit((data) => {
    setSentence(data.sentence);
    setAdditionalContext(data.additionalContext ?? '');
    getTranslation(data.sentence, language, data.additionalContext ?? '');
  });

  return (
    <>
      <h2 className='sr-only'>翻訳フォーム</h2>
      <form onSubmit={onSubmit} className='flex min-h-0 flex-1 flex-col'>
        <div className='flex min-h-0 w-full flex-1 flex-col gap-2 lg:flex-row lg:gap-4'>
          <div className='flex min-h-0 w-full flex-1 flex-col lg:w-1/2'>
            <div className='flex min-h-0 flex-1 flex-col'>
              <div className='flex min-h-0 flex-1 flex-col gap-1.5'>
                <div className='flex flex-none flex-col gap-1.5 lg:h-16 lg:justify-end lg:pb-1'>
                  <Label htmlFor='translate-original-input' size='lg'>
                    翻訳したい文章<RequirementBadge>※必須</RequirementBadge>
                  </Label>
                  <SupportText id='translate-original-input-support'>
                    言語は自動検出されます
                  </SupportText>
                </div>
                <div className='flex-1 min-h-0'>
                  <Textarea
                    className='h-full w-full resize-none pb-9 leading-snug!'
                    required
                    id='translate-original-input'
                    aria-describedby={`translate-original-input-support${errors.sentence ? ' translate-original-input-error' : ''}`}
                    {...register('sentence', {
                      onChange: (e) => setSentence(e.target.value),
                    })}
                  />
                </div>
                {errors.sentence && (
                  <ErrorText id='translate-original-input-error'>
                    ＊{errors.sentence.message}
                  </ErrorText>
                )}
              </div>
            </div>
          </div>

          <TranslatedResult
            typingTextOutput={typingTextOutput}
            translatedSentence={translatedSentence}
          />
        </div>

        <div className='mt-4 flex flex-col gap-1.5'>
          <div className='flex flex-col items-start gap-2'>
            <Label htmlFor='translate-additional-context-input' size='lg'>
              追加コンテキスト
              <RequirementBadge isOptional>※任意</RequirementBadge>
            </Label>
          </div>
          <SupportText id='translate-additional-context-input-support'>
            追加で考慮してほしい点を入力することができます（カジュアルさ等）
          </SupportText>
          <AutoResizeTextarea
            id='translate-additional-context-input'
            aria-describedby={`translate-additional-context-input-support${errors.additionalContext ? ' translate-additional-context-input-error' : ''}`}
            {...register('additionalContext')}
          />
          {errors.additionalContext && (
            <ErrorText id='translate-additional-context-input-error'>
              {errors.additionalContext.message}
            </ErrorText>
          )}
        </div>

        <div className='mt-6 mb-2 flex justify-center'>
          <Button
            type='submit'
            variant='solid-fill'
            size='lg'
            className='w-60'
            aria-disabled={loading}
          >
            {loading ? '実行中...' : '実行'}
          </Button>
        </div>
      </form>
    </>
  );
};
