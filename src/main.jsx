import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { SettingsProvider } from "./contexts/SettingsContext.jsx";



ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Toaster position="top-center" reverseOrder={false} containerStyle={{ zIndex: 99999 }} />
       <SettingsProvider>
        <App /> 
       </SettingsProvider>
    </BrowserRouter>
  </React.StrictMode>
);
