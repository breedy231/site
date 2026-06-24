import { useEffect, useMemo, useState } from "react"
import { meta, stops, transits, checklist, budget } from "../data/honeymoon"

const STORAGE_KEY = "honeymoon-tracker-v1"

const mapsUrl = q =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`

// Multi-stop route for a day: directions through all spots (origin = current
// location), single spot falls back to a plain search.
const dayRouteUrl = spots => {
  if (!spots || !spots.length) return null
  if (spots.length === 1) return mapsUrl(spots[0].mapsQuery)
  const pts = spots.map(s => encodeURIComponent(s.mapsQuery))
  const destination = pts[pts.length - 1]
  const waypoints = pts.slice(0, -1).join("|")
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}&waypoints=${waypoints}`
}

// Transits render after these stops, in order.
const TRANSIT_ORDER = ["london", "mykonos", "paros", "milos", "nice", "nyc"]
const transitAfter = stopId => {
  const i = TRANSIT_ORDER.indexOf(stopId)
  return i === -1 ? null : transits[i]
}

// Hero route label → stop id to scroll to.
const ROUTE_TO_STOP = {
  Chicago: "departure",
  London: "london",
  Mykonos: "mykonos",
  Paros: "paros",
  Milos: "milos",
  Nice: "nice",
  "New York": "nyc",
  Home: "nyc",
}

const usd = n =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  })

