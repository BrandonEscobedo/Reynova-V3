import React from "react";

export const MainView = () => {
  return (
    <div className="flex flex-col">
      <h1 className="font-bold text-3xl">Dashboard</h1>
      <div className  ="grid grid-cols-3 md:grid-cols-3 grid-rows-3 md:grid-rows-3 gap-2 md:gap-3 m-4 h-full">
        <div className  ="md:block md:col-start-1 md:row-start-1 md:col-span-1 md:row-span-3 bg-gray-300 rounded-md p-5 ">
          0
        </div>
        <div className  ="md:block md:col-start-2 md:row-start-1 md:col-span-2 md:row-span-2 bg-gray-300 rounded-md p-5">
          1
        </div>
        <div className  ="md:block md:col-start-2 md:row-start-3 md:col-span-1 md:row-span-1 bg-gray-300 rounded-md p-5">
          2
        </div>
        <div className  ="md:block md:col-start-3 md:row-start-3 md:col-span-1 md:row-span-1 bg-gray-300 rounded-md p-5">
          3
        </div>
      </div>
    </div>
  );
};
