import React, { Fragment } from "react"
import Media from "react-media"
import Layout from "../components/layout"
import {
  Header,
  StyledContentDiv,
  TextDiv,
  MainText,
} from "../components/textElements"

const Seo = ({ children }) => <>{children}</>

export const Head = () => (
  <Seo>
    <title>Hello World</title>
    <html lang="en" />
  </Seo>
)

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
          {matches && (
            <Layout>
              <StyledContentDiv>
                <TextDiv small={matches.small}>
                  <Header small={matches.small}>404 Not Found</Header>
                  <MainText small={matches.small}>
                    Uh-oh, we couldn't find what you were looking for.
                  </MainText>
                </TextDiv>
              </StyledContentDiv>
            </Layout>
          )}
        </Fragment>
      )}
    </Media>
  )
}
