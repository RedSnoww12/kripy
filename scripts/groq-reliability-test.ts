/**
 * Test de fiabilité de l'IA Groq sur le calcul de calories/macros.
 *
 * Réutilise le code réel de l'app (system prompt, construction du message
 * utilisateur, transport Groq, parsing JSON) pour mesurer, sur des cas dont
 * la réponse attendue est déductible de la base de valeurs du prompt lui-même :
 * - la justesse (écart vs valeur attendue)
 * - la cohérence entre plusieurs appels identiques (variance / CV%)
 * - le taux de parsing JSON réussi
 * - la cohérence interne Atwater (prot*4 + gluc*4 + lip*9 ≈ kcal)
 *
 * Usage : GROQ_API_KEY=gsk_xxx node --experimental-strip-types scripts/groq-reliability-test.ts
 * Options : REPEATS=3 DELAY_MS=2500 pour ajuster répétitions / délai anti-429.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { AI_SYSTEM_PROMPT, buildUserMessage } from '../src/features/ai/prompts.ts';
import { groqTransport } from '../src/features/ai/groqClient.ts';
import { parseMealJson, type AiMealResult, type AiError } from '../src/features/ai/types.ts';

interface ExactCase {
  id: string;
  category: 'exact';
  description: string;
  expected: { kcal: number; prot: number; gluc: number; lip: number; fib?: number };
  tolerancePct: number;
}

interface RangeCase {
  id: string;
  category: 'range';
  description: string;
  range: { min: number; max: number };
}

type TestCase = ExactCase | RangeCase;

// Cas "exact" : combinaisons construites à partir de la base de valeurs figée
// dans AI_SYSTEM_PROMPT lui-même, donc la réponse attendue est calculable
// sans ambiguïté (poids x valeur/100g). Ça isole la fiabilité du calcul pur.
const EXACT_CASES: ExactCase[] = [
  {
    id: 'poulet_riz',
    category: 'exact',
    description: '150g de poulet rôti sans peau et 200g de riz blanc cuit, rien d’autre',
    expected: { kcal: 507.5, prot: 51.5, gluc: 56, lip: 6.6 },
    tolerancePct: 15,
  },
  {
    id: 'saumon_pates',
    category: 'exact',
    description: '100g de saumon cuit et 150g de pâtes cuites nature, sans sauce ni matière grasse',
    expected: { kcal: 425, prot: 32.5, gluc: 45, lip: 12.5 },
    tolerancePct: 15,
  },
  {
    id: 'deux_oeufs',
    category: 'exact',
    description: '2 œufs entiers cuits, sans rien d’autre',
    expected: { kcal: 170, prot: 14, gluc: 0, lip: 12 },
    tolerancePct: 15,
  },
  {
    id: 'lentilles_300g',
    category: 'exact',
    description: '300g de lentilles cuites nature, sans huile ni accompagnement',
    expected: { kcal: 345, prot: 27, gluc: 60, lip: 1.2, fib: 24 },
    tolerancePct: 15,
  },
  {
    id: 'baguette_entiere',
    category: 'exact',
    description: 'Une baguette de pain blanc entière (250g), rien d’autre',
    expected: { kcal: 675, prot: 22.5, gluc: 137.5, lip: 3.75 },
    tolerancePct: 15,
  },
  {
    id: 'soda_33cl',
    category: 'exact',
    description: 'Une canette de soda de 33cl, rien d’autre',
    expected: { kcal: 140, prot: 0, gluc: 35, lip: 0 },
    tolerancePct: 20,
  },
];

// Cas "range" : plats composites où le prompt donne lui-même une fourchette
// (ou une valeur ponctuelle assimilée à une fourchette étroite) — mesure la
// cohérence de rappel de connaissance plutôt que le calcul arithmétique pur.
const RANGE_CASES: RangeCase[] = [
  {
    id: 'big_mac',
    category: 'range',
    description: 'Un Big Mac de chez McDonald’s, seul, sans frites ni boisson',
    range: { min: 467, max: 633 }, // 550 kcal ± 15 %
  },
  {
    id: 'whopper',
    category: 'range',
    description: 'Un Whopper de chez Burger King, seul',
    range: { min: 561, max: 759 }, // 660 kcal ± 15 %
  },
  {
    id: 'couscous_royal',
    category: 'range',
    description: 'Un couscous royal avec poulet, merguez, légumes et semoule, portion standard',
    range: { min: 700, max: 850 },
  },
  {
    id: 'tajine_poulet_olives',
    category: 'range',
    description: 'Un tajine de poulet aux olives, portion standard',
    range: { min: 500, max: 650 },
  },
  {
    id: 'pates_bolo_300g',
    category: 'range',
    description: 'Une portion de pâtes bolognaise (300g)',
    range: { min: 450, max: 580 },
  },
];

const TEST_CASES: TestCase[] = [...EXACT_CASES, ...RANGE_CASES];

const REPEATS = Number(process.env.REPEATS ?? 3);
const DELAY_MS = Number(process.env.DELAY_MS ?? 2500);
const API_KEY = process.env.GROQ_API_KEY;

if (!API_KEY) {
  console.error('GROQ_API_KEY manquante dans l’environnement.');
  process.exit(1);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stdev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance = mean(values.map((v) => (v - m) ** 2));
  return Math.sqrt(variance);
}

/** Moyenne des valeurs définies d'une liste (ignore undefined), ou null si aucune. */
function definedMean(values: (number | undefined)[]): number | null {
  const defined = values.filter((v): v is number => v !== undefined);
  return defined.length ? mean(defined) : null;
}

interface RunRecord {
  ok: boolean;
  latencyMs: number;
  result?: AiMealResult;
  error?: string;
}

