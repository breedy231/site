import React from "react"
import "./layout.sass"
import { useStaticQuery, graphql } from "gatsby"

const Seo = ({ children }) => <>{children}</>

export const Head = () => {
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
    <Seo>
      <title>{data.site.siteMetadata.title}</title>
      <html lang="en" />
    </Seo>
  )
} 

export default function Layout({ children }) {
  return (
    <div style={{ margin: `0 auto`, padding: `0 1rem` }}>
      {children}
    </div>
  )
}
