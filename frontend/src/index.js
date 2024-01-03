"use client";
import { Analytics } from "@vercel/analytics/react";

import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
    <Analytics mode={"production"} />;
  </React.StrictMode>
);
