import {
  describeSpeechError,
  useSpeechRecognition,
} from './useSpeechRecognition';

interface Props {
  /** Reçoit chaque segment finalisé à concaténer à la description. */
  onTranscript: (chunk: string) => void;
  /** Libellé accessible (varie selon le contexte : repas / recette). */
  label?: string;
}

/**
 * Bouton micro pour la dictée vocale dans les modals IA.
 * Masqué automatiquement si le navigateur ne supporte pas la Web Speech API.
 */
export default function MicButton({
  onTranscript,
  label = 'Dicter la description',
}: Props) {
  const { supported, listening, error, toggle } = useSpeechRecognition({
    onTranscript,
  });

  if (!supported) return null;

  return (
    <div style={{ marginTop: 8 }}>
      <button
        type="button"
        className={`btn btn-o ai-mic${listening ? ' ai-mic-on' : ''}`}
        onClick={toggle}
        aria-pressed={listening}
        aria-label={label}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          width: '100%',
        }}
      >
        <span className="material-symbols-outlined">
          {listening ? 'mic' : 'mic_none'}
        </span>
        {listening ? 'Écoute… (toucher pour arrêter)' : 'Dicter à la voix'}
      </button>
      {error && (
        <div
          style={{
            marginTop: 6,
            fontSize: '.72rem',
            color: 'var(--red)',
            lineHeight: 1.4,
          }}
        >
          {describeSpeechError(error)}
        </div>
      )}
    </div>
  );
}
