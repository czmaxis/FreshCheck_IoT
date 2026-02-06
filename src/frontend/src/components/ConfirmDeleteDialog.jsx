import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from "@mui/material";

export default function ConfirmDeleteDialog({ open, onClose, onConfirm }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Smazat výstrahu?</DialogTitle>
      <DialogContent>
        <Typography variant="body2">
          Po smazání se výstraha nezobrazí v historii výstrah. Opravdu chcete
          výstrahu smazat?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Zrušit</Button>
        <Button color="error" variant="contained" onClick={onConfirm}>
          Smazat
        </Button>
      </DialogActions>
    </Dialog>
  );
}
