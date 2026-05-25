import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Route, Routes, Outlet } from "react-router";

import { Login } from "./components/Login/Login";
// import { MainView } from "./shared/pages/mainView"; // (Ya no se usa)
import { Layout } from "./shared/pages/layout";
import { AuthProvider } from "./shared/Providers/AuthProvider";
import { FormClientInsert } from "./components/Clientes/FormClientInsert";
import { Clients } from "./components/Clientes/Clients";
import { DetalleCliente } from "./components/Clientes/DetalleCliente";
import { Products } from "./components/Productos/Products";
import { FormProductInsert as FormProductInsertProduct } from "./components/Productos/FormProductInsert";
import { FormProductUpdate } from "./components/Productos/FormProductUpdate";
import { FormClientUpdate } from "./components/Clientes/FormClientUpdate";
import { Cotizaciones } from "./components/Clientes/Cotizaciones/Cotizaciones";
import FormularioCotizacion from "./components/Clientes/Cotizaciones/components/FormularioCotizacion";
import { AlertProvider } from "./shared/Alerts/AlertContext";
import CategoriasPage from "./components/Categorias/CategoriasPage";
import FormularioUpdateCotizaciones from "./components/Clientes/Cotizaciones/components/FormularioUpdateCotizaciones";
import { DetalleProducto } from "./components/Productos/DetalleProducto";
import { Dashboard } from "./components/Dashboards/Dashboard"; 
import VistaPublicaCotizacion from "./components/Clientes/Cotizaciones/pages/VistaPublicaCotizacion";

const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AlertProvider>
        <Routes>
          {/* RUTA PÚBLICA (Fuera del AuthProvider) */}
          <Route path="/cotizacion/:id" element={<VistaPublicaCotizacion />} />

          {/* RUTAS PROTEGIDAS Y LOGIN (Envueltas en AuthProvider) */}
          <Route
            element={
              <AuthProvider>
                <Outlet />
              </AuthProvider>
            }
          >
            {/* Ruta sin sidebar */}
            <Route path="/login" element={<Login />} />

            {/* Rutas con sidebar */}
            <Route element={<Layout />}>
              
              {/* --- Rutas Principales --- */}
              <Route path="/menu" element={<Dashboard />} />
              <Route path="/" element={<Dashboard />} />

              {/* --- Rutas Clientes --- */}
              <Route path="/clientes" element={<Clients />} />
              <Route path="/clientes/Nuevo" element={<FormClientInsert />} />
              <Route
                path="/clientes/Editar/:id"
                element={<FormClientUpdate />}
              />
              <Route path="/clientes/:clienteId" element={<DetalleCliente />} />
              <Route
                path="/clientes/:clienteId/cotizaciones"
                element={<Cotizaciones />}
              />
              {/* La línea de error ya fue eliminada de aquí */}
              <Route
                path="/clientes/:clienteId/cotizaciones/nuevo"
                element={<FormularioCotizacion />}
              />{" "}
              <Route
                path="/clientes/:clienteId/cotizaciones/editar"
                element={<FormularioUpdateCotizaciones />}
              />
              
              {/* --- Rutas Productos --- */}
              <Route path="/productos" element={<Products />} />
              <Route
                path="/productos/Nuevo"
                element={<FormProductInsertProduct />}
              />
              <Route
                path="/productos/Editar/:id"
                element={<FormProductUpdate />}
              />
              <Route path="/categorias" element={<CategoriasPage />} />
              <Route
                path="/productos/:id"
                element={<DetalleProducto />}
              />
              
            </Route>
          </Route>
        </Routes>
      </AlertProvider>
    </ThemeProvider>
  );
}
export default App;