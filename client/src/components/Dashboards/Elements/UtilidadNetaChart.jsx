import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line
} from 'recharts';
import { useVentasData } from '../hooks/useDashboardData';

export default function UtilidadNetaChart({ fechas }) {
  // Consumimos los datos usando TU hook existente, que maneja caché y fechas perfecto
  const { data: chartData, isLoading, isError } = useVentasData(fechas);

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Cargando análisis de rentabilidad...</div>;
  }

  if (isError || !chartData || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        No hay datos de rentabilidad para este periodo.
      </div>
    );
  }

  const processedData = chartData.map(item => {
    const margenGanancia = item.montoTotal > 0 ? (item.utilidadNeta / item.montoTotal) * 100 : 0;
    return {
      ...item,
      margenGanancia: Math.round(margenGanancia * 100) / 100,
    };
  });

  return (
    <div className="w-full h-full flex flex-col min-h-[250px]">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Ingreso Bruto vs Utilidad Neta</h3>
      <div className="flex-grow">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={processedData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis dataKey="mesDisplay" tick={{ fill: '#6B7280', fontSize: 12 }} />
            <YAxis
              tickFormatter={(value) => {
                if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
                if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
                return `$${value}`;
              }}
              tick={{ fill: '#6B7280', fontSize: 12 }}
              width={60}
            />
            <Tooltip
              formatter={(value, name) => {
                if (name === 'Margen de Ganancia') {
                  return [`${value}%`, name];
                }
                return [`$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, name];
              }}
              labelFormatter={(label) => `Mes: ${label}`}
              contentStyle={{
                borderRadius: '8px',
                border: 'none',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Legend wrapperStyle={{ paddingTop: '10px' }} />
            <Bar dataKey="montoTotal" name="Ingreso Bruto" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="utilidadNeta" name="Utilidad Neta" fill="#10B981" radius={[4, 4, 0, 0]} />
            <Line
              type="monotone"
              dataKey="margenGanancia"
              name="Margen de Ganancia"
              stroke="#F59E0B"
              strokeWidth={3}
              dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#F59E0B', strokeWidth: 2 }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}