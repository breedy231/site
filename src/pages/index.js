import React, { Fragment } from "react"
import Media from "react-media"
import { useStaticQuery, graphql } from "gatsby"

import Layout from "../components/layout"

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

const mainText =
  "I'm a software engineer. I create delightful user experiences designed to help people engage with their data."
const locatedIn = "Located in"
const location = "Chicago, IL"
const getInTouch = "Get in touch"
const email = "bren.reed@protonmail.com"

export default function New() {
  return (
    <Media
      queries={{
        small: "(max-width: 599px)",
        medium: "(min-width: 600px) and (max-width: 1199px)",
        large: "(min-width: 1200px)",
      }}
    >
      {() => (
        <Fragment>
          <Layout>
            <div className="text-5x flex flex-col items-center justify-center">
              <div className="max-w-xs md:max-w-3xl">
                <div className="mt-14 text-3xl text-gray-900 dark:text-white md:text-4xl">
                  {mainText}
                </div>
                <p className="mt-10 text-lg text-gray-900 dark:text-white md:text-4xl">
                  Lead software engineer at{" "}
                  <a
                    className="text-gray-900 underline decoration-red-700 dark:text-white"
                    href="https://www.klaviyo.com"
                  >
                    Klaviyo
                  </a>
                  . Previously at{" "}
                  <a
                    className="text-gray-900 underline decoration-red-700 dark:text-white"
                    href="https://www.gocatalant.com"
                  >
                    Catalant
                  </a>
                  ,{" "}
                  <a
                    className="text-gray-900 underline decoration-red-700 dark:text-white"
                    href="https://www.carbonite.com"
                  >
                    Carbonite
                  </a>
                  , and{" "}
                  <a
                    className="text-gray-900 underline decoration-red-700 dark:text-white"
                    href="https://www.zipari.com"
                  >
                    Zipari
                  </a>
                  .
                </p>
                <p className="mt-10 text-lg text-gray-900 dark:text-white md:text-4xl">
                  You can find me on{" "}
                  <a
                    className="text-gray-900 underline decoration-red-700 dark:text-white"
                    href="https://www.github.com/breedy231"
                  >
                    Github
                  </a>{" "}
                  and{" "}
                  <a
                    className="text-gray-900 underline decoration-red-700 dark:text-white"
                    href="https://www.linkedin.com/in/brendanreed2/"
                  >
                    LinkedIn
                  </a>
                  .
                </p>
                <div className="mt-5 flex flex-row">
                  <div className="flex flex-col">
                    <p className="mr-36 text-xl font-bold text-gray-900 dark:text-white">
                      {locatedIn}
                    </p>
                    <p className="text-xl text-gray-900 dark:text-white">
                      {location}
                    </p>
                  </div>
                  <div>
                    <p className="mr-36 text-xl font-bold text-gray-900 dark:text-white">
                      {getInTouch}
                    </p>
                    <a
                      className="mr-36 text-xl text-gray-900 underline decoration-red-700 dark:text-white"
                      href="mailto:bren.reed@protonmail.com"
                    >
                      {email}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </Layout>
        </Fragment>
      )}
    </Media>
  )
}
