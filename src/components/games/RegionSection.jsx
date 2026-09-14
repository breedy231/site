import PropTypes from "prop-types"
import { useState } from "react"
import ChecklistItem from "./ChecklistItem"

const RegionSection = ({
  region,
  links,
  state,
  canWrite,
  onToggleClosed,
  onToggleDone,
  onTogglePin,
  onNoteChange,
  onAddCustom,
}) => {
  const [draft, setDraft] = useState("")

  const custom = state.custom[region.id] || []
  const items = [...region.items, ...custom]
  const total = items.length
  const doneCount = items.filter(item => state.done[item.id]).length
  const closed = Boolean(state.closed[region.id])
  const pct = total ? Math.round((doneCount / total) * 100) : 0

  const submit = e => {
    e.preventDefault()
    const name = draft.trim()
    if (!name) return
    onAddCustom(name)
    setDraft("")
  }

  return (
    <section className="rounded border border-gray-300 dark:border-gray-600">
      <button
        type="button"
        onClick={onToggleClosed}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <span className="w-4 shrink-0 text-gray-500 dark:text-gray-300">
          {closed ? "▸" : "▾"}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg leading-tight">{region.name}</span>
          <span className="mt-2 block h-1 w-full rounded bg-gray-300 dark:bg-gray-600">
            <span
              className="block h-1 rounded bg-red-500"
              style={{ width: `${pct}%` }}
            />
          </span>
        </span>
        <span className="shrink-0 text-sm text-gray-500 tabular-nums dark:text-gray-300">
          {doneCount}/{total}
        </span>
      </button>

      {!closed && (
        <div className="px-4 pb-3">
          <ul>
            {items.map(item => (
              <ChecklistItem
                key={item.id}
                item={item}
                links={links}
                done={Boolean(state.done[item.id])}
                note={state.notes[item.id]}
                pinned={state.pin === item.id}
                canWrite={canWrite}
                onToggleDone={() => onToggleDone(item.id)}
                onTogglePin={() => onTogglePin(item.id)}
                onNoteChange={value => onNoteChange(item.id, value)}
              />
            ))}
          </ul>

          <form onSubmit={submit} className="mt-3 flex gap-2">
            <input
              type="text"
              value={draft}
              disabled={!canWrite}
              onChange={e => setDraft(e.target.value)}
              placeholder="Add an item"
              className="min-w-0 flex-1 rounded border border-gray-300 bg-transparent px-3 py-2 text-base text-gray-900 disabled:opacity-40 dark:border-gray-600 dark:text-white"
            />
            <button
              type="submit"
              disabled={!canWrite}
              className="shrink-0 rounded border border-gray-300 px-4 py-2 text-sm disabled:opacity-40 dark:border-gray-600"
            >
              Add
            </button>
          </form>
        </div>
      )}
    </section>
  )
}

RegionSection.propTypes = {
  region: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    items: PropTypes.array.isRequired,
  }).isRequired,
  links: PropTypes.object,
  state: PropTypes.object.isRequired,
  canWrite: PropTypes.bool,
  onToggleClosed: PropTypes.func.isRequired,
  onToggleDone: PropTypes.func.isRequired,
  onTogglePin: PropTypes.func.isRequired,
  onNoteChange: PropTypes.func.isRequired,
  onAddCustom: PropTypes.func.isRequired,
}

export default RegionSection
