import { PageTitle } from '@/components/PageTitle';
import { APP_TITLE } from '@/constants';
import { useSelectedTeam } from '../hooks/useSelectedTeam';
import { BackButton } from './BackButton';
import { TeamMemberCreateForm } from './TeamMemberCreateForm';

export const TeamMemberCreateContent = () => {
  const { pageTitle, selectedTeamName } = useSelectedTeam();
  const PAGE_TITLE = `メンバーの追加`;

  return (
    <>
      <PageTitle title={`${pageTitle}${APP_TITLE ? ` | ${APP_TITLE}` : ''}`} />
      <div className='mx-6 py-6 lg:mx-10 lg:pb-8'>
        <h1 className='flex justify-start text-xl font-bold leading-relaxed lg:text-2xl font-bold leading-snug'>
          {PAGE_TITLE}
        </h1>

        <div className='mt-2 mb-6'>
          <BackButton teamName={selectedTeamName} />
        </div>

        <TeamMemberCreateForm />
      </div>
    </>
  );
};
