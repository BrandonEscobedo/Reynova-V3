import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { cotizacionesService } from "../services/cotizaciones.services";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../../../../firebase";

export default function VistaPublicaCotizacion() {
  const { id } = useParams();
  const [cotizacionData, setCotizacionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [comentario, setComentario] = useState("");

  useEffect(() => {
    const fetchCotizacion = async () => {
      try {
        setLoading(true);
        // Traemos únicamente esta cotización desde Firestore
        const data = await cotizacionesService.getCotizacionById(id);
        if (data) {
          setCotizacionData(data);
        } else {
          setError("Cotización no encontrada o el enlace no es válido.");
        }
      } catch (err) {
        setError("Error al cargar la información de la cotización.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCotizacion();
    }
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    try {
      setActionLoading(true);
      setActionError(null);
      
      // Invocamos a nuestro Mesero VIP (Cloud Function)
      const functions = getFunctions(app);
      const procesarRespuestaCliente = httpsCallable(functions, "procesarRespuestaCliente");
      
      const response = await procesarRespuestaCliente({ cotizacionId: id, nuevoStatus: newStatus, comentarioCliente: comentario });
      
      if (response.data?.success) {
        // Actualizamos el estado local para que la UI se refresque de inmediato
        setCotizacionData((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error("Error al procesar con Cloud Function:", err);
      
      // Extraer mensaje de error específico de Firebase
      const errorMessage = err.message || "Hubo un problema al procesar la respuesta. Inténtalo de nuevo.";
      setActionError(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl font-semibold text-blue-600 animate-pulse">Cargando cotización...</div>
      </div>
    );
  }

  if (error || !cotizacionData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full border border-gray-100">
          <h2 className="text-3xl font-bold text-red-500 mb-3">¡Oops!</h2>
          <p className="text-gray-600">{error || "No pudimos cargar la información."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 flex justify-center items-start">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
        {/* Encabezado Estilo Factura */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-900 p-8 text-center text-white relative">
          <h1 className="text-4xl font-extrabold tracking-tight">Reynova</h1>
          <p className="mt-2 text-blue-100 font-medium">Cotización #{id.substring(0, 8).toUpperCase()}</p>
          <div className={`mt-4 inline-block px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider bg-white ${cotizacionData.status === 'aprobada' ? 'text-green-600' : cotizacionData.status === 'rechazada' ? 'text-red-500' : 'text-yellow-600'}`}>
            Estado: {cotizacionData.status}
          </div>
        </div>

        {/* Cuerpo de la Factura */}
        <div className="p-8 sm:p-10">
          <div className="mb-8 border-b border-gray-100 pb-8">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6">Detalle de Productos</h3>
            <div className="space-y-4">
              {cotizacionData.productos?.map((prod, idx) => (
                <div key={idx} className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div>
                    <p className="font-bold text-gray-800 text-lg">{prod.nombre}</p>
                    <p className="text-sm text-gray-500 mt-1">Cant: <span className="font-medium text-gray-700">{prod.cantidad}</span> <span className="mx-2">•</span> P.U: <span className="font-medium text-gray-700">${prod.precioUnitario?.toFixed(2)}</span></p>
                  </div>
                  <div className="font-black text-gray-900 text-xl">${prod.subtotal?.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center bg-blue-50 p-6 rounded-2xl border border-blue-100 mb-10 shadow-inner">
            <span className="text-xl font-bold text-blue-900">Total a Pagar</span>
            <span className="text-4xl font-black text-blue-700">${cotizacionData.total?.toFixed(2)}</span>
          </div>

          {/* Botones de Acción Condicionales */}
          {cotizacionData.status?.toLowerCase() === "pendiente" ? (
            <div className="mt-8 animate-fade-in-up">
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  ¿Desea agregar un comentario? (Opcional)
                </label>
                <textarea
                  className="w-full border border-gray-300 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none transition-all shadow-sm"
                  rows="3"
                  placeholder="Escriba aquí sus observaciones o dudas antes de responder..."
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  disabled={actionLoading}
                />
              </div>

              {actionError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  <p className="font-bold mb-1"> No se pudo procesar la cotización:</p>
                  <p>{actionError}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={() => handleStatusChange("aprobada")} disabled={actionLoading} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-transform active:scale-95 disabled:opacity-50 text-lg flex items-center justify-center gap-2">
                  {actionLoading ? "Procesando..." : "Aprobar Cotización"}
                </button>
                <button onClick={() => handleStatusChange("rechazada")} disabled={actionLoading} className="flex-1 bg-white hover:bg-red-50 text-red-600 border-2 border-red-200 font-bold py-4 px-6 rounded-xl transition-transform active:scale-95 disabled:opacity-50 text-lg flex items-center justify-center gap-2">
                  {actionLoading ? "Procesando..." : "Rechazar"}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center p-8 bg-white shadow-sm rounded-2xl border border-gray-200 animate-fade-in-up">
              <div className="flex justify-center mb-4">
                {cotizacionData.status === 'aprobada' ? (
                  <svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                Cotización {cotizacionData.status.charAt(0).toUpperCase() + cotizacionData.status.slice(1)}
              </h3>
              <p className="text-gray-600 font-medium text-lg mb-2">
                El estado de esta cotización es <strong className={cotizacionData.status === 'aprobada' ? 'text-green-600' : 'text-red-600'}>{cotizacionData.status.toUpperCase()}</strong>.
              </p>
              <p className="text-sm text-gray-500 mt-2">Gracias por su atención. Si tiene dudas comuníquese con su agente de Reynova.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}