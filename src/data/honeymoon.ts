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

// ── HOUR-BY-HOUR TIMELINE ──────────────────────────────────────────────────--
// Optional granular schedule for a day. A day can have a narrative `desc` AND a
// `timeline` — the timeline renders as a collapsible "hour-by-hour" sub-list
// under the day card. Use it for days with real logistics (transfers, ferries,
// reservation slots). Days without one just render the narrative as before.
export type TimelineKind =
  | "travel" // a transfer leg — taxi, ferry, flight, walk
  | "meal" // food / wine
  | "activity" // beach, town, sightseeing
  | "checkin" // hotel arrival / settling in
  | "downtime" // rest, nap, slow morning

export interface TimelineEntry {
  /** Clock label, e.g. "4:50pm". Keep them in chronological order. */
  time: string
  title: string
  /** One line of specifics — what/where/why. */
  detail?: string
  kind: TimelineKind
  /** How long the thing itself takes, e.g. "2h", "45 min". */
  duration?: string
  /** For `travel` legs: door-to-door estimate, e.g. "~20 min taxi". */
  travelTime?: string
  /** Reservation state — drives a small chip. */
  booking?: "booked" | "to-book" | "walk-in"
  /** Opens in Maps, same behavior as a Spot. */
  mapsQuery?: string
}

