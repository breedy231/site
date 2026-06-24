// ─────────────────────────────────────────────────────────────────────────────
// HONEYMOON ITINERARY — SINGLE SOURCE OF TRUTH
//
// This is the only file you need to edit to update the tracker at /honeymoon.
// Everything (hero, stops, day cards, transit rows, maps links, packing list,
// budget) renders from the data below.
//
// QUICK EDITING GUIDE
//   • Dates/times/flight numbers: edit the relevant `transits` row or `day`.
//   • Mark something booked: set `booked: true` on a transit or budget item.
//   • Add a place: add to a day's `spots` array — `mapsQuery` becomes a
//     Google/Apple Maps link automatically.
//   • Add a packing/to-book item: add to `checklist` below.
//   • Budget: edit `budget` — totals compute automatically; `est: true` marks
//     a number as a rough estimate (shows a "~").
//
// Flights, hotels, and ferries are all booked (real values below). Remaining
// `booked: false` items are reservations/tickets still to sort.
// ─────────────────────────────────────────────────────────────────────────────

export type TagKind = "transport" | "stay" | "activity" | "food" | "booked"

export interface Spot {
  name: string
  /** Free-text query opened in Google/Apple Maps. */
  mapsQuery: string
  /** Optional external link (official site / booking). */
  url?: string
  note?: string
}

export interface Tag {
  kind: TagKind
  label: string
}

export interface Day {
  /** Stable id — used to persist check-off + notes in localStorage. Don't reuse. */
  id: string
  dateLabel: string // e.g. "Aug 24"
  part: string // e.g. "Arrival" / "Full Day" / "Morning"
  title: string
  desc: string
  tags?: Tag[]
  spots?: Spot[]
}

export interface Stop {
  id: string
  number: string // "01"
  tag: string // "Stop One"
  /** Name rendered with the part in <em> italicised/accent. */
  name: { lead?: string; em: string; trail?: string }
  dates: string
  days: Day[]
}

export interface Transit {
  id: string
  icon: string // ✈ / ⛴
  /** Bolded lead fragment, then the rest of the line. */
  lead: string
  text: string
  booked: boolean
  /** Override the auto badge text if you like. */
  badge?: string
}

export interface ChecklistItem {
  id: string
  label: string
  category: "To Book" | "Packing" | "Before We Go"
  done?: boolean // default-checked seed; live state is stored in localStorage
}

export interface BudgetItem {
  id: string
  label: string
  amount: number // USD
  booked: boolean
  est?: boolean // show "~" for rough estimates
}

export interface TripMeta {
  title: { lead: string; em: string }
  travelers: string
  dateRange: string
  subtitle: string
  route: { label: string; highlight?: boolean }[]
  stats: { num: string; label: string }[]
}

// ── META ─────────────────────────────────────────────────────────────────────
export const meta: TripMeta = {
  title: { lead: "Our", em: "Honeymoon" },
  travelers: "Brendan & Scott · August–September 2026",
  dateRange: "August 23 – September 13, 2026",
  subtitle: "London · Greek Islands · Côte d'Azur · New York",
  route: [
    { label: "Chicago", highlight: true },
    { label: "London" },
    { label: "Mykonos" },
    { label: "Paros" },
    { label: "Milos" },
    { label: "Nice" },
    { label: "New York" },
    { label: "Home", highlight: true },
  ],
  stats: [
    { num: "21", label: "Days Away" },
    { num: "7", label: "Destinations" },
    { num: "6", label: "Flights" },
    { num: "3", label: "Islands" },
    { num: "Aug 23", label: "Departure" },
    { num: "Sep 13", label: "Home" },
  ],
}

