import { useState } from "react";

export function ModalAprobacionToken({ isOpen, onClose, cotizacion }) {
  const [isCopied, setIsCopied] = useState(false);

  // Si el modal no está abierto o no hay una cotización seleccionada, no renderizamos nada
  if (!isOpen || !cotizacion) return null;

  const enlacePublico = `http://192.168.56.1:5173/cotizacion/${cotizacion?.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(enlacePublico).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }).catch(err => console.error("Error al copiar el enlace: ", err));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in-up">
        
        {/* Header del Mockup */}
        <div className="relative p-6 text-center border-b border-gray-100">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl font-bold transition-colors"
          >
            ✕
          </button>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Reynova</h1>
          <p className="text-sm text-gray-500 mt-1">
            Cotización #{cotizacion.id.substring(0, 8)}...
          </p>
        </div>

        {/* Cuerpo del Mockup */}
        <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-50 pb-2">
              Resumen de Productos
            </h3>
            <div className="space-y-4">
              {/* Mapeo estático/simulado basado en los productos reales */}
              {cotizacion.productos?.slice(0, 4).map((p, index) => (
                <div key={index} className="flex justify-between items-start text-sm">
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-800">{p.nombre}</span>
                    <span className="text-xs text-gray-500">Cantidad: {p.cantidad}</span>
                  </div>
                  <span className="font-bold text-gray-900">${p.subtotal}</span>
                </div>
              ))}
              {cotizacion.productos?.length > 4 && (
                <div className="text-xs text-blue-500 font-medium pt-2 text-center">
                  + {cotizacion.productos.length - 4} productos adicionales
                </div>
              )}
            </div>
          </div>

          {/* Total Destacado */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl p-6 text-center shadow-lg">
            <p className="text-blue-100 text-sm mb-1 uppercase tracking-widest">Total a Pagar</p>
            <p className="text-5xl font-black">${cotizacion.total.toFixed(2)}</p>
          </div>
        </div>

        {/* Footer con Botones Gigantes */}
        <div className="p-5 bg-white border-t border-gray-100 flex flex-col gap-3">
          <p className="text-sm text-gray-600 text-center font-medium">
            Comparte este enlace con tu cliente para que apruebe la cotización:
          </p>
          <input
            type="text"
            readOnly
            value={enlacePublico}
            className="w-full bg-gray-100 text-gray-600 p-3 rounded-xl border border-gray-200 text-sm text-center outline-none cursor-default"
          />
          <button
            onClick={handleCopy}
            className={`w-full font-bold py-4 rounded-xl shadow-md transition-all active:scale-95 text-lg flex items-center justify-center gap-2 ${
              isCopied ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isCopied ? '¡Copiado!' : 'Copiar Enlace'}
          </button>
          <button
            onClick={onClose}
            className="w-full bg-white hover:bg-gray-50 text-gray-600 border-2 border-gray-200 font-bold py-3.5 rounded-xl transition-transform active:scale-95 text-base flex items-center justify-center gap-2"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}