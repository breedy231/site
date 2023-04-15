import React, { Fragment } from "react"
import Media from "react-media"
import Layout from "../components/layout"
import { GatsbyImage } from "gatsby-plugin-image"
import { useStaticQuery, graphql } from "gatsby"

import {
  TextDiv,
  Header,
  StyledContentDiv,
  StyledSubText,
} from "../components/textElements"

export const Head = () => (
  <>
    <title>Hello World</title>
    <html lang="en" />
  </>
)

export default function Projects() {
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
              <StyledContentDiv>
                <TextDiv small={matches.small}>
                  <Header small={matches.small}>Projects</Header>
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
              </StyledContentDiv>
            </Layout>
          )}{" "}
          {matches.large && !matches.small && (
            <Layout>
              <StyledContentDiv>
                <TextDiv small={matches.small}>
                  <Header small={matches.small}>Projects</Header>
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
              </StyledContentDiv>
            </Layout>
          )}
        </Fragment>
      )}
    </Media>
  )
}
