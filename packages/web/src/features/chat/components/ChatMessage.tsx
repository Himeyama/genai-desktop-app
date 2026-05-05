import type { ShownMessage } from 'genai-web';
import { useEffect, useRef, useState } from 'react';
import { PiArrowClockwise, PiChalkboardTeacher } from 'react-icons/pi';
import { useLocation } from 'react-router';
import { unescapeUnicode } from '@/utils/unescapeUnicode';
import { Markdown } from '@/components/Markdown';
import { ButtonCopy } from '@/components/ui/ButtonCopy';
import { ButtonIcon } from '@/components/ui/ButtonIcon';
import { FileCard } from '@/features/chat/components/FileCard';
import { ZoomUpImage } from '@/features/chat/components/ZoomUpImage';
import { ZoomUpVideo } from '@/features/chat/components/ZoomUpVideo';
import { useFiles } from '@/hooks/useFiles';
import { useTyping } from '@/hooks/useTyping';

type TraceSectionStatus = 'loading' | 'error' | 'done';

type TraceSection = {
  name: string;
  body: string;
  status: TraceSectionStatus;
};

function parseTraceSections(
  trace: string,
  loading: boolean,
  stopReason?: string,
): TraceSection[] {
  if (!trace.trim()) return [];

  // JSONL 形式の新しいフォーマットか、または従来のフォーマットかを判定しながらパースする
  const sections: TraceSection[] = [];
  const lines = trace.split('\n');
  let currentSection: TraceSection | null = null;
  let isLegacyFormat = false;

  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      // JSONとしてパースを試みる (新フォーマット)
      const ev = JSON.parse(line);
      if (ev.type === 'call') {
        let inputObj = ev.input;
        if (typeof ev.input === 'string') {
          try { inputObj = JSON.parse(ev.input); } catch (e) {}
        }
        currentSection = {
          name: ev.name || 'tool',
          status: 'loading',
          body: '```json:入力\n' + JSON.stringify(inputObj, null, 2) + '\n```\n',
        };
        sections.push(currentSection);
      } else if (ev.type === 'result') {
        if (currentSection) {
          let outputObj = ev.output;
          if (typeof ev.output === 'string') {
            try { outputObj = JSON.parse(ev.output); } catch (e) {}
          }
          currentSection.body += '```json:出力\n' + JSON.stringify(outputObj, null, 2) + '\n```\n';
          currentSection.status = 'done';
        }
      } else if (ev.type === 'error') {
        if (currentSection) {
          currentSection.body += '\n**エラー発生**: ' + String(ev.error) + '\n';
          currentSection.status = 'error';
        }
      }
    } catch (e) {
      // JSONパースに失敗した場合、従来の文字列ベースのフォーマットとみなす
      isLegacyFormat = true;
      break;
    }
  }

  if (isLegacyFormat) {
    // 従来のフォーマットの場合のパース
    // \n<!-- TOOL: ではなく <!-- TOOL: の位置で分割し、複数ツールに対応する
    const parts = trace.split(/(?=<!-- TOOL:)/).filter((s) => s.trim());
    if (parts.length === 0) {
      return [{ name: '', body: trace, status: loading ? 'loading' : stopReason === 'error' ? 'error' : 'done' }];
    }
    return parts.map((part, i) => {
      const isLast = i === parts.length - 1;
      const hasResult = (part.match(/```json/g) ?? []).length >= 2;
      // ツール名にハイフンやアンダースコアなどを含めるため、[^\s>-] ではなく、--> までの任意の文字列にマッチさせる
      const nameMatch = /<!-- TOOL:(.*?) -->/.exec(part);
      const name = nameMatch?.[1]?.trim() ?? '';
      const body = part.replace(/<!-- TOOL:.*? -->\n?/, '');
      let status: TraceSectionStatus;
      if (isLast && loading && !hasResult) {
        status = 'loading';
      } else if (isLast && stopReason === 'error' && !hasResult) {
        status = 'error';
      } else {
        status = 'done';
      }
      return { name, body, status };
    });
  }

  // 新フォーマットの場合の最終状態調整
  if (sections.length > 0) {
    const lastSection = sections[sections.length - 1];
    const hasResult = lastSection.body.includes('```json:出力');
    if (loading && !hasResult && lastSection.status !== 'error') {
      lastSection.status = 'loading';
    } else if (stopReason === 'error' && !hasResult) {
      lastSection.status = 'error';
    } else if (lastSection.status === 'loading' && !loading) {
      lastSection.status = 'done';
    }
  }

  return sections;
}

type Props = {
  className?: string;
  idx?: number;
  chatContent?: ShownMessage;
  loading?: boolean;
  stopReason?: string;
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

  const { typingTextOutput } = useTyping(
    isAssistant && props.loading,
    unescapeUnicode(chatContent?.content ?? ''),
  );

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
      <div className={`${props.className ?? ''} flex w-full flex-col justify-between p-3`}>
        <div className={`flex w-full gap-4 ${isUser ? 'justify-end' : ''}`}>
          {isUser && <h2 className='sr-only'>あなたの質問</h2>}
          {isAssistant && <h2 className='sr-only'>LLMの回答</h2>}
          {isSystem && (
            <div className='h-min rounded-sm bg-light-blue-700 p-2 text-xl text-white'>
              <PiChalkboardTeacher aria-hidden={true} />
            </div>
          )}

          <div
            className={`mt-1 ${isUser ? 'max-w-[80%] rounded-2xl rounded-br-none bg-blue-100 p-3 text-gray-800' : 'w-full'}`}
          >
            {chatContent?.trace && (
              <div className='mb-2 flex flex-col gap-2 font-sans'>
                {parseTraceSections(chatContent.trace, props.loading ?? false, props.stopReason).map(
                  (section, i) => (
                    <div key={i} className='rounded-sm border p-2'>
                      <div className='flex items-center gap-2'>
                        {section.status === 'loading' ? (
                          <div className='size-3 shrink-0 animate-pulse rounded-full bg-blue-500' />
                        ) : section.status === 'error' ? (
                          <div className='size-3 shrink-0 rounded-full bg-red-500' />
                        ) : (
                          <div className='size-3 shrink-0 rounded-full bg-green-500' />
                        )}
                        <span className='font-bold text-sm'>{section.name}</span>
                      </div>
                      {section.body.trim() && (
                        <div className='ml-5 mt-1 min-w-0 overflow-hidden'>
                          <Markdown
                            className='!font-sans [&_pre]:!font-mono [&_code]:!font-mono'
                            prefix={`${props.idx}-trace-${i}`}
                          >
                            {unescapeUnicode(section.body)}
                          </Markdown>
                        </div>
                      )}
                    </div>
                  ),
                )}
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
                text={unescapeUnicode(chatContent?.content || '')}
                targetRef={copyTextRef}
              />
            </>
          )}
        </div>
      </div>
    </article>
  );
};
