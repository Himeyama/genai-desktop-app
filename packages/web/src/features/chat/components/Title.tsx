import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { useEffect, useRef, useState } from 'react';
import { PiPencilLine, PiTrash } from 'react-icons/pi';
import { useLocation, useNavigate, useParams } from 'react-router';
import { Button } from '@/components/ui/dads/Button';
import { Input } from '@/components/ui/dads/Input';
import { MoreVertIcon } from '@/components/ui/icons/MoreVertIcon';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';
import { DialogConfirmDeleteChat } from '@/features/chat/components/DialogConfirmDeleteChat';
import { useChat } from '@/hooks/useChat';
import { useChatList } from '@/hooks/useChatList';
import { focus } from '@/utils/focus';

type Props = {
  title: string;
};

export const Title = (props: Props) => {
  const { title } = props;

  const { chatId } = useParams();
  const { pathname } = useLocation();
  const { loadingMessages, isEmpty } = useChat(pathname, chatId);
  const { getChatTitle, updateChatTitle, deleteChat } = useChatList();

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);
  const [isDeleting, setIsDeleting] = useState(false);

  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      editInputRef.current?.focus();
    }
  }, [isEditing]);

  const handleFocusAfterEditing = async () => {
    setIsEditing(false);
    focus(`${chatId}-menu-button`);
  };

  const navigate = useNavigate();
  const onDeleteChat = async (_chatId: string) => {
    setIsDeleting(true);
    try {
      if (_chatId !== '') {
        await deleteChat(_chatId);
        navigate('/chat');
      } else {
        throw new Error('Chat IDが指定されていません');
      }
    } catch {
      console.error('エラーが発生したため会話を削除できませんでした');
    } finally {
      setIsDeleting(false);
      setOpenDeleteDialog(false);
    }
  };

  const handleUpdateTitle = async (title?: string) => {
    if (!chatId) return;
    try {
      await updateChatTitle(chatId, title ?? tempTitle);
      handleFocusAfterEditing();
    } catch {
      handleFocusAfterEditing();
    }
  };

  const handleEditingCancel = () => {
    handleFocusAfterEditing();
  };

  const handleEditingKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleUpdateTitle(e.currentTarget.value);
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      handleEditingCancel();
    }
  };

  return (
    <>
      {!isEditing && (
        <div className='mb-2 flex min-h-[calc(38/16*1rem)] items-start gap-x-2 gap-y-2'>
          <h1 className='flex items-center justify-start text-xl font-bold leading-snug text-pretty lg:h-min lg:text-2xl font-bold leading-snug print:visible print:my-5 print:h-min'>
            {title}
          </h1>
          {!isEmpty && !loadingMessages && chatId && (
            <div className='group relative mt-0.5 ml-1 flex-none'>
              <Menu>
                <Tooltip placement='bottom'>
                  <TooltipTrigger asChild>
                    <MenuButton
                      id={`${chatId}-menu-button`}
                      className={`flex size-9 items-center justify-center rounded after:absolute after:-inset-full after:m-auto after:h-11 after:w-11 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:-outline-offset-2`}
                    >
                      <MoreVertIcon aria-label='チャットの操作' role='img' className='mt-0.5' />
                    </MenuButton>
                  </TooltipTrigger>
                  <TooltipContent aria-hidden={true}>チャットの操作</TooltipContent>
                </Tooltip>

                <MenuItems
                  modal={false}
                  className={`absolute top-full right-0 z-10 w-auto min-w-fit rounded-lg border border-gray-400 bg-white py-2 shadow-md focus:outline-hidden`}
                >
                  <MenuItem>
                    {({ focus }) => (
                      <button
                        type='button'
                        onClick={() => {
                          setTempTitle(title);
                          setIsEditing(true);
                        }}
                        className={`relative flex w-full items-center gap-x-2 bg-white py-3 pr-6 pl-3 text-base leading-none text-nowrap hover:bg-gray-50 ${focus ? 'bg-gray-100' : ''}`}
                      >
                        <PiPencilLine aria-hidden={true} className='text-lg' />
                        チャット名を変更
                      </button>
                    )}
                  </MenuItem>
                  <MenuItem>
                    {({ focus }) => (
                      <button
                        type='button'
                        onClick={() => {
                          setOpenDeleteDialog(true);
                        }}
                        aria-haspopup='dialog'
                        className={`relative flex w-full items-center gap-x-2 bg-white py-3 pr-6 pl-3 text-base leading-none text-nowrap text-red-600 hover:bg-gray-50 ${focus ? 'bg-gray-100' : ''}`}
                      >
                        <PiTrash aria-hidden={true} className='text-lg' />
                        チャットを削除
                      </button>
                    )}
                  </MenuItem>
                </MenuItems>
              </Menu>
            </div>
          )}
        </div>
      )}

      {isEditing && (
        <div className='mb-2.5 grid w-fit max-w-full grid-cols-[1fr] grid-rows-[auto_auto] items-center justify-start py-0 pr-0 pl-1 md:grid-cols-[1fr_auto] md:grid-rows-[auto]'>
          <div className='relative min-w-0 pr-4'>
            <span
              aria-hidden={true}
              className='invisible flex max-w-full items-center justify-start overflow-hidden text-xl font-bold leading-snug text-nowrap lg:text-2xl font-bold leading-snug'
            >
              {tempTitle}
            </span>
            <Input
              ref={editInputRef}
              type='text'
              blockSize='sm'
              className='absolute -inset-x-1 inset-y-0 -mt-1 text-lg leading-relaxed leading-none! md:-inset-x-4'
              value={tempTitle}
              aria-label='チャット名を変更'
              onChange={(e) => {
                setTempTitle(e.target.value);
              }}
              onKeyDown={handleEditingKeyDown}
            />
          </div>
          <div className='mt-4 flex flex-none flex-row-reverse justify-center gap-x-1.5 pr-1 pl-2 md:mt-0 md:justify-start'>
            <Button variant='solid-fill' size='sm' onClick={() => handleUpdateTitle()}>
              確定
            </Button>

            <Button variant='text' size='xs' onClick={handleEditingCancel}>
              キャンセル
            </Button>
          </div>
        </div>
      )}

      {chatId && (
        <DialogConfirmDeleteChat
          isOpen={openDeleteDialog}
          isDeleting={isDeleting}
          chatId={chatId}
          chatTitle={getChatTitle(chatId) ?? ''}
          onDelete={() => {
            onDeleteChat(chatId);
          }}
          onClose={() => setOpenDeleteDialog(false)}
        />
      )}
    </>
  );
};
