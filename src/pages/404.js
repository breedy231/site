import React, { Fragment } from "react"
import Media from "react-media"
import Layout from "../components/layout"
import { Header, TextDiv, MainText } from "../components/textElements"
import { useStaticQuery, graphql } from "gatsby"

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

const errorText = "Uh-oh, we couldn't find what you were looking for."

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
              <div className="text-5x flex flex-col items-center justify-center">
                <TextDiv small={matches.small}>
                  <Header small={matches.small}>404 Not Found</Header>
                  <MainText small={matches.small}>{errorText}</MainText>
                </TextDiv>
              </div>
            </Layout>
          )}
          {(matches.large || matches.medium) && !matches.small && (
            <Layout>
              <div className="text-5x flex flex-col items-center justify-center">
                <TextDiv small={matches.small}>
                  <Header small={matches.small}>404 Not Found</Header>
                  <MainText small={matches.small}>{errorText}</MainText>
                </TextDiv>
              </div>
            </Layout>
          )}
        </Fragment>
      )}
    </Media>
  )
}
