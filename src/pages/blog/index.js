import * as React from 'react'
import Layout from '../../components/layout'
import { Link, graphql } from "gatsby"
import styled from 'styled-components'
import { container, divider } from './index.module.css'


export const query = graphql`
query {
    allMdx(sort: { frontmatter: { datePublished: DESC } }) {
      nodes {
        id,
        frontmatter {
          datePublished(formatString: "MMMM D, YYYY"),
          name
          slug
        }
        excerpt
      }
  },
  site {
    id,
    siteMetadata {
            title
          }
  }
  }`


export const Head = ({ data }) => {
  
    return (
      <>
        <title>{data.site.siteMetadata.title}</title>
        <html lang="en" />
      </>
    )
  }

const StyledBlogDiv = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  max-width: 700px;
  margin: auto;
`
const StyledBlogPost = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`

const StyledBlogHeader = styled.h2`
  color: #FFFFFF;
  size: 40px;
  margin-bottom: 0px;

  & :visited {
    text-decoration-color: #DA300F;
    color: #FFFFFF;
  }
`

const StyledPostedParagraph = styled.p`
  margin-top: 0px;
  color: #FFFFFF;
`;

const BlogPage = ({data}) => {
  return (
    <Layout pageTitle="My Blog Posts">


          <StyledBlogDiv>
            {
            data.allMdx.nodes.map((node) => (
              <StyledBlogPost key={node.id}>
                <article>
                  <StyledBlogHeader>
                    <Link className={container} to={`/blog/${node.frontmatter.slug}`}>
                      {node.frontmatter.name}
                    </Link>
                  </StyledBlogHeader>
                  <StyledPostedParagraph>Posted: {node.frontmatter.datePublished}</StyledPostedParagraph>
                  <StyledPostedParagraph>{node.excerpt}</StyledPostedParagraph>
                </article>
                <p className={divider}>
                  {"/////"}
                </p>
              </StyledBlogPost>
              
            ))
          }
          </StyledBlogDiv>
          
      
      
    </Layout>
  )
}

export default BlogPage