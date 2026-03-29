// Piano alimentare — Dott. Luca Musella (Kairoo Studio di Nutrizione Clinica)
// Digiuno Intermittente 16:8 — Finestra alimentare 14:00–22:00
// Attivo dal 1 aprile 2026

export const DIET_START = '2026-04-01'

export const DIET_RULES = {
  fastingWindow: '22:00 – 14:00',
  eatingWindow: '14:00 – 22:00',
  morningAllowed: 'Solo acqua, tè, caffè o tisane non zuccherate',
  notes: [
    'Evitare qualsiasi apporto calorico nella finestra di digiuno (incluse bevande zuccherate, succhi, latte, snack)',
    'Mantenere buona idratazione durante la mattina',
    'Il primo pasto delle 14:00 deve essere completo e bilanciato',
    'Il pasto serale deve restare controllato, evitando compensazioni eccessive',
  ],
  dailyDrinks: [
    { name: 'Tè in tazza', qty: '1 Tazza e 1/2 (250g)' },
    { name: 'Tisana in tazza', qty: '1 Tazza (250g)' },
  ],
}

export interface DietOption {
  name: string
  qty: string
  frequency?: 'free' | 'once_week' | 'twice_week'
}

export interface MealComponent {
  label: string
  main: DietOption
  alternatives: DietOption[]
}

export interface Meal {
  name: string
  time: string
  components: MealComponent[]
  note?: string
}

export interface MealVariant {
  name: string
  components: { label: string; item: DietOption }[]
  frequency?: string
}

export interface Recipe {
  name: string
  ingredients: { name: string; qty: string }[]
  procedure: string
}

// ─── PRANZO (14:00) ──────────────────────────────────────────

export const PRANZO: Meal = {
  name: 'Pranzo',
  time: '14:00',
  note: 'Primo pasto della giornata. Aggiungere 1 cucchiaio di olio di cocco tra le alternative.',
  components: [
    {
      label: 'Carboidrati',
      main: { name: 'Quinoa', qty: '90g' },
      alternatives: [
        { name: 'Pasta integrale', qty: '80–90g' },
        { name: 'Polenta (farina di mais)', qty: '1 Piatto 90g' },
        { name: 'Miglio decorticato', qty: '90g' },
        { name: 'Riso basmati', qty: '90g' },
        { name: 'Avena', qty: '90g' },
        { name: 'Grano saraceno', qty: '90g' },
      ],
    },
    {
      label: 'Proteina',
      main: { name: 'Merluzzo o nasello', qty: '240g' },
      alternatives: [
        { name: 'Petto di pollo', qty: '150g', frequency: 'free' },
        { name: 'Tacchino — fesa', qty: '150g', frequency: 'free' },
        { name: 'Sogliola', qty: '200g', frequency: 'free' },
        { name: 'Spigola', qty: '200g', frequency: 'free' },
        { name: 'Tacchino petto', qty: '120g', frequency: 'free' },
        { name: 'Aringa', qty: '80g', frequency: 'free' },
        { name: 'Coniglio magro', qty: '150g', frequency: 'free' },
        { name: 'Vitellone tagli magri', qty: '120g', frequency: 'free' },
        { name: 'Orata fresca', qty: '140g', frequency: 'free' },
        { name: 'Gamberi', qty: '200g', frequency: 'free' },
        { name: 'Pesce spada', qty: '150g', frequency: 'free' },
        { name: 'Soia secca', qty: '50g', frequency: 'once_week' },
        { name: 'Calamaro', qty: '220g', frequency: 'once_week' },
        { name: 'Seppia', qty: '200g', frequency: 'once_week' },
      ],
    },
    {
      label: 'Verdura',
      main: { name: 'Bieta', qty: '200g' },
      alternatives: [
        { name: 'Carote', qty: '200g' },
        { name: 'Cetrioli', qty: '200g' },
        { name: 'Broccoli', qty: '200g' },
        { name: 'Carciofi', qty: '200g' },
        { name: 'Cavolfiore', qty: '200g' },
        { name: 'Radicchio rosso', qty: '200g' },
        { name: 'Radicchio verde', qty: '200g' },
        { name: 'Ravanelli', qty: '200g' },
        { name: 'Spinaci', qty: '200g' },
        { name: 'Finocchi', qty: '300g' },
        { name: 'Lattuga', qty: '100g' },
        { name: 'Cicoria', qty: '200g' },
      ],
    },
    {
      label: 'Condimento',
      main: { name: 'Olio di oliva extra vergine', qty: '2 Cucchiai (20g)' },
      alternatives: [],
    },
  ],
}

