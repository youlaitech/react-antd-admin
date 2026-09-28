import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";

import "@/locales";
import "virtual:uno.css";
import "@/styles/index.scss";

import App from "./App";

const container = document.getElementById("root") as HTMLElement;

createRoot(container).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>
);
