const CategoryPicker = ({ decks, onSelect }) => (
  <div className="flex h-full flex-col overflow-y-auto p-4">
    <div className="mx-auto w-full max-w-md space-y-4 text-center">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
        Heads Up!
      </h1>
      <h2 className="text-xl text-gray-600 dark:text-gray-300">
        Choose a deck
      </h2>
      <div className="grid gap-4">
        {decks.map(deck => (
          <button
            key={deck.id}
            onClick={() => onSelect(deck)}
            className="flex w-full transform items-center justify-between rounded-lg bg-blue-500 p-4 text-xl text-white shadow transition-colors hover:scale-105 hover:bg-blue-600"
          >
            <span>
              {deck.emoji} {deck.title}
            </span>
            <span className="text-sm opacity-75">
              {deck.words.length} words
            </span>
          </button>
        ))}
      </div>
      <a
        href="/"
        className="inline-block pt-4 text-sm text-gray-500 no-underline hover:underline dark:text-gray-400"
      >
        ← back to brendanreed.me
      </a>
    </div>
  </div>
)

export default CategoryPicker
