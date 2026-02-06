import React from "react";
import { Button } from "@mui/material";

export default function AlertActions({ isResolved, onResolve, onRestore, onDelete }) {
  return (
    <>
      {isResolved ? (
        <Button variant="outlined" size="small" onClick={onRestore}>
          Obnovit
        </Button>
      ) : (
        <Button variant="contained" size="small" onClick={onResolve}>
          Potvrdit
        </Button>
      )}
      <Button variant="outlined" size="small" color="error" onClick={onDelete}>
        smazat
      </Button>
    </>
  );
}
