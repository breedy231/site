import React from "react"
import styled from "styled-components"

import Icon from "../components/icon"

const HeaderRow = styled.div`
    display: flex;
`

const Name = styled.p`
    flex-grow: 10;
    padding-top: 10px;
    padding-bottom: 10px;
    margin: 0;
    font-weight: normal;
    font-size: large;
`

const IconBox = styled.div`
    flex-grow: 1;
    display: flex;
    padding-top: 10px;
    padding-bottom: 10px;
`

export default function Header() {
  return (
    <HeaderRow>
        <a href="/"><Name>Brendan Reed</Name></a>
        <IconBox>
            <Icon link="/about" name="About" />
        </IconBox>
    </HeaderRow>
  )
}