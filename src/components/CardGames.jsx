import { useEffect, useMemo, useState } from "react"
import { cardGames } from "../data/cardGames"

// Offline-first, fully client-side card-game reference + scorekeeper +
// leaderboard. Mirrors the site's localStorage pattern (hydrate on mount,
// persist on every change, JSON.parse guarded by try/catch). No network calls.

const STORAGE_KEY = "cards-tracker-v1"

const DEFAULT_STATE = {
  players: { a: "Brendan", b: "Scott" },
  // leaderboard[gameId] = { a: winsForPlayerA, b: winsForPlayerB, played }
  leaderboard: {},
}

function loadState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return DEFAULT_STATE
    const parsed = JSON.parse(stored)
    return {
      players: {
        a: parsed?.players?.a || DEFAULT_STATE.players.a,
        b: parsed?.players?.b || DEFAULT_STATE.players.b,
      },
      leaderboard:
        parsed && typeof parsed.leaderboard === "object" && parsed.leaderboard
          ? parsed.leaderboard
          : {},
    }
  } catch {
    return DEFAULT_STATE
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // storage unavailable — state just isn't persisted this session
  }
}

// --- small UI helpers --------------------------------------------------------

const TAG_STYLES = {
  easy: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  quick: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200",
  long: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
}

function Tag({ label }) {
  const cls =
    TAG_STYLES[label] ||
    "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200"
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  )
}

function Section({ title, children }) {
  return (
    <div className="mt-4">
      <h4 className="text-sm font-bold tracking-wide text-red-700 uppercase dark:text-red-400">
        {title}
      </h4>
      <div className="mt-1.5 text-gray-900 dark:text-gray-100">{children}</div>
    </div>
  )
}

// --- scorekeeper -------------------------------------------------------------

function Scorekeeper({ game, players, onFinish, onCancel }) {
  const { scoringType, target, scoringNotes } = game.scoring
  const isTargeted =
    scoringType === "first-to-target" || scoringType === "low-score"
  const [scores, setScores] = useState({ a: 0, b: 0 })
  const [declared, setDeclared] = useState(null) // "a" | "b" | null

  // For targeted games, auto-suggest a winner once a total crosses the target.
  const autoWinner = useMemo(() => {
    if (declared) return declared
    if (!isTargeted || target == null) return null
    if (scoringType === "first-to-target") {
      if (scores.a >= target && scores.a > scores.b) return "a"
      if (scores.b >= target && scores.b > scores.a) return "b"
    }
    // low-score games end by deal count elsewhere; no auto-cross here.
    return null
  }, [declared, isTargeted, target, scoringType, scores])

  const winner = declared || autoWinner

  function bump(key, delta) {
    setScores(prev => ({ ...prev, [key]: prev[key] + delta }))
  }

  // single-winner: no running totals, just pick who won.
  if (scoringType === "single-winner") {
    return (
      <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-800">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {scoringNotes}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {["a", "b"].map(key => (
            <button
              key={key}
              onClick={() => onFinish(key)}
              className="min-h-14 rounded-xl bg-green-600 px-4 py-3 text-lg font-bold text-white active:scale-95"
            >
              {players[key]} won
            </button>
          ))}
        </div>
        <button
          onClick={onCancel}
          className="mt-3 w-full rounded-lg px-4 py-2 text-sm text-gray-500 hover:underline dark:text-gray-400"
        >
          Cancel
        </button>
      </div>
    )
  }

  const lowerWins = scoringType === "low-score"
  const targetLabel =
    scoringType === "first-to-target"
      ? `First to ${target} wins`
      : scoringType === "low-score"
        ? `Lowest total over ${target} deals wins`
        : "Highest total wins"

  return (
    <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-800">
      <p className="text-sm text-gray-700 dark:text-gray-300">{scoringNotes}</p>
      <p className="mt-1 text-xs font-semibold text-red-700 dark:text-red-400">
        {targetLabel}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {["a", "b"].map(key => (
          <div
            key={key}
            className={`rounded-xl border p-3 text-center ${
              winner === key
                ? "border-green-500 bg-green-50 dark:border-green-500 dark:bg-green-900/30"
                : "border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-700"
            }`}
          >
            <div className="truncate text-sm font-semibold text-gray-900 dark:text-white">
              {players[key]}
            </div>
            <div className="my-2 text-4xl font-bold text-gray-900 tabular-nums dark:text-white">
              {scores[key]}
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => bump(key, -1)}
                className="min-h-11 rounded-lg bg-gray-200 text-lg font-bold text-gray-800 active:scale-95 dark:bg-gray-600 dark:text-gray-100"
                aria-label={`Subtract 1 from ${players[key]}`}
              >
                −1
              </button>
              <button
                onClick={() => bump(key, 5)}
                className="min-h-11 rounded-lg bg-gray-200 text-sm font-bold text-gray-800 active:scale-95 dark:bg-gray-600 dark:text-gray-100"
                aria-label={`Add 5 to ${players[key]}`}
              >
                +5
              </button>
              <button
                onClick={() => bump(key, 1)}
                className="min-h-11 rounded-lg bg-blue-600 text-lg font-bold text-white active:scale-95"
                aria-label={`Add 1 to ${players[key]}`}
              >
                +1
              </button>
            </div>
          </div>
        ))}
      </div>

      {winner && (
        <div className="mt-4 rounded-lg bg-green-100 p-3 text-center text-sm font-bold text-green-800 dark:bg-green-900 dark:text-green-100">
          {players[winner]} is winning
          {lowerWins ? " (lowest score)" : ""}!
        </div>
      )}

      <div className="mt-4 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setDeclared("a")}
            className="min-h-12 rounded-lg bg-gray-200 px-3 py-2 text-sm font-semibold text-gray-800 active:scale-95 dark:bg-gray-600 dark:text-gray-100"
          >
            Declare {players.a}
          </button>
          <button
            onClick={() => setDeclared("b")}
            className="min-h-12 rounded-lg bg-gray-200 px-3 py-2 text-sm font-semibold text-gray-800 active:scale-95 dark:bg-gray-600 dark:text-gray-100"
          >
            Declare {players.b}
          </button>
        </div>
        <button
          disabled={!winner}
          onClick={() => winner && onFinish(winner)}
          className="min-h-12 w-full rounded-lg bg-green-600 px-4 py-3 font-bold text-white active:scale-95 disabled:opacity-40"
        >
          Record win to leaderboard
        </button>
        <button
          onClick={onCancel}
          className="w-full rounded-lg px-4 py-2 text-sm text-gray-500 hover:underline dark:text-gray-400"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// --- game detail (accordion body) -------------------------------------------

