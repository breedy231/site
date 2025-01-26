import React, { useEffect, useState } from "react"
import PropTypes from "prop-types"

// Media Section Components
const MediaSection = ({ title, error, loading, children }) => (
  <div className="h-full">
    <h2 className="mb-4 text-xl">{title}</h2>
    {loading ? (
      <div className="text-gray-300">Loading {title.toLowerCase()}...</div>
    ) : error ? (
      <div className="text-red-500">
        Error loading {title.toLowerCase()}: {error}
      </div>
    ) : (
      <div className="h-[calc(100%-2rem)] overflow-auto">{children}</div>
    )}
  </div>
)

MediaSection.propTypes = {
  title: PropTypes.string.isRequired,
  error: PropTypes.string,
  loading: PropTypes.bool,
  children: PropTypes.node,
}

// Book Components
const BookDisplay = ({ book, type }) => (
  <div className="mb-3 rounded border border-gray-600 p-3">
    <div className="font-medium text-gray-300">{book.title}</div>
    <div className="text-sm text-gray-400">by {book.author}</div>
    {type === "read" && book.dateRead && (
      <div className="mt-1 text-xs text-gray-500">
        Finished: {new Date(book.dateRead).toLocaleDateString()}
      </div>
    )}
  </div>
)

BookDisplay.propTypes = {
  book: PropTypes.shape({
    title: PropTypes.string.isRequired,
    author: PropTypes.string.isRequired,
    dateRead: PropTypes.string,
  }).isRequired,
  type: PropTypes.oneOf(["current", "read"]).isRequired,
}

// Watch History Components
const WatchDisplay = ({ item, type }) => (
  <div className="mb-3 rounded border border-gray-600 p-3">
    {type === "tv" ? (
      <>
        <div className="font-medium text-gray-300">{item.show.title}</div>
        <div className="text-sm text-gray-400">
          S{item.episode.season}E{item.episode.number} - {item.episode.title}
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
)

WatchDisplay.propTypes = {
  item: PropTypes.shape({
    show: PropTypes.shape({
      title: PropTypes.string,
    }),
    episode: PropTypes.shape({
      season: PropTypes.number,
      number: PropTypes.number,
      title: PropTypes.string,
    }),
    movie: PropTypes.shape({
      title: PropTypes.string,
      year: PropTypes.number,
    }),
    watched_at: PropTypes.string.isRequired,
  }).isRequired,
  type: PropTypes.oneOf(["tv", "movies"]).isRequired,
}

// Music Components
const TrackDisplay = ({ track, type }) => (
  <div className="mb-3 rounded border border-gray-600 p-3">
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
          <span className="text-sm text-gray-500">{track.playcount} plays</span>
        )}
      </div>
    </div>
  </div>
)

TrackDisplay.propTypes = {
  track: PropTypes.shape({
    name: PropTypes.string.isRequired,
    artist: PropTypes.string.isRequired,
    album: PropTypes.string,
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

// Main Page Component
const NowPage = () => {
  const [watchData, setWatchData] = useState(null)
  const [watchError, setWatchError] = useState(null)
  const [watchLoading, setWatchLoading] = useState(true)

  const [bookData, setBookData] = useState(null)
  const [bookError, setBookError] = useState(null)
  const [bookLoading, setBookLoading] = useState(true)

  const [musicData, setMusicData] = useState(null)
  const [musicError, setMusicError] = useState(null)
  const [musicLoading, setMusicLoading] = useState(true)

  useEffect(() => {
    // Fetch watch history
    const token = localStorage.getItem("trakt_token")
    if (token) {
      fetch("/api/history", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then(res => res.json())
        .then(data => setWatchData(data))
        .catch(err => setWatchError(err.message))
        .finally(() => setWatchLoading(false))
    } else {
      setWatchError(
        "No authentication token found. Please connect your Trakt account.",
      )
      setWatchLoading(false)
    }

    // Fetch book data
    fetch("/api/goodreads")
      .then(res => res.json())
      .then(data => setBookData(data))
      .catch(err => setBookError(err.message))
      .finally(() => setBookLoading(false))

    // Fetch music data
    fetch("/api/lastfm")
      .then(res => res.json())
      .then(data => setMusicData(data))
      .catch(err => setMusicError(err.message))
      .finally(() => setMusicLoading(false))
  }, [])

  return (
    <div>
      <div className="min-h-screen p-6 font-sans text-white">
        <h1 className="mb-6 text-4xl font-normal">{"What I'm Up To Now"}</h1>

        <div className="grid h-[calc(100vh-8rem)] grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded border border-gray-600 p-4">
            <MediaSection
              title="Reading"
              error={bookError}
              loading={bookLoading}
            >
              {bookData && (
                <>
                  {bookData.currentlyReading && (
                    <div className="mb-4">
                      <h3 className="mb-2 text-lg">Currently Reading</h3>
                      <BookDisplay
                        book={bookData.currentlyReading}
                        type="current"
                      />
                    </div>
                  )}
                  <div>
                    <h3 className="mb-2 text-lg">Recently Read</h3>
                    {bookData.recentlyRead.map((book, index) => (
                      <BookDisplay key={index} book={book} type="read" />
                    ))}
                  </div>
                </>
              )}
            </MediaSection>
          </div>

          <div className="rounded border border-gray-600 p-4">
            <MediaSection
              title="Watching"
              error={watchError}
              loading={watchLoading}
            >
              {watchData && (
                <>
                  <div className="mb-4">
                    <h3 className="mb-2 text-lg">TV Shows</h3>
                    {watchData?.tv?.map((item, index) => (
                      <WatchDisplay key={index} item={item} type="tv" />
                    ))}
                  </div>
                  <div>
                    <h3 className="mb-2 text-lg">Movies</h3>
                    {watchData?.movies?.map((item, index) => (
                      <WatchDisplay key={index} item={item} type="movies" />
                    ))}
                  </div>
                </>
              )}
            </MediaSection>
          </div>

          <div className="rounded border border-gray-600 p-4">
            <MediaSection
              title="Listening"
              error={musicError}
              loading={musicLoading}
            >
              {musicData && (
                <>
                  <div className="mb-4">
                    <h3 className="mb-2 text-lg">Recent Tracks</h3>
                    {musicData.recentTracks.map((track, index) => (
                      <TrackDisplay key={index} track={track} type="recent" />
                    ))}
                  </div>
                  <div>
                    <h3 className="mb-2 text-lg">Top Tracks This Week</h3>
                    {musicData.topTracks.map((track, index) => (
                      <TrackDisplay key={index} track={track} type="top" />
                    ))}
                  </div>
                </>
              )}
            </MediaSection>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NowPage
