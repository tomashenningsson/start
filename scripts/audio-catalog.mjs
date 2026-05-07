// =====================================================================
// Stjärnjakten audio catalog
// =====================================================================
// Every utterance the app can speak, organized by category. Each entry
// becomes one MP3 file rendered by Azure Neural Speech.
//
// Categories map to public/audio/<category>/ subfolders:
//   numbers       — bare cardinals ("ett", "två", … "etthundra")
//   letters       — letter-name + "X som i Yyy" patterns
//   praise        — short positive feedback
//   instructions  — prompts and intros driving each game round
//   victory       — level-complete and game-end celebrations
//   phrases       — anything else (fallback bucket)
//
// Adding new strings? Just push to the relevant array. The generator
// will skip files that already exist (idempotent re-runs are cheap).
// =====================================================================

// Swedish cardinals 0–100 used by the runtime (NUMBER_WORDS / NUMBER_WORDS_EN).
export const SWEDISH_CARDINALS = [
  'noll', 'ett', 'två', 'tre', 'fyra', 'fem', 'sex', 'sju', 'åtta', 'nio',
  'tio', 'elva', 'tolv', 'tretton', 'fjorton', 'femton', 'sexton', 'sjutton', 'arton', 'nitton',
  'tjugo', 'tjugoett', 'tjugotvå', 'tjugotre', 'tjugofyra', 'tjugofem', 'tjugosex', 'tjugosju', 'tjugoåtta', 'tjugonio',
  'trettio', 'trettioett', 'trettiotvå', 'trettiotre', 'trettiofyra', 'trettiofem', 'trettiosex', 'trettiosju', 'trettioåtta', 'trettionio',
  'fyrtio', 'fyrtioett', 'fyrtiotvå', 'fyrtiotre', 'fyrtiofyra', 'fyrtiofem', 'fyrtiosex', 'fyrtiosju', 'fyrtioåtta', 'fyrtionio',
  'femtio', 'femtioett', 'femtiotvå', 'femtiotre', 'femtiofyra', 'femtiofem', 'femtiosex', 'femtiosju', 'femtioåtta', 'femtionio',
  'sextio', 'sextioett', 'sextiotvå', 'sextiotre', 'sextiofyra', 'sextiofem', 'sextiosex', 'sextiosju', 'sextioåtta', 'sextionio',
  'sjuttio', 'sjuttioett', 'sjuttiotvå', 'sjuttiotre', 'sjuttiofyra', 'sjuttiofem', 'sjuttiosex', 'sjuttiosju', 'sjuttioåtta', 'sjuttionio',
  'åttio', 'åttioett', 'åttiotvå', 'åttiotre', 'åttiofyra', 'åttiofem', 'åttiosex', 'åttiosju', 'åttioåtta', 'åttionio',
  'nittio', 'nittioett', 'nittiotvå', 'nittiotre', 'nittiofyra', 'nittiofem', 'nittiosex', 'nittiosju', 'nittioåtta', 'nittionio',
  'etthundra',
];

// "en"-form for animal counting (niva3): one anka, two ankor.
const ANIMAL_FORMS = [
  { single: 'anka', plural: 'ankor', article: 'en' },
  { single: 'groda', plural: 'grodor', article: 'en' },
  { single: 'fisk', plural: 'fiskar', article: 'en' },
  { single: 'sköldpadda', plural: 'sköldpaddor', article: 'en' },
  { single: 'svan', plural: 'svanar', article: 'en' },
  { single: 'utter', plural: 'uttrar', article: 'en' },
];

// niva2 alphabet pool.
const FOREST_LETTERS = [
  { letter: 'A', word: 'apa' },
  { letter: 'B', word: 'björn' },
  { letter: 'D', word: 'delfin' },
  { letter: 'F', word: 'fisk' },
  { letter: 'K', word: 'katt' },
  { letter: 'L', word: 'lejon' },
  { letter: 'M', word: 'mus' },
  { letter: 'O', word: 'orm' },
  { letter: 'P', word: 'pingvin' },
  { letter: 'R', word: 'räv' },
  { letter: 'S', word: 'sol' },
  { letter: 'T', word: 'tiger' },
];

