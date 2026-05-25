import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  IconButton, 
  Box,
  Typography,
  CircularProgress,
  TextField, 
  FormControl, 
  InputLabel,   
  Select,   
  MenuItem, 
  Autocomplete, 
} from "@mui/material";
import { RefreshCcw, Eye } from "lucide-react";
import { useProductos } from "./hooks/useProducts.js"; 
import { useAlert } from "../../shared/Alerts/AlertContext";
import { getCategorias } from "../Categorias/services/categorias.services"; 

export const Products = () => {
  const { 
    productos: listaProductos, 
    isLoading: productosLoading, 
    error, 
    refetch, 
    isFetching 
  } = useProductos();

  const navigate = useNavigate();
  const { showAlert } = useAlert();

  // Estados para los filtros
  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [orden, setOrden] = useState("nombre-asc");
  const [categories, setCategories] = useState([]);

  // Cargar categorias para el filtro
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategorias();
        setCategories(data);
      } catch (error) {
        console.error("Error al cargar categorías para filtro:", error);
      }
    };
    fetchCategories();
  }, []);

  // Filtrado y ordenamiento
  const productosFiltrados = useMemo(() => {
    if (!listaProductos) return [];

    let productos = [...listaProductos];

    // Filtrar por nombre
    if (filtroNombre) {
      productos = productos.filter((prod) =>
        prod.nombre.toLowerCase().includes(filtroNombre.toLowerCase())
      );
    }

    // Filtrar por categoría
    if (filtroCategoria !== "todas") {
      productos = productos.filter((prod) => prod.categoria === filtroCategoria);
    }

    // Ordenar
    switch (orden) {
      case "nombre-asc":
        productos.sort((a, b) => a.nombre.localeCompare(b.nombre));
        break;
      case "nombre-desc":
        productos.sort((a, b) => b.nombre.localeCompare(a.nombre));
        break;
      case "precio-asc":
        productos.sort((a, b) => a.precio - b.precio);
        break;
      case "precio-desc":
        productos.sort((a, b) => b.precio - a.precio);
        break;
      // Añadir vendidos despues
      default:
        break;
    }

    return productos;
  }, [listaProductos, filtroNombre, filtroCategoria, orden]);

  if (error) return <Typography color="error">Error al cargar productos: {error.message}</Typography>;

  return (
    <div className="p-4">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Productos
        </Typography>
        <div className="flex gap-2">
          <div
            onClick={() => refetch()}
            className="p-2 border rounded-xl border-blue-700 cursor-pointer"
          >
            <RefreshCcw
              className={`transition-transform duration-300 ${
                isFetching ? "animate-spin text-blue-700" : "hover:rotate-180"
              }`}
              size={24}
            />
          </div>
          <Button variant="contained" onClick={() => navigate("/productos/Nuevo")}>
            Nuevo Producto
          </Button>
        </div>
      </Box>

      {/* Barra de filtros */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, alignItems: 'center', backgroundColor: '#f9f9f9' }}>
        
        <Autocomplete
          freeSolo 
          options={listaProductos || []}
          getOptionLabel={(option) => option.nombre || option}
          value={filtroNombre}
          onInputChange={(event, newInputValue) => {
            setFiltroNombre(newInputValue);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Buscar por nombre..."
              variant="outlined"
              size="small"
            />
          )}
          sx={{ flex: 1 }}
        />

        <Autocomplete
          options={categories} 
          getOptionLabel={(option) => option.nombre} 
          value={categories.find(c => c.nombre === filtroCategoria) || null}
          onChange={(event, newValue) => {
            setFiltroCategoria(newValue ? newValue.nombre : "todas");
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Categoría"
              variant="outlined"
              size="small"
            />
          )}
          sx={{ minWidth: 200 }}
        />

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Ordenar por</InputLabel>
          <Select
            value={orden}
            label="Ordenar por"
            onChange={(e) => setOrden(e.target.value)}
          >
            <MenuItem value="nombre-asc">Nombre (A-Z)</MenuItem>
            <MenuItem value="nombre-desc">Nombre (Z-A)</MenuItem>
            <MenuItem value="precio-asc">Precio (Menor a Mayor)</MenuItem>
            <MenuItem value="precio-desc">Precio (Mayor a Menor)</MenuItem>
            {/* Añadir vendidos-desc en el futuro */}
          </Select>
        </FormControl>
      </Paper>
      {/* Fin de barra de filtros */}


      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="tabla de productos">
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Nombre</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Categoría</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Modelo</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="right">Costo</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="right">Precio</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="right">Stock</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="right">Vendidos</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {productosLoading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : (
              // Usamos 'productosFiltrados'
              productosFiltrados.map((product) => (
                <TableRow
                  key={product.id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { backgroundColor: '#fafafa' } }}
                >
                  <TableCell component="th" scope="row">{product.nombre}</TableCell>
                  <TableCell>{product.categoria}</TableCell>
                  <TableCell>{product.modelo || 'N/A'}</TableCell>
                  {/* Nuevas celdas con datos */}
                  <TableCell align="right">
                    {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(product.costo_adquisicion || 0)}
                  </TableCell>
                  <TableCell align="right">
                    {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(product.precio)}
                  </TableCell>
                  <TableCell align="right">
                    <span className={`font-bold ${product.stock <= 5 ? 'text-red-500' : 'text-green-600'}`}>
                       {product.stock || 0}
                    </span>
                  </TableCell>

                  <TableCell align="right">
                    {product.productosVendidos || 0}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton 
                      color="primary" 
                      onClick={() => navigate(`/productos/${product.id}`)}
                      aria-label="ver detalles"
                    >
                      <Eye />
                    </IconButton>
                    
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};