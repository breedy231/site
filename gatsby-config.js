module.exports = {
  siteMetadata: {
    title: `Brendan Reed`,
    description: `Portfolio site for Brendan Reed`,
    author: `@breedy231`,
  },
  plugins: [
    `gatsby-transformer-remark`,
    `gatsby-plugin-styled-components`,
    `gatsby-plugin-sass`,
    `gatsby-plugin-netlify`,
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
