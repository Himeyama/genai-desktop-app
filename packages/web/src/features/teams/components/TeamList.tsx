import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Team } from 'genai-web';
import { PiDownloadSimple, PiPencilLine, PiTrash } from 'react-icons/pi';
import { Link } from 'react-router';
import { MoreVertIcon } from '@/components/ui/icons/MoreVertIcon';
import { LoadingButton } from '@/components/ui/LoadingButton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';
import { useFocusNewItemOnLoadMore } from '@/hooks/useFocusNewItemOnLoadMore';
import { download } from '@/utils/createDownloadLink';
import { useFetchTeamForJsonDownload } from '../hooks/useFetchTeamForJsonDownload';
import { useTeams } from '../hooks/useTeams';

type Props = {
  handleOpenDeleteModal: (team: Team) => void;
};

export const TeamList = (props: Props) => {
  const { handleOpenDeleteModal } = props;
  const { fetchTeamForJsonDownload } = useFetchTeamForJsonDownload();

  const { teams, hasMore, isValidating, loadMore } = useTeams();

  const { listRef, loadMoreWithFocus } = useFocusNewItemOnLoadMore<HTMLUListElement>({
    itemsLength: teams.length,
    focusSelector: 'a',
  });

  if (!isValidating && teams.length === 0) {
    return <div className='mt-4 flex w-full justify-center'>チームが登録されていません</div>;
  }

  return (
    <>
      <h2
        tabIndex={-1}
        id='team-list-heading'
        className={`mt-8 mb-4 inline-flex text-lg font-bold leading-relaxed focus-visible:rounded focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2 lg:text-xl font-bold leading-snug`}
      >
        チーム一覧
      </h2>
      <ul ref={listRef} className='flex w-full flex-col'>
        {teams.map((team) => (
          <li
            className='relative grid w-full grid-cols-[1fr_auto] items-center border-b border-gray-400'
            key={team.teamId}
          >
            <div className='px-4 py-3'>
              <Link
                className={`rounded bg-white py-1 text-base leading-tight text-blue-700 focus-visible:relative focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2`}
                to={`/teams/${team.teamId}/apps`}
              >
                {team.teamName}
              </Link>
            </div>

            <div className='relative flex flex-none px-2'>
              <Menu>
                <Tooltip placement='left'>
                  <TooltipTrigger asChild>
                    <MenuButton
                      className={`flex size-9 items-center justify-center rounded after:absolute after:-inset-full after:m-auto after:h-11 after:w-11 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:-outline-offset-2`}
                    >
                      <MoreVertIcon aria-label='チームの操作' role='img' className='mt-0.5' />
                    </MenuButton>
                  </TooltipTrigger>
                  <TooltipContent aria-hidden={true}>チームの操作</TooltipContent>
                </Tooltip>

                <MenuItems
                  modal={false}
                  className={`absolute top-full right-0 z-10 w-auto min-w-fit rounded-lg border border-gray-400 bg-white py-2 shadow-md focus:outline-hidden`}
                >
                  <MenuItem>
                    {({ focus }) => (
                      <Link
                        to={`/teams/${team.teamId}/edit`}
                        className={`relative flex w-full items-center gap-x-2 bg-white py-3 pr-6 pl-3 text-base leading-none text-nowrap text-gray-800 hover:bg-gray-50 ${focus ? 'bg-gray-100' : ''}`}
                      >
                        <PiPencilLine aria-hidden={true} className='text-lg' />
                        チーム名を変更
                      </Link>
                    )}
                  </MenuItem>
                  <MenuItem>
                    {({ focus }) => (
                      <button
                        type='button'
                        onClick={async () => {
                          const res = await fetchTeamForJsonDownload(team.teamId);
                          const blob = new Blob([JSON.stringify(res, null, 2)], {
                            type: 'application/json',
                          });
                          const url = URL.createObjectURL(blob);
                          download(url, `${team.teamId}.json`);
                        }}
                        aria-haspopup='dialog'
                        className={`relative flex w-full items-center gap-x-2 bg-white py-3 pr-6 pl-3 text-base leading-none text-nowrap hover:bg-gray-50 ${focus ? 'bg-gray-100' : ''}`}
                      >
                        <PiDownloadSimple aria-hidden={true} className='text-lg' />
                        JSONダウンロード
                      </button>
                    )}
                  </MenuItem>
                  <MenuItem>
                    {({ focus }) => (
                      <button
                        type='button'
                        onClick={() => {
                          handleOpenDeleteModal(team);
                        }}
                        aria-haspopup='dialog'
                        className={`relative flex w-full items-center gap-x-2 bg-white py-3 pr-6 pl-3 text-base leading-none text-nowrap text-red-600 hover:bg-gray-50 ${focus ? 'bg-gray-100' : ''}`}
                      >
                        <PiTrash aria-hidden={true} className='text-lg' />
                        削除
                      </button>
                    )}
                  </MenuItem>
                </MenuItems>
              </Menu>
            </div>
          </li>
        ))}
      </ul>

      {hasMore && (
        <LoadingButton
          loading={isValidating}
          onClick={() => loadMoreWithFocus(loadMore)}
          className='mt-5'
          variant='outline'
          size='md'
          type='button'
        >
          {isValidating ? '読み込み中' : 'さらにチームを読み込む'}
        </LoadingButton>
      )}
    </>
  );
};
