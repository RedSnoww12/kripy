import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Modal from '@/components/ui/Modal';
import { useBarcodeScanner } from './useBarcodeScanner';
import { lookupBarcode } from './openFoodFacts';
import { getAllFoods } from '@/features/nutrition/foodSearch';
import { useNutritionStore } from '@/store/useNutritionStore';
import { toast } from '@/components/ui/toastStore';
import type { BarcodeEntry, FoodTuple } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onProductResolved: (name: string, tuple: FoodTuple) => void;
}

interface ResolvedProduct {
  code: string;
  name: string;
  tuple: FoodTuple;
}

function vibrate(ms: number) {
  if (navigator.vibrate) {
    try {
      navigator.vibrate(ms);
    } catch {
      /* noop */
    }
  }
}

function toTuple(entry: BarcodeEntry): FoodTuple {
  return [entry.kcal, entry.p, entry.g, entry.l, entry.f ?? 0];
}

export default function ScannerModal({
  open,
  onClose,
  onProductResolved,
}: Props) {
  const barcodes = useNutritionStore((s) => s.barcodes);
  const recipes = useNutritionStore((s) => s.recipes);
  const setBarcodes = useNutritionStore((s) => s.setBarcodes);
  const setRecipes = useNutritionStore((s) => s.setRecipes);

  const [manualCode, setManualCode] = useState('');
  const [manualError, setManualError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [resolved, setResolved] = useState<ResolvedProduct | null>(null);
  const [saveAsRecipe, setSaveAsRecipe] = useState(false);

  useEffect(() => {
    if (!open) {
      setResolved(null);
      setSaveAsRecipe(false);
      setManualCode('');
      setBusy(false);
    }
  }, [open]);

  const handleCode = useCallback(
    async (code: string) => {
      if (busy || resolved) return;
      vibrate(60);

      const cached = barcodes[code];
      if (cached) {
        setResolved({ code, name: cached.name, tuple: toTuple(cached) });
        return;
      }

      setBusy(true);
      const allFoods = getAllFoods(recipes, barcodes);
      const names = new Set(Object.keys(allFoods));
      const result = await lookupBarcode(code, names);
      setBusy(false);

      if (!result.ok) {
        const msg =
          result.reason === 'not_found'
            ? `Produit introuvable (${code})`
            : result.reason === 'no_nutrition'
              ? 'Produit trouvé mais sans valeurs nutritionnelles'
              : 'Erreur réseau, réessaie';
        toast(msg, 'warn');
        return;
      }

      const entry: BarcodeEntry = { ...result.entry };
      setBarcodes({ ...barcodes, [code]: entry });
      setResolved({ code, name: entry.name, tuple: toTuple(entry) });
    },
    [barcodes, busy, recipes, resolved, setBarcodes],
  );

  const { videoRef, state } = useBarcodeScanner({
    enabled: open && !resolved,
    onCodeFound: handleCode,
  });

  const handleManualSubmit = (event: FormEvent) => {
    event.preventDefault();
    const v = manualCode.trim().replace(/\s/g, '');
    if (!/^\d{6,14}$/.test(v)) {
      setManualError(true);
      setTimeout(() => setManualError(false), 700);
      return;
    }
    setManualCode('');
    handleCode(v);
  };

  const saveRecipe = () => {
    if (!resolved) return;
    if (recipes[resolved.name]) {
      toast(`${resolved.name} déjà en recettes`, 'info');
      return;
    }
    setRecipes({ ...recipes, [resolved.name]: resolved.tuple });
    toast(`${resolved.name} enregistrée en recette`, 'success');
  };

  const handleAddToMeal = () => {
    if (!resolved) return;
    if (saveAsRecipe) saveRecipe();
    onProductResolved(resolved.name, resolved.tuple);
    onClose();
  };

  const handleRecipeOnly = () => {
    if (!resolved) return;
    saveRecipe();
    onClose();
  };

  const messageColor =
    state.status === 'error' ||
    state.status === 'unsupported' ||
    state.status === 'denied'
      ? 'var(--red)'
      : 'var(--t2)';

  if (resolved) {
    const [kcal, p, g, l, f] = resolved.tuple;
    return (
      <Modal open={open} onClose={onClose}>
        <h3>✅ Produit trouvé</h3>
        <div
          style={{
            marginTop: 8,
            padding: 12,
            background: 'var(--b2)',
            borderRadius: 'var(--r)',
            border: '1px solid var(--l1)',
          }}
        >
          <div
            style={{
              fontSize: '.95rem',
              fontWeight: 600,
              color: 'var(--t1)',
            }}
          >
            {resolved.name}
          </div>
          <div
            style={{
              fontSize: '.7rem',
              color: 'var(--t3)',
              marginTop: 2,
            }}
          >
            Code {resolved.code} · par 100 g
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: 8,
              marginTop: 10,
              fontSize: '.72rem',
            }}
          >
            <Macro label="kcal" value={kcal} color="var(--t1)" />
            <Macro label="prot" value={`${p}g`} color="var(--grn)" />
            <Macro label="gluc" value={`${g}g`} color="var(--cyan)" />
            <Macro label="lip" value={`${l}g`} color="var(--pnk)" />
            <Macro label="fib" value={`${f}g`} color="var(--org)" />
          </div>
        </div>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            margin: '14px 0 10px',
            fontSize: '.78rem',
            color: 'var(--t2)',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={saveAsRecipe}
            onChange={(e) => setSaveAsRecipe(e.target.checked)}
          />
          Aussi l'enregistrer en recette
        </label>

        <div style={{ display: 'grid', gap: 8 }}>
          <button
            type="button"
            className="btn btn-p"
            onClick={handleAddToMeal}
            style={{ width: '100%' }}
          >
            <span className="material-symbols-outlined">restaurant</span>
            Ajouter au repas
          </button>
          <button
            type="button"
            className="btn btn-o"
            onClick={handleRecipeOnly}
            style={{ width: '100%' }}
          >
            <span className="material-symbols-outlined">bookmark_add</span>
            Enregistrer en recette seulement
          </button>
          <button
            type="button"
            className="btn btn-o"
            onClick={() => setResolved(null)}
            style={{ width: '100%' }}
          >
            Scanner un autre produit
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose}>
      <h3>📷 Scanner un code-barres</h3>
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '4 / 3',
          background: '#000',
          borderRadius: 'var(--r)',
          overflow: 'hidden',
          marginTop: 8,
        }}
      >
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div
          style={{
            position: 'absolute',
            inset: '15% 10%',
            border: '2px solid var(--acc)',
            borderRadius: 8,
            boxShadow: '0 0 0 9999px rgba(0,0,0,.35)',
            pointerEvents: 'none',
          }}
        />
      </div>
      <div
        style={{
          margin: '10px 0 6px',
          fontSize: '.78rem',
          textAlign: 'center',
          minHeight: '1.2em',
          color: messageColor,
        }}
      >
        {busy ? 'Recherche…' : state.message}
      </div>
      <form
        onSubmit={handleManualSubmit}
        style={{ display: 'flex', gap: 6, marginTop: 4 }}
      >
        <input
          type="text"
          inputMode="numeric"
          className="inp"
          placeholder="Ou saisis le code"
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
          style={{
            flex: 1,
            borderColor: manualError ? 'var(--red)' : undefined,
          }}
        />
        <button type="submit" className="btn btn-p btn-sm">
          OK
        </button>
      </form>
      <button
        type="button"
        className="btn btn-o"
        onClick={onClose}
        style={{ width: '100%', marginTop: 10 }}
      >
        Fermer
      </button>
    </Modal>
  );
}

function Macro({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ color: 'var(--t3)', fontSize: '.6rem' }}>{label}</div>
      <div style={{ color, fontWeight: 600 }}>{value}</div>
    </div>
  );
}
