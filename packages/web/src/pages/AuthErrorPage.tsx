import { PageTitle } from '@/components/PageTitle';
import { APP_TITLE } from '@/constants';

export const AuthErrorPage = () => {
  const PAGE_TITLE = '認証エラー';

  return (
    <>
      <PageTitle title={`${PAGE_TITLE}${APP_TITLE ? ` | ${APP_TITLE}` : ''}`} />
      <div className='m-8'>
        <main id='mainContents' className='flex flex-col gap-4'>
          <h1 className='mb-8 text-3xl font-bold leading-snug lg:text-6xl font-bold leading-snug'>
            認証エラー
          </h1>

          <p className='text-lg leading-relaxed'>
            認証に失敗しました。しばらく時間をおいて再度お試しいただき、それでも解消しない場合、管理者にお問い合わせください。
          </p>
        </main>
      </div>
    </>
  );
};
