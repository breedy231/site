import PropTypes from "prop-types"
import { useState } from "react"

const AddItemForm = ({ canWrite, onAdd }) => {
  const [draft, setDraft] = useState("")
  const submit = e => {
    e.preventDefault()
    const name = draft.trim()
    if (!name) return
    onAdd(name)
    setDraft("")
  }
  return (
    <form onSubmit={submit} className="mt-3 flex gap-2">
      <input
        type="text"
        value={draft}
        disabled={!canWrite}
        onChange={e => setDraft(e.target.value)}
        placeholder="Add an item"
        className="min-w-0 flex-1 rounded border border-(--hud-line) bg-transparent px-3 py-2 text-base text-(--hud-text) disabled:opacity-40"
      />
      <button
        type="submit"
        disabled={!canWrite}
        className="shrink-0 rounded border border-(--hud-line) px-4 py-2 text-sm disabled:opacity-40"
      >
        Add
      </button>
    </form>
  )
}

AddItemForm.propTypes = {
  canWrite: PropTypes.bool,
  onAdd: PropTypes.func.isRequired,
}

export default AddItemForm
