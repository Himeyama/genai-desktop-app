import type { ShownMessage } from 'genai-web';
import { useEffect, useRef, useState } from 'react';
import { PiArrowClockwise, PiChalkboardTeacher } from 'react-icons/pi';
import { useLocation } from 'react-router';
import { Markdown } from '@/components/Markdown';
import { ButtonCopy } from '@/components/ui/ButtonCopy';
import { ButtonIcon } from '@/components/ui/ButtonIcon';
import { FileCard } from '@/features/chat/components/FileCard';
import { ZoomUpImage } from '@/features/chat/components/ZoomUpImage';
import { ZoomUpVideo } from '@/features/chat/components/ZoomUpVideo';
import { useFiles } from '@/hooks/useFiles';
import { useTyping } from '@/hooks/useTyping';

type Props = {
  className?: string;
  idx?: number;
  chatContent?: ShownMessage;
  loading?: boolean;
  hideFeedback?: boolean;
  allowRetry?: boolean;
  retryGeneration?: () => void;
};

export const ChatMessage = (props: Props) => {
  const { chatContent } = props;

  const { pathname } = useLocation();
  const { getFileDownloadSignedUrl } = useFiles(pathname);
  const copyTextRef = useRef<HTMLDivElement>(null);

  const isAssistant = chatContent?.role === 'assistant';
  const isUser = chatContent?.role === 'user';
  const isSystem = chatContent?.role === 'system';

  const { typingTextOutput } = useTyping(isAssistant && props.loading, chatContent?.content ?? '');

  const [signedUrls, setSignedUrls] = useState<string[]>([]);

  useEffect(() => {
    if (chatContent?.extraData) {
      // ローディング表示にするために、画像の数だけ要素を用意して、undefinedを初期値として設定する
      setSignedUrls(new Array(chatContent.extraData.length).fill(undefined));
      Promise.all(
        chatContent.extraData.map(async (file) => {
          if (file.source.type === 's3') {
            return await getFileDownloadSignedUrl(file.source.data, true);
          } else {
            return file.source.data;
          }
        }),
      ).then((results) => setSignedUrls(results));
    } else {
      setSignedUrls([]);
    }
  }, [chatContent]);

  return (
    <article
      className={`flex bg-white px-3 ${isAssistant || isSystem ? 'justify-start' : 'justify-end'}`}
    >
      <div
        className={`${
          props.className ?? ''
        } flex w-full flex-col justify-between p-3`}
      >
        <div className={`flex w-full gap-4 ${isUser ? 'justify-end' : ''}`}>
          {isUser && (
            <h2 className='sr-only'>あなたの質問</h2>
          )}
          {isAssistant && (
            <h2 className='sr-only'>LLMの回答</h2>
          )}
          {isSystem && (
            <div className='h-min rounded-sm bg-light-blue-700 p-2 text-xl text-white'>
              <PiChalkboardTeacher aria-hidden={true} />
            </div>
          )}

          <div className={`mt-1 ${isUser ? 'max-w-[80%] rounded-2xl rounded-br-none bg-blue-100 p-3 text-gray-800' : 'w-full'}`}>
            {chatContent?.trace && (
              <div className='mb-2 rounded-sm border p-2 font-sans'>
                {props.loading && !chatContent?.content && (
                  <div className='mb-2 text-sm font-bold'>
                    <div className='inline-flex gap-1'>
                      <div className='size-5 animate-spin rounded-full border-4 border-blue-500 border-t-transparent'></div>
                    </div>
                  </div>
                )}
                <Markdown className='!font-sans [&_pre]:!font-mono [&_code]:!font-mono' prefix={`${props.idx}-trace`}>
                  {chatContent.trace}
                </Markdown>
              </div>
            )}
            {chatContent?.extraData && (
              <div className='-mt-1 mb-2 flex flex-wrap gap-2 empty:mt-0! empty:mb-0!'>
                {chatContent.extraData.map((data, idx) => {
                  if (data.type === 'image') {
                    return (
                      <ZoomUpImage
                        key={`${chatContent.id}-${data.type}-${idx}`}
                        src={signedUrls[idx]}
                        size='md'
                        loading={!signedUrls[idx]}
                        filename={data.name}
                        alt={`アップロードした画像: ${data.name}`}
                      />
                    );
                  } else if (data.type === 'file') {
                    return (
                      <FileCard
                        key={`${chatContent.id}-${data.type}-${idx}`}
                        filename={data.name}
                        filetype={data.name.split('.').pop() as string}
                        url={signedUrls[idx]}
                        loading={!signedUrls[idx]}
                        size='md'
                      />
                    );
                  } else if (data.type === 'video') {
                    return (
                      <ZoomUpVideo
                        key={`${chatContent.id}-${data.type}-${idx}`}
                        filename={data.name}
                        src={signedUrls[idx]}
                        size='md'
                      />
                    );
                  }
                })}
              </div>
            )}
            {isUser && <div className='whitespace-pre-wrap'>{typingTextOutput}</div>}
            {isAssistant && (
              <div ref={copyTextRef}>
                <Markdown prefix={`${props.idx}`}>
                  {typingTextOutput +
                    `${props.loading && (chatContent?.content ?? '') !== '' ? '▍' : ''}`}
                </Markdown>
              </div>
            )}
            {isSystem && <div className='whitespace-pre-wrap'>{typingTextOutput}</div>}
            {props.loading && (chatContent?.content ?? '') === '' && (
              <div className='animate-pulse'>▍</div>
            )}

            {isAssistant && (
              <div className='mt-2 text-right text-sm leading-tight text-gray-600 lg:mb-0'>
                {chatContent?.llmType}
              </div>
            )}
          </div>
        </div>

        <div className='mt-2 flex items-start justify-end gap-1 print:hidden'>
          {isAssistant && !props.loading && !props.hideFeedback && (
            <>
              {props.allowRetry && (
                <ButtonIcon
                  className='gap-x-1 text-sm leading-none! text-gray-800'
                  onClick={() => props.retryGeneration?.()}
                >
                  <PiArrowClockwise className='text-xl' aria-hidden={true} />
                  再生成
                </ButtonIcon>
              )}
              <ButtonCopy
                className='mr-0.5 text-gray-800'
                text={chatContent?.content || ''}
                targetRef={copyTextRef}
              />
            </>
          )}
        </div>
      </div>
    </article>
  );
};
