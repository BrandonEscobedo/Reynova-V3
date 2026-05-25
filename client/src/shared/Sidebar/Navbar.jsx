import { useState } from "react";
import {
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import CategoryIcon from '@mui/icons-material/Category';
import { NavLink } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { ListItemCustom } from "./ListItem";
import { auth } from "../../firebase";
import { signOut } from "firebase/auth";

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  const { user } = useAuth();
  console.log(user);

  const toggleDrawer = () => {
    setOpen(!open);
  };

  //mover al componente de usuario
  const btnSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="flex fixed">
      {/* Botón para abrir/cerrar */}
      <IconButton
        onClick={toggleDrawer}
        className="m-2 text-blue-600 hover:bg-blue-100"
      >
        <MenuIcon />
      </IconButton>

      {/* Sidebar */}
      <Drawer
        anchor="left"
        open={open}
        onClose={toggleDrawer}
        sx={{
          "& .MuiDrawer-paper": {
            backgroundColor: "#1976d2", // Primary color
            color: "white",
            width: "16rem",
            borderRight: "none",  
          },
        }}
      >
        <div className="p-4 text-xl font-bold border-b border-blue-500 text-white">
          Reynova
        </div>
        <List className="flex flex-col flex-grow h-full">
          <ListItemCustom route={"/"} text={"Dashboard"}>
            <DashboardIcon className="text-white" />
          </ListItemCustom>

          <ListItem button component={NavLink} to="/Clientes" className="hover:bg-blue-700 rounded-md">
            <ListItemIcon>
              <PeopleIcon className="text-white" />
            </ListItemIcon>
            <ListItemText primary="Clientes" />
          </ListItem>

          <ListItem button component={NavLink} to="/Productos" className="hover:bg-blue-700 rounded-md">
            <ListItemIcon>
              <Inventory2Icon className="text-white" />
            </ListItemIcon>
            <ListItemText primary="Productos" />
          </ListItem>
          <ListItem button component={NavLink} to="/Categorias" className="hover:bg-blue-700 rounded-md">
            <ListItemIcon>
              <CategoryIcon className="text-white" />
            </ListItemIcon>
            <ListItemText primary="Categorias" />
          </ListItem>

          <div className="mt-auto -my-[8px] ">
            <div className="p-3 bg-blue-700 rounded-t-lg">
              <p className="text-sm text-blue-200">Bienvenido</p>
              <h2 className="text-md font-semibold text-white truncate">
                {user.email}
              </h2>
              {user && (
                <Button
                  onClick={btnSignOut}
                  variant="contained"
                  fullWidth
                  sx={{ 
                    mt: 2,
                    backgroundColor: '#EF4444', // Red color for logout
                    '&:hover': {
                      backgroundColor: '#DC2626',
                    },
                  }}
                >
                  Salir
                  {error && <span className="ml-2 text-xs">{error}</span>}
                </Button>
              )}
            </div>
          </div>
        </List>
      </Drawer>
    </div>
  );
}
