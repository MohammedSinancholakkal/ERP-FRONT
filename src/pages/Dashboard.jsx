import React, { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import { hasPermission } from "../utils/permissionUtils";
import { PERMISSIONS } from "../constants/permissions";
import { getDashboardStatsApi } from "../services/allAPI";
import {
  YearlySalesChart,
  ExpenseChart,
  MonthlySalesChart,
  BestProductChart,
} from "../components/charts";
import DashboardCard from "../components/DashboardCard";

/* =========================
   SUB SECTIONS
========================= */


/* =========================
   SUB SECTIONS
========================= */

const LatestOrders = ({ orders = [] }) => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'purple' || theme === 'emerald';

  return (
    <DashboardCard title="Latest Orders" color="bg-cyan-400">
      <div className="max-h-64 overflow-auto">
      <table className={`w-full text-sm ${isLight ? 'text-gray-700' : 'text-gray-200'}`}>
        <thead>
          <tr className={`border-b text-left ${isLight ? 'border-gray-200' : 'border-gray-500'}`}>
            <th className={`pb-2 sticky top-0 z-10 ${isLight ? 'bg-gray-50 text-gray-900' : 'bg-cyan-400 text-black'}`}>Order ID</th>
            <th className={`pb-2 sticky top-0 z-10 ${isLight ? 'bg-gray-50 text-gray-900' : 'bg-cyan-400 text-black'}`}>Item</th>
            <th className={`pb-2 sticky top-0 z-10 ${isLight ? 'bg-gray-50 text-gray-900' : 'bg-cyan-400 text-black'}`}>Quantity</th>
            <th className={`pb-2 sticky top-0 z-10 ${isLight ? 'bg-gray-50 text-gray-900' : 'bg-cyan-400 text-black'}`}>Total</th>
          </tr>
        </thead>
        <tbody>
          {orders.length > 0 ? (
            orders.map((order, i) => (
              <tr key={i} className={`border-b ${isLight ? 'border-gray-100 hover:bg-gray-50' : 'border-gray-700'}`}>
                <td className={`py-2 ${isLight ? 'text-orange-600 font-medium' : 'text-orange-400'}`}>{order.Id}</td>
                <td className={isLight ? 'text-gray-900' : ''}>{order.ItemName || "N/A"}</td>
                <td className={isLight ? 'text-gray-900' : ''}>{order.Quantity || 0}</td>
                <td className={isLight ? 'text-gray-900' : ''}>{order.GrandTotal ? order.GrandTotal.toFixed(2) : "0.00"}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className={`py-4 text-center ${isLight ? 'text-gray-400' : 'text-gray-300'}`}>
                No recent orders
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>

      <div className="flex justify-between items-center mt-4">
        <button 
          onClick={() => navigate("/app/sales/newsale")} // Assuming newsale route
          className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded text-sm shadow-sm"
        >
          Place New Order
        </button>
        <button 
          onClick={() => navigate("/app/sales/sales")}
          className={`border px-4 py-2 rounded text-sm transition-colors ${isLight ? 'border-gray-300 text-gray-600 hover:bg-gray-50' : 'border-gray-400 text-gray-200 hover:bg-gray-700'}`}
        >
          View All Orders
        </button>
      </div>
    </DashboardCard>
  );
};

const RecentlyAddedProducts = ({ products = [] }) => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'purple' || theme === 'emerald';

  return (
    <DashboardCard title="Recently Added Products" color="bg-purple-400">
      <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
        {products.length > 0 ? (
          products.map((p, i) => (
            <div
              key={i}
              className={`flex items-center justify-between border-b pb-3 ${isLight ? 'border-gray-100' : 'border-gray-600'}`}
            >
              <div className="flex gap-3 items-center">
                <div className={`w-12 h-12 flex items-center justify-center text-xs rounded overflow-hidden ${isLight ? 'bg-gray-100 text-gray-500' : 'bg-gray-300 text-gray-700'}`}>
                  {/* Placeholder or Image if available */}
                  IMG
                </div>
                <div>
                  <p className={`font-semibold ${isLight ? 'text-gray-800' : 'text-yellow-400'}`}>{p.ProductName}</p>
                  <p className={`text-xs truncate w-40 ${isLight ? 'text-gray-500' : 'text-gray-300'}`}>
                    {p.ProductDetails || "No description"}
                  </p>
                </div>
              </div>
              <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded">
                Qty: {p.UnitsInStock !== null && p.UnitsInStock !== undefined ? p.UnitsInStock : 0}
              </span>
            </div>
          ))
        ) : (
          <div className={`text-center py-4 ${isLight ? 'text-gray-400' : 'text-gray-300'}`}>
            No recently added products
          </div>
        )}
      </div>

      <button 
        onClick={() => navigate("/app/inventory/products")}
        className={`w-full text-center mt-4 text-sm cursor-pointer ${isLight ? 'text-purple-600 hover:text-purple-700' : 'text-yellow-400 hover:text-yellow-300'}`}
      >
        View All Products
      </button>
    </DashboardCard>
  );
};

/* =========================
   MAIN DASHBOARD
========================= */


import { useDashboard } from "../context/DashboardContext";

/* =========================
   MAIN DASHBOARD
========================= */


const Dashboard = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const currentMonthName = new Date().toLocaleString('default', { month: 'long' });

  const { dashboardData, loading, fetchDashboardData } = useDashboard();
  const isLight = theme === 'purple' || theme === 'emerald';
  
  // Default stats structure to avoid crash while loading context
  const stats = dashboardData || {
    todaysSale: 0,
    totalSuppliers: 0,
    totalCustomers: 0,
    totalProducts: 0,
    yearlyData: [],
    expenseData: [],
    dailyData: [],
    productData: [],
    latestOrders: [],
    recentProducts: []
  };

  useEffect(() => {
      fetchDashboardData();
  }, []);

  if (loading && !dashboardData) {
      // Optional: Add a loading spinner here if desired, or just show stale data
      // For now we just let it render what we have (or empty) to be "instant"
      // If purely empty, maybe show skeleton?
      // Let's render but inputs will be 0.
  }


  if (!hasPermission(PERMISSIONS.DASHBOARD.VIEW)) {
    return (
      <div className="flex items-center justify-center h-full text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-400">You do not have permission to view the dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full overflow-y-auto p-6 text-sm ${isLight ? 'bg-gradient-to-br from-gray-50 to-gray-200 text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
      <h2 className="text-2xl font-semibold mb-4">Dashboard</h2>

      {/* ================= TOP STATS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-lg shadow bg-blue-500">
          <h3 className="text-3xl font-bold text-white">{stats.todaysSale.toFixed(2)}</h3>
          <p className="text-blue-100">Today's Sale</p>
          <button
            onClick={() => navigate("/app/sales/sales")}
            className="text-xs mt-2 underline text-white"
          >
            More info
          </button>
        </div>

        <div className="p-4 rounded-lg shadow bg-green-500">
          <h3 className="text-3xl font-bold text-white">{stats.totalSuppliers}</h3>
          <p className="text-green-100">Total Suppliers</p>
          <button
            onClick={() => navigate("/app/businesspartners/suppliers")}
            className="text-xs mt-2 underline text-white"
          >
            More info
          </button>
        </div>

        <div className="p-4 rounded-lg shadow bg-yellow-500">
          <h3 className="text-3xl font-bold text-white">{stats.totalCustomers}</h3>
          <p className="text-yellow-100">Total Customers</p>
          <button
            onClick={() => navigate("/app/businesspartners/customers")}
            className="text-xs mt-2 underline text-white"
          >
            More info
          </button>
        </div>

        <div className="p-4 rounded-lg shadow bg-red-500">
          <h3 className="text-3xl font-bold text-white">{stats.totalProducts}</h3>
          <p className="text-red-100">Total Products</p>
          <button
            onClick={() => navigate("/app/inventory/products")}
            className="text-xs mt-2 underline text-white"
          >
            More info
          </button>
        </div>
      </div>

      {/* ================= CHARTS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DashboardCard
          title={`Sales, Purchase & Expense Report Summary – ${currentYear}`}
          color="bg-blue-400"
        >
          <YearlySalesChart data={stats.yearlyData} />
        </DashboardCard>

        <DashboardCard
          title={`Expense Statement – ${currentYear}`}
          color="bg-red-400"
        >
          <ExpenseChart data={stats.expenseData} />
        </DashboardCard>

        <DashboardCard
          title={`Sales, Purchase & Expense Report Summary (${currentMonthName}) – ${currentYear}`}
          color="bg-blue-400"
        >
          <MonthlySalesChart data={stats.dailyData} />
        </DashboardCard>

        <DashboardCard
          title={`Best Sale Product – ${currentYear}`}
          color="bg-green-400"
        >
          <BestProductChart data={stats.productData} />
        </DashboardCard>
      </div>

      {/* ================= BOTTOM SECTIONS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <LatestOrders orders={stats.latestOrders} />
        <RecentlyAddedProducts products={stats.recentProducts} />
      </div>
    </div>
  );
};

export default Dashboard;
