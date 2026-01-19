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

/**
 * Helper to get button colors based on theme and action
 * @param {string} action 'delete' | 'restore'
 */
const getThemeColors = (action) => {
  const theme = localStorage.getItem('appTheme') || 'purple';
  
  // Theme Colors
  const colors = {
    purple: '#8b5cf6', // violet-500/600 approx
    emerald: '#10b981', // emerald-500
    red: '#ef4444',     // red-500
    gray: '#6b7280'     // gray-500 (default cancel?)
  };

  const themeColor = colors[theme] || colors.purple;

  if (action === 'delete') {
    return {
      confirm: colors.red,
      cancel: themeColor // Cancel is theme color for delete
    };
  } else if (action === 'restore') {
    return {
      confirm: themeColor, // Confirm is theme color for restore
      cancel: colors.red   // Cancel is red for restore
    };
  }

  return { confirm: themeColor, cancel: colors.red };
};

export const showDeleteConfirm = async (
  title = "Are you sure?",
  text = "You won't be able to revert this!"
) => {
  const { confirm, cancel } = getThemeColors('delete');
  return Swal.fire({
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: confirm,
    cancelButtonColor: cancel,
    confirmButtonText: "Yes, delete it!",
    cancelButtonText: "Cancel"
  });
};

export const showRestoreConfirm = async (
  title = "Are you sure?",
  text = "This item will be restored."
) => {
  const { confirm, cancel } = getThemeColors('restore');
  return Swal.fire({
    title,
    text,
    icon: "question", // Different icon for restore?
    showCancelButton: true,
    confirmButtonColor: confirm,
    cancelButtonColor: cancel,
    confirmButtonText: "Yes, restore it!",
    cancelButtonText: "Cancel"
  });
};
