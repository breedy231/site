// src/pages/test-trakt.js
import React, { useEffect, useState } from "react"
import { getStoredToken } from "../utils/trakt-auth"
import PropTypes from "prop-types"

const HistorySection = ({ title, items, type }) => (
  <div style={{ marginBottom: "30px" }}>
    <h2 style={{ marginBottom: "15px" }}>{title}</h2>
    <ul style={{ listStyle: "none", padding: 0 }}>
      {items.map(item => (
        <li
          key={item.id}
          style={{
            marginBottom: "10px",
            padding: "15px",
            border: "1px solid #eee",
            borderRadius: "4px",
          }}
        >
          {type === "tv" ? (
            <>
              <strong>{item.show.title}</strong>
              <div>
                S{item.episode.season}E{item.episode.number} -{" "}
                {item.episode.title}
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
        </li>
      ))}
    </ul>
  </div>
)

HistorySection.propTypes = {
  title: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      watched_at: PropTypes.string.isRequired,
      type: PropTypes.string,
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
    })
  ).isRequired,
  type: PropTypes.oneOf(["tv", "movies"]).isRequired,
}

const TestTraktPage = () => {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = await getStoredToken()

        if (!token) {
          setError("No valid access token found")
          setLoading(false)
          return
        }

        const response = await fetch("/api/history", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()
        console.log("Trakt history:", result)
        setData(result)
      } catch (err) {
        console.error("Error fetching data:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (!data) return <div>No history found</div>

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "30px" }}>Recent Watch History</h1>
      <HistorySection title="TV Shows" items={data.tv} type="tv" />
      <HistorySection title="Movies" items={data.movies} type="movies" />
    </div>
  )
}

export default TestTraktPage
