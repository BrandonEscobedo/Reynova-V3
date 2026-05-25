import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { useCotizaciones } from "../hooks/useCotizaciones";

export default function EnviarCotizacionModal({ open, onClose, cotizacionId, onSuccess }) {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const { enviarCotizacion, loading, error } = useCotizaciones();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSend = async () => {
    // Validar email
    if (!email.trim()) {
      setEmailError("El correo es requerido");
      return;
    }

    if (!validateEmail(email)) {
      setEmailError("Ingresa un correo válido");
      return;
    }

    setEmailError("");

    try {
      const resultado = await enviarCotizacion(cotizacionId, email);
      if (resultado.success) {
        setEmail("");
        onSuccess?.(`Cotización enviada a ${email}`);
        onClose();
      }
    } catch (err) {
      setEmailError(err.message || "Error al enviar la cotización");
    }
  };

  const handleClose = () => {
    setEmail("");
    setEmailError("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Enviar Cotización por Correo</DialogTitle>
      <DialogContent sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField
          label="Correo Electrónico del Destinatario"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setEmailError("");
          }}
          error={!!emailError}
          helperText={emailError}
          fullWidth
          disabled={loading}
          placeholder="cliente@empresa.com"
        />
        <p style={{ fontSize: "0.875rem", color: "#666", margin: "0" }}>
          Se enviará un enlace para que el cliente pueda revisar y responder a la cotización.
        </p>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleSend}
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
          disabled={loading}
        >
          {loading ? "Enviando..." : "Enviar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
