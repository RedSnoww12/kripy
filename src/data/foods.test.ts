import { describe, expect, it } from 'vitest';
import { FOODS } from './foods';
import { getUnitPresets } from './unitPresets';

/**
 * Préfixes des produits d'enseigne. Une base saisie à la main dérive vite :
 * ces tests verrouillent la présence des chaînes et la cohérence de leurs
 * valeurs, pour que « Big Mac » ou « tacos » restent trouvables et justes.
 */
const CHAIN_PREFIXES = [
  'McDo ',
  'BK ',
  'KFC ',
  'Popeyes ',
  'PePe Chicken ',
  'Chicken Spot ',
  'Tasty Crousty ',
  'Subway ',
  'Quick ',
  'Five Guys ',
  'Big Fernand ',
  'Pizza Hut ',
  'Dominos ',
  'Papa Johns ',
  'Bagelstein ',
  'Brioche Doree ',
  'Pret a manger ',
  'Starbucks ',
  'Krispy Kreme ',
  'Dunkin ',
];

const chainEntries = Object.entries(FOODS).filter(([name]) =>
  CHAIN_PREFIXES.some((p) => name.startsWith(p)),
);

describe('FOODS — intégrité de la base', () => {
  it('contient un tuple de 5 nombres finis et positifs pour chaque aliment', () => {
    const invalid = Object.entries(FOODS).filter(([, tuple]) => {
      if (!Array.isArray(tuple) || tuple.length !== 5) return true;
      return tuple.some((v) => !Number.isFinite(v) || v < 0);
    });
    expect(invalid).toEqual([]);
  });

  it('ne contient aucune valeur calorique aberrante', () => {
    // 900 kcal/100 g = huile pure, rien ne peut légitimement dépasser.
    const absurd = Object.entries(FOODS).filter(([, [kcal]]) => kcal > 900);
    expect(absurd).toEqual([]);
  });

  it('ne contient aucun nom vide ou en double après normalisation', () => {
    const names = Object.keys(FOODS);
    expect(names.every((n) => n.trim().length > 0)).toBe(true);
    const normalized = names.map((n) =>
      n
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim(),
    );
    expect(new Set(normalized).size).toBe(normalized.length);
  });
});

describe('FOODS — fast-food', () => {
  it('référence les grandes enseignes', () => {
    for (const prefix of CHAIN_PREFIXES) {
      const found = Object.keys(FOODS).some((n) => n.startsWith(prefix));
      expect(found, `aucun produit pour « ${prefix.trim()} »`).toBe(true);
    }
  });

  it('couvre les incontournables du hors-domicile', () => {
    const musts = [
      'Tacos francais',
      'Kebab durum',
      'Grec frites',
      'Sauce blanche',
      'Sauce algerienne',
      'Sauce samurai',
      'Pizza kebab',
      'KFC Tenders',
      'Subway Poulet teriyaki',
    ];
    for (const name of musts) {
      expect(FOODS[name], `« ${name} » absent de la base`).toBeDefined();
    }
  });

  it('respecte la cohérence Atwater sur tous les produits d’enseigne', () => {
    // kcal ≈ 4·prot + 4·gluc + 9·lip. 15 % de tolérance couvre les arrondis
    // et les fibres ; au-delà, c'est une valeur saisie de travers.
    const off = chainEntries
      .map(([name, [kcal, p, g, l]]) => {
        const atwater = 4 * p + 4 * g + 9 * l;
        const deviation = kcal > 0 ? Math.abs(kcal - atwater) / kcal : 0;
        return { name, kcal, atwater: Math.round(atwater), deviation };
      })
      .filter((x) => x.deviation > 0.15);
    expect(off).toEqual([]);
  });

  it('propose une portion par unité pour chaque produit d’enseigne', () => {
    // Un burger ou une part de pizza ne se pèse pas : sans preset, l'utilisateur
    // devrait deviner des grammes, ce qui ruine la précision du suivi.
    const missing = chainEntries
      .map(([name]) => name)
      .filter((name) => getUnitPresets(name).length === 0);
    expect(missing).toEqual([]);
  });

  it('donne des portions plausibles aux produits d’enseigne', () => {
    const absurd = chainEntries.flatMap(([name]) =>
      getUnitPresets(name)
        .filter((p) => p.grams < 10 || p.grams > 800)
        .map((p) => `${name} → ${p.label} ${p.grams}g`),
    );
    expect(absurd).toEqual([]);
  });
});

describe('unitPresets — fast-food', () => {
  it('logue les burgers à l’unité avec leur poids réel', () => {
    expect(getUnitPresets('McDo McChicken')).toEqual([
      { label: 'burger', grams: 173 },
    ]);
    expect(getUnitPresets('BK Double Whopper')).toEqual([
      { label: 'burger', grams: 350 },
    ]);
  });

  it('propose les tailles de frites plutôt qu’une portion générique', () => {
    const presets = getUnitPresets('McDo Frites');
    expect(presets.map((p) => p.label)).toEqual([
      'petite',
      'moyenne',
      'grande',
    ]);
  });

  it('propose les tailles M / L / XL pour un tacos français', () => {
    const labels = getUnitPresets('Tacos francais').map((p) => p.label);
    expect(labels).toHaveLength(3);
    expect(labels[0]).toContain('M');
  });

  it('sert les sauces de fast-food en dosette, pas en cuillère à café', () => {
    const presets = getUnitPresets('Sauce blanche');
    expect(presets).toContainEqual({ label: 'dosette', grams: 25 });
    expect(presets).toContainEqual({ label: 'portion kebab', grams: 40 });
    // La règle générique des sauces de cuisine reste intacte
    expect(getUnitPresets('Sauce tomate')).toContainEqual({
      label: 'c. à café',
      grams: 5,
    });
  });

  it('propose part et pizza entière pour les pizzas livrées', () => {
    const labels = getUnitPresets('Dominos Cheesy crust').map((p) => p.label);
    expect(labels).toContain('part');
    expect(labels).toContain('pizza');
  });

  it('distingue les tailles de sub chez Subway', () => {
    const labels = getUnitPresets('Subway Italian BMT').map((p) => p.label);
    expect(labels).toEqual(['sub 15cm', 'sub 30cm']);
  });
});
