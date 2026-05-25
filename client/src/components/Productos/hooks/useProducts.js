import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productosService } from "../services/productos.services";

export function useProductos() {
  const queryClient = useQueryClient();

  // GET - Obtener productos
  const productosQuery = useQuery({
    queryKey: ["productos"],
    queryFn: async () => {
      const productos = await productosService.getProductos();
      return productos;
    },
    staleTime: 1000 * 30, // 30 segundos - más agresivo para stock en tiempo real
    gcTime: 1000 * 60 * 10, // 10min - Cuánto tiempo mantener en caché
    refetchOnWindowFocus: false, // No recargar al volver a la pestaña
  });

  // POST - Crear producto
  const crearProducto = useMutation({
    mutationFn: async (nuevoProducto) => {
      return await productosService.crearProducto(nuevoProducto);
    },
    onSuccess: () => {
      // Invalida y recarga la lista de productos
      queryClient.invalidateQueries({ queryKey: ["productos"] });
    },
    onError: (error) => {
      console.error("Error al crear producto:", error);
    },
  });

  // PUT/PATCH - Actualizar producto
  const actualizarProducto = useMutation({
    mutationFn: async ({ id, datos }) => {
      return await productosService.actualizarProducto(id, datos);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productos"] });
    },
    onError: (error) => {
      console.error("Error al actualizar producto:", error);
    },
  });

  // DELETE - Eliminar producto
  const eliminarProducto = useMutation({
    mutationFn: async (id) => {
      return await productosService.eliminarProducto(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productos"] });
    },
    onError: (error) => {
      console.error("Error al eliminar producto:", error);
    },
  });

  // Mutation para actualizar historial de precios
  const actualizarHistorial = useMutation({
    mutationFn: async ({ productoId, nuevoPrecio }) => {
      return await productosService.crearSubcoleccionHistorial(
        productoId,
        nuevoPrecio
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productos"] });
    },
  });

  const actualizarNumeroProductosVendidos = useMutation({
    mutationFn: async ({ productoId, cantidadVenta, status }) => {
      return await productosService.updateCantidadVentas(
        productoId,
        cantidadVenta,
        status
      );
    },
    onSuccess: () => {
      console.log("actualizado")
      queryClient.invalidateQueries({ queryKey: ["productos"] });
    },
  });

  return {
    // Query
    productos: productosQuery.data,
    isLoading: productosQuery.isLoading,
    error: productosQuery.error,
    refetch: productosQuery.refetch,

    // Mutations
    crearProducto,
    actualizarNumeroProductosVendidos,
    actualizarProducto,
    eliminarProducto,
    actualizarHistorial,
  };
}
