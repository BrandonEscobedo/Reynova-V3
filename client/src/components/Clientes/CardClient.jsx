import { Eye, FileText } from "lucide-react";
import React from "react";
import { Link } from "react-router-dom"; 

// 1. Función robusta para calcular días (Soporta Firebase Timestamps y Strings)
const calcularDiasSinCotizar = (fechaDato) => {
  if (!fechaDato) return null; // Si no hay fecha, retorna null para irnos a rojo
  
  let fechaCotizacion;
  // Si viene como Timestamp de Firebase (tiene el método toDate)
  if (typeof fechaDato.toDate === 'function') {
    fechaCotizacion = fechaDato.toDate();
  } else {
    // Si viene como string normal (ej. "2026-04-10")
    fechaCotizacion = new Date(fechaDato);
  }

  const hoy = new Date();
  const diferenciaTiempo = Math.abs(hoy - fechaCotizacion);
  return Math.ceil(diferenciaTiempo / (1000 * 60 * 60 * 24)); 
};

// Si están viendo esto probablemente no tenga ganas de seguir con mi vida, amo a Alan y a Duki
export const CardClient = ({ client }) => {
  
  // 2. Ejecutamos la matemática
  // OJO: Asegúrate de que "fechaUltimaCotizacion" sea el nombre real de tu campo en Firestore
  const dias = calcularDiasSinCotizar(client.fechaUltimaCotizacion);
  
  // 3. Semáforo: <=60 verde, 61-119 amarillo, >=120 rojo (sin fecha = rojo)
  let status = "red";

  if (dias !== null) {
    if (dias <= 60) {
      status = "green";
    } else if (dias < 120) {
      status = "yellow";
    }
  }

  return (
    <div className="w-full flex max-w-md mx-auto p-6 wrap-break-word">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 flex flex-col justify-between">
        
        {/* CONTENIDO PRINCIPAL */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Estado</span>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${client.activo ? "bg-green-500" : "bg-gray-400"}`}></div>
              <span className={`text-sm font-semibold ${client.activo ? "text-green-700" : "text-gray-600"}`}>
                {client.activo ? "Activo" : "Inactivo"}
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              {client.nombreEmpresa}
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Giro</p>
              <p className="text-sm font-semibold text-gray-800">{client.giro ? client.giro : "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Vertical</p>
              <p className="text-sm font-semibold text-gray-800">{client.vertical}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Telefono</p>
              <p className="text-sm font-semibold text-gray-800">{client.telefono ? client.telefono : "N/A"}</p>
            </div>
          </div>
        </div>

        {/* BOTONES */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 justify-between">
          <div className="flex gap-3">
            <Link
              to={`/clientes/${client.id}`}
              className="flex-1 cursor-pointer flex items-center justify-center gap-2 bg-blue-400 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200 min-w-1/2"
            >
              <Eye size={18} />
              <span>Detalles</span>
            </Link>

            <Link 
              to={`/clientes/${client.id}/cotizaciones`}  
              className="flex-1 flex cursor-pointer items-center justify-center gap-2 bg-gray-600 hover:bg-gray-800 text-white font-medium py-2.5 px-2 rounded-lg transition-colors duration-200 min-w-1/2"
            >
              <FileText size={18} />
              <span className="text-sm">Cotizaciones</span>
            </Link>
          </div>
        </div>

        {/* 4. LA BARRA SUTIL ACTIVADA DINÁMICAMENTE */}
        {/* Usamos ternarios para pintar el color fuerte si coincide el status, y un color muy bajito si no */}
        <div className="flex h-2 w-full">
          <div className={`flex-1 transition-colors duration-300 ${status === 'green' ? 'bg-green-500' : 'bg-green-50'}`}></div>
          <div className={`flex-1 transition-colors duration-300 ${status === 'yellow' ? 'bg-yellow-400' : 'bg-yellow-50'}`}></div>
          <div className={`flex-1 transition-colors duration-300 ${status === 'red' ? 'bg-red-500' : 'bg-red-50'}`}></div>
        </div>

      </div>
    </div>
  );
};