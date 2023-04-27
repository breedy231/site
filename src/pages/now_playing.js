import React, { Fragment } from "react"
import Media from "react-media"
import Layout from "../components/layout"
import { GatsbyImage } from "gatsby-plugin-image"
import { useStaticQuery, graphql } from "gatsby"

import { TextDiv, Header, StyledSubText } from "../components/textElements"

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
      {matches => (
        <Fragment>
          {matches.small && !matches.large && (
            <Layout>
              <div className="text-5x flex flex-col items-center justify-center">
                <TextDiv small={matches.small}>
                  <Header small={matches.small}>Now Playing</Header>
                  <StyledSubText small={matches.small}>
                    The latest from my Plex Server
                  </StyledSubText>
                </TextDiv>
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
          )}{" "}
          {matches.large && !matches.small && (
            <Layout>
              <div className="text-5x flex flex-col items-center justify-center">
                <TextDiv small={matches.small}>
                  <Header small={matches.small}>Now Playing</Header>
                  <StyledSubText small={matches.small}>
                    The latest from my Plex Server
                  </StyledSubText>
                </TextDiv>
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
          )}
        </Fragment>
      )}
    </Media>
  )
}
