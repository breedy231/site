import React, { Fragment } from "react"
import Media from "react-media"
import styled from "styled-components"

import Layout from "../components/layout"
import { Header, StyledContentDiv, TextDiv, MainText} from '../components/textElements';

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

const Seo = ({ children }) => <>{children}</>

export const Head = () => (
  <Seo>
    <title>Hello World</title>
    <html lang="en" />
  </Seo>
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
          {matches && (
            <Layout>
              <StyledContentDiv>
                <TextDiv small={matches.small}>
                  <Header small={matches.small}>Brendan Reed</Header>
                  <MainText small={matches.small}>
                    I'm a software engineer. I create delightful user
                    experiences designed to help people engage with their data.
                  </MainText>
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
                </TextDiv>
              </StyledContentDiv>
            </Layout>
          )}
        </Fragment>
      )}
    </Media>
  )
}
