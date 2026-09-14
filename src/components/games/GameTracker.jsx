import PropTypes from "prop-types"
import { useMemo, useState } from "react"
import useProgress from "./useProgress"
import { flattenItems, pickNextUp } from "./selectors"
import NextUp from "./NextUp"
import RegionSection from "./RegionSection"
import StatFields from "./StatFields"

const toggleFlag = (map, id) => {
  const next = { ...map }
  if (next[id]) delete next[id]
  else next[id] = true
  return next
}

const GameTracker = ({ game }) => {
  const {
    state,
    update,
    status,
    canWrite,
    setKey,
    clearKey,
    error,
    dismissError,
  } = useProgress(game.slug)

  const [showKeyInput, setShowKeyInput] = useState(false)
  const [keyDraft, setKeyDraft] = useState("")

  const ordered = useMemo(
    () => flattenItems(game.regions, state.custom),
    [game.regions, state.custom],
  )
  const total = ordered.length
  const doneCount = ordered.filter(item => state.done[item.id]).length
  const next = pickNextUp(ordered, state)

  const onToggleDone = id =>
    update(prev => ({ ...prev, done: toggleFlag(prev.done, id) }))
  const onTogglePin = id =>
    update(prev => ({ ...prev, pin: prev.pin === id ? null : id }))
  const onNoteChange = (id, value) =>
    update(prev => ({ ...prev, notes: { ...prev.notes, [id]: value } }))
  const onToggleClosed = regionId =>
    update(prev => ({ ...prev, closed: toggleFlag(prev.closed, regionId) }))
  const onStatChange = (key, value) =>
    update(prev => ({ ...prev, stats: { ...prev.stats, [key]: value } }))
  const onAddCustom = (regionId, name) =>
    update(prev => ({
      ...prev,
      custom: {
        ...prev.custom,
        [regionId]: [
          ...(prev.custom[regionId] || []),
          { id: `c${Date.now()}`, kind: "area", name },
        ],
      },
    }))

  const saveKey = e => {
    e.preventDefault()
    setKey(keyDraft)
    setKeyDraft("")
    setShowKeyInput(false)
  }

  return (
    <div className="mx-auto max-w-2xl p-4 font-sans text-gray-900 dark:text-white">
      <header className="mb-4">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl leading-tight font-normal">{game.title}</h1>
            {game.character && (
              <p className="text-sm text-gray-500 dark:text-gray-300">
                {game.character}
              </p>
            )}
          </div>
          <div className="shrink-0 text-right">
            <div className="text-2xl tabular-nums">
              {doneCount}/{total}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-300">
              {status === "loading"
                ? "loading…"
                : status === "saving"
                  ? "saving…"
                  : canWrite
                    ? "editing"
                    : "read-only"}
            </div>
          </div>
        </div>

        <StatFields
          stats={game.stats}
          values={state.stats}
          canWrite={canWrite}
          onChange={onStatChange}
        />

        <div className="mt-3 text-sm">
          {canWrite ? (
            <button
              type="button"
              onClick={clearKey}
              className="text-gray-500 underline decoration-red-500 underline-offset-2 dark:text-gray-300"
            >
              lock
            </button>
          ) : showKeyInput ? (
            <form onSubmit={saveKey} className="flex gap-2">
              <input
                type="password"
                value={keyDraft}
                autoFocus
                onChange={e => setKeyDraft(e.target.value)}
                placeholder="Write key"
                className="min-w-0 flex-1 rounded border border-gray-300 bg-transparent px-3 py-2 text-base dark:border-gray-600"
              />
              <button
                type="submit"
                className="shrink-0 rounded border border-gray-300 px-4 py-2 dark:border-gray-600"
              >
                Save
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowKeyInput(true)}
              className="rounded border border-gray-300 px-3 py-2 dark:border-gray-600"
            >
              Unlock editing
            </button>
          )}
        </div>
      </header>

      {error && (
        <div
          role="alert"
          onClick={dismissError}
          className="mb-4 cursor-pointer rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-600 dark:bg-red-900/20 dark:text-red-300"
        >
          {error}
        </div>
      )}

      <div className="mb-4">
        <NextUp item={next} />
      </div>

      <div className="space-y-3">
        {game.regions.map(region => (
          <RegionSection
            key={region.id}
            region={region}
            links={game.links}
            state={state}
            canWrite={canWrite}
            onToggleClosed={() => onToggleClosed(region.id)}
            onToggleDone={onToggleDone}
            onTogglePin={onTogglePin}
            onNoteChange={onNoteChange}
            onAddCustom={name => onAddCustom(region.id, name)}
          />
        ))}
      </div>
    </div>
  )
}

GameTracker.propTypes = {
  game: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    character: PropTypes.string,
    links: PropTypes.object,
    stats: PropTypes.array.isRequired,
    regions: PropTypes.array.isRequired,
  }).isRequired,
}

export default GameTracker
