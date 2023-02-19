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

export const StyledSubText = styled.p(props => ({
  "font-family": "Poppins Regular",
  "font-style": "normal",
  "font-weight": "400",
  "font-size": props.small ? "20px" : "32px",
  "line-height": props.small ? "22px" : "39px",

  color: "#FFFFFF",

  "& > a": {
    "text-decoration-color": "#DA300F",
  },

  "& > a:visited": {
    color: "#FFFFFF",
  },

  "& > a:link": {
    color: "#FFFFFF",
  },
}))

export const MiniCols = styled.div(() => ({
  display: "flex",
  "flex-direction": "column",

  "& > p": {
    "font-size": "20px",
    color: "#FFFFFF",
    "margin-right": "150px",
    "margin-bottom": "-15px",
  },

  "& > a": {
    "font-size": "20px",
    color: "#FFFFFF",
    "margin-right": "150px",
    "margin-top": "18px",

    "text-decoration": "underline",
    "text-decoration-color": "#DA300F",
  },
}))

export const MiniColHeader = styled.p`
  font-family: "Poppins Bold";
`

export const MiniRow = styled.div`
  display: flex;
  flex-direction: row;
`
