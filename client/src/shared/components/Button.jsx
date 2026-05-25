import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import * as React from 'react';

export default function ButtonUsage({ text, isLoading, disabled, ...rest }) {
  return (
    <Button 
      variant="contained" 
      color="primary"
      // ✅ FIX CRUCIAL: Asegura que el botón envíe el formulario
      type="submit" 
      disabled={disabled || isLoading}
      // Muestra el spinner de carga
      startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
      sx={{ bgcolor: "#7B2CBF", color: "white" }} 
      {...rest}
    >
      {/* El texto cambia a "Cargando..." cuando está en proceso */}
      {isLoading ? "Cargando..." : text || "Guardar"}
    </Button>
  );
}