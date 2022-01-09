import React from "react"
import InfoContainer from "../components/infoContainer"
import styled from "styled-components"

import Layout from "../components/layout"

const StyledDiv = styled.div`
    display: flex;
    flex-direction: row;

    font-size: 25px;
    background-color: #d6a0dc;
`;

const StyledContentDiv = styled.div`
    display: flex;
    justify-content: center;
    font-size: 50px;
    
    & > span {
        margin-top: 100px;
    }
    flex-direction: column;
    align-items: center;
`;

const StyledHeaderDiv = styled.div`

`;

const StyledTextDiv = styled.div`
    max-width: 750px;

    & > p {
        font-size: 30px;

        & > a {
            text-decoration: none;
        }
    }

`;

export default function New() {
  return (
      <Layout>
        <StyledDiv>
            <p>Brendan Reed</p>
            <InfoContainer>
                <p>Blog</p>
                <p>Projects</p>
                <a href="mailto:bren.reed@protonmail.com">Contact</a>
            </InfoContainer>
        </StyledDiv>
        <StyledContentDiv>
            <StyledHeaderDiv>
                <span>Hi, I'm Brendan👋🏻</span>
            </StyledHeaderDiv>
            <StyledTextDiv>
                <p>
                    I'm a software engineer, foodie, and movie nerd living in Cambridge, Massachusetts. 
                </p>
                <p>
                    Currently working at Klaviyo building new analytics tools. I've previously worked at Zipari, Carbonite, and Catalant. 
                </p>
                <p>
                    This is my personal site where I'll share what I'm working on, things I'm learning, and other stuff that I'm interested in. 
                </p>
                <p>
                If you want to get in touch with me, you can email me at <a href="mailto:bren.reed@protonmail.com">bren.reed@protonmail.com </a>. If you want to see my code, check me out on <a href="https://www.github.com/breedy231">Github</a>. 
                </p>
            </StyledTextDiv>
            
            
        </StyledContentDiv>
      </Layout>
  ) 
}