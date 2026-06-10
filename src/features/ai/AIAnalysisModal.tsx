import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import Modal from '@/components/ui/Modal';
import { analyzeMeal } from './client';
import { describeAiError, type AiError, type AiMealResult } from './types';
import { compressImage, readFileAsDataUrl } from './imageUtils';
import MicButton from './MicButton';

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
    setStatus({ kind: 'loading' });
    const result = await analyzeMeal({
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

          <MicButton
            label="Dicter la description du repas"
            onTranscript={(chunk) =>
              setDescription((prev) => (prev ? `${prev} ${chunk}` : chunk))
            }
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
          onConfirm={(edited) => {
            onConfirm(edited);
            close();
          }}
          onReset={() => setStatus({ kind: 'idle' })}
        />
      )}
    </Modal>
  );
}

const MACRO_FIELDS = [
  { key: 'prot', label: 'Prot', color: 'var(--grn)' },
  { key: 'gluc', label: 'Gluc', color: 'var(--cyan)' },
  { key: 'lip', label: 'Lip', color: 'var(--pnk)' },
  { key: 'fib', label: 'Fib', color: 'var(--org)' },
] as const;

function AiResult({
  result,
  onConfirm,
  onReset,
}: {
  result: AiMealResult;
  onConfirm: (edited: AiMealResult) => void;
  onReset: () => void;
}) {
  // Le résultat IA est désormais éditable : pas besoin de tout relancer
  // si l'estimation est proche mais légèrement décalée.
  const [nom, setNom] = useState(result.nom);
  const [kcal, setKcal] = useState(String(Math.round(result.kcal)));
  const [macros, setMacros] = useState({
    prot: String(Math.round(result.prot)),
    gluc: String(Math.round(result.gluc)),
    lip: String(Math.round(result.lip)),
    fib: String(Math.round(result.fib)),
  });

  useEffect(() => {
    setNom(result.nom);
    setKcal(String(Math.round(result.kcal)));
    setMacros({
      prot: String(Math.round(result.prot)),
      gluc: String(Math.round(result.gluc)),
      lip: String(Math.round(result.lip)),
      fib: String(Math.round(result.fib)),
    });
  }, [result]);

  const num = (v: string) => {
    const n = parseFloat(v.replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  };

  const handleConfirm = () => {
    onConfirm({
      nom: nom.trim() || 'Repas',
      kcal: num(kcal),
      prot: num(macros.prot),
      gluc: num(macros.gluc),
      lip: num(macros.lip),
      fib: num(macros.fib),
      details: result.details,
    });
  };

  return (
    <div>
      <div
        style={{
          background: 'var(--s1)',
          borderRadius: 20,
          padding: '22px 18px',
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
            textAlign: 'center',
          }}
        >
          Estimation du repas — modifiable
        </div>

        <input
          className="inp"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          aria-label="Nom du repas"
          style={{
            textAlign: 'center',
            fontWeight: 700,
            marginBottom: 10,
          }}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <input
            className="inp mono"
            type="number"
            inputMode="numeric"
            value={kcal}
            onChange={(e) => setKcal(e.target.value)}
            aria-label="Calories"
            style={{
              fontSize: '2.2rem',
              fontWeight: 800,
              color: 'var(--acc)',
              textAlign: 'center',
              width: 140,
              padding: '4px 8px',
            }}
          />
          <span
            style={{
              fontSize: '.7rem',
              color: 'var(--t2)',
              textTransform: 'uppercase',
            }}
          >
            kcal
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 6,
            marginTop: 16,
          }}
        >
          {MACRO_FIELDS.map((m) => (
            <div
              key={m.key}
              style={{
                background: 'var(--s2)',
                borderRadius: 12,
                padding: '10px 4px',
                textAlign: 'center',
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
                {m.label}
              </div>
              <input
                className="inp mono"
                type="number"
                inputMode="decimal"
                value={macros[m.key]}
                onChange={(e) =>
                  setMacros((prev) => ({ ...prev, [m.key]: e.target.value }))
                }
                aria-label={m.label}
                style={{
                  fontSize: '.9rem',
                  fontWeight: 800,
                  color: m.color,
                  textAlign: 'center',
                  padding: '2px 2px',
                  marginTop: 2,
                }}
              />
            </div>
          ))}
        </div>

        {result.details && (
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
              {result.details}
            </div>
          </div>
        )}
      </div>

      <div className="acts" style={{ marginTop: 12 }}>
        <button type="button" className="btn btn-o" onClick={onReset}>
          Refaire
        </button>
        <button type="button" className="btn btn-p" onClick={handleConfirm}>
          Ajouter au journal
        </button>
      </div>
    </div>
  );
}
