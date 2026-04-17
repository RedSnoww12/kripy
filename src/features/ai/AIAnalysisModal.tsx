import {
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import Modal from '@/components/ui/Modal';
import { loadJSON, STORAGE_KEYS } from '@/lib/storage';
import {
  analyzeMeal,
  describeAiError,
  type AiError,
  type AiMealResult,
} from './groqClient';
import { compressImage, readFileAsDataUrl } from './imageUtils';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (result: AiMealResult) => void;
}

type Status =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'error'; error: AiError }
  | { kind: 'result'; result: AiMealResult };

export default function AIAnalysisModal({ open, onClose, onConfirm }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [imageB64, setImageB64] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const reset = useCallback(() => {
    setImageB64(null);
    setDescription('');
    setStatus({ kind: 'idle' });
  }, []);

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const raw = await readFileAsDataUrl(file);
      const compressed = await compressImage(raw, 1024, 0.8);
      setImageB64(compressed);
    } catch {
      setStatus({
        kind: 'error',
        error: { reason: 'api', detail: 'Image illisible.' },
      });
    } finally {
      event.target.value = '';
    }
  };

  const handleAnalyze = async (event: FormEvent) => {
    event.preventDefault();
    const apiKey = loadJSON<string>(STORAGE_KEYS.aiKey, '');
    setStatus({ kind: 'loading' });
    const result = await analyzeMeal({
      apiKey,
      description: description.trim(),
      imageB64,
    });
    if ('reason' in result) {
      setStatus({ kind: 'error', error: result });
    } else {
      setStatus({ kind: 'result', result });
    }
  };

  const close = () => {
    reset();
    onClose();
  };

  return (
    <Modal open={open} onClose={close}>
      <h3>✨ Analyse IA</h3>

      {status.kind !== 'result' && (
        <form onSubmit={handleAnalyze}>
          <label
            htmlFor="aiPhoto"
            className="btn btn-o"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              marginBottom: 10,
              cursor: 'pointer',
            }}
          >
            <span className="material-symbols-outlined">photo_camera</span>
            {imageB64 ? 'Changer la photo' : 'Ajouter une photo'}
          </label>
          <input
            ref={fileInputRef}
            id="aiPhoto"
            type="file"
            accept="image/*"
            hidden
            onChange={handleFile}
          />

          {imageB64 && (
            <img
              src={imageB64}
              alt="Aperçu"
              style={{
                width: '100%',
                borderRadius: 'var(--r)',
                marginBottom: 10,
                maxHeight: 220,
                objectFit: 'cover',
              }}
            />
          )}

          <textarea
            className="inp"
            rows={3}
            placeholder="Décris le repas (ex: 250g poulet + riz + salade)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ resize: 'vertical' }}
          />

          {status.kind === 'error' && (
            <div
              style={{
                marginTop: 10,
                padding: '10px 12px',
                borderRadius: 10,
                background: 'var(--redG, rgba(255,107,107,.1))',
                color: 'var(--red)',
                fontSize: '.78rem',
                lineHeight: 1.5,
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 2 }}>
                {describeAiError(status.error).title}
              </div>
              <div style={{ opacity: 0.85 }}>
                {describeAiError(status.error).msg}
              </div>
            </div>
          )}

          <div className="acts" style={{ marginTop: 12 }}>
            <button type="button" className="btn btn-o" onClick={close}>
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-p"
              disabled={status.kind === 'loading'}
            >
              {status.kind === 'loading' ? 'Analyse…' : 'Analyser'}
            </button>
          </div>
        </form>
      )}

      {status.kind === 'result' && (
        <AiResult
          result={status.result}
          onConfirm={() => {
            onConfirm(status.result);
            close();
          }}
          onReset={() => setStatus({ kind: 'idle' })}
        />
      )}
    </Modal>
  );
}

function AiResult({
  result,
  onConfirm,
  onReset,
}: {
  result: AiMealResult;
  onConfirm: () => void;
  onReset: () => void;
}) {
  const { nom, kcal, prot, gluc, lip, fib, details } = result;
  return (
    <div>
      <div
        style={{
          background: 'var(--s1)',
          borderRadius: 20,
          padding: '22px 18px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: '.62rem',
            color: 'var(--t2)',
            textTransform: 'uppercase',
            letterSpacing: 1,
            fontWeight: 800,
            marginBottom: 6,
          }}
        >
          Estimation du repas
        </div>
        <div
          style={{
            fontSize: '.95rem',
            color: 'var(--t1)',
            fontWeight: 700,
            marginBottom: 10,
          }}
        >
          {nom}
        </div>
        <div
          className="mono"
          style={{
            fontSize: '3rem',
            fontWeight: 800,
            color: 'var(--acc)',
            letterSpacing: '-2px',
            lineHeight: 1,
          }}
        >
          ~{Math.round(kcal)}
        </div>
        <div
          style={{
            fontSize: '.7rem',
            color: 'var(--t2)',
            marginTop: 4,
            textTransform: 'uppercase',
          }}
        >
          kcal approx.
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 6,
            marginTop: 16,
          }}
        >
          {[
            { l: 'Prot', v: prot, c: '#6AEFAF' },
            { l: 'Gluc', v: gluc, c: '#4DD0E1' },
            { l: 'Lip', v: lip, c: '#FF6B9D' },
            { l: 'Fib', v: fib, c: '#FFB347' },
          ].map((m) => (
            <div
              key={m.l}
              style={{
                background: 'var(--s2)',
                borderRadius: 12,
                padding: '10px 4px',
              }}
            >
              <div
                style={{
                  fontSize: '.55rem',
                  color: 'var(--t3)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '.18em',
                }}
              >
                {m.l}
              </div>
              <div
                className="mono"
                style={{
                  fontSize: '.9rem',
                  fontWeight: 800,
                  color: m.c,
                  marginTop: 2,
                }}
              >
                {Math.round(m.v)}g
              </div>
            </div>
          ))}
        </div>

        {details && (
          <div
            style={{
              marginTop: 14,
              padding: '12px 14px',
              background: 'var(--s2)',
              borderRadius: 14,
              textAlign: 'left',
              lineHeight: 1.55,
            }}
          >
            <div
              style={{
                fontSize: '.6rem',
                color: 'var(--t2)',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '.6px',
                marginBottom: 5,
              }}
            >
              💡 Explication
            </div>
            <div
              style={{
                fontSize: '.72rem',
                color: 'var(--t2)',
              }}
            >
              {details}
            </div>
          </div>
        )}
      </div>

      <div className="acts" style={{ marginTop: 12 }}>
        <button type="button" className="btn btn-o" onClick={onReset}>
          Refaire
        </button>
        <button type="button" className="btn btn-p" onClick={onConfirm}>
          Ajouter au journal
        </button>
      </div>
    </div>
  );
}
