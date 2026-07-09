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
import { checkMealPlausibility } from './mealCheck';
import { MEAL_MARGIN_OPTIONS } from './mealMargin';
import { rememberMeal } from './mealMemory';
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

const MAX_PHOTOS = 4;

export default function AIAnalysisModal({ open, onClose, onConfirm }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [margin, setMargin] = useState(0);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const reset = useCallback(() => {
    setImages([]);
    setDescription('');
    setInstructions('');
    setMargin(0);
    setStatus({ kind: 'idle' });
  }, []);

  const handleFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    try {
      const compressed: string[] = [];
      for (const file of files) {
        const raw = await readFileAsDataUrl(file);
        compressed.push(await compressImage(raw, 1024, 0.8));
      }
      setImages((prev) => [...prev, ...compressed].slice(0, MAX_PHOTOS));
    } catch {
      setStatus({
        kind: 'error',
        error: { reason: 'api', detail: 'Image illisible.' },
      });
    } finally {
      event.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = async (event: FormEvent) => {
    event.preventDefault();
    setStatus({ kind: 'loading' });
    const result = await analyzeMeal({
      description: description.trim(),
      imagesB64: images,
      instructions: instructions.trim(),
      marginPct: margin,
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
          {images.length < MAX_PHOTOS && (
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
              {images.length > 0
                ? `Ajouter une autre photo (${images.length}/${MAX_PHOTOS})`
                : 'Ajouter une ou plusieurs photos'}
            </label>
          )}
          <input
            ref={fileInputRef}
            id="aiPhoto"
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={handleFiles}
          />

          {images.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  images.length === 1 ? '1fr' : 'repeat(2, 1fr)',
                gap: 8,
                marginBottom: 10,
              }}
            >
              {images.map((img, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img
                    src={img}
                    alt={`Photo ${i + 1}`}
                    style={{
                      width: '100%',
                      borderRadius: 'var(--r)',
                      maxHeight: images.length === 1 ? 220 : 120,
                      height: images.length === 1 ? undefined : 120,
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    aria-label={`Retirer la photo ${i + 1}`}
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      border: 'none',
                      background: 'rgba(0,0,0,.6)',
                      color: '#fff',
                      fontSize: '.8rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
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

          <input
            className="inp"
            placeholder="Instructions pour l'IA (ex: sauce à part, grosse portion…)"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            aria-label="Instructions pour l'IA"
            style={{ marginTop: 8, fontSize: '.8rem' }}
          />

          <div style={{ marginTop: 10 }}>
            <div
              style={{
                fontSize: '.62rem',
                color: 'var(--t2)',
                textTransform: 'uppercase',
                letterSpacing: '.6px',
                fontWeight: 800,
                marginBottom: 6,
              }}
            >
              🍽️ Au resto ? Marge d'erreur
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                className="chip"
                aria-pressed={margin === 0}
                onClick={() => setMargin(0)}
                style={{
                  cursor: 'pointer',
                  border: 'none',
                  background: margin === 0 ? 'var(--acc)' : 'var(--s2)',
                  color: margin === 0 ? 'var(--s0)' : 'var(--t2)',
                  fontWeight: 700,
                }}
              >
                Aucune
              </button>
              {MEAL_MARGIN_OPTIONS.map((pct) => (
                <button
                  key={pct}
                  type="button"
                  className="chip"
                  aria-pressed={margin === pct}
                  onClick={() => setMargin(pct)}
                  style={{
                    cursor: 'pointer',
                    border: 'none',
                    background: margin === pct ? 'var(--acc)' : 'var(--s2)',
                    color: margin === pct ? 'var(--s0)' : 'var(--t2)',
                    fontWeight: 700,
                  }}
                >
                  +{pct} %
                </button>
              ))}
            </div>
          </div>

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
          description={description.trim()}
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
  description,
  onConfirm,
  onReset,
}: {
  result: AiMealResult;
  description: string;
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

  const current: AiMealResult = {
    nom: nom.trim() || 'Repas',
    kcal: num(kcal),
    prot: num(macros.prot),
    gluc: num(macros.gluc),
    lip: num(macros.lip),
    fib: num(macros.fib),
    details: result.details,
  };
  const warnings = checkMealPlausibility(current);

  const handleConfirm = () => {
    if (description) rememberMeal(description, current);
    onConfirm(current);
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
            color: result.fromMemory ? 'var(--acc)' : 'var(--t2)',
            textTransform: 'uppercase',
            letterSpacing: 1,
            fontWeight: 800,
            marginBottom: 6,
            textAlign: 'center',
          }}
        >
          {result.fromMemory
            ? '🔁 Repas déjà validé — réutilisé'
            : 'Estimation du repas — modifiable'}
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

        {warnings.length > 0 && (
          <div
            style={{
              marginTop: 14,
              padding: '10px 14px',
              background: 'var(--redG, rgba(255,107,107,.1))',
              color: 'var(--red)',
              borderRadius: 14,
              textAlign: 'left',
              lineHeight: 1.5,
              fontSize: '.72rem',
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: 4 }}>
              ⚠️ À vérifier
            </div>
            {warnings.map((w, i) => (
              <div key={i}>{w}</div>
            ))}
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
