import PropTypes from "prop-types"
import { iconFor } from "./hud"

// Pause-menu style grid: owned upgrades lit, the rest dim outlines.
const Inventory = ({ title, groups, isDone, selectedId, onSelect }) => {
  if (!groups.length) return null
  return (
    <section className="hud-panel p-4">
      <h2 className="hud-label">{title}</h2>
      <div className="mt-2 space-y-3">
        {groups.map(group => (
          <div key={group.name}>
            {groups.length > 1 && (
              <h3 className="hud-label mb-1 text-[0.6rem] opacity-80">
                {group.name}
              </h3>
            )}
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {group.items.map(item => (
                <button
                  key={item.id}
                  type="button"
                  data-on={isDone(item)}
                  onClick={() => onSelect(item.id)}
                  aria-label={`${item.name}${isDone(item) ? " (have)" : ""}`}
                  className={`hud-tile ${selectedId === item.id ? "hud-selected" : ""}`}
                >
                  <span className="hud-tile-code">{iconFor(item)}</span>
                  <span className="hud-tile-name">{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

Inventory.propTypes = {
  title: PropTypes.string.isRequired,
  groups: PropTypes.arrayOf(
    PropTypes.shape({ name: PropTypes.string, items: PropTypes.array }),
  ).isRequired,
  isDone: PropTypes.func.isRequired,
  selectedId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
}

export default Inventory
