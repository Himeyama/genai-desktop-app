import { PiFlask } from 'react-icons/pi';
import { Disclosure, DisclosureSummary } from '@/components/ui/dads/Disclosure';
import { getPrompter } from '@/prompts';
import { ChatPageQueryParams } from '../types';

type Props = {
  modelId: string;
  onClick: (params: ChatPageQueryParams) => void;
};

export const ExamplePromptList = (props: Props) => {
  const { modelId, onClick } = props;

  const prompter = getPrompter(modelId);

  return (
    <>
      {prompter.promptList().map((category, i) => {
        return (
          <Disclosure className='relative my-4' key={`${category.title}-${i}`}>
            <DisclosureSummary>
              {category.title}
              {category.experimental && (
                <PiFlask aria-hidden={true} className='mt-0.5 self-center text-lg' />
              )}
            </DisclosureSummary>
            <ul className='space-y-1 pt-1 pl-7'>
              {category.items.map((item, j) => {
                return (
                  <li key={`${i}-${item.title}-${j}`}>
                    <button
                      className='-ml-1 h-9 w-full cursor-pointer px-1 text-left hover:bg-gray-50 focus-visible:rounded focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2'
                      type='button'
                      onClick={() => {
                        onClick({
                          systemContext: item.systemContext,
                          content: item.prompt,
                        });
                      }}
                    >
                      {item.title}
                    </button>
                  </li>
                );
              })}
            </ul>
          </Disclosure>
        );
      })}
    </>
  );
};
