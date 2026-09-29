// Library of easy 2-player card games playable with one standard 52-card deck.
// Rules are the widely-accepted standard 2-player versions, kept concise for
// quick vacation reference. Consumed by src/components/CardGames.jsx.

export type Difficulty = "easy" | "medium"
export type Length = "quick" | "medium" | "long"
export type Vibe = "chill" | "fast" | "strategic" | "luck" | "reflex"

// How a game is scored, driving which scorekeeper UI the island shows.
//  - "first-to-target": accumulate points across rounds, first to hit target wins
//  - "round-tally":     tally points per round, highest total wins (manual end)
//  - "low-score":       accumulate points, LOWEST total wins (e.g. Golf)
//  - "single-winner":   no running score; one player just wins the game
export type ScoringType =
  "first-to-target" | "round-tally" | "single-winner" | "low-score"

export interface Variant {
  name: string
  description: string
}

export interface Scoring {
  scoringType: ScoringType
  scoringNotes: string
  // Present for target-based games (first-to-target / low-score).
  target?: number
}

export interface CardGame {
  id: string
  name: string
  // One-line hook shown on the collapsed card.
  hook: string
  tags: {
    difficulty: Difficulty
    length: Length
    vibe: Vibe
  }
  players: "2" | "2+"
  setup: string[]
  howToPlay: string[]
  howToWin: string
  variants: Variant[]
  scoring: Scoring
}

