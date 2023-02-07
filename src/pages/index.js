import React, { Fragment } from "react"
import Media from "react-media"
import styled from "styled-components"

import Layout from "../components/layout"

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

const LargeMainText = styled.p`
  font-family: "Poppins Regular";
  font-style: "normal";
  font-weight: 700;
  font-size: 40px;
  line-height: 48px;
  color: #ffffff;
`

const SmallMainText = styled.p`
  font-family: "Poppins Regular";
  font-style: "normal";
  font-weight: 700;
  font-size: 30px;
  line-height: 35px;
  color: #ffffff;
`

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

const MiniCols = styled.div(props => ({
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

const SEO = ({ children }) => (
  <>
    {children}
  </>
)

export const Head = () => (
  <SEO>
    <title>Hello World</title>
    <html lang="en" />
  </SEO>
)


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
          {matches.small && !matches.large && (
            <Layout>
              <StyledContentDiv>
                <SmallTextDiv>
                  <SmallHeader>Brendan Reed</SmallHeader>
                  <SmallMainText>
                    I'm a software engineer. I create delightful user
                    experiences designed to help people engage with their data.
                  </SmallMainText>
                  <StyledSubText small={matches.small}>
                    Senior software engineer at{" "}
                    <a href="https://www.klaviyo.com">Klaviyo</a>. Previously at{" "}
                    <a href="https://www.gocatalant.com">Catalant</a>,{" "}
                    <a href="https://www.carbonite.com">Carbonite</a>, and{" "}
                    <a href="https://www.zipari.com">Zipari</a>.
                  </StyledSubText>
                  <div>
                    <MiniRow>
                      <MiniCols>
                        <MiniColHeader>Located in</MiniColHeader>
                        <p>Boston, MA</p>
                      </MiniCols>
                    </MiniRow>
                    <MiniRow>
                      <MiniCols>
                        <MiniColHeader>Get in touch</MiniColHeader>
                        <a href="mailto:bren.reed@protonmail.com">
                          bren.reed@protonmail.com
                        </a>
                      </MiniCols>
                    </MiniRow>
                  </div>
                </SmallTextDiv>
              </StyledContentDiv>
            </Layout>
          )}
          {matches.large && !matches.small && (
            <Layout>
              <StyledContentDiv>
                <LargeTextDiv>
                  <LargeHeader>Brendan Reed</LargeHeader>
                  <LargeMainText>
                    I'm a software engineer. I create delightful user
                    experiences designed to help people engage with their data.
                  </LargeMainText>
                  <StyledSubText small={matches.small}>
                    Senior software engineer at{" "}
                    <a href="https://www.klaviyo.com">Klaviyo</a>. Previously at{" "}
                    <a href="https://www.gocatalant.com">Catalant</a>,{" "}
                    <a href="https://www.carbonite.com">Carbonite</a>, and{" "}
                    <a href="https://www.zipari.com">Zipari</a>.
                  </StyledSubText>
                  <MiniRow>
                    <MiniCols>
                      <MiniColHeader>Located in</MiniColHeader>
                      <p>Boston, MA</p>
                    </MiniCols>
                    <MiniCols>
                      <MiniColHeader>Get in touch</MiniColHeader>
                      <a href="mailto:bren.reed@protonmail.com">
                        bren.reed@protonmail.com
                      </a>
                    </MiniCols>
                  </MiniRow>
                </LargeTextDiv>
              </StyledContentDiv>
            </Layout>
          )}
        </Fragment>
      )}
    </Media>
  )
}
