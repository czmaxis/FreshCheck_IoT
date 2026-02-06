import React from "react";
import { Box, Typography, Button, Pagination } from "@mui/material";

export default function AlertPagination({
  totalItems,
  perPage,
  page,
  onPageChange,
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const startIndex = totalItems === 0 ? 0 : (page - 1) * perPage + 1;
  const endIndex = Math.min(page * perPage, totalItems);

  if (totalItems <= 0) return null;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1,
        mt: 2,
        px: 3,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        Zobrazeno {startIndex}–{endIndex} z {totalItems} záznamů
      </Typography>

      {totalPages > 1 && (
        <Box display="flex" alignItems="center" gap={1}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => onPageChange(1)}
            disabled={page === 1}
          >
            ⏮ První
          </Button>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, value) => onPageChange(value)}
            color="primary"
            size="small"
          />
          <Button
            size="small"
            variant="outlined"
            onClick={() => onPageChange(totalPages)}
            disabled={page === totalPages}
          >
            ⏭ Poslední
          </Button>
        </Box>
      )}
    </Box>
  );
}
