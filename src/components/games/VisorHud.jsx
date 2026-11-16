import PropTypes from "prop-types"
import { useState } from "react"

// The default, low-density view: where you are, what to do now, what comes
// after, and a couple of vital readouts. Everything else lives in the log.

const Readout = ({ counter, align = "left" }) => (
  <div className={align === "right" ? "text-right" : ""}>
    <div className="hud-label text-[0.6rem]">{counter.label}</div>
    {counter.style === "pips" ? (
      <div
        className={`mt-1 flex flex-wrap gap-0.5 ${align === "right" ? "justify-end" : ""}`}
        aria-label={`${counter.done} of ${counter.total}`}
      >
        {counter.items.map((item, i) => (
          <span
            key={item.id}
            data-on={i < counter.done}
            className="hud-pip hud-pip-sm"
          />
        ))}
      </div>
    ) : (
      <div className="hud-title text-lg leading-none tabular-nums">
        <span className="hud-glow">{counter.done}</span>
        <span className="text-xs text-(--hud-muted)">/{counter.total}</span>
      </div>
    )}
  </div>
)

Readout.propTypes = {
  counter: PropTypes.object.isRequired,
  align: PropTypes.oneOf(["left", "right"]),
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
}) => {
  const [showNotes, setShowNotes] = useState(false)
  const [left, right] = readouts

  return (
    <div className="hud-visor-frame flex min-h-[78svh] flex-col">
      {/* Top edge: game + vitals */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="hud-label truncate">{title}</div>
          <div className="mt-0.5 text-[0.65rem] text-(--hud-muted) tabular-nums">
            {pct}% · {status}
          </div>
        </div>
        {right && <Readout counter={right} align="right" />}
      </div>
      {left && (
        <div className="mt-3">
          <Readout counter={left} />
        </div>
      )}

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
                  <span className="hud-waypoint" aria-hidden="true" />
                  <span className="text-sm">{item.name}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      {/* Bottom edge: notes on demand, then the log */}
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
}

export default VisorHud