// niva5 phonics pool.
const PHONICS_WORDS = [
  { letter: 'S', word: 'sol' },
  { letter: 'M', word: 'måne' },
  { letter: 'A', word: 'apa' },
  { letter: 'B', word: 'björn' },
  { letter: 'K', word: 'ko' },
  { letter: 'F', word: 'fisk' },
  { letter: 'T', word: 'tiger' },
  { letter: 'R', word: 'ros' },
  { letter: 'L', word: 'lejon' },
  { letter: 'P', word: 'pingvin' },
  { letter: 'G', word: 'gris' },
  { letter: 'O', word: 'orm' },
  { letter: 'N', word: 'näsa' },
  { letter: 'I', word: 'igelkott' },
];

// Full Swedish alphabet for the collector book and standalone alphabet game.
const FULL_ALPHABET = [
  { letter: 'A', word: 'Apa' },
  { letter: 'B', word: 'Björn' },
  { letter: 'C', word: 'Citron' },
  { letter: 'D', word: 'Delfin' },
  { letter: 'E', word: 'Elefant' },
  { letter: 'F', word: 'Fisk' },
  { letter: 'G', word: 'Gris' },
  { letter: 'H', word: 'Häst' },
  { letter: 'I', word: 'Igelkott' },
  { letter: 'J', word: 'Jordgubbe' },
  { letter: 'K', word: 'Katt' },
  { letter: 'L', word: 'Lejon' },
  { letter: 'M', word: 'Mus' },
  { letter: 'N', word: 'Noshörning' },
  { letter: 'O', word: 'Orm' },
  { letter: 'P', word: 'Pingvin' },
  { letter: 'Q', word: 'Quiz' },
  { letter: 'R', word: 'Räv' },
  { letter: 'S', word: 'Sol' },
  { letter: 'T', word: 'Tiger' },
  { letter: 'U', word: 'Uggla' },
  { letter: 'V', word: 'Varg' },
  { letter: 'W', word: 'Waffel' },
  { letter: 'X', word: 'Xylofon' },
  { letter: 'Y', word: 'Yoghurt' },
  { letter: 'Z', word: 'Zebra' },
  { letter: 'Å', word: 'Åsna' },
  { letter: 'Ä', word: 'Äpple' },
  { letter: 'Ö', word: 'Örn' },
];

// niva4 shape/color combinations.
const SHAPES = [
  { en: 'circle',   sv_sg: 'cirkel',    sv_pl: 'cirklar',   gender: 'en' },
  { en: 'square',   sv_sg: 'kvadrat',   sv_pl: 'kvadrater', gender: 'en' },
  { en: 'triangle', sv_sg: 'triangel',  sv_pl: 'trianglar', gender: 'en' },
  { en: 'star',     sv_sg: 'stjärna',   sv_pl: 'stjärnor',  gender: 'en' },
  { en: 'heart',    sv_sg: 'hjärta',    sv_pl: 'hjärtan',   gender: 'ett' },
];
const COLORS_NIVA4 = [
  { en: 'blue',   sv_en_form: 'blå',   sv_ett_form: 'blått',  sv_plural: 'blåa'   },
  { en: 'red',    sv_en_form: 'röd',   sv_ett_form: 'rött',   sv_plural: 'röda'   },
  { en: 'yellow', sv_en_form: 'gul',   sv_ett_form: 'gult',   sv_plural: 'gula'   },
  { en: 'green',  sv_en_form: 'grön',  sv_ett_form: 'grönt',  sv_plural: 'gröna'  },
  { en: 'purple', sv_en_form: 'lila',  sv_ett_form: 'lila',   sv_plural: 'lila'   },
  { en: 'pink',   sv_en_form: 'rosa',  sv_ett_form: 'rosa',   sv_plural: 'rosa'   },
];
function shapePhrase(shape, color, count) {
  // Mirrors src/app/draken/niva4/page.tsx::shapePhrase
  if (count === 1) {
    if (shape.gender === 'ett') return `ett ${color.sv_ett_form} ${shape.sv_sg}`;
    return `en ${color.sv_en_form} ${shape.sv_sg}`;
  }
  const numWord = SWEDISH_CARDINALS[count];
  return `${numWord} ${color.sv_plural} ${shape.sv_pl}`;
}

// niva7 color identification.
const COLOR_TARGETS = [
  { def: 'bananen',    color: 'gul' },
  { def: 'jordgubben', color: 'röd' },
  { def: 'havet',      color: 'blå' },
  { def: 'moroten',    color: 'orange' },
  { def: 'auberginen', color: 'lila' },
  { def: 'flamingon',  color: 'rosa' },
  { def: 'grodan',     color: 'grön' },
  { def: 'molnet',     color: 'vit' },
];

