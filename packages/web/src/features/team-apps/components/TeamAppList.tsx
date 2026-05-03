import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { ExApp } from 'genai-web';
import { PiClipboard, PiDownloadSimple, PiPencilLine, PiTrash } from 'react-icons/pi';
import { Link } from 'react-router';
import {
  linkActiveStyle,
  linkDefaultStyle,
  linkFocusStyle,
  linkHoverStyle,
} from '@/components/ui/dads/Link';
import { MoreVertIcon } from '@/components/ui/icons/MoreVertIcon';
import { LoadingButton } from '@/components/ui/LoadingButton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';
import { useFocusNewItemOnLoadMore } from '@/hooks/useFocusNewItemOnLoadMore';
import { download } from '@/utils/createDownloadLink';
import { formatDateTime } from '@/utils/formatDateTime';
import { useFetchLoginUser } from '../hooks/useFetchLoginUser';
import { useFetchTeamAppForJsonDownload } from '../hooks/useFetchTeamAppForJsonDownload';
import { useTeamApps } from '../hooks/useTeamApps';
import { ExAppStatusChipLabel } from './ExAppStatusChipLabel';

type Props = {
  handleOpenDeleteModal: (app: ExApp) => void;
};

export const TeamAppList = (props: Props) => {
  const { handleOpenDeleteModal } = props;

  const { isSystemAdminGroup, loginUser } = useFetchLoginUser();
  const { fetchTeamAppForJsonDownload } = useFetchTeamAppForJsonDownload();

  const { apps, hasMore, isValidating, loadMore } = useTeamApps();

  const { listRef, loadMoreWithFocus } = useFocusNewItemOnLoadMore<HTMLUListElement>({
    itemsLength: apps.length,
    focusSelector: 'a',
  });

  if (!isValidating && (!apps || apps.length === 0)) {
    return <p className='mt-6'>AIアプリが登録されていません</p>;
  }

  return (
    <>
      <h2
        tabIndex={-1}
        id='exapp-list-heading'
        className={`my-4 inline-flex text-lg font-bold leading-relaxed focus-visible:rounded focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2 lg:text-xl font-bold leading-snug`}
      >
        AIアプリ
      </h2>
      <ul ref={listRef} className='flex w-full flex-col'>
        {apps.map((app) => {
          const lastUpdated = app.updatedDate || app.createdDate;
          return (
            <li
              className='relative grid w-full grid-cols-[1fr_auto] items-center border-b border-solid border-gray-400'
              key={app.exAppId}
            >
              <div className='flex flex-col items-start gap-4 px-4 py-4 text-base leading-tight'>
                <Link
                  to={`/apps/${app.teamId}/${app.exAppId}`}
                  className={`${linkDefaultStyle} ${linkHoverStyle} ${linkFocusStyle} ${linkActiveStyle}`}
                >
                  {app.exAppName}
                </Link>
                <ul className='flex items-baseline gap-2'>
                  {app.status && (
                    <li>
                      <ExAppStatusChipLabel status={app.status} />
                    </li>
                  )}
                  <li>
                    <time
                      className='text-sm leading-tight'
                      dateTime={new Date(Number(lastUpdated)).toISOString()}
                    >
                      最終更新日時：
                      <span>{formatDateTime(lastUpdated)}</span>
                    </time>
                  </li>
                </ul>
              </div>

              <div className='relative flex flex-none px-2'>
                <Menu>
                  <Tooltip placement='left'>
                    <TooltipTrigger asChild>
                      <MenuButton
                        className={`flex size-9 items-center justify-center rounded after:absolute after:-inset-full after:m-auto after:h-11 after:w-11 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:-outline-offset-2`}
                      >
                        <MoreVertIcon aria-label='AIアプリの操作' role='img' className='mt-0.5' />
                      </MenuButton>
                    </TooltipTrigger>
                    <TooltipContent aria-hidden={true}>AIアプリの操作</TooltipContent>
                  </Tooltip>

                  <MenuItems
                    modal={false}
                    className={`absolute top-full right-0 z-10 w-auto min-w-fit rounded-lg border border-gray-400 bg-white py-2 shadow-md focus:outline-hidden`}
                  >
                    <MenuItem>
                      {({ focus }) => (
                        <Link
                          to={`/teams/${app.teamId}/apps/${app.exAppId}/edit`}
                          className={`relative flex w-full items-center gap-x-2 bg-white py-3 pr-6 pl-3 text-base leading-none text-nowrap text-gray-800 hover:bg-gray-50 ${focus ? 'bg-gray-100' : ''}`}
                        >
                          <PiPencilLine aria-hidden={true} className='text-lg' />
                          編集
                        </Link>
                      )}
                    </MenuItem>
                    {app.copyable && (isSystemAdminGroup || loginUser?.isAdmin) && (
                      <MenuItem>
                        {({ focus }) => (
                          <Link
                            to={`/teams/${app.teamId}/apps/${app.exAppId}/copy`}
                            className={`relative flex w-full items-center gap-x-2 bg-white py-3 pr-6 pl-3 text-base leading-none text-nowrap text-gray-800 hover:bg-gray-50 ${focus ? 'bg-gray-100' : ''}`}
                          >
                            <PiClipboard aria-hidden={true} className='text-lg' />
                            AIアプリをコピー
                          </Link>
                        )}
                      </MenuItem>
                    )}
                    <MenuItem>
                      {({ focus }) => (
                        <button
                          type='button'
                          onClick={async () => {
                            const res = await fetchTeamAppForJsonDownload(app.teamId, app.exAppId);
                            const blob = new Blob([JSON.stringify(res, null, 2)], {
                              type: 'application/json',
                            });
                            const url = URL.createObjectURL(blob);
                            download(url, `${app.exAppId}.json`);
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
                          onClick={() => handleOpenDeleteModal(app)}
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
          );
        })}
      </ul>

      {hasMore && (
        <LoadingButton
          loading={isValidating}
          onClick={() => loadMoreWithFocus(loadMore)}
          className='mt-6'
          variant='outline'
          size='md'
          type='button'
        >
          {isValidating ? '読み込み中' : 'さらにAIアプリを読み込む'}
        </LoadingButton>
      )}
    </>
  );
};
