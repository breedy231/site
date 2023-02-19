import React, { Fragment } from "react"
import Media from "react-media"
import styled from "styled-components"
import Layout from "../components/layout"
import { GatsbyImage } from "gatsby-plugin-image"
import { useStaticQuery, graphql } from "gatsby"

import { TextDiv } from "../components/textElements"

const StyledSubText = styled.p(props => ({
  "font-family": "Poppins Regular",
  "font-style": "normal",
  "font-weight": "400",
  "font-size": props.small ? "20px" : "32px",
  "line-height": props.small ? "22px" : "39px",

  color: "#FFFFFF",

  "& > a": {
    "text-decoration-color": "#DA300F",
  },

  "& > a:visited": {
    color: "#FFFFFF",
  },

  "& > a:link": {
    color: "#FFFFFF",
  },
}))

const LargeHeader = styled.p`
  font-family: "Poppins Bold";
  font-style: "normal";
  font-weight: 700;
  font-size: 40px;
  line-height: 48px;
  color: #da300f;
`

const SmallHeader = styled.p`
  font-family: "Poppins Bold";
  font-style: "normal";
  font-weight: 700;
  font-size: 35px;
  line-height: 48px;
  color: #da300f;
`

const StyledContentDiv = styled.div`
  display: flex;
  justify-content: center;
  font-size: 50px;

  & > span {
    margin-top: 100px;
  }
  flex-direction: column;
  align-items: center;
`

const LargeTextDiv = styled.div`
  max-width: 700px;
`

const SmallTextDiv = styled.div`
  max-width: 300px;
`

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
              <StyledContentDiv>
                <SmallTextDiv>
                  <SmallHeader>Now Playing</SmallHeader>

                  <TextDiv small={matches.small}>
                    <StyledSubText small={matches.small}>
                      The latest from my Plex Server
                    </StyledSubText>
                  </TextDiv>

                  {data.allFile.edges.length > 0 ? (
                    <GatsbyImage
                      image={
                        data.allFile.edges[0].node.childImageSharp
                          .gatsbyImageData
                      }
                    />
                  ) : (
                    <p>No image to display</p>
                  )}
                </SmallTextDiv>
              </StyledContentDiv>
            </Layout>
          )}{" "}
          {matches.large && !matches.small && (
            <Layout>
              <StyledContentDiv>
                <LargeTextDiv>
                  <LargeHeader>Now Playing</LargeHeader>
                  <TextDiv small={matches.small}>
                    <StyledSubText small={matches.small}>
                      The latest from my Plex Server
                    </StyledSubText>
                  </TextDiv>
                  {data.allFile.edges.length > 0 ? (
                    <GatsbyImage
                      image={
                        data.allFile.edges[0].node.childImageSharp
                          .gatsbyImageData
                      }
                    />
                  ) : (
                    <p>No image to display</p>
                  )}
                </LargeTextDiv>
              </StyledContentDiv>
            </Layout>
          )}
        </Fragment>
      )}
    </Media>
  )
}
