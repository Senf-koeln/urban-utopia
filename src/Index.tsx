import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "@tokens/fonts.css";
import "@tokens/tailwind.css";
import "@tokens/output/global.css";
import "@tokens/output/light.css";
import { createHead, UnheadProvider } from "@unhead/react/client";
import { ModalProvider, theme } from "@ui";
import { ThemeProvider } from "styled-components";
import { UserProvider } from "./aiImageGenerator/context/userContext.tsx";

const head = createHead();
ReactDOM.createRoot(document.getElementById("root")!).render(
  // <React.StrictMode>
  <ThemeProvider theme={theme}>
    <UnheadProvider head={head}>
      <UserProvider>
        <ModalProvider>
          <App />
        </ModalProvider>
      </UserProvider>
    </UnheadProvider>
  </ThemeProvider>,
  // </React.StrictMode>
);
