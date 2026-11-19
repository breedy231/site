import PropTypes from "prop-types"
import { useState } from "react"

// The default, low-density view: where you are, what to do now, what comes
// after, and a couple of vital readouts. Everything else lives in the log.

const pad3 = n => String(n).padStart(3, "0")

// Vital readouts. "pips": a count in a thin box with a row of dots (one per
// item, lit when collected). "bar": a three-digit current/max counter.
const Readout = ({ counter, align = "left" }) => {
  const right = align === "right"
  return (
    <div className={`hud-readout ${right ? "text-right" : ""}`}>
      <div className="hud-label text-[0.58rem]">{counter.label}</div>
      {counter.style === "pips" ? (
        <div
          className={`mt-1 flex items-center gap-2 ${right ? "flex-row-reverse" : ""}`}
          aria-label={`${counter.done} of ${counter.total}`}
        >
          <span className="hud-readout-box hud-mono">
            {String(counter.done).padStart(2, "0")}
          </span>
          <span className="flex max-w-[10.5rem] flex-wrap gap-[2px]">
            {Array.from({ length: counter.total }, (_, i) => (
              <span key={i} data-on={i < counter.done} className="hud-dot" />
            ))}
          </span>
        </div>
      ) : (
        <div
          className="hud-mono mt-1 text-lg leading-none tabular-nums"
          aria-label={`${counter.done} of ${counter.total}`}
        >
          <span className="hud-glow">{pad3(counter.done)}</span>
          <span className="text-(--hud-muted)">/{pad3(counter.total)}</span>
        </div>
      )}
    </div>
  )
}

Readout.propTypes = {
  counter: PropTypes.object.isRequired,
  align: PropTypes.oneOf(["left", "right"]),
}

// Four small lights along the top edge double as the sync status.
const STATUS_LIGHTS = {
  "loading…": 1,
  "saving…": 2,
  "read-only": 3,
  editing: 4,
}

const VisorHud = ({
  title,
  pct,
  status,
  readouts,
  location,
  objective,
  pinned,
  waypoints,
  notesHtml,
  canWrite,
  onComplete,
  onOpenLog,
  logLabel,
  footnote,
  tall = false,
}) => {
  const [showNotes, setShowNotes] = useState(false)
  const [left, right] = readouts

  return (
    <div
      className={`hud-visor-frame flex flex-col ${tall ? "min-h-[calc(100svh-5rem)]" : "min-h-[78svh]"}`}
    >
      {/* Top edge: vitals in the corners, status lights between */}
      <div className="hud-topbar flex items-start justify-between gap-2">
        {left ? <Readout counter={left} /> : <span />}
        <div
          className="flex shrink-0 gap-1.5 pt-1"
          title={status}
          aria-label={`Sync: ${status}`}
        >
          {[1, 2, 3, 4].map(n => (
            <span
              key={n}
              data-on={n <= (STATUS_LIGHTS[status] || 0)}
              className="hud-light"
            />
          ))}
        </div>
        {right ? <Readout counter={right} align="right" /> : <span />}
      </div>
      <div className="mx-auto mt-3 flex w-full max-w-xl items-baseline justify-between gap-3 text-[0.65rem] text-(--hud-muted)">
        <span className="hud-label truncate text-[0.6rem]">{title}</span>
        <span className="hud-mono shrink-0 tabular-nums">
          {pct}% · {status}
        </span>
      </div>

      {/* Center: the objective, framed like a lock-on */}
      <div className="flex flex-1 flex-col justify-center py-8">
        {location && (
          <div className="hud-label hud-location text-center">{location}</div>
        )}
        <div className="hud-reticle mx-auto mt-3 w-full max-w-sm px-6 py-6 text-center">
          <div className="hud-label text-[0.6rem]">
            {objective
              ? pinned
                ? "Objective · pinned"
                : "Objective"
              : "Status"}
          </div>
          <p className="hud-title hud-glow mt-2 text-2xl leading-tight">
            {objective ? objective.name : "All clear"}
          </p>
          {objective?.hint && (
            <p className="mt-3 text-sm leading-snug text-(--hud-muted)">
              {objective.hint}
            </p>
          )}
          {objective && canWrite && (
            <button
              type="button"
              onClick={() => onComplete(objective.id)}
              className="hud-button mt-5"
            >
              Objective complete
            </button>
          )}
        </div>

        {waypoints.length > 0 && (
          <div className="mx-auto mt-6 w-full max-w-sm">
            <div className="hud-label text-[0.6rem]">Then</div>
            <ol className="mt-1 space-y-1">
              {waypoints.map(item => (
                <li key={item.id} className="flex items-baseline gap-2">
                  <span className="hud-waypoint" aria-hidden="true">
                    ›
                  </span>
                  <span className="text-sm">{item.name}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      {/* Bottom edge: notes on demand, then the log */}
      <div className="mx-auto w-full max-w-xl">
        {notesHtml && (
          <div className="mb-3">
            <button
              type="button"
              onClick={() => setShowNotes(v => !v)}
              aria-expanded={showNotes}
              className="hud-label w-full text-left"
            >
              {showNotes ? "▾" : "▸"} Field notes
            </button>
            {showNotes && (
              <div
                className="hud-notes prose prose-sm mt-2 max-w-none"
                dangerouslySetInnerHTML={{ __html: notesHtml }}
              />
            )}
          </div>
        )}
        <button
          type="button"
          onClick={onOpenLog}
          className="hud-label w-full rounded border border-(--hud-line) py-3"
        >
          {logLabel}
        </button>
        {footnote && (
          <p className="mt-3 text-center text-[0.6rem] text-(--hud-muted)">
            {footnote}
          </p>
        )}
      </div>
    </div>
  )
}

VisorHud.propTypes = {
  title: PropTypes.string.isRequired,
  pct: PropTypes.number.isRequired,
  status: PropTypes.string.isRequired,
  readouts: PropTypes.array.isRequired,
  location: PropTypes.string,
  objective: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    hint: PropTypes.string,
  }),
  pinned: PropTypes.bool,
  waypoints: PropTypes.array.isRequired,
  notesHtml: PropTypes.string,
  canWrite: PropTypes.bool,
  onComplete: PropTypes.func.isRequired,
  onOpenLog: PropTypes.func.isRequired,
  logLabel: PropTypes.string.isRequired,
  footnote: PropTypes.string,
  tall: PropTypes.bool,
}

export default VisorHud