// ── STOPS ──────────────────────────────────────────────────────────────────--
export const stops: Stop[] = [
  {
    id: "departure",
    number: "01",
    tag: "Departure",
    name: { lead: "Chicago ", em: "to", trail: " London" },
    dates: "Sunday, August 23",
    days: [
      {
        id: "dep-aug23",
        dateLabel: "Aug 23",
        part: "Evening",
        title: "Depart O'Hare for London Heathrow",
        desc: "An Uber from Wrigleyville to ORD, then the overnight flight begins. British Airways First Class — fully flat beds, champagne, the works. Wake up over the Atlantic with England below.",
        tags: [
          { kind: "transport", label: "British Airways 296 · First" },
          { kind: "booked", label: "✓ Booked" },
          { kind: "transport", label: "ORD → LHR" },
        ],
        spots: [
          {
            name: "Chicago O'Hare (ORD)",
            mapsQuery: "O'Hare International Airport",
          },
        ],
      },
    ],
  },
  {
    id: "london",
    number: "02",
    tag: "Stop One",
    name: { em: "London", trail: ", England" },
    dates: "August 24–25 · 2 nights",
    days: [
      {
        id: "lon-aug24",
        dateLabel: "Aug 24",
        part: "Arrival",
        title: "Land at Heathrow · Settle In",
        desc: "Morning arrival into Terminal 5. Transfer to the Bankside Hotel (Autograph Collection) on the South Bank, rest, and ease into London time. An afternoon walk — the Thames, Southbank, wherever the mood takes you.",
        tags: [
          { kind: "transport", label: "LHR Terminal 5" },
          { kind: "stay", label: "Bankside Hotel" },
        ],
        spots: [
          {
            name: "Bankside Hotel, Autograph Collection",
            mapsQuery: "Bankside Hotel Autograph Collection London",
          },
          {
            name: "The Wallace Collection",
            mapsQuery: "The Wallace Collection, London",
          },
          { name: "Tate Modern", mapsQuery: "Tate Modern, London" },
          { name: "Regent's Park", mapsQuery: "Regent's Park, London" },
        ],
      },
      {
        id: "lon-aug25",
        dateLabel: "Aug 25",
        part: "Full Day",
        title: "A Day in the City",
        desc: "One full day to soak up London — the shops, the markets, a West End show in the evening. Book theatre ahead; the good productions sell out weeks out.",
        tags: [
          { kind: "activity", label: "West End Theatre" },
          { kind: "food", label: "Dinner at Dean St Townhouse" },
          { kind: "transport", label: "Tube / Bus" },
        ],
        spots: [
          { name: "Borough Market", mapsQuery: "Borough Market, London" },
          {
            name: "Liberty London",
            mapsQuery: "Liberty London, Great Marlborough St",
          },
          {
            name: "Fortnum & Mason",
            mapsQuery: "Fortnum & Mason, Piccadilly, London",
          },
          { name: "Savile Row", mapsQuery: "Savile Row, London" },
          {
            name: "Dean Street Townhouse",
            mapsQuery: "Dean Street Townhouse, Soho, London",
          },
        ],
      },
    ],
  },
  {
    id: "mykonos",
    number: "03",
    tag: "Island One",
    name: { em: "Mykonos", trail: ", Greece" },
    dates: "August 26–28 · 2 nights",
    days: [
      {
        id: "myk-aug26",
        dateLabel: "Aug 26",
        part: "Arrival",
        title: "Touch Down on the Cyclades",
        desc: "Direct from Heathrow into Mykonos (BA 668) — the only Greek island with a direct Heathrow connection. Transfer to Rocabella Mykonos, find the water, and let Greece begin.",
        tags: [
          { kind: "stay", label: "Rocabella Mykonos" },
          { kind: "food", label: "Dinner in Mykonos Town" },
        ],
        spots: [
          {
            name: "Rocabella Mykonos",
            mapsQuery: "Rocabella Mykonos Hotel",
          },
          { name: "Mykonos Windmills", mapsQuery: "Windmills of Mykonos" },
          { name: "Little Venice", mapsQuery: "Little Venice, Mykonos" },
        ],
      },
      {
        id: "myk-aug27",
        dateLabel: "Aug 27",
        part: "Full Day",
        title: "Elia Beach · Mykonos Town",
        desc: "Mykonos does beaches and nightlife better than almost anywhere. Elia or Super Paradise for the day, then Mykonos Town at sunset. Consider a beach club day with a minimum spend — Scorpios and Jackie O' are the iconic options.",
        tags: [
          { kind: "activity", label: "Beach Club" },
          { kind: "activity", label: "Town + Windmills" },
          { kind: "food", label: "Drinks & Nightlife" },
        ],
        spots: [
          { name: "Elia Beach", mapsQuery: "Elia Beach, Mykonos" },
          { name: "Scorpios", mapsQuery: "Scorpios Mykonos" },
          {
            name: "Jackie O' Beach",
            mapsQuery: "Jackie O' Beach Club Mykonos",
          },
        ],
      },
      {
        id: "myk-aug28",
        dateLabel: "Aug 28",
        part: "Morning",
        title: "Early Breakfast · 9:40am Ferry to Paros",
        desc: "One last breakfast in Mykonos, then the 9:40am high-speed ferry south — roughly 40 minutes across brilliant blue water.",
        tags: [{ kind: "transport", label: "Mykonos → Paros · 9:40am ferry" }],
      },
    ],
  },
  {
    id: "paros",
    number: "04",
    tag: "Island Two",
    name: { em: "Paros", trail: ", Greece" },
    dates: "August 28–30 · 2 nights",
    days: [
      {
        id: "par-aug28",
        dateLabel: "Aug 28",
        part: "Arrival",
        title: "Welcome to a Quieter Island",
        desc: "Paros is the antidote to Mykonos — still gorgeous, still Cycladic, but calmer. Check in at the Argonauta Hotel in Parikia. The harbor at Naoussa is one of the prettiest in Greece. Arrive, settle in, breathe.",
        tags: [
          { kind: "stay", label: "Argonauta Hotel" },
          { kind: "food", label: "Dinner in Naoussa" },
        ],
        spots: [
          { name: "Argonauta Hotel", mapsQuery: "Argonauta Hotel Paros" },
          { name: "Naoussa", mapsQuery: "Naoussa, Paros, Greece" },
        ],
      },
      {
        id: "par-aug29",
        dateLabel: "Aug 29",
        part: "Full Day",
        title: "Naoussa · Day Trip to Antiparos",
        desc: "The 30-minute boat to tiny Antiparos is one of the best day trips in the Cyclades — near-empty beaches and a relaxed village (the sauna-guy recommendation). A sailboat ride around the islands fits the afternoon perfectly.",
        tags: [
          { kind: "activity", label: "Antiparos Day Trip" },
          { kind: "activity", label: "Sailboat Ride" },
          { kind: "food", label: "Seafood Dinner" },
        ],
        spots: [{ name: "Antiparos", mapsQuery: "Antiparos, Greece" }],
      },
      {
        id: "par-aug30",
        dateLabel: "Aug 30",
        part: "Morning",
        title: "Breakfast · 10:10am Ferry to Milos",
        desc: "Morning coffee in Paros, then the 10:10am ferry southwest to Milos — about 1 hour 45 on the fastest service.",
        tags: [{ kind: "transport", label: "Paros → Milos · 10:10am ferry" }],
      },
    ],
  },
  {
    id: "milos",
    number: "05",
    tag: "Island Three",
    name: { em: "Milos", trail: ", Greece" },
    dates: "August 30 – September 1 · 2 nights",
    days: [
      {
        id: "mil-aug30",
        dateLabel: "Aug 30",
        part: "Arrival",
        title: "The Volcanic Island",
        desc: "Milos is arguably the most dramatic landscape in the Cyclades — shaped by ancient volcanism into lunar-white cliffs, turquoise coves, and sulfuric hot springs. Check in at Salt Suites (by Mr & Mrs White) and explore.",
        tags: [
          { kind: "stay", label: "Salt Suites" },
          { kind: "activity", label: "Rent Car or Scooter" },
        ],
        spots: [
          {
            name: "Salt Suites by Mr & Mrs White",
            mapsQuery: "Salt Suites Milos",
          },
        ],
      },
      {
        id: "mil-aug31",
        dateLabel: "Aug 31",
        part: "Full Day",
        title: "Sarakiniko · Kleftiko · Firopotamos",
        desc: "The moon-white pumice landscape of Sarakiniko is unmissable. Kleftiko sea caves are best by boat. In the evening, a winery tour — Milos produces excellent local wine.",
        tags: [
          { kind: "activity", label: "Sarakiniko Beach" },
          { kind: "activity", label: "Kleftiko Sea Caves (boat)" },
          { kind: "activity", label: "Winery Tour" },
        ],
        spots: [
          { name: "Sarakiniko Beach", mapsQuery: "Sarakiniko Beach, Milos" },
          { name: "Kleftiko", mapsQuery: "Kleftiko, Milos" },
          { name: "Firopotamos", mapsQuery: "Firopotamos, Milos" },
        ],
      },
      {
        id: "mil-sep1",
        dateLabel: "Sep 1",
        part: "Morning",
        title: "Early Flight · Athens Layover · On to Nice",
        desc: "Early Sky Express flight from Milos (GQ 419, 8:55am) to Athens — about 40 minutes. A layover at Athens, then the early-afternoon Aegean flight to Nice (A3 690, 1:35pm). Arrive on the Riviera in time for dinner.",
        tags: [
          {
            kind: "transport",
            label: "MLO → ATH · Sky Express GQ 419 · 8:55am",
          },
          { kind: "transport", label: "ATH → NCE · Aegean A3 690 · 1:35pm" },
        ],
      },
    ],
  },
  {
    id: "nice",
    number: "06",
    tag: "Stop Two",
    name: { em: "Nice", trail: ", Côte d'Azur" },
    dates: "September 1–4 · 3 nights",
    days: [
      {
        id: "nce-sep1",
        dateLabel: "Sep 1",
        part: "Arrival",
        title: "Bienvenue sur la Riviera",
        desc: "Arrive early afternoon from Athens and check in at Le Méridien Nice, right on the Promenade des Anglais. Vieux-Nice and the best rosé in the world are waiting. A light dinner and an early night — the Riviera rewards those who sleep.",
        tags: [
          { kind: "stay", label: "Le Méridien Nice" },
          { kind: "food", label: "Dinner in Vieux-Nice" },
        ],
        spots: [
          { name: "Le Méridien Nice", mapsQuery: "Le Méridien Nice" },
          {
            name: "Promenade des Anglais",
            mapsQuery: "Promenade des Anglais, Nice",
          },
          {
            name: "Vieux-Nice (Old Town)",
            mapsQuery: "Vieux Nice, Nice, France",
          },
        ],
      },
      {
        id: "nce-sep2",
        dateLabel: "Sep 2",
        part: "Full Day",
        title: "Nice · Èze · The Corniche",
        desc: "A perfect Riviera day: the Old Town market in the morning, then the Grande Corniche to the perched village of Èze for lunch and vertigo-inducing views. Spa in the afternoon if the mood strikes.",
        tags: [
          { kind: "activity", label: "Cours Saleya Market" },
          { kind: "activity", label: "Èze Village" },
          { kind: "activity", label: "Spa Day" },
          { kind: "food", label: "Fancy Dinner" },
        ],
        spots: [
          { name: "Cours Saleya Market", mapsQuery: "Cours Saleya, Nice" },
          { name: "Èze Village", mapsQuery: "Èze, France" },
        ],
      },
      {
        id: "nce-sep3",
        dateLabel: "Sep 3",
        part: "Full Day",
        title: "Day Trip: Monaco",
        desc: "A 20-minute train ride to the most glamorous microstate in Europe. The Casino de Monte-Carlo, a harbor full of superyachts, a long lunch overlooking it all. Back to Nice for a final Riviera dinner.",
        tags: [
          { kind: "activity", label: "Monaco Day Trip" },
          { kind: "activity", label: "Casino de Monte-Carlo" },
          { kind: "food", label: "Final Nice Dinner" },
        ],
        spots: [
          {
            name: "Casino de Monte-Carlo",
            mapsQuery: "Casino de Monte-Carlo, Monaco",
          },
        ],
      },
    ],
  },
  {
    id: "nyc",
    number: "07",
    tag: "Grand Finale",
    name: { em: "New York", trail: " City" },
    dates: "September 4–8 · US Open",
    days: [
      {
        id: "nyc-sep4",
        dateLabel: "Sep 4",
        part: "Arrival",
        title: "Into New York",
        desc: "La Compagnie into Newark (B0 200, 12:25pm dep) — all-business class, so you arrive refreshed. Transfer to the Moxy NYC Chelsea. New York hits differently after two weeks in Europe.",
        tags: [
          { kind: "stay", label: "Moxy NYC Chelsea" },
          { kind: "food", label: "Welcome Back to America Dinner" },
        ],
        spots: [{ name: "Moxy NYC Chelsea", mapsQuery: "Moxy NYC Chelsea" }],
      },
      {
        id: "nyc-sep5",
        dateLabel: "Sep 5",
        part: "Saturday",
        title: "The City",
        desc: "A day in New York — whatever you want it to be: a museum, a walk across the Brooklyn Bridge, shopping in SoHo, a long brunch.",
        tags: [
          { kind: "activity", label: "Explore NYC" },
          { kind: "food", label: "Dinner Out" },
        ],
        spots: [
          { name: "Brooklyn Bridge", mapsQuery: "Brooklyn Bridge, New York" },
        ],
      },
      {
        id: "nyc-sep6",
        dateLabel: "Sep 6",
        part: "Sunday · Match Day",
        title: "US Open — Arthur Ashe Stadium",
        desc: "Sunday at Flushing Meadows — the best players still in it, the roar of the crowd, the best tennis in the world. Tickets are booked.",
        tags: [
          { kind: "activity", label: "US Open · Arthur Ashe" },
          { kind: "booked", label: "✓ Tickets Booked" },
          { kind: "food", label: "Post-match Dinner" },
        ],
        spots: [
          {
            name: "Arthur Ashe Stadium",
            mapsQuery: "Arthur Ashe Stadium, Flushing Meadows",
          },
        ],
      },
      {
        id: "nyc-sep7",
        dateLabel: "Sep 7",
        part: "Last Full Day",
        title: "Final New York Day · Farewell Dinner",
        desc: "The last full day of the honeymoon. Whatever you've been saving for the end — and a dinner worth remembering before flying home tomorrow.",
        tags: [
          { kind: "activity", label: "Explore NYC" },
          { kind: "food", label: "Farewell Dinner — make it special" },
        ],
      },
      {
        id: "nyc-sep8",
        dateLabel: "Sep 8+",
        part: "Home",
        title: "Back to Chicago · Recovery",
        desc: "Fly home to O'Hare on Delta (DL 2240), then recovery and a spa day through Sep 13. The honeymoon ends, the marriage continues.",
        tags: [
          { kind: "transport", label: "NYC → ORD · DL 2240" },
          { kind: "activity", label: "Spa / Recovery Day" },
          { kind: "transport", label: "Home ❤" },
        ],
      },
    ],
  },
]

