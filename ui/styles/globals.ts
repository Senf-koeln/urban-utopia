/** @format */

import { createGlobalStyle } from "styled-components";
import { normalize } from "./normalize";

const GlobalStyle = createGlobalStyle<{ custom?: string }>`
  ${normalize}

  ${(props) => props.custom}
  html {
  overflow: hidden;
  width: 100%;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;

}

#root{
  z-index: 0;
  width: 100vw;
}


body {
  margin: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  position: fixed;
  /* background-color: #ffffff; */
  font-family: var(--font-sans, "Nunito", sans-serif);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  /* box-sizing: content-box; */


  -ms-overflow-style: none;
  /* IE and Edge */
  scrollbar-width: none;
  /* Firefox */

  /* prevent overscroll bounce*/
  overscroll-behavior-y: contain;
  overflow-y: scroll;
  -webkit-overflow-scrolling: touch;
  color:black;
 overflow: hidden;
}



/* Hide scrollbar for Chrome, Safari and Opera */
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}

/* hide scrollbar but allow scrolling */
.hide-scrollbar {
  -ms-overflow-style: none;
  /* for Internet Explorer, Edge */
  scrollbar-width: none;
  /* for Firefox */
}

/* .show-scrollbar::-webkit-scrollbar {
  display: block;
}
.show-scrollbar {
  -ms-overflow-style: auto;
  scrollbar-width: auto;
} */

input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus,
  textarea:-webkit-autofill,
  textarea:-webkit-autofill:hover,
  textarea:-webkit-autofill:focus,
  select:-webkit-autofill,
  select:-webkit-autofill:hover,
  select:-webkit-autofill:focus {
    border: 0px solid transparent;
    /* -webkit-text-fill-color: inherit; */
    -webkit-box-shadow: 0 0 0px 1000px transparent inset;
    transition: background-color 5000s ease-in-out 0s;
  }



h1,
h2,
h3,
h4,
h5,
h6,
p {
  margin: 0;
  padding: 0;
}

a {
  color: var(--primary-600);
  text-decoration: none;
}

a:hover{
  text-decoration: underline;
}


// this is important for both editor and markdown implementation
// else there is a weird bug: when dragging a section lines are added to the list
.ql-container ol, .markdown ol {
  list-style-type: decimal;
  white-space: normal;
}
.ql-container ul, .markdown ul {
  list-style-type: disc;
  white-space: normal;
}
.centeredMarkdown ol{
  list-style-position: inside;
}
.centeredMarkdown ul{
  list-style-position: inside;
}

.markdown ol {
  padding-left: 1.5em !important;
  padding-right: 1.5em !important;
  
    /* list-style-position: inside;  */

}
.markdown ul {
  padding-left: 1.5em !important;
  padding-right: 1.5em !important;
    /* list-style-position: inside;  */
}


/* .markdown [dir="rtl"] ol {
  padding-left: 0 !important;
  padding-right: 20px !important;
}

.markdown [dir="rtl"] ul {
  padding-left: 0 !important;
  padding-right: 20px !important;
} */

.markdown {
  line-height: 1.5;
  white-space: normal;
}

.markdown :is(p, ol, ul) + :is(p, ol, ul) {
  margin-top: 1em;
}


button, input[type="submit"], input[type="reset"] {
	background: none;
	color: inherit;
	border: none;
	padding: 0;
	font: inherit;
	cursor: pointer;
	outline: inherit;
}






.item-enter {
  opacity: 0;
  transform: scale(1.01);
}
.item-exit,
.item-enter-active {
  opacity: 1;
  transform: scale(1);
}
.item-enter-active {
  transition: 200ms ease-in;
}

.item-exit-active {
  opacity: 0;
  transform: scale(1.01);
  transition: 200ms ease-in;
}


`;

export default GlobalStyle;
