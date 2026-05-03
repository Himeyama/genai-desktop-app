import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { PiPencilLine, PiTrash } from 'react-icons/pi';
import { Link, useParams } from 'react-router';
import { MoreVertIcon } from '@/components/ui/icons/MoreVertIcon';
import { LoadingButton } from '@/components/ui/LoadingButton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';
import { useFocusNewItemOnLoadMore } from '@/hooks/useFocusNewItemOnLoadMore';
import { useTeamMembers } from '../hooks/useTeamMembers';

type Props = {
  handleOpenDeleteModal: (userId: string) => void;
};

export const TeamMemberList = (props: Props) => {
  const { handleOpenDeleteModal } = props;

  const { teamId } = useParams();

  const { members, hasMore, isValidating, loadMore } = useTeamMembers();

  const { listRef, loadMoreWithFocus } = useFocusNewItemOnLoadMore<HTMLUListElement>({
    itemsLength: members.length,
    focusSelector: 'span[tabindex="-1"]',
  });

  if (!isValidating && (!members || members.length === 0)) {
    return <div className='mt-4 flex w-full justify-center'>メンバーが登録されていません</div>;
  }

  return (
    <>
      <h2
        tabIndex={-1}
        id='user-list-heading'
        className={`my-4 inline-flex text-lg font-bold leading-relaxed focus-visible:rounded focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2 lg:text-xl font-bold leading-snug`}
      >
        メンバー
      </h2>
      <ul ref={listRef} className='flex w-full flex-col'>
        {members.map((member) => (
          <li
            className='relative grid w-full grid-cols-[1fr_auto] items-center border-b border-gray-400'
            key={member.userId}
          >
            <p className='flex flex-col items-start gap-2.5 px-4 py-3.5 text-base leading-tight sm:flex-row lg:items-center'>
              <span
                tabIndex={-1}
                className='break-all focus-visible:rounded focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2'
              >
                {member.username}
              </span>
              {member.isAdmin && (
                <span className='rounded bg-gray-50 px-2 py-1 text-base leading-none'>
                  チーム管理者
                </span>
              )}
            </p>
            <div className='relative flex flex-none px-2'>
              <Menu>
                <Tooltip placement='left'>
                  <TooltipTrigger asChild>
                    <MenuButton
                      className={`flex size-9 items-center justify-center rounded after:absolute after:-inset-full after:m-auto after:h-11 after:w-11 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:-outline-offset-2`}
                    >
                      <MoreVertIcon aria-label='メンバーの操作' role='img' className='mt-0.5' />
                    </MenuButton>
                  </TooltipTrigger>
                  <TooltipContent aria-hidden={true}>メンバーの操作</TooltipContent>
                </Tooltip>

                <MenuItems
                  modal={false}
                  className={`absolute top-full right-0 z-10 w-auto min-w-fit rounded-lg border border-gray-400 bg-white py-2 shadow-md focus:outline-hidden`}
                >
                  <MenuItem>
                    {({ focus }) => (
                      <Link
                        to={`/teams/${teamId}/members/${member.userId}/edit`}
                        className={`relative flex w-full items-center gap-x-2 bg-white py-3 pr-6 pl-3 text-base leading-none text-nowrap text-gray-800 hover:bg-gray-50 ${focus ? 'bg-gray-100' : ''}`}
                      >
                        <PiPencilLine aria-hidden={true} className='text-lg' />
                        編集
                      </Link>
                    )}
                  </MenuItem>
                  <MenuItem>
                    {({ focus }) => (
                      <button
                        type='button'
                        onClick={() => handleOpenDeleteModal(member.userId)}
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
          {isValidating ? '読み込み中' : 'さらにメンバーを読み込む'}
        </LoadingButton>
      )}
    </>
  );
};
