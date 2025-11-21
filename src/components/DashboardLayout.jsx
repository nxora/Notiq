import React from "react";
import Sidebar from "./Sidebar";

export default function DashboardLayout({  title, children }) {

  return (
    <div className="flex h-screen bg-[#fafafa] text-gray-900">

       <Sidebar />

       <div className="flex-1 h-full overflow-y-auto px-16 py-10">
        
         <h1 className="text-3xl font-semibold mb-8 tracking-tight">
          {title}
        </h1>

        {children}
      </div>
    </div>
  );
}
