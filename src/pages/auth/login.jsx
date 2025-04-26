import React, { memo } from "react";
import "./login.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export const Login = memo(() => {
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const value = Object.fromEntries(new FormData(e.target));

    try {
      const res = await axios.post(
        // "http://localhost:8080/api/login",
        "https://imed-store-server.vercel.app/api/login",
        value
      );
      const { token, success, role } = res.data;

      localStorage.setItem("access_token", token);
      localStorage.setItem("acsess", JSON.stringify(success));
      localStorage.setItem("role", role);

      window.location.reload();
      navigate(role === "admin" ? "/admin" : "/");
    } catch (error) {
      console.error("API xatosi:", error.response?.data || error.message);
    }
  };

  return (
    <div className="login">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1 className="login-title">Assalomu aleykum</h1>
        <label className="input-wrapper">
          <input
            type="text"
            placeholder="Login"
            autoComplete="off"
            name="login"
            required
          />
        </label>
        <label className="input-wrapper">
          <input
            type="password"
            placeholder="Password"
            name="password"
            required
          />
        </label>
        <button type="submit" className="login-button">
          Sign In
        </button>
      </form>
    </div>
  );
});