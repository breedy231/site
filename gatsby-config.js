module.exports = {
  siteMetadata: {
    title: `Brendan Reed`,
    description: `Portfolio site for Brendan Reed`,
    author: `@breedy231`,
  },
  plugins: [
    "gatsby-plugin-postcss",
    `gatsby-transformer-remark`,
    `gatsby-plugin-styled-components`,
    `gatsby-plugin-sass`,
    `gatsby-plugin-netlify`,
    `gatsby-plugin-sharp`,
    `gatsby-plugin-image`,
    "gatsby-plugin-mdx",
    `gatsby-transformer-sharp`,
    {
      resolve: `gatsby-plugin-goatcounter`,
      options: {
        code: process.env.GATSBY_GOATCOUNTER_CODE,
        head: false,
        pixel: false,
        allowLocal: false,
        localStorageKey: "skipgc",
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: `${__dirname}/src/images/`,
      },
    },
    {
      resolve: "gatsby-source-filesystem",
      options: {
        name: `blog`,
        path: `${__dirname}/blog`,
      },
    },
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: "GatsbyJS",
        short_name: "GatsbyJS",
        start_url: "/",
        background_color: "#6b37bf",
        theme_color: "#6b37bf",
        icon: "src/images/icon.png",
        crossOrigin: `use-credentials`,
      },
    },
  ],
}

require("dotenv").config({
  path: `.env.${process.env.NODE_ENV}`,
})
