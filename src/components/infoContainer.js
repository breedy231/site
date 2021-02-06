import React from "react"
import styled from "styled-components"

const StyledDiv = styled.div`
    border: 5px solid #c792c8;
`;

export default function InfoContainer({ children }) {
    return (
      <StyledDiv>
        {children}
      </StyledDiv>
    )
  }