import React, { Fragment } from "react"
import Media from "react-media"
import Layout from "../components/layout"
import { useStaticQuery, graphql } from "gatsby"

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
    <>
      <title>{data.site.siteMetadata.title}</title>
      <html lang="en" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="theme-color" content="#032740" />
    </>
  )
}

const errorText = "Uh-oh, we couldn't find what you were looking for."

export default function NotFound() {
  return (
    <Media
      queries={{
        small: "(max-width: 599px)",
        medium: "(min-width: 600px) and (max-width: 1199px)",
        large: "(min-width: 1200px)",
      }}
    >
      {() => (
        <Fragment>
          <Layout>
            <div className="text-5x flex flex-col items-center justify-center">
              <div className="mt-14 text-3xl text-white md:text-4xl">
                <p className="text-4xl font-bold text-red-600 md:text-5xl">
                  404 Not Found
                </p>
                <div className="mt-14 text-3xl text-white md:text-4xl">
                  {errorText}
                </div>
              </div>
            </div>
          </Layout>
        </Fragment>
      )}
    </Media>
  )
}
