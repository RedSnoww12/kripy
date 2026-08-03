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

  // ── Fast-food : poids réels des produits d'enseigne ──
  // Un burger ne se pèse pas : ces presets permettent de loguer
  // « 1 Big Mac » plutôt que d'estimer des grammes au jugé.

  // Frites & accompagnements : tailles réelles des menus
  'McDo Frites': [
    { label: 'petite', grams: 80 },
    { label: 'moyenne', grams: 114 },
    { label: 'grande', grams: 150 },
  ],
  'McDo Potatoes': [{ label: 'portion', grams: 100 }],
  'BK King Fries': [
    { label: 'moyenne', grams: 110 },
    { label: 'grande', grams: 150 },
  ],
  'KFC Frites': [
    { label: 'moyenne', grams: 110 },
    { label: 'grande', grams: 150 },
  ],
  'KFC Potatoes': [{ label: 'portion', grams: 100 }],
  'Popeyes Frites cajun': [
    { label: 'moyenne', grams: 110 },
    { label: 'grande', grams: 150 },
  ],

  // Pizzas livrées (pizza moyenne ≈ 560 g, 6 parts)
  'Pizza Hut Pan cheese': [
    { label: 'part', grams: 100 },
    { label: 'demi-pizza', grams: 280 },
    { label: 'pizza', grams: 560 },
  ],
  'Pizza Hut Stuffed crust': [
    { label: 'part', grams: 100 },
    { label: 'demi-pizza', grams: 280 },
    { label: 'pizza', grams: 560 },
  ],
  'Pizza Hut Pepperoni': [
    { label: 'part', grams: 100 },
    { label: 'demi-pizza', grams: 280 },
    { label: 'pizza', grams: 560 },
  ],
  'Pizza Hut BBQ chicken': [
    { label: 'part', grams: 100 },
    { label: 'demi-pizza', grams: 280 },
    { label: 'pizza', grams: 560 },
  ],
  'Dominos Classic crust': [
    { label: 'part', grams: 95 },
    { label: 'demi-pizza', grams: 285 },
    { label: 'pizza', grams: 570 },
  ],
  'Dominos Cheesy crust': [
    { label: 'part', grams: 95 },
    { label: 'demi-pizza', grams: 285 },
    { label: 'pizza', grams: 570 },
  ],
  'Dominos Pepperoni': [
    { label: 'part', grams: 95 },
    { label: 'demi-pizza', grams: 285 },
    { label: 'pizza', grams: 570 },
  ],
  'Dominos Reine': [
    { label: 'part', grams: 95 },
    { label: 'demi-pizza', grams: 285 },
    { label: 'pizza', grams: 570 },
  ],
  'Dominos Potatoes': [{ label: 'portion', grams: 100 }],
  'Dominos Chicken wings': [{ label: 'pièce', grams: 30 }],
  'Dominos Garlic bread': [{ label: 'part', grams: 40 }],
  'Papa Johns Pizza': [
    { label: 'part', grams: 100 },
    { label: 'demi-pizza', grams: 280 },
    { label: 'pizza', grams: 560 },
  ],
  'Pizza livree standard': [
    { label: 'part', grams: 100 },
    { label: 'demi-pizza', grams: 280 },
    { label: 'pizza', grams: 560 },
  ],
  'Pizza sicilienne': [
    { label: 'part', grams: 100 },
    { label: 'demi-pizza', grams: 280 },
    { label: 'pizza', grams: 560 },
  ],
  'Pizza chevre miel': [
    { label: 'part', grams: 100 },
    { label: 'demi-pizza', grams: 280 },
    { label: 'pizza', grams: 560 },
  ],
  'Pizza kebab': [
    { label: 'part', grams: 100 },
    { label: 'demi-pizza', grams: 280 },
    { label: 'pizza', grams: 560 },
  ],
  'Pizza tartiflette': [
    { label: 'part', grams: 100 },
    { label: 'demi-pizza', grams: 280 },
    { label: 'pizza', grams: 560 },
  ],

  // McDonald's
  'McDo McChicken': [{ label: 'burger', grams: 173 }],
  'McDo Filet-O-Fish': [{ label: 'burger', grams: 136 }],
  'McDo Double cheeseburger': [{ label: 'burger', grams: 165 }],
  'McDo McRoyal Bacon': [{ label: 'burger', grams: 215 }],
  'McDo 280 Bacon': [{ label: 'burger', grams: 265 }],
  'McDo 280 Chevre': [{ label: 'burger', grams: 265 }],
  'McDo McWrap poulet': [{ label: 'wrap', grams: 250 }],
  'McDo McFirst poulet': [{ label: 'burger', grams: 150 }],
  'McDo Croque McDo': [{ label: 'croque', grams: 87 }],
  'McDo P tit wrap ranch': [{ label: 'wrap', grams: 95 }],
  'McDo Salade cesar poulet': [{ label: 'salade', grams: 250 }],
  'McDo Sundae caramel': [{ label: 'sundae', grams: 149 }],
  'McDo Sundae chocolat': [{ label: 'sundae', grams: 149 }],
  'McDo McFlurry Kitkat': [{ label: 'pot', grams: 180 }],
  'McDo McFlurry Oreo': [{ label: 'pot', grams: 180 }],
  'McDo Milkshake vanille': [{ label: 'gobelet', grams: 300 }],
  'McDo Chausson pommes': [{ label: 'chausson', grams: 75 }],
  'McDo Muffin chocolat': [{ label: 'muffin', grams: 100 }],
  'McDo Cookie': [{ label: 'cookie', grams: 75 }],

  // Burger King
  'BK Steakhouse': [{ label: 'burger', grams: 240 }],
  'BK Big King': [{ label: 'burger', grams: 230 }],
  'BK Whopper cheese': [{ label: 'burger', grams: 290 }],
  'BK Double Whopper': [{ label: 'burger', grams: 350 }],
  'BK Chicken Royal': [{ label: 'burger', grams: 220 }],
  'BK Long Chicken': [{ label: 'burger', grams: 200 }],
  'BK Fish King': [{ label: 'burger', grams: 190 }],
  'BK Veggie King': [{ label: 'burger', grams: 200 }],
  'BK Onion rings': [{ label: 'portion', grams: 90 }],
  'BK King Nuggets': [
    { label: 'pièce', grams: 17 },
    { label: 'boîte de 9', grams: 150 },
  ],
  'BK Chicken Fries': [
    { label: 'pièce', grams: 15 },
    { label: 'boîte', grams: 100 },
  ],
  'BK Sundae': [{ label: 'sundae', grams: 150 }],

  // KFC
  'KFC Poulet original': [{ label: 'pièce', grams: 95 }],
  'KFC Filet original': [{ label: 'filet', grams: 90 }],
  'KFC Tenders': [
    { label: 'tender', grams: 35 },
    { label: 'boîte de 5', grams: 175 },
  ],
  'KFC Hot wings': [
    { label: 'wing', grams: 25 },
    { label: 'boîte de 5', grams: 125 },
  ],
  'KFC Boneless': [{ label: 'pièce', grams: 30 }],
  'KFC Zinger burger': [{ label: 'burger', grams: 190 }],
  'KFC Twister': [{ label: 'wrap', grams: 210 }],
  'KFC Puree': [{ label: 'pot', grams: 120 }],
  'KFC Coleslaw': [{ label: 'pot', grams: 100 }],

  // Popeyes / PePe Chicken / Tasty Crousty / Chicken Spot
  'Popeyes Tenders': [{ label: 'tender', grams: 35 }],
  'Popeyes Sandwich poulet': [{ label: 'burger', grams: 210 }],
  'PePe Chicken tenders': [{ label: 'tender', grams: 35 }],
  'PePe Chicken burger': [{ label: 'burger', grams: 230 }],
  'Chicken Spot tenders': [{ label: 'tender', grams: 35 }],
  'Tasty Crousty tenders': [{ label: 'tender', grams: 35 }],
  'Tasty Crousty burger': [{ label: 'burger', grams: 230 }],
  'Poulet frit coreen': [{ label: 'portion', grams: 150 }],

  // Subway
  'Subway Poulet teriyaki': [
    { label: 'sub 15cm', grams: 220 },
    { label: 'sub 30cm', grams: 440 },
  ],
  'Subway Poulet grille': [
    { label: 'sub 15cm', grams: 220 },
    { label: 'sub 30cm', grams: 440 },
  ],
  'Subway Italian BMT': [
    { label: 'sub 15cm', grams: 220 },
    { label: 'sub 30cm', grams: 440 },
  ],
  'Subway Steak and cheese': [
    { label: 'sub 15cm', grams: 220 },
    { label: 'sub 30cm', grams: 440 },
  ],
  'Subway Thon': [
    { label: 'sub 15cm', grams: 220 },
    { label: 'sub 30cm', grams: 440 },
  ],
  'Subway Veggie delite': [
    { label: 'sub 15cm', grams: 220 },
    { label: 'sub 30cm', grams: 440 },
  ],
  'Subway Cookie': [{ label: 'cookie', grams: 45 }],

  // Quick / Five Guys / burgers premium
  'Quick Giant': [{ label: 'burger', grams: 230 }],
  'Quick Supreme cheese': [{ label: 'burger', grams: 240 }],
  'Quick Long chicken': [{ label: 'burger', grams: 210 }],
  'Five Guys Hamburger': [{ label: 'burger', grams: 300 }],
  'Five Guys Cheeseburger': [{ label: 'burger', grams: 320 }],
  'Five Guys Frites cajun': [{ label: 'portion', grams: 200 }],
  'Big Fernand burger': [{ label: 'burger', grams: 250 }],
  'Smash burger': [{ label: 'burger', grams: 200 }],

  // Kebab & grec
  'Kebab durum': [{ label: 'durum', grams: 320 }],
  'Kebab galette': [{ label: 'galette', grams: 300 }],
  'Kebab poulet': [{ label: 'sandwich', grams: 280 }],
  'Grec frites': [{ label: 'sandwich', grams: 400 }],
  'Assiette grecque': [{ label: 'assiette', grams: 450 }],
  'Chawarma sandwich': [{ label: 'sandwich', grams: 280 }],

  // Tacos français (O'Tacos & assimilés)
  'Tacos francais': [
    { label: 'M (1 viande)', grams: 400 },
    { label: 'L (2 viandes)', grams: 550 },
    { label: 'XL (3 viandes)', grams: 700 },
  ],
  'Tacos francais poulet': [
    { label: 'M (1 viande)', grams: 400 },
    { label: 'L (2 viandes)', grams: 550 },
  ],
  'Tacos francais viande hachee': [
    { label: 'M (1 viande)', grams: 400 },
    { label: 'L (2 viandes)', grams: 550 },
  ],
  'Tacos francais cordon bleu': [
    { label: 'M (1 viande)', grams: 400 },
    { label: 'L (2 viandes)', grams: 550 },
  ],

  // Sandwicheries
  'Bagelstein bagel': [{ label: 'bagel', grams: 180 }],
  'Brioche Doree sandwich': [{ label: 'sandwich', grams: 200 }],
  'Paul sandwich': [{ label: 'sandwich', grams: 200 }],
  'Pret a manger wrap': [{ label: 'wrap', grams: 200 }],

  // Asiatique à emporter
  'Sushi box saumon': [{ label: 'box', grams: 250 }],
  'Wok poulet nouilles': [{ label: 'box', grams: 400 }],
  'Riz cantonais emporter': [{ label: 'box', grams: 300 }],
  'Poulet aigre-doux emporter': [{ label: 'box', grams: 300 }],

  // Boissons & desserts d'enseigne
  'Starbucks Latte': [
    { label: 'tall', grams: 350 },
    { label: 'grande', grams: 470 },
  ],
  'Starbucks Frappuccino': [
    { label: 'tall', grams: 350 },
    { label: 'grande', grams: 470 },
  ],
  'Krispy Kreme donut': [{ label: 'donut', grams: 60 }],
  'Dunkin donut': [{ label: 'donut', grams: 60 }],
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
    match:
      /\b(amande|noisette|noix|cajou|pistache|pecan|macadamia|graine)s?\b/i,
    presets: [{ label: 'poignée', grams: 30 }],
  },
  {
    // Sauces de fast-food & kebab : servies en dosette ou à la louche,
    // jamais à la cuillère à café — d'où des portions bien plus grosses
    // que pour une sauce de cuisine. Doit précéder la règle générique.
    match:
      /\bsauce\b.*\b(blanche|kebab|biggy|fromagere|fromagère|marocaine|mammouth|burger|samurai|samouraï|samourai|algerienne|algérienne|andalouse|deluxe|poivre|aigre-douce|chili thai|cocktail)\b/i,
    presets: [
      { label: 'dosette', grams: 25 },
      { label: 'c. à soupe', grams: 15 },
      { label: 'portion kebab', grams: 40 },
    ],
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
    match:
      /\b(barre|gateau|gâteau|tarte|cake|brownie|muffin|cupcake|eclair|éclair|millefeuille|paris-brest|baba)\b/i,
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
