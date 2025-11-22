import React, { useState } from "react";
import { LoginApi, requestResetApi } from "../services/allAPI";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);

  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // LOGIN SUBMIT

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.username || !form.password)
      return toast.error("Please fill all fields");

    setLoading(true);

    try {
      const response = await LoginApi(form);

      if (response?.status === 200) {
        toast.success("Login Successful!");

        localStorage.setItem("token", response.data.token);
        localStorage.setItem("role", response.data.role);
        localStorage.setItem("user", JSON.stringify(response.data.user));

        navigate("/app/dashboard");
      } else {
        toast.error(response?.response?.data?.message || "Invalid credentials");
      }
    } catch (error) {
      console.log("Login error:", error);
      toast.error("Server error");
    }

    setLoading(false);
  };


  // SEND PASSWORD RESET LINK
  
  const handleForgot = async () => {
    if (!resetEmail.trim()) return toast.error("Enter your email");

    try {
      const res = await requestResetApi({ email: resetEmail });

      if (res?.status === 200) {
        toast.success("Reset link sent to your email");
        setForgotOpen(false);
        setResetEmail("");
      } else {
        toast.error(res?.response?.data?.message || "Failed");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Server error");
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center flex items-center justify-center relative"
      style={{
        backgroundImage:
          "url('https://www.freevector.com/uploads/vector/preview/30358/Colorful-Geometric-Background.jpg')",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

      {/* Login Card */}
      <div className="relative bg-white/10 backdrop-blur-xl p-10 rounded-2xl shadow-2xl w-full max-w-md text-white border border-white/20">
        <div className="text-center mb-7">
          <h1 className="text-3xl font-extrabold tracking-wide drop-shadow-lg">
            Homebutton-ERP
          </h1>
          <p className="text-gray-200 text-sm mt-1">
            Secure Login to your ERP Account
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username */}
          <input
            type="text"
            name="username"
            placeholder="Enter your username"
            value={form.username}
            onChange={handleChange}
            className="w-full bg-white/10 border border-white/30 text-white placeholder-gray-300 
            px-3 py-3 rounded-lg focus:border-white focus:outline-none transition"
          />

          {/* Password */}
          <input
            type="password"
            name="password"
            placeholder="Enter your password"
            value={form.password}
            onChange={handleChange}
            className="w-full bg-white/10 border border-white/30 text-white placeholder-gray-300 
            px-3 py-3 rounded-lg focus:border-white focus:outline-none transition"
          />

          {/* Buttons */}
          <div className="flex justify-between items-center pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-2.5 rounded-md border border-white text-white font-semibold 
              hover:bg-white/20 transition-all duration-200 backdrop-blur-sm disabled:opacity-50"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>

            <button
              type="button"
              className="text-sm text-gray-200 hover:text-white hover:underline transition"
              onClick={() => setForgotOpen(true)}
            >
              Forgot password?
            </button>
          </div>
        </form>
      </div>

      {/* =========================== */}
      {/*   FORGOT PASSWORD MODAL     */}
      {/* =========================== */}
      {forgotOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[400px] bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-lg border border-gray-700 shadow-xl">
            <div className="flex justify-between items-center px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">Reset Password</h2>

              <button
                onClick={() => setForgotOpen(false)}
                className="text-gray-300 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <label className="block text-sm mb-1">Email Address</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
              />
            </div>

            <div className="px-5 py-3 border-t border-gray-700 flex justify-end">
              <button
                onClick={handleForgot}
                className="px-4 py-2 bg-gray-800 border border-gray-600 rounded text-sm"
              >
                Send Reset Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
