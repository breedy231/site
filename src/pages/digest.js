import React, { useEffect, useState } from "react"
import Layout from "../components/layout"

export const Head = () => (
  <>
    <title>{"Daily Digest | Brendan Reed"}</title>
    <html lang="en" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#032740" />
  </>
)

const getApiUrl = endpoint => {
  const isDevelopment = process.env.NODE_ENV === "development"
  return isDevelopment ? `/api/${endpoint}` : `/.netlify/functions/${endpoint}`
}

const formatDate = iso => {
  const d = new Date(iso)
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

const formatTime = iso => {
  const d = new Date(iso)
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
}

const extractYouTubeId = url => {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/,
  )
  return match ? match[1] : null
}

const SourceBadge = ({ name }) => (
  <span className="inline-block rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300">
    {name}
  </span>
)

const ActionButton = ({ onClick, disabled, children, title }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className="rounded border border-gray-300 px-2.5 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
  >
    {children}
  </button>
)

const ArticleCard = ({ article }) => {
  const [saveState, setSaveState] = useState("idle")
  const [shareState, setShareState] = useState("idle")

  const handleSave = async () => {
    setSaveState("saving")
    try {
      const res = await fetch(getApiUrl("save-article"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: article.title, url: article.url }),
      })
      if (!res.ok) throw new Error("Failed")
      setSaveState("saved")
    } catch {
      setSaveState("error")
      setTimeout(() => setSaveState("idle"), 2000)
    }
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(article.url)
      setShareState("copied")
      setTimeout(() => setShareState("idle"), 2000)
    } catch {
      setShareState("error")
      setTimeout(() => setShareState("idle"), 2000)
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-2 flex flex-wrap gap-1.5">
        {article.sources.map(source => (
          <SourceBadge key={source} name={source} />
        ))}
        {article.isVideo && (
          <span className="inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
            Video
          </span>
        )}
      </div>

      <h3 className="mb-1.5 text-base font-semibold leading-snug text-gray-900 dark:text-white">
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          {article.title}
        </a>
      </h3>

      {article.summary && (
        <p className="mb-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          {article.summary}
        </p>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {formatTime(article.publishedAt)}
        </span>
        <div className="flex gap-2">
          <ActionButton
            onClick={handleSave}
            disabled={saveState === "saving" || saveState === "saved"}
            title="Save to Todoist"
          >
            {saveState === "saving"
              ? "Saving..."
              : saveState === "saved"
                ? "Saved"
                : saveState === "error"
                  ? "Failed"
                  : "Save"}
          </ActionButton>
          <ActionButton
            onClick={handleShare}
            title="Copy link to clipboard"
          >
            {shareState === "copied" ? "Copied!" : "Share"}
          </ActionButton>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded border border-gray-300 px-2.5 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            Read
          </a>
        </div>
      </div>
    </div>
  )
}

const VideoCard = ({ video }) => {
  const [watchState, setWatchState] = useState("idle")
  const [shareState, setShareState] = useState("idle")

  const handleWatchLater = async () => {
    const videoId = extractYouTubeId(video.url)
    if (!videoId) {
      setWatchState("error")
      setTimeout(() => setWatchState("idle"), 2000)
      return
    }
    setWatchState("saving")
    try {
      const res = await fetch(getApiUrl("watch-later"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId }),
      })
      if (!res.ok) throw new Error("Failed")
      setWatchState("saved")
    } catch {
      setWatchState("error")
      setTimeout(() => setWatchState("idle"), 2000)
    }
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(video.url)
      setShareState("copied")
      setTimeout(() => setShareState("idle"), 2000)
    } catch {
      setShareState("error")
      setTimeout(() => setShareState("idle"), 2000)
    }
  }

  const youtubeId = extractYouTubeId(video.url)

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-2 flex items-center gap-2">
        <span className="inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
          Video
        </span>
        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300">
          {video.source}
        </span>
      </div>
      <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
        <a
          href={video.url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          {video.title}
        </a>
      </h3>
      <div className="flex gap-2">
        {youtubeId && (
          <ActionButton
            onClick={handleWatchLater}
            disabled={
              watchState === "saving" ||
              watchState === "saved" ||
              video.addedToWatchLater
            }
            title="Add to YouTube Watch Later"
          >
            {video.addedToWatchLater
              ? "Queued"
              : watchState === "saving"
                ? "Adding..."
                : watchState === "saved"
                  ? "Added"
                  : watchState === "error"
                    ? "Failed"
                    : "Watch Later"}
          </ActionButton>
        )}
        <ActionButton onClick={handleShare} title="Copy link to clipboard">
          {shareState === "copied" ? "Copied!" : "Share"}
        </ActionButton>
        <a
          href={video.url}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded border border-gray-300 px-2.5 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          Watch
        </a>
      </div>
    </div>
  )
}

const DigestPage = () => {
  const [digest, setDigest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch("/digest.json")
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(data => setDigest(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <Layout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-lg text-gray-500 dark:text-gray-400">
            Loading digest...
          </p>
        </div>
      </Layout>
    )
  }

  if (error || !digest) {
    return (
      <Layout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <p className="mb-2 text-lg text-gray-700 dark:text-gray-300">
              {"Couldn\u2019t load today\u2019s digest."}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              {error || "No data available"}
            </p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="mx-auto max-w-4xl px-4 py-8 font-sans">
        {/* Header */}
        <header className="mb-10 border-b border-gray-200 pb-6 dark:border-gray-700">
          <p className="mb-1 text-sm font-medium uppercase tracking-widest text-gray-500 dark:text-gray-400">
            {formatDate(digest.generatedAt)}
          </p>
          <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
            {"Today\u2019s Briefing"}
          </h1>
          <p className="text-base leading-relaxed text-gray-700 dark:text-gray-300 md:text-lg">
            {digest.briefing}
          </p>
        </header>

        {/* Category Sections */}
        {digest.categories &&
          digest.categories.map(category => (
            <section key={category.name} className="mb-10">
              <h2 className="mb-4 border-b border-gray-100 pb-2 text-xl font-bold text-gray-900 dark:border-gray-700 dark:text-white">
                {category.name}
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {category.articles.map(article => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            </section>
          ))}

        {/* Videos Section */}
        {digest.videos && digest.videos.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 border-b border-gray-100 pb-2 text-xl font-bold text-gray-900 dark:border-gray-700 dark:text-white">
              Videos
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {digest.videos.map(video => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="border-t border-gray-200 pt-4 text-center text-xs text-gray-400 dark:border-gray-700 dark:text-gray-600">
          Generated {formatTime(digest.generatedAt)}
        </footer>
      </div>
    </Layout>
  )
}

export default DigestPage