export const PRANZO_ALT: MealVariant[] = [
  {
    name: 'Spaghetti Shirataki con tofu, curcuma e zucchine',
    frequency: '1 volta alla settimana',
    components: [
      { label: 'Piatto unico', item: { name: 'Spaghetti Shirataki con tofu, curcuma e zucchine', qty: '200g' } },
    ],
  },
]

// ─── MERENDA (~17:00) ────────────────────────────────────────

export const MERENDA: Meal = {
  name: 'Merenda',
  time: '17:00',
  note: 'Lo yogurt deve essere bianco non zuccherato e non alla frutta.',
  components: [
    {
      label: 'Yogurt',
      main: { name: 'Yogurt Valsoia', qty: '125g' },
      alternatives: [],
    },
    {
      label: 'Frutta secca',
      main: { name: 'Noci secche', qty: '15g' },
      alternatives: [{ name: 'Pinoli', qty: '15g' }],
    },
  ],
}

export const MERENDA_ALT: MealVariant[] = [
  {
    name: 'Merenda Alternativa 1',
    frequency: '2 volte alla settimana',
    components: [
      { label: 'Yogurt', item: { name: 'Yogurt Greco 0% senza lattosio', qty: '120g' } },
      { label: 'Frutta', item: { name: 'Lamponi', qty: '100g' } },
    ],
  },
  {
    name: 'Merenda Alternativa 2',
    components: [
      { label: 'Frutta', item: { name: 'Fragole', qty: '250g' } },
      { label: 'Frutta secca', item: { name: 'Noci secche', qty: '15g' } },
    ],
  },
]

export const MERENDA_FRUTTA_ALT: DietOption[] = [
  { name: 'Kiwi', qty: '2 Frutti e 1/2 (200g)' },
  { name: 'Mirtilli', qty: '200g' },
  { name: 'Fragole', qty: '250g' },
  { name: 'Mele renette', qty: '1 Frutto e 1/2 (200g)' },
  { name: 'Pompelmo rosa', qty: '1 Frutto (250g)' },
  { name: 'Arance', qty: '1 Frutto (200g)' },
  { name: 'Lamponi', qty: '150g' },
  { name: 'Mele granny smith', qty: '1 Frutto e 1/2 (200g)' },
  { name: 'Pere', qty: '1 Frutto e 1/2 (200g)' },
  { name: 'Mandarini', qty: '2 Frutti (200g)' },
]

// ─── CENA (~20:00) ───────────────────────────────────────────

export const CENA: Meal = {
  name: 'Cena',
  time: '20:00',
  components: [
    {
      label: 'Pane',
      main: { name: 'Pane di grano duro', qty: '3 Fette (90g)' },
      alternatives: [{ name: 'Pane integrale', qty: '3 Fette (90g)' }],
    },
    {
      label: 'Proteina',
      main: { name: 'Petto di pollo', qty: '200g' },
      alternatives: [
        { name: 'Coniglio magro', qty: '200g', frequency: 'free' },
        { name: 'Tacchino — fesa', qty: '210g', frequency: 'free' },
        { name: 'Aringa', qty: '150g', frequency: 'free' },
        { name: 'Sgombro o maccarello', qty: '150g', frequency: 'free' },
        { name: 'Gamberi', qty: '300g', frequency: 'free' },
        { name: 'Calamaro', qty: '250g', frequency: 'free' },
        { name: 'Cernia', qty: '290g', frequency: 'free' },
        { name: 'Rombo', qty: '250g', frequency: 'free' },
        { name: 'Maiale legg. arista', qty: '180g', frequency: 'free' },
        { name: 'Vitellone tagli magri', qty: '180g', frequency: 'free' },
        { name: 'Merluzzo o nasello', qty: '300g', frequency: 'free' },
        { name: 'Sogliola', qty: '270g', frequency: 'free' },
        { name: 'Spigola', qty: '320g', frequency: 'free' },
        { name: 'Seppia', qty: '250g', frequency: 'free' },
        { name: 'Pesce spada', qty: '250g', frequency: 'free' },
        { name: 'Orata fresca', qty: '200g', frequency: 'free' },
        { name: 'Uova di gallina — intero', qty: '120g', frequency: 'once_week' },
        { name: 'Prosc. crudo di Parma magro', qty: '100g', frequency: 'once_week' },
        { name: 'Soia secca', qty: '60g', frequency: 'once_week' },
        { name: 'Salmone fresco', qty: '150g' },
        { name: 'Seitan al naturale', qty: '150g' },
      ],
    },
    {
      label: 'Verdura',
      main: { name: 'Bieta', qty: '200g' },
      alternatives: [
        { name: 'Carote', qty: '200g' },
        { name: 'Cetrioli', qty: '300g' },
        { name: 'Peperoni', qty: '200g' },
        { name: 'Melanzane', qty: '300g' },
        { name: 'Pomodori maturi', qty: '200g' },
        { name: 'Radicchio rosso', qty: '200g' },
        { name: 'Radicchio verde', qty: '200g' },
        { name: 'Ravanelli', qty: '200g' },
        { name: 'Spinaci', qty: '200g' },
        { name: 'Fagiolini freschi', qty: '250g' },
        { name: 'Finocchi', qty: '400g' },
        { name: 'Lattuga', qty: '100g' },
        { name: 'Zucchine', qty: '300g' },
        { name: 'Insalatina di carote, peperoni, papaya e mandorle', qty: '200g' },
      ],
    },
    {
      label: 'Condimento',
      main: { name: 'Olio di oliva extra vergine', qty: '1 Cucchiaio e 1/2 (15g)' },
      alternatives: [],
    },
  ],
}

