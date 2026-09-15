import PropTypes from "prop-types"

const NextUp = ({ item }) => (
  <div className="rounded border border-gray-300 p-4 dark:border-gray-600">
    <h2 className="text-xs tracking-wide text-gray-500 uppercase dark:text-gray-300">
      Next up
    </h2>
    {item ? (
      <>
        <p className="mt-1 text-lg leading-tight">{item.name}</p>
        {item.hint && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
            {item.hint}
          </p>
        )}
      </>
    ) : (
      <p className="mt-1 text-lg">Everything ticked.</p>
    )}
  </div>
)

NextUp.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    hint: PropTypes.string,
  }),
}

export default NextUp
