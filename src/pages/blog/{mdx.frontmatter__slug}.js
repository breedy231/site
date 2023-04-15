import * as React from "react"
import Layout from "../../components/layout"
import { Link, graphql } from "gatsby"
import styled from "styled-components"
import { backtick, header } from "./{mdx.frontmatter__slug}.module.css"

export const query = graphql`
  query ($id: String) {
    mdx(id: { eq: $id }) {
      frontmatter {
        name
        datePublished(formatString: "MMMM D, YYYY")
      }
    }
  }
`

export const Head = ({ data }) => {
  return (
    <>
      <title>{data.mdx.frontmatter.name}</title>
      <html lang="en" />
    </>
  )
}

const StyledBlogHeader = styled.h2`
  font-size: 40px;
  margin-bottom: 0px;
`

const StyledPostedParagraph = styled.p`
  margin-top: 0px;
`

const PostDiv = styled.div`
  color: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  max-width: 700px;
  margin: auto;
`
const BlogPage = ({ data, children }) => {
  return (
    <Layout>
      <PostDiv>
        <StyledBlogHeader className={header}>
          {data.mdx.frontmatter.name}
        </StyledBlogHeader>
        <StyledPostedParagraph>
          {data.mdx.frontmatter.datePublished}
        </StyledPostedParagraph>
        {children}
        <Link className={backtick} to="/blog">
          {"<- Back to blog"}
        </Link>
      </PostDiv>
    </Layout>
  )
}

export default BlogPage
