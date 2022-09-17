import React from "react"
import styled from "styled-components"

const Item = styled.span`
  flex-grow: 1;
  font-size: large;
  padding: 5px;
`

export default function Icon({ link, name }) {
  return (
    <a href={link}>
      <Item>{name}</Item>
    </a>
  )
}
