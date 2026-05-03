import { useLocation } from 'react-router';
import { DiagramRenderer } from '@/features/generate-diagram/components/DiagramRenderer';
import { useDiagram } from '@/features/generate-diagram/hooks/useDiagram';
import { useDiagramStore } from '@/features/generate-diagram/stores/useDiagramStore';
import { DIAGRAM_DATA } from '../constants';
import { Markdown } from './Markdown';

type Props = {
  diagramCode: string;
};

export const DiagramResult = (props: Props) => {
  const { diagramCode } = props;
  const { pathname } = useLocation();
  const { loading, diagramType, isEmpty } = useDiagram(pathname);
  const { diagramGenerationError } = useDiagramStore();

  const correctedDiagramCode = diagramCode
    .replace(/(^|\s)classDef(?!\s)/gm, '$1classDef ')
    .replace(/・/g, '/')
    .replace(/：/g, ':')
    .replace(/subgraph\s+(.*)/gm, (_, title) => `subgraph ${title.replace(/,/g, '')}`);

  return (
    <>
      {correctedDiagramCode.length > 0 && (
        <div className='rounded-md bg-gray-50'>
          <h3 className='p-4 text-lg font-bold leading-relaxed'>
            {DIAGRAM_DATA[diagramType as keyof typeof DIAGRAM_DATA]?.title || 'チャート'}
          </h3>

          {loading && (
            <div className='p-4'>
              <Markdown>{['```mermaid', correctedDiagramCode, '```'].join('\n')}</Markdown>
            </div>
          )}

          {!loading && (
            <div className='p-4'>
              <DiagramRenderer code={correctedDiagramCode} />
            </div>
          )}
        </div>
      )}

      {!loading && isEmpty && (
        <div className='leading-175 text-gray-600'>ダイアグラムがここに表示されます</div>
      )}

      {diagramGenerationError && (
        <div className='bg-red-50 p-4 text-red-700'>{diagramGenerationError.message}</div>
      )}
    </>
  );
};