export const CENA_ALT: MealVariant[] = [
  {
    name: 'Cena Alternativa 1',
    components: [
      { label: 'Piatto', item: { name: 'Tofu alla piastra con millefoglie di verdure', qty: '200g' } },
      { label: 'Pane', item: { name: 'Pane di grano duro / integrale', qty: '2 Fette e 1/2 (80g)' } },
    ],
  },
  {
    name: 'Cena Alternativa 2',
    components: [
      { label: 'Zuppa', item: { name: 'Vellutata zucca e patate', qty: '350g' } },
      { label: 'Proteina', item: { name: 'Petto di pollo', qty: '180g' } },
      { label: 'Pane', item: { name: 'Pane tostato', qty: '2 Fette (50g)' } },
    ],
  },
]

// ─── RICETTE ─────────────────────────────────────────────────

export const RECIPES: Recipe[] = [
  {
    name: 'Spaghetti Shirataki con tofu, curcuma e zucchine',
    ingredients: [
      { name: 'Spaghetti Shirataki Konjac', qty: '200g' },
      { name: 'Tofu', qty: '300g' },
      { name: 'Zucchine', qty: '200g' },
      { name: 'Yogurt greco 0% bianco', qty: '80g' },
      { name: 'Olio di oliva extra vergine', qty: '30g' },
      { name: 'Pepe nero', qty: '2g' },
      { name: 'Curcuma', qty: '2g' },
    ],
    procedure:
      'Tagliate le zucchine a rondelle e passatele al vapore per 5 minuti. Tenete da parte. Tagliate il tofu a dadini e passate al mixer con lo yogurt, la curcuma, sale e pepe q.b. Tritate bene fino a ricavare una crema granulosa. Fate cuocere a fuoco basso il composto con un po\' di acqua per 5 minuti, poi aggiungete gli spaghetti (scolati dall\'acqua di conservazione e sciacquati) insieme alle zucchine. Fate saltare aggiungendo poca acqua alla volta se necessario. Aggiustate di sale e fate amalgamare bene tutto.',
  },
  {
    name: 'Insalatina di carote, finocchi, arancia e mandorle',
    ingredients: [
      { name: 'Carote', qty: '75g' },
      { name: 'Finocchi', qty: '60g' },
      { name: 'Arancia', qty: '38g' },
      { name: 'Lamponi', qty: '15g' },
      { name: 'Semi di zucca secchi', qty: '8g' },
      { name: 'Mandorle dolci secche', qty: '4g' },
      { name: 'Menta', qty: '1g' },
    ],
    procedure:
      'Tagliare i finocchi a fettine sottili, l\'arancia a vivo e i lamponi in due parti. Per le carote usare un pelapatate così da ottenere dei petali da aggiungere agli altri ingredienti. Mescolare bene l\'insalata e completare con la menta spezzata con le mani, la granella di mandorle e i semi di zucca. Servire in un piatto da portata.',
  },
  {
    name: 'Tofu alla piastra con millefoglie di verdure',
    ingredients: [
      { name: 'Tofu', qty: '200g' },
      { name: 'Carote', qty: '62g' },
      { name: 'Melanzane', qty: '75g' },
      { name: 'Peperoni', qty: '62g' },
      { name: 'Zucchine', qty: '75g' },
      { name: 'Olio di oliva extra vergine', qty: '25g' },
    ],
    procedure:
      'Lavate e pulite tutti gli ortaggi: pelate le carote, private il peperone dei semi ed eliminate la calotta superiore e inferiore della melanzana e della zucchina. Affettateli in modo che abbiano la larghezza di 0,5 cm circa e la lunghezza di uno stampino di alluminio che utilizzerete per metterle al forno. Sbollentate in acqua leggermente salata le carote e i peperoni per 1 minuto. Adagiate le verdure affettate alternandole all\'interno dello stampino leggermente oleato e fate cuocere in forno per 10 minuti a 180 °C. Grigliate il tofu sulla piastra e servitelo con verdure croccanti.',
  },
  {
    name: 'Vellutata zucca e patate',
    ingredients: [
      { name: 'Zucca gialla', qty: '221g' },
      { name: 'Patate', qty: '111g' },
      { name: 'Olio di oliva extra vergine', qty: '11g' },
      { name: 'Aglio', qty: '4g' },
      { name: 'Rosmarino', qty: '4g' },
    ],
    procedure:
      'Tagliare a tocchetti la zucca e le patate, trasferire in una capiente pentola, coprire con acqua (circa tre bicchieri), unire l\'aglio, l\'olio e il prezzemolo e salare. Cuocere a fuoco moderato coperto per circa 1 ora, eliminare l\'aglio e il rosmarino. Frullare con un mixer ad immersione e servire.',
  },
]

