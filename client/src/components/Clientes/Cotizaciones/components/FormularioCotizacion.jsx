import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CrearCotizacionSchema } from "../schemas/cotizacion.schemas";
import { useCotizaciones } from "../hooks/useCotizaciones";
import { Navigate, useNavigate, useParams } from "react-router";
import { useAlert } from "../../../../shared/Alerts/AlertContext";
import { useEffect, useState } from "react";
import { Autocomplete, TextField, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useProductos } from "../../../Productos/hooks/useProducts.js";
import { metodoCotizacion, metodoPago, status } from "../constants/metodosPago";

export default function FormularioCotizacion({ onSuccess }) {
  const { clienteId } = useParams();
  const navigate = useNavigate();

  const { crearCotizacion, loading, error } = useCotizaciones();
  const [preciosModificados, setPreciosModificados] = useState({});
  const [productosEditando, setProductosEditando] = useState({});
  const { showAlert } = useAlert();
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const {
    productos: listaProductos = [],
    actualizarHistorial,
    isLoading: productosLoading,
    error: productosError,
  } = useProductos();

  const calcularTotal = () => {
    return productosSeleccionados.reduce(
      (sum, producto) => sum + producto.subtotal,
      0
    );
  };

  const {
    register,
    handleSubmit,
    setValue,
    control,
    trigger,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(CrearCotizacionSchema),
    defaultValues: {
      clienteId: clienteId,
      fechaEntregaEstimado: null,
      fechaEntregaReal: null,
      metodoCotizacion: metodoCotizacion[0],
      status: status[0],
      metodoPago: metodoPago[0],
      comentarios: "",
      productos: productosSeleccionados,
    },
  });

  useEffect(() => {
    const productosParaForm = productosSeleccionados.map((producto) => ({
      productoId: producto.id,
      nombre: producto.nombre,
      modelo: producto.modelo || "N/A",
      categoria: producto.categoria || "General",
      cantidad: producto.cantidad,
      precioUnitario: producto.precio,
      subtotal: producto.subtotal,
    }));
    setValue("total", calcularTotal());
    setValue("productos", productosParaForm);
    trigger("total");
    trigger("productos");
  }, [productosSeleccionados, setValue, trigger]);

  const handleProductChange = (event, newValue) => {
    const productosConCantidad = newValue.map((producto) => {
      if (typeof producto === "string") {
        return {
          id: producto,
          nombre: producto,
          cantidad: 1,
          subtotal: 0,
        };
      }

      const existente = productosSeleccionados.find(
        (p) => p.id === producto.id
      );

      return (
        existente || {
          ...producto,
          cantidad: 1,
          subtotal: (producto.precio ?? 0) * 1,
        }
      );
    });

    setProductosSeleccionados(productosConCantidad);
  };

  const actualizarCantidad = (productoId, nuevaCantidad) => {
    setProductosSeleccionados((prev) =>
      prev.map((producto) =>
        producto.id === productoId
          ? {
              ...producto,
              cantidad: nuevaCantidad,
              subtotal: producto.precio * nuevaCantidad,
            }
          : producto
      )
    );
  };

  const eliminarProducto = (productoId) => {
    setProductosSeleccionados((prev) =>
      prev.filter((p) => p.id !== productoId)
    );
    setPreciosModificados((prev) => {
      const { [productoId]: _, ...resto } = prev;
      return resto;
    });
    setProductosEditando((prev) => {
      const { [productoId]: _, ...resto } = prev;
      return resto;
    });
  };

  const handlePrecioCambio = (productoId, nuevoPrecio) => {
    setPreciosModificados((prev) => ({
      ...prev,
      [productoId]: nuevoPrecio,
    }));

    setProductosSeleccionados((prev) =>
      prev.map((producto) =>
        producto.id === productoId
          ? {
              ...producto,
              precio: nuevoPrecio,
              subtotal: nuevoPrecio * producto.cantidad,
            }
          : producto
      )
    );
  };

  const handleCancelarCambio = (productoId) => {
    const productoOriginal = listaProductos.find((p) => p.id === productoId);
    if (productoOriginal) {
      setProductosSeleccionados((prev) =>
        prev.map((producto) =>
          producto.id === productoId
            ? {
                ...producto,
                precio: productoOriginal.precio,
                subtotal: productoOriginal.precio * producto.cantidad,
              }
            : producto
        )
      );
    }

    setPreciosModificados((prev) => {
      const { [productoId]: _, ...resto } = prev;
      return resto;
    });

    setProductosEditando((prev) => ({
      ...prev,
      [productoId]: false,
    }));
  };

  const toggleEdicion = (productoId) => {
    setProductosEditando((prev) => ({
      ...prev,
      [productoId]: !prev[productoId],
    }));
  };

  const productoConStockInsuficiente = productosSeleccionados.find(
    (producto) => producto.cantidad > (producto.stock ?? 0)
  );
  const hayStockInsuficiente = Boolean(productoConStockInsuficiente);

  const getPrecioActual = (producto) => {
    return preciosModificados[producto.id] !== undefined
      ? preciosModificados[producto.id]
      : producto.precio;
  };

  const onSubmit = async (datos) => {
    if (productoConStockInsuficiente) {
      showAlert(
        "error",
        `No hay stock suficiente para "${productoConStockInsuficiente.nombre || productoConStockInsuficiente.productoId}". Stock disponible: ${productoConStockInsuficiente.stock ?? 0}, cantidad solicitada: ${productoConStockInsuficiente.cantidad}.`
      );
      return;
    }
    try {
      let totalValor = calcularTotal();
      const datosCompletos = {
        ...datos,
        total: totalValor,
        productos: productosSeleccionados.map((p) => ({
          productoId: p.id,
          nombre: p.nombre || "",
          modelo: p.modelo || "N/A",
          categoria: p.categoria || "General",
          cantidad: p.cantidad,
          precioUnitario: p.precio,
          subtotal: p.subtotal,
        })),
      };

      await crearCotizacion(datosCompletos);

      if (Object.keys(preciosModificados).length > 0) {
        Object.entries(preciosModificados).forEach(
          ([productoId, nuevoPrecio]) => {
            actualizarHistorial.mutate({ productoId, nuevoPrecio });
          }
        );
      }

      setProductosSeleccionados([]);
      setPreciosModificados({});
      setProductosEditando({});
      reset();
      onSuccess?.();

      showAlert("success", "Cotización guardada exitosamente.");

      navigate(-1);
    } catch (err) {
      showAlert(
        "error",
        `Error al guardar la cotización. Detalle: ${err.message}`
      );
      console.error("Error:", err);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 max-w-6xl mx-auto p-6"
    >
      <h2 className="text-2xl font-bold mb-6">Nueva Cotización</h2>

      <div className="p-4 rounded-lg">
        <p className="text-sm text-gray-600">
          Cliente ID: <strong className="text-blue-700">{clienteId}</strong>
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">
          Titulo de la Cotización
        </label>
        <input
          {...register("tituloCotizacion")}
          type="text"
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
        />
        {errors.tituloCotizacion && (
          <span className="text-red-500 text-sm">
            {errors.tituloCotizacion.message}
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Fecha de Entrega Estimada
          </label>
          <Controller
            name="fechaEntregaEstimado"
            control={control}
            render={({ field }) => (
              <input
                type="date"
                value={
                  field.value
                    ? new Date(field.value).toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) => {
                  const value = e.target.value;
                  field.onChange(value === "" ? null : new Date(value));
                }}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
            )}
          />
          {errors.fechaEntregaEstimado && (
            <span className="text-red-500 text-sm">
              {errors.fechaEntregaEstimado.message}
            </span>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Fecha de Entrega Real
          </label>
          <Controller
            name="fechaEntregaReal"
            control={control}
            render={({ field }) => (
              <input
                type="date"
                value={
                  field.value
                    ? new Date(field.value).toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) => {
                  const value = e.target.value;
                  field.onChange(value === "" ? null : new Date(value));
                }}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
            )}
          />
          {errors.fechaEntregaReal && (
            <span className="text-red-500 text-sm">
              {errors.fechaEntregaReal.message}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Método de Cotización *
          </label>
          <select
            {...register("metodoCotizacion")}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
          >
            {metodoCotizacion.map((metodo) => (
              <option key={metodo} value={metodo}>
                {metodo.charAt(0).toUpperCase() + metodo.slice(1)}
              </option>
            ))}
          </select>
          {errors.metodoCotizacion && (
            <span className="text-red-500 text-sm">
              {errors.metodoCotizacion.message}
            </span>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Método de Pago *
          </label>
          <select
            {...register("metodoPago")}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
          >
            {metodoPago.map((metodo) => (
              <option key={metodo} value={metodo}>
                {metodo.charAt(0).toUpperCase() + metodo.slice(1)}
              </option>
            ))}
          </select>
          {errors.metodoPago && (
            <span className="text-red-500 text-sm">
              {errors.metodoPago.message}
            </span>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Comentarios</label>
        <textarea
          {...register("comentarios")}
          placeholder="Comentarios adicionales sobre la cotización"
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
          rows="4"
        />
        {errors.comentarios && (
          <span className="text-red-500 text-sm">
            {errors.comentarios.message}
          </span>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Productos * (mínimo 1)
        </label>
        <Autocomplete
          multiple
          options={listaProductos || []}
          value={productosSeleccionados}
          onChange={handleProductChange}
          getOptionLabel={(option) => option.nombre || option}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          loading={productosLoading}
          freeSolo
          renderInput={(params) => (
            <TextField
              {...params}
              variant="outlined"
              placeholder="Buscar productos..."
              error={!!productosError}
              helperText={
                productosError || "Selecciona los productos para la cotización"
              }
            />
          )}
        />
        {errors.productos && (
          <span className="text-red-500 text-sm">
            {errors.productos.message}
          </span>
        )}
      </div>

      {productosSeleccionados.length > 0 && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <h4 className="font-semibold mb-3 text-lg">
            Productos seleccionados:
          </h4>
          <div className="space-y-3">
            {productosSeleccionados.map((producto) => (
              <div
                key={producto.id}
                className="flex flex-col gap-2 p-3 bg-white rounded-lg shadow-sm border"
              >
                {/* Fila principal del producto */}
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="font-medium">{producto.nombre || producto}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-gray-500 mt-1">
                      <span>Modelo: {producto.modelo || "N/A"}</span>
                      <span>•</span>
                      <span>Categoría: {producto.categoria || "General"}</span>
                      <span>•</span>
                      <span>${producto.precio?.toFixed(2)} c/u</span>
                      <span>•</span>
                      
                      {/* Visualizar Stock */}
                      <span className={`font-semibold ${
                        producto.stock === undefined ? 'text-gray-500' :
                        producto.stock <= 0 ? 'text-red-600' :
                        producto.stock <= 5 ? 'text-orange-600' : 
                        'text-green-600'
                      }`}>
                        Stock Físico: {producto.stock !== undefined ? producto.stock : 'N/A'}
                      </span>
                      
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Cant:</label>
                    <input
                      type="number"
                      min="1"
                      value={producto.cantidad}
                      onChange={(e) => {
                        const cantidad = parseInt(e.target.value) || 1;
                        actualizarCantidad(producto.id, cantidad);
                      }}
                      className="w-20 p-2 border rounded text-center focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {productosEditando[producto.id] ? (
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">Precio:</label>
                      <input
                        type="number"
                        step="0.01"
                        value={getPrecioActual(producto)}
                        className="w-24 p-2 border rounded text-center focus:ring-2 focus:ring-green-500"
                        onChange={(e) => {
                          const precioNuevo = parseFloat(e.target.value) || 0;
                          handlePrecioCambio(producto.id, precioNuevo);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleCancelarCambio(producto.id)}
                        className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleEdicion(producto.id)}
                        className="px-3 py-1 text-sm bg-green-500 hover:bg-green-600 text-white rounded"
                      >
                        Guardar
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => toggleEdicion(producto.id)}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                    >
                      Editar Precio
                    </button>
                  )}

                  <div className="w-28 text-right">
                    <p className="font-semibold text-lg">
                      ${producto.subtotal?.toFixed(2)}
                    </p>
                  </div>

                  <IconButton
                    onClick={() => eliminarProducto(producto.id)}
                    size="small"
                    color="error"
                    aria-label="eliminar"
                  >
                    <DeleteIcon />
                  </IconButton>
                </div>

                {/* NUEVA ALERTA DE STOCK (SOFT LIMIT) */}
                {producto.stock !== undefined && producto.cantidad > producto.stock && (
                  <div className="text-sm text-red-700 bg-red-50 border border-red-200 p-2 rounded-md flex items-center gap-2 mt-1">
                    <span>
                      <strong>⚠️ Límite de Stock Excedido:</strong> Stock disponible: <strong>{producto.stock}</strong> unidades, solicitado: <strong>{producto.cantidad}</strong>. Se requiere reabastecer para poder realizar la cotización.
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-300">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total:</span>
              <span className="text-2xl font-bold text-blue-600">
                ${calcularTotal().toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
        </div>
      )}

      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={productosSeleccionados.length === 0 || loading || hayStockInsuficiente}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
        >
          {loading ? "Guardando..." : "Guardar Cotización"}
        </button>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="px-6 py-2 border rounded-lg hover:bg-gray-50"
          disabled={loading}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}