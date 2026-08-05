const ResultsScreen = ({ results, onPlayAgain, onNewCategory }) => {
  const correct = results.filter(r => r.correct)
  const passed = results.filter(r => !r.correct)

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mx-auto max-w-md space-y-6 text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Game Over!
        </h2>
        <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-700">
          <div className="space-y-2 text-xl dark:text-gray-200">
            <p className="text-green-600">Correct: {correct.length}</p>
            <p className="text-red-600">Passed: {passed.length}</p>
            <p className="mt-4 text-2xl font-bold">
              Total Score: {correct.length - passed.length}
            </p>
          </div>
        </div>

        {results.length > 0 && (
          <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-700">
            <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
              Word Summary
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="mb-2 font-bold text-green-600">Correct</h4>
                <ul className="text-left">
                  {correct.map((result, index) => (
                    <li key={`correct-${index}`} className="text-green-600">
                      {result.word}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="mb-2 font-bold text-red-600">Passed</h4>
                <ul className="text-left">
                  {passed.map((result, index) => (
                    <li key={`passed-${index}`} className="text-red-600">
                      {result.word}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4 pb-8">
          <button
            onClick={onPlayAgain}
            className="w-full rounded-lg bg-blue-500 p-4 text-xl text-white shadow transition-colors hover:bg-blue-600"
          >
            Play Same Deck
          </button>
          <button
            onClick={onNewCategory}
            className="w-full rounded-lg bg-green-500 p-4 text-xl text-white shadow transition-colors hover:bg-green-600"
          >
            Choose New Deck
          </button>
        </div>
      </div>
    </div>
  )
}

export default ResultsScreen
