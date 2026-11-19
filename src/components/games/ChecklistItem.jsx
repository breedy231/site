import PropTypes from "prop-types"
import { useState } from "react"
import { buildLink } from "./links"
import { formatUnlockDate } from "./useSteam"

const ChecklistItem = ({
  item,
  badge,
  links,
  done,
  note,
  pinned,
  steamUnlock,
  canWrite,
  onToggleDone,
  onTogglePin,
  onNoteChange,
}) => {
  const [showNote, setShowNote] = useState(Boolean(note))

  const steamConfirmed = steamUnlock !== null && steamUnlock !== undefined
  const unlockedOn = formatUnlockDate(steamUnlock)
  const steamTitle = unlockedOn
    ? `Unlocked on Steam ${unlockedOn}`
    : "Unlocked on Steam"

  const wiki = buildLink(links?.wiki, item.name)
  const map = buildLink(links?.map, item.name)

  return (
    <li className="border-b border-(--hud-line) py-1 last:border-b-0">
      <div className="flex items-start gap-2">
        <label
          className={`flex h-11 w-11 shrink-0 items-center justify-center ${
            steamConfirmed ? "cursor-default" : "cursor-pointer"
          }`}
          title={steamConfirmed ? steamTitle : undefined}
        >
          <span className="sr-only">{`Mark ${item.name} done`}</span>
          <input
            type="checkbox"
            checked={steamConfirmed ? true : done}
            disabled={!canWrite || steamConfirmed}
            onChange={onToggleDone}
            className="h-5 w-5 accent-(--hud-accent)"
          />
        </label>

        <div className="min-w-0 flex-1 py-2">
          <button
            type="button"
            onClick={() => setShowNote(v => !v)}
            className={`block w-full text-left text-base leading-snug ${
              done ? "text-(--hud-muted) line-through" : "text-(--hud-text)"
            }`}
          >
            {item.name}
          </button>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            <span
              className={`rounded border px-1.5 py-0.5 uppercase ${badge.className}`}
            >
              {badge.label}
            </span>
            {steamConfirmed && (
              <span
                title={steamTitle}
                className="rounded border border-sky-600 bg-sky-600 px-1.5 py-0.5 text-white uppercase dark:border-sky-500 dark:bg-sky-500 dark:text-gray-900"
              >
                Steam
              </span>
            )}
            {wiki && (
              <a
                href={wiki}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-(--hud-accent) underline-offset-2"
              >
                wiki
              </a>
            )}
            {map && (
              <a
                href={map}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-(--hud-accent) underline-offset-2"
              >
                map
              </a>
            )}
          </div>

          {item.hint && (
            <p className="mt-1 text-xs text-(--hud-muted)">{item.hint}</p>
          )}

          {showNote && (
            <textarea
              value={note || ""}
              readOnly={!canWrite}
              onChange={e => onNoteChange(e.target.value)}
              placeholder="Notes"
              rows={2}
              className="mt-2 w-full rounded border border-(--hud-line) bg-transparent p-2 text-sm text-(--hud-text)"
            />
          )}
        </div>

        <button
          type="button"
          onClick={onTogglePin}
          disabled={!canWrite}
          aria-label={pinned ? `Unpin ${item.name}` : `Pin ${item.name}`}
          className="h-11 w-11 shrink-0 text-lg text-(--hud-muted) disabled:opacity-40"
        >
          {pinned ? "★" : "☆"}
        </button>
      </div>
    </li>
  )
}

ChecklistItem.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    kind: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    hint: PropTypes.string,
  }).isRequired,
  badge: PropTypes.shape({
    label: PropTypes.string.isRequired,
    className: PropTypes.string.isRequired,
  }).isRequired,
  links: PropTypes.shape({
    map: PropTypes.string,
    wiki: PropTypes.string,
  }),
  done: PropTypes.bool,
  note: PropTypes.string,
  pinned: PropTypes.bool,
  steamUnlock: PropTypes.number,
  canWrite: PropTypes.bool,
  onToggleDone: PropTypes.func.isRequired,
  onTogglePin: PropTypes.func.isRequired,
  onNoteChange: PropTypes.func.isRequired,
}

export default ChecklistItem
