import React, { Fragment } from "react"
import Media from "react-media"
import Layout from "../components/layout"
import { GatsbyImage } from "gatsby-plugin-image"
import { useStaticQuery, graphql } from "gatsby"

export const Head = () => (
  <>
    <title>Hello World</title>
    <html lang="en" />
  </>
)

export default function NotFound() {
  const data = useStaticQuery(graphql`
    {
      allFile(filter: { name: { eq: "plexThumbnail" } }) {
        edges {
          node {
            childImageSharp {
              gatsbyImageData
            }
          }
        }
      }
    }
  `)

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
                  Now Playing
                </p>
                <p className="mt-10 text-lg text-white md:text-4xl">
                  The latest from my Plex Server
                </p>
              </div>
              {data.allFile.edges.length > 0 ? (
                <GatsbyImage
                  image={
                    data.allFile.edges[0].node.childImageSharp.gatsbyImageData
                  }
                />
              ) : (
                <p>No image to display</p>
              )}
            </div>
          </Layout>
        </Fragment>
      )}
    </Media>
  )
}
