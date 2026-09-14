import PropTypes from "prop-types"
import { useState } from "react"
import { buildLink } from "./links"

const KIND_STYLES = {
  boss: "border-red-400 text-red-600 dark:border-red-500 dark:text-red-300",
  quest:
    "border-blue-400 text-blue-600 dark:border-blue-400 dark:text-blue-300",
  item: "border-amber-500 text-amber-700 dark:border-amber-400 dark:text-amber-300",
  area: "border-gray-300 text-gray-500 dark:border-gray-600 dark:text-gray-300",
}

const ChecklistItem = ({
  item,
  links,
  done,
  note,
  pinned,
  canWrite,
  onToggleDone,
  onTogglePin,
  onNoteChange,
}) => {
  const [showNote, setShowNote] = useState(Boolean(note))

  const wiki = buildLink(links?.wiki, item.name)
  const map = buildLink(links?.map, item.name)

  return (
    <li className="border-b border-gray-300 py-1 last:border-b-0 dark:border-gray-600">
      <div className="flex items-start gap-2">
        <label className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center">
          <span className="sr-only">{`Mark ${item.name} done`}</span>
          <input
            type="checkbox"
            checked={done}
            disabled={!canWrite}
            onChange={onToggleDone}
            className="h-5 w-5 accent-red-500"
          />
        </label>

        <div className="min-w-0 flex-1 py-2">
          <button
            type="button"
            onClick={() => setShowNote(v => !v)}
            className={`block w-full text-left text-base leading-snug ${
              done
                ? "text-gray-500 line-through dark:text-gray-300"
                : "text-gray-900 dark:text-white"
            }`}
          >
            {item.name}
          </button>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            <span
              className={`rounded border px-1.5 py-0.5 uppercase ${
                KIND_STYLES[item.kind] || KIND_STYLES.area
              }`}
            >
              {item.kind}
            </span>
            {wiki && (
              <a
                href={wiki}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-red-500 underline-offset-2"
              >
                wiki
              </a>
            )}
            {map && (
              <a
                href={map}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-red-500 underline-offset-2"
              >
                map
              </a>
            )}
          </div>

          {item.hint && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-300">
              {item.hint}
            </p>
          )}

          {showNote && (
            <textarea
              value={note || ""}
              readOnly={!canWrite}
              onChange={e => onNoteChange(e.target.value)}
              placeholder="Notes"
              rows={2}
              className="mt-2 w-full rounded border border-gray-300 bg-transparent p-2 text-sm text-gray-900 dark:border-gray-600 dark:text-white"
            />
          )}
        </div>

        <button
          type="button"
          onClick={onTogglePin}
          disabled={!canWrite}
          aria-label={pinned ? `Unpin ${item.name}` : `Pin ${item.name}`}
          className="h-11 w-11 shrink-0 text-lg text-gray-500 disabled:opacity-40 dark:text-gray-300"
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
  links: PropTypes.shape({
    map: PropTypes.string,
    wiki: PropTypes.string,
  }),
  done: PropTypes.bool,
  note: PropTypes.string,
  pinned: PropTypes.bool,
  canWrite: PropTypes.bool,
  onToggleDone: PropTypes.func.isRequired,
  onTogglePin: PropTypes.func.isRequired,
  onNoteChange: PropTypes.func.isRequired,
}

export default ChecklistItem
