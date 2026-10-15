import React, { useState } from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import Login from "./components/Login";
import Users from "./components/Users";

function App() {

  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("token")
  );

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
  };

  return (
    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/users" />
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />

        <Route
          path="/users"
          element={
            isAuthenticated ? (
              <Users onLogout={handleLogout} />
            ) : (
              <Navigate to="/" />
            )
          }
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;