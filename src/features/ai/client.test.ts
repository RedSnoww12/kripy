import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setApiKey, setProvider } from './config';
import { analyzeStats } from './client';

function mockGroqResponse(content: string) {
  return {
    ok: true,
    json: async () => ({ choices: [{ message: { content } }] }),
  } as Response;
}

beforeEach(() => {
  setProvider('groq');
  setApiKey('groq', 'gsk_test');
});

afterEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe('analyzeStats — la décision Système Fluide prime toujours sur l’IA', () => {
  it("force ajustementKcal à +200 si l'algorithme a décidé +200, même si l'IA répond autre chose", async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          mockGroqResponse(
            '{"bilan":"test","recommandations":[],"ajustementKcal":-9999}',
          ),
        ),
    );

    const result = await analyzeStats({ objectif: 'Maintien' }, '+200');
    expect('reason' in result).toBe(false);
    if ('reason' in result) return;
    expect(result.ajustementKcal).toBe(200);
  });

  it("force ajustementKcal à -200 si l'algorithme a décidé -200", async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          mockGroqResponse(
            '{"bilan":"test","recommandations":[],"ajustementKcal":500}',
          ),
        ),
    );

    const result = await analyzeStats({ objectif: 'Déficit' }, '-200');
    if ('reason' in result) throw new Error('unexpected error');
    expect(result.ajustementKcal).toBe(-200);
  });

  it("force ajustementKcal à null quand l'algorithme n'a rien décidé (maintenir/observer/null), même si l'IA invente un chiffre", async () => {
    for (const algoAction of ['maintenir', 'observer', null] as const) {
      vi.stubGlobal(
        'fetch',
        vi
          .fn()
          .mockResolvedValue(
            mockGroqResponse(
              '{"bilan":"test","recommandations":[],"ajustementKcal":-200}',
            ),
          ),
      );
      const result = await analyzeStats({ objectif: 'Maintien' }, algoAction);
      if ('reason' in result) throw new Error('unexpected error');
      expect(result.ajustementKcal).toBeNull();
    }
  });

  it('renvoie une erreur de parsing si le JSON est invalide, sans forcer de valeur', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(mockGroqResponse('pas du json')),
    );

    const result = await analyzeStats({ objectif: 'Maintien' }, '+200');
    expect('reason' in result).toBe(true);
  });
});
