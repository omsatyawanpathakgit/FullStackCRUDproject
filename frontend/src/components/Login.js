import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "../App.css";


function Login({ onLogin }) {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async (e) => {

    e.preventDefault();

    try {

      const response = await api.post("/users/login", {
        email,
        password
      });

      localStorage.setItem(
        "token",
        response.data.token
      );

      onLogin();

      navigate("/users");

    } catch (error) {

      setMessage(
        error.response?.data?.message ||
        "Login failed"
      );

    }
  };

  return (

    <div className="login-page">

      <div className="login-card">

        <h1>MERN User CRUD (built by Jinal and Om)</h1>

        <p className="login-subtitle">
          Sign in to manage your users
        </p>

        <form onSubmit={handleLogin}>

          <div className="form-group">

            <label>Email</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

          </div>

          <div className="form-group">

            <label>Password</label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

          </div>

          <button
            type="submit"
            className="login-button"
          >
            Login
          </button>

        </form>

        {message && (
          <div className="message">
            {message}
          </div>
        )}

      </div>

    </div>

  );
}

export default Login;