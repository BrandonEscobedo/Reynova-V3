import { useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function ChatbotUI({ datosDashboard }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");

  // --- LÓGICA DEL BOT AÑADIDA AQUÍ ---
  const [mensajes, setMensajes] = useState([
    { rol: 'ia', texto: '¡Hola! He notado que las ventas subieron esta semana. ¿En qué te ayudo hoy?' }
  ]);
  const [cargando, setCargando] = useState(false);

  const enviarMensaje = async (textoAEnviar = chatInput) => {
    if (!textoAEnviar.trim()) return;

    // Agregamos el mensaje del usuario a la pantalla
    const nuevosMensajes = [...mensajes, { rol: 'usuario', texto: textoAEnviar }];
    setMensajes(nuevosMensajes);
    setChatInput('');
    setCargando(true);

    try {
      const functions = getFunctions();
      const llamarBot = httpsCallable(functions, 'chatbotReynova');

      // Mandamos la info a la nube
      const resultado = await llamarBot({
        mensaje: textoAEnviar,
        datosDashboard: datosDashboard || { aviso: "Datos aún no cargados en el front" }
      });

      // 🕵️‍♂️ AQUÍ ESTÁ LA TRAMPA: Vamos a imprimir en consola EXACTAMENTE qué llegó
      console.log("📦 Lo que llegó de la nube:", resultado.data);

      // Si viene la respuesta chida, la usamos. Si el backend mandó un error interno, lo mostramos.
      // Y si de plano viene vacío, ponemos un texto por default para que no salga la burbuja invisible.
      const textoDelBot = resultado.data.respuesta || resultado.data.error || "🤔 Recibí un objeto raro, checa la consola.";

      // Recibimos respuesta y la mostramos
      setMensajes([...nuevosMensajes, { rol: 'ia', texto: textoDelBot }]);

    } catch (error) {
      console.error("Error del bot (Problema de Red/Firebase):", error);
      setMensajes([...nuevosMensajes, { rol: 'ia', texto: 'Uy, perdí la conexión 😅. Intenta de nuevo.' }]);
    } finally {
      setCargando(false);
    }
  };
  // ------------------------------------

  return (
    <>
      {/* Botón Flotante */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-violet-600 to-blue-600 rounded-full shadow-2xl flex items-center justify-center text-white text-3xl hover:scale-110 transition-transform duration-300 z-40"
        >
          ✨
        </button>
      )}

      {/* Panel de Chat */}
      {isChatOpen && (
        <div className="fixed bottom-6 right-6 w-[400px] sm:w-[460px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden border border-gray-100 transition-all duration-300 max-h-[calc(100vh-3rem)]">

          {/* Header del Chat */}
          <div className="bg-slate-900 text-white px-4 py-4 flex justify-between items-center shadow-md z-10">
            <div className="flex items-center gap-2">
              <span className="text-2xl">✨</span>
              <span className="font-semibold tracking-wide text-lg">Reynova AI</span>
            </div>
            <button
              onClick={() => setIsChatOpen(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          {/* Área de Mensajes */}
          <div className="flex-1 min-h-0 p-5 overflow-y-auto bg-slate-50 h-[460px] flex flex-col gap-4 overscroll-contain">

            {/* Mapeo dinámico de mensajes */}
            {mensajes.map((msg, index) =>
              msg.rol === "ia" ? (
                <div
                  key={index}
                  className="bg-white p-4 rounded-2xl rounded-tl-sm shadow-sm text-sm text-gray-700 border border-gray-100 max-w-[92%] leading-relaxed self-start overflow-auto max-h-[380px] chatbot-markdown"
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      table: ({children}) => (
                        <div className="overflow-x-auto my-2">
                          <table className="min-w-full border-collapse border border-gray-300 text-xs">
                            {children}
                          </table>
                        </div>
                      ),
                      thead: ({children}) => (
                        <thead className="bg-violet-50">{children}</thead>
                      ),
                      th: ({children}) => (
                        <th className="border border-gray-300 px-3 py-1.5 text-left font-semibold text-violet-900">
                          {children}
                        </th>
                      ),
                      td: ({children}) => (
                        <td className="border border-gray-300 px-3 py-1.5">
                          {children}
                        </td>
                      ),
                      p: ({children}) => (
                        <p className="mb-1.5 last:mb-0">{children}</p>
                      ),
                      ul: ({children}) => (
                        <ul className="list-disc pl-5 mb-1.5 space-y-0.5">{children}</ul>
                      ),
                      ol: ({children}) => (
                        <ol className="list-decimal pl-5 mb-1.5 space-y-0.5">{children}</ol>
                      ),
                      strong: ({children}) => (
                        <strong className="font-semibold text-gray-900">{children}</strong>
                      ),
                    }}
                  >
                    {msg.texto}
                  </ReactMarkdown>
                </div>
              ) : (
                <div
                  key={index}
                  className="bg-violet-600 p-4 rounded-2xl rounded-tr-sm shadow-sm text-base text-white max-w-[85%] leading-relaxed self-end whitespace-pre-wrap break-words overflow-auto max-h-[300px]"
                >
                  {msg.texto}
                </div>
              )
            )}

            {/* Animación de carga chiquita */}
            {cargando && (
              <div className="text-sm text-gray-500 italic self-start ml-2">Reynova AI está escribiendo...</div>
            )}

            {/* Chips de Sugerencias (Solo se muestran si no hay mensajes previos del usuario para no estorbar después) */}
            {mensajes.length === 1 && (
              <div className="flex flex-col gap-2 mt-auto">
                <button
                  onClick={() => enviarMensaje("¿Cuáles son los productos con bajo stock?")}
                  className="text-left text-sm bg-white border border-violet-200 text-violet-700 px-4 py-3 rounded-full shadow-sm hover:bg-violet-50 hover:border-violet-300 transition-all w-max font-medium"
                >
                  📉 Ver productos con bajo stock
                </button>
                <button
                  onClick={() => enviarMensaje("Dame un resumen de la Utilidad Neta de hoy.")}
                  className="text-left text-sm bg-white border border-violet-200 text-violet-700 px-4 py-3 rounded-full shadow-sm hover:bg-violet-50 hover:border-violet-300 transition-all w-max font-medium"
                >
                  📊 Resumen de Utilidad Neta
                </button>
                <button
                  onClick={() => enviarMensaje("¿Hay cotizaciones pendientes?")}
                  className="text-left text-sm bg-white border border-violet-200 text-violet-700 px-4 py-3 rounded-full shadow-sm hover:bg-violet-50 hover:border-violet-300 transition-all w-max font-medium"
                >
                  ⏳ Cotizaciones pendientes
                </button>
              </div>
            )}
          </div>

          {/* Footer / Input de Texto */}
          <div className="p-4 bg-white border-t border-gray-100 flex items-center gap-3">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Pregúntale a Reynova AI..."
              className="flex-1 bg-gray-100 text-base rounded-full px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500 transition-shadow text-gray-700"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  enviarMensaje();
                }
              }}
            />
            <button
              onClick={() => enviarMensaje()}
              disabled={!chatInput.trim() && !cargando}
              className="w-12 h-12 flex items-center justify-center bg-violet-600 text-white rounded-full hover:bg-violet-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-md flex-shrink-0"
            >
              <svg className="w-5 h-5 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}