// niva9 shape identification (goal labels).
const NIVA9_SHAPES = ['cirkel', 'kvadrat', 'triangel', 'stjärna', 'hjärta'];

// niva12 opposites pool.
const OPPOSITES = [
  { a: 'sol',      b: 'måne'   },
  { a: 'stor',     b: 'liten'  },
  { a: 'glad',     b: 'ledsen' },
  { a: 'upp',      b: 'ner'    },
  { a: 'långsam',  b: 'snabb'  },
  { a: 'hög',      b: 'låg'    },
  { a: 'varm',     b: 'kall'   },
  { a: 'våt',      b: 'torr'   },
];

// niva13 day/night pool.
const DAY_NIGHT = [
  'Äta frukost', 'Borsta tänderna', 'Leka ute', 'Sova i sängen',
  'Duscha på morgonen', 'Läsa godnattsaga', 'Gå till förskolan',
  'Säga godnatt', 'Äta lunch', 'Ugglan tjuter',
];

// niva14 animal sound pool — must match ANIMAL_SOUND_TEXT in the page.
const ANIMAL_SOUNDS = ['voff voff', 'mjau', 'roar', 'kvack'];

// niva15 healthy/unhealthy food pool.
const FOODS_HEALTHY = ['äpple', 'broccoli', 'morot', 'banan', 'sallad', 'fisk', 'druvor', 'mjölk', 'bröd'];
const FOODS_TREAT   = ['tårta', 'godis', 'burgare', 'pommes', 'munk', 'läsk', 'choklad'];

// niva16 vehicles pool — exact strings from the page.
const VEHICLES = [
  { name: 'En bil',          purpose: 'kör på vägen'           },
  { name: 'En buss',         purpose: 'tar många till skolan'  },
  { name: 'En brandbil',     purpose: 'släcker bränder'        },
  { name: 'En ambulans',     purpose: 'hjälper sjuka'          },
  { name: 'En polisbil',     purpose: 'hjälper polisen'        },
  { name: 'En cykel',        purpose: 'cyklar man på'          },
  { name: 'Ett tåg',         purpose: 'rullar på spår'         },
  { name: 'En tunnelbana',   purpose: 'kör under jord'         },
  { name: 'En motorbåt',     purpose: 'glider på vattnet'      },
  { name: 'En segelbåt',     purpose: 'seglar med vinden'      },
  { name: 'Ett fartyg',      purpose: 'fraktar saker över havet' },
  { name: 'Ett flygplan',    purpose: 'flyger högt på himlen'  },
  { name: 'En helikopter',   purpose: 'svävar i luften'        },
  { name: 'En raket',        purpose: 'flyger till rymden'     },
];

// niva17 pattern items.
const PATTERN_LABELS = ['röd', 'gul', 'blå', 'grön', 'lila', 'stjärna', 'triangel', 'diamant', 'cirkel', 'kvadrat'];

// niva11 addition subjects used by part(n, subj).
const ADDITION_SUBJECTS = [
  { sg: 'äpple',     pl: 'äpplen'     },
  { sg: 'groda',     pl: 'grodor'     },
  { sg: 'stjärna',   pl: 'stjärnor'   },
  { sg: 'bi',        pl: 'bin'        },
  { sg: 'fjäril',    pl: 'fjärilar'   },
  { sg: 'jordgubbe', pl: 'jordgubbar' },
];
function part(n, subj) {
  // Mirrors src/app/draken/niva11/page.tsx::part
  if (n === 1) return `en ${subj.sg}`;
  return `${SWEDISH_CARDINALS[n]} ${subj.pl}`;
}

// niva1 ballong phrasing.
function ballongPhrase(n) {
  if (n === 1) return 'en ballong';
  return `${SWEDISH_CARDINALS[n]} ballonger`;
}

// minispel/farglagg color palette labels.
const PAINT_PALETTE = ['röd', 'orange', 'gul', 'grön', 'turkos', 'blå', 'lila', 'rosa', 'brun', 'vit'];

// minispel/bokstavsjakt target letters.
const HUNT_LETTERS = ['A', 'S', 'M', 'B', 'O', 'L', 'T', 'F'];

