import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  LinearProgress,
} from "@mui/material";

export default function GroupConfirmDialog({
  open,
  action,
  groupTitle,
  groupCount,
  loading,
  progress,
  onClose,
  onConfirm,
}) {
  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>
        {action === "resolve"
          ? `Potvrdit všechny výstrahy (${groupCount})?`
          : `Smazat všechny výstrahy (${groupCount})?`}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2">
          {action === "resolve"
            ? `Všech ${groupCount} výstrah typu „${groupTitle}" bude označeno jako vyřešené.`
            : `Všech ${groupCount} výstrah typu „${groupTitle}" bude trvale smazáno a nezobrazí se v historii.`}
        </Typography>
        {progress && (
          <Box sx={{ mt: 2 }}>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="body2" color="text.secondary">
                {progress.done} / {progress.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {Math.round((progress.done / progress.total) * 100)} %
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.round((progress.done / progress.total) * 100)}
              sx={{ borderRadius: 1, height: 6 }}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Zrušit
        </Button>
        <Button
          color={action === "delete" ? "error" : "primary"}
          variant="contained"
          onClick={onConfirm}
          disabled={loading}
        >
          {action === "resolve"
            ? `Potvrdit vše (${groupCount})`
            : `Smazat vše (${groupCount})`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
