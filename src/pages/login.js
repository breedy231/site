import React from "react"

const LoginPage = () => {
  const TRAKT_CLIENT_ID = process.env.GATSBY_TRAKT_CLIENT_ID

  console.log("Environment variables check:", {
    hasClientId: !!process.env.GATSBY_TRAKT_CLIENT_ID,
    clientIdLength: process.env.GATSBY_TRAKT_CLIENT_ID?.length,
    hasClientSecret: !!process.env.GATSBY_TRAKT_CLIENT_SECRET,
    clientSecretLength: process.env.GATSBY_TRAKT_CLIENT_SECRET?.length,
  })

  const handleLogin = () => {
    const params = new URLSearchParams({
      response_type: "code",
      client_id: TRAKT_CLIENT_ID,
      redirect_uri: `${window.location.origin}/callback`,
      state: Math.random().toString(36).substring(7),
    })

    window.location.href = `https://trakt.tv/oauth/authorize?${params}`
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
      }}
    >
      <button
        onClick={handleLogin}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          cursor: "pointer",
          backgroundColor: "#ed1c24", // Trakt's red color
          color: "white",
          border: "none",
          borderRadius: "4px",
        }}
      >
        Connect Trakt Account
      </button>
    </div>
  )
}

export default LoginPage
