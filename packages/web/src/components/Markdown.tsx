import React, { ComponentProps, useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { ExtraProps, default as ReactMarkdown } from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import { BundledLanguage, codeToHtml } from 'shiki';
import { Link } from '@/components/ui/dads/Link';
import { MermaidRenderer } from '@/features/exapp/components/MermaidRenderer';
import { ButtonCopy } from './ui/ButtonCopy';
import { ErrorText } from './ui/dads/ErrorText';

type Props = {
  className?: string;
  children: string;
  prefix?: string;
};

const LinkRenderer = (props: ComponentProps<'a'>) => {
  return (
    <Link
      id={props.id}
      href={props.href}
      target={props.href?.startsWith('#') ? '_self' : '_blank'}
      rel='noopener noreferrer'
    >
      {props.children}
    </Link>
  );
};
const ImageRenderer = (props: ComponentProps<'img'>) => {
  return <img id={props.id} src={props.src} alt={props.alt} {...props} />;
};

type CodeBlockProps = {
  children: string;
  lang: BundledLanguage;
};

function CodeBlock(props: CodeBlockProps) {
  const [html, setHtml] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    codeToHtml(props.children, {
      lang: props.lang,
      theme: 'github-dark-high-contrast',
    }).then((result) => {
      if (isMounted) {
        setHtml(result);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [props.children, props.lang]);

  if (!html) {
    return <code>{props.children}</code>;
  }

  // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized by shiki
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

const SupRenderer = ({ children }: ComponentProps<'sup'>) => (
  <sup className='m-0.5 rounded-full bg-gray-200 px-1'>{children}</sup>
);

const CodeRenderer = ({ className, children, node }: ComponentProps<'code'> & ExtraProps) => {
  const match = /language-(\w+)(?::(.+))?/.exec(className || '');
  const language = match?.[1];
  const title = match?.[2] || 'JSON';
  const isCodeBlock = !!language;
  const codeText = String(children).replace(/\n$/, '');

  if (className === 'language-mermaid' && node?.children[0]?.type === 'text') {
    const textNode = node.children[0];
    return <MermaidRenderer code={'value' in textNode ? String(textNode.value) : ''} />;
  }

  if (isCodeBlock) {
    const codeBlockContent = (
      <div className='my-4 overflow-hidden rounded-md bg-[#0a0c10] ring-1 ring-gray-700 font-mono'>
        <div className='flex items-center justify-between bg-gray-800 px-4 py-1.5'>
          <span className='font-mono text-xs text-gray-200'>{language}</span>
          <ButtonCopy className='text-gray-400 hover:!bg-gray-700 hover:text-white' text={codeText} />
        </div>
        <div className='overflow-x-auto p-4 text-sm [&_pre]:!bg-transparent [&_pre]:!m-0'>
          <CodeBlock lang={language as BundledLanguage}>{codeText}</CodeBlock>
        </div>
      </div>
    );

    if (language === 'json') {
      return (
        <details className='my-4 cursor-pointer rounded-md border border-gray-300 bg-gray-50 p-2'>
          <summary className='font-bold text-sm text-gray-700'>{title}</summary>
          <div className='mt-2 cursor-auto'>
            {codeBlockContent}
          </div>
        </details>
      );
    }

    return codeBlockContent;
  }

  return (
    <span className='inline rounded-md border border-gray-800/30 bg-gray-800/10 px-1 py-0.5 !font-mono'>
      {codeText}
    </span>
  );
};

const components: ComponentProps<typeof ReactMarkdown>['components'] = {
  a: LinkRenderer,
  img: ImageRenderer,
  sup: SupRenderer,
  code: CodeRenderer,
  h1: ({ children }) => <h1 className='my-4 text-3xl font-bold font-["Noto_Sans_JP",sans-serif]'>{children}</h1>,
  h2: ({ children }) => <h2 className='my-3 text-2xl font-bold font-["Noto_Sans_JP",sans-serif]'>{children}</h2>,
  h3: ({ children }) => <h3 className='my-2 text-xl font-bold font-["Noto_Sans_JP",sans-serif]'>{children}</h3>,
  h4: ({ children }) => <h4 className='my-2 text-lg font-bold font-["Noto_Sans_JP",sans-serif]'>{children}</h4>,
  h5: ({ children }) => <h5 className='my-1 text-base font-bold font-["Noto_Sans_JP",sans-serif]'>{children}</h5>,
  h6: ({ children }) => <h6 className='my-1 text-sm font-bold font-["Noto_Sans_JP",sans-serif]'>{children}</h6>,
  strong: ({ children }) => <strong className='font-bold font-["Noto_Sans_JP",sans-serif]'>{children}</strong>,
  p: ({ children }) => <p className='my-2'>{children}</p>,
  ul: ({ children }) => <ul className='my-2 ml-6 list-disc'>{children}</ul>,
  ol: ({ children }) => <ol className='my-2 ml-6 list-decimal'>{children}</ol>,
  li: ({ children }) => <li className='my-1'>{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className='my-2 border-l-4 border-gray-300 py-1 pl-4 italic text-gray-700'>
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className='my-4 overflow-x-auto'>
      <table className='min-w-full border-collapse border border-gray-300'>{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className='bg-gray-100'>{children}</thead>,
  th: ({ children }) => <th className='border border-gray-300 px-4 py-2 font-semibold font-["Noto_Sans_JP",sans-serif]'>{children}</th>,
  td: ({ children }) => <td className='border border-gray-300 px-4 py-2'>{children}</td>,
};

export const Markdown = React.memo(({ className, prefix, children }: Props) => {
  return (
    <ErrorBoundary fallback={<ErrorText>コンテンツの表示中にエラーが発生しました。</ErrorText>}>
      <div className={`prose max-w-full font-serif leading-[1.75] ${className ?? ''}`}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkBreaks]}
          remarkRehypeOptions={{ clobberPrefix: prefix }}
          components={components}
        >
          {children}
        </ReactMarkdown>
      </div>
    </ErrorBoundary>
  );
});
