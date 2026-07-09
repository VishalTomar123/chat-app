import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUser, FaPhoneAlt, FaLock, FaComments } from "react-icons/fa";
import API from "../services/api";
import toast from "react-hot-toast";

function Register() {
  const [username, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username.trim()) {
        return toast.error("Username is required.");
    }

    if (username.trim().length < 3) {
        return toast.error("Username must be at least 3 characters.");
    }

    if (username.trim().length > 20) {
        return toast.error("Username cannot exceed 20 characters.");
    }
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
    const fakeNumbers = [
      "0000000000",
      "1111111111",
      "2222222222",
      "3333333333",
      "4444444444",
      "5555555555",
      "6666666666",
      "7777777777",
      "8888888888",
      "9999999999",
      "1234567890",
      "9876543210"
    ];
    
    if (fakeNumbers.includes(phone)) {
        return toast.error("Please enter a valid mobile number.");
    }
    if (/^(\d)\1{9}$/.test(phone)) {
      return toast.error("Please enter a valid mobile number.");
  }
    const loading = toast.loading("Creating account...");
    try {
      const res = await API.post("/auth/register", {
        username,
        phone,
        password,
      });
      toast.dismiss(loading);
      toast.success(res.data.message);
      navigate("/");
    } catch (err) {
      toast.dismiss(loading);
      toast.error(err.response?.data?.message || "Registration Failed");
    }
  };

  return (
    <div className="auth-container">
      <div className="left-panel">
        <div>
          <FaComments className="logo-icon" />
          <h1>ChatSphere</h1>
          <p>
            Connect, Chat and Collaborate with your friends in real-time.
          </p>
        </div>
      </div>

      <div className="right-panel">
        <form className="auth-card" onSubmit={handleSubmit}>
          <h2>Create Account</h2>
          <p>Start chatting in seconds 🚀</p>

          <div className="input-group">
            <FaUser />
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="input-group">
            <FaPhoneAlt />
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="Mobile Number"
              autoComplete="new-password"
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button className="auth-btn">
            Create Account
          </button>

          <div className="auth-footer">
            Already have an account?
            <Link to="/"> Login</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;