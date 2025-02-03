import React, { useEffect, useState } from "react"
import PropTypes from "prop-types"
import Layout from "../components/layout"
import {
  BookDisplay,
  WatchDisplay,
  TrackDisplay,
} from "../components/mediaDisplay"

export const Head = () => {
  return (
    <>
      <title>{"Brendan Reed"}</title>
      <html lang="en" />
    </>
  )
}

const getApiUrl = endpoint => {
  //   // Check if we're in the browser
  //   if (typeof window === "undefined") {
  //     return ""
  //   }
  const isDevelopment = process.env.NODE_ENV === "development"
  return isDevelopment ? `/api/${endpoint}` : `/.netlify/functions/${endpoint}`
}

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

  const handleTraktLogin = () => {
    const authUrl = `https://trakt.tv/oauth/authorize?response_type=code&client_id=${process.env.GATSBY_TRAKT_CLIENT_ID}&redirect_uri=http://localhost:8000/callback/trakt`
    window.location.href = authUrl
  }

  useEffect(() => {
    if (typeof window === "undefined") return

    const token = process.env.GATSBY_TRAKT_ACCESS_TOKEN
    if (token) {
      fetch(getApiUrl("history"), {
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
        "No authentication token found. Please connect your Trakt account."
      )
      setWatchLoading(false)
    }

    // Fetch book data
    fetch(getApiUrl("goodreads"))
      .then(res => res.json())
      .then(data => setBookData(data))
      .catch(err => setBookError(err.message))
      .finally(() => setBookLoading(false))

    // Fetch music data
    fetch(getApiUrl("lastfm"))
      .then(res => res.json())
      .then(data => setMusicData(data))
      .catch(err => setMusicError(err.message))
      .finally(() => setMusicLoading(false))
  }, [])

  return (
    <Layout>
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
            {process.env.NODE_ENV === "development" &&
              !process.env.GATSBY_TRAKT_ACCESS_TOKEN && (
                <button
                  onClick={handleTraktLogin}
                  className="mb-4 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                >
                  Connect Trakt (Development)
                </button>
              )}
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
    </Layout>
  )
}

export default NowPage
