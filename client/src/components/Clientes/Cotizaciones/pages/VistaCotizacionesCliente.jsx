import { useEffect, useMemo, useState } from "react";
import { useCotizaciones } from "../hooks/useCotizaciones";
import { Link, useNavigate, useParams } from "react-router";
import { status } from "../constants/metodosPago";
import { getFormattedTimestamp } from "../../../../shared/functions/getDate";
import { Button } from "@mui/material";
import { useProductos } from "../../../Productos/hooks/useProducts";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../../firebase";
import { useAlert } from "../../../../shared/Alerts/AlertContext";

// IMPORTACIÓN DE LA NUEVA ARQUITECTURA
import { ModalAprobacionToken } from "../components/ModalAprobacionToken";
import EnviarCotizacionModal from "../components/EnviarCotizacionModal"; 

export const VistaCotizacionesCliente = () => {
  let fechaCotizacion = getFormattedTimestamp();
  const navigate = useNavigate();
  const { traerCotizaciones, actualizarCotizacion, loading } =
    useCotizaciones();
  const [cotizaciones, setCotizaciones] = useState([]);
  const [selectedCotizacion, setSelectedCotizacion] = useState(null);
  const [page, setPage] = useState(0);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  
  // ESTADO PARA EL MODAL DE LA VISTA PÚBLICA
  const [showPublicModal, setShowPublicModal] = useState(false);
  
  // ESTADO PARA EL MODAL DE ENVÍO DE COTIZACIÓN
  const [openEnviarModal, setOpenEnviarModal] = useState(false);
  const [cotizacionIdEnviar, setCotizacionIdEnviar] = useState(null);
  const { showAlert } = useAlert();

  const { actualizarNumeroProductosVendidos } = useProductos();

  console.log(selectedCotizacion?.productos);

  const actualizarProducto = async (productoDocId, producto) => {
    try {
      const productoRef = doc(db, "productos", productoDocId);

      // Actualizar el documento con los nuevos campos
      await setDoc(productoRef, {
        cantidad: producto.cantidad,
        categoria: producto.categoria,
        modelo: producto.modelo,
        nombre: producto.nombre,
        precioUnitario: producto.precioUnitario,
        subtotal: producto.subtotal,
      });

      console.log(`Producto ${productoDocId} actualizado exitosamente`);
      return { success: true, productoDocId };
    } catch (error) {
      console.error("Error al actualizar producto:", error);
      throw error;
    }
  };

  const { clienteId } = useParams();

  const productosPorPagina = 3;

  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [orden, setOrden] = useState("total-desc");
  const [filtroFecha, setFiltroFecha] = useState("todos");

  const cotizacionesFiltradasYOrdenadas = useMemo(() => {
    const filtrarPorFecha = (cotizacion) => {
      if (filtroFecha === "todos") return true;

      const fechaCotizacion = cotizacion.createdAt.toDate();
      const hoy = new Date();
      const ayer = new Date(hoy);
      ayer.setDate(ayer.getDate() - 1);

      // Inicio de la semana (lunes)
      const inicioSemana = new Date(hoy);
      inicioSemana.setDate(
        hoy.getDate() - hoy.getDay() + (hoy.getDay() === 0 ? -6 : 1)
      );
      inicioSemana.setHours(0, 0, 0, 0);

      // Inicio del mes
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

      // Inicio del año
      const inicioAnio = new Date(hoy.getFullYear(), 0, 1);

      switch (filtroFecha) {
        case "hoy":
          return fechaCotizacion.toDateString() === hoy.toDateString();

        case "ayer":
          return fechaCotizacion.toDateString() === ayer.toDateString();

        case "semana":
          return fechaCotizacion >= inicioSemana;

        case "mes":
          return fechaCotizacion >= inicioMes;

        case "anio":
          return fechaCotizacion >= inicioAnio;

        default:
          return true;
      }
    };
    let resultado = cotizaciones.filter((cotizacion) => {
      // Filtro por status
      const pasaFiltroStatus =
        filtroStatus === "todos" || cotizacion.status === filtroStatus;

      // Filtro por fecha
      const pasaFiltroFecha = filtrarPorFecha(cotizacion);

      return pasaFiltroStatus && pasaFiltroFecha;
    });

    // Aplicar ordenamiento
    return resultado.sort((a, b) => {
      switch (orden) {
        case "fecha-reciente":
          return b.createdAt.toDate() - a.createdAt.toDate();
        case "fecha-antigua":
          return a.createdAt.toDate() - b.createdAt.toDate();
        default:
          return 0;
      }
    });
  }, [cotizaciones, filtroStatus, orden, filtroFecha]);

  useEffect(() => {
    const fetchData = async () => {
      const data = await traerCotizaciones(clienteId);
      setCotizaciones(data);
    };
    fetchData();
  }, [traerCotizaciones, clienteId]);

  const abrirPanel = (cotizacion) => {
    setSelectedCotizacion(cotizacion);
    setPage(0);
  };

  const cerrarPanel = () => {
    setSelectedCotizacion(null);
    setPage(0);
  };

  const cambiarStatus = async (id, nuevoStatus) => {
    try {
      await actualizarCotizacion(id, { status: nuevoStatus });
      setCotizaciones((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: nuevoStatus } : c))
      );
      if (selectedCotizacion?.id === id) {
        setSelectedCotizacion({ ...selectedCotizacion, status: nuevoStatus });

        selectedCotizacion.productos.forEach((product) => {
          actualizarNumeroProductosVendidos.mutateAsync({
            productoId: product.productoId,
            cantidadVenta: product.cantidad,
            status: nuevoStatus,
          });
        });
      }
      
      showAlert("success", `Cotización actualizada a ${nuevoStatus}.`);
    } catch (error) {
      console.error("Error al cambiar status:", error);
      showAlert("error", error.message || "No se pudo actualizar la cotización. Verifica el stock disponible.");
    }
  };

  const cambiarPagina = (direccion) => {
    setPage((prev) => {
      const nueva = prev + direccion;
      return nueva < 0 ? 0 : nueva;
    });
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-blue-600 font-semibold text-xl animate-pulse">
          Cargando...
        </div>
      </div>
    );

  const start = page * productosPorPagina;
  const end = start + productosPorPagina;
  const productosActuales =
    selectedCotizacion?.productos?.slice(start, end) || [];

  return (
    <div className="px-4 pt-2 bg-gray-50 rounded-xl min-h-[87dvh] max-h-[85dvh]  ">
      <div className="mb-6 flex-col justify-between items-center ">
        <h1 className="text-3xl font-bold">Cotizaciones</h1>
        <div className="flex gap-4">
          {/*Div fecha cotizacion */}
          <div className="flex gap-4 items-center text-sm text-blue-800">
            <h3 className="font-bold">Fecha de Cotizacion</h3>
            <h2 className="font-bold">{fechaCotizacion}</h2>
            <Button variant="contained">
              <Link to={"Nuevo"}>Nuevo</Link>
            </Button>

            {/* Select de Filtros */}
            <div className="flex items-center gap-4">
              <label
                htmlFor="filtro-status"
                className="text-sm font-medium text-gray-700"
              >
                Filtrar por estado:
              </label>
              <select
                id="filtro-status"
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="text-gray-900 bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="todos">Todos los estados</option>
                <option
                  className="text-yellow-600 focus:bg-amber-300"
                  value="pendiente"
                >
                  Pendientes
                </option>
                <option className="text-green-700" value="aprobada">
                  Aprobadas
                </option>
                <option className="text-red-600" value="rechazada">
                  Rechazada
                </option>
              </select>

              {/* Filtro por Fecha */}
              <div className="flex items-center gap-2">
                <label
                  htmlFor="filtro-fecha"
                  className="text-sm font-medium text-gray-700 whitespace-nowrap"
                >
                  Fecha:
                </label>
                <select
                  id="filtro-fecha"
                  value={filtroFecha}
                  onChange={(e) => setFiltroFecha(e.target.value)}
                  className="bg-white border text-gray-900 border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 min-w-[160px]"
                >
                  <option value="todos">Todas las fechas</option>
                  <option value="hoy">Hoy</option>
                  <option value="ayer">Ayer</option>
                  <option value="semana">Esta semana</option>
                  <option value="mes">Este mes</option>
                  <option value="anio">Este año</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label
                  htmlFor="filtro-orden"
                  className="text-sm font-medium text-gray-700 whitespace-nowrap"
                >
                  Orden:
                </label>
                <select
                  id="filtro-orden"
                  value={orden}
                  onChange={(e) => setOrden(e.target.value)}
                  className="bg-white border text-gray-900 border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 min-w-[160px]"
                >
                  <option value="fecha-reciente">Mas recientes</option>
                  <option value="fecha-antigua">Mas antiguas</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-6 wrap grow">
        {/* Grid de cotizaciones - Ahora es scrolleable */}
        <div className={` ${selectedCotizacion ? "w-3/5" : "w-full"}`}>
          {cotizaciones && cotizaciones.length > 0 ? (
            <div
              className={`grid gap-6 z-20 ${
                selectedCotizacion
                  ? "grid-cols-1 lg:grid-cols-2"
                  : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              } max-h-[75dvh] overflow-y-auto pr-2`}
            >
              {cotizacionesFiltradasYOrdenadas.length > 0 ? (
                cotizacionesFiltradasYOrdenadas.map((cotizacion) => (
                  <div
                    key={cotizacion.id}
                    className={`bg-white rounded-xl shadow-md border border-gray-200 p-6 m-2 transform transition-all duration-500 hover:shadow-xl hover:scale-102 ${
                      selectedCotizacion?.id === cotizacion.id
                        ? "ring-2 ring-blue-500"
                        : ""
                    }`}
                  >
                    <div className="mb-4">
                      <div className="flex gap-2 justify-between">
                        <p className="text-xs text-gray-400 mb-2">
                          {cotizacion.id}
                        </p>
                        <p className="text-xs text-gray-400 mb-2">
                          {cotizacion.createdAt.toDate().toLocaleString()}
                        </p>
                      </div>
                      <h1 className="truncate">
                        {cotizacion.tituloCotizacion || "Sin titulo"}
                      </h1>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-2xl font-bold text-blue-600">
                          ${cotizacion.total.toFixed(2)}
                        </h3>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            cotizacion.status === "aprobada"
                              ? "bg-green-100 text-green-700"
                              : cotizacion.status === "pendiente"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {cotizacion.status}
                        </span>
                      </div>
                    </div>

                    <div className="text-sm text-gray-600 mb-4">
                      <p className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4 "
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                          />
                        </svg>
                        {cotizacion.productos?.length || 0} productos
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      {cotizacion.status === "pendiente" && (
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              cambiarStatus(cotizacion.id, status[1]);
                            }}
                            className="cursor-pointer w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 active:scale-95"
                          >
                            Aprobar
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              cambiarStatus(cotizacion.id, status[2]);
                            }}
                            className="cursor-pointer w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 active:scale-95"
                          >
                            Denegar
                          </button>
                        </div>
                      )}

                      <div className="flex flex-row gap-3">
                        <button
                          onClick={() => abrirPanel(cotizacion)}
                          className="w-full cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                        >
                          <svg
                            className="w-4 h-4 "
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          Ver Productos
                        </button>

                        <button
                          onClick={() =>
                            navigate("editar", {
                              state: { cotizacionEditar: cotizacion },
                            })
                          }
                          className="w-full cursor-pointer bg-gray-100 hover:bg-gray-200 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                          Editar Cotizacion
                        </button>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCotizacionIdEnviar(cotizacion.id);
                          setOpenEnviarModal(true);
                        }}
                        className="w-full cursor-pointer bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 mt-2"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                        Enviar por Correo
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center w-full col-span-full  py-12">
                  <p className="text-gray-500 text-lg">
                    No hay cotizaciones que coincidan con los filtros
                    seleccionados.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center w-full col-span-full  py-12">
              <p className="text-gray-500 text-lg">
                No hay cotizaciones disponibles.
              </p>
            </div>
          )}
        </div>

        {/* Panel lateral derecho - Separado y fijo */}
        <div
          className={` ${
            selectedCotizacion
              ? "w-2/5 opacity-100"
              : "w-0 opacity-0 overflow-hidden"
          }`}
        >
          {selectedCotizacion && (
            <div className="bg-white rounded-xl shadow-xl border border-gray-200 min-h-[75dvh] flex flex-col sticky top-6">
              {/* Header del panel */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-full -mr-6">
                    <p className="text-blue-100 text-sm">
                      ID: {selectedCotizacion.id}
                    </p>
                    <h2 className="text-2xl font-bold mb-2 break-words max-w-full">
                      {selectedCotizacion.tituloCotizacion || "Sin titulo"}
                    </h2>
                    <h2 className="text-xl font-normal">
                      ${selectedCotizacion.total.toFixed(2)}
                    </h2>
                  </div>
                  <button
                    onClick={cerrarPanel}
                    className="text-white  hover:bg-white/20 rounded-full p-2 transition-all duration-300 transform hover:scale-110 active:scale-95 cursor-pointer"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <div className="flex gap-1">
                  <h2 className="font-bold">Comentarios: </h2>
                  <p className="font-light">
                    {" "}
                    {selectedCotizacion.comentarios || `Sin Comentarios`}
                  </p>
                </div>
                {selectedCotizacion.comentariosCliente && (
                  <div className="flex gap-2 mt-3 bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <h2 className="font-bold text-blue-800 shrink-0">Comentario del Cliente: </h2>
                    <p className="font-light text-gray-800 italic">
                      "{selectedCotizacion.comentariosCliente}"
                    </p>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm">Estado:</span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      selectedCotizacion.status === "aprobada"
                        ? "bg-green-500 text-white"
                        : selectedCotizacion.status === "pendiente"
                        ? "bg-yellow-500 text-white"
                        : "bg-red-500 text-white"
                    }`}
                  >
                    {selectedCotizacion.status}
                  </span>
                  
                  <div className="relative flex items-center gap-2 ml-2">
                    <div
                      onClick={() => setMostrarConfirmacion(true)}
                      className="bg-orange-400 px-2 py-1 border-2 border-white rounded-lg text-sm cursor-pointer transition-all duration-300 hover:scale-102"
                    >
                      <h2>Cambiar Status</h2>
                    </div>

                    <button
                      onClick={() => setShowPublicModal(true)}
                      className="bg-emerald-500 text-white px-3 py-1 border-2 border-white rounded-lg text-sm font-bold cursor-pointer transition-all duration-300 hover:bg-emerald-600 hover:scale-102 shadow-sm"
                    >
                     Compartir Enlace
                    </button>

                    <div
                      className={`absolute left-0 top-full mt-2 bg-white rounded-lg shadow-xl border-2 border-orange-400 p-4 z-50 min-w-[300px] transition-all duration-300 transform
  ${
    mostrarConfirmacion
      ? "opacity-100 translate-y-0"
      : "opacity-0 -translate-y-4 pointer-events-none"
  }`}
                    >
                      <p className="text-sm text-gray-700 mb-3 font-medium">
                        ¿Cambiar status a
                        {selectedCotizacion.status === "aprobada"
                          ? " rechazada"
                          : " aprobada"}
                        ?
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            cambiarStatus(
                              selectedCotizacion.id,
                              selectedCotizacion.status === "aprobada"
                                ? "rechazada"
                                : "aprobada"
                            );
                            setMostrarConfirmacion(false);
                          }}
                          className="flex-1 cursor-pointer bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded text-sm font-medium transition-all duration-300"
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={() => setMostrarConfirmacion(false)}
                          className="flex-1 cursor-pointer bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded text-sm font-medium transition-all"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contenido scrolleable */}
              <div className="flex-1 overflow-y-auto p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Productos ({selectedCotizacion.productos?.length || 0})
                </h3>

                <div className="space-y-3">
                  {productosActuales.map((p) => (
                    <div
                      key={p.productoId}
                      className="bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-lg p-4 hover:shadow-md transition-all duration-300 transform hover:scale-[1.01]"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-800 text-sm">
                          {p.nombre}
                        </h4>
                        <span className="text-blue-600 font-bold text-lg">
                          ${p.subtotal}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                        <div>
                          <span className="font-medium">Modelo:</span>{" "}
                          {p.modelo}
                        </div>
                        <div>
                          <span className="font-medium">Categoría:</span>{" "}
                          {p.categoria}
                        </div>
                        <div>
                          <span className="font-medium">Cantidad:</span>{" "}
                          {p.cantidad}
                        </div>
                        <div>
                          <span className="font-medium">Precio Unit:</span> $
                          {p.precioUnitario}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Paginación */}
                {selectedCotizacion.productos?.length > productosPorPagina && (
                  <div className="flex justify-center items-center gap-3 mt-6 pt-4 border-t">
                    <button
                      disabled={page === 0}
                      onClick={() => cambiarPagina(-1)}
                      className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm transition-all duration-300 transform hover:scale-110 active:scale-95 disabled:transform-none"
                    >
                      ← Anterior
                    </button>
                    <span className="text-gray-700 text-sm font-semibold">
                      {page + 1} /{" "}
                      {Math.ceil(
                        selectedCotizacion.productos.length / productosPorPagina
                      )}
                    </span>
                    <button
                      disabled={end >= selectedCotizacion.productos.length}
                      onClick={() => cambiarPagina(1)}
                      className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm transition-all duration-300 transform hover:scale-110 active:scale-95 disabled:transform-none"
                    >
                      Siguiente →
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* COMPONENTE DE MODAL */}
      <ModalAprobacionToken 
        isOpen={showPublicModal} 
        onClose={() => setShowPublicModal(false)} 
        cotizacion={selectedCotizacion}
      />
      
      {/* Modal para enviar cotización por correo */}
      <EnviarCotizacionModal
        open={openEnviarModal}
        onClose={() => {
          setOpenEnviarModal(false);
          setCotizacionIdEnviar(null);
        }}
        cotizacionId={cotizacionIdEnviar}
        onSuccess={(msg) => showAlert("success", msg)}
      />

    </div>
  );
};