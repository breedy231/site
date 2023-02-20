import * as React from 'react'
import Layout from '../components/layout'
import { graphql } from "gatsby"

export const query = graphql`
  query {
    allFile(filter: {extension: {eq: "mdx"}}) {
      nodes {
        name
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
        data.allFile.nodes.map(node => (
          <li key={node.name}>
            {node.name}
          </li>
        ))
      }
    </Layout>
  )
}

export default BlogPage