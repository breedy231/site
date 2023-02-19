import React, { Fragment } from "react"
import Media from "react-media"
import styled from "styled-components"
import { useStaticQuery, graphql } from "gatsby"

import Layout from "../components/layout"
import {
  Header,
  StyledContentDiv,
  TextDiv,
  MainText,
} from "../components/textElements"

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

const MiniCols = styled.div(() => ({
  display: "flex",
  "flex-direction": "column",

  "& > p": {
    "font-size": "20px",
    color: "#FFFFFF",
    "margin-right": "150px",
    "margin-bottom": "-15px",
  },

  "& > a": {
    "font-size": "20px",
    color: "#FFFFFF",
    "margin-right": "150px",
    "margin-top": "18px",

    "text-decoration": "underline",
    "text-decoration-color": "#DA300F",
  },
}))

const MiniColHeader = styled.p`
  font-family: "Poppins Bold";
`

const MiniRow = styled.div`
  display: flex;
  flex-direction: row;
`

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
    </>
  )
}

const mainText =
  "I'm a software engineer. I create delightful user experiences designed to help people engage with their data."
const headerText = "Brendan Reed"
const locatedIn = "Located in"
const location = "Chicago, IL"
const getInTouch = "Get in touch"
const email = "bren.reed@protonmail.com"

export default function New() {
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
            <Layout>
              <StyledContentDiv>
                <TextDiv small={matches.small}>
                  <Header small={matches.small}>{headerText}</Header>
                  <MainText small={matches.small}>{mainText}</MainText>
                  <StyledSubText small={matches.small}>
                    Senior software engineer at{" "}
                    <a href="https://www.klaviyo.com">Klaviyo</a>. Previously at{" "}
                    <a href="https://www.gocatalant.com">Catalant</a>,{" "}
                    <a href="https://www.carbonite.com">Carbonite</a>, and{" "}
                    <a href="https://www.zipari.com">Zipari</a>.
                  </StyledSubText>
                  <StyledSubText small={matches.small}>
                    You can find me on{" "}
                    <a href="https://www.github.com/breedy231">Github</a> and{" "}
                    <a href="https://www.linkedin.com/in/brendanreed2/">
                      LinkedIn
                    </a>
                    .
                  </StyledSubText>
                  <div>
                    <MiniRow>
                      <MiniCols>
                        <MiniColHeader>{locatedIn}</MiniColHeader>
                        <p>{location}</p>
                      </MiniCols>
                    </MiniRow>
                    <MiniRow>
                      <MiniCols>
                        <MiniColHeader>{getInTouch}</MiniColHeader>
                        <a href="mailto:bren.reed@protonmail.com">{email}</a>
                      </MiniCols>
                    </MiniRow>
                  </div>
                </TextDiv>
              </StyledContentDiv>
            </Layout>
          )}
          {(matches.large || matches.medium) && !matches.small && (
            <Layout>
              <StyledContentDiv>
                <TextDiv small={matches.small}>
                  <Header small={matches.small}>{headerText}</Header>
                  <MainText small={matches.small}>{mainText}</MainText>
                  <StyledSubText small={matches.small}>
                    Senior software engineer at{" "}
                    <a href="https://www.klaviyo.com">Klaviyo</a>. Previously at{" "}
                    <a href="https://www.gocatalant.com">Catalant</a>,{" "}
                    <a href="https://www.carbonite.com">Carbonite</a>, and{" "}
                    <a href="https://www.zipari.com">Zipari</a>.
                  </StyledSubText>
                  <StyledSubText small={matches.small}>
                    You can find me on{" "}
                    <a href="https://www.github.com/breedy231">Github</a> and{" "}
                    <a href="https://www.linkedin.com/in/brendanreed2/">
                      LinkedIn
                    </a>
                    .
                  </StyledSubText>
                  <MiniRow>
                    <MiniCols>
                      <MiniColHeader>{locatedIn}</MiniColHeader>
                      <p>{location}</p>
                    </MiniCols>
                    <MiniCols>
                      <MiniColHeader>{getInTouch}</MiniColHeader>
                      <a href="mailto:bren.reed@protonmail.com">{email}</a>
                    </MiniCols>
                  </MiniRow>
                </TextDiv>
              </StyledContentDiv>
            </Layout>
          )}
        </Fragment>
      )}
    </Media>
  )
}
