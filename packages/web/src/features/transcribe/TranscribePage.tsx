import { PageTitle } from '@/components/PageTitle';
import { APP_TITLE } from '@/constants';
import { TranscribeForm } from '@/features/transcribe/components/TranscribeForm';
import { TranscribeResult } from '@/features/transcribe/components/TranscribeResult';
import { useTranscribe } from '@/features/transcribe/hooks/useTranscribe';
import { useTranscribeStore } from '@/features/transcribe/stores/useTranscribeStore';
import { useFollow } from '@/hooks/useFollow';
import { useLiveStatusMessage } from '@/hooks/useLiveStatusMessage';
import { LayoutBody } from '@/layout/LayoutBody';
import { TranscribeHeader } from './components/TranscribeHeader';

export const TranscribePage = () => {
  const { transcriptData, loading } = useTranscribe();

  const { speakers } = useTranscribeStore();

  const { scrollableContainer, setFollowing } = useFollow();

  const transcripts = transcriptData?.transcripts ?? [];

  const speakerMapping = Object.fromEntries(
    speakers.split(',').map((speaker, idx) => [`spk_${idx}`, speaker.trim()]),
  );

  const formattedOutput = transcripts
    .map((item) =>
      item.speakerLabel
        ? `${speakerMapping[item.speakerLabel] || item.speakerLabel}: ${item.transcript}`
        : item.transcript,
    )
    .join('\n');

  const { liveStatusMessage } = useLiveStatusMessage({
    isAssistant: true,
    loading: loading,
    content: '音声認識が完了しました。音声認識結果をご確認ください。',
  });

  return (
    <LayoutBody>
      <PageTitle title={`音声ファイルから文字起こし${APP_TITLE ? ` | ${APP_TITLE}` : ''}`} />
      <div className='mx-6 py-6 lg:mx-10 lg:pb-8'>
        <TranscribeHeader />
        <TranscribeForm setFollowing={setFollowing} />

        <div className="w-full mt-4 lg:mt-6"><TranscribeResult
          scrollableContainer={scrollableContainer}
          transcripts={transcripts}
          formattedOutput={formattedOutput}
          speakerMapping={speakerMapping}
        />
        </div>
      </div>
      <div aria-live='assertive' aria-atomic='true' className='sr-only'>
        {liveStatusMessage}
      </div>
    </LayoutBody>
  );
};
