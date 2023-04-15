import React, { Fragment } from "react"
import Media from "react-media"
import "./layout.sass"
import {
  container,
  smallContainer,
  rightTab,
  smallRightTab,
  navLinks,
  navLinkItem,
  navLinkText,
  smallNavLinkText,
  divider,
  smallNavLinkItem,
  smallNavLinkHeader,
} from "./layout.module.css"
import PropTypes from "prop-types"

import { useStaticQuery, graphql, Link } from "gatsby"

const Seo = ({ children }) => <>{children}</>
Seo.propTypes = {
  children: PropTypes.any,
}

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
    <Media
      queries={{
        small: "(max-width: 599px)",
        medium: "(min-width: 600px) and (max-width: 1199px)",
        large: "(min-width: 1200px)",
      }}
    >
      {matches => (
        <Fragment>
          {matches.small && !(matches.large || matches.medium) && (
            <div style={{ margin: `0 auto`, padding: `0 1rem` }}>
              <div className={smallContainer}>
                <Link className={smallNavLinkHeader} to="/">
                  Brendan Reed
                </Link>
                <div className={smallRightTab}>
                  <nav>
                    <ul className={navLinks}>
                      <li className={smallNavLinkItem}>
                        <Link className={smallNavLinkText} to="/">
                          About
                        </Link>
                      </li>
                      <li className={smallNavLinkItem}>
                        <p className={divider}>{"//"}</p>
                      </li>
                      <li className={smallNavLinkItem}>
                        <Link className={smallNavLinkText} to="/blog">
                          Blog
                        </Link>
                      </li>
                      <li className={smallNavLinkItem}>
                        <p className={divider}>{"//"}</p>
                      </li>
                      <li className={smallNavLinkItem}>
                        <Link className={smallNavLinkText} to="/now_playing">
                          Now Playing
                        </Link>
                      </li>
                    </ul>
                  </nav>
                </div>
              </div>
              {children}
            </div>
          )}
          {(matches.large || matches.medium) && !matches.small && (
            <div style={{ margin: `0 auto`, padding: `0 1rem` }}>
              <div className={container}>
                <Link className={navLinkText} to="/">
                  Brendan Reed
                </Link>
                <div className={rightTab}>
                  <nav>
                    <ul className={navLinks}>
                      <li className={navLinkItem}>
                        <Link className={navLinkText} to="/">
                          About
                        </Link>
                      </li>
                      <li className={navLinkItem}>
                        <p className={divider}>{"//"}</p>
                      </li>
                      <li className={navLinkItem}>
                        <Link className={navLinkText} to="/blog">
                          Blog
                        </Link>
                      </li>
                      <li className={navLinkItem}>
                        <p className={divider}>{"//"}</p>
                      </li>
                      <li className={navLinkItem}>
                        <Link className={navLinkText} to="/now_playing">
                          Now Playing
                        </Link>
                      </li>
                    </ul>
                  </nav>
                </div>
              </div>
              {children}
            </div>
          )}
        </Fragment>
      )}
    </Media>
  )
}

Layout.propTypes = {
  children: PropTypes.any,
}
