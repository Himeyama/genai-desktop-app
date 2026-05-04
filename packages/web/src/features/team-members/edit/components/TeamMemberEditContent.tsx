import { useParams } from 'react-router';
import { PageTitle } from '@/components/PageTitle';
import { APP_TITLE } from '@/constants';
import { useFetchTeamMember } from '../../hooks/useFetchTeamMember';
import { useSelectedTeam } from '../hooks/useSelectedTeam';
import { BackButton } from './BackButton';
import { TeamMemberEditForm } from './TeamMemberEditForm';

export const TeamMemberEditContent = () => {
  const { pageTitle, selectedTeamName } = useSelectedTeam();
  const PAGE_TITLE = `メンバーの編集`;

  const { teamId, userId } = useParams();
  const { teamMember } = useFetchTeamMember(teamId ?? '', userId ?? '', { suspense: true });

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

        {teamMember && <TeamMemberEditForm member={teamMember} />}
      </div>
    </>
  );
};
