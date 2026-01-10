import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  BarChart,
  Bar,
  Cell,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import {
  Minimize2,
  Maximize2,
  TrendingUp,
  DollarSign,
  PieChart as PieChartIcon,
  BarChart3,
  X,
} from "lucide-react";

/* =========================
   DATA
========================= */

// Data removed - provided via props

/* =========================
   CARD COMPONENT
========================= */
const ChartCard = ({
  title,
  icon,
  children,
  defaultMinimized = false,
  className = "",
}) => {
  const [minimized, setMinimized] = useState(defaultMinimized);
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <>
      {/* FULLSCREEN */}
      {fullscreen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="bg-white w-full h-full rounded-xl p-6 relative">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                {icon}
                <h2 className="text-xl font-semibold text-gray-800">
                  {title}
                </h2>
              </div>
              <button
                onClick={() => setFullscreen(false)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <X />
              </button>
            </div>
            <div className="h-[calc(100%-60px)]">{children}</div>
          </div>
        </div>
      )}

      {/* CARD */}
      <motion.div
        layout
        transition={{ duration: 0.35, ease: "easeInOut" }}
        className={`bg-white rounded-xl shadow border overflow-hidden ${className}`}
      >
        {/* HEADER (always visible) */}
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="font-semibold text-gray-800">{title}</h3>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setMinimized(!minimized)}
              className="p-2 hover:bg-gray-100 rounded"
            >
              {minimized ? <Maximize2 /> : <Minimize2 />}
            </button>
            <button
              onClick={() => setFullscreen(true)}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <Maximize2 />
            </button>
          </div>
        </div>

        {/* BODY */}
        <AnimatePresence initial={false}>
          {!minimized && (
            <motion.div
              key="content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="p-4"
            >
              <div className="h-[350px]">{children}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
};


/* =========================
   CHARTS
========================= */

export const YearlySalesChart = ({ data }) => (
  <ResponsiveContainer width="100%" height="100%">
    <AreaChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="month" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Area dataKey="sale" stroke="#3498db" fill="#3498db55" />
      <Area dataKey="purchase" stroke="#e74c3c" fill="#e74c3c55" />
      <Area dataKey="expense" stroke="#9b59b6" fill="#9b59b655" />
    </AreaChart>
  </ResponsiveContainer>
);

export const ExpenseChart = ({ data }) => (
  <ResponsiveContainer width="100%" height="100%">
    <PieChart>
      <Pie data={data} dataKey="value" label>
        {data && data.map((e, i) => (
          <Cell key={i} fill={e.color} />
        ))}
      </Pie>
      <Tooltip />
    </PieChart>
  </ResponsiveContainer>
);

export const MonthlySalesChart = ({ data }) => (
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="day" />
      <YAxis />
      <Tooltip />
      <Line dataKey="sale" stroke="#3498db" strokeWidth={3} />
      <Line
        dataKey="forecast"
        stroke="#95a5a6"
        strokeDasharray="5 5"
      />
    </LineChart>
  </ResponsiveContainer>
);

export const BestProductChart = ({ data }) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Bar dataKey="value">
        {data && data.map((p, i) => (
          <Cell key={i} fill={p.color} />
        ))}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
);

/* =========================
   MAIN PAGE
========================= */
const Charts = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartCard title="Yearly Performance" icon={<TrendingUp />}>
          <YearlySalesChart data={[]} />
        </ChartCard>

        <ChartCard title="Monthly Sales" icon={<DollarSign />}>
          <MonthlySalesChart data={[]} />
        </ChartCard>

        <ChartCard title="Expense Distribution" icon={<PieChartIcon />}>
          <ExpenseChart data={[]} />
        </ChartCard>

        <ChartCard title="Best Selling Products" icon={<BarChart3 />}>
          <BestProductChart data={[]} />
        </ChartCard>
      </div>
    </div>
  );
};

export default Charts;
