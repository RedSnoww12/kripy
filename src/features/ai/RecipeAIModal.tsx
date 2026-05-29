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
  analyzeRecipe,
  describeAiError,
  type AiError,
  type AiRecipeResult,
} from './groqClient';
import { compressImage, readFileAsDataUrl } from './imageUtils';
import { useSpeechRecognition } from './useSpeechRecognition';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (result: AiRecipeResult) => void;
}

type Status =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'error'; error: AiError }
  | { kind: 'result'; result: AiRecipeResult };

const EXAMPLE =
  "ex : 500g pâtes crues, 400g sauce tomate, 1 oignon, filet d'huile d'olive, 80g feta";

export default function RecipeAIModal({ open, onClose, onConfirm }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [imageB64, setImageB64] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const speech = useSpeechRecognition({
    onFinalTranscript: (text) => {
      setDescription((prev) => {
        const trimmed = prev.trim();
        return trimmed ? `${trimmed} ${text}` : text;
      });
    },
  });

  const reset = useCallback(() => {
    setImageB64(null);
    setDescription('');
    setStatus({ kind: 'idle' });
    speech.stop();
  }, [speech]);

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
    speech.stop();
    const apiKey = loadJSON<string>(STORAGE_KEYS.aiKey, '');
    setStatus({ kind: 'loading' });
    const result = await analyzeRecipe({
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
      <h3>✨ Analyse IA — Recette</h3>
      <p
        style={{
          fontSize: '.72rem',
          color: 'var(--t2)',
          margin: '4px 0 12px',
          lineHeight: 1.5,
        }}
      >
        Décris tes ingrédients (poids bruts). L'IA calcule les valeurs pour 100g
        de préparation finale.
      </p>

      {status.kind !== 'result' && (
        <form onSubmit={handleAnalyze}>
          <label
            htmlFor="aiRecipePhoto"
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
            {imageB64 ? 'Changer la photo' : 'Photo des ingrédients (option.)'}
          </label>
          <input
            ref={fileInputRef}
            id="aiRecipePhoto"
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

          <div style={{ position: 'relative' }}>
            <textarea
              className="inp"
              rows={4}
              placeholder={EXAMPLE}
              value={
                description +
                (speech.listening && speech.interim ? ` ${speech.interim}` : '')
              }
              onChange={(e) => setDescription(e.target.value)}
              style={{ resize: 'vertical', paddingRight: 44 }}
            />
            {speech.supported && (
              <button
                type="button"
                onClick={speech.listening ? speech.stop : speech.start}
                aria-label={
                  speech.listening
                    ? 'Arrêter la dictée'
                    : 'Démarrer la dictée vocale'
                }
                title={speech.listening ? 'Arrêter la dictée' : 'Dictée vocale'}
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  background: speech.listening ? 'var(--red)' : 'var(--s2)',
                  color: speech.listening ? '#fff' : 'var(--t1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: speech.listening
                    ? 'pulse 1.2s ease-in-out infinite'
                    : 'none',
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 18 }}
                >
                  {speech.listening ? 'stop' : 'mic'}
                </span>
              </button>
            )}
          </div>

          {speech.error && (
            <div
              style={{
                marginTop: 6,
                fontSize: '.72rem',
                color: 'var(--red)',
              }}
            >
              {speech.error}
            </div>
          )}

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
              {status.kind === 'loading' ? 'Analyse…' : 'Calculer'}
            </button>
          </div>
        </form>
      )}

      {status.kind === 'result' && (
        <RecipeAIResult
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

function RecipeAIResult({
  result,
  onConfirm,
  onReset,
}: {
  result: AiRecipeResult;
  onConfirm: () => void;
  onReset: () => void;
}) {
  const { nom, kcal, prot, gluc, lip, fib, poidsTotal, details } = result;
  return (
    <div>
      <div
        style={{
          background: 'var(--s1)',
          borderRadius: 20,
          padding: '20px 18px',
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
          Pour 100g de préparation
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
            fontSize: '2.6rem',
            fontWeight: 800,
            color: 'var(--acc)',
            letterSpacing: '-2px',
            lineHeight: 1,
          }}
        >
          {Math.round(kcal)}
        </div>
        <div
          style={{
            fontSize: '.65rem',
            color: 'var(--t2)',
            marginTop: 4,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          kcal / 100g
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 6,
            marginTop: 14,
          }}
        >
          {[
            { l: 'Prot', v: prot, c: 'var(--grn)' },
            { l: 'Gluc', v: gluc, c: 'var(--cyan)' },
            { l: 'Lip', v: lip, c: 'var(--pnk)' },
            { l: 'Fib', v: fib, c: 'var(--org)' },
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

        {poidsTotal > 0 && (
          <div
            style={{
              marginTop: 12,
              fontSize: '.7rem',
              color: 'var(--t2)',
            }}
          >
            Poids total estimé :{' '}
            <span className="mono" style={{ fontWeight: 700 }}>
              {Math.round(poidsTotal)}g
            </span>{' '}
            de préparation finale
          </div>
        )}

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
              💡 Détail du calcul
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
          Pré-remplir la recette
        </button>
      </div>
    </div>
  );
}
