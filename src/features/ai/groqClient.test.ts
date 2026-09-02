import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  groqTransport,
  isModelUnavailable,
  MAX_IMAGES_PER_REQUEST,
  pickModels,
  TEXT_MODELS,
  VISION_MODELS,
} from './groqClient';
import type { AiRequest } from './types';

function okResponse(content: string): Response {
  return {
    ok: true,
    status: 200,
    json: async () => ({ choices: [{ message: { content } }] }),
  } as Response;
}

function errorResponse(
  status: number,
  error: { message?: string; code?: string },
): Response {
  return {
    ok: false,
    status,
    json: async () => ({ error }),
  } as Response;
}

const DECOMMISSIONED = {
  message:
    'The model `llama-3.3-70b-versatile` has been decommissioned and is no longer supported.',
  code: 'model_decommissioned',
};

function request(overrides: Partial<AiRequest> = {}): AiRequest {
  return {
    apiKey: 'gsk_test',
    system: 'Réponds en JSON.',
    parts: [{ text: 'poulet riz' }],
    hasImage: false,
    ...overrides,
  };
}

function sentBody(fetchMock: ReturnType<typeof vi.fn>, call = 0) {
  const init = fetchMock.mock.calls[call][1] as RequestInit;
  return JSON.parse(init.body as string) as Record<string, unknown>;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('pickModels — choix de la famille de modèles', () => {
  it('utilise un modèle vision dès qu’une image est présente', () => {
    expect(pickModels(true)).toBe(VISION_MODELS);
    expect(pickModels(false)).toBe(TEXT_MODELS);
  });

  it('ne référence plus les modèles Llama décommissionnés par Groq', () => {
    const ids = [...TEXT_MODELS, ...VISION_MODELS].map((m) => m.id);
    for (const id of ids) expect(id).not.toMatch(/llama/i);
  });
});

describe('isModelUnavailable — détection d’un modèle retiré', () => {
  it('reconnaît les codes model_decommissioned et model_not_found', () => {
    expect(isModelUnavailable(400, { error: DECOMMISSIONED })).toBe(true);
    expect(
      isModelUnavailable(404, { error: { code: 'model_not_found' } }),
    ).toBe(true);
  });

  it('reconnaît un message de dépréciation sans code', () => {
    expect(
      isModelUnavailable(400, {
        error: { message: 'The model foo does not exist' },
      }),
    ).toBe(true);
  });

  it('ne confond pas avec une autre erreur 400', () => {
    expect(
      isModelUnavailable(400, {
        error: { message: 'temperature must be between 0 and 2' },
      }),
    ).toBe(false);
    expect(isModelUnavailable(400, null)).toBe(false);
  });
});

describe('groqTransport — requête envoyée', () => {
  it('cible le premier modèle texte en mode JSON avec la clé en Bearer', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse('{"kcal":1}'));
    vi.stubGlobal('fetch', fetchMock);

    const out = await groqTransport(request());
    expect(out).toBe('{"kcal":1}');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>).Authorization).toBe(
      'Bearer gsk_test',
    );
    const body = sentBody(fetchMock);
    expect(body.model).toBe(TEXT_MODELS[0].id);
    expect(body.response_format).toEqual({ type: 'json_object' });
    expect(body.reasoning_effort).toBe('medium');
    expect(body.messages).toEqual([
      { role: 'system', content: 'Réponds en JSON.' },
      { role: 'user', content: [{ type: 'text', text: 'poulet riz' }] },
    ]);
  });

  it('cible le premier modèle vision et transmet les images en image_url', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse('{"kcal":1}'));
    vi.stubGlobal('fetch', fetchMock);

    await groqTransport(
      request({
        hasImage: true,
        parts: [{ image: 'data:image/jpeg;base64,AAA' }, { text: 'assiette' }],
      }),
    );

    const body = sentBody(fetchMock);
    expect(body.model).toBe(VISION_MODELS[0].id);
    expect(body.reasoning_effort).toBeUndefined();
    const user = (body.messages as { content: unknown }[])[1];
    expect(user.content).toEqual([
      { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,AAA' } },
      { type: 'text', text: 'assiette' },
    ]);
  });

  it('limite le nombre d’images par requête et le signale au modèle', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse('{"kcal":1}'));
    vi.stubGlobal('fetch', fetchMock);

    const images = Array.from(
      { length: MAX_IMAGES_PER_REQUEST + 1 },
      (_, i) => ({
        image: `data:image/jpeg;base64,IMG${i}`,
      }),
    );
    await groqTransport(
      request({ hasImage: true, parts: [...images, { text: 'repas' }] }),
    );

    const user = (sentBody(fetchMock).messages as { content: unknown[] }[])[1];
    const imageParts = user.content.filter(
      (p) => (p as { type: string }).type === 'image_url',
    );
    expect(imageParts).toHaveLength(MAX_IMAGES_PER_REQUEST);
    const lastText = user.content.at(-1) as { text: string };
    expect(lastText.text).toContain('1 ignorée');
  });
});

describe('groqTransport — bascule automatique de modèle', () => {
  it('passe au modèle suivant quand le premier est décommissionné', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(errorResponse(400, DECOMMISSIONED))
      .mockResolvedValueOnce(okResponse('{"kcal":2}'));
    vi.stubGlobal('fetch', fetchMock);

    const out = await groqTransport(request());
    expect(out).toBe('{"kcal":2}');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(sentBody(fetchMock, 0).model).toBe(TEXT_MODELS[0].id);
    expect(sentBody(fetchMock, 1).model).toBe(TEXT_MODELS[1].id);
  });

  it('renvoie une erreur explicite quand tous les modèles sont retirés', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(errorResponse(404, { code: 'model_not_found' }));
    vi.stubGlobal('fetch', fetchMock);

    const out = await groqTransport(request({ hasImage: true }));
    expect(fetchMock).toHaveBeenCalledTimes(VISION_MODELS.length);
    expect(out).toMatchObject({ reason: 'api' });
    if (typeof out === 'string') return;
    expect(out.detail).toContain('Aucun modèle Groq vision');
    expect(out.detail).toContain('Gemini');
  });

  it('ne bascule pas sur une erreur qui n’est pas liée au modèle', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(errorResponse(401, { message: 'Invalid API Key' }));
    vi.stubGlobal('fetch', fetchMock);

    const out = await groqTransport(request());
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(out).toEqual({ reason: 'badkey', detail: undefined });
  });
});

describe('groqTransport — erreurs HTTP', () => {
  it('mappe 429 vers quota et 5xx vers une erreur transitoire', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(errorResponse(429, { message: 'rate' })),
    );
    expect(await groqTransport(request())).toMatchObject({ reason: 'quota' });

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(errorResponse(503, { message: 'down' })),
    );
    expect(await groqTransport(request())).toMatchObject({
      reason: 'api',
      retryable: true,
    });
  });

  it('renvoie une erreur réseau transitoire si fetch échoue', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    expect(await groqTransport(request())).toMatchObject({
      reason: 'network',
      retryable: true,
    });
  });

  it('renvoie parse si la réponse ne contient aucun texte', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse('')));
    expect(await groqTransport(request())).toMatchObject({ reason: 'parse' });
  });
});
