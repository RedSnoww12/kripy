import { describe, expect, it } from 'vitest';
import { buildUserMessage } from './prompts';

describe('buildUserMessage — photos multiples et instructions', () => {
  it("n'ajoute aucun indice photo pour une seule photo", () => {
    const msg = buildUserMessage('', { photoCount: 1 });
    expect(msg).toContain('Analyse la photo');
    expect(msg).not.toContain('PLUSIEURS PHOTOS');
  });

  it('précise que plusieurs photos décrivent le même repas', () => {
    const msg = buildUserMessage('', { photoCount: 3 });
    expect(msg).toContain('Analyse les photos');
    expect(msg).toContain('PLUSIEURS PHOTOS (3)');
    expect(msg).toContain('UN SEUL total');
  });

  it('transmet les instructions utilisateur avec la description', () => {
    const msg = buildUserMessage('pizza 4 fromages', {
      instructions: 'sauce à part, non consommée',
    });
    expect(msg).toContain('pizza 4 fromages');
    expect(msg).toContain("INSTRUCTIONS DE L'UTILISATEUR");
    expect(msg).toContain('sauce à part, non consommée');
  });

  it('transmet les instructions même sans description (photo seule)', () => {
    const msg = buildUserMessage('', {
      photoCount: 2,
      instructions: 'grosse portion',
    });
    expect(msg).toContain("INSTRUCTIONS DE L'UTILISATEUR");
    expect(msg).toContain('grosse portion');
    expect(msg).toContain('PLUSIEURS PHOTOS (2)');
  });

  it('ignore des instructions vides ou blanches', () => {
    const msg = buildUserMessage('salade', { instructions: '   ' });
    expect(msg).not.toContain("INSTRUCTIONS DE L'UTILISATEUR");
  });

  it('reste identique au comportement historique sans options', () => {
    const msg = buildUserMessage('200g de riz');
    expect(msg).toContain('QUANTITÉ EXACTE : 200g');
    expect(msg).not.toContain('PLUSIEURS PHOTOS');
    expect(msg).not.toContain("INSTRUCTIONS DE L'UTILISATEUR");
  });
});
