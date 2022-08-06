import React, { Fragment } from "react"
import Media from 'react-media';
import styled from "styled-components"

import Layout from "../components/layout"


const StyledHeader = styled.p(props => ({
    'font-family': 'Poppins Bold',
    'font-style': 'normal',
    'font-weight': 700,
    'font-size': props.small ? '20px' : '40px',
    'line-height': '48px',
    color: '#DA300F',
}));

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

const StyledTextDiv = styled.div(props => ({
    'max-width': props.small ? '300px' : '700px',
    'margin-left': props.small ? '200px' : undefined,
}));

const StyledMainText = styled.p(props => ({
    'font-family': 'Poppins Regular',
    'font-style': 'normal',
    'font-weight': 700,
    'font-size': props.small ? '20px' : '40px',
    'line-height': props.small ? '24px' : '48px',
    'color': '#FFFFFF',
}));

const StyledSubText = styled.p`
    font-family: 'Poppins Regular';
    font-style: normal;
    font-weight: 400;
    font-size: 32px;
    line-height: 39px;

    color: #FFFFFF;

    & > a {
        text-decoration-color: #DA300F;
    }

    & > a:visited {
        color: #FFFFFF;
    }

    & > a:link {
        color: #FFFFFF;
    }

`;

const MiniCols = styled.div`
    display: flex;
    flex-direction: column;

    & > p {
        font-size: 20px;
        color: #FFFFFF;
        margin-right: 150px;
        margin-bottom: -15px;
    }

    & > a {
        font-size: 20px;
        color: #FFFFFF;
        margin-right: 150px;
        margin-top: 18px;

        text-decoration: underline;
        text-decoration-color: #DA300F;
    }
`;

const MiniColHeader = styled.p`
    font-family: 'Poppins Bold';
`;

const MiniRow = styled.div`
    display: flex;
    flex-direction: row;
`;

export default function New() {
  return (
    <Media queries={{
        small: "(max-width: 599px)",
        medium: "(min-width: 600px) and (max-width: 1199px)",
        large: "(min-width: 1200px)"
      }}>
        {matches => (
            <Fragment>
              {matches.small && (
              <p>I am small!</p>
          )}
              {matches.medium && <p>I am medium!</p>}
              {(matches.large || matches.small) && (
              
              <Layout>
        <StyledContentDiv>
            <StyledTextDiv small={matches.small}>
                <StyledHeader small={matches.small}>Brendan Reed</StyledHeader>
                <StyledMainText small={matches.small}>
                     I'm a software engineer. I create delightful user experiences designed to help people engage with their data. 
                </StyledMainText>
                <StyledSubText>
                    Senior software engineer at <a href="https://www.klaviyo.com">Klaviyo</a>. Previously at <a href="https://www.gocatalant.com">Catalant</a>, <a href="https://www.carbonite.com">Carbonite</a>, and <a href="https://www.zipari.com">Zipari</a>.  
                </StyledSubText>
                <MiniRow>
                    <MiniCols>
                        <MiniColHeader>Located in</MiniColHeader>
                        <p>Boston, MA</p>
                    </MiniCols>
                    <MiniCols>
                        <MiniColHeader>Get in touch</MiniColHeader>
                        <a href="mailto:bren.reed@protonmail.com">bren.reed@protonmail.com</a>
                    </MiniCols>
                </MiniRow> 
            </StyledTextDiv>
        </StyledContentDiv>
      </Layout>
          )}
    </Fragment>
          )}
     
    </Media>
  ) 
}