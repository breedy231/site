// src/pages/test-goodreads.js
import React, { useEffect, useState } from "react"
import PropTypes from "prop-types"

const BookDisplay = ({ book, type }) => (
  <div
    style={{
      border: "1px solid #eee",
      padding: "15px",
      borderRadius: "4px",
      marginBottom: "10px",
    }}
  >
    <strong>{book.title}</strong>
    <div>by {book.author}</div>
    {type === "read" && book.dateRead && (
      <div style={{ color: "#666", fontSize: "0.9em", marginTop: "5px" }}>
        Finished: {new Date(book.dateRead).toLocaleDateString()}
      </div>
    )}
  </div>
)

BookDisplay.propTypes = {
  book: PropTypes.shape({
    title: PropTypes.string.isRequired,
    author: PropTypes.string.isRequired,
    link: PropTypes.string,
    imageUrl: PropTypes.string,
    publishedYear: PropTypes.string,
    dateRead: PropTypes.string,
  }).isRequired,
  type: PropTypes.oneOf(["current", "read"]).isRequired,
}

const TestGoodreadsPage = () => {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await fetch("/api/goodreads")
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const result = await response.json()
        console.log("Goodreads data:", result)
        setData(result)
      } catch (err) {
        console.error("Error fetching data:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchBooks()
  }, [])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (!data) return <div>No books found</div>

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "30px" }}>Reading History</h1>

      <div style={{ marginBottom: "30px" }}>
        <h2 style={{ marginBottom: "15px" }}>Currently Reading</h2>
        {data.currentlyReading ? (
          <BookDisplay book={data.currentlyReading} type="current" />
        ) : (
          <div>No book currently being read</div>
        )}
      </div>

      <div>
        <h2 style={{ marginBottom: "15px" }}>Recently Read</h2>
        {data.recentlyRead.length > 0 ? (
          data.recentlyRead.map((book, index) => (
            <BookDisplay key={index} book={book} type="read" />
          ))
        ) : (
          <div>No recently read books found</div>
        )}
      </div>
    </div>
  )
}

export default TestGoodreadsPage
