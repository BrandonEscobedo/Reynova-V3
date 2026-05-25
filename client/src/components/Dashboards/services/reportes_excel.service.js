import * as XLSX from "xlsx";

const MXN_FORMATTER = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
});

const DATE_FORMATTER = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const toCurrency = (value) => MXN_FORMATTER.format(Number(value || 0));

const toDateLabel = (value) => {
  if (!value) return "-";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return DATE_FORMATTER.format(date);
};

const sanitizeFileName = (name) =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]/g, "_");

const addSheet = (workbook, name, rows) => {
  const sheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, sheet, name);
};

export const generarExcelResumenVentas = ({
  periodo,
  fechas,
  resumenGeneral,
  ventasPorCategoria,
  topProductosIngreso,
  ventasPorDia,
}) => {
  const workbook = XLSX.utils.book_new();

  const resumenRows = [
    {
      Indicador: "Periodo seleccionado",
      Valor: periodo,
    },
    {
      Indicador: "Fecha inicio",
      Valor: toDateLabel(fechas?.fechaInicio),
    },
    {
      Indicador: "Fecha fin",
      Valor: toDateLabel(fechas?.fechaFin),
    },
    {
      Indicador: "Ingresos totales",
      Valor: toCurrency(resumenGeneral?.montoTotal),
    },
    {
      Indicador: "Ventas totales",
      Valor: Number(resumenGeneral?.totalVentas || 0),
    },
    {
      Indicador: "Ticket promedio",
      Valor: toCurrency(resumenGeneral?.ticketPromedio),
    },
  ];

  const categoriasRows = (ventasPorCategoria || []).map((item) => ({
    Categoria: item.nombre || "Sin categoria",
    Monto: Number(item.valor || 0),
    MontoFormateado: toCurrency(item.valor),
  }));

  const productosRows = (topProductosIngreso || []).map((item) => ({
    Producto: item.nombre || "Sin nombre",
    Ingreso: Number(item.valor || 0),
    IngresoFormateado: toCurrency(item.valor),
  }));

  const ventasDiaRows = (ventasPorDia || []).map((item) => ({
    Fecha: toDateLabel(item.fecha),
    Monto: Number(item.montoTotal || 0),
    MontoFormateado: toCurrency(item.montoTotal),
  }));

  addSheet(workbook, "Resumen", resumenRows);
  addSheet(workbook, "Categorias", categoriasRows.length > 0 ? categoriasRows : [{Info: "Sin datos"}]);
  addSheet(workbook, "TopProductos", productosRows.length > 0 ? productosRows : [{Info: "Sin datos"}]);
  addSheet(workbook, "VentasPorDia", ventasDiaRows.length > 0 ? ventasDiaRows : [{Info: "Sin datos"}]);

  const fileLabel = sanitizeFileName(
    `resumen_ventas_${fechas?.fechaInicio || "inicio"}_${fechas?.fechaFin || "fin"}`,
  );

  XLSX.writeFile(workbook, `${fileLabel}.xlsx`);
};
