import React from "react"
import styled from "styled-components"

const StyledDiv = styled.div`
  display: flex;
  flex-direction: row;
  margin-left: auto;

  & > p {
    margin-left: 15.5px;
    margin-right: 15.5px;
  }

  & > a {
    margin-left: 15.5px;
    margin-right: 15.5px;
    margin-top: 25px;
    text-decoration: none;
    color: black;
  }
`

export default function InfoContainer({ children }) {
  return <StyledDiv>{children}</StyledDiv>
}
