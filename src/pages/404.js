import React, { Fragment } from "react"
import Media from 'react-media';
import styled from "styled-components"
import Layout from "../components/layout"

const StyledHeader = styled.p(props => ({
    'font-family': 'Poppins Bold',
    'font-style': 'normal',
    'font-weight': 700,
    'font-size': props.small ? '35px' : '40px',
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
}));

const StyledMainText = styled.p(props => ({
    'font-family': 'Poppins Regular',
    'font-style': 'normal',
    'font-weight': 700,
    'font-size': props.small ? '30px' : '40px',
    'line-height': props.small ? '35px' : '48px',
    'color': '#FFFFFF',
}));

export default function NotFound() {
  return (
    <Media queries={{
        small: "(max-width: 599px)",
        medium: "(min-width: 600px) and (max-width: 1199px)",
        large: "(min-width: 1200px)"
      }}>
        {matches => (
            <Fragment>
              {matches && (
              
              <Layout>
        <StyledContentDiv>
            <StyledTextDiv small={matches.small}>
                <StyledHeader small={matches.small}>404 Not Found</StyledHeader>
                <StyledMainText small={matches.small}>
                     Uh-oh, we couldn't find what you were looking for.  
                </StyledMainText>
            </StyledTextDiv>
        </StyledContentDiv>
      </Layout>
          )}
    </Fragment>
          )}
     
    </Media>
  ) 
}