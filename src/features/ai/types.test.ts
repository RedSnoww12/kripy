import { describe, expect, it } from 'vitest';
import {
  describeAiError,
  extractJson,
  parseCoachJson,
  parseMealJson,
  parseRecipeJson,
  parseSessionAdjustJson,
} from './types';

describe('extractJson', () => {
  it('extrait un objet JSON entouré de texte', () => {
    expect(extractJson('blabla {"a":1} fin')).toEqual({ a: 1 });
  });

  it('renvoie null sur du JSON invalide', () => {
    expect(extractJson('pas de json ici')).toBeNull();
  });
});

describe('parseMealJson', () => {
  it('parse un repas complet', () => {
    const r = parseMealJson(
      '{"nom":"Poulet riz","kcal":650,"prot":40,"gluc":70,"lip":18,"fib":4,"details":"x"}',
    );
    expect(r).toMatchObject({
      nom: 'Poulet riz',
      kcal: 650,
      prot: 40,
      gluc: 70,
      lip: 18,
      fib: 4,
      details: 'x',
    });
  });

  it('renvoie null quand toutes les valeurs nutritionnelles sont nulles', () => {
    expect(parseMealJson('{"nom":"Vide","kcal":0}')).toBeNull();
  });

  it('utilise un nom par défaut si absent', () => {
    expect(parseMealJson('{"kcal":100}')?.nom).toBe('Repas');
  });
});

describe('parseRecipeJson', () => {
  it('parse une recette et arrondit le poids total', () => {
    const r = parseRecipeJson(
      '{"nom":"Pâtes","poidsTotal":1199.6,"kcal":150,"prot":8,"gluc":20,"lip":5,"fib":2}',
    );
    expect(r?.poidsTotal).toBe(1200);
    expect(r?.nom).toBe('Pâtes');
  });

  it('borne le poids total à 0 minimum', () => {
    expect(parseRecipeJson('{"poidsTotal":-50,"kcal":150}')?.poidsTotal).toBe(
      0,
    );
  });
});

describe('parseCoachJson', () => {
  it('parse une analyse coach complète', () => {
    const r = parseCoachJson(
      '{"analyse":"Bonne progression.","conseils":["Dors plus"],"ajustements":[{"exercice":"Squat","action":"+2,5 kg"}]}',
    );
    expect(r?.analyse).toBe('Bonne progression.');
    expect(r?.conseils).toEqual(['Dors plus']);
    expect(r?.ajustements).toEqual([{ exercice: 'Squat', action: '+2,5 kg' }]);
  });

  it('ignore les ajustements malformés', () => {
    const r = parseCoachJson(
      '{"analyse":"ok","conseils":[],"ajustements":[{"exercice":"Squat"},42,{"exercice":"Dips","action":"+5 kg lest"}]}',
    );
    expect(r?.ajustements).toEqual([
      { exercice: 'Dips', action: '+5 kg lest' },
    ]);
  });

  it('renvoie null quand la réponse est vide', () => {
    expect(parseCoachJson('{"analyse":"","conseils":[]}')).toBeNull();
    expect(parseCoachJson('pas de json')).toBeNull();
  });
});

describe('parseSessionAdjustJson', () => {
  it('parse une analyse de séance complète', () => {
    const r = parseSessionAdjustJson(
      '{"resume":"Bonne séance.","ajustements":[{"exercice":"Dips","sets":4,"repsMin":9,"repsMax":11,"poids":12.5,"note":"RPE bas"}]}',
    );
    expect(r?.resume).toBe('Bonne séance.');
    expect(r?.ajustements).toEqual([
      {
        exercice: 'Dips',
        sets: 4,
        repsMin: 9,
        repsMax: 11,
        poids: 12.5,
        note: 'RPE bas',
      },
    ]);
  });

  it('arrondit sets/reps et borne le poids à 0 minimum', () => {
    const r = parseSessionAdjustJson(
      '{"resume":"x","ajustements":[{"exercice":"Squat","sets":3.6,"repsMin":5.4,"repsMax":5.4,"poids":-10,"note":""}]}',
    );
    expect(r?.ajustements[0]).toMatchObject({
      sets: 4,
      repsMin: 5,
      repsMax: 5,
      poids: 0,
    });
  });

  it('ignore un ajustement avec un champ numérique manquant ou invalide', () => {
    const r = parseSessionAdjustJson(
      '{"resume":"x","ajustements":[{"exercice":"Squat","sets":"beaucoup","repsMin":5,"repsMax":8,"poids":100,"note":""},{"exercice":"Dips","sets":3,"repsMin":8,"repsMax":10,"poids":0,"note":""}]}',
    );
    expect(r?.ajustements).toHaveLength(1);
    expect(r?.ajustements[0].exercice).toBe('Dips');
  });

  it('renvoie null quand résumé et ajustements sont tous deux vides', () => {
    expect(parseSessionAdjustJson('{"resume":"","ajustements":[]}')).toBeNull();
    expect(parseSessionAdjustJson('pas de json')).toBeNull();
  });
});

describe('describeAiError', () => {
  it('cible Gemini par défaut', () => {
    const { msg } = describeAiError({ reason: 'nokey' });
    expect(msg).toContain('Gemini');
    expect(msg).toContain('aistudio.google.com/apikey');
  });

  it('cible Groq quand le fournisseur est précisé', () => {
    const { msg } = describeAiError({ reason: 'badkey', provider: 'groq' });
    expect(msg).toContain('Groq');
    expect(msg).toContain('gsk_');
  });

  it('renvoie le détail brut pour une erreur API', () => {
    const { msg } = describeAiError({ reason: 'api', detail: 'Boom 503' });
    expect(msg).toBe('Boom 503');
  });
});
