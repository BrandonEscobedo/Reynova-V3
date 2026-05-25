import React from "react";
import { Outlet } from "react-router";
import Sidebar from "../Sidebar/Navbar";
import { BreadCrumb } from "../components/BreadCrumb";

export const Layout = () => {
  return (
    <div className="">
      <Sidebar />
      <main className="pt-10 px-10 min-h-dvh">
        <BreadCrumb/>
        <Outlet /> 
      </main>
    </div>
  );
};
