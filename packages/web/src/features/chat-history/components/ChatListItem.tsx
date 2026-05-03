import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import type { Chat, UpdateTitleResponse } from 'genai-web';
import { useEffect, useRef, useState } from 'react';
import { PiPencilLine, PiTrash } from 'react-icons/pi';
import { Link } from 'react-router';
import { Button } from '@/components/ui/dads/Button';
import { Input } from '@/components/ui/dads/Input';
import { MoreVertIcon } from '@/components/ui/icons/MoreVertIcon';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';
import { DialogConfirmDeleteChat } from '@/features/chat/components/DialogConfirmDeleteChat';
import { useChatList } from '@/hooks/useChatList';
import { useHighlight } from '@/hooks/useHighlight';
import { decomposeId } from '@/utils/decomposeId';
import { focus } from '@/utils/focus';

type Props = {
  className?: string;
  chat: Chat;
  onUpdateTitle: (chatId: string, title: string) => Promise<UpdateTitleResponse>;
  highlightWords: string[];
};

export const ChatListItem = (props: Props) => {
  const { className, chat, onUpdateTitle, highlightWords } = props;

  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpenDeleteDialog, setIsOpenDeleteDialog] = useState(false);
  const [tempTitle, setTempTitle] = useState('');

  const { getChatTitle, deleteChat } = useChatList();

  const { highlightText } = useHighlight();

  const inputRef = useRef<HTMLInputElement>(null);

  const chatId = decomposeId(chat.chatId) ?? '';

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
    }
  }, [isEditing]);

  const handleFocusAfterEditing = async () => {
    setIsEditing(false);
    focus(`${chatId}-menu-button`);
  };

  const handleUpdateTitle = async (title?: string) => {
    try {
      await onUpdateTitle(chatId, title ?? tempTitle);
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

  const onDeleteChat = async (_chatId: string) => {
    setIsDeleting(true);
    try {
      if (_chatId !== '') {
        await deleteChat(_chatId);
        focus('chat-history-list');
      } else {
        throw new Error('Chat IDが指定されていません');
      }
    } catch {
      console.error('エラーが発生したため会話を削除できませんでした');
    } finally {
      setIsDeleting(false);
      setIsOpenDeleteDialog(false);
    }
  };

  return (
    <>
      <div className={`group flex w-full items-center gap-2 ${className ?? ''}`}>
        {!isEditing ? (
          <>
            <div className='py-3'>
              <Link
                className={`ml-4 flex items-center justify-start rounded py-1 text-base leading-tight text-blue-700 focus-visible:relative focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2`}
                to={`/chat/${chatId}`}
              >
                <div className='flex w-full items-center justify-start'>
                  <div className='relative flex-1'>
                    <div>{highlightText(chat.title, highlightWords)}</div>
                  </div>
                </div>
              </Link>
            </div>
            <div className='relative ml-auto flex flex-none px-2'>
              <Menu>
                <Tooltip placement='left'>
                  <TooltipTrigger asChild>
                    <MenuButton
                      id={`${chatId}-menu-button`}
                      className={`flex size-9 items-center justify-center rounded after:absolute after:-inset-full after:m-auto after:h-11 after:w-11 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:-outline-offset-2`}
                    >
                      <MoreVertIcon aria-label='履歴の操作' role='img' className='mt-0.5' />
                    </MenuButton>
                  </TooltipTrigger>
                  <TooltipContent aria-hidden={true}>履歴の操作</TooltipContent>
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
                          setTempTitle(chat.title);
                          setIsEditing(true);
                        }}
                        className={`relative flex w-full items-center gap-x-2 bg-white py-3 pr-6 pl-3 text-base leading-none text-nowrap hover:bg-gray-50 ${focus ? 'bg-gray-100' : ''}`}
                      >
                        <PiPencilLine aria-hidden={true} className='text-lg' />
                        タイトルを変更
                      </button>
                    )}
                  </MenuItem>
                  <MenuItem>
                    {({ focus }) => (
                      <button
                        type='button'
                        onClick={() => {
                          setIsOpenDeleteDialog(true);
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
          </>
        ) : (
          <>
            <div className='flex w-full items-center justify-start py-1.5 pr-0 pl-1 text-base leading-tight'>
              <div className='flex w-full items-center justify-start'>
                <div className='relative flex-1'>
                  <Input
                    ref={inputRef}
                    type='text'
                    blockSize='sm'
                    className='-ml-1 w-full'
                    value={tempTitle}
                    aria-label='チャット名を変更'
                    onChange={(e) => {
                      setTempTitle(e.target.value);
                    }}
                    onKeyDown={handleEditingKeyDown}
                  />
                </div>
              </div>
            </div>
            <div className='flex flex-none flex-row-reverse justify-start gap-x-1.5 px-2'>
              <Button variant='solid-fill' size='sm' onClick={() => handleUpdateTitle()}>
                確定
              </Button>

              <Button variant='text' size='xs' onClick={handleEditingCancel}>
                キャンセル
              </Button>
            </div>
          </>
        )}
      </div>
      {chatId && (
        <DialogConfirmDeleteChat
          isOpen={isOpenDeleteDialog}
          isDeleting={isDeleting}
          chatId={chatId}
          chatTitle={getChatTitle(chatId) ?? ''}
          onDelete={() => onDeleteChat(chatId)}
          onClose={() => setIsOpenDeleteDialog(false)}
        />
      )}
    </>
  );
};
