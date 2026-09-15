import PropTypes from "prop-types"

const StatFields = ({ stats, values, canWrite, onChange }) => {
  if (!stats.length) return null

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {stats.map(stat => (
        <label key={stat.key} className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-300">
            {stat.label}
          </span>
          <input
            type="text"
            inputMode="numeric"
            value={values[stat.key] || ""}
            readOnly={!canWrite}
            onChange={e => onChange(stat.key, e.target.value)}
            className="w-14 rounded border border-gray-300 bg-transparent px-2 py-1 text-base text-gray-900 dark:border-gray-600 dark:text-white"
          />
        </label>
      ))}
    </div>
  )
}

StatFields.propTypes = {
  stats: PropTypes.array.isRequired,
  values: PropTypes.object.isRequired,
  canWrite: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
}

export default StatFields
