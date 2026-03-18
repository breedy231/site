// netlify/functions/save-article.js
// Saves an article to Todoist Reading List project via REST API

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ message: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    })
  }

  const token = process.env.TODOIST_API_TOKEN
  if (!token) {
    return new Response(
      JSON.stringify({ message: "Todoist API token not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }

  try {
    const { title, url } = await req.json()

    if (!title || !url) {
      return new Response(
        JSON.stringify({ message: "title and url are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      )
    }

    const res = await fetch("https://api.todoist.com/rest/v2/tasks", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: `[${title}](${url})`,
        project_id: "6c6PWM9m4MX8MrJf",
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error("Todoist API error:", res.status, errText)
      return new Response(
        JSON.stringify({ message: "Failed to save to Todoist" }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      )
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Error saving article:", error)
    return new Response(
      JSON.stringify({ message: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
}
