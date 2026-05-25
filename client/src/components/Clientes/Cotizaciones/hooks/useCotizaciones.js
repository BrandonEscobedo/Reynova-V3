// src/features/cotizaciones/hooks/useCotizaciones.js
import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { cotizacionesService } from "../services/cotizaciones.services";

export function useCotizaciones() {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const crearCotizacion = useCallback(async (datos) => {
    setLoading(true);
    setError(null);
    try {
      const cotizacion = await cotizacionesService.crear(datos);
      await queryClient.invalidateQueries({ queryKey: ["clientes"] });
      return cotizacion;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [queryClient]);

  const traerCotizaciones = useCallback(async (clienteId) => {
    setLoading(true);
    setError(null);

    try {
      const cotizaciones = await cotizacionesService.traerDocs(clienteId);
      console.log(cotizaciones)
      return cotizaciones;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const actualizarCotizacion = useCallback(async (id, datos) => {
    setLoading(true);
    setError(null);
    try {
      const cotizacion = await cotizacionesService.actualizar(id, datos);
      return cotizacion;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const enviarCotizacion = useCallback(async (cotizacionId, emailDestinatario) => {
    setLoading(true);
    setError(null);
    try {
      const resultado = await cotizacionesService.enviarCotizacionPorCorreo(cotizacionId, emailDestinatario);
      return resultado;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    traerCotizaciones,
    crearCotizacion,
    actualizarCotizacion,
    enviarCotizacion,
    loading,
    error,
  };
}
