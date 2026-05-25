import React, { useState, useEffect } from "react";
import { 
  TextField, Button, Alert, CircularProgress, Box, Paper, Typography, 
  InputAdornment, IconButton 
} from "@mui/material";
import { Visibility, VisibilityOff, Email, Lock } from '@mui/icons-material';
import { auth } from "../../firebase";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "firebase/auth";
import { useNavigate } from "react-router";

export const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Escuchar cambios de autenticacion
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setSuccess(true);
        // Redirect if user is already logged in
        navigate("/");
      } else {
        setSuccess(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const signIn = async () => {
    if (!email || !password) {
      setError("Por favor completa todos los campos");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (error) {
      setError("Credenciales inválidas. Por favor, verifica tu correo y contraseña.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      signIn();
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Columna Izquierda - Visual */}
      <Box 
        sx={{ 
          flex: 1, 
          display: { xs: 'none', md: 'block' },
          backgroundImage: 'url(https://cdn.trox.de/4f0fa554aa67cb4d/d84c6bdf27a2/v/d24f80021091/Planta_Puebla.jpg?nowebp=1)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }} 
      />

      {/* Columna Derecha - Formulario */}
      <Box 
        sx={{ 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          p: 4,
          backgroundColor: '#f0f2f5'
        }}
      >
        <Paper elevation={3} sx={{ p: 4, borderRadius: 3, maxWidth: 450, width: '100%' }}>
          <Typography variant="h4" component="h1" gutterBottom align="center" fontWeight="bold" color="primary">
            Iniciar Sesión
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Bienvenido de nuevo, por favor ingresa tus credenciales.
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <TextField
            id="email-field"
            label="Correo Electrónico"
            type="email"
            variant="outlined"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email color="action" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            id="password-field"
            label="Contraseña"
            type={showPassword ? 'text' : 'password'}
            variant="outlined"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button
            onClick={signIn}
            variant="contained"
            fullWidth
            size="large"
            sx={{ mt: 3, py: 1.5, borderRadius: 2 }}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {loading ? "Ingresando..." : "Iniciar Sesión"}
          </Button>
        </Paper>
      </Box>
    </Box>
  );
};