// skattjakt puzzle voice prompts (treasure-hunt narration).
const SKATTJAKT_VOICES = [
  'Vilken siffra är ett?',
  'Vilken siffra är två?',
  'Vilken siffra är tre?',
  'Vilken siffra är fyra?',
  'Vilken siffra är fem?',
  'Vilken siffra är sex?',
  'Vilken siffra är sju?',
  'Vilken siffra är åtta?',
  'Vilken siffra är nio?',
  'Vilken siffra är tio?',
  'Hitta bokstaven A, som i apa!',
  'Hitta bokstaven B, som i björn!',
  'Hitta bokstaven S, som i sol!',
  'Hitta bokstaven M, som i måne!',
  'Hitta bokstaven K, som i katt!',
  'Vilken är en cirkel?',
  'Vilken är en kvadrat?',
  'Vilken är en triangel?',
  'Vilken är en stjärna?',
  'Vilket är ett hjärta?',
];

// ord/page.tsx and bokstaver/page.tsx hint phrases — same shape: "<letter> som i <word>".
// Already covered by FULL_ALPHABET letters category.

// =====================================================================
// Build the categorized list of utterances.
// =====================================================================

function unique(list) {
  return Array.from(new Set(list));
}

function build() {
  const numbers = [];
  // bare cardinals 0-100
  SWEDISH_CARDINALS.forEach(w => numbers.push(w));
  // numerals 0-100 (digit-as-text — useSpeech may receive String(n))
  for (let i = 0; i <= 100; i++) numbers.push(String(i));

  const letters = [];
  // bare letter pronunciations
  FULL_ALPHABET.forEach(({ letter }) => letters.push(letter));
  // "X som i Word" — both lowercase ord/page style and capitalized samlarbok style
  FULL_ALPHABET.forEach(({ letter, word }) => {
    letters.push(`${letter} som i ${word}`);
    letters.push(`${letter} som i ${word.toLowerCase()}`);
  });
  FOREST_LETTERS.forEach(({ letter, word }) => letters.push(`${letter} som i ${word}`));
  PHONICS_WORDS.forEach(({ letter, word }) => letters.push(`${letter} som i ${word}`));

  const praise = [
    'Bra jobbat!',
    'Perfekt!',
    'Rätt!',
    'Försök igen!',
    'Hmm, försök igen!',
    'Nej, försök igen!',
    'Försök igen, lyssna noga!',
    'Försök igen! Räkna alla.',
    'Försök igen! Titta noga.',
    'Försök igen! Titta på mönstret.',
    'Försök igen! Leta efter rätt färg och form.',
    'Inte rätt, försök igen!',
    'Bra jobbat! Det stämmer!',
    'Bra härmat!',
    'Par!',
    'Alla par hittade!',
    'Vad fint!',
    'Wow så fint målat!',
    'Nej!',
    'Fel!',
    'För långsamt!',
    'Ja!',
  ];

  const victory = [
    'Jättebra! Du räddade ön!',
    'Fantastiskt jobbat!',
    'Wow, du klarade det!',
    'Du är Magimästare! Möt Regnbågsdraken!',
    'Allt har börjat om!',
  ];

  const instructions = [];

  // niva1: poppa N ballonger
  for (let n = 1; n <= 5; n++) instructions.push(`Poppa ${ballongPhrase(n)}!`);
  instructions.push('Det räcker! Du har redan poppat tillräckligt.');

  // niva2: hitta bokstaven X
  FOREST_LETTERS.forEach(({ letter }) => instructions.push(`Hitta bokstaven ${letter}!`));
  // The dynamic confirmation: "X som i Word!" — already covered by letters.
  FOREST_LETTERS.forEach(({ letter, word }) => instructions.push(`${letter} som i ${word}!`));

  // niva3: räkna alla / hur många / Ja! N animal!
  ANIMAL_FORMS.forEach(a => {
    instructions.push(`Räkna alla ${a.plural}!`);
    instructions.push(`Hur många ${a.plural} ser du?`);
    instructions.push(`Ja! ${a.article} ${a.single}!`);
    for (let n = 2; n <= 8; n++) {
      instructions.push(`Ja! ${SWEDISH_CARDINALS[n]} ${a.plural}!`);
    }
  });

  // niva4: lägg shapes in cave
  SHAPES.forEach(shape => {
    COLORS_NIVA4.forEach(color => {
      for (let n = 1; n <= 4; n++) {
        instructions.push(`Lägg ${shapePhrase(shape, color, n)} i grottan!`);
      }
    });
  });
  instructions.push('Det räcker! Du har redan lagt tillräckligt.');

  // niva5: vilken bokstav börjar X på + Ja! L som i word
  PHONICS_WORDS.forEach(({ letter, word }) => {
    instructions.push(`Vilken bokstav börjar ${word} på?`);
    instructions.push(`Ja! ${letter} som i ${word}!`);
  });

  // niva6: skattjakt voice strings
  SKATTJAKT_VOICES.forEach(v => instructions.push(v));

  // niva7: vilken färg har X / Ja! X är COLOR.
  COLOR_TARGETS.forEach(({ def, color }) => {
    instructions.push(`Vilken färg har ${def}?`);
    instructions.push(`Ja! ${def} är ${color}.`);
    // Tap-on-name button just speaks the def.
    instructions.push(def);
  });

  // niva8 / niva17: pattern intros
  instructions.push('Vad kommer härnäst i mönstret?');
  PATTERN_LABELS.forEach(p => instructions.push(`Rätt! ${p} kommer härnäst.`));

  // niva9: vilken är X / Ja! Den där är X.
  NIVA9_SHAPES.forEach(s => {
    instructions.push(`Vilken är ${s}?`);
    instructions.push(`Ja! Den där är ${s}.`);
  });

  // niva10: memory intros
  instructions.push('Hitta paren! Vänd två kort som matchar.');

  // niva11: addition prompts
  ADDITION_SUBJECTS.forEach(subj => {
    for (let a = 1; a <= 4; a++) {
      for (let b = 1; b <= 4; b++) {
        const sum = a + b;
        if (sum > 9) continue;
        instructions.push(`${part(a, subj)} plus ${part(b, subj)}, hur många blir det?`);
      }
    }
  });
  for (let n = 2; n <= 9; n++) instructions.push(`Ja! Det blir ${SWEDISH_CARDINALS[n]}!`);

  // niva12: motsatser
  OPPOSITES.forEach(({ a, b }) => {
    instructions.push(`Vad är motsatsen till ${a}?`);
    instructions.push(`Ja! ${a} och ${b} är motsatser.`);
    // tap-on-prompt button speaks just the prompt word
    instructions.push(a);
    instructions.push(b);
  });

  // niva13: dag eller natt
  DAY_NIGHT.forEach(t => instructions.push(`${t}. Är det dag eller natt?`));
  instructions.push('Ja, det gör vi på dagen!');
  instructions.push('Ja, det gör vi på natten!');
  instructions.push('Solen är uppe — det är dag!');
  instructions.push('Månen lyser — det är natt!');

  // niva14: härma
  instructions.push('Lyssna på rytmen och härma! Tryck när det är din tur.');
  ANIMAL_SOUNDS.forEach(s => instructions.push(s));

  // niva15: nyttig/onyttig
  [...FOODS_HEALTHY, ...FOODS_TREAT].forEach(f =>
    instructions.push(`${f}. Är det nyttigt eller onyttigt?`)
  );
  FOODS_HEALTHY.forEach(f => instructions.push(`Ja, ${f} är nyttigt!`));
  FOODS_TREAT.forEach(f => instructions.push(`Ja, ${f} är godis. Det är okej ibland!`));
  // Tap-on-name speaks just the food name
  [...FOODS_HEALTHY, ...FOODS_TREAT].forEach(f => instructions.push(f));

  // niva16: vehicles
  VEHICLES.forEach(({ name, purpose }) => {
    instructions.push(`${name} ${purpose}. Var hör den hemma?`);
    instructions.push(`Rätt! ${name} ${purpose}.`);
    instructions.push(name);
  });

  // niva18: count-stars + addition
  instructions.push('Räkna stjärnorna! Hur många är det?');
  for (let a = 1; a <= 5; a++) {
    for (let b = 1; b <= 5; b++) {
      instructions.push(`${a} plus ${b} är?`);
      const sum = a + b;
      const word = SWEDISH_CARDINALS[sum] ?? String(sum);
      instructions.push(`Ja! ${a} plus ${b} är ${word}.`);
    }
  }
  for (let n = 1; n <= 10; n++) {
    const word = SWEDISH_CARDINALS[n] ?? String(n);
    instructions.push(`Ja! Det är ${word} stjärnor.`);
  }

  // minispel hub
  instructions.push('Välj ett minispel!');

  // minispel/bokstavsjakt
  HUNT_LETTERS.forEach(L => {
    instructions.push(`Hitta alla ${L}!`);
    instructions.push(`Nu — hitta ${L}!`);
  });

  // minispel/memory + ballonger
  instructions.push('Hitta alla par!');
  instructions.push('Pop så många ballonger du hinner!');
  // Score readout: 0..50 plays nicely
  for (let score = 0; score <= 50; score++) {
    instructions.push(`Tiden är slut! Du fick ${score} poäng!`);
  }
  for (let moves = 6; moves <= 30; moves++) {
    instructions.push(`Klart! Du klarade det på ${moves} drag!`);
  }

  // minispel/farglagg
  instructions.push('Måla draken som du vill!');
  instructions.push('Ny målarbild!');
  PAINT_PALETTE.forEach(c => instructions.push(c));
  instructions.push('Sudd');

  // skattjakt confirmations and dynamic voice prompts.
  instructions.push('Inte rätt, försök igen!');
  instructions.push('Hur många finns det?');
  instructions.push('Vilket tal fattas i mönstret?');
  instructions.push('Vilket tal är störst?');
  // Tryck på siffran X för 0..20 (matches swedishWord())
  for (let n = 0; n <= 20; n++) {
    instructions.push(`Tryck på siffran ${SWEDISH_CARDINALS[n] ?? String(n)}`);
  }
  // Vad är A plus B? och Vad är A minus B?  — vanliga par 1..10
  for (let a = 1; a <= 10; a++) {
    for (let b = 1; b <= 10; b++) {
      instructions.push(`Vad är ${a} plus ${b}?`);
      if (a > b) instructions.push(`Vad är ${a} minus ${b}?`);
    }
  }
  // Vad är A gånger B? — 2..9 × 2..9
  for (let a = 2; a <= 9; a++) {
    for (let b = 2; b <= 9; b++) {
      instructions.push(`Vad är ${a} gånger ${b}?`);
    }
  }
  // Skip-count prompts (steg 2 och 3)
  instructions.push('Räkna 2 i taget. Vilken siffra fattas?');
  instructions.push('Räkna 3 i taget. Vilken siffra fattas?');

  // godis & ord standalone games
  instructions.push('Räkna föremålen!');

  // bokstaver/siffror standalone — already covered by alphabet/numbers

  // Fragments used by speakSequence() so the dragon's greeting and the
  // profile save confirmation play in the warm Azure Sofie voice even
  // when the player has set a custom name. Only the name itself falls
  // back to TTS — and even that is rare since "Glittra" is the default.
  const fragments = [
    'Hej',
    '! Jag heter',
    '. Hjälp mig rädda öarna!',
    'Sparat! Hej',
    'Sparat!',
    ',',
    'är glad att se dig!',
    'är glad att träffa dig!',
    'Daglig belöning! Du fick',
    'stjärnor!',
    'Glittra',
  ];

  // Phrases — generic bucket for misc. utterances.
  const phrases = [
    ...fragments,
    // Profile/welcome (player + dragon names are dynamic; we generate the
    // greeting templates as phrases-without-names so the runtime can fall
    // back to TTS for any with custom names — but the most common variants
    // get cached too).
    'Daglig belöning! Du fick 1 stjärnor!',
    'Daglig belöning! Du fick 2 stjärnor!',
    'Daglig belöning! Du fick 3 stjärnor!',
    'Daglig belöning! Du fick 4 stjärnor!',
    'Daglig belöning! Du fick 5 stjärnor!',
    'Spela en ö först! 🌟',
  ];
  // Default greeting (no custom names yet)
  phrases.push('Hej! Jag heter Glittra. Hjälp mig rädda de magiska öarna!');
  phrases.push('Sparat! Glittra är glad att träffa dig!');

  // niva18 number readouts (used by speak(NUMBER_WORDS[n]) and speak(String(n)))
  // — already in numbers.

  return {
    numbers:      unique(numbers),
    letters:      unique(letters),
    praise:       unique(praise),
    instructions: unique(instructions),
    victory:      unique(victory),
    phrases:      unique(phrases),
  };
}

export const CATALOG = build();

export const ALL_ENTRIES = Object.entries(CATALOG).flatMap(([category, items]) =>
  items.map(text => ({ category, text }))
);
