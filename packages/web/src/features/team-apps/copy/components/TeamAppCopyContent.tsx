import { PageTitle } from '@/components/PageTitle';
import { APP_TITLE } from '@/constants';
import { useFetchTeamApp } from '@/features/team-apps/hooks/useFetchTeamApp';
import { useSelectedTeam } from '../hooks/useSelectedTeam';
import { BackButton } from './BackButton';
import { TeamAppCopyForm } from './TeamAppCopyForm';

export const TeamAppCopyContent = () => {
  const PAGE_TITLE = 'AIアプリのコピー';

  const { app } = useFetchTeamApp({ suspense: true });
  const { pageTitle, selectedTeamName } = useSelectedTeam();

  return (
    <>
      <PageTitle title={`${pageTitle}${APP_TITLE ? ` | ${APP_TITLE}` : ''}`} />
      <div className='mx-6 max-w-[calc(1024/16*1rem)] py-6 lg:mx-10 lg:pb-8'>
        <h1 className='flex justify-start text-xl font-bold leading-relaxed lg:text-2xl font-bold leading-snug'>
          {PAGE_TITLE}
        </h1>

        <div className='mt-2 mb-6'>
          <BackButton teamName={selectedTeamName} />
        </div>

        {app && <TeamAppCopyForm app={app} />}
      </div>
    </>
  );
};
