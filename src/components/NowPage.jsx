import { useEffect, useState } from "react"
import PropTypes from "prop-types"
import { BookDisplay, WatchDisplay, TrackDisplay } from "./mediaDisplay"

const getApiUrl = endpoint => {
  const isDevelopment = import.meta.env.DEV
  return isDevelopment ? `/api/${endpoint}` : `/.netlify/functions/${endpoint}`
}

const isAdmin = () => {
  if (typeof window === "undefined") return false

  const isDev = import.meta.env.DEV
  const urlParams = new URLSearchParams(window.location.search)
  const hasAdminParam = urlParams.has("admin")
  const isLocalhost = window.location.hostname === "localhost"

  return isDev || hasAdminParam || isLocalhost
}

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
        <div>
          {showAdminControls ? (
            <div className="rounded border border-red-300 bg-red-50 p-3 dark:border-red-600 dark:bg-red-900/20">
              <div className="mb-2 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
              {onReauth && (
                <button
                  onClick={onReauth}
                  className="rounded bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600"
                >
                  Re-authenticate
                </button>
              )}
            </div>
          ) : (
            <div className="text-gray-500 dark:text-gray-300">
              {title} updates temporarily unavailable. Check back soon!
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
    const isDevelopment = import.meta.env.DEV
    const currentHost =
      typeof window !== "undefined" ? window.location.origin : ""

    const redirectUri = isDevelopment
      ? "http://localhost:4321/callback/oauth"
      : `${currentHost}/callback/oauth`

    const authUrl = `https://trakt.tv/oauth/authorize?response_type=code&client_id=${
      import.meta.env.PUBLIC_TRAKT_CLIENT_ID
    }&redirect_uri=${encodeURIComponent(redirectUri)}`
    window.location.href = authUrl
  }

  useEffect(() => {
    if (typeof window === "undefined") return

    fetch(getApiUrl("history"))
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
    <div className="min-h-screen p-6 font-sans text-gray-900 dark:text-white">
      <h1 className="mb-6 text-4xl font-normal">{"What I'm Up To Now"}</h1>

      <div className="grid h-[calc(100vh-8rem)] grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded border border-gray-300 p-4 dark:border-gray-600">
          <MediaSection title="Reading" error={bookError} loading={bookLoading}>
            {bookData && (
              <>
                {bookData.currentlyReading && (
                  <div className="mb-6">
                    <h3 className="mb-3 text-lg font-semibold">
                      Currently Reading
                    </h3>
                    <BookDisplay
                      book={bookData.currentlyReading}
                      type="current"
                    />
                  </div>
                )}
                {bookData.recentlyRead && bookData.recentlyRead.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-lg font-semibold">
                      Recently Read
                    </h3>
                    {bookData.recentlyRead.map((book, index) => (
                      <BookDisplay key={index} book={book} type="read" />
                    ))}
                  </div>
                )}
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
  )
}

export default NowPage
