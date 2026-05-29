import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Wrapper minimal autour de la Web Speech API (reconnaissance vocale).
 * Les types ne font pas partie de la lib TS standard : on les déclare ici.
 */
interface SpeechRecognitionAlternative {
  transcript: string;
}
interface SpeechRecognitionResult {
  readonly length: number;
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}
interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

interface WindowWithSpeech extends Window {
  SpeechRecognition?: SpeechRecognitionCtor;
  webkitSpeechRecognition?: SpeechRecognitionCtor;
}

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as WindowWithSpeech;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export type SpeechErrorKind =
  | 'permission'
  | 'no-speech'
  | 'no-mic'
  | 'network'
  | 'unknown';

function mapError(code: string): SpeechErrorKind {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'permission';
    case 'no-speech':
      return 'no-speech';
    case 'audio-capture':
      return 'no-mic';
    case 'network':
      return 'network';
    default:
      return 'unknown';
  }
}

export function describeSpeechError(kind: SpeechErrorKind): string {
  switch (kind) {
    case 'permission':
      return 'Accès au micro refusé. Autorise le micro dans ton navigateur.';
    case 'no-speech':
      return 'Aucun son détecté. Réessaie en parlant plus près du micro.';
    case 'no-mic':
      return 'Micro introuvable. Vérifie qu’un micro est branché.';
    case 'network':
      return 'Erreur réseau pendant la reconnaissance vocale.';
    case 'unknown':
    default:
      return 'La dictée vocale a échoué. Réessaie.';
  }
}

interface UseSpeechRecognitionOptions {
  /** Langue BCP-47, par défaut français. */
  lang?: string;
  /** Appelé à chaque segment finalisé, avec le texte à concaténer. */
  onTranscript: (chunk: string) => void;
}

interface UseSpeechRecognitionReturn {
  supported: boolean;
  listening: boolean;
  error: SpeechErrorKind | null;
  toggle: () => void;
  stop: () => void;
}

/**
 * Hook de dictée vocale incrémentale (fr-FR par défaut).
 * `onTranscript` reçoit chaque segment finalisé pour concaténation côté appelant.
 */
export function useSpeechRecognition({
  lang = 'fr-FR',
  onTranscript,
}: UseSpeechRecognitionOptions): UseSpeechRecognitionReturn {
  const [supported] = useState(() => getRecognitionCtor() !== null);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<SpeechErrorKind | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const onTranscriptRef = useRef(onTranscript);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    // Une instance déjà active : ne pas en relancer une seconde.
    if (recognitionRef.current) return;

    setError(null);
    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      let chunk = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) chunk += result[0].transcript;
      }
      const trimmed = chunk.trim();
      if (trimmed) onTranscriptRef.current(trimmed);
    };

    recognition.onerror = (event) => {
      setError(mapError(event.error));
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setListening(false);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      recognitionRef.current = null;
      setListening(false);
      setError('unknown');
    }
  }, [lang]);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  return { supported, listening, error, toggle, stop };
}
