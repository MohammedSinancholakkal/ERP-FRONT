import React, { useState, useRef, useEffect } from "react";
import { Menu, User, Lock, LogOut, List, X, Save } from "lucide-react";
import toast from "react-hot-toast";
import { changePasswordApi, LogoutApi } from "../services/allAPI";
import { useTheme } from "../context/ThemeContext";
import { useSettings } from "../contexts/SettingsContext"; // Added
import { serverURL } from "../services/serverURL"; // Added

const Topbar = ({ sidebarOpen, setSidebarOpen }) => {
  const { theme, setTheme } = useTheme();
  const { settings } = useSettings(); // Added
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Logo Logic
  const companyName = settings?.companyName?.trim() || "Homebutton";
  const baseUrl = serverURL.replace("/api", "");
  const logoUrl = settings?.logoPath ? `${baseUrl}/${settings.logoPath}` : null;

  const [passwordModal, setPasswordModal] = useState(false);

  const [passwordFields, setPasswordFields] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const menuRef = useRef();

  const user = JSON.parse(localStorage.getItem("user"));

  // Close dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ... (Login/Logout logic handled below, skipping to render)

  // ==========================
  // LOGOUT
  // ==========================
  const handleLogout = async () => {
    try {
        const refreshToken = localStorage.getItem("refreshToken");
        await LogoutApi({ refreshToken }); 
    } catch(err) {
        console.error("Logout API failed", err);
    }
    localStorage.clear();
    toast.success("Logged out");
    window.location.href = "/"; // redirect to login
  };

  // ==========================
  // CHANGE PASSWORD SUBMIT
  // ==========================
  const handleChangePassword = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordFields;

    if (!currentPassword || !newPassword || !confirmPassword)
      return toast.error("All fields required");

    if (newPassword.length < 6)
      return toast.error("New password must be at least 6 characters");

    if (newPassword === currentPassword)
      return toast.error("New password cannot be the same as old password");

    if (newPassword !== confirmPassword)
      return toast.error("Passwords do not match");

    try {
      const res = await changePasswordApi({
        userId: user?.userId,
        currentPassword,
        newPassword,
      });

      if (res?.status === 200) {
        toast.success("Password changed successfully");
        setPasswordModal(false);
        setPasswordFields({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else toast.error("Failed to change password");
    } catch (err) {
      toast.error(err.response?.data?.message || "Server error");
    }
  };

  return (
    <>
      {/* ================= TOPBAR ================= */}
      <div
        className={`
          relative flex justify-between items-center px-6 py-5 shadow 
          sticky top-0 z-30 
          ${theme === 'emerald' ? 'bg-gradient-to-b from-emerald-900 to-emerald-800' : theme === 'purple' ? 'bg-[#6448AE]' : 'bg-gradient-to-b from-gray-900 to-gray-900'} text-white
          border-b border-white/20
        `}
      >
        {/* Sidebar Toggle */}
        <button
          className="text-white z-10"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Menu size={20} />
        </button>

        {/* CENTER LOGO (MOBILE ONLY - When Sidebar is Closed) */}
        {!sidebarOpen && (
           <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 md:hidden">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
              ) : (
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold">HB</span>
                </div>
              )}
              <span className="font-bold text-lg whitespace-nowrap">{companyName}</span>
           </div>
        )}

        {/* RIGHT PROFILE SECTION */}
        <div className="flex items-center gap-4" ref={menuRef}>
          {/* Profile Dropdown Trigger */}
          <div
            className="flex items-center gap-2 cursor-pointer text-white"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${theme === 'emerald' ? 'bg-emerald-700' : theme === 'purple' ? 'bg-white' : 'bg-gray-700'}`}>
              <User size={18} className={theme === 'purple' ? 'text-[#6448AE]' : 'text-white'} />
            </div>
            
            <span className="font-medium capitalize text-sm hidden md:block">
              {user?.displayName || "User"}
            </span>
          </div>

          {/* Settings Button */}
          <button
            onClick={() => setSettingsOpen(true)}
            className="text-gray-300 hover:text-white"
          >
            <List size={20} />
          </button>

          {/* Dropdown Menu */}
          {menuOpen && (
            <div
              className={`
                absolute right-0 top-14 
                w-44 
                ${theme === 'emerald' ? 'bg-gradient-to-b from-emerald-900 to-emerald-800 border-emerald-700 text-white' : theme === 'purple' ? 'bg-gray-50 border-purple-300 text-purple-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 border-gray-600 text-white'}
                shadow-lg rounded-lg py-2 
                border 
              `}
            >
              <div className={`px-3 py-3 border-b ${theme === 'emerald' ? 'border-emerald-700' : theme === 'purple' ? 'border-purple-200' : 'border-gray-600'}`}>
                <p className={`font-semibold text-sm ${theme === 'purple' ? 'text-purple-900' : 'text-white'}`}>
                  {user?.displayName}
                </p>
                <p className={`text-[11px] ${theme === 'purple' ? 'text-purple-700' : 'text-gray-300'}`}>Manage your account</p>
              </div>

              {/* <button className="flex items-center gap-2 px-3 py-1.5 w-full hover:bg-gray-800 text-gray-200 text-sm">
                <User size={16} /> My Profile
              </button> */}

              <button
                onClick={() => setPasswordModal(true)}
                className={`flex items-center gap-2 px-3 py-1.5 w-full text-sm ${theme === 'emerald' ? 'hover:bg-emerald-700 text-gray-100' : theme === 'purple' ? 'hover:bg-purple-100 text-purple-800' : 'hover:bg-gray-800 text-gray-200 hover:text-white'}`}
              >
                <Lock size={16} /> Change Password
              </button>

              <button
                onClick={handleLogout}
                className={`flex items-center gap-2 px-3 py-1.5 w-full text-sm ${theme === 'emerald' ? 'hover:bg-emerald-700 text-red-100' : theme === 'purple' ? 'hover:bg-purple-100 text-red-600' : 'hover:bg-gray-800 text-red-400 hover:text-red-300'}`}
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {passwordModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className={`w-[400px] bg-gradient-to-b ${theme === 'emerald' ? 'from-emerald-900 to-emerald-800 border-emerald-700' : theme === 'purple' ? 'bg-gray-50 border-purple-300 text-purple-900' : 'from-gray-900 to-gray-800 border-gray-700 text-white'} rounded-lg border shadow-xl`}>
            <div className={`flex justify-between items-center px-5 py-3 border-b ${theme === 'emerald' ? 'border-emerald-700' : theme === 'purple' ? 'border-purple-200' : 'border-gray-700'}`}>
              <h2 className={`text-lg font-semibold ${theme === 'purple' ? 'text-purple-900' : 'text-white'}`}>Change Password</h2>

              <button
                onClick={() => setPasswordModal(false)}
                className={theme === 'purple' ? 'text-purple-500 hover:text-purple-700' : 'text-gray-300 hover:text-white'}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Current Password */}
              <div>
                <label className={`block text-sm mb-1 ${theme === 'purple' ? 'text-purple-900' : 'text-gray-300'}`}>Current Password</label>
                <input
                  type="password"
                  value={passwordFields.currentPassword}
                  onChange={(e) =>
                    setPasswordFields((p) => ({
                      ...p,
                      currentPassword: e.target.value,
                    }))
                  }
                  className={`w-full border rounded px-3 py-2 text-sm outline-none ${theme === 'purple' ? 'bg-white border-purple-300 text-purple-900 focus:border-purple-500' : 'bg-gray-900 border-gray-700 text-white focus:border-white'}`}
                />
              </div>

              {/* New Password */}
              <div>
                <label className={`block text-sm mb-1 ${theme === 'purple' ? 'text-purple-900' : 'text-gray-300'}`}>New Password</label>
                <input
                  type="password"
                  value={passwordFields.newPassword}
                  onChange={(e) =>
                    setPasswordFields((p) => ({
                      ...p,
                      newPassword: e.target.value,
                    }))
                  }
                  className={`w-full border rounded px-3 py-2 text-sm outline-none ${theme === 'purple' ? 'bg-white border-purple-300 text-purple-900 focus:border-purple-500' : 'bg-gray-900 border-gray-700 text-white focus:border-white'}`}
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className={`block text-sm mb-1 ${theme === 'purple' ? 'text-purple-900' : 'text-gray-300'}`}>Confirm Password</label>
                <input
                  type="password"
                  value={passwordFields.confirmPassword}
                  onChange={(e) =>
                    setPasswordFields((p) => ({
                      ...p,
                      confirmPassword: e.target.value,
                    }))
                  }
                  className={`w-full border rounded px-3 py-2 text-sm outline-none ${theme === 'purple' ? 'bg-white border-purple-300 text-purple-900 focus:border-purple-500' : 'bg-gray-900 border-gray-700 text-white focus:border-white'}`}
                />
              </div>
            </div>

            <div className={`px-5 py-3 border-t flex justify-end ${theme === 'emerald' ? 'border-emerald-700' : theme === 'purple' ? 'border-purple-200' : 'border-gray-700'}`}>
              <button
                onClick={handleChangePassword}
                className={`flex items-center gap-2 px-4 py-2 rounded text-sm ${theme === 'emerald' ? 'bg-emerald-700 hover:bg-emerald-600 border-emerald-500' : theme === 'purple' ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-500' : 'bg-gray-800 border-gray-600'}`}
              >
                <Save size={16} /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================== SETTINGS PANEL =================== */}
      {settingsOpen && (
        <div className="fixed inset-0 z-40 flex">
          {/* BACKDROP */}
          <div
            className="flex-1 bg-black/40 backdrop-blur-sm"
            onClick={() => setSettingsOpen(false)}
          ></div>

          {/* SLIDE PANEL */}
          <div
            className={`
              w-80 h-full 
              ${theme === 'emerald' ? 'bg-gradient-to-b from-emerald-900 to-emerald-800 border-emerald-700' : theme === 'purple' ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 border-gray-700 text-white'}
              border-l
              shadow-2xl p-5 
              animate-slideLeft
            `}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-5">
              <h2 className={`text-lg font-semibold ${theme === 'purple' ? 'text-gray-900' : 'text-white'}`}>Settings</h2>

              <button
                onClick={() => setSettingsOpen(false)}
                className={theme === 'purple' ? 'text-gray-500 hover:text-gray-900' : 'text-gray-300 hover:text-white'}
              >
                <X size={22} />
              </button>
            </div>

            {/* Language */}
            <div className="mb-6">
              <label className={`block text-sm mb-2 ${theme === 'purple' ? 'text-gray-700' : 'text-gray-300'}`}>
                Language
              </label>

              <select
                className={`
                  w-full border rounded px-3 py-2 text-sm outline-none
                  ${theme === 'emerald' ? 'bg-emerald-800 border-emerald-600 focus:border-white text-white' : theme === 'purple' ? 'bg-white border-purple-300 text-purple-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500' : 'bg-gray-900 border-gray-700 focus:border-white text-white'}
                `}
              >
                <option className={theme === 'purple' ? 'bg-white text-gray-900' : 'bg-gray-900'}>English</option>
                <option className={theme === 'purple' ? 'bg-white text-gray-900' : 'bg-gray-900'}>Hindi</option>
                <option className={theme === 'purple' ? 'bg-white text-gray-900' : 'bg-gray-900'}>Tamil</option>
              </select>
            </div>

            {/* Theme */}
            <div>
              <label className={`block text-sm mb-2 ${theme === 'purple' ? 'text-gray-700' : 'text-gray-300'}`}>Theme</label>

              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className={`
                  w-full border rounded px-3 py-2 text-sm outline-none
                  ${theme === 'emerald' ? 'bg-emerald-800 border-emerald-600 focus:border-white text-white' : theme === 'purple' ? 'bg-white border-purple-300 text-purple-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500' : 'bg-gray-900 border-gray-700 focus:border-white text-white'}
                `}
              >
                <option value="dark" className={theme === 'purple' ? 'bg-white text-gray-900' : 'bg-gray-900'}>Dark Theme</option>
                <option value="light" className={theme === 'purple' ? 'bg-white text-gray-900' : 'bg-gray-900'}>Light Theme</option>
                <option value="emerald" className={theme === 'purple' ? 'bg-white text-gray-900' : 'bg-gray-900'}>Emerald Green</option>
                <option value="purple" className={theme === 'purple' ? 'bg-white text-gray-900' : 'bg-gray-900'}>Purple Theme</option>
                <option value="blue" className={theme === 'purple' ? 'bg-white text-gray-900' : 'bg-gray-900'}>Blue Theme</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Slide Animation */}
      <style>{`
        @keyframes slideLeft {
          from { transform: translateX(100%); }
          to { transform: translateX(0%); }
        }
        .animate-slideLeft {
          animation: slideLeft 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default Topbar;
