import { describe, expect, it } from 'vitest';
import { getUnitPresets } from './unitPresets';

describe('unitPresets', () => {
  it('returns exact override for known foods', () => {
    expect(getUnitPresets('Banane')).toEqual([{ label: 'banane', grams: 120 }]);
    expect(getUnitPresets('Yaourt nature')).toEqual([
      { label: 'pot', grams: 125 },
    ]);
    expect(getUnitPresets('Oeuf entier')).toEqual([
      { label: 'œuf', grams: 50 },
    ]);
  });

  it('infers meat presets by category', () => {
    const presets = getUnitPresets('Poulet blanc');
    expect(presets).toEqual([
      { label: 'portion', grams: 100 },
      { label: 'portion+', grams: 150 },
      { label: 'plat', grams: 200 },
    ]);
    expect(getUnitPresets('Steak boeuf')).toEqual([
      { label: 'portion', grams: 100 },
      { label: 'portion+', grams: 150 },
      { label: 'plat', grams: 200 },
    ]);
  });

  it('infers fish/seafood presets', () => {
    expect(getUnitPresets('Saumon fume')).toEqual([
      { label: 'portion', grams: 130 },
      { label: 'plat', grams: 200 },
    ]);
  });

  it('infers starch/pasta presets', () => {
    expect(getUnitPresets('Riz blanc')).toEqual([
      { label: 'portion', grams: 150 },
      { label: 'plat', grams: 250 },
    ]);
  });

  it('infers pizza presets', () => {
    const presets = getUnitPresets('Pizza margherita');
    expect(presets).toContainEqual({ label: 'part', grams: 100 });
    expect(presets).toContainEqual({ label: 'pizza', grams: 350 });
  });

  it('infers world dish presets', () => {
    expect(getUnitPresets('Pad thai')).toEqual([
      { label: 'portion', grams: 250 },
      { label: 'plat', grams: 350 },
    ]);
    expect(getUnitPresets('Curry poulet')).toBeDefined();
  });

  it('infers cheese presets', () => {
    const presets = getUnitPresets('Comte');
    expect(presets).toContainEqual({ label: 'portion', grams: 30 });
  });

  it('infers fruit pieces', () => {
    expect(getUnitPresets('Orange')).toEqual([{ label: 'pièce', grams: 130 }]);
  });

  it('infers drink presets', () => {
    const presets = getUnitPresets('Jus orange');
    expect(presets).toContainEqual({ label: 'verre', grams: 200 });
  });

  it('returns empty array when no rule matches', () => {
    expect(getUnitPresets('Aliment inconnu xyz')).toEqual([]);
  });

  it('exact override takes precedence over category rule', () => {
    expect(getUnitPresets('Pomme')).toEqual([{ label: 'pomme', grams: 150 }]);
  });
});
