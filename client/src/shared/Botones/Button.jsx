import React from 'react';

//coñete
export const DeleteButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`
        relative z-10 inline-block cursor-pointer overflow-hidden
        rounded-md border-[3px] border-rose-500 bg-transparent
        px-10 py-1 text-lg font-bold text-rose-500
        transition-all duration-300

        hover:text-white

        before:absolute before:left-0 before:top-0 before:z-[-1]
        before:h-full before:w-full before:bg-rose-500
        before:transition-all before:duration-300
        before:-translate-x-full
        
        hover:before:translate-x-0
      `}
    >
      Eliminar
    </button>
  );
};