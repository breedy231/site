import { useEffect, useMemo, useState } from "react"
import { meta, stops, transits, checklist, budget } from "../data/honeymoon"

const STORAGE_KEY = "honeymoon-tracker-v1"

const mapsUrl = q =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`

// Transits render after these stops, in order.
const TRANSIT_ORDER = ["london", "mykonos", "paros", "milos", "nice", "nyc"]
const transitAfter = stopId => {
  const i = TRANSIT_ORDER.indexOf(stopId)
  return i === -1 ? null : transits[i]
}

const usd = n =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  })

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore */
  }
  return {}
}

export default function HoneymoonTracker() {
  const [checks, setChecks] = useState({})
  const [notes, setNotes] = useState({})
  const [packing, setPacking] = useState({})
  const [openNotes, setOpenNotes] = useState({})
  const [tab, setTab] = useState("itinerary")
  const [hydrated, setHydrated] = useState(false)

  // Hydrate from localStorage after mount (client:only — no SSR mismatch).
  useEffect(() => {
    const s = loadState()
    if (s.checks) setChecks(s.checks)
    if (s.notes) setNotes(s.notes)
    if (s.packing) setPacking(s.packing)
    setHydrated(true)
  }, [])

  // Persist on change.
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ checks, notes, packing }),
      )
    } catch {
      /* ignore */
    }
  }, [checks, notes, packing, hydrated])

  // Scroll-reveal for destination sections.
  useEffect(() => {
    if (tab !== "itinerary") return
    const els = Array.from(document.querySelectorAll(".destination"))
    if (!("IntersectionObserver" in window)) {
      els.forEach(el => el.classList.add("visible"))
      return
    }
    const obs = new IntersectionObserver(
      entries =>
        entries.forEach(e => {
          if (e.isIntersecting) e.target.classList.add("visible")
        }),
      { threshold: 0.08 },
    )
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [tab, hydrated])

  const allDays = useMemo(() => stops.flatMap(s => s.days), [])
  const doneCount = allDays.filter(d => checks[d.id]).length
  const pct = allDays.length
    ? Math.round((doneCount / allDays.length) * 100)
    : 0

  const toggleCheck = id => setChecks(c => ({ ...c, [id]: !c[id] }))
  const togglePack = id => setPacking(p => ({ ...p, [id]: !p[id] }))
  const setNote = (id, v) => setNotes(n => ({ ...n, [id]: v }))
  const toggleOpen = id => setOpenNotes(o => ({ ...o, [id]: !o[id] }))

  const bookedTotal = budget
    .filter(b => b.booked)
    .reduce((s, b) => s + b.amount, 0)
  const grandTotal = budget.reduce((s, b) => s + b.amount, 0)

  const checklistCats = ["To Book", "Before We Go", "Packing"]

  return (
    <>
      {/* HERO */}
      <section className="hero">
        <p className="hero-label">{meta.travelers}</p>
        <h1 className="hero-title">
          {meta.title.lead}
          <br />
          <em>{meta.title.em}</em>
        </h1>
        <p className="hero-sub">{meta.subtitle}</p>
        <div className="hero-route">
          {meta.route.map((r, i) => (
            <span key={r.label} style={{ display: "contents" }}>
              <span
                className={`hero-route-stop${r.highlight ? " highlight" : ""}`}
              >
                {r.label}
              </span>
              {i < meta.route.length - 1 && <span className="hero-route-dot" />}
            </span>
          ))}
        </div>
        <div className="scroll-hint">
          <div className="scroll-line" />
          <span>Scroll to explore</span>
        </div>
      </section>

      {/* OVERVIEW STRIP */}
      <div className="overview">
        {meta.stats.map(s => (
          <div className="overview-stat" key={s.label}>
            <div className="num">{s.num}</div>
            <div className="label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* STICKY CONTROL BAR */}
      <div className="ctrlbar">
        <div className="ctrlbar-inner">
          <div className="tabs">
            <button
              className={`tab${tab === "itinerary" ? " active" : ""}`}
              onClick={() => setTab("itinerary")}
            >
              Itinerary
            </button>
            <button
              className={`tab${tab === "checklist" ? " active" : ""}`}
              onClick={() => setTab("checklist")}
            >
              To-Do
            </button>
            <button
              className={`tab${tab === "budget" ? " active" : ""}`}
              onClick={() => setTab("budget")}
            >
              Budget
            </button>
          </div>
          <div className="progress">
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="progress-text">
              {doneCount}/{allDays.length} days
            </span>
          </div>
        </div>
      </div>

      <div className="container">
        {/* ITINERARY */}
        {tab === "itinerary" &&
          stops.map(stop => {
            const t = transitAfter(stop.id)
            return (
              <div key={stop.id}>
                <section className="destination" id={stop.id}>
                  <div className="dest-header">
                    <div className="dest-number">{stop.number}</div>
                    <div className="dest-meta">
                      <div className="dest-tag">{stop.tag}</div>
                      <h2 className="dest-name">
                        {stop.name.lead}
                        <em>{stop.name.em}</em>
                        {stop.name.trail}
                      </h2>
                      <p className="dest-dates">{stop.dates}</p>
                    </div>
                  </div>

                  <div className="days">
                    {stop.days.map(day => {
                      const done = !!checks[day.id]
                      const open = !!openNotes[day.id]
                      const hasNote = !!(notes[day.id] || "").trim()
                      return (
                        <div
                          className={`day-card${done ? " done" : ""}`}
                          key={day.id}
                        >
                          <div className="day-label">
                            <strong>{day.dateLabel}</strong>
                            {day.part}
                          </div>
                          <div className="day-content">
                            <button
                              className={`day-check${done ? " checked" : ""}`}
                              onClick={() => toggleCheck(day.id)}
                              aria-pressed={done}
                              title={done ? "Mark not done" : "Mark done"}
                            >
                              <span className="day-check-box">
                                {done ? "✓" : ""}
                              </span>
                              <span className="day-title">{day.title}</span>
                            </button>
                            <p className="day-desc">{day.desc}</p>

                            {(day.tags?.length || day.spots?.length) && (
                              <div className="day-highlights">
                                {day.tags?.map((tg, i) => (
                                  <span
                                    className={`tag tag-${tg.kind}`}
                                    key={`tag-${i}`}
                                  >
                                    {tg.label}
                                  </span>
                                ))}
                                {day.spots?.map((sp, i) => (
                                  <a
                                    className="tag tag-map"
                                    key={`spot-${i}`}
                                    href={sp.url || mapsUrl(sp.mapsQuery)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title={sp.note || `Open ${sp.name} in Maps`}
                                  >
                                    📍 {sp.name}
                                  </a>
                                ))}
                              </div>
                            )}

                            <div className="note-row">
                              <button
                                className="note-toggle"
                                onClick={() => toggleOpen(day.id)}
                              >
                                {open
                                  ? "− Hide note"
                                  : hasNote
                                    ? "✎ Edit note"
                                    : "＋ Add note"}
                              </button>
                              {hasNote && !open && (
                                <span className="note-preview">
                                  {notes[day.id]}
                                </span>
                              )}
                            </div>
                            {open && (
                              <textarea
                                className="note-input"
                                placeholder="Reservations, confirmation #s, ideas…"
                                value={notes[day.id] || ""}
                                onChange={e => setNote(day.id, e.target.value)}
                              />
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>

                {t && (
                  <div className="transit">
                    <span className="transit-icon">{t.icon}</span>
                    <span className="transit-text">
                      <strong>{t.lead}</strong> · {t.text}
                    </span>
                    <span
                      className={`transit-badge${t.booked ? " booked" : ""}`}
                    >
                      {t.badge || (t.booked ? "✓ Booked" : "To book")}
                    </span>
                  </div>
                )}

                {stop.id !== stops[stops.length - 1].id && (
                  <div className="section-divider" />
                )}
              </div>
            )
          })}

        {/* CHECKLIST */}
        {tab === "checklist" &&
          checklistCats.map(cat => {
            const items = checklist.filter(c => c.category === cat)
            if (!items.length) return null
            const done = items.filter(i => packing[i.id]).length
            return (
              <section className="list-section" key={cat}>
                <h3 className="list-head">
                  {cat}
                  <span className="list-count">
                    {done}/{items.length}
                  </span>
                </h3>
                <ul className="checklist">
                  {items.map(i => (
                    <li key={i.id}>
                      <label
                        className={`check-row${packing[i.id] ? " checked" : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={!!packing[i.id]}
                          onChange={() => togglePack(i.id)}
                        />
                        <span className="check-box">
                          {packing[i.id] ? "✓" : ""}
                        </span>
                        <span className="check-label">{i.label}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}

        {/* BUDGET */}
        {tab === "budget" && (
          <section className="list-section">
            <h3 className="list-head">
              Budget
              <span className="list-count">estimates</span>
            </h3>
            <ul className="budget">
              {budget.map(b => (
                <li className="budget-row" key={b.id}>
                  <span className="budget-label">{b.label}</span>
                  <span className="budget-amt">
                    {b.amount > 0
                      ? `${b.est ? "~" : ""}${usd(b.amount)}`
                      : "TBD"}
                  </span>
                  <span className={`budget-badge${b.booked ? " booked" : ""}`}>
                    {b.booked ? "Booked" : "Open"}
                  </span>
                </li>
              ))}
            </ul>
            <div className="budget-totals">
              <div>
                <span className="budget-total-label">Booked so far</span>
                <span className="budget-total-num">~{usd(bookedTotal)}</span>
              </div>
              <div>
                <span className="budget-total-label">Running total</span>
                <span className="budget-total-num">~{usd(grandTotal)}</span>
              </div>
            </div>
            <p className="budget-note">
              Estimates from planning notes. Flights are per-person where noted
              — edit <code>src/data/honeymoon.ts</code> to refine.
            </p>
          </section>
        )}
      </div>

      <footer>
        <div className="footer-title">{meta.dateRange}</div>
        <p>{meta.route.map(r => r.label).join(" · ")}</p>
      </footer>
    </>
  )
}
