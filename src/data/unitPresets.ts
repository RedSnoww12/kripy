import type { UnitPreset } from '@/types';

export type { UnitPreset };

interface CategoryRule {
  match: RegExp;
  presets: UnitPreset[];
}

const EXACT_OVERRIDES: Record<string, UnitPreset[]> = {
  'Oeuf entier': [{ label: 'œuf', grams: 50 }],
  'Oeuf dur': [{ label: 'œuf', grams: 50 }],
  'Oeuf mollet': [{ label: 'œuf', grams: 50 }],
  'Oeuf poche': [{ label: 'œuf', grams: 50 }],
  'Oeuf brouille': [{ label: 'œuf', grams: 50 }],
  'Blanc oeuf': [{ label: 'blanc', grams: 33 }],
  'Jaune oeuf': [{ label: 'jaune', grams: 17 }],

  'Yaourt grec 0%': [{ label: 'pot', grams: 150 }],
  'Yaourt grec 2%': [{ label: 'pot', grams: 150 }],
  'Yaourt grec 10%': [{ label: 'pot', grams: 150 }],
  'Yaourt nature': [{ label: 'pot', grams: 125 }],
  'Yaourt nature 0%': [{ label: 'pot', grams: 125 }],
  'Yaourt sucre': [{ label: 'pot', grams: 125 }],
  'Yaourt fruits': [{ label: 'pot', grams: 125 }],
  'Yaourt aux cereales': [{ label: 'pot', grams: 125 }],

  'Pain complet': [{ label: 'tranche', grams: 30 }],
  'Pain blanc': [{ label: 'tranche', grams: 30 }],
  'Pain de mie': [{ label: 'tranche', grams: 25 }],
  'Pain de mie complet': [{ label: 'tranche', grams: 25 }],
  'Pain seigle': [{ label: 'tranche', grams: 30 }],

  Biscotte: [{ label: 'biscotte', grams: 8 }],
  Madeleine: [{ label: 'madeleine', grams: 25 }],

  Banane: [{ label: 'banane', grams: 120 }],
  'Banane plantain': [{ label: 'banane', grams: 150 }],
  Pomme: [{ label: 'pomme', grams: 150 }],
  'Pomme golden': [{ label: 'pomme', grams: 150 }],
  'Pomme granny': [{ label: 'pomme', grams: 150 }],
  'Pomme royal gala': [{ label: 'pomme', grams: 150 }],

  'Compote pomme': [{ label: 'gourde', grams: 90 }],
  'Compote poire': [{ label: 'gourde', grams: 90 }],
  'Compote pruneau': [{ label: 'gourde', grams: 90 }],
  'Compote sans sucre': [{ label: 'gourde', grams: 90 }],
};

