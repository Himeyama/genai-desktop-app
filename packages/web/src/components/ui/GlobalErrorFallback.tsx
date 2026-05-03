import { FallbackProps } from 'react-error-boundary';
import { PageTitle } from '../PageTitle';
import { Button } from './dads/Button';

export const GlobalErrorFallback = ({ resetErrorBoundary }: FallbackProps) => {
  return (
    <>
      <PageTitle title='予期しないエラーが発生しました' />
      <div className='m-8'>
        <main id='mainContents' className='flex flex-col gap-4'>
          <h1
            tabIndex={-1}
            id='offline-title'
            className='mb-8 text-3xl font-bold leading-snug focus-visible:rounded focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2 lg:mt-12 lg:text-6xl font-bold leading-snug'
          >
            予期しないエラーが発生しました
          </h1>

          <p className='text-lg leading-relaxed'>しばらく時間をおいてから再度お試しください。</p>

          <Button
            className='w-full max-w-3xs'
            variant='solid-fill'
            size='md'
            onClick={resetErrorBoundary}
          >
            ページを再読み込み
          </Button>
        </main>
      </div>
    </>
  );
};
