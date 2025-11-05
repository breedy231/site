// src/api/goodreads.js
import { XMLParser } from "fast-xml-parser"

const handler = async function handler(req) {
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ message: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    })
  }

  const GOODREADS_USER_ID = "21084560"
  const parser = new XMLParser()

  try {
    // Fetch both currently-reading and read shelves
    const [currentlyReadingRes, readRes] = await Promise.all([
      fetch(
        `https://www.goodreads.com/review/list_rss/${GOODREADS_USER_ID}?shelf=currently-reading`
      ),
      fetch(
        `https://www.goodreads.com/review/list_rss/${GOODREADS_USER_ID}?shelf=read&sort=date_read&order=d`
      ),
    ])

    const [currentlyReadingXml, readXml] = await Promise.all([
      currentlyReadingRes.text(),
      readRes.text(),
    ])

    // Parse XML to JSON
    const currentlyReading = parser.parse(currentlyReadingXml)
    const recentlyRead = parser.parse(readXml)

    // Extract and format the book data
    const current = currentlyReading.rss.channel.item
      ? Array.isArray(currentlyReading.rss.channel.item)
        ? currentlyReading.rss.channel.item[0] // Get the first book if multiple
        : currentlyReading.rss.channel.item // Use the single book
      : null

    const recent = recentlyRead.rss.channel.item
      ? Array.isArray(recentlyRead.rss.channel.item)
        ? recentlyRead.rss.channel.item.slice(0, 3) // Get first 3 books
        : [recentlyRead.rss.channel.item] // Use the single book
      : []

    // Format the response
    const response = {
      currentlyReading: current
        ? {
            title: current.title,
            author: current.author_name,
            link: current.link,
            imageUrl: current.book_image_url,
            publishedYear: current.book_published,
          }
        : null,
      recentlyRead: recent.map(book => ({
        title: book.title,
        author: book.author_name,
        link: book.link,
        imageUrl: book.book_image_url,
        publishedYear: book.book_published,
        dateRead: book.user_read_at,
      })),
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Error fetching Goodreads data:", error)
    return new Response(
      JSON.stringify({ message: "Failed to fetch Goodreads data" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
}

export default handler
