import * as React from "react"
import Layout from "../../components/layout"
import { Link, graphql } from "gatsby"
import { divider } from "./index.module.css"

export const query = graphql`
  query {
    allMdx(sort: { frontmatter: { datePublished: DESC } }) {
      nodes {
        id
        frontmatter {
          datePublished(formatString: "MMMM D, YYYY")
          name
          slug
        }
        excerpt
      }
    }
    site {
      id
      siteMetadata {
        title
      }
    }
  }
`

// eslint-disable-next-line react/prop-types
export const Head = ({ data }) => {
  return (
    <>
      {/* eslint-disable-next-line react/prop-types */}
      <title>{data.site.siteMetadata.title}</title>
      <html lang="en" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="theme-color" content="#032740" />
    </>
  )
}

// eslint-disable-next-line react/prop-types
const BlogPage = ({ data }) => {
  return (
    <Layout pageTitle="My Blog Posts">
      <div className="m-auto flex max-w-3xl flex-col items-start">
        {/* eslint-disable-next-line react/prop-types */}
        {data.allMdx.nodes.map(node => (
          <div className="mt-20 flex w-full flex-col" key={node.id}>
            <article>
              <h2 className="text-3xl font-bold text-gray-900 underline decoration-red-700 underline-offset-4 dark:text-white">
                <Link to={`/blog/${node.frontmatter.slug}`}>
                  {node.frontmatter.name}
                </Link>
              </h2>
              <p className="mt-0 mt-3 text-gray-900 dark:text-white">
                Posted: {node.frontmatter.datePublished}
              </p>
              <p className="mt-0 mt-3 text-gray-900 dark:text-white">
                {node.excerpt}
              </p>
            </article>
            <p className={divider}>{"/////"}</p>
          </div>
        ))}
      </div>
    </Layout>
  )
}

export default BlogPage
