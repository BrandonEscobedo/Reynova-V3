import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "../services/dashboard_services.js";

const getDashboardQueryKey = (fechas) => [
  "mainDashboard",
  fechas?.fechaInicio,
  fechas?.fechaFin,
];

const dashboardQueryFn = (fechas) => () =>
  dashboardService.getDashboardData(fechas);

const queryConfig = {
  staleTime: 1000 * 60 * 5,
  refetchOnWindowFocus: false,
};


export const useResumenData = (fechas) => {
  return useQuery({
    queryKey: getDashboardQueryKey(fechas),
    queryFn: dashboardQueryFn(fechas),
    ...queryConfig,
    select: (data) => data.resumenGeneral || {},
  });
};

export const useVentasData = (fechas) => {
  return useQuery({
    queryKey: getDashboardQueryKey(fechas),
    queryFn: dashboardQueryFn(fechas),
    ...queryConfig,
    select: (data) => data.ventasPorMes || [],
  });
};

export const useVentasDiaData = (fechas) => {
  return useQuery({
    queryKey: getDashboardQueryKey(fechas),
    queryFn: dashboardQueryFn(fechas),
    ...queryConfig,
    select: (data) => data.ventasPorDia || [],
  });
};

export const useClientesData = (fechas) => {
  return useQuery({
    queryKey: getDashboardQueryKey(fechas),
    queryFn: dashboardQueryFn(fechas),
    ...queryConfig,
    select: (data) => data.ventasPorCliente || [],
  });
};

export const useProductosData = (fechas) => {
  return useQuery({
    queryKey: getDashboardQueryKey(fechas),
    queryFn: dashboardQueryFn(fechas),
    ...queryConfig,
    select: (data) => data.topProductosCant || [],
  });
};

export const useProductosIngresoData = (fechas) => {
  return useQuery({
    queryKey: getDashboardQueryKey(fechas),
    queryFn: dashboardQueryFn(fechas),
    ...queryConfig,
    select: (data) => data.topProductosIngreso || [],
  });
};

export const useCategoriasData = (fechas) => {
  return useQuery({
    queryKey: getDashboardQueryKey(fechas),
    queryFn: dashboardQueryFn(fechas),
    ...queryConfig,
    select: (data) => data.ventasPorCategoria || [],
  });
};

export const useModelosData = (fechas) => {
  return useQuery({
    queryKey: getDashboardQueryKey(fechas),
    queryFn: dashboardQueryFn(fechas),
    ...queryConfig,
    select: (data) => data.topModelos || [],
  });
};

export const useMetodosPagoData = (fechas) => {
  return useQuery({
    queryKey: getDashboardQueryKey(fechas),
    queryFn: dashboardQueryFn(fechas),
    ...queryConfig,
    select: (data) => data.graficaMetodosPago || [],
  });
};

export const useCotizacionesData = (fechas) => {
  return useQuery({
    queryKey: getDashboardQueryKey(fechas),
    queryFn: dashboardQueryFn(fechas),
    ...queryConfig,
    select: (data) => data.resumenGeneral || {},
  });
};

export const useCreditosData = (fechas) => {

  return useQuery({
    queryKey: getDashboardQueryKey(fechas),
    queryFn: dashboardQueryFn(fechas),
    ...queryConfig,
    select: (data) => data.ventasPorCliente || [],
  });
};

export const useClientesStatusData = () => {
  return useQuery({
    queryKey: ["clientesStatus"],
    queryFn: dashboardService.getClientesStatus,
    staleTime: 1000 * 60 * 10, 
  });
};