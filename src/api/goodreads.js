// src/api/goodreads.js
import { XMLParser } from "fast-xml-parser"

const handler = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  const GOODREADS_USER_ID = "21084560"
  const parser = new XMLParser()

  try {
    // Fetch both currently-reading and read shelves
    const [currentlyReadingRes, readRes] = await Promise.all([
      fetch(
        `https://www.goodreads.com/review/list_rss/${GOODREADS_USER_ID}?shelf=currently-reading`,
      ),
      fetch(
        `https://www.goodreads.com/review/list_rss/${GOODREADS_USER_ID}?shelf=read&sort=date_read&order=d`,
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

    return res.status(200).json(response)
  } catch (error) {
    console.error("Error fetching Goodreads data:", error)
    return res.status(500).json({ message: "Failed to fetch Goodreads data" })
  }
}

export default handler
