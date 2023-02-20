import * as React from 'react'
import Layout from '../../components/layout'
import { graphql } from "gatsby"

export const query = graphql`
query ($id: String) {
  mdx(id: {eq: $id}) {
    frontmatter {
      name
      datePublished(formatString: "MMMM D, YYYY")
    }
  }
  }`


export const Head = ({ data }) => {
  
    return (
      <>
        <title>{data.mdx.frontmatter.name}</title>
        <html lang="en" />
      </>
    )
  }

const BlogPage = ({data, children}) => {
  return (
    <Layout pageTitle={data.mdx.frontmatter.name}>
      <p>{data.mdx.frontmatter.datePublished}</p>
      {children}
    </Layout>
  )
}

export default BlogPage