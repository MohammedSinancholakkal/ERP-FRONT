import React, { useState } from "react";
import { LoginApi, requestResetApi } from "../services/allAPI";
import { getEntryRoute } from "../utils/permissionUtils";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { User, Lock, Eye, EyeOff } from "lucide-react";
import logo from "../assets/homebutton_logo.png";

const Login = () => {
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);

  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
        localStorage.setItem("permissions", JSON.stringify(response.data.permissions || []));
        localStorage.setItem("user", JSON.stringify(response.data.user));
        localStorage.setItem("refreshToken", response.data.refreshToken);
        
        // Set default theme to purple
        localStorage.setItem("appTheme", "purple");

        navigate(getEntryRoute());
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
    <div className="flex h-screen w-full overflow-hidden bg-white">
      {/* LEFT SIDE - BRANDING */}
      <div 
        className="hidden lg:flex flex-col justify-center lg:w-[50%] xl:w-[55%] text-white p-12 xl:p-20 relative z-10"
        style={{
           backgroundColor: "#6448AE",
           clipPath: "ellipse(80% 100% at 0% 50%)" 
        }}
      >
        <div className="max-w-2xl">
            <h1 className="text-3xl lg:text-5xl xl:text-5xl font-extrabold mb-6 tracking-tight drop-shadow-sm">HomeButton ERP</h1>
            <p className="text-lg lg:text-xl font-medium mb-6 text-purple-200 tracking-wide">
              Comprehensive Enterprise Resource Planning
            </p>
            <p className="text-sm lg:text-lg text-purple-100 opacity-90 leading-snug font-light max-w-md">
              Streamline operations, manage inventory, track financials, and optimize business performance.
            </p>
        </div>
        
        {/* LOGO TOP LEFT */}
        <div className="absolute top-8 left-8">
            <img src={logo} alt="Homebutton Logo" className="h-12 lg:h-16 w-auto" />
        </div>
      </div>

      {/* RIGHT SIDE - LOGIN FORM */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16 relative">
      
        <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-2xl shadow-[0_20px_60px_-15px_rgba(100,72,174,0.3)] border border-purple-100">
            <div className="text-center lg:text-left">
                <h2 className="text-3xl font-bold text-[#6448AE] mb-2">Welcome Back</h2>
                <p className="text-gray-500">Login to your ERP Dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Username */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <User size={18} />
                    </div>
                    <input
                        type="text"
                        name="username"
                        placeholder="Email address"
                        value={form.username}
                        onChange={handleChange}
                        className="w-full bg-gray-50 border border-gray-100 text-gray-900 text-sm rounded-lg focus:ring-[#6448AE] focus:border-[#6448AE] block pl-10 p-3 outline-none transition-colors"
                        required
                    />
                </div>

                {/* Password */}
                <div className="relative">
                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Lock size={18} />
                    </div>
                    <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Password"
                        value={form.password}
                        onChange={handleChange}
                        className="w-full bg-gray-50 border border-gray-100 text-gray-900 text-sm rounded-lg focus:ring-[#6448AE] focus:border-[#6448AE] block pl-10 pr-10 p-3 outline-none transition-colors"
                        required
                    />
                     <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full text-white bg-[#6448AE] hover:bg-[#7e65a3] focus:ring-4 focus:ring-purple-300 font-medium rounded-full text-sm px-5 py-3 text-center transition-all duration-200 disabled:opacity-50 tracking-wider shadow-lg shadow-purple-200"
                >
                    {loading ? "LOGGING IN..." : "LOG IN"}
                </button>

                {/* Footer Links */}
                <div className="flex items-center justify-center text-sm">
                    <button 
                        type="button"
                        onClick={() => setForgotOpen(true)}
                        className="font-medium text-[#6448AE] hover:underline"
                    >
                        Forgot password?
                    </button>
                </div>

            </form>
        </div>
      </div>

      {/* FORGOT PASSWORD MODAL */}
      {forgotOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-800">Reset Password</h2>
              <button
                onClick={() => setForgotOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
                <p className="text-sm text-gray-500 mb-2">Enter your email address and we'll send you a link to reset your password.</p>
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-[#6448AE] focus:border-[#6448AE] block p-2.5 outline-none"
                  />
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={handleForgot}
                className="px-5 py-2.5 bg-[#6448AE] hover:bg-[#7e65a3] text-white font-medium rounded-lg text-sm transition-colors shadow-sm"
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
