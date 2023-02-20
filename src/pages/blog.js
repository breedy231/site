import * as React from 'react'
import Layout from '../components/layout'
import { graphql } from "gatsby"

export const query = graphql`
query {
    allMdx(sort: { frontmatter: { datePublished: DESC } }) {
      nodes {
        id,
        frontmatter {
          datePublished(formatString: "MMMM D, YYYY"),
          name
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

const BlogPage = ({data}) => {
  return (
    <Layout pageTitle="My Blog Posts">
      <p>My cool posts will go in here</p>
      {
        data.allMdx.nodes.map((node) => (
          <article key={node.id}>
            <h2>{node.frontmatter.name}</h2>
            <p>Posted: {node.frontmatter.datePublished}</p>
            <p>{node.excerpt}</p>
          </article>
        ))
      }
    </Layout>
  )
}

export default BlogPage