import { PageTitle } from '@/components/PageTitle';
import { APP_TITLE } from '@/constants';
import { LayoutBody } from '@/layout/LayoutBody';
import { BackButton } from './components/BackButton';
import { TeamCreateForm } from './components/TeamCreateForm';

export const TeamCreatePage = () => {
  const PAGE_TITLE = 'チームの作成';

  return (
    <LayoutBody>
      <PageTitle title={`${PAGE_TITLE} | チーム管理${APP_TITLE ? ` | ${APP_TITLE}` : ''}`} />
      <div className='mx-6 max-w-[calc(928/16*1rem)] py-6 lg:mx-10 lg:pb-8'>
        <h1 className='flex justify-start text-xl font-bold leading-relaxed lg:text-2xl font-bold leading-snug'>
          {PAGE_TITLE}
        </h1>

        <div className='mt-2 mb-6'>
          <BackButton />
        </div>

        <TeamCreateForm />
      </div>
    </LayoutBody>
  );
};
