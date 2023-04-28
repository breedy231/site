import * as React from "react"
import Layout from "../../components/layout"
import { Link, graphql } from "gatsby"
import { container, divider } from "./index.module.css"

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

export const Head = ({ data }) => {
  return (
    <>
      <title>{data.site.siteMetadata.title}</title>
      <html lang="en" />
    </>
  )
}

const BlogPage = ({ data }) => {
  return (
    <Layout pageTitle="My Blog Posts">
      <div className="flex flex-col items-start max-w-3xl m-auto">
        {data.allMdx.nodes.map(node => (
          <div className="flex flex-col w-full" key={node.id}>
            <article>
              <h2 className="text-white text-4xl">
                <Link
                  className={container}
                  to={`/blog/${node.frontmatter.slug}`}
                >
                  {node.frontmatter.name}
                </Link>
              </h2>
              <p className="mt-0 text-white">
                Posted: {node.frontmatter.datePublished}
              </p>
              <p className="mt-0 text-white">{node.excerpt}</p>
            </article>
            <p className={divider}>{"/////"}</p>
          </div>
        ))}
      </div>
    </Layout>
  )
}

export default BlogPage
