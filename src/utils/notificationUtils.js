import toast from "react-hot-toast";
import Swal from "sweetalert2";

/* =============================================================
   TOAST NOTIFICATIONS (react-hot-toast)
   ============================================================= */

export const showSuccessToast = (message) => {
  toast.success(message);
};

export const showErrorToast = (message) => {
  toast.error(message);
};

export const showLoadingToast = (message) => {
  return toast.loading(message);
};

export const dismissToast = (toastId) => {
  toast.dismiss(toastId);
};


/* =============================================================
   SWEET ALERT DIALOGS (sweetalert2)
   ============================================================= */

/**
 * Show a confirmation dialog (e.g. for Delete or Restore)
 */
export const showConfirmDialog = async ({
  title = "Are you sure?",
  text = "You won't be able to revert this!",
  icon = "warning",
  confirmButtonText = "Yes, proceed",
  cancelButtonText = "Cancel",
  confirmButtonColor = "#10b981", // Emerald-500 equivalent usually
  cancelButtonColor = "#ef4444",  // Red-500
}) => {
  return Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonColor,
    cancelButtonColor,
    confirmButtonText,
    cancelButtonText,
  });
};

/**
 * Show a success alert (Ok button only)
 */
export const showSuccessAlert = (title, text) => {
  return Swal.fire({
    icon: "success",
    title: title || "Success",
    text: text || "",
    confirmButtonColor: "#10b981",
    timer: 1500,
    showConfirmButton: false
  });
};

/**
 * Show an error alert (Ok button only)
 */
export const showErrorAlert = (title, text) => {
  return Swal.fire({
    icon: "error",
    title: title || "Error",
    text: text || "Something went wrong.",
    confirmButtonColor: "#ef4444",
  });
};
