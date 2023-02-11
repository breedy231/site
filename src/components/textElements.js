import styled from "styled-components"

export const Header = styled.p(props => ({
  "font-family": "Poppins Bold",
  "font-style": "normal",
  "font-weight": "700",
  "font-size": props.small ? "35px" : "40px",
  "line-height": "48px",
  color: "#da300f",
}))

export const StyledContentDiv = styled.div`
  display: flex;
  justify-content: center;
  font-size: 50px;

  & > span {
    margin-top: 100px;
  }
  flex-direction: column;
  align-items: center;
`

export const TextDiv = styled.div(props => ({
  "max-width": props.small ? "300px" : "700px",
}))

export const MainText = styled.div(props => ({
  "font-family": "Poppins Regular",
  "font-style": "normal",
  "font-weight": "700",
  "font-size": props.small ? "30px" : "40px",
  "line-height": props.small ? "35px" : "48px",
  color: "#ffffff",
}))
