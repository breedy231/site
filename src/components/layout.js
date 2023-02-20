import React from "react"
import "./layout.sass"
import { container, rightTab, navLinks, navLinkItem, navLinkText, divider } from './layout.module.css'


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
    
    <div className={container}>
      <Link className={navLinkText} to='/'>
        Brendan Reed
      </Link>
      <div className={rightTab}>
        <nav>
          <ul  className={navLinks}>
            <li className={navLinkItem}><Link className={navLinkText} to='/'>
          About
        </Link></li>
        <li className={navLinkItem}>
          <p className={divider}>
          {"//"}
          </p>
        </li>
            <li className={navLinkItem}><Link className={navLinkText} to='/blog'>
          Blog
        </Link></li>
        <li className={navLinkItem}>
          <p className={divider}>
          {"//"}
          </p>
        </li>
        <li className={navLinkItem}><Link className={navLinkText} to='/now_playing'>
          Now Playing
        </Link></li>
          </ul>
        </nav>
      </div>
    </div>
    {children}
    
    </div>
}
