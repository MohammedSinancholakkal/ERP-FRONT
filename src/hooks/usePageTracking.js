import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { logPageVisitApi } from "../services/allAPI";

// Friendly label map: route path → human readable name
const PAGE_LABELS = {
  "/app/dashboard":                         "Dashboard",
  "/app/masters/countries":                 "Countries",
  "/app/masters/cities":                    "Cities",
  "/app/masters/states":                    "States",
  "/app/masters/territories":              "Territories",
  "/app/masters/regions":                   "Regions",
  "/app/masters/tax-types":                 "Tax Types",
  "/app/masters/tax-percentages":           "Tax Percentages",
  "/app/masters/customer-groups":           "Customer Groups",
  "/app/masters/supplier-groups":           "Supplier Groups",
  "/app/masters/banks":                     "Banks",
  "/app/masters/shippers":                  "Shippers",
  "/app/masters/services":                  "Services",
  "/app/masters/currencies":                "Currencies",
  "/app/masters/warehouses":                "Warehouses",
  "/app/masters/locations":                 "Locations",
  "/app/masters/units":                     "Units",
  "/app/masters/expense-types":             "Expense Types",
  "/app/inventory/products":                "Products",
  "/app/inventory/categories":              "Categories",
  "/app/inventory/brands":                  "Brands",
  "/app/inventory/damaged-products":        "Damaged Products",
  "/app/inventory/goods-receipt":           "Goods Receipt",
  "/app/inventory/goods-issue":             "Goods Issue",
  "/app/inventory/update-stock":            "Update Stock",
  "/app/business-partners/customers":       "Customers",
  "/app/business-partners/suppliers":       "Suppliers",
  "/app/cash-bank/expenses":                "Expenses",
  "/app/cash-bank/bank-transactions":       "Bank Transactions",
  "/app/cash-bank/customer-receive":        "Customer Receive",
  "/app/cash-bank/supplier-payment":        "Supplier Payment",
  "/app/cash-bank/cash-adjustment":         "Cash Adjustment",
  "/app/sales":                             "Sales Invoices",
  "/app/sales/quotations":                  "Sales Quotations",
  "/app/purchases":                         "Purchases",
  "/app/purchases/orders":                  "Purchase Orders",
  "/app/services/invoices":                 "Service Invoices",
  "/app/financial/journal-voucher":         "Journal Voucher",
  "/app/financial/contra-voucher":          "Contra Voucher",
  "/app/financial/credit-voucher":          "Credit Voucher",
  "/app/financial/debit-voucher":           "Debit Voucher",
  "/app/financial/opening-balance":         "Opening Balance",
  "/app/financial/accounts":                "Chart of Accounts",
  "/app/hr/employees":                      "Employees",
  "/app/hr/attendance":                     "Attendance",
  "/app/hr/payroll":                        "Payroll",
  "/app/hr/departments":                    "Departments",
  "/app/hr/designations":                   "Designations",
  "/app/meetings":                          "Meetings",
  "/app/admin/users":                       "User Management",
  "/app/admin/roles":                       "Roles",
  "/app/admin/settings":                    "Settings",
  "/app/admin/languages":                   "Languages",
  "/app/admin/translations":                "Translations",
  "/app/reports/audit-logs":                "Audit Logs",
  "/app/reports/sales":                     "Sales Report",
  "/app/reports/purchases":                 "Purchase Report",
  "/app/reports/stock":                     "Stock Report",
  "/app/reports/customer-receivable":       "Customer Receivable",
  "/app/reports/supplier-payable":          "Supplier Payable",
  "/app/reports/cash-in-hand":              "Cash In Hand",
  "/app/reports/cash-at-bank":              "Cash At Bank",
  "/app/reports/tax":                       "Tax Report",
  "/app/reports/daily-closing":             "Daily Closing",
};

const getPageLabel = (path) => {
  // Exact match first
  if (PAGE_LABELS[path]) return PAGE_LABELS[path];
  // Prefix match for dynamic routes (e.g. /app/sales/new/123)
  const match = Object.keys(PAGE_LABELS).find(key => path.startsWith(key));
  return match ? PAGE_LABELS[match] : path;
};

const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      const userRaw = localStorage.getItem("user");
      if (!token || !userRaw) return;

      const user = JSON.parse(userRaw);
      const userId = user?.userId;
      if (!userId) return;

      const label = getPageLabel(location.pathname);

      // Fire-and-forget — never blocks the UI
      logPageVisitApi({ userId, page: location.pathname, label }).catch(() => {});
    } catch {
      // silent fail
    }
  }, [location.pathname]);
};

export default usePageTracking;
