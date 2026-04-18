import { useEffect, useState } from 'react';
import { MACRO_PRESETS, type MacroPreset } from '@/data/constants';
import {
  percentagesToGrams,
  validatePercentages,
  type MacroPercentages,
} from '@/features/settings/macroDistribution';
import { MACRO_COLORS } from '@/features/analysis/charts/chartDefaults';
import { useSettingsStore } from '@/store/useSettingsStore';
import { toast } from '@/components/ui/toastStore';
import NumInput from '@/components/ui/NumInput';
import type { Targets } from '@/types';
import MacroPreviewPanel from './MacroPreviewPanel';
import SettingsSection from './SettingsSection';

const DEFAULT_PCT: MacroPercentages = { p: 30, g: 40, l: 30 };

export default function TargetsCard() {
  const storeTargets = useSettingsStore((s) => s.targets);
  const setStoreTargets = useSettingsStore((s) => s.setTargets);

  const [draft, setDraft] = useState<Targets>(storeTargets);
  const [pct, setPct] = useState<MacroPercentages>(DEFAULT_PCT);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  useEffect(() => {
    setDraft(storeTargets);
  }, [storeTargets]);

  const patch = (p: Partial<Targets>) => setDraft((d) => ({ ...d, ...p }));

  const applyPreset = (name: string, preset: MacroPreset) => {
    const grams = percentagesToGrams(draft.kcal, preset);
    setPct({ p: preset.p, g: preset.g, l: preset.l });
    setSelectedPreset(name);
    patch({ prot: grams.prot, gluc: grams.gluc, lip: grams.lip });
  };

  const applyPercentages = () => {
    const grams = percentagesToGrams(draft.kcal, pct);
    setSelectedPreset('Custom');
    patch({ prot: grams.prot, gluc: grams.gluc, lip: grams.lip });
  };

  const pctValidation = validatePercentages(pct);

  const handleSave = () => {
    setStoreTargets(draft);
    toast('Cibles enregistrées', 'success');
  };

  return (
    <SettingsSection icon="flag" title="Objectifs nutritifs">
      <div className="set-f">
        <label htmlFor="sK">Calories cibles</label>
        <div className="set-kcal-wrap">
          <NumInput
            id="sK"
            className="set-kcal-in"
            value={draft.kcal}
            onCommit={(v) => patch({ kcal: v })}
          />
          <span className="set-kcal-u">KCAL</span>
        </div>
      </div>

      <div className="set-f">
        <label>Presets macros</label>
        <div className="set-presets">
          {Object.entries(MACRO_PRESETS).map(([name, preset]) => (
            <button
              key={name}
              type="button"
              className={`set-preset-btn${selectedPreset === name ? ' sel' : ''}`}
              onClick={() => applyPreset(name, preset)}
            >
              {name.toUpperCase()}
            </button>
          ))}
          <button
            type="button"
            className={`set-preset-btn${selectedPreset === 'Custom' ? ' sel' : ''}`}
            onClick={() => setSelectedPreset('Custom')}
          >
            CUSTOM
          </button>
        </div>
      </div>

      <div className="set-f">
        <label>Répartition manuelle (%)</label>
        <div className="set-pct-row">
          <NumInput
            className="set-in set-in-num set-pct-in"
            value={pct.p}
            onCommit={(v) => setPct((p) => ({ ...p, p: v }))}
            allowZero
          />
          <NumInput
            className="set-in set-in-num set-pct-in"
            value={pct.g}
            onCommit={(v) => setPct((p) => ({ ...p, g: v }))}
            allowZero
          />
          <NumInput
            className="set-in set-in-num set-pct-in"
            value={pct.l}
            onCommit={(v) => setPct((p) => ({ ...p, l: v }))}
            allowZero
          />
          <button
            type="button"
            className="set-pct-apply"
            onClick={applyPercentages}
          >
            OK
          </button>
        </div>
        <div className="set-pct-labels">
          <span>% P</span>
          <span>% G</span>
          <span>% L</span>
          <span />
        </div>
        <div className="set-pct-warn">
          <span
            className={`set-pct-warn-msg ${pctValidation.status === 'ok' ? 'ok' : 'warn'}`}
          >
            {pctValidation.status === 'ok'
              ? 'Total : 100% ✓'
              : `Total : ${pctValidation.total}% ${pctValidation.status === 'over' ? '(dépasse 100%)' : '(sous 100%)'}`}
          </span>
        </div>
      </div>

      <div className="set-f">
        <label>Macros cibles (g)</label>
        <div className="set-grid-4">
          <MacroInput
            label="Prot"
            color={MACRO_COLORS.p}
            value={draft.prot}
            onChange={(v) => patch({ prot: v })}
          />
          <MacroInput
            label="Gluc"
            color={MACRO_COLORS.g}
            value={draft.gluc}
            onChange={(v) => patch({ gluc: v })}
          />
          <MacroInput
            label="Lip"
            color={MACRO_COLORS.l}
            value={draft.lip}
            onChange={(v) => patch({ lip: v })}
          />
          <MacroInput
            label="Fib"
            color={MACRO_COLORS.f}
            value={draft.fib}
            onChange={(v) => patch({ fib: v })}
          />
        </div>
      </div>

      <MacroPreviewPanel targets={draft} />

      <button
        type="button"
        className="set-cta"
        style={{ width: '100%', marginTop: 12 }}
        onClick={handleSave}
      >
        Enregistrer les cibles
      </button>
    </SettingsSection>
  );
}

interface MacroInputProps {
  label: string;
  color: string;
  value: number;
  onChange: (value: number) => void;
}

function MacroInput({ label, color, value, onChange }: MacroInputProps) {
  return (
    <div className="set-macro-f">
      <div
        className="set-macro-bar"
        style={{ ['--bar-color' as string]: color }}
      >
        <span />
      </div>
      <NumInput
        className="set-macro-in"
        value={value}
        onCommit={onChange}
        allowZero
      />
      <p className="set-macro-l">{label}</p>
    </div>
  );
}
