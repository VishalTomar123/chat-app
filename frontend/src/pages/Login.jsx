import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaPhoneAlt, FaLock, FaComments } from "react-icons/fa";
import API from "../services/api";
import toast from "react-hot-toast";
import { useUser } from "../context/UserContext";
import { io } from "socket.io-client";

function Login() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const { fetchUser } = useUser();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {

    e.preventDefault();

    const phoneRegex = /^[6-9]\d{9}$/;

    if (!phoneRegex.test(phone)) {
        return toast.error(
            "Please enter a valid 10-digit Indian mobile number."
        );
    }
    if (password.length < 6) {
        return toast.error(
            "Password must be at least 6 characters."
        );
    }
    const passwordRegex =
        /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;

    if (!passwordRegex.test(password)) {
        return toast.error(
            "Password must contain at least one letter and one number."
        );
    }

    const loading = toast.loading("Login account...");
    try {
      const res = await API.post("/auth/login", {
        phone,
        password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem(
        "userId",
        res.data.user.id
      );
      
      await fetchUser();
      toast.dismiss(loading);
      const socket = io("http://localhost:5000", {
          auth: {
              token: localStorage.getItem("token")
          }
      });

      setPassword("");
      setPhone("");
      
      navigate("/chat");
    } catch (err) {
      toast.dismiss(loading);
      toast.error(err.response?.data?.message || "Login Failed");
    }
  };

  return (
    <div className="auth-container">
      <div className="left-panel">
        <div>
          <FaComments className="logo-icon" />
          <h1>ChatSphere</h1>
          <p>
            Welcome back. Continue your conversations instantly.
          </p>
        </div>
      </div>

      <div className="right-panel">
        <form className="auth-card" onSubmit={handleSubmit}>
          <h2>Welcome Back</h2>
          <p>Login to continue 💬</p>

          <div className="input-group">
            <FaPhoneAlt />
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="Mobile Number"
              value={phone}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
            
                if (value.length <= 10) {
                    setPhone(value);
                }
            }}
            />
          </div>

          <div className="input-group">
            <FaLock />
            <input
              type="password"
              placeholder="Password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button className="auth-btn">
            Login
          </button>

          <div className="auth-footer">
            Don't have an account?
            <Link to="/register"> Register</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;