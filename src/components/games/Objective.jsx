import PropTypes from "prop-types"

// "Next up", framed as the current objective, with the game's field notes
// (tips for wherever I'm stuck) folded underneath.
const Objective = ({ item, pinned, region, notesHtml }) => (
  <section className="hud-panel p-4">
    <h2 className="hud-label">
      Objective{pinned ? " · pinned" : ""}
      {region ? ` · ${region}` : ""}
    </h2>
    {item ? (
      <>
        <p className="hud-title hud-glow mt-1 text-xl leading-tight">
          {item.name}
        </p>
        {item.hint && (
          <p className="mt-2 text-sm text-(--hud-muted)">{item.hint}</p>
        )}
      </>
    ) : (
      <p className="hud-title hud-glow mt-1 text-xl">All clear.</p>
    )}

    {notesHtml && (
      <details open className="mt-3 border-t border-(--hud-line) pt-3">
        <summary className="hud-label cursor-pointer">Field notes</summary>
        <div
          className="prose prose-sm mt-2 max-w-none text-(--hud-text) [--tw-prose-body:var(--hud-text)] [--tw-prose-bold:var(--hud-accent)] [--tw-prose-bullets:var(--hud-accent-2)] [--tw-prose-links:var(--hud-accent)]"
          dangerouslySetInnerHTML={{ __html: notesHtml }}
        />
      </details>
    )}
  </section>
)

Objective.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    hint: PropTypes.string,
  }),
  pinned: PropTypes.bool,
  region: PropTypes.string,
  notesHtml: PropTypes.string,
}

export default Objective