// ── TRANSITS (rendered between stops, in order) ────────────────────────────────
export const transits: Transit[] = [
  {
    id: "t-lon-myk",
    icon: "✈",
    lead: "Aug 26 morning",
    text: "British Airways 668 direct · LHR T5 → Mykonos JMK · ~4 hours",
    booked: true,
  },
  {
    id: "t-myk-par",
    icon: "⛴",
    lead: "Aug 28 · 9:40am",
    text: "High-speed ferry · Mykonos → Paros · ~40 minutes",
    booked: true,
  },
  {
    id: "t-par-mil",
    icon: "⛴",
    lead: "Aug 30 · 10:10am",
    text: "High-speed ferry · Paros → Milos · ~1 hour 45 minutes",
    booked: true,
  },
  {
    id: "t-mil-nce",
    icon: "✈",
    lead: "Sep 1",
    text: "Sky Express GQ 419: MLO 8:55am → ATH · then Aegean A3 690: ATH 1:35pm → NCE",
    booked: true,
  },
  {
    id: "t-nce-nyc",
    icon: "✈",
    lead: "Sep 4 · 12:25pm",
    text: "La Compagnie B0 200 all-business · NCE → EWR · Direct",
    booked: true,
  },
  {
    id: "t-nyc-ord",
    icon: "✈",
    lead: "Sep 8",
    text: "Delta DL 2240 · New York → Chicago O'Hare",
    booked: true,
  },
]

