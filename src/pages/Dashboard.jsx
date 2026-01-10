import React, { useEffect, useState } from "react";
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
  return (
    <DashboardCard title="Latest Orders" color="bg-cyan-400">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-500 text-left">
            <th className="pb-2">Order ID</th>
            <th className="pb-2">Item</th>
            <th className="pb-2">Quantity</th>
            <th className="pb-2">Total</th>
          </tr>
        </thead>
        <tbody>
          {orders.length > 0 ? (
            orders.map((order, i) => (
              <tr key={i} className="border-b border-gray-700">
                <td className="py-2 text-orange-400">{order.Id}</td>
                <td>{order.ItemName || "N/A"}</td>
                <td>{order.Quantity || 0}</td>
                <td>{order.GrandTotal ? order.GrandTotal.toFixed(2) : "0.00"}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="py-4 text-center text-gray-300">
                No recent orders
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="flex justify-between items-center mt-4">
        <button className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded text-sm">
          Place New Order
        </button>
        <button className="border border-gray-400 px-4 py-2 rounded text-sm">
          View All Orders
        </button>
      </div>
    </DashboardCard>
  );
};

const RecentlyAddedProducts = ({ products = [] }) => {
  const navigate = useNavigate();
  return (
    <DashboardCard title="Recently Added Products" color="bg-purple-400">
      <div className="space-y-4">
        {products.length > 0 ? (
          products.map((p, i) => (
            <div
              key={i}
              className="flex items-center justify-between border-b border-gray-600 pb-3"
            >
              <div className="flex gap-3 items-center">
                <div className="w-12 h-12 bg-gray-300 text-gray-700 flex items-center justify-center text-xs rounded overflow-hidden">
                  {/* Placeholder or Image if available */}
                  IMG
                </div>
                <div>
                  <p className="text-yellow-400 font-semibold">{p.ProductName}</p>
                  <p className="text-gray-300 text-xs truncate w-40">
                    {p.ProductDetails || "No description"}
                  </p>
                </div>
              </div>
              <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded">
                Qty: {p.UnitsInStock}
              </span>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-300 py-4">
            No recently added products
          </div>
        )}
      </div>

      <button 
        onClick={() => navigate("/app/inventory/products")}
        className="w-full text-center mt-4 text-yellow-400 text-sm cursor-pointer hover:text-yellow-300"
      >
        View All Products
      </button>
    </DashboardCard>
  );
};

/* =========================
   MAIN DASHBOARD
========================= */


const Dashboard = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const currentMonthName = new Date().toLocaleString('default', { month: 'long' });

  const [stats, setStats] = useState({
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
  }); 

  const fetchStats = async () => {
      try {
          const res = await getDashboardStatsApi();
          if(res.status === 200) {
              setStats(res.data);
          }
      } catch(e) {
          console.error("Failed to load dashboard stats", e);
      }
  };

  useEffect(() => {
      fetchStats();
  }, []);

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
    <div className="h-full overflow-y-auto bg-gradient-to-b from-gray-900 to-gray-700 p-6 text-white text-sm">
      <h2 className="text-2xl font-semibold mb-4">Dashboard</h2>

      {/* ================= TOP STATS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-500 p-4 rounded-lg shadow">
          <h3 className="text-3xl font-bold">{stats.todaysSale.toFixed(2)}</h3>
          <p>Today's Sale</p>
          <button
            onClick={() => navigate("/app/sales/sales")}
            className="text-xs mt-2 underline"
          >
            More info
          </button>
        </div>

        <div className="bg-green-500 p-4 rounded-lg shadow">
          <h3 className="text-3xl font-bold">{stats.totalSuppliers}</h3>
          <p>Total Suppliers</p>
          <button
            onClick={() => navigate("/app/businesspartners/suppliers")}
            className="text-xs mt-2 underline"
          >
            More info
          </button>
        </div>

        <div className="bg-yellow-500 p-4 rounded-lg shadow">
          <h3 className="text-3xl font-bold">{stats.totalCustomers}</h3>
          <p>Total Customers</p>
          <button
            onClick={() => navigate("/app/businesspartners/customers")}
            className="text-xs mt-2 underline"
          >
            More info
          </button>
        </div>

        <div className="bg-red-500 p-4 rounded-lg shadow">
          <h3 className="text-3xl font-bold">{stats.totalProducts}</h3>
          <p>Total Products</p>
          <button
            onClick={() => navigate("/app/inventory/products")}
            className="text-xs mt-2 underline"
          >
            More info
          </button>
        </div>
      </div>

      {/* ================= CHARTS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DashboardCard
          title={`Sales And Purchase Report Summary – ${currentYear}`}
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
          title={`Sales Report Summary (${currentMonthName}) – ${currentYear}`}
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
