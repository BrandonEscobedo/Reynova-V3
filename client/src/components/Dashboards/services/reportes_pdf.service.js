import {jsPDF} from "jspdf";
import autoTable from "jspdf-autotable";

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

const buildPeriodoLabel = ({fechaInicio, fechaFin}) => {
  if (!fechaInicio || !fechaFin) return "Periodo no especificado";
  return `${toDateLabel(fechaInicio)} al ${toDateLabel(fechaFin)}`;
};

const addResumenSection = (doc, data, y) => {
  const {montoTotal = 0, totalVentas = 0, ticketPromedio = 0} = data || {};

  doc.setFontSize(12);
  doc.text("Resumen General", 14, y);

  autoTable(doc, {
    startY: y + 4,
    theme: "grid",
    head: [["Indicador", "Valor"]],
    body: [
      ["Ingresos totales", toCurrency(montoTotal)],
      ["Ventas totales", String(totalVentas)],
      ["Ticket promedio", toCurrency(ticketPromedio)],
    ],
    styles: {fontSize: 10},
    headStyles: {fillColor: [30, 41, 59]},
  });

  return doc.lastAutoTable.finalY + 8;
};

const addTablaSection = (doc, {title, head, body, y}) => {
  doc.setFontSize(12);
  doc.text(title, 14, y);

  autoTable(doc, {
    startY: y + 4,
    theme: "striped",
    head: [head],
    body: body.length > 0 ? body : [["Sin datos", "-"]],
    styles: {fontSize: 9},
    headStyles: {fillColor: [51, 65, 85]},
    margin: {left: 14, right: 14},
  });

  return doc.lastAutoTable.finalY + 8;
};

export const generarPDFResumenVentas = ({
  periodo,
  fechas,
  resumenGeneral,
  ventasPorCategoria,
  topProductosIngreso,
  ventasPorDia,
}) => {
  const doc = new jsPDF({orientation: "portrait", unit: "mm", format: "a4"});

  doc.setFontSize(18);
  doc.text("Reporte de Ventas", 14, 18);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Periodo seleccionado: ${periodo}`, 14, 24);
  doc.text(`Rango analizado: ${buildPeriodoLabel(fechas)}`, 14, 29);
  doc.text(`Generado: ${DATE_FORMATTER.format(new Date())}`, 14, 34);
  doc.setTextColor(0);

  let cursorY = 42;
  cursorY = addResumenSection(doc, resumenGeneral, cursorY);

  const categoriaRows = (ventasPorCategoria || []).map((item) => [
    item.nombre || "Sin categoría",
    toCurrency(item.valor),
  ]);
  cursorY = addTablaSection(doc, {
    title: "Ventas por categoría",
    head: ["Categoría", "Monto"],
    body: categoriaRows,
    y: cursorY,
  });

  const productoRows = (topProductosIngreso || []).map((item) => [
    item.nombre || "Sin nombre",
    toCurrency(item.valor),
  ]);
  cursorY = addTablaSection(doc, {
    title: "Top productos por ingreso",
    head: ["Producto", "Ingreso"],
    body: productoRows,
    y: cursorY,
  });

  const ventasDiaRows = (ventasPorDia || []).map((item) => [
    toDateLabel(item.fecha),
    toCurrency(item.montoTotal),
  ]);
  addTablaSection(doc, {
    title: "Ventas por día",
    head: ["Fecha", "Monto"],
    body: ventasDiaRows,
    y: cursorY,
  });

  const fileLabel = sanitizeFileName(`resumen_ventas_${fechas.fechaInicio}_${fechas.fechaFin}`);
  doc.save(`${fileLabel}.pdf`);
};
