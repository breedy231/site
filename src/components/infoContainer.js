import React from "react"
import styled from "styled-components"

const StyledDiv = styled.div`
    
`;

export default function InfoContainer({ children }) {
    return (
      <StyledDiv>
        {children}
      </StyledDiv>
    )
  }