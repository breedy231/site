import React from "react"
import "./layout.sass"
import { useStaticQuery, graphql, Link } from "gatsby"

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

// TODO add link styling
export default function Layout({ children }) {
  return <div style={{ margin: `0 auto`, padding: `0 1rem` }}>
    
    <div>
      <Link to='/'>
        About
      </Link>
      <Link to='/now_playing'>
        Now Playing
      </Link>

    </div>
    {children}
    
    </div>
}
