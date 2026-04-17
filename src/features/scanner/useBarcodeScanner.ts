import { useCallback, useEffect, useRef, useState } from 'react';
import type { IScannerControls } from '@zxing/browser';

export type ScannerStatus =
  | 'idle'
  | 'starting'
  | 'unsupported'
  | 'denied'
  | 'running'
  | 'decoded'
  | 'error';

export interface ScannerState {
  status: ScannerStatus;
  message: string;
  lastCode: string | null;
  engine: 'native' | 'zxing' | null;
}

const EAN_FORMATS: BarcodeFormat[] = [
  'ean_13',
  'ean_8',
  'upc_a',
  'upc_e',
  'code_128',
  'code_39',
];

function isBarcodeDetectorAvailable(): boolean {
  return typeof BarcodeDetector !== 'undefined';
}

interface UseScannerOptions {
  enabled: boolean;
  onCodeFound: (code: string) => void;
}

export function useBarcodeScanner({ enabled, onCodeFound }: UseScannerOptions) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const zxingControlsRef = useRef<IScannerControls | null>(null);
  const decodedRef = useRef(false);
  const callbackRef = useRef(onCodeFound);
  const [state, setState] = useState<ScannerState>({
    status: 'idle',
    message: '',
    lastCode: null,
    engine: null,
  });

  useEffect(() => {
    callbackRef.current = onCodeFound;
  }, [onCodeFound]);

  const stop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (zxingControlsRef.current) {
      try {
        zxingControlsRef.current.stop();
      } catch {
        /* noop */
      }
      zxingControlsRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    const v = videoRef.current;
    if (v) {
      v.srcObject = null;
      try {
        v.pause();
      } catch {
        /* noop */
      }
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    decodedRef.current = false;

    const emit = (code: string) => {
      if (decodedRef.current || cancelled) return;
      decodedRef.current = true;
      setState((s) => ({
        ...s,
        status: 'decoded',
        message: `Code ${code}`,
        lastCode: code,
      }));
      callbackRef.current(code);
    };

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setState({
          status: 'unsupported',
          message: 'Caméra indisponible. Saisis le code manuellement.',
          lastCode: null,
          engine: null,
        });
        return;
      }
      if (!window.isSecureContext) {
        setState({
          status: 'unsupported',
          message: 'HTTPS requis pour la caméra. Saisie manuelle.',
          lastCode: null,
          engine: null,
        });
        return;
      }

      setState({
        status: 'starting',
        message: 'Autorisation caméra…',
        lastCode: null,
        engine: null,
      });

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
      } catch (e) {
        const message = (e as Error).message ?? 'erreur';
        const status =
          (e as { name?: string }).name === 'NotAllowedError'
            ? 'denied'
            : 'error';
        setState({
          status,
          message: `Caméra KO: ${message}. Saisis le code.`,
          lastCode: null,
          engine: null,
        });
        return;
      }

      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;

      const v = videoRef.current;
      if (!v) return;
      v.srcObject = stream;
      v.setAttribute('playsinline', '');
      v.setAttribute('webkit-playsinline', '');
      v.muted = true;
      try {
        await v.play();
      } catch {
        /* some browsers require user gesture; ignore */
      }

      let tries = 0;
      while (v.videoWidth === 0 && tries < 40 && !cancelled) {
        await new Promise((r) => setTimeout(r, 50));
        tries++;
      }
      if (cancelled) return;
      if (v.videoWidth === 0) {
        setState({
          status: 'error',
          message: 'Vidéo sans dimensions. Saisis le code.',
          lastCode: null,
          engine: null,
        });
        return;
      }

      if (isBarcodeDetectorAvailable()) {
        await runNative(v, emit, () => cancelled);
      } else {
        await runZxing(v, emit, () => cancelled);
      }
    };

    const runNative = async (
      v: HTMLVideoElement,
      emit: (code: string) => void,
      isCancelled: () => boolean,
    ) => {
      const supported = await BarcodeDetector.getSupportedFormats();
      const formats = EAN_FORMATS.filter((f) =>
        supported.includes(f as BarcodeFormat),
      );
      if (formats.length === 0) {
        await runZxing(v, emit, isCancelled);
        return;
      }

      const detector = new BarcodeDetector({ formats });
      setState({
        status: 'running',
        message: 'Place le code dans le cadre',
        lastCode: null,
        engine: 'native',
      });

      const loop = async () => {
        if (isCancelled() || decodedRef.current) return;
        try {
          const codes = await detector.detect(v);
          if (codes.length > 0) {
            emit(codes[0].rawValue);
            return;
          }
        } catch {
          /* NotFound or transient */
        }
        rafRef.current = requestAnimationFrame(loop);
      };
      loop();
    };

    const runZxing = async (
      v: HTMLVideoElement,
      emit: (code: string) => void,
      isCancelled: () => boolean,
    ) => {
      setState({
        status: 'starting',
        message: 'Chargement du décodeur…',
        lastCode: null,
        engine: 'zxing',
      });

      let controls: IScannerControls;
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/browser');
        const { DecodeHintType, BarcodeFormat: ZXFormat } =
          await import('@zxing/library');
        if (isCancelled()) return;

        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          ZXFormat.EAN_13,
          ZXFormat.EAN_8,
          ZXFormat.UPC_A,
          ZXFormat.UPC_E,
          ZXFormat.CODE_128,
          ZXFormat.CODE_39,
        ]);
        hints.set(DecodeHintType.TRY_HARDER, true);

        const reader = new BrowserMultiFormatReader(hints);
        controls = await reader.decodeFromVideoElement(v, (result) => {
          if (result) emit(result.getText());
        });
      } catch (e) {
        const message = (e as Error).message ?? 'erreur';
        setState({
          status: 'error',
          message: `Décodeur KO: ${message}. Saisis le code.`,
          lastCode: null,
          engine: 'zxing',
        });
        return;
      }

      if (isCancelled()) {
        try {
          controls.stop();
        } catch {
          /* noop */
        }
        return;
      }
      zxingControlsRef.current = controls;

      setState({
        status: 'running',
        message: 'Place le code dans le cadre',
        lastCode: null,
        engine: 'zxing',
      });
    };

    start();

    return () => {
      cancelled = true;
      stop();
    };
  }, [enabled, stop]);

  const setMessage = useCallback((message: string) => {
    setState((s) => ({ ...s, message }));
  }, []);

  return { videoRef, state, stop, setMessage };
}
