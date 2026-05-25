import {useState, useMemo} from "react";
import {
  PieChart,
  Pie,
  Sector,
  Cell,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {useCategoriasData} from "../hooks/useDashboardData";

const renderActiveShape = (props) => {
  const RADIAN = Math.PI / 180;
  const {
    cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, percent, value,
  } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? "start" : "end";

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} fontWeight="bold">
        {payload.nombre}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path
        d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
        stroke={fill}
        fill="none"
      />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
        textAnchor={textAnchor}
        fill="#333"
      >{`$${value.toLocaleString()}`}</text>
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
        dy={18}
        textAnchor={textAnchor}
        fill="#999"
      >
        {`(${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};

export function VentasCategoriaChart({fechas}) {
  const {data, isLoading, isError, error} = useCategoriasData(fechas);
  const [activeIndex, setActiveIndex] = useState(0);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    let processedData = [...data].sort((a, b) => b.valor - a.valor);

    if (processedData.length > 6) {
      const top5 = processedData.slice(0, 5);
      const resto = processedData.slice(5);
      const valorOtros = resto.reduce((sum, item) => sum + item.valor, 0);
      processedData = [...top5, {nombre: "Otros", valor: valorOtros}];
    }

    const otrosIndex = processedData.findIndex(item => item.nombre === "Otros");
    if (otrosIndex !== -1) {
      const [otrosItem] = processedData.splice(otrosIndex, 1);
      processedData.push(otrosItem);
    }

    return processedData;
  }, [data]);

  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  const onLegendEnter = (e) => {
    const index = chartData.findIndex((d) => d.nombre === e.value);
    setActiveIndex(index);
  };

  if (isLoading) {
    return (
      <div style={{height: 300, display: "flex", alignItems: "center"}}>
        <p className="w-full text-center">Cargando datos...</p>
      </div>
    );
  }

  if (isError) {
    return <p style={{color: "red"}}>Error: {error.message}</p>;
  }

  return (
    <>
      <h3 style={{fontSize: "1rem", fontWeight: 600, color: "#333"}}>
        Ventas por categoría
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            fill="#8884d8"
            dataKey="valor"
            nameKey="nombre"
            onMouseEnter={onPieEnter}
          >
            {chartData.map((entry, index) => {
              let color;
              if (entry.nombre === "Otros") {
                color = "#000000";
              } else {
                color = COLORS[index % COLORS.length];
              }
              return <Cell key={`cell-${index}`} fill={color} />;
            })}
          </Pie>
          <Legend
            onMouseEnter={onLegendEnter}
            wrapperStyle={{cursor: "pointer", paddingTop: "20px"}}
          />
        </PieChart>
      </ResponsiveContainer>
    </>
  );
}