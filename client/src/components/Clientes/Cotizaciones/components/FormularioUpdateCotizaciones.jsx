import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CrearCotizacionSchema } from "../schemas/cotizacion.schemas";
import { useCotizaciones } from "../hooks/useCotizaciones";
import { useLocation, useNavigate, useParams } from "react-router";
import { useAlert } from "../../../../shared/Alerts/AlertContext";
import { useEffect, useState } from "react";
import { Autocomplete, TextField, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useProductos } from "../../../Productos/hooks/useProducts.js";
import { metodoCotizacion, metodoPago } from "../constants/metodosPago";
import { useQueryClient } from "@tanstack/react-query";

export default function FormularioUpdateCotizaciones({ onSuccess }) {
  const { clienteId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    productos: listaProductos = [],
    actualizarHistorial,
    actualizarNumeroProductosVendidos,
    isLoading: productosLoading,
    error: productosError,
  } = useProductos();
  const location = useLocation();
  const { cotizacionEditar } = location.state || {
    productos: [],
    tituloCotizacion: "",
    metodoCotizacion: "",
    status: "",
    metodoPago: "",
    comentarios: "",
    fechaEntregaEstimado: null,
    fechaEntregaReal: null,
  };
  const convertirTimestamp = (timestamp) => {
    if (!timestamp || !timestamp.seconds) return null; 
    return new Date(timestamp.seconds * 1000); 
  };

  const fechaEntregaEstimadaInput = convertirTimestamp(
    cotizacionEditar.fechaEntregaEstimado
  );
  const fechaEntregaRealInput = convertirTimestamp(
    cotizacionEditar.fechaEntregaReal
  );
  console.log(`log del state ${fechaEntregaRealInput}`);

  const { actualizarCotizacion, loading, error } = useCotizaciones();
  const [preciosModificados, setPreciosModificados] = useState(() => {
    const precios = {};
    (cotizacionEditar?.productos || []).forEach((producto) => {
      const productoOriginal = listaProductos.find(
        (p) => p.id === producto.productoId
      );
      if (
        productoOriginal &&
        producto.precioUnitario !== productoOriginal.precio
      ) {
        precios[producto.productoId] = producto.precioUnitario;
      }
    });
    return precios;
  });
  const [productosEditando, setProductosEditando] = useState({});
  const { showAlert } = useAlert();
  const [productosSeleccionados, setProductosSeleccionados] = useState(() => {
    return (cotizacionEditar?.productos || []).map((producto) => ({
      id: producto.productoId,
      nombre: producto.nombre,
      modelo: producto.modelo || "N/A",
      categoria: producto.categoria || "General",
      cantidad: producto.cantidad,
      precio: producto.precioUnitario,
      subtotal: producto.subtotal,
    }));
  });

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
    trigger,
    control,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(CrearCotizacionSchema),
    defaultValues: {
      clienteId: clienteId,
      tituloCotizacion: cotizacionEditar.tituloCotizacion,
      fechaEntregaEstimado: fechaEntregaEstimadaInput,
      fechaEntregaReal: fechaEntregaRealInput,
      metodoCotizacion: cotizacionEditar.metodoCotizacion,
      status: cotizacionEditar.status,
      metodoPago: cotizacionEditar.metodoPago,
      comentarios: cotizacionEditar.comentarios,
      productos: cotizacionEditar.productos,
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
    const productosConCantidad = newValue
      .map((producto) => {
        if (typeof producto === "string") {
          // Ignorar strings de freeSolo
          console.warn("⚠️ Producto de texto libre ignorado:", producto);
          return null;
        }

        // Buscar si el producto ya existe en la selección actual
        const existente = productosSeleccionados.find(
          (p) => p.id === producto.id
        );

        if (existente) {
          // Mantener el estado actual (cantidad, precio modificado, subtotal)
          return existente;
        }

        // Si es un producto nuevo, verificar si tiene precio modificado guardado
        const precioModificado = preciosModificados[producto.id];
        const precioFinal =
          precioModificado !== undefined ? precioModificado : producto.precio;

        return {
          id: producto.id,
          nombre: producto.nombre,
          modelo: producto.modelo || "N/A",
          categoria: producto.categoria || "General",
          cantidad: 1,
          precio: precioFinal,
          subtotal: precioFinal * 1,
        };
      })
      .filter(Boolean); // Eliminar valores null

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

    // Limpiar precio modificado para este producto
    setPreciosModificados((prev) => {
      const nuevo = { ...prev };
      delete nuevo[productoId];
      return nuevo;
    });

    // Limpiar modo edición para este producto
    setProductosEditando((prev) => {
      const nuevo = { ...prev };
      delete nuevo[productoId];
      return nuevo;
    });
  };

  const handlePrecioCambio = (productoId, nuevoPrecio) => {
    // Validar que el precio sea un número positivo
    const precio = Math.max(0, parseFloat(nuevoPrecio) || 0);

    // Actualizar el registro de precios modificados
    setPreciosModificados((prev) => ({
      ...prev,
      [productoId]: precio,
    }));

    // Actualizar el precio y subtotal del producto en la lista
    setProductosSeleccionados((prev) =>
      prev.map((producto) =>
        producto.id === productoId
          ? {
              ...producto,
              precio: precio,
              subtotal: precio * producto.cantidad,
            }
          : producto
      )
    );
  };
  const handleCancelarCambio = (productoId) => {
    // Buscar el precio original del producto
    const productoOriginal = listaProductos.find((p) => p.id === productoId);

    if (productoOriginal) {
      // Restaurar precio original del catálogo
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

      // Eliminar el precio modificado
      setPreciosModificados((prev) => {
        const nuevo = { ...prev };
        delete nuevo[productoId];
        return nuevo;
      });
    } else {
      // Si no se encuentra el producto original, solo cerrar el modo edición
      console.warn("⚠️ No se encontró el producto original en el catálogo");
    }

    // Desactivar modo edición
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

  const getPrecioActual = (producto) => {
    return preciosModificados[producto.id] !== undefined
      ? preciosModificados[producto.id]
      : producto.precio;
  };

  const onSubmit = async (datos) => {
    try {
      let totalValor = calcularTotal();

      const datosCompletos = {
        ...datos,
        fechaEntregaEstimado: datos.fechaEntregaEstimado,
        fechaEntregaReal: datos.fechaEntregaReal,
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

      await actualizarCotizacion(cotizacionEditar.id, datosCompletos);
      
      // Esperar a que se completen las actualizaciones de stock de productos
      if (datosCompletos.status === "aprobada") {
        await Promise.all(
          productosSeleccionados.map((product) =>
            actualizarNumeroProductosVendidos.mutateAsync({
              productoId: product.id,
              cantidadVenta: product.cantidad,
              status: datosCompletos.status,
            })
          )
        );
      }

      // Actualizar historial de precios si hay cambios
      if (Object.keys(preciosModificados).length > 0) {
        await Promise.all(
          Object.entries(preciosModificados).map(([productoId, nuevoPrecio]) =>
            actualizarHistorial.mutateAsync({ productoId, nuevoPrecio })
          )
        );
      }

      // Invalidar query de productos DESPUÉS de que se completen las mutaciones
      // Esto asegura que se refetchen los datos más recientes
      await queryClient.invalidateQueries({ 
        queryKey: ["productos"],
        refetchType: 'all'
      });
      await queryClient.invalidateQueries({ 
        queryKey: ["dashboardData"],
        refetchType: 'all'
      });

      setProductosSeleccionados([]);
      setPreciosModificados({});
      setProductosEditando({});
      reset();
      onSuccess?.();

      showAlert("success", "Cotización actualizada exitosamente.");
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
      onSubmit={(e) => {
        e.preventDefault();
        console.log("=== DEBUG SUBMIT ===");
        console.log("1. Event:", e);
        console.log("2. Productos seleccionados:", productosSeleccionados);
        console.log("3. Errores:", errors);
        console.log("4. Form válido:", Object.keys(errors).length === 0);
        console.log(calcularTotal());
        handleSubmit(
          (data) => {
            console.log("✅ Validación exitosa, data:", data);
            onSubmit(data);
          },
          (errors) => {
            console.log("❌ Errores de validación:", errors);
          }
        )(e);
      }}
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
            defaultValue={
              fechaEntregaEstimadaInput
                ? new Date(fechaEntregaEstimadaInput)
                : null
            }
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
            defaultValue={fechaEntregaRealInput ?? ""}
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
          <div className="space-y-2">
            {productosSeleccionados.map((producto) => (
              <div
                key={producto.id}
                className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm"
              >
                <div className="flex-1">
                  <p className="font-medium">{producto.nombre || producto}</p>
                  <div className="flex gap-3 text-sm text-gray-500">
                    <span>Modelo: {producto.modelo || "N/A"}</span>
                    <span>•</span>
                    <span>Categoría: {producto.categoria || "General"}</span>
                    <span>•</span>
                    <span>${producto.precio?.toFixed(2)} c/u</span>
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
          disabled={productosSeleccionados.length === 0 || loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
        >
          {loading ? "Guardando..." : "Guardar Cotización"}
        </button>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-6 py-2 border rounded-lg hover:bg-gray-50"
          disabled={loading}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