// ─── PIANO SETTIMANALE PRE-GENERATO ─────────────────────────
// Varietà automatica per 7 giorni usando le alternative

export interface DayMealPlan {
  pranzo: { carb: string; protein: string; verdura: string }
  merenda: string
  cena: { protein: string; verdura: string }
}

export const WEEKLY_PLAN: DayMealPlan[] = [
  // Lunedì
  {
    pranzo: { carb: 'Quinoa 90g', protein: 'Merluzzo o nasello 240g', verdura: 'Bieta 200g' },
    merenda: 'Yogurt Valsoia 125g + Noci 15g',
    cena: { protein: 'Petto di pollo 200g', verdura: 'Zucchine 300g' },
  },
  // Martedì
  {
    pranzo: { carb: 'Pasta integrale 80g', protein: 'Petto di pollo 150g', verdura: 'Broccoli 200g' },
    merenda: 'Yogurt Greco 0% 120g + Lamponi 100g',
    cena: { protein: 'Spigola 320g', verdura: 'Spinaci 200g' },
  },
  // Mercoledì
  {
    pranzo: { carb: 'Riso basmati 90g', protein: 'Sogliola 200g', verdura: 'Carote 200g' },
    merenda: 'Fragole 250g + Noci 15g',
    cena: { protein: 'Sgombro o maccarello 150g', verdura: 'Finocchi 400g' },
  },
  // Giovedì
  {
    pranzo: { carb: 'Grano saraceno 90g', protein: 'Gamberi 200g', verdura: 'Finocchi 300g' },
    merenda: 'Yogurt Valsoia 125g + Pinoli 15g',
    cena: { protein: 'Salmone fresco 150g', verdura: 'Cetrioli 300g' },
  },
  // Venerdì — pranzo alternativo
  {
    pranzo: { carb: 'Spaghetti Shirataki', protein: 'con tofu, curcuma e zucchine 200g', verdura: '(piatto unico)' },
    merenda: 'Yogurt Greco 0% 120g + Mirtilli 100g',
    cena: { protein: 'Orata fresca 200g', verdura: 'Peperoni 200g' },
  },
  // Sabato
  {
    pranzo: { carb: 'Avena 90g', protein: 'Orata fresca 140g', verdura: 'Spinaci 200g' },
    merenda: 'Kiwi 200g + Noci 15g',
    cena: { protein: 'Coniglio magro 200g', verdura: 'Radicchio rosso 200g' },
  },
  // Domenica
  {
    pranzo: { carb: 'Miglio decorticato 90g', protein: 'Spigola 200g', verdura: 'Carciofi 200g' },
    merenda: 'Yogurt Valsoia 125g + Noci 15g',
    cena: { protein: 'Uova di gallina 120g', verdura: 'Melanzane 300g' },
  },
]

export const DAY_NAMES = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica']
