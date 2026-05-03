import { useEffect } from 'react';
import { focus } from '@/utils/focus';
import { PageTitle } from './PageTitle';

export const OfflineScreen = () => {
  useEffect(() => {
    focus('offline-title');
  }, []);

  return (
    <>
      <PageTitle title='インターネットに接続されていません' />
      <div className='m-8'>
        <main id='mainContents' className='flex flex-col gap-4'>
          <h1
            tabIndex={-1}
            id='offline-title'
            className='mb-8 text-3xl font-bold leading-snug focus-visible:rounded focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2 lg:mt-12 lg:text-6xl font-bold leading-snug'
          >
            インターネットに接続されていません
          </h1>

          <p className='text-lg leading-relaxed'>
            Wi-Fiまたはモバイルデータ通信が有効になっているかご確認ください。
          </p>
          <p className='text-lg leading-relaxed'>
            接続が回復すると、自動的にページが表示されます。
          </p>
        </main>
      </div>
    </>
  );
};
