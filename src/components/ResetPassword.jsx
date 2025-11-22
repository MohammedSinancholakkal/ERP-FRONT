import React, { useState } from "react";
import { resetPasswordApi } from "../services/allAPI";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");

  const handleSubmit = async () => {
    if (!pass || !confirm) return toast.error("Fill all fields");
    if (pass !== confirm) return toast.error("Passwords do not match");

    const res = await resetPasswordApi({ token, newPassword: pass });

    if (res?.status === 200) {
      toast.success("Password changed successfully");
      navigate("/");
    } else {
      toast.error("Reset failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
      <div className="bg-gray-800 p-8 rounded-xl w-96 border border-gray-700">
        <h2 className="text-xl font-semibold mb-4">Reset Password</h2>

        <input
          type="password"
          placeholder="New Password"
          className="w-full p-2 bg-gray-900 border border-gray-700 rounded mb-3"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
        />

        <input
          type="password"
          placeholder="Confirm Password"
          className="w-full p-2 bg-gray-900 border border-gray-700 rounded mb-4"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />

        <button
          className="w-full bg-blue-600 py-2 rounded"
          onClick={handleSubmit}
        >
          Change Password
        </button>
      </div>
    </div>
  );
};

export default ResetPassword;
