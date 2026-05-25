import { useNavigate } from "react-router-dom"; // importar hook
import { Button } from "@mui/material"; // Importar boton
import { CardClient } from "./CardClient";
import { useGetClients } from "./hooks/getClients";
import { RefreshCcw } from "lucide-react";

export const Clients = () => {
  const {
    data: clientList,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useGetClients();
  const navigate = useNavigate(); // Inicializar el hook

  if (error) return <p>{error.message}</p>;
  if (isLoading)
    return (
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Clientes</h1>
          <Button
            variant="contained"
            onClick={() => navigate("/clientes/Nuevo")}
          >
            Nuevo Cliente
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="w-full animate-pulse">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
                {/* Contenido principal */}
                <div className="p-6 space-y-4">
                  {/* Estado */}
                  <div className="flex items-center justify-between">
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-200"></div>
                      <div className="h-4 bg-gray-200 rounded w-12"></div>
                    </div>
                  </div>

                  {/* Nombre empresa */}
                  <div>
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-1"></div>
                  </div>

                  {/* Giro y Vertical */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="h-3 bg-gray-200 rounded w-12 mb-1"></div>
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </div>
                    <div>
                      <div className="h-3 bg-gray-200 rounded w-12 mb-1"></div>
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </div>
                  </div>
                </div>

                {/* Sección de botones */}
                <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                  <div className="flex gap-3">
                    <div className="flex-1 h-10 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1 h-10 bg-gray-200 rounded-lg"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Clientes</h1>
        {/* Hacer componente de boton para reutilizar y cambiar a useNavigate para mover entre rutas */}
        {/* Boton modificado */}
        <div className="flex gap-2">
          <div
            onClick={() => refetch()}
            className="p-2 border rounded-xl border-blue-700 cursor-pointer"
          >
            <RefreshCcw
              className={`transition-transform duration-300 ${
                isFetching ? "animate-spin text-blue-700" : "hover:rotate-180"
              }`}
              size={24}
            />{" "}
          </div>
          <Button
            variant="contained"
            onClick={() => navigate("/clientes/Nuevo")}
          >
            Nuevo Cliente
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 md:grid-cols-3">
        {clientList.map((client) => {
          return <CardClient key={client.id} client={client} />;
        })}
      </div>
    </div>
  );
};
