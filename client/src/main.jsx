import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { Home, CreateGame, JoinGame, Game } from "./page";
import { GlobalContextProvider } from "./context";
import "./index.css";

// This section checks the path. The game currently starts at http://localhost:5173,
// so the path is what will follow after.
// For example: http://localhost:5173/ will take you to the Home page, while
// http://localhost:5173/create-game will redirect you to the page where the games get created
ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <GlobalContextProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create-game" element={<CreateGame />} />
        <Route path="/join-game" element={<JoinGame />} />
        <Route path="/game/:gameName" element={<Game />} />
      </Routes>
    </GlobalContextProvider>
  </BrowserRouter>
);
