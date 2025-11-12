import * as React from "react"
import Layout from "../../components/layout"
import { Link, graphql } from "gatsby"

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
// eslint-disable-next-line react/prop-types
export const Head = ({ data }) => {
  return (
    <>
      {/* eslint-disable-next-line react/prop-types */}
      <title>{data.mdx.frontmatter.name}</title>
      <html lang="en" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="theme-color" content="#032740" />
    </>
  )
}

// eslint-disable-next-line react/prop-types
const BlogPage = ({ data, children }) => {
  return (
    <Layout>
      <div className="mx-auto mb-5 max-w-4xl list-disc space-y-6 text-gray-900 visited:decoration-red-500 dark:text-white">
        <h1 className="mt-10 text-4xl font-bold">
          {/* eslint-disable-next-line react/prop-types */}
          {data.mdx.frontmatter.name}
        </h1>
        <p className="mt-3">
          {/* eslint-disable-next-line react/prop-types */}
          {data.mdx.frontmatter.datePublished}
        </p>
        <article className="prose text-gray-900 lg:prose-lg prose-headings:text-gray-900 prose-a:text-red-500 prose-a:decoration-red-500 prose-code:text-gray-900 dark:text-white dark:prose-headings:text-white dark:prose-code:text-white">
          {children}
        </article>
        <div className="mb-20 underline decoration-red-500 underline-offset-4">
          <Link to="/blog">{"<- Back to blog"}</Link>
        </div>
      </div>
    </Layout>
  )
}

export default BlogPage
