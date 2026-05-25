import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProductos } from "./hooks/useProducts";
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from "@mui/material";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import { useAlert } from "../../shared/Alerts/AlertContext";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { useQueryClient } from "@tanstack/react-query";

export const DetalleProducto = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  
  // Inicializar queryClient
  const queryClient = useQueryClient();
  
  const { 
    productos: listaProductos, 
    isLoading: productosLoading,
    refetch 
  } = useProductos();

  const [confirmOpen, setConfirmOpen] = useState(false);

  const producto = React.useMemo(() => {
    if (!listaProductos) return null;
    return listaProductos.find((p) => p.id === id);
  }, [listaProductos, id]);

  const handleDelete = async () => {
    
    // Validacion para que no se pueda eliminar un producto con ventas
    if (producto.productosVendidos > 0) {
      showAlert('error', 'No se puede eliminar un producto con ventas registradas.');
      setConfirmOpen(false);
      return;
    }
    
    try {
      await deleteDoc(doc(db, "productos", id));
      
      // Invalidar caché 
      await queryClient.invalidateQueries({ queryKey: ["productos"] });
      
      showAlert('success', 'Producto eliminado con éxito.');
      navigate('/productos'); 
    } catch (error) {
      showAlert('error', 'No se pudo eliminar el producto.');
      console.error("Error al eliminar:", error);
    }
  };

  // Manejo ambos tipos de fecha
  const formatFecha = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', { 
      style: 'currency', 
      currency: 'MXN' 
    }).format(value);
  };


  if (productosLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!producto) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h5" color="error">
          Producto no encontrado
        </Typography>
        <Button 
          variant="text" 
          onClick={() => navigate('/productos')} 
          startIcon={<ArrowLeft size={18} />}
          sx={{ mt: 2 }}
        >
          Volver a Productos
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Button 
        variant="text" 
        onClick={() => navigate('/productos')} 
        startIcon={<ArrowLeft size={18} />}
        sx={{ mb: 3 }}
      >
        Volver a Productos
      </Button>

      <Box sx={{ display: 'flex', gap: 3 }}>

        {/* Panel Izquierdo */}
        <Paper elevation={3} sx={{ p: 3, flex: 2 }}>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            {producto.nombre}
          </Typography>
          <Typography variant="h6" color="primary.main" fontWeight="bold" sx={{ mb: 2 }}>
            {formatCurrency(producto.precio)}
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px 24px', mb: 3 }}>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">Categoría</Typography>
              <Typography variant="body1">{producto.categoria}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">Modelo</Typography>
              <Typography variant="body1">{producto.modelo || 'N/A'}</Typography>
            </Box>
            
            {/* productosVendidos */}
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">Unidades Vendidas</Typography>
              <Typography variant="body1">{producto.productosVendidos || 0}</Typography>
            </Box>
            
            <Box sx={{ gridColumn: '1 / -1' }}>
              <Typography variant="caption" color="text.secondary" display="block">Descripción</Typography>
              <Typography variant="body1">{producto.descripcion || 'Sin descripción.'}</Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, borderTop: '1px solid #eee', pt: 3, mt: 3, alignItems: 'center' }}>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<Edit size={18} />}
              onClick={() => navigate(`/productos/Editar/${id}`)}
            >
              Editar Producto
            </Button>
            
            <Box sx={{ position: 'relative' }}>
              <Button 
                variant="outlined" 
                color="error" 
                startIcon={<Trash2 size={18} />}
                onClick={() => setConfirmOpen(true)} 
              >
                Eliminar
              </Button>

              {confirmOpen && (
                <Paper 
                  elevation={6}
                  sx={{ 
                    position: 'absolute', 
                    top: '100%', 
                    left: 0, 
                    zIndex: 10, 
                    p: 2, 
                    mt: 1, 
                    width: '250px',
                    border: '1px solid',
                    borderColor: 'error.main'
                  }}
                >
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    ¿Estás seguro de que deseas eliminar este producto?
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button 
                      variant="contained" 
                      color="error" 
                      size="small"
                      onClick={handleDelete} 
                    >
                      Sí, eliminar
                    </Button>
                    <Button 
                      variant="outlined" 
                      color="inherit" 
                      size="small"
                      onClick={() => setConfirmOpen(false)}
                    >
                      Cancelar
                    </Button>
                  </Box>
                </Paper>
              )}
            </Box>
          </Box>
        </Paper>

        {/* Panel derecho */}
        <Paper elevation={3} sx={{ p: 3, flex: 1, minWidth: '400px' }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Historial de Precios
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Fecha</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">Precio</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {producto.historialPrecioVenta && producto.historialPrecioVenta.slice().reverse().map((hist, index) => (
                  <TableRow key={index}>
                    <TableCell>{formatFecha(hist.fecha)}</TableCell>
                    <TableCell align="right">{formatCurrency(hist.precio)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

      </Box>
    </Box>
  );
};