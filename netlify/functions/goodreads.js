const fetch = require("node-fetch")
const { XMLParser } = require("fast-xml-parser")

exports.handler = async event => {
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ message: "Method not allowed" }),
    }
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

    if (!currentlyReadingRes.ok || !readRes.ok) {
      throw new Error("Failed to fetch from Goodreads RSS")
    }

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

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(response),
    }
  } catch (error) {
    console.error("Error fetching Goodreads data:", error)
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "Failed to fetch Goodreads data",
        error: error.message,
      }),
    }
  }
}
