import React from "react"
import PropTypes from "prop-types"

const MediaImage = ({ src, alt, className = "" }) => {
  if (!src) return null

  return (
    <div className={`relative overflow-hidden rounded-md ${className}`}>
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover"
        onError={e => {
          e.target.style.display = "none"
        }}
      />
    </div>
  )
}

MediaImage.propTypes = {
  src: PropTypes.string,
  alt: PropTypes.string.isRequired,
  className: PropTypes.string,
}

const BookDisplay = ({ book, type }) => (
  <div className="mb-3 rounded border border-gray-600 p-3">
    <div className="flex gap-4">
      {book.imageUrl && (
        <MediaImage
          src={book.imageUrl}
          alt={`Cover of ${book.title}`}
          className="h-24 w-16 flex-shrink-0"
        />
      )}
      <div className="flex-grow">
        <div className="font-medium text-gray-300">{book.title}</div>
        <div className="text-sm text-gray-400">by {book.author}</div>
        {type === "read" && book.dateRead && (
          <div className="mt-1 text-xs text-gray-500">
            Finished: {new Date(book.dateRead).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  </div>
)

BookDisplay.propTypes = {
  book: PropTypes.shape({
    title: PropTypes.string.isRequired,
    author: PropTypes.string.isRequired,
    dateRead: PropTypes.string,
    imageUrl: PropTypes.string,
    link: PropTypes.string,
    publishedYear: PropTypes.string,
  }).isRequired,
  type: PropTypes.oneOf(["current", "read"]).isRequired,
}

const WatchDisplay = ({ item, type }) => (
  <div className="mb-3 rounded border border-gray-600 p-3">
    <div className="flex gap-4">
      {item.image && (
        <MediaImage
          src={item.image}
          alt={
            type === "tv"
              ? `Still from ${item.show.title}`
              : `Poster for ${item.movie.title}`
          }
          className="h-24 w-16 flex-shrink-0"
        />
      )}
      <div className="flex-grow">
        {type === "tv" ? (
          <>
            <div className="font-medium text-gray-300">{item.show.title}</div>
            <div className="text-sm text-gray-400">
              S{item.episode.season}E{item.episode.number} -{" "}
              {item.episode.title}
            </div>
          </>
        ) : (
          <div className="font-medium text-gray-300">
            {item.movie.title} ({item.movie.year})
          </div>
        )}
        <div className="mt-1 text-xs text-gray-500">
          Watched: {new Date(item.watched_at).toLocaleDateString()}
        </div>
      </div>
    </div>
  </div>
)

WatchDisplay.propTypes = {
  item: PropTypes.shape({
    show: PropTypes.shape({
      title: PropTypes.string,
      ids: PropTypes.shape({
        tmdb: PropTypes.number,
      }),
    }),
    episode: PropTypes.shape({
      season: PropTypes.number,
      number: PropTypes.number,
      title: PropTypes.string,
    }),
    movie: PropTypes.shape({
      title: PropTypes.string,
      year: PropTypes.number,
      ids: PropTypes.shape({
        tmdb: PropTypes.number,
      }),
    }),
    watched_at: PropTypes.string.isRequired,
    image: PropTypes.string,
  }).isRequired,
  type: PropTypes.oneOf(["tv", "movies"]).isRequired,
}

const TrackDisplay = ({ track, type }) => (
  <div className="mb-3 rounded border border-gray-600 p-3">
    <div className="flex gap-4">
      {track.image && (
        <MediaImage
          src={track.image}
          alt={`Album art for ${track.name}`}
          className="h-16 w-16 flex-shrink-0"
        />
      )}
      <div className="flex-grow">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-medium text-gray-300">{track.name}</div>
            <div className="text-sm text-gray-400">by {track.artist}</div>
            {track.album && (
              <div className="text-sm text-gray-500">{track.album}</div>
            )}
          </div>
          <div className="text-right">
            {type === "recent" &&
              (track.isNowPlaying ? (
                <span className="rounded-full bg-emerald-600 px-2 py-1 text-xs text-white">
                  Now Playing
                </span>
              ) : (
                <span className="text-sm text-gray-500">
                  {track.timestamp ? formatTimestamp(track.timestamp) : ""}
                </span>
              ))}
            {type === "top" && (
              <span className="text-sm text-gray-500">
                {track.playcount} plays
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
)

TrackDisplay.propTypes = {
  track: PropTypes.shape({
    name: PropTypes.string.isRequired,
    artist: PropTypes.string.isRequired,
    album: PropTypes.string,
    image: PropTypes.string,
    url: PropTypes.string,
    isNowPlaying: PropTypes.bool,
    timestamp: PropTypes.number,
    playcount: PropTypes.number,
  }).isRequired,
  type: PropTypes.oneOf(["recent", "top"]).isRequired,
}

const formatTimestamp = timestamp => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date

  if (diff < 60000) return "Just now"
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return date.toLocaleDateString()
}

export { BookDisplay, WatchDisplay, TrackDisplay }