export interface Day {
  /** Stable id — used to persist check-off + notes in localStorage. Don't reuse. */
  id: string
  /** Real calendar date, ISO yyyy-mm-dd — powers "today" detection. */
  date: string
  dateLabel: string // e.g. "Aug 24"
  part: string // e.g. "Arrival" / "Full Day" / "Morning"
  title: string
  desc: string
  tags?: Tag[]
  spots?: Spot[]
  /** Optional hour-by-hour breakdown (renders collapsed under the card). */
  timeline?: TimelineEntry[]
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
  dateRange: "August 23 – September 8, 2026",
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
    { num: "16", label: "Nights Away" },
    { num: "7", label: "Destinations" },
    { num: "6", label: "Flights" },
    { num: "3", label: "Islands" },
    { num: "Aug 23", label: "Departure" },
    { num: "Sep 8", label: "Home" },
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
        date: "2026-08-23",
        dateLabel: "Aug 23",
        part: "Evening",
        title: "Depart O'Hare for London Heathrow",
        desc: "An Uber from Wrigleyville to O'Hare for the 9:15pm departure, then the overnight flight begins. British Airways First Class — fully flat beds, champagne, the works. Wake up over the Atlantic with England below.",
        tags: [
          { kind: "transport", label: "British Airways 296 · First" },
          { kind: "booked", label: "✓ Booked" },
          { kind: "transport", label: "ORD → LHR · 9:15pm" },
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
        date: "2026-08-24",
        dateLabel: "Aug 24",
        part: "Day 1 · Arrival",
        title: "Land 11:15am · Bankside & Borough Market",
        desc: "Land at Heathrow around 11:15am and drop bags at the Bankside Hotel (Autograph Collection) on the South Bank. Lunch at Borough Market, then Shakespeare's Globe and the Tate Modern next door, and a walk up through Regent's Park (maybe La Fromagerie). Martinis at the Hawksmoor bar in King's Cross, then dinner at Dishoom King's Cross.",
        tags: [
          { kind: "transport", label: "Land LHR ~11:15am" },
          { kind: "stay", label: "Bankside Hotel" },
          { kind: "activity", label: "Shakespeare's Globe" },
          { kind: "food", label: "Borough Market Lunch" },
          { kind: "food", label: "Dishoom King's Cross" },
        ],
        spots: [
          {
            name: "Bankside Hotel, Autograph Collection",
            mapsQuery: "Bankside Hotel Autograph Collection London",
          },
          { name: "Borough Market", mapsQuery: "Borough Market, London" },
          {
            name: "Shakespeare's Globe",
            mapsQuery: "Shakespeare's Globe, London",
          },
          { name: "Tate Modern", mapsQuery: "Tate Modern, London" },
          { name: "Regent's Park", mapsQuery: "Regent's Park, London" },
          {
            name: "La Fromagerie",
            mapsQuery: "La Fromagerie Marylebone, London",
          },
          {
            name: "Hawksmoor Bar, King's Cross",
            mapsQuery: "Hawksmoor King's Cross, London",
          },
          {
            name: "Dishoom King's Cross",
            mapsQuery: "Dishoom King's Cross, London",
          },
        ],
      },
      {
        id: "lon-aug25",
        date: "2026-08-25",
        dateLabel: "Aug 25",
        part: "Day 2",
        title: "Shops · The Wallace Collection · Tea",
        desc: "A day for the shops: Liberty of London and Fortnum & Mason, then the Wallace Collection. Afternoon tea at Dean Street Townhouse to close out London.",
        tags: [
          { kind: "activity", label: "Liberty + Fortnum & Mason" },
          { kind: "activity", label: "The Wallace Collection" },
          { kind: "food", label: "Tea at Dean St Townhouse" },
        ],
        spots: [
          {
            name: "Liberty London",
            mapsQuery: "Liberty London, Great Marlborough St",
          },
          {
            name: "Fortnum & Mason",
            mapsQuery: "Fortnum & Mason, Piccadilly, London",
          },
          {
            name: "The Wallace Collection",
            mapsQuery: "The Wallace Collection, London",
          },
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
        date: "2026-08-26",
        dateLabel: "Aug 26",
        part: "Day 1 · Arrival",
        title: "Touch Down · Sunset in Little Venice",
        desc: "Land around 4:50pm — the only Greek island with a direct Heathrow connection — and settle into Rocabella, up in quiet Agios Stefanos on the sunset side of the island. A drink on the terrace, then into Mykonos Town for golden hour over Little Venice and a long first dinner. An easy, no-club first night.",
        tags: [
          { kind: "stay", label: "Rocabella Mykonos" },
          { kind: "activity", label: "Little Venice Sunset" },
          { kind: "food", label: "Dinner · M-eating" },
        ],
        spots: [
          {
            name: "Rocabella Mykonos",
            mapsQuery: "Rocabella Mykonos Hotel Agios Stefanos",
          },
          { name: "Little Venice", mapsQuery: "Little Venice, Mykonos" },
          { name: "Galleraki", mapsQuery: "Galleraki Little Venice Mykonos" },
          { name: "M-eating", mapsQuery: "M-eating restaurant Mykonos Town" },
        ],
        timeline: [
          {
            time: "4:50pm",
            title: "Land at Mykonos (JMK)",
            detail: "BA 668 from Heathrow — bags, then out to the taxi rank.",
            kind: "travel",
          },
          {
            time: "5:15pm",
            title: "Transfer to Rocabella",
            detail: "North to Agios Stefanos, the quiet sunset-facing side.",
            kind: "travel",
            travelTime: "~15 min taxi",
            mapsQuery: "Rocabella Mykonos Hotel Agios Stefanos",
          },
          {
            time: "5:40pm",
            title: "Check in · arrival drink",
            detail: "Drop bags, decompress on the terrace over the bay.",
            kind: "checkin",
            duration: "1h",
          },
          {
            time: "7:15pm",
            title: "Into Mykonos Town",
            kind: "travel",
            travelTime: "~12 min taxi",
          },
          {
            time: "7:40pm",
            title: "Sunset drinks · Galleraki",
            detail:
              "Waterfront table in Little Venice. Sunset ~8:00pm — grab the table early. (Skip Baos/Semeli — DJ-loud.)",
            kind: "activity",
            booking: "walk-in",
            mapsQuery: "Galleraki Little Venice Mykonos",
          },
          {
            time: "9:00pm",
            title: "Dinner · M-eating",
            detail:
              "Cycladic tasting-menu cooking, serious Greek wine list. The honeymoon-night table.",
            kind: "meal",
            duration: "~2h",
            booking: "to-book",
            mapsQuery: "M-eating restaurant Mykonos Town",
          },
          {
            time: "11:15pm",
            title: "Wander back · taxi to Rocabella",
            detail: "A loop past the windmills on the way out of town.",
            kind: "travel",
            travelTime: "~12 min taxi",
          },
        ],
      },
      {
        id: "myk-aug27",
        date: "2026-08-27",
        dateLabel: "Aug 27",
        part: "Full Day",
        title: "Old Port Morning · Jackie O' Beach · Hippie Fish",
        desc: "The one full day. A slow morning wander through the Old Port and Chora before the day-trippers flood in, then out to Jackie O' Beach Club on Super Paradise — arrive by noon to claim chairs. Back to the hotel to rinse off, then dinner at Hippie Fish on Agios Ioannis beach at 8pm. Town afterward if the night wants it: a cocktail at Lola, the Jackie O' Town Bar buzz from the street.",
        tags: [
          { kind: "activity", label: "Old Port Morning" },
          { kind: "activity", label: "Jackie O' Beach Club" },
          { kind: "food", label: "Hippie Fish · 8pm" },
        ],
        spots: [
          { name: "Mykonos Old Port", mapsQuery: "Old Port, Mykonos Town" },
          {
            name: "Jackie O' Beach Club",
            mapsQuery: "Jackie O' Beach Club Super Paradise Mykonos",
          },
          {
            name: "Hippie Fish",
            mapsQuery: "Hippie Fish Agios Ioannis Mykonos",
          },
          { name: "Lola Bar", mapsQuery: "Lola Bar Mykonos Town" },
          {
            name: "Jackie O' Town Bar",
            mapsQuery: "Jackie O' Town Bar Mykonos old port",
          },
        ],
        timeline: [
          {
            time: "8:45am",
            title: "Breakfast at Rocabella",
            kind: "downtime",
            duration: "1h",
          },
          {
            time: "10:00am",
            title: "Old Port + Chora stroll",
            detail:
              "Morning light on the harbor, coffee, the alleys before the crowds.",
            kind: "activity",
            travelTime: "~12 min taxi in",
            mapsQuery: "Old Port, Mykonos Town",
          },
          {
            time: "11:30am",
            title: "Out to Super Paradise",
            kind: "travel",
            travelTime: "~20 min taxi",
            mapsQuery: "Jackie O' Beach Club Super Paradise Mykonos",
          },
          {
            time: "12:00pm",
            title: "Jackie O' Beach Club · chairs by noon",
            detail:
              "Arrive by 12pm to get chairs — no reservation, just be early. Swim, long lunch, the classic gay beach day.",
            kind: "activity",
            duration: "~5h",
            booking: "walk-in",
            mapsQuery: "Jackie O' Beach Club Super Paradise Mykonos",
          },
          {
            time: "5:15pm",
            title: "Back to the hotel · rest & shower",
            kind: "downtime",
            travelTime: "~25 min taxi",
          },
          {
            time: "8:00pm",
            title: "Dinner · Hippie Fish",
            detail:
              "Toes-in-the-sand seafood on Agios Ioannis beach, 8pm table.",
            kind: "meal",
            duration: "~2h",
            booking: "booked",
            mapsQuery: "Hippie Fish Agios Ioannis Mykonos",
          },
          {
            time: "10:30pm",
            title: "Cocktail at Lola",
            detail:
              "Small, intimate, conversation-friendly — the one gay bar built for people who don't love loud rooms.",
            kind: "activity",
            booking: "walk-in",
            mapsQuery: "Lola Bar Mykonos Town",
          },
          {
            time: "11:30pm",
            title: "Past Jackie O' Town Bar",
            detail:
              "The heart of gay Mykonos spills into the street by the old port — soak up the buzz, no sweaty club required.",
            kind: "activity",
            booking: "walk-in",
            mapsQuery: "Jackie O' Town Bar Mykonos old port",
          },
          {
            time: "12:30am",
            title: "Taxi back to Rocabella",
            kind: "travel",
            travelTime: "~12 min taxi",
          },
        ],
      },
      {
        id: "myk-aug28",
        date: "2026-08-28",
        dateLabel: "Aug 28",
        part: "Morning",
        title: "Early Breakfast · 9:40am Ferry to Paros",
        desc: "One last breakfast in Mykonos, then the 9:40am high-speed ferry south — about 45 minutes, arriving Paros around 10:25am.",
        tags: [{ kind: "transport", label: "Mykonos → Paros · 9:40am ferry" }],
        timeline: [
          {
            time: "8:00am",
            title: "Breakfast & pack up",
            kind: "downtime",
            duration: "45 min",
          },
          {
            time: "8:50am",
            title: "Taxi to the New Port",
            detail: "Buffer for August port chaos — be there ~30 min early.",
            kind: "travel",
            travelTime: "~15 min taxi",
            mapsQuery: "Mykonos New Port",
          },
          {
            time: "9:40am",
            title: "High-speed ferry to Paros",
            detail: "~45 min crossing, arrives Paros ~10:25am.",
            kind: "travel",
            booking: "booked",
          },
        ],
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
        date: "2026-08-28",
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
        date: "2026-08-29",
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
        date: "2026-08-30",
        dateLabel: "Aug 30",
        part: "Morning",
        title: "Breakfast · 10:10am Ferry to Milos",
        desc: "Morning coffee in Paros, then the 10:10am ferry southwest to Milos, arriving around noon.",
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
        date: "2026-08-30",
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
        date: "2026-08-31",
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
        date: "2026-09-01",
        dateLabel: "Sep 1",
        part: "Morning",
        title: "Early Flight · Athens Layover · On to Nice",
        desc: "Sky Express GQ 419 departs Milos 8:55am and lands in Athens around 9:35am. A layover at Athens airport, then Aegean A3 690 departs 1:35pm and lands in Nice around 3:10pm. On the Riviera in time for dinner.",
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
        date: "2026-09-01",
        dateLabel: "Sep 1",
        part: "Arrival",
        title: "Bienvenue sur la Riviera",
        desc: "Land around 3:10pm from Athens and check in at Le Méridien Nice, right on the Promenade des Anglais. Vieux-Nice and the best rosé in the world are waiting. A light dinner and an early night — the Riviera rewards those who sleep.",
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
        date: "2026-09-02",
        dateLabel: "Sep 2",
        part: "Full Day",
        title: "In-Town Day · Matisse · Castle Hill · Beach",
        desc: "A local Nice day: the Cours Saleya market and Vieux-Nice in the morning, the Matisse Museum up in Cimiez (~13 min drive), the Castle Hill walk above the old town, and a lazy stretch on the beach. If the mood strikes, the Clos Saint-Vincent winery is about 30 minutes out.",
        tags: [
          { kind: "activity", label: "Matisse Museum" },
          { kind: "activity", label: "Castle Hill" },
          { kind: "activity", label: "Beach + Winery" },
          { kind: "food", label: "Dinner in Town" },
        ],
        spots: [
          { name: "Cours Saleya Market", mapsQuery: "Cours Saleya, Nice" },
          { name: "Matisse Museum", mapsQuery: "Musée Matisse, Nice" },
          {
            name: "Castle Hill",
            mapsQuery: "Colline du Château, Nice",
          },
          {
            name: "Clos Saint-Vincent",
            mapsQuery: "Clos Saint-Vincent winery Nice",
          },
        ],
      },
      {
        id: "nce-sep3",
        date: "2026-09-03",
        dateLabel: "Sep 3",
        part: "Full Day",
        title: "Private Guide Day on the Riviera",
        desc: "A driver/guide for the day (~€350) to do the coast properly — the Picasso Museum in Antibes, the Antibes markets, the Fragonard perfume factory, the perched village of Èze. Back to Nice for a final Riviera dinner.",
        tags: [
          { kind: "activity", label: "Private Driver/Guide" },
          { kind: "activity", label: "Antibes · Èze · Fragonard" },
          { kind: "food", label: "Final Nice Dinner" },
        ],
        spots: [
          {
            name: "Picasso Museum, Antibes",
            mapsQuery: "Musée Picasso, Antibes",
          },
          { name: "Èze Village", mapsQuery: "Èze, France" },
          {
            name: "Fragonard Factory",
            mapsQuery: "Fragonard perfume factory Èze",
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
        date: "2026-09-04",
        dateLabel: "Sep 4",
        part: "Arrival",
        title: "Into New York",
        desc: "La Compagnie B0 200 departs Nice 12:25pm and lands at Newark around 3:45pm — all-business class, so you arrive refreshed. Transfer to the Moxy NYC Chelsea, then keep it easy: chill Thai dinner and drinks at Sappesan.",
        tags: [
          { kind: "stay", label: "Moxy NYC Chelsea" },
          { kind: "food", label: "Thai at Sappesan" },
        ],
        spots: [
          { name: "Moxy NYC Chelsea", mapsQuery: "Moxy NYC Chelsea" },
          { name: "Sappesan", mapsQuery: "Sappesan Thai New York" },
        ],
      },
      {
        id: "nyc-sep5",
        date: "2026-09-05",
        dateLabel: "Sep 5",
        part: "Saturday",
        title: "The City · Cat Cohen at Night",
        desc: "A day in New York — whatever you want it to be: a museum, a walk across the Brooklyn Bridge, shopping in SoHo, a long brunch. Dinner at Aria Wine Bar in the West Village (reservation needed), then Cat Cohen: Broad Strokes at 8:15pm.",
        tags: [
          { kind: "activity", label: "Explore NYC" },
          { kind: "food", label: "Aria Wine Bar · WV" },
          { kind: "activity", label: "Cat Cohen · 8:15pm" },
        ],
        spots: [
          { name: "Brooklyn Bridge", mapsQuery: "Brooklyn Bridge, New York" },
          {
            name: "Aria Wine Bar",
            mapsQuery: "Aria Wine Bar West Village New York",
          },
        ],
      },
      {
        id: "nyc-sep6",
        date: "2026-09-06",
        dateLabel: "Sep 6",
        part: "Sunday · Match Day",
        title: "US Open — Arthur Ashe Stadium",
        desc: "Sunday at Flushing Meadows — the best players still in it, the roar of the crowd, the best tennis in the world. Tickets are booked. Post-match, Chinese food around Grand Central on the way back into Manhattan.",
        tags: [
          { kind: "activity", label: "US Open · Arthur Ashe" },
          { kind: "booked", label: "✓ Tickets Booked" },
          { kind: "food", label: "Chinese near Grand Central" },
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
        date: "2026-09-07",
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
        date: "2026-09-08",
        dateLabel: "Sep 8",
        part: "Home",
        title: "Back to Chicago",
        desc: "Delta DL 2240 departs New York 11:30am and lands at O'Hare around 1:15pm. The honeymoon ends, the marriage continues.",
        tags: [
          { kind: "transport", label: "NYC → ORD · DL 2240 · 11:30am" },
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
    lead: "Aug 26 · 10:55am",
    text: "British Airways 668 direct · LHR T5 → Mykonos JMK · lands ~4:50pm",
    booked: true,
  },
  {
    id: "t-myk-par",
    icon: "⛴",
    lead: "Aug 28 · 9:40am",
    text: "High-speed ferry · Mykonos → Paros · arrives ~10:25am",
    booked: true,
  },
  {
    id: "t-par-mil",
    icon: "⛴",
    lead: "Aug 30 · 10:10am",
    text: "High-speed ferry · Paros → Milos · arrives ~12:00pm",
    booked: true,
  },
  {
    id: "t-mil-nce",
    icon: "✈",
    lead: "Sep 1",
    text: "Sky Express GQ 419: MLO 8:55am → ATH 9:35am · then Aegean A3 690: ATH 1:35pm → NCE ~3:10pm",
    booked: true,
  },
  {
    id: "t-nce-nyc",
    icon: "✈",
    lead: "Sep 4 · 12:25pm",
    text: "La Compagnie B0 200 all-business · NCE → EWR · lands ~3:45pm",
    booked: true,
  },
  {
    id: "t-nyc-ord",
    icon: "✈",
    lead: "Sep 8 · 11:30am",
    text: "Delta DL 2240 · New York → Chicago O'Hare · lands ~1:15pm",
    booked: true,
  },
]

// ── CHECKLIST (To Book / Packing / Before We Go) ───────────────────────────────
export const checklist: ChecklistItem[] = [
  {
    id: "cl-globe",
    label: "Book Shakespeare's Globe tickets (London Day 1)",
    category: "To Book",
  },
  {
    id: "cl-dishoom",
    label: "Reserve Hawksmoor bar + Dishoom King's Cross (Day 1)",
    category: "To Book",
  },
  {
    id: "cl-deanst",
    label: "Reserve Dean Street Townhouse tea (Day 2)",
    category: "To Book",
  },
  {
    id: "cl-myk-dinners",
    label:
      "Reserve M-eating, Mykonos (Aug 26) — Hippie Fish 8pm on the 27th is set",
    category: "To Book",
  },
  {
    id: "cl-aria",
    label: "Reserve Aria Wine Bar, West Village (Sep 5)",
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
