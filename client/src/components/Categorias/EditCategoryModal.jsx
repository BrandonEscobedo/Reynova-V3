import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogActions, DialogContent, DialogTitle, TextField, Button
} from '@mui/material';

const EditCategoryModal = ({ open, handleClose, handleUpdate, category }) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (category) {
      setName(category.nombre || '');
    }
  }, [category]);

  const onUpdate = () => {
    if (!name.trim()) return;
    handleUpdate(category.id, name);
    setName('');
    handleClose();
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Editar Categoría</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          id="name"
          label="Nombre de la Categoría"
          type="text"
          fullWidth
          variant="standard"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button onClick={onUpdate} disabled={!name.trim()}>Guardar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditCategoryModal;