// ── CHECKLIST (To Book / Packing / Before We Go) ───────────────────────────────
export const checklist: ChecklistItem[] = [
  {
    id: "cl-westend",
    label: "Book West End show (London)",
    category: "To Book",
  },
  {
    id: "cl-deanst",
    label: "Reserve Dean Street Townhouse dinner",
    category: "To Book",
  },
  {
    id: "cl-beachclub",
    label: "Reserve Mykonos beach club (Scorpios / Jackie O')",
    category: "To Book",
  },
  {
    id: "cl-milosboat",
    label: "Book Kleftiko boat tour (Milos)",
    category: "To Book",
  },
  {
    id: "cl-antiparos",
    label: "Book Antiparos sailboat day (Paros)",
    category: "To Book",
  },
  {
    id: "cl-passport",
    label: "Check passports valid 6+ months past travel",
    category: "Before We Go",
  },
  { id: "cl-insurance", label: "Travel insurance", category: "Before We Go" },
  {
    id: "cl-euro",
    label: "Get euros / set up cards for travel",
    category: "Before We Go",
  },
  {
    id: "cl-esim",
    label: "EU + UK eSIM / data plan",
    category: "Before We Go",
  },
  { id: "cl-adapters", label: "UK + EU plug adapters", category: "Packing" },
  {
    id: "cl-suncare",
    label: "Sunscreen, swimwear, beach gear",
    category: "Packing",
  },
  {
    id: "cl-formal",
    label: "Formal wear (theatre, casino, fancy dinners)",
    category: "Packing",
  },
]