function GameDetail({ game, players, onRecordWin }) {
  const [scoring, setScoring] = useState(false)

  return (
    <div className="border-t border-gray-200 px-4 pb-4 dark:border-gray-700">
      <Section title="Setup">
        <ol className="list-decimal space-y-1 pl-5 text-sm">
          {game.setup.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      </Section>

      <Section title="How to play">
        <ol className="list-decimal space-y-1 pl-5 text-sm">
          {game.howToPlay.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      </Section>

      <Section title="How to win">
        <p className="text-sm">{game.howToWin}</p>
      </Section>

      <Section title="Variants">
        <ul className="space-y-2 text-sm">
          {game.variants.map((v, i) => (
            <li key={i}>
              <span className="font-semibold text-gray-900 dark:text-white">
                {v.name}:
              </span>{" "}
              {v.description}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Scoring">
        <p className="text-sm">{game.scoring.scoringNotes}</p>
      </Section>

      {scoring ? (
        <Scorekeeper
          game={game}
          players={players}
          onCancel={() => setScoring(false)}
          onFinish={winnerKey => {
            onRecordWin(game.id, winnerKey)
            setScoring(false)
          }}
        />
      ) : (
        <button
          onClick={() => setScoring(true)}
          className="mt-5 min-h-12 w-full rounded-xl bg-red-700 px-4 py-3 font-bold text-white hover:bg-red-800 active:scale-95"
        >
          Start scoring this game
        </button>
      )}
    </div>
  )
}

// --- leaderboard -------------------------------------------------------------

function Leaderboard({ players, leaderboard, onClear }) {
  const totals = useMemo(() => {
    let a = 0
    let b = 0
    let played = 0
    for (const id of Object.keys(leaderboard)) {
      const row = leaderboard[id]
      a += row.a || 0
      b += row.b || 0
      played += row.played || 0
    }
    return { a, b, played }
  }, [leaderboard])

  const rows = useMemo(
    () =>
      cardGames
        .map(g => ({ game: g, row: leaderboard[g.id] }))
        .filter(r => r.row && r.row.played > 0),
    [leaderboard],
  )

  return (
    <div className="mt-6">
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800">
          <div className="truncate text-sm text-gray-500 dark:text-gray-400">
            {players.a}
          </div>
          <div className="text-3xl font-bold text-gray-900 tabular-nums dark:text-white">
            {totals.a}
          </div>
          <div className="text-xs text-gray-400">wins</div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800">
          <div className="text-sm text-gray-500 dark:text-gray-400">Played</div>
          <div className="text-3xl font-bold text-gray-900 tabular-nums dark:text-white">
            {totals.played}
          </div>
          <div className="text-xs text-gray-400">games</div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800">
          <div className="truncate text-sm text-gray-500 dark:text-gray-400">
            {players.b}
          </div>
          <div className="text-3xl font-bold text-gray-900 tabular-nums dark:text-white">
            {totals.b}
          </div>
          <div className="text-xs text-gray-400">wins</div>
        </div>
      </div>

      {rows.length > 0 ? (
        <div className="mt-4 overflow-hidden rounded-xl bg-white shadow-sm dark:bg-gray-800">
          {rows.map(({ game, row }) => (
            <div
              key={game.id}
              className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5 last:border-b-0 dark:border-gray-700"
            >
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {game.name}
              </span>
              <span className="text-sm text-gray-600 tabular-nums dark:text-gray-300">
                {row.a || 0}
                <span className="mx-1 text-gray-400">–</span>
                {row.b || 0}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
          No games recorded yet. Finish a game to fill the board.
        </p>
      )}

      {totals.played > 0 && (
        <button
          onClick={onClear}
          className="mt-4 w-full rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 active:scale-95 dark:border-red-800 dark:text-red-400"
        >
          Reset leaderboard
        </button>
      )}
    </div>
  )
}

// --- root --------------------------------------------------------------------

const CardGames = () => {
  const [hydrated, setHydrated] = useState(false)
  const [state, setState] = useState(DEFAULT_STATE)
  const [tab, setTab] = useState("library") // library | players | board
  const [openId, setOpenId] = useState(null)
  const [filter, setFilter] = useState("all") // all | quick | strategic

  // Hydrate from localStorage once on mount.
  useEffect(() => {
    setState(loadState())
    setHydrated(true)
  }, [])

  // Persist on every change, but only after the first hydrate so we don't
  // clobber stored state with defaults on the initial render.
  useEffect(() => {
    if (!hydrated) return
    saveState(state)
  }, [state, hydrated])

  const { players, leaderboard } = state

  function setPlayerName(key, value) {
    setState(prev => ({
      ...prev,
      players: { ...prev.players, [key]: value },
    }))
  }

  function recordWin(gameId, winnerKey) {
    setState(prev => {
      const row = prev.leaderboard[gameId] || { a: 0, b: 0, played: 0 }
      return {
        ...prev,
        leaderboard: {
          ...prev.leaderboard,
          [gameId]: {
            a: row.a + (winnerKey === "a" ? 1 : 0),
            b: row.b + (winnerKey === "b" ? 1 : 0),
            played: row.played + 1,
          },
        },
      }
    })
    setTab("board")
    setOpenId(null)
  }

  function clearBoard() {
    if (
      typeof window !== "undefined" &&
      !window.confirm("Reset the whole leaderboard? This can't be undone.")
    ) {
      return
    }
    setState(prev => ({ ...prev, leaderboard: {} }))
  }

  const games = useMemo(() => {
    if (filter === "quick") {
      return cardGames.filter(g => g.tags.length === "quick")
    }
    if (filter === "strategic") {
      return cardGames.filter(g => g.tags.vibe === "strategic")
    }
    return cardGames
  }, [filter])

  return (
    <div className="mx-auto max-w-2xl px-1 pb-20">
      {/* tabs */}
      <div className="sticky top-0 z-10 -mx-1 mb-4 grid grid-cols-3 gap-1 bg-white/90 px-1 py-2 backdrop-blur dark:bg-[#032740]/90">
        {[
          ["library", "Games"],
          ["players", "Players"],
          ["board", "Leaderboard"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`min-h-11 rounded-lg px-3 py-2 text-sm font-semibold active:scale-95 ${
              tab === key
                ? "bg-red-700 text-white"
                : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "library" && (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            {[
              ["all", "All"],
              ["quick", "Quick"],
              ["strategic", "Strategic"],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`min-h-9 rounded-full px-4 py-1.5 text-sm font-medium active:scale-95 ${
                  filter === key
                    ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {games.map(game => {
              const open = openId === game.id
              return (
                <div
                  key={game.id}
                  className="overflow-hidden rounded-xl bg-white shadow-sm dark:bg-gray-800"
                >
                  <button
                    onClick={() => setOpenId(open ? null : game.id)}
                    aria-expanded={open}
                    className="flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left active:bg-gray-50 dark:active:bg-gray-700"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {game.name}
                        </h3>
                        <span className="text-xs text-gray-400">
                          {game.players}p
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-300">
                        {game.hook}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Tag label={game.tags.difficulty} />
                        <Tag label={game.tags.length} />
                        <Tag label={game.tags.vibe} />
                      </div>
                    </div>
                    <span
                      className={`mt-1 shrink-0 text-xl text-gray-400 transition-transform ${
                        open ? "rotate-180" : ""
                      }`}
                      aria-hidden="true"
                    >
                      ⌄
                    </span>
                  </button>
                  {open && (
                    <GameDetail
                      game={game}
                      players={players}
                      onRecordWin={recordWin}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      {tab === "players" && (
        <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-gray-800">
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
            Names are used across the scorekeeper and leaderboard. They save
            automatically and work offline.
          </p>
          {[
            ["a", "Player 1"],
            ["b", "Player 2"],
          ].map(([key, label]) => (
            <label key={key} className="mb-4 block">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                {label}
              </span>
              <input
                type="text"
                value={players[key]}
                onChange={e => setPlayerName(key, e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-base text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder={label}
                autoComplete="off"
              />
            </label>
          ))}
        </div>
      )}

      {tab === "board" && (
        <Leaderboard
          players={players}
          leaderboard={leaderboard}
          onClear={clearBoard}
        />
      )}
    </div>
  )
}

export default CardGames
