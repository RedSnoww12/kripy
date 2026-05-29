import { useEffect, useState, type FormEvent } from 'react';
import Modal from '@/components/ui/Modal';
import { loadJSON, STORAGE_KEYS } from '@/lib/storage';
import {
  analyzeRecipe,
  describeAiError,
  type AiError,
  type AiRecipeResult,
} from './groqClient';
import MicButton from './MicButton';

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

const MACRO_FIELDS = [
  { key: 'prot', label: 'Prot', color: 'var(--grn)' },
  { key: 'gluc', label: 'Gluc', color: 'var(--cyan)' },
  { key: 'lip', label: 'Lip', color: 'var(--pnk)' },
  { key: 'fib', label: 'Fib', color: 'var(--org)' },
] as const;

export default function RecipeAIModal({ open, onClose, onConfirm }: Props) {
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const reset = () => {
    setDescription('');
    setStatus({ kind: 'idle' });
  };

  const close = () => {
    reset();
    onClose();
  };

  const handleAnalyze = async (event: FormEvent) => {
    event.preventDefault();
    const apiKey = loadJSON<string>(STORAGE_KEYS.aiKey, '');
    setStatus({ kind: 'loading' });
    const result = await analyzeRecipe({
      apiKey,
      description: description.trim(),
    });
    if ('reason' in result) {
      setStatus({ kind: 'error', error: result });
    } else {
      setStatus({ kind: 'result', result });
    }
  };

  return (
    <Modal open={open} onClose={close}>
      <h3>✨ Analyser une recette</h3>

      {status.kind !== 'result' && (
        <form onSubmit={handleAnalyze}>
          <p
            style={{
              fontSize: '.78rem',
              color: 'var(--t2)',
              lineHeight: 1.5,
              marginBottom: 10,
            }}
          >
            Décris tes ingrédients bruts (crus, avec leurs poids). L'IA calcule
            les valeurs <strong>pour 100g de préparation finale</strong> et
            estime le poids total cuit.
          </p>

          <textarea
            className="inp"
            rows={4}
            placeholder="ex : 500g pâtes crues, 400g sauce tomate, 1 oignon, filet d'huile, 80g feta"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ resize: 'vertical' }}
          />

          <MicButton
            label="Dicter les ingrédients de la recette"
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
        <RecipeAiResult
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

function RecipeAiResult({
  result,
  onConfirm,
  onReset,
}: {
  result: AiRecipeResult;
  onConfirm: (edited: AiRecipeResult) => void;
  onReset: () => void;
}) {
  const [nom, setNom] = useState(result.nom);
  const [poids, setPoids] = useState(String(result.poidsTotal));
  const [kcal, setKcal] = useState(String(Math.round(result.kcal)));
  const [macros, setMacros] = useState({
    prot: String(Math.round(result.prot)),
    gluc: String(Math.round(result.gluc)),
    lip: String(Math.round(result.lip)),
    fib: String(Math.round(result.fib)),
  });

  useEffect(() => {
    setNom(result.nom);
    setPoids(String(result.poidsTotal));
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
      nom: nom.trim() || 'Recette',
      poidsTotal: Math.max(0, Math.round(num(poids))),
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
          padding: '20px 18px',
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
          Valeurs pour 100g — modifiable
        </div>

        <input
          className="inp"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          aria-label="Nom de la recette"
          style={{ textAlign: 'center', fontWeight: 700, marginBottom: 10 }}
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
            aria-label="Calories pour 100g"
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
            kcal / 100g
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
                aria-label={`${m.label} pour 100g`}
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

        <div
          style={{
            marginTop: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <label
            style={{
              fontSize: '.7rem',
              color: 'var(--t2)',
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
          >
            Poids total estimé
          </label>
          <input
            className="inp mono"
            type="number"
            inputMode="numeric"
            value={poids}
            onChange={(e) => setPoids(e.target.value)}
            aria-label="Poids total estimé en grammes"
            style={{ textAlign: 'right', flex: 1 }}
          />
          <span style={{ fontSize: '.7rem', color: 'var(--t2)' }}>g</span>
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
              💡 Détail du calcul
            </div>
            <div style={{ fontSize: '.72rem', color: 'var(--t2)' }}>
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
          Pré-remplir le formulaire
        </button>
      </div>
    </div>
  );
}