// ── BUDGET (USD; est: true shows "~") ──────────────────────────────────────────
export const budget: BudgetItem[] = [
  {
    id: "b-ba296",
    label: "Flight · BA 296 ORD→LHR (First)",
    amount: 7600,
    booked: true,
    est: true,
  },
  {
    id: "b-ba668",
    label: "Flight · BA 668 LHR→Mykonos",
    amount: 275,
    booked: true,
    est: true,
  },
  {
    id: "b-greece",
    label: "Flights · Sky Express GQ 419 + Aegean A3 690 →Nice",
    amount: 450,
    booked: true,
    est: true,
  },
  {
    id: "b-lacomp",
    label: "Flight · La Compagnie B0 200 NCE→EWR",
    amount: 4510,
    booked: true,
    est: true,
  },
  {
    id: "b-dl2240",
    label: "Flight · Delta DL 2240 NYC→ORD (Sep 8)",
    amount: 120,
    booked: true,
    est: true,
  },
  {
    id: "b-ferries",
    label: "Greek island ferries (×2)",
    amount: 0,
    booked: true,
  },
  { id: "b-hotels", label: "Hotels (6 stops)", amount: 0, booked: true },
  {
    id: "b-usopen",
    label: "US Open tickets (Sun Sep 6)",
    amount: 0,
    booked: true,
  },
]
