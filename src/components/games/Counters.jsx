import PropTypes from "prop-types"

// Collectible readouts. Styles: pips (squares), slots (diamonds, one per
// item, in document order), bar (meter).
const Meter = ({ counter, isDone }) => {
  if (counter.style === "pips") {
    return (
      <span className="mt-1 flex flex-wrap gap-1">
        {Array.from({ length: counter.total }, (_, i) => (
          <span key={i} data-on={i < counter.done} className="hud-pip" />
        ))}
      </span>
    )
  }
  if (counter.style === "slots") {
    return (
      <span className="mt-1.5 flex flex-wrap gap-2 pl-0.5">
        {counter.items.map(item => (
          <span
            key={item.id}
            data-on={isDone(item)}
            title={item.name}
            className="hud-slot"
          />
        ))}
      </span>
    )
  }
  const pct = counter.total
    ? Math.round((counter.done / counter.total) * 100)
    : 0
  return (
    <span className="hud-bar mt-1.5">
      <span style={{ width: `${pct}%` }} />
    </span>
  )
}

Meter.propTypes = {
  counter: PropTypes.object.isRequired,
  isDone: PropTypes.func.isRequired,
}

const Counters = ({ counters, isDone, selectedKind, onSelect }) => {
  if (!counters.length) return null
  return (
    <section className="hud-panel grid gap-3 p-4 sm:grid-cols-2">
      {counters.map(counter => (
        <button
          key={counter.kind}
          type="button"
          onClick={() => onSelect(counter.kind)}
          className={`-m-1 rounded border border-transparent p-1 text-left ${
            selectedKind === counter.kind ? "hud-selected" : ""
          }`}
        >
          <span className="flex items-baseline justify-between gap-2">
            <span className="hud-label">{counter.label}</span>
            <span className="hud-title text-sm tabular-nums">
              <span className="hud-glow">{counter.done}</span>
              <span className="text-(--hud-muted)"> / {counter.total}</span>
            </span>
          </span>
          <Meter counter={counter} isDone={isDone} />
        </button>
      ))}
    </section>
  )
}

Counters.propTypes = {
  counters: PropTypes.array.isRequired,
  isDone: PropTypes.func.isRequired,
  selectedKind: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
}

export default Counters
