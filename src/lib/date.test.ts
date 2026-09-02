import { describe, expect, it } from 'vitest';
import {
  daysBetweenISO,
  formatShortDate,
  mondayOfISO,
  shiftISO,
  weekdayIndexISO,
} from './date';

describe('shiftISO', () => {
  it('recule de 6 jours sans dépendre du fuseau horaire', () => {
    expect(shiftISO('2026-03-20', -6)).toBe('2026-03-14');
  });

  it('franchit les changements de mois et d’année', () => {
    expect(shiftISO('2026-03-01', -1)).toBe('2026-02-28');
    expect(shiftISO('2025-12-31', 1)).toBe('2026-01-01');
  });

  it('gère les années bissextiles', () => {
    expect(shiftISO('2028-02-28', 1)).toBe('2028-02-29');
  });

  it('renvoie la même date pour un décalage nul', () => {
    expect(shiftISO('2026-06-15', 0)).toBe('2026-06-15');
  });
});

describe('daysBetweenISO', () => {
  it('compte les jours signés entre deux dates', () => {
    expect(daysBetweenISO('2026-01-01', '2026-01-08')).toBe(7);
    expect(daysBetweenISO('2026-01-08', '2026-01-01')).toBe(-7);
    expect(daysBetweenISO('2026-05-05', '2026-05-05')).toBe(0);
  });
});

describe('weekdayIndexISO / mondayOfISO', () => {
  it('place le lundi à 0 et le dimanche à 6', () => {
    // 2026-03-16 est un lundi, 2026-03-22 un dimanche.
    expect(weekdayIndexISO('2026-03-16')).toBe(0);
    expect(weekdayIndexISO('2026-03-22')).toBe(6);
  });

  it('retrouve le lundi de la semaine', () => {
    expect(mondayOfISO('2026-03-20')).toBe('2026-03-16');
    expect(mondayOfISO('2026-03-16')).toBe('2026-03-16');
    expect(mondayOfISO('2026-03-22')).toBe('2026-03-16');
  });
});

describe('formatShortDate', () => {
  it('affiche jj/mm', () => {
    expect(formatShortDate('2026-03-05')).toBe('05/03');
  });
});
