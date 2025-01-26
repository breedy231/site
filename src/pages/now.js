// src/pages/now.js
import React, { useEffect, useState } from "react"
import PropTypes from "prop-types"

// Media Section Components
const MediaSection = ({ title, error, loading, children }) => (
  <div style={{ marginBottom: "40px" }}>
    <h2
      style={{ marginBottom: "20px", fontSize: "1.5rem", fontWeight: "bold" }}
    >
      {title}
    </h2>
    {loading ? (
      <div>Loading {title.toLowerCase()}...</div>
    ) : error ? (
      <div style={{ color: "red" }}>
        Error loading {title.toLowerCase()}: {error}
      </div>
    ) : (
      children
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
  <div
    style={{
      border: "1px solid #eee",
      padding: "15px",
      borderRadius: "4px",
      marginBottom: "10px",
    }}
  >
    <strong>{book.title}</strong>
    <div>by {book.author}</div>
    {type === "read" && book.dateRead && (
      <div style={{ color: "#666", fontSize: "0.9em", marginTop: "5px" }}>
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
  <div
    style={{
      border: "1px solid #eee",
      padding: "15px",
      borderRadius: "4px",
      marginBottom: "10px",
    }}
  >
    {type === "tv" ? (
      <>
        <strong>{item.show.title}</strong>
        <div>
          S{item.episode.season}E{item.episode.number} - {item.episode.title}
        </div>
      </>
    ) : (
      <strong>
        {item.movie.title} ({item.movie.year})
      </strong>
    )}
    <div style={{ color: "#666", fontSize: "0.9em", marginTop: "5px" }}>
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
  <div
    style={{
      border: "1px solid #eee",
      padding: "15px",
      borderRadius: "4px",
      marginBottom: "10px",
      backgroundColor: track.isNowPlaying ? "#f8f8f8" : "white",
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
      }}
    >
      <div>
        <strong>{track.name}</strong>
        <div>by {track.artist}</div>
        {track.album && <div style={{ color: "#666" }}>{track.album}</div>}
      </div>
      <div style={{ textAlign: "right" }}>
        {type === "recent" &&
          (track.isNowPlaying ? (
            <span
              style={{
                backgroundColor: "#10B981",
                color: "white",
                padding: "4px 8px",
                borderRadius: "9999px",
                fontSize: "0.75rem",
              }}
            >
              Now Playing
            </span>
          ) : (
            <span style={{ color: "#666", fontSize: "0.9em" }}>
              {track.timestamp ? formatTimestamp(track.timestamp) : ""}
            </span>
          ))}
        {type === "top" && (
          <span style={{ color: "#666", fontSize: "0.9em" }}>
            {track.playcount} plays
          </span>
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
        .then(data => {
          console.log("Watch data received:", data)
          setWatchData(data)
        })
        .catch(err => {
          console.error("Watch data error:", err)
          setWatchError(err.message)
        })
        .finally(() => setWatchLoading(false))
    } else {
      setWatchError(
        "No authentication token found. Please connect your Trakt account."
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
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1
        style={{
          fontSize: "2rem",
          fontWeight: "bold",
          marginBottom: "40px",
          textAlign: "center",
        }}
      >
        {"What I'm Up To Now"}
      </h1>

      <MediaSection title="Reading" error={bookError} loading={bookLoading}>
        {bookData && (
          <>
            {bookData.currentlyReading && (
              <div style={{ marginBottom: "20px" }}>
                <h3 style={{ marginBottom: "10px", fontSize: "1.1rem" }}>
                  Currently Reading
                </h3>
                <BookDisplay book={bookData.currentlyReading} type="current" />
              </div>
            )}
            <div>
              <h3 style={{ marginBottom: "10px", fontSize: "1.1rem" }}>
                Recently Read
              </h3>
              {bookData.recentlyRead.map((book, index) => (
                <BookDisplay key={index} book={book} type="read" />
              ))}
            </div>
          </>
        )}
      </MediaSection>

      <MediaSection title="Watching" error={watchError} loading={watchLoading}>
        {watchData && (
          <>
            <div style={{ marginBottom: "20px" }}>
              <h3 style={{ marginBottom: "10px", fontSize: "1.1rem" }}>
                TV Shows
              </h3>
              {watchData?.tv?.map((item, index) => (
                <WatchDisplay key={index} item={item} type="tv" />
              ))}
            </div>
            <div>
              <h3 style={{ marginBottom: "10px", fontSize: "1.1rem" }}>
                Movies
              </h3>
              {watchData?.movies?.map((item, index) => (
                <WatchDisplay key={index} item={item} type="movies" />
              ))}
            </div>
          </>
        )}
      </MediaSection>

      <MediaSection title="Listening" error={musicError} loading={musicLoading}>
        {musicData && (
          <>
            <div style={{ marginBottom: "20px" }}>
              <h3 style={{ marginBottom: "10px", fontSize: "1.1rem" }}>
                Recent Tracks
              </h3>
              {musicData.recentTracks.map((track, index) => (
                <TrackDisplay key={index} track={track} type="recent" />
              ))}
            </div>
            <div>
              <h3 style={{ marginBottom: "10px", fontSize: "1.1rem" }}>
                Top Tracks This Week
              </h3>
              {musicData.topTracks.map((track, index) => (
                <TrackDisplay key={index} track={track} type="top" />
              ))}
            </div>
          </>
        )}
      </MediaSection>

      <div
        style={{
          textAlign: "center",
          marginTop: "40px",
          color: "#666",
          fontSize: "0.9rem",
        }}
      >
        Last updated: {new Date().toLocaleString()}
      </div>
    </div>
  )
}

export default NowPage
