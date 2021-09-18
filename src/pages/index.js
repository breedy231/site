import React from "react"

import Layout from "../components/layout"


export default function Home() {
  return (
      <Layout>
        <h1>Brendan Reed</h1>
        <div>
            <h3>About Me</h3>
            <p>I'm currently employed at Klaviyo, where I work on the Reporting team as a full-stack software engineer. Using Python, React, and Typescript, I enjoy designing and developing new tools to help people understand their data. </p>
            <p>I also enjoy cycling, films, 3D printing, and cooking.</p>
            <h3>Contact Me</h3>
            <p>
                <a href="mailto:bren.reed@pm.me">bren.reed@pm.me</a>
                <br></br>
                <a href="http://www.github.com/breedy231">Github</a>
                <br></br>
                <a href="https://www.linkedin.com/in/brendanreed2/">Linkedin</a>
            </p>
        </div>
      </Layout>
  ) 
}
