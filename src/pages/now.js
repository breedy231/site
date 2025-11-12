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
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="theme-color" content="#032740" />
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

// Check if user is admin (you)
const isAdmin = () => {
  if (typeof window === "undefined") return false

  // Multiple ways to detect admin access:
  // 1. Development environment
  const isDev = process.env.NODE_ENV === "development"

  // 2. Admin query parameter (for production testing)
  const urlParams = new URLSearchParams(window.location.search)
  const hasAdminParam = urlParams.has("admin")

  // 3. Localhost access (for development)
  const isLocalhost = window.location.hostname === "localhost"

  return isDev || hasAdminParam || isLocalhost
}

// Media Section Components
const MediaSection = ({ title, error, loading, children, onReauth }) => {
  const showAdminControls = isAdmin()

  return (
    <div className="h-full">
      <h2 className="mb-4 text-xl">{title}</h2>
      {loading ? (
        <div className="text-gray-500 dark:text-gray-300">
          Loading {title.toLowerCase()}...
        </div>
      ) : error ? (
        <div className="text-red-500">
          {showAdminControls ? (
            // Admin view: Show detailed error and re-auth button
            <>
              <div className="mb-2">
                Error loading {title.toLowerCase()}: {error}
              </div>
              {error.includes("expired") || error.includes("authentication") ? (
                <button
                  onClick={onReauth}
                  className="rounded bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600"
                >
                  Re-authenticate with Trakt
                </button>
              ) : null}
            </>
          ) : (
            // Public view: Show helpful message or placeholder content
            <div className="text-gray-500 dark:text-gray-300">
              {title === "Watching" ? (
                <div>
                  <div className="mb-2">
                    Currently watching updates temporarily unavailable
                  </div>
                  <div className="text-sm">
                    Check back soon for the latest TV shows and movies!
                  </div>
                </div>
              ) : (
                <div>{title} data temporarily unavailable</div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="h-[calc(100%-2rem)] overflow-auto">{children}</div>
      )}
    </div>
  )
}

MediaSection.propTypes = {
  title: PropTypes.string.isRequired,
  error: PropTypes.string,
  loading: PropTypes.bool,
  children: PropTypes.node,
  onReauth: PropTypes.func,
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
    const isDevelopment = process.env.NODE_ENV === "development"
    const currentHost =
      typeof window !== "undefined" ? window.location.origin : ""
    const isDeployPreview = currentHost.includes("deploy-preview")

    // Always use current host for OAuth - this keeps the flow on the same deployment
    const redirectUri = isDevelopment
      ? "http://localhost:8000/callback/oauth"
      : `${currentHost}/callback/oauth`

    if (isDeployPreview) {
      alert(
        "OAuth testing on deploy previews requires adding this URL to your Trakt app's redirect URI whitelist temporarily:\n\n" +
          redirectUri +
          "\n\n" +
          "Or test on the main site: https://brendantreed.com/?admin",
      )
    }

    const authUrl = `https://trakt.tv/oauth/authorize?response_type=code&client_id=${
      process.env.GATSBY_TRAKT_CLIENT_ID
    }&redirect_uri=${encodeURIComponent(redirectUri)}`
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
        .then(res => {
          if (!res.ok) {
            return res.json().then(errorData => {
              throw new Error(errorData.message || `HTTP ${res.status}`)
            })
          }
          return res.json()
        })
        .then(data => setWatchData(data))
        .catch(err => {
          console.error("Trakt API error:", err)
          setWatchError(err.message)
        })
        .finally(() => setWatchLoading(false))
    } else {
      setWatchError(
        "No authentication token found. Please connect your Trakt account.",
      )
      setWatchLoading(false)
    }

    // Fetch book data
    fetch(getApiUrl("goodreads"))
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
        return res.json()
      })
      .then(data => setBookData(data))
      .catch(err => setBookError(err.message))
      .finally(() => setBookLoading(false))

    // Fetch music data
    fetch(getApiUrl("lastfm"))
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
        return res.json()
      })
      .then(data => setMusicData(data))
      .catch(err => setMusicError(err.message))
      .finally(() => setMusicLoading(false))
  }, [])

  return (
    <Layout>
      <div className="min-h-screen p-6 font-sans text-gray-900 dark:text-white">
        <h1 className="mb-6 text-4xl font-normal">{"What I'm Up To Now"}</h1>

        {/* Admin Panel - Only visible to admin */}
        {isAdmin() &&
          (watchError?.includes("expired") ||
            watchError?.includes("authentication")) && (
            <div className="mb-6 rounded border border-yellow-300 bg-yellow-50 p-4 dark:border-yellow-600 dark:bg-yellow-900/20">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200">
                    Admin Notice: Trakt Authentication Required
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    The Trakt access tokens have expired. External visitors see
                    a graceful fallback message.
                  </p>
                </div>
                <button
                  onClick={handleTraktLogin}
                  className="rounded bg-yellow-600 px-4 py-2 text-white hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600"
                >
                  Re-authenticate Trakt
                </button>
              </div>
            </div>
          )}

        <div className="grid h-[calc(100vh-8rem)] grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded border border-gray-300 p-4 dark:border-gray-600">
            <MediaSection
              title="Reading"
              error={bookError}
              loading={bookLoading}
            >
              {bookData && bookData.recentlyRead && (
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

          <div className="rounded border border-gray-300 p-4 dark:border-gray-600">
            <MediaSection
              title="Watching"
              error={watchError}
              loading={watchLoading}
              onReauth={handleTraktLogin}
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

          <div className="rounded border border-gray-300 p-4 dark:border-gray-600">
            <MediaSection
              title="Listening"
              error={musicError}
              loading={musicLoading}
            >
              {musicData && musicData.recentTracks && musicData.topTracks && (
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