const CATEGORY_RULES: CategoryRule[] = [
  {
    match:
      /\b(pizza|margherita|quattro|reine|napolitaine|pepperoni|calzone)\b/i,
    presets: [
      { label: 'part', grams: 100 },
      { label: 'demi-pizza', grams: 200 },
      { label: 'pizza', grams: 350 },
    ],
  },
  {
    match: /\b(burger|cheeseburger|hamburger|big mac|whopper|smash)\b/i,
    presets: [{ label: 'burger', grams: 220 }],
  },
  {
    match: /\b(sandwich|wrap|panini|kebab|tacos?|burrito|fajita|quesadilla)\b/i,
    presets: [{ label: 'pièce', grams: 200 }],
  },
  {
    match: /\b(hot dog|hotdog)\b/i,
    presets: [{ label: 'hot-dog', grams: 150 }],
  },
  {
    match: /\b(soupe|veloute|velouté|gaspacho|bouillon|consomme|consommé)\b/i,
    presets: [
      { label: 'bol', grams: 250 },
      { label: 'assiette', grams: 350 },
    ],
  },
  {
    match: /\b(croissant)\b/i,
    presets: [{ label: 'croissant', grams: 60 }],
  },
  {
    match: /\b(pain au choco|chocolatine)\b/i,
    presets: [{ label: 'pièce', grams: 70 }],
  },
  {
    match: /\b(pain aux raisins|chausson|brioche)\b/i,
    presets: [{ label: 'pièce', grams: 80 }],
  },
  {
    match: /\b(baguette)\b/i,
    presets: [
      { label: 'tronçon', grams: 50 },
      { label: 'demi-baguette', grams: 125 },
      { label: 'baguette', grams: 250 },
    ],
  },
  {
    match: /\b(bagel|muffin|donut|donuts|beignet|cookie|cookies)\b/i,
    presets: [{ label: 'pièce', grams: 80 }],
  },
  {
    match: /\b(crepe|crêpe|pancake|gaufre|blini)\b/i,
    presets: [{ label: 'pièce', grams: 60 }],
  },
  {
    match:
      /\b(fromage|comte|comté|brie|camembert|emmental|gruyere|gruyère|cheddar|mozza|mozzarella|feta|chevre|chèvre|roquefort|reblochon|raclette|tomme|parmesan|gouda|edam|maroilles|munster)\b/i,
    presets: [
      { label: 'portion', grams: 30 },
      { label: 'tranche', grams: 20 },
    ],
  },
  {
    match: /\b(amande|noisette|noix|cajou|pistache|pecan|macadamia|graine)s?\b/i,
    presets: [{ label: 'poignée', grams: 30 }],
  },
  {
    match:
      /\b(huile|sauce|vinaigrette|mayonnaise|ketchup|moutarde|miel|sirop|confiture)\b/i,
    presets: [
      { label: 'c. à café', grams: 5 },
      { label: 'c. à soupe', grams: 15 },
    ],
  },
  {
    match: /\b(beurre|margarine)\b/i,
    presets: [
      { label: 'noisette', grams: 5 },
      { label: 'c. à soupe', grams: 15 },
      { label: 'plaquette', grams: 250 },
    ],
  },
  {
    match: /\b(jus|smoothie|nectar)\b/i,
    presets: [
      { label: 'verre', grams: 200 },
      { label: 'bouteille', grams: 330 },
    ],
  },
  {
    match: /\b(lait|boisson vegetale|boisson végétale|kefir|kéfir)\b/i,
    presets: [
      { label: 'verre', grams: 200 },
      { label: 'bol', grams: 300 },
    ],
  },
  {
    match: /\b(cafe|café|the|thé|tisane|infusion)\b/i,
    presets: [
      { label: 'tasse', grams: 150 },
      { label: 'mug', grams: 250 },
    ],
  },
  {
    match: /\b(soda|cola|limonade|biere|bière|vin|champagne|cidre)\b/i,
    presets: [
      { label: 'verre', grams: 200 },
      { label: 'canette', grams: 330 },
      { label: 'bouteille', grams: 500 },
    ],
  },
  {
    match: /\b(tablette|chocolat noir|chocolat lait|chocolat blanc)\b/i,
    presets: [
      { label: 'carré', grams: 6 },
      { label: 'tablette', grams: 100 },
    ],
  },
  {
    match: /\b(barre|gateau|gâteau|tarte|cake|brownie|muffin|cupcake|eclair|éclair|millefeuille|paris-brest|baba)\b/i,
    presets: [
      { label: 'part', grams: 100 },
      { label: 'pièce', grams: 80 },
    ],
  },
  {
    match: /\b(glace|sorbet|magnum|cornet|esquimau)\b/i,
    presets: [
      { label: 'boule', grams: 50 },
      { label: 'pot', grams: 150 },
    ],
  },
  {
    match:
      /\b(ramen|pho|udon|soba|pad thai|paella|risotto|curry|tajine|tagine|couscous|bibimbap|biryani|kebbe|moussaka|lasagne|cannelloni|raviolis?|gnocchi|carbonara|bolognese|bolognaise|bourguignon|blanquette|cassoulet|choucroute|hachis|gratin|quiche|tartiflette|fondue|pot-au-feu|navarin|osso|ratatouille|piperade|garbure|pissaladiere|bouillabaisse)\b/i,
    presets: [
      { label: 'portion', grams: 250 },
      { label: 'plat', grams: 350 },
    ],
  },
  {
    match: /\b(salade)\b/i,
    presets: [
      { label: 'bol', grams: 200 },
      { label: 'assiette', grams: 300 },
    ],
  },
  {
    match:
      /\b(pates|pâtes|spaghetti|penne|fusilli|tagliatelle|linguine|farfalle|macaroni|coquillettes|riz|quinoa|boulgour|semoule|couscous grain|millet|epeautre|épeautre|orge|sarrasin|polenta|patate douce|pomme de terre|frites|gnocchi)\b/i,
    presets: [
      { label: 'portion', grams: 150 },
      { label: 'plat', grams: 250 },
    ],
  },
  {
    match:
      /\b(haricot|lentille|pois chiche|fève|fave|flageolet|edamame|soja|tofu|tempeh|seitan)\b/i,
    presets: [
      { label: 'portion', grams: 150 },
      { label: 'plat', grams: 250 },
    ],
  },
  {
    match:
      /\b(saumon|thon|cabillaud|merlu|truite|lieu|colin|sardine|maquereau|hareng|sole|bar|dorade|loup|raie|julienne|panga|tilapia|espadon|fletan|flétan|rouget|anchois|poisson|crevette|gambas|moule|huitre|huître|bulot|bigorneau|crabe|homard|langouste|encornet|calamar|seiche|poulpe|st jacques|saint-jacques|coquille)\b/i,
    presets: [
      { label: 'portion', grams: 130 },
      { label: 'plat', grams: 200 },
    ],
  },
  {
    match:
      /\b(poulet|dinde|boeuf|porc|veau|agneau|canard|jambon|saucisse|merguez|chorizo|steak|escalope|cote|côte|filet|rumsteck|entrecote|entrecôte|gigot|epaule|épaule|magret|cuisse|aiguillette|paupiette|brochette|bavette|onglet|joue|tournedos|pavé|pave|rosbif|roti|rôti|lardons|bacon|coppa|pancetta|mortadelle|saucisson|pate|pâté|rillettes|andouille|boudin|tripes|cervelle|foie|rognon|langue|abats|kebab viande)\b/i,
    presets: [
      { label: 'portion', grams: 100 },
      { label: 'portion+', grams: 150 },
      { label: 'plat', grams: 200 },
    ],
  },
  {
    match:
      /\b(brocoli|chou|carotte|courgette|aubergine|tomate|haricot vert|epinard|épinard|poivron|champignon|asperge|artichaut|fenouil|radis|concombre|poireau|navet|betterave|celeri|céleri|endive|laitue|roquette|mâche|mache|cresson|legume|légume|crudite|crudité|ratatouille)\b/i,
    presets: [
      { label: 'portion', grams: 150 },
      { label: 'plat', grams: 250 },
    ],
  },
  {
    match:
      /\b(orange|mandarine|clementine|clémentine|citron|pamplemousse|kiwi|peche|pêche|abricot|prune|poire|raisin|cerise|fraise|framboise|myrtille|cassis|groseille|mure|mûre|ananas|mangue|papaye|grenade|figue|datte|melon|pasteque|pastèque)\b/i,
    presets: [{ label: 'pièce', grams: 130 }],
  },
];

function pickRule(name: string): UnitPreset[] {
  const matching: UnitPreset[] = [];
  const seen = new Set<string>();
  for (const rule of CATEGORY_RULES) {
    if (rule.match.test(name)) {
      for (const preset of rule.presets) {
        const key = `${preset.label}:${preset.grams}`;
        if (seen.has(key)) continue;
        seen.add(key);
        matching.push(preset);
      }
      break;
    }
  }
  return matching;
}

export function getUnitPresets(foodName: string): UnitPreset[] {
  const overrides = EXACT_OVERRIDES[foodName];
  if (overrides && overrides.length > 0) return overrides;
  return pickRule(foodName);
}
