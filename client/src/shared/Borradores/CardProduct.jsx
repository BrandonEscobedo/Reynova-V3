import { Edit, Eye } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";

export const CardProduct = ({ product, isReadOnly = false }) => {
  const navigate = useNavigate();

  return (
    <div className="w-full flex max-w-md mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 flex flex-col justify-between w-full">
        {/* contenido principal de la card */}
        <div className="p-6 space-y-4">
          {/* nombre del producto */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1 truncate">
              {product.nombre}
            </h3>
            <p className="text-sm text-gray-500">{product.modelo || "sin modelo"}</p>
          </div>

          {/* categoria y precio */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                categoría
              </p>
              <p className="text-sm font-semibold text-gray-800">
                {product.categoria || "n/a"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                precio
              </p>
              {/* formateamos el precio para que se vea como moneda */}
              <p className="text-sm font-semibold text-green-700">
                {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(product.precio)}
              </p>
            </div>
          </div>
           {/* descripción */}
           <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                descripción
              </p>
              <p className="text-sm text-gray-700 line-clamp-2">
                {product.descripcion || "sin descripción"}
              </p>
            </div>
        </div>

        {/* sección de botones */}
        {!isReadOnly && (
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
            <div className="flex gap-3">
              <button
                // esta ruta de editar aun no existe, pero la dejamos preparada
                onClick={() => navigate(`/productos/Editar/${product.id}`)}
                className="flex-1 cursor-pointer flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200"
              >
                <Edit size={18} />
                <span>Editar</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
