import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react';
import { useRef } from 'react';
import { LuNetwork } from 'react-icons/lu';
import { VscCode } from 'react-icons/vsc';
import { CloseIcon, HamburgerMenuButton } from '@/components/ui/dads/HamburgerMenuButton';
import { DownloadButton } from './DownloadButton';
import { Markdown } from './Markdown';
import { Mermaid } from './Mermaid';

const tabStyles = `
 flex items-center px-2 py-2.5 text-gray-800
 first:rounded-l-4 last:rounded-r-4
 
 data-selected:bg-gray-800 data-selected:font-bold data-selected:text-white data-selected:hover:no-underline
 focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2
`;

interface DiagramRendererProps {
  code: string;
}

export const DiagramRenderer = (props: DiagramRendererProps) => {
  const { code } = props;

  const zoomDialog = useRef<HTMLDialogElement>(null);

  return (
    <>
      <TabGroup>
        <div className='relative flex flex-col'>
          {/* ダイアグラム図の上のヘッダー */}
          <div className='mb-3 flex flex-row justify-between gap-1'>
            <div className='flex gap-1'>
              <DownloadButton type='SVG' code={code} />
              <DownloadButton type='PNG' code={code} />
            </div>
            <TabList className='flex cursor-pointer rounded border bg-white text-base leading-none'>
              <Tab className={tabStyles}>
                <LuNetwork aria-hidden={true} className='mr-1.5 text-base' />
                図を表示
              </Tab>
              <Tab className={tabStyles}>
                <VscCode aria-hidden={true} className='mr-1.5 text-base' />
                コードを表示
              </Tab>
            </TabList>
          </div>

          {/* ダイアグラム図の描画部分 */}
          <TabPanels className='relative'>
            <TabPanel>
              <Mermaid code={code} handler={() => zoomDialog.current?.showModal()} />
            </TabPanel>
            <TabPanel>
              <Markdown>{['```mermaid', code, '```'].join('\n')}</Markdown>
            </TabPanel>
          </TabPanels>
        </div>
      </TabGroup>

      {/* ズーム時 */}
      <dialog
        className='m-auto h-[90%] w-[90%] overflow-visible rounded-lg border border-transparent bg-white px-6 py-4 shadow-lg backdrop:bg-black/30 forced-colors:backdrop:bg-[#000b]'
        ref={zoomDialog}
      >
        <div className='flex h-full w-full flex-col rounded-lg bg-white'>
          <div className='flex justify-end px-4 py-3'>
            <HamburgerMenuButton
              className='p-1'
              onClick={() => {
                zoomDialog.current?.close();
              }}
            >
              <CloseIcon className='flex-none' />
              閉じる
            </HamburgerMenuButton>
          </div>
          <div className='flex-1 overflow-auto px-8 pb-8'>
            <Mermaid isZoom={true} code={code} />
          </div>
        </div>
      </dialog>
    </>
  );
};
