// import React, { useEffect, useState } from "react";
// import { Archive, EyeOff } from "lucide-react";
// import toast from "react-hot-toast";
// import {
//   getInactiveCountApi,
//   getInactiveListApi,
// } from "../services/allAPI"; 


// export default function InactiveBadge({ entity = "countries", className = "", onOpen }) {
//   const [count, setCount] = useState(0);
//   const [loading, setLoading] = useState(false);

//   const loadCount = async () => {
//     try {
//       const res = await getInactiveCountApi(entity);
//       // backend returns { total } or { total: number }
//       if (res?.status === 200 && (res.data?.total !== undefined || typeof res.data === "number")) {
//         // support two shapes: { total } or number
//         const total = res.data?.total ?? res.data;
//         setCount(Number(total));
//       } else {
//         setCount(0);
//       }
//     } catch (err) {
//       console.error("InactiveBadge loadCount error:", err);
//       toast.error("Unable to load inactive count");
//     }
//   };

//   useEffect(() => {
//     loadCount();
//     // optionally: subscribe to an event / websocket to refresh
//   }, [entity]);

//   const handleClick = async () => {
//     setLoading(true);
//     try {
//       const res = await getInactiveListApi(entity, 1, 25);
//       if (res?.status === 200) {
//         const records = res.data.records ?? res.data;
//         if (onOpen) onOpen(records);
//       } else {
//         toast.error("Failed to load inactive records");
//       }
//     } catch (err) {
//       console.error("Failed to fetch inactive list", err);
//       toast.error("Failed to load inactive records");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <button
//       title={`Show ${entity} inactive records`}
//       onClick={handleClick}
//       className={`flex items-center gap-2 px-3 py-1 rounded-md border border-gray-700 bg-gray-800/30 text-sm text-gray-400 hover:bg-gray-800/40 transition ${className}`}
//     >
//       {/* icon with faded look */}
//       <Archive size={16} className="opacity-60" />

//       {/* center-line (strikethrough) text */}
//       <span className="text-xs leading-4 select-none" style={{ textDecoration: "line-through", textAlign: "center" }}>
//         inactive {loading ? "..." : count}
//       </span>
//     </button>
//   );
// }