const parseISO = s => {
  const [y, m, d] = s.split("-").map(Number)
  return new Date(y, m - 1, d)
}
const todayISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`
}
const dayDiff = (a, b) => Math.round((parseISO(b) - parseISO(a)) / 86400000)

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore */
  }
  return {}
}

const scrollToId = id => {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
}

export default function HoneymoonTracker() {
  const [checks, setChecks] = useState({})
  const [notes, setNotes] = useState({})
  const [conf, setConf] = useState({})
  const [links, setLinks] = useState({})
  const [packing, setPacking] = useState({})
  const [openDetails, setOpenDetails] = useState({})
  const [tab, setTab] = useState("itinerary")
  const [view, setView] = useState("story") // story | agenda
  const [hydrated, setHydrated] = useState(false)

  // Hydrate from localStorage after mount (client:only — no SSR mismatch).
  useEffect(() => {
    const s = loadState()
    if (s.checks) setChecks(s.checks)
    if (s.notes) setNotes(s.notes)
    if (s.conf) setConf(s.conf)
    if (s.links) setLinks(s.links)
    if (s.packing) setPacking(s.packing)
    setHydrated(true)
  }, [])

  // Persist on change.
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ checks, notes, conf, links, packing }),
      )
    } catch {
      /* ignore */
    }
  }, [checks, notes, conf, links, packing, hydrated])

  // Scroll-reveal for the Story view's destination sections.
  useEffect(() => {
    if (tab !== "itinerary" || view !== "story") return
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
  }, [tab, view, hydrated])

  const allDays = useMemo(() => stops.flatMap(s => s.days), [])
  const doneCount = allDays.filter(d => checks[d.id]).length
  const pct = allDays.length
    ? Math.round((doneCount / allDays.length) * 100)
    : 0

  // ── "Today" awareness ──────────────────────────────────────────────────────
  const tripStart = allDays[0].date
  const tripEnd = allDays[allDays.length - 1].date
  const status = useMemo(() => {
    const t = todayISO()
    if (dayDiff(t, tripStart) > 0)
      return { phase: "before", days: dayDiff(t, tripStart) }
    if (dayDiff(tripEnd, t) >= 0)
      return { phase: "during", day: dayDiff(tripStart, t) + 1 }
    return { phase: "after" }
  }, [tripStart, tripEnd])

  const today = todayISO()
  // current day = last day card matching today (where the day ends up)
  const currentDay = useMemo(() => {
    const matches = allDays.filter(d => d.date === today)
    return matches.length ? matches[matches.length - 1] : null
  }, [allDays, today])
  const currentStopId = useMemo(() => {
    if (!currentDay) return null
    const s = stops.find(st => st.days.some(d => d.id === currentDay.id))
    return s ? s.id : null
  }, [currentDay])

  const totalDays = dayDiff(tripStart, tripEnd) + 1

  const toggleCheck = id => setChecks(c => ({ ...c, [id]: !c[id] }))
  const togglePack = id => setPacking(p => ({ ...p, [id]: !p[id] }))
  const setNote = (id, v) => setNotes(n => ({ ...n, [id]: v }))
  const setConfVal = (id, v) => setConf(c => ({ ...c, [id]: v }))
  const setLinkVal = (id, v) => setLinks(l => ({ ...l, [id]: v }))
  const toggleOpen = id => setOpenDetails(o => ({ ...o, [id]: !o[id] }))

  const bookedTotal = budget
    .filter(b => b.booked)
    .reduce((s, b) => s + b.amount, 0)
  const grandTotal = budget.reduce((s, b) => s + b.amount, 0)
  const checklistCats = ["To Book", "Before We Go", "Packing"]

  const goToday = () => currentDay && scrollToId(`day-${currentDay.id}`)

  // ── Shared per-day detail panel (notes / confirmation / link) ───────────────
  const renderDetails = day => {
    const open = !!openDetails[day.id]
    const hasData = !!(
      (notes[day.id] || "").trim() ||
      (conf[day.id] || "").trim() ||
      (links[day.id] || "").trim()
    )
    return (
      <div className="details">
        <div className="details-actions">
          <button className="mini-btn" onClick={() => toggleOpen(day.id)}>
            {open ? "− Hide details" : hasData ? "✎ Details" : "＋ Add details"}
          </button>
          {day.spots && day.spots.length > 0 && (
            <a
              className="mini-btn"
              href={dayRouteUrl(day.spots)}
              target="_blank"
              rel="noopener noreferrer"
            >
              🗺 Day route in Maps
            </a>
          )}
          {links[day.id] && (
            <a
              className="mini-btn link-live"
              href={links[day.id]}
              target="_blank"
              rel="noopener noreferrer"
            >
              ↗ Booking
            </a>
          )}
          {conf[day.id] && !open && (
            <span className="conf-chip">#{conf[day.id]}</span>
          )}
        </div>
        {open && (
          <div className="details-fields">
            <label className="field">
              <span className="field-label">Confirmation #</span>
              <input
                className="field-input"
                value={conf[day.id] || ""}
                onChange={e => setConfVal(day.id, e.target.value)}
                placeholder="e.g. ABC123"
              />
            </label>
            <label className="field">
              <span className="field-label">Booking link</span>
              <input
                className="field-input"
                value={links[day.id] || ""}
                onChange={e => setLinkVal(day.id, e.target.value)}
                placeholder="https://…"
              />
            </label>
            <label className="field field-wide">
              <span className="field-label">Notes</span>
              <textarea
                className="field-input note-input"
                value={notes[day.id] || ""}
                onChange={e => setNote(day.id, e.target.value)}
                placeholder="Reservations, ideas, reminders…"
              />
            </label>
          </div>
        )}
      </div>
    )
  }

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
            <span key={r.label + i} style={{ display: "contents" }}>
              <button
                className={`hero-route-stop${r.highlight ? " highlight" : ""}`}
                onClick={() => scrollToId(ROUTE_TO_STOP[r.label] || "")}
              >
                {r.label}
              </button>
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

      {/* STATUS / TODAY BANNER */}
      <div className={`status status-${status.phase}`}>
        {status.phase === "before" && (
          <span>
            ✈ <strong>{status.days}</strong>{" "}
            {status.days === 1 ? "day" : "days"} until departure
          </span>
        )}
        {status.phase === "during" && (
          <>
            <span>
              💛 <strong>Day {status.day}</strong> of {totalDays}
              {currentDay ? ` · ${currentDay.dateLabel}` : ""}
            </span>
            {currentDay && (
              <button className="status-btn" onClick={goToday}>
                Jump to today ↓
              </button>
            )}
          </>
        )}
        {status.phase === "after" && <span>💛 Welcome home</span>}
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

        {tab === "itinerary" && (
          <div className="subbar">
            <div className="viewtoggle">
              <button
                className={`vt${view === "story" ? " active" : ""}`}
                onClick={() => setView("story")}
              >
                Story
              </button>
              <button
                className={`vt${view === "agenda" ? " active" : ""}`}
                onClick={() => setView("agenda")}
              >
                Agenda
              </button>
            </div>
            <div className="stopnav">
              {stops.map(s => (
                <button
                  key={s.id}
                  className={`stopchip${currentStopId === s.id ? " current" : ""}`}
                  onClick={() => scrollToId(s.id)}
                >
                  {s.name.em}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="container">
        {/* ITINERARY — STORY VIEW */}
        {tab === "itinerary" &&
          view === "story" &&
          stops.map(stop => {
            const t = transitAfter(stop.id)
            return (
              <div key={stop.id}>
                <section
                  className={`destination${currentStopId === stop.id ? " current-stop" : ""}`}
                  id={stop.id}
                >
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
                      const isToday = day.date === today
                      return (
                        <div
                          className={`day-card${done ? " done" : ""}${isToday ? " today" : ""}`}
                          id={`day-${day.id}`}
                          key={day.id}
                        >
                          <div className="day-label">
                            <strong>{day.dateLabel}</strong>
                            {day.part}
                            {isToday && (
                              <span className="today-pill">Today</span>
                            )}
                          </div>
                          <div className="day-content">
                            <button
                              className={`day-check${done ? " checked" : ""}`}
                              onClick={() => toggleCheck(day.id)}
                              aria-pressed={done}
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
                                  >
                                    📍 {sp.name}
                                  </a>
                                ))}
                              </div>
                            )}

                            {renderDetails(day)}
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

        {/* ITINERARY — AGENDA VIEW */}
        {tab === "itinerary" &&
          view === "agenda" &&
          stops.map(stop => {
            const t = transitAfter(stop.id)
            return (
              <div key={stop.id} className="agenda-stop" id={stop.id}>
                <div
                  className={`agenda-head${currentStopId === stop.id ? " current" : ""}`}
                >
                  <span className="agenda-stop-name">
                    {stop.name.lead}
                    {stop.name.em}
                    {stop.name.trail}
                  </span>
                  <span className="agenda-stop-dates">{stop.dates}</span>
                </div>
                {stop.days.map(day => {
                  const done = !!checks[day.id]
                  const isToday = day.date === today
                  return (
                    <div
                      className={`agenda-row${done ? " done" : ""}${isToday ? " today" : ""}`}
                      id={`day-${day.id}`}
                      key={day.id}
                    >
                      <button
                        className={`agenda-check${done ? " checked" : ""}`}
                        onClick={() => toggleCheck(day.id)}
                        aria-pressed={done}
                      >
                        {done ? "✓" : ""}
                      </button>
                      <div className="agenda-when">
                        <span className="agenda-date">{day.dateLabel}</span>
                        <span className="agenda-part">{day.part}</span>
                      </div>
                      <div className="agenda-main">
                        <div className="agenda-title">
                          {day.title}
                          {isToday && <span className="today-pill">Today</span>}
                        </div>
                        {day.spots && day.spots.length > 0 && (
                          <a
                            className="agenda-maps"
                            href={dayRouteUrl(day.spots)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            🗺 {day.spots.length} spots
                          </a>
                        )}
                      </div>
                    </div>
                  )
                })}
                {t && (
                  <div className="agenda-transit">
                    <span>{t.icon}</span>
                    <span>
                      <strong>{t.lead}</strong> · {t.text}
                    </span>
                  </div>
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
              Estimates from planning notes. Edit{" "}
              <code>src/data/honeymoon.ts</code> to refine.
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
