import React from "react"
import "./layout.sass"
import { useStaticQuery, graphql } from 'gatsby'

export default function Layout({ children }) {

  const data = useStaticQuery(graphql`
    {
      site {
        id
        siteMetadata {
          title
        }
      }
    }
  `)

  return (

    <html lang="en">
      <body>
      <div style={{ margin: `0 auto`, padding: `0 1rem` }}>
        <title>{data.site.siteMetadata.title}</title>
          {children}
      </div>
      </body>
    </html>
    
  )
}