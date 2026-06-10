import { afterEach, describe, expect, it } from 'vitest';
import { STORAGE_KEYS } from '@/lib/storage';
import {
  getActiveConfig,
  getApiKey,
  getProvider,
  setApiKey,
  setProvider,
} from './config';

afterEach(() => {
  localStorage.clear();
});

describe('getProvider', () => {
  it('utilise Gemini par défaut sur une installation neuve', () => {
    expect(getProvider()).toBe('gemini');
  });

  it('migre vers Groq si une clé Groq héritée existe sans choix explicite', () => {
    localStorage.setItem(STORAGE_KEYS.aiKey, JSON.stringify('gsk_legacy'));
    expect(getProvider()).toBe('groq');
  });

  it('respecte un choix explicite', () => {
    setProvider('gemini');
    localStorage.setItem(STORAGE_KEYS.aiKey, JSON.stringify('gsk_legacy'));
    expect(getProvider()).toBe('gemini');
  });
});

describe('setApiKey / getApiKey', () => {
  it('stocke chaque clé sous son propre fournisseur', () => {
    setApiKey('gemini', 'AIzaTEST');
    setApiKey('groq', 'gsk_TEST');
    expect(getApiKey('gemini')).toBe('AIzaTEST');
    expect(getApiKey('groq')).toBe('gsk_TEST');
  });

  it('supprime la clé quand on enregistre une valeur vide', () => {
    setApiKey('gemini', 'AIzaTEST');
    setApiKey('gemini', '   ');
    expect(getApiKey('gemini')).toBe('');
  });
});

describe('getActiveConfig', () => {
  it('renvoie la clé du fournisseur sélectionné', () => {
    setProvider('gemini');
    setApiKey('gemini', 'AIzaABC');
    expect(getActiveConfig()).toEqual({
      provider: 'gemini',
      apiKey: 'AIzaABC',
    });
  });

  it("bascule sur l'autre fournisseur si la clé sélectionnée est absente", () => {
    setProvider('gemini');
    setApiKey('groq', 'gsk_ONLY');
    expect(getActiveConfig()).toEqual({ provider: 'groq', apiKey: 'gsk_ONLY' });
  });

  it("renvoie une clé vide quand rien n'est configuré", () => {
    setProvider('gemini');
    expect(getActiveConfig()).toEqual({ provider: 'gemini', apiKey: '' });
  });
});
