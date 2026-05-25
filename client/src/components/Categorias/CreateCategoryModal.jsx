import React, { useState } from 'react';
import {
  Dialog, DialogActions, DialogContent, DialogTitle, TextField, Button
} from '@mui/material';

const CreateCategoryModal = ({ open, handleClose, handleCreate }) => {
  const [name, setName] = useState('');

  const onCreate = () => {
    handleCreate(name);
    setName('');
    handleClose();
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Crear Nueva Categoría</DialogTitle>
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
        <Button onClick={onCreate}>Crear</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateCategoryModal;
