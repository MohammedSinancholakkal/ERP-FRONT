import React, { useState, useRef, useEffect } from "react";
import { Menu, User, Lock, LogOut, List, X, Save } from "lucide-react";
import toast from "react-hot-toast";
import { changePasswordApi } from "../services/allAPI";

const Topbar = ({ sidebarOpen, setSidebarOpen }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

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

  // ==========================
  // LOGOUT
  // ==========================
  const handleLogout = () => {
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
        className="
          relative flex justify-between items-center px-6 py-5 shadow 
          sticky top-0 z-30 
          bg-gradient-to-b from-gray-900 to-gray-900 text-white
          border-b border-white/20
        "
      >
        {/* Sidebar Toggle */}
        <button
          className="text-white"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Menu size={20} />
        </button>

        {/* RIGHT PROFILE SECTION */}
        <div className="flex items-center gap-4" ref={menuRef}>
          {/* Profile Dropdown Trigger */}
          <div
            className="flex items-center gap-2 cursor-pointer text-white"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
              <User size={18} className="text-white" />
            </div>
            <span className="font-medium capitalize text-sm">
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
              className="
                absolute right-0 top-14 
                w-44 
                bg-gradient-to-b from-gray-900 to-gray-700
                shadow-lg rounded-lg py-2 
                border border-gray-600
                text-white
              "
            >
              <div className="px-3 py-3 border-b border-gray-600">
                <p className="font-semibold text-white text-sm">
                  {user?.displayName}
                </p>
                <p className="text-[11px] text-gray-300">Manage your account</p>
              </div>

              {/* <button className="flex items-center gap-2 px-3 py-1.5 w-full hover:bg-gray-800 text-gray-200 text-sm">
                <User size={16} /> My Profile
              </button> */}

              <button
                onClick={() => setPasswordModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 w-full hover:bg-gray-800 text-gray-200 text-sm"
              >
                <Lock size={16} /> Change Password
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-1.5 w-full hover:bg-gray-800 text-red-400 text-sm"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* =================== CHANGE PASSWORD MODAL =================== */}
      {passwordModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="w-[400px] bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-lg border border-gray-700 shadow-xl">
            <div className="flex justify-between items-center px-5 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold">Change Password</h2>

              <button
                onClick={() => setPasswordModal(false)}
                className="text-gray-300 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-sm mb-1">Current Password</label>
                <input
                  type="password"
                  value={passwordFields.currentPassword}
                  onChange={(e) =>
                    setPasswordFields((p) => ({
                      ...p,
                      currentPassword: e.target.value,
                    }))
                  }
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
                />
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm mb-1">New Password</label>
                <input
                  type="password"
                  value={passwordFields.newPassword}
                  onChange={(e) =>
                    setPasswordFields((p) => ({
                      ...p,
                      newPassword: e.target.value,
                    }))
                  }
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={passwordFields.confirmPassword}
                  onChange={(e) =>
                    setPasswordFields((p) => ({
                      ...p,
                      confirmPassword: e.target.value,
                    }))
                  }
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="px-5 py-3 border-t border-gray-700 flex justify-end">
              <button
                onClick={handleChangePassword}
                className="flex items-center gap-2 bg-gray-800 border border-gray-600 px-4 py-2 rounded text-sm"
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
            className="
              w-80 h-full 
              bg-gradient-to-b from-gray-900 to-gray-700 
              border-l border-gray-700 
              shadow-2xl p-5 
              animate-slideLeft
            "
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold text-white">Settings</h2>

              <button
                onClick={() => setSettingsOpen(false)}
                className="text-gray-300 hover:text-white"
              >
                <X size={22} />
              </button>
            </div>

            {/* Language */}
            <div className="mb-6">
              <label className="block text-gray-300 text-sm mb-2">
                Language
              </label>

              <select
                className="
                  w-full bg-gray-900 border border-gray-700 
                  rounded px-3 py-2 text-sm text-white 
                  focus:border-white outline-none
                "
              >
                <option>English</option>
                <option>Hindi</option>
                <option>Tamil</option>
              </select>
            </div>

            {/* Theme */}
            <div>
              <label className="block text-gray-300 text-sm mb-2">Theme</label>

              <select
                className="
                  w-full bg-gray-900 border border-gray-700 
                  rounded px-3 py-2 text-sm text-white 
                  focus:border-white outline-none
                "
              >
                <option>Dark Theme</option>
                <option>Light Theme</option>
                <option>Blue Theme</option>
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
