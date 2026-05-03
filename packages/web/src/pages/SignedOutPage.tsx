import { PageTitle } from '@/components/PageTitle';
import { APP_TITLE } from '@/constants';

export const SignedOutPage = () => {
  const PAGE_TITLE = 'サインアウトが完了しました';

  return (
    <>
      <PageTitle title={`${PAGE_TITLE}${APP_TITLE ? ` | ${APP_TITLE}` : ''}`} />
      <div className='m-8'>
        <main id='mainContents' className='flex flex-col gap-4'>
          <h1 className='mb-8 text-3xl font-bold leading-snug lg:text-6xl font-bold leading-snug'>
            サインアウトが完了しました
          </h1>

          <p className='text-lg leading-relaxed'>ページを閉じてください。</p>
        </main>
      </div>
    </>
  );
};
