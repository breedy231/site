import PropTypes from "prop-types"
import { useEffect, useMemo, useRef, useState } from "react"
import useProgress from "./useProgress"
import useSteam, { formatPlaytimeLine } from "./useSteam"
import {
  countDone,
  flattenItems,
  isItemDone,
  pickNextUp,
  pickWaypoints,
  steamUnlockAt,
} from "./selectors"
import { kindBadge, resolveKinds } from "./kinds"
import {
  areaSummary,
  counterFor,
  inventoryGroups,
  regionIndex,
  resolveHud,
} from "./hud"
import AddItemForm from "./AddItemForm"
import AreaCards from "./AreaCards"
import ChecklistItem from "./ChecklistItem"
import Counters from "./Counters"
import Inventory from "./Inventory"
import VisorHud from "./VisorHud"
import RegionSection from "./RegionSection"
import StatFields from "./StatFields"

// Themes with a dark backdrop; the wrapper gets `.dark` so badges and inputs
// pick their dark-mode colors regardless of the site's light/dark setting.
const DARK_THEMES = new Set(["visor", "erdtree"])

const toggleFlag = (map, id) => {
  const next = { ...map }
  if (next[id]) delete next[id]
  else next[id] = true
  return next
}

const sameFocus = (a, b) => a && b && a.type === b.type && a.id === b.id