interface CaseReport {
  id: string;
  category: 'exact' | 'range';
  description: string;
  runs: RunRecord[];
  parseSuccessRate: number;
  kcalMean: number | null;
  kcalStdev: number | null;
  kcalCvPct: number | null;
  atwaterDeviationPctMean: number | null;
  avgLatencyMs: number;
  // exact
  expectedKcal?: number;
  kcalErrorPctMean?: number;
  withinTolerancePct?: number;
  // range
  rangeMin?: number;
  rangeMax?: number;
  withinRangePct?: number;
}

function atwaterDeviationPct(r: AiMealResult): number | null {
  if (!r.kcal) return null;
  const atwater = r.prot * 4 + r.gluc * 4 + r.lip * 9;
  return (Math.abs(atwater - r.kcal) / r.kcal) * 100;
}

async function runCase(tc: TestCase): Promise<CaseReport> {
  const runs: RunRecord[] = [];
  const userMessage = buildUserMessage(tc.description);

  for (let i = 0; i < REPEATS; i++) {
    const start = Date.now();
    const outcome = await groqTransport({
      apiKey: API_KEY!,
      system: AI_SYSTEM_PROMPT,
      parts: [{ text: userMessage }],
      hasImage: false,
    });
    const latencyMs = Date.now() - start;

    if (typeof outcome === 'string') {
      const parsed = parseMealJson(outcome);
      if (parsed) {
        runs.push({ ok: true, latencyMs, result: parsed });
      } else {
        runs.push({ ok: false, latencyMs, error: `parse_failed: ${outcome.slice(0, 200)}` });
      }
    } else {
      const e = outcome as AiError;
      runs.push({ ok: false, latencyMs, error: `${e.reason}${e.detail ? `: ${e.detail}` : ''}` });
    }

    console.log(
      `[${tc.id}] run ${i + 1}/${REPEATS} — ${runs[runs.length - 1].ok ? 'OK' : 'ECHEC'} (${latencyMs}ms)`,
    );
    if (i < REPEATS - 1) await sleep(DELAY_MS);
  }

  const okRuns = runs.filter((r) => r.ok && r.result);
  const kcals = okRuns.map((r) => r.result!.kcal);
  const atwaterDevs = okRuns
    .map((r) => atwaterDeviationPct(r.result!))
    .filter((v): v is number => v !== null);

  const report: CaseReport = {
    id: tc.id,
    category: tc.category,
    description: tc.description,
    runs,
    parseSuccessRate: (okRuns.length / runs.length) * 100,
    kcalMean: kcals.length ? mean(kcals) : null,
    kcalStdev: kcals.length ? stdev(kcals) : null,
    kcalCvPct: kcals.length && mean(kcals) ? (stdev(kcals) / mean(kcals)) * 100 : null,
    atwaterDeviationPctMean: atwaterDevs.length ? mean(atwaterDevs) : null,
    avgLatencyMs: mean(runs.map((r) => r.latencyMs)),
  };

  if (tc.category === 'exact') {
    report.expectedKcal = tc.expected.kcal;
    const errors = kcals.map((k) => (Math.abs(k - tc.expected.kcal) / tc.expected.kcal) * 100);
    report.kcalErrorPctMean = errors.length ? mean(errors) : undefined;
    report.withinTolerancePct = errors.length
      ? (errors.filter((e) => e <= tc.tolerancePct).length / errors.length) * 100
      : undefined;
  } else {
    report.rangeMin = tc.range.min;
    report.rangeMax = tc.range.max;
    report.withinRangePct = kcals.length
      ? (kcals.filter((k) => k >= tc.range.min && k <= tc.range.max).length / kcals.length) * 100
      : undefined;
  }

  return report;
}

async function main() {
  console.log(
    `Test de fiabilité Groq — ${TEST_CASES.length} cas x ${REPEATS} répétitions = ${TEST_CASES.length * REPEATS} appels\n`,
  );

  const reports: CaseReport[] = [];
  for (const tc of TEST_CASES) {
    reports.push(await runCase(tc));
    await sleep(DELAY_MS);
  }

  const allRuns = reports.flatMap((r) => r.runs);
  const parseSuccessRate = (allRuns.filter((r) => r.ok).length / allRuns.length) * 100;
  const exactReports = reports.filter((r) => r.category === 'exact');
  const rangeReports = reports.filter((r) => r.category === 'range');
  const avgKcalErrorPct = definedMean(exactReports.map((r) => r.kcalErrorPctMean));
  const avgCvPct = definedMean(reports.map((r) => r.kcalCvPct ?? undefined));
  const avgAtwaterDev = definedMean(reports.map((r) => r.atwaterDeviationPctMean ?? undefined));
  const avgWithinRangePct = definedMean(rangeReports.map((r) => r.withinRangePct));

  const summary = {
    generatedAt: new Date().toISOString(),
    model: 'llama-3.3-70b-versatile (TEXT_MODEL, src/features/ai/groqClient.ts)',
    repeats: REPEATS,
    totalCalls: allRuns.length,
    parseSuccessRate,
    avgKcalErrorPctOnExactCases: avgKcalErrorPct,
    avgCoefficientOfVariationPct: avgCvPct,
    avgAtwaterDeviationPct: avgAtwaterDev,
    avgWithinRangePctOnKnownDishes: avgWithinRangePct,
  };

  mkdirSync('scripts/results', { recursive: true });
  const outPath = `scripts/results/groq-reliability-${Date.now()}.json`;
  writeFileSync(outPath, JSON.stringify({ summary, reports }, null, 2));

  console.log('\n=== RÉSUMÉ ===');
  console.log(JSON.stringify(summary, null, 2));
  console.log(`\nDétails écrits dans ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
