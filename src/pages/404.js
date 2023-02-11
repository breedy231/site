import React, { Fragment } from "react"
import Media from "react-media"
import Layout from "../components/layout"
import {
  Header,
  StyledContentDiv,
  TextDiv,
  MainText,
} from "../components/textElements"
import { useStaticQuery, graphql } from "gatsby"

const Seo = ({ children }) => <>{children}</>

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
    <Seo>
      <title>{data.site.siteMetadata.title}</title>
      <html lang="en" />
    </Seo>
  )
}

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
          {matches.small && !(matches.large || matches.medium) && (
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
          {(matches.large || matches.medium) && !matches.small && (
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
