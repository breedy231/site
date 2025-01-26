// src/pages/test-lastfm.js
import React, { useEffect, useState } from "react"
import PropTypes from "prop-types"

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

  // Less than 1 minute
  if (diff < 60000) {
    return "Just now"
  }
  // Less than 1 hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000)
    return `${minutes}m ago`
  }
  // Less than 24 hours
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000)
    return `${hours}h ago`
  }
  // More than 24 hours
  return date.toLocaleDateString()
}

const TestLastFmPage = () => {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMusic = async () => {
      try {
        const response = await fetch("/api/lastfm")
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const result = await response.json()
        console.log("Last.fm data:", result)
        setData(result)
      } catch (err) {
        console.error("Error fetching data:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchMusic()
  }, [])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (!data) return <div>No music data found</div>

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "30px" }}>Music History</h1>

      <div style={{ marginBottom: "30px" }}>
        <h2 style={{ marginBottom: "15px" }}>Recent Tracks</h2>
        {data.recentTracks.map((track, index) => (
          <TrackDisplay key={index} track={track} type="recent" />
        ))}
      </div>

      <div>
        <h2 style={{ marginBottom: "15px" }}>Top Tracks This Week</h2>
        {data.topTracks.map((track, index) => (
          <TrackDisplay key={index} track={track} type="top" />
        ))}
      </div>
    </div>
  )
}

export default TestLastFmPage
