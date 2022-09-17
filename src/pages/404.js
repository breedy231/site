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

export default function NotFound() {
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
                  <SmallHeader>404 Not Found</SmallHeader>
                  <SmallMainText>
                    Uh-oh, we couldn't find what you were looking for.
                  </SmallMainText>
                </SmallTextDiv>
              </StyledContentDiv>
            </Layout>
          )}{" "}
          {matches.large && !matches.small && (
            <Layout>
              <StyledContentDiv>
                <LargeTextDiv>
                  <LargeHeader>404 Not Found</LargeHeader>
                  <LargeMainText>
                    Uh-oh, we couldn't find what you were looking for.
                  </LargeMainText>
                </LargeTextDiv>
              </StyledContentDiv>
            </Layout>
          )}
        </Fragment>
      )}
    </Media>
  )
}