// notesHtml is rendered at build time from the YAML `notes` (trusted repo content).
const GameTracker = ({ game, notesHtml }) => {
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

  const { achievements, playtime2w, lastPlayed } = useSteam(game.steam?.appid)

  const [showKeyInput, setShowKeyInput] = useState(false)
  const [keyDraft, setKeyDraft] = useState("")
  const [hideDone, setHideDone] = useState(false)
  // What the detail panel shows: {type: "item"|"kind"|"region"|"all", id}.
  const [focus, setFocus] = useState(null)
  const detailRef = useRef(null)
  // "visor" (default HUD) or "log" (inventory, areas, checklist); #log in the URL.
  const [view, setView] = useState("visor")
  useEffect(() => {
    const sync = () =>
      setView(window.location.hash === "#log" ? "log" : "visor")
    sync()
    window.addEventListener("hashchange", sync)
    return () => window.removeEventListener("hashchange", sync)
  }, [])
  const openView = target => {
    window.location.hash = target === "log" ? "log" : ""
    window.scrollTo({ top: 0 })
  }

  const kinds = useMemo(() => resolveKinds(game.kinds), [game.kinds])
  const ordered = useMemo(
    () => flattenItems(game.regions, state.custom),
    [game.regions, state.custom],
  )
  const regionOf = useMemo(
    () => regionIndex(game.regions, state.custom),
    [game.regions, state.custom],
  )
  const hud = useMemo(() => resolveHud(game.hud, ordered), [game.hud, ordered])

  const isDone = item => isItemDone(item, state, achievements)
  const total = ordered.length
  const doneCount = countDone(ordered, state, achievements)
  const pct = total ? Math.round((doneCount / total) * 100) : 0
  const next = pickNextUp(ordered, state, achievements, game.route)
  const waypoints = pickWaypoints(
    ordered,
    state,
    achievements,
    game.route,
    next?.id,
  )
  const nextRegion = next ? regionOf[next.id] : null
  const playtimeLine = formatPlaytimeLine({ playtime2w, lastPlayed })

  const groups = inventoryGroups(ordered, hud.inventory)
  const counters = hud.counters.map(counter =>
    counterFor(
      ordered,
      { label: kinds[counter.kind]?.label || counter.kind, ...counter },
      state,
      achievements,
    ),
  )
  const readouts = (
    hud.readouts?.length ? hud.readouts : hud.counters.slice(0, 2)
  ).map(cfg =>
    counterFor(
      ordered,
      { label: kinds[cfg.kind]?.label || cfg.kind, style: "bar", ...cfg },
      state,
      achievements,
    ),
  )
  const areas = game.regions.map(region =>
    areaSummary(region, state.custom, state, achievements),
  )

  useEffect(() => {
    if (focus && detailRef.current) {
      detailRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [focus])

  const toggleFocus = target =>
    setFocus(prev => (sameFocus(prev, target) ? null : target))

  const onToggleDone = id =>
    update(prev => ({ ...prev, done: toggleFlag(prev.done, id) }))
  // Completing the objective also clears its pin so the route moves on.
  const onComplete = id =>
    update(prev => ({
      ...prev,
      done: { ...prev.done, [id]: true },
      pin: prev.pin === id ? null : prev.pin,
    }))
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

  // Pinned items stay visible even when done-hiding is on.
  const visible = items =>
    hideDone
      ? items.filter(item => state.pin === item.id || !isDone(item))
      : items

  const renderItem = item => (
    <ChecklistItem
      key={item.id}
      item={item}
      badge={kindBadge(kinds, item.kind)}
      links={game.links}
      done={isDone(item)}
      steamUnlock={steamUnlockAt(item, achievements)}
      note={state.notes[item.id]}
      pinned={state.pin === item.id}
      canWrite={canWrite}
      onToggleDone={() => onToggleDone(item.id)}
      onTogglePin={() => onTogglePin(item.id)}
      onNoteChange={value => onNoteChange(item.id, value)}
    />
  )

  const renderDetail = () => {
    if (!focus) return null
    let label = ""
    let title = ""
    let body = null

    if (focus.type === "item") {
      const item = ordered.find(i => i.id === focus.id)
      if (!item) return null
      label = regionOf[item.id]?.name || "Item"
      title = item.name
      body = <ul>{renderItem(item)}</ul>
    } else if (focus.type === "kind") {
      const counter = counters.find(c => c.kind === focus.id)
      label = "Collection"
      title = counter?.label || focus.id
      body = game.regions.map(region => {
        const list = visible(
          ordered.filter(
            i => i.kind === focus.id && regionOf[i.id]?.id === region.id,
          ),
        )
        if (!list.length) return null
        return (
          <div key={region.id} className="mt-2">
            <h4 className="hud-label">{region.name}</h4>
            <ul>{list.map(renderItem)}</ul>
          </div>
        )
      })
    } else if (focus.type === "region") {
      const region = game.regions.find(r => r.id === focus.id)
      if (!region) return null
      label = "Area"
      title = region.name
      const list = visible(
        ordered.filter(i => regionOf[i.id]?.id === region.id),
      )
      body = (
        <>
          <ul>{list.map(renderItem)}</ul>
          {list.length === 0 && (
            <p className="py-2 text-sm text-(--hud-muted)">All done here.</p>
          )}
          <AddItemForm
            canWrite={canWrite}
            onAdd={name => onAddCustom(region.id, name)}
          />
        </>
      )
    } else if (focus.type === "all") {
      label = "Everything"
      title = "Full checklist"
      body = (
        <div className="space-y-3">
          {game.regions.map(region => (
            <RegionSection
              key={region.id}
              region={region}
              links={game.links}
              kinds={kinds}
              hideDone={hideDone}
              state={state}
              achievements={achievements}
              canWrite={canWrite}
              onToggleClosed={() => onToggleClosed(region.id)}
              onToggleDone={onToggleDone}
              onTogglePin={onTogglePin}
              onNoteChange={onNoteChange}
              onAddCustom={name => onAddCustom(region.id, name)}
            />
          ))}
        </div>
      )
    }

    return (
      <section ref={detailRef} className="hud-panel scroll-mt-4 p-4">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="hud-label">{label}</h3>
            <p className="hud-title text-lg leading-tight">{title}</p>
          </div>
          {focus.type !== "item" && (
            <label className="flex shrink-0 cursor-pointer items-center gap-2 pt-1 text-xs text-(--hud-muted)">
              <input
                type="checkbox"
                checked={hideDone}
                onChange={e => setHideDone(e.target.checked)}
                className="h-4 w-4 accent-(--hud-accent)"
              />
              Hide done
            </label>
          )}
          <button
            type="button"
            onClick={() => setFocus(null)}
            aria-label="Close"
            className="-mt-1 -mr-2 h-9 w-9 shrink-0 text-lg text-(--hud-muted)"
          >
            ×
          </button>
        </div>
        <div className="mt-1">{body}</div>
      </section>
    )
  }

  const theme = game.theme || "plain"
  const wrapperClass = `hud hud-${theme} ${DARK_THEMES.has(theme) ? "dark" : ""} mx-auto max-w-2xl p-4 sm:p-5`
  // Tint the HUD with the accent of the area the objective is in.
  const wrapperStyle = nextRegion?.accent
    ? { "--area-accent": nextRegion.accent }
    : undefined
  const statusText =
    status === "loading"
      ? "loading…"
      : status === "saving"
        ? "saving…"
        : canWrite
          ? "editing"
          : "read-only"

  const errorBanner = error && (
    <div
      role="alert"
      onClick={dismissError}
      className="mb-4 cursor-pointer rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-600 dark:bg-red-900/20 dark:text-red-300"
    >
      {error}
    </div>
  )

  if (view === "visor") {
    return (
      <div className={wrapperClass} style={wrapperStyle}>
        {errorBanner}
        <VisorHud
          title={game.title}
          pct={pct}
          status={statusText}
          readouts={readouts}
          location={nextRegion?.name}
          objective={next}
          pinned={Boolean(next && state.pin === next.id)}
          waypoints={waypoints}
          notesHtml={notesHtml}
          canWrite={canWrite}
          onComplete={onComplete}
          onOpenLog={() => openView("log")}
          logLabel={hud.logLabel || "Logbook"}
          footnote={game.footnote}
        />
      </div>
    )
  }

  return (
    <div className={`${wrapperClass} space-y-4`} style={wrapperStyle}>
      <button
        type="button"
        onClick={() => openView("visor")}
        className="hud-label"
      >
        ‹ Back to visor
      </button>
      <header>
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="hud-title text-3xl leading-tight font-normal">
              {game.title}
            </h1>
            {game.character && (
              <p className="hud-label mt-1">{game.character}</p>
            )}
          </div>
          <div className="shrink-0 text-right">
            <div className="hud-title hud-glow text-3xl leading-none tabular-nums">
              {pct}%
            </div>
            <div className="mt-1 text-xs text-(--hud-muted) tabular-nums">
              {doneCount}/{total} · {statusText}
            </div>
          </div>
        </div>

        {playtimeLine && (
          <p className="mt-2 text-xs text-(--hud-muted)">{playtimeLine}</p>
        )}

        <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
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
                className="text-(--hud-muted) underline decoration-(--hud-accent) underline-offset-2"
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
                  className="min-w-0 flex-1 rounded border border-(--hud-line) bg-transparent px-3 py-2 text-base"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded border border-(--hud-line) px-4 py-2"
                >
                  Save
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setShowKeyInput(true)}
                className="rounded border border-(--hud-line) px-3 py-2"
              >
                Unlock editing
              </button>
            )}
          </div>
        </div>
      </header>

      {errorBanner}

      <Inventory
        title={hud.inventory?.title || kinds[hud.inventory?.kind]?.label || ""}
        groups={groups}
        isDone={isDone}
        selectedId={focus?.type === "item" ? focus.id : null}
        onSelect={id => toggleFocus({ type: "item", id })}
      />

      <Counters
        counters={counters}
        isDone={isDone}
        selectedKind={focus?.type === "kind" ? focus.id : null}
        onSelect={kind => toggleFocus({ type: "kind", id: kind })}
      />

      <AreaCards
        areas={areas}
        selectedId={focus?.type === "region" ? focus.id : null}
        onSelect={id => toggleFocus({ type: "region", id })}
      />

      {renderDetail()}

      {focus?.type !== "all" && (
        <button
          type="button"
          onClick={() => toggleFocus({ type: "all", id: "all" })}
          className="hud-label w-full rounded border border-(--hud-line) py-3"
        >
          Full checklist
        </button>
      )}
    </div>
  )
}

GameTracker.propTypes = {
  game: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    character: PropTypes.string,
    theme: PropTypes.string,
    links: PropTypes.object,
    steam: PropTypes.shape({ appid: PropTypes.number }),
    kinds: PropTypes.object,
    hud: PropTypes.object,
    footnote: PropTypes.string,
    route: PropTypes.arrayOf(PropTypes.string),
    stats: PropTypes.array.isRequired,
    regions: PropTypes.array.isRequired,
  }).isRequired,
  notesHtml: PropTypes.string,
}

export default GameTracker
