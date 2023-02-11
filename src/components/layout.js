import React from "react"
import "./layout.sass"
import { useStaticQuery, graphql } from "gatsby"

const Seo = ({ children }) => <>{children}</>

export const Head = () => (
  <Seo>
    <title>Hello World</title>
    <html lang="en" />
  </Seo>
)

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
    <div style={{ margin: `0 auto`, padding: `0 1rem` }}>
      <title>{data.site.siteMetadata.title}</title>
      {children}
    </div>
  )
}
