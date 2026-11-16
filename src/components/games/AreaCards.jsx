import PropTypes from "prop-types"

// One card per region: completion, boss status, what's left.
const AreaCards = ({ areas, selectedId, onSelect }) => (
  <section>
    <h2 className="hud-label mb-2">Areas</h2>
    <div className="grid grid-cols-2 gap-2">
      {areas.map(area => {
        const cleared = area.total > 0 && area.done === area.total
        return (
          <button
            key={area.id}
            type="button"
            onClick={() => onSelect(area.id)}
            className={`hud-panel p-3 text-left ${
              selectedId === area.id ? "hud-selected" : ""
            }`}
          >
            <span className="hud-title block text-base leading-tight">
              {area.name}
            </span>
            <span className="hud-bar mt-2">
              <span style={{ width: `${area.pct}%` }} />
            </span>
            <span className="mt-2 flex items-center justify-between gap-2 text-xs">
              <span className="text-(--hud-muted) tabular-nums">
                {cleared ? "Cleared" : `${area.total - area.done} left`}
              </span>
              {area.bosses.length > 0 && (
                <span
                  className="tracking-widest"
                  aria-label={`${area.bosses.filter(b => b.done).length} of ${area.bosses.length} bosses down`}
                >
                  {area.bosses.map(boss => (
                    <span
                      key={boss.id}
                      title={boss.name}
                      className={boss.done ? "text-(--hud-muted)" : "hud-glow"}
                    >
                      {boss.done ? "◇" : "◆"}
                    </span>
                  ))}
                </span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  </section>
)

AreaCards.propTypes = {
  areas: PropTypes.array.isRequired,
  selectedId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
}

export default AreaCards
