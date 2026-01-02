export const hasPermission = (permissionKey) => {
  const user = JSON.parse(localStorage.getItem("user"));
  const permissions = JSON.parse(localStorage.getItem("permissions") || "[]");

  if (!user) return false;
  
  // SuperAdmin check is now handled via the backend sending ["*"] in permissions list
  if (permissions.includes("*")) {
    return true;
  }

  return permissions.includes(permissionKey);
};

export const hasAnyPermission = (permissionKeys) => {
    const user = JSON.parse(localStorage.getItem("user"));
    const permissions = JSON.parse(localStorage.getItem("permissions") || "[]");
    
    if (permissions.includes("*")) return true;

    return permissionKeys.some(key => permissions.includes(key));
};

// Define priority order for entry point
export const getEntryRoute = () => {
  // If can view dashboard, that's top priority
  if (hasPermission("dashboard_view")) return "/app/dashboard";
  
  // Admin
  if (hasPermission("languages")) return "/app/administration/language";
  if (hasPermission("currencies")) return "/app/administration/currencies";
  if (hasPermission("role_view")) return "/app/administration/roles";
  if (hasPermission("user_view")) return "/app/administration/usermanagement";

  // Masters
  if (hasPermission("countries")) return "/app/masters/countries";
  if (hasPermission("states")) return "/app/masters/states";
  
  // Sales
  if (hasPermission("sales_create")) return "/app/sales/newsale";
  if (hasPermission("sales_view")) return "/app/sales/sales";

  // Purchasing
  if (hasPermission("purchasing_create")) return "/app/purchasing/newpurchase";
  if (hasPermission("purchasing_view")) return "/app/purchasing/purchases";

  // Inventory
  if (hasPermission("product_view")) return "/app/inventory/products";
  
  // Services
  if (hasPermission("services_view")) return "/app/services/invoices";

  // HR
  if (hasPermission("hr_view")) return "/app/hr/employees";

  // Reports
  if (hasPermission("reports_view")) return "/app/reports/dayclosing";

  return "/app/profile"; // Fallback
};