export const cardGames: CardGame[] = [
  {
    id: "go-fish",
    name: "Go Fish",
    hook: "Beg for cards, collect four-of-a-kind sets.",
    tags: { difficulty: "easy", length: "quick", vibe: "chill" },
    players: "2+",
    setup: [
      "Deal 7 cards to each player (5 each if more than two play).",
      "Place the rest face down as the stock (the 'ocean').",
    ],
    howToPlay: [
      "On your turn, ask the other player for a rank you already hold (e.g. 'Got any sevens?').",
      "If they have cards of that rank, they hand them all over and you go again.",
      "If they don't, they say 'Go Fish' and you draw the top stock card.",
      "If you draw the rank you asked for, reveal it and take another turn; otherwise play passes.",
      "Whenever you collect all four of a rank, lay the set face up in front of you.",
    ],
    howToWin:
      "The player with the most completed four-of-a-kind sets when all 13 sets are made wins.",
    variants: [
      {
        name: "Ask by exact card",
        description:
          "Must ask for a specific card (e.g. 'the 7 of hearts') instead of a whole rank — harder.",
      },
      {
        name: "Pairs, not sets",
        description:
          "Collect matching pairs instead of full four-of-a-kinds for a faster game.",
      },
    ],
    scoring: {
      scoringType: "round-tally",
      scoringNotes:
        "Score 1 point per completed set of four. There are 13 sets total; most sets wins.",
    },
  },
  {
    id: "crazy-8s",
    name: "Crazy 8s",
    hook: "Match rank or suit; 8s are wild.",
    tags: { difficulty: "easy", length: "quick", vibe: "chill" },
    players: "2+",
    setup: [
      "Deal 7 cards to each player (5 each with more than two).",
      "Place the rest face down as the stock; flip the top card face up to start the discard pile.",
    ],
    howToPlay: [
      "On your turn, play a card that matches the suit or rank of the top discard.",
      "An 8 is wild: play it any time and name the suit the next player must follow.",
      "If you can't (or won't) play, draw from the stock until you can, then play it.",
      "If the stock runs out and you can't play, your turn is skipped.",
      "The first player to get rid of all their cards wins the round.",
    ],
    howToWin:
      "Be the first to empty your hand. For a match, play to a target using penalty points from cards left in hand.",
    variants: [
      {
        name: "Point match to 100",
        description:
          "After each round, losers score points for cards left in hand (8=50, face=10, ace=1, others face value). First to 100 loses; lowest total wins overall.",
      },
      {
        name: "Draw-and-pass",
        description:
          "If you can't play, draw just one card; if it's still unplayable, pass. Faster, more luck.",
      },
    ],
    scoring: {
      scoringType: "first-to-target",
      scoringNotes:
        "Optional match play: winner of a round scores the penalty value of opponents' leftover cards (8=50, face=10, ace=1, pip=face value). First to the target total wins the match.",
      target: 100,
    },
  },
  {
    id: "war",
    name: "War",
    hook: "Flip cards; higher card takes both. Pure luck.",
    tags: { difficulty: "easy", length: "long", vibe: "luck" },
    players: "2",
    setup: [
      "Deal the whole deck evenly, 26 cards each, face down as a personal stack.",
      "No looking at your cards.",
    ],
    howToPlay: [
      "Both players flip their top card at the same time.",
      "The higher card wins both cards, added to the bottom of the winner's stack (aces high).",
      "On a tie it's WAR: each player deals three cards face down, then one face up. Higher face-up card takes all cards in play.",
      "If a war ties again, repeat until someone wins the pile.",
    ],
    howToWin: "Win all 52 cards. The player who runs out of cards loses.",
    variants: [
      {
        name: "Fewer war cards",
        description:
          "Put down one card face down (not three) on a war to make games much shorter.",
      },
      {
        name: "Casino War",
        description:
          "On a tie you may 'surrender' half your stake or 'go to war' — adds a betting element.",
      },
    ],
    scoring: {
      scoringType: "single-winner",
      scoringNotes:
        "No points — whoever collects all the cards wins the game. Tap the winner when someone runs out.",
    },
  },
  {
    id: "speed",
    name: "Speed (Spit)",
    hook: "Race, no turns — dump cards fastest to win.",
    tags: { difficulty: "medium", length: "quick", vibe: "fast" },
    players: "2",
    setup: [
      "Deal 20 cards to each player; each makes a face-down draw pile of 15 and a 5-card hand.",
      "In the center place two face-down 'spit' piles (one each), and set aside two extra cards as the center stacks.",
      "Flip the two center cards face up at the same time to start.",
    ],
    howToPlay: [
      "There are no turns — both players play at once, as fast as they can.",
      "Play any hand card that is one rank higher OR one lower than a center pile's top card (aces wrap to kings).",
      "Refill your hand back up to five from your draw pile whenever you can (max five in hand).",
      "If both players are stuck, each flips one new center card from their spit pile at the same time and play resumes.",
      "When you empty your hand and draw pile, slap the smaller center pile to claim it.",
    ],
    howToWin:
      "Be the first to get rid of all your cards (hand and draw pile). Fewest cards after the last 'spit' wins.",
    variants: [
      {
        name: "Nertz-lite",
        description:
          "Play to a target over several rounds; loser of each round carries a penalty.",
      },
      {
        name: "Slower start",
        description:
          "Deal only 15 cards each for a quicker, gentler round while learning.",
      },
    ],
    scoring: {
      scoringType: "single-winner",
      scoringNotes:
        "First to shed all cards wins the round. Tap the winner; best-of-N is up to you.",
    },
  },
  {
    id: "egyptian-rat-screw",
    name: "Egyptian Rat Screw",
    hook: "Slap-the-pile speed game with brutal penalties.",
    tags: { difficulty: "medium", length: "medium", vibe: "reflex" },
    players: "2+",
    setup: [
      "Deal the whole deck evenly, face down. Players don't look at their cards.",
    ],
    howToPlay: [
      "Take turns flipping your top card onto a central pile.",
      "Slap the pile to win it whenever a valid slap pattern appears: a double (two same rank in a row), or a sandwich (same rank with one card between).",
      "The first hand to slap a valid pile takes the whole pile to the bottom of their stack.",
      "If you flip a face card or ace, the next player owes 'pays': 4 cards for an ace, 3 for a king, 2 for a queen, 1 for a jack.",
      "If they flip another face/ace during the payment, the debt passes to the next player; otherwise the person who played the face card takes the pile.",
      "Slapping a pile with no valid pattern costs you a card, placed face up under the pile ('burn').",
    ],
    howToWin:
      "Collect all 52 cards. A player with no cards is out but may slap back in.",
    variants: [
      {
        name: "More slap rules",
        description:
          "Add tops-and-bottoms, four-in-a-row, or adding-to-ten as extra valid slaps.",
      },
      {
        name: "No burn",
        description:
          "A false slap just returns the card with no penalty — friendlier for kids.",
      },
    ],
    scoring: {
      scoringType: "single-winner",
      scoringNotes:
        "No points — winner is whoever ends up holding all the cards. Tap the winner.",
    },
  },
  {
    id: "snap",
    name: "Snap",
    hook: "Shout 'Snap!' on matching cards — fastest wins the pile.",
    tags: { difficulty: "easy", length: "quick", vibe: "reflex" },
    players: "2+",
    setup: [
      "Deal the entire deck evenly, face down. Don't look at your cards.",
    ],
    howToPlay: [
      "Take turns flipping your top card into a shared central face-up pile (or one pile each).",
      "When two consecutive top cards match in rank, the first to shout 'Snap!' takes the whole pile.",
      "A wrong 'Snap!' means you give one card to each opponent as a penalty.",
      "Won piles go to the bottom of your stack.",
    ],
    howToWin:
      "Collect all the cards. When a player runs out they're out; last player standing wins.",
    variants: [
      {
        name: "Two-pile Snap Pool",
        description:
          "Each player flips to their own pile; snap when the two exposed piles match.",
      },
      {
        name: "Snap Pool",
        description:
          "Match against a central pool pile instead of the previous card — more chances to snap.",
      },
    ],
    scoring: {
      scoringType: "single-winner",
      scoringNotes:
        "No points — the player who wins all the cards wins. Tap the winner.",
    },
  },
  {
    id: "gin-rummy",
    name: "Gin Rummy",
    hook: "Build runs and sets, knock to score. The classic 2-player rummy.",
    tags: { difficulty: "medium", length: "medium", vibe: "strategic" },
    players: "2",
    setup: [
      "Deal 10 cards to each player.",
      "Place the rest face down as the stock; flip the top card face up to start the discard pile.",
    ],
    howToPlay: [
      "On your turn, draw the top stock card or the top discard, then discard one card.",
      "Arrange your hand into melds: runs (3+ in sequence, same suit) and sets (3–4 of a kind).",
      "Cards not in a meld are 'deadwood'. Face cards = 10, aces = 1, pips = face value.",
      "'Knock' by discarding face down when your deadwood totals 10 or less. Lay down your melds.",
      "'Gin' is knocking with zero deadwood for a bonus.",
    ],
    howToWin:
      "After a knock, the knocker scores the difference in deadwood. Opponent may 'lay off' matching cards onto the knocker's melds first. First to the target total wins the match.",
    variants: [
      {
        name: "Undercut",
        description:
          "If the non-knocker's deadwood is equal or lower, they score the difference plus a 25-point undercut bonus.",
      },
      {
        name: "Oklahoma Gin",
        description:
          "The first upcard's value sets the maximum deadwood you may knock with that hand.",
      },
    ],
    scoring: {
      scoringType: "first-to-target",
      scoringNotes:
        "Per hand: knocker scores deadwood difference; Gin = difference + 25 bonus; undercut = difference + 25 to the opponent. Add 25 per line and 100 for the game when first to reach the target.",
      target: 100,
    },
  },
  {
    id: "golf",
    name: "Golf (6-card)",
    hook: "Lowest hand wins, like golf. Nine deals, low score takes it.",
    tags: { difficulty: "medium", length: "medium", vibe: "strategic" },
    players: "2+",
    setup: [
      "Deal 6 cards to each player, arranged face down in a 2×3 grid.",
      "Place the rest face down as the stock; flip the top card to start the discard pile.",
      "Each player secretly peeks at two of their six cards to start.",
    ],
    howToPlay: [
      "On your turn, draw from the stock or take the top discard.",
      "Swap the drawn card for any of your six (placing the replaced card on the discard), or discard the drawn stock card.",
      "You're trying to make your grid total as LOW as possible.",
      "Vertical pairs of equal rank cancel to zero.",
      "When a player thinks their layout is lowest, they knock; everyone else gets one final turn, then all cards are revealed.",
    ],
    howToWin:
      "Lowest total over the agreed number of deals (a full 'round of golf' is 9 deals) wins.",
    variants: [
      {
        name: "Kings are zero",
        description:
          "Kings count as 0 instead of a high value, changing strategy.",
      },
      {
        name: "4-card or 9-card Golf",
        description: "Deal a 2×2 or 3×3 grid for a shorter or longer game.",
      },
    ],
    scoring: {
      scoringType: "low-score",
      scoringNotes:
        "Card values: ace=1, 2–10 face value, jack/queen=10, king=0, joker (if used)=-2. Matched vertical pairs cancel to 0. Add each deal to a running total; lowest total after all deals (default 9) wins.",
      target: 9,
    },
  },
  {
    id: "casino",
    name: "Casino",
    hook: "Capture and build cards from the table. A thinky fishing game.",
    tags: { difficulty: "medium", length: "medium", vibe: "strategic" },
    players: "2+",
    setup: [
      "Deal 2 cards to each player and 4 cards face up to the table; keep 2 in hand.",
      "Deal the remaining stock in later rounds of 4 as hands empty.",
    ],
    howToPlay: [
      "On your turn, play one card from hand to capture table cards, make a build, trail, or pair.",
      "Capture by matching a table card's rank, or by summing number cards to your played card (aces = 1).",
      "Build: combine table cards to a value you can later capture with a card in hand.",
      "Trail: if you can't or don't want to capture, lay a card face up on the table.",
      "Face cards capture only by exact rank match, not by summing.",
    ],
    howToWin:
      "When all cards are played, score captured cards. Highest score reaching the target (usually 21) over successive deals wins.",
    variants: [
      {
        name: "Royal Casino",
        description:
          "Face cards get numeric values (J=11, Q=12, K=13, A=1 or 14) and can be captured by building.",
      },
      {
        name: "Spade Casino",
        description:
          "Score 1 point per spade instead of just the majority — sweeps get emphasised.",
      },
    ],
    scoring: {
      scoringType: "first-to-target",
      scoringNotes:
        "Per deal: most cards = 3, most spades = 1, big casino (10♦) = 2, little casino (2♠) = 1, each ace = 1, each sweep (clearing the table) = 1. First to 21 over multiple deals wins.",
      target: 21,
    },
  },
  {
    id: "beggar-my-neighbour",
    name: "Beggar-My-Neighbour",
    hook: "Face-card duels decide the pile. No decisions, all fate.",
    tags: { difficulty: "easy", length: "long", vibe: "luck" },
    players: "2",
    setup: [
      "Deal the whole deck evenly, 26 cards each, face down. Don't look.",
    ],
    howToPlay: [
      "Take turns playing your top card into a central pile.",
      "If everyone plays a number card, play just continues.",
      "When someone plays a face card or ace, the opponent must 'pay': 4 cards for an ace, 3 for a king, 2 for a queen, 1 for a jack.",
      "If a payment card is itself a face/ace, payment stops and the debt flips to the other player.",
      "When a payment ends with only number cards, the player who played the last face card takes the whole pile.",
    ],
    howToWin: "Collect all 52 cards. The player who runs out of cards loses.",
    variants: [
      {
        name: "Add slaps",
        description:
          "Allow slapping doubles or sandwiches (as in Egyptian Rat Screw) to add skill and speed.",
      },
      {
        name: "Three-player",
        description:
          "Deal to three and pay the player to your left; last with cards wins.",
      },
    ],
    scoring: {
      scoringType: "single-winner",
      scoringNotes:
        "No points — whoever ends up with all the cards wins. Tap the winner.",
    },
  },
]

export default cardGames
