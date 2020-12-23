import React from "react"
import styled from "styled-components"

import Layout from "../components/layouts"



const Header = styled.h1`
  font-weight: bold;
  font-size: xx-large;
`


export default function Home() {
  return (
      <Layout>
        <body>
            <Header>Brendan Reed</Header>
            <h2>Software engineer in Boston</h2>
            <div>
                <h3>Contact Me</h3>
                <p>
                    <a href="mailto:bren.reed@pm.me">bren.reed@pm.me</a>
                    <br></br>
                    <a href="http://www.github.com/breedy231">Github</a>
                    <br></br>
                    <a href="https://www.linkedin.com/in/brendanreed2/">Linkedin</a>
                </p>
            </div>
        </body>
      </Layout>
  ) 
}
