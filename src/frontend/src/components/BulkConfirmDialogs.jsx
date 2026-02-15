import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  LinearProgress,
  Box,
} from "@mui/material";

function ProgressInfo({ progress }) {
  if (!progress) return null;
  const percent = Math.round((progress.done / progress.total) * 100);

  return (
    <Box sx={{ mt: 2 }}>
      <Box display="flex" justifyContent="space-between" mb={0.5}>
        <Typography variant="body2" color="text.secondary">
          {progress.done} / {progress.total}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {percent} %
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={percent}
        sx={{ borderRadius: 1, height: 6 }}
      />
    </Box>
  );
}

export default function BulkConfirmDialogs({ bulkDelete, bulkResolve }) {
  return (
    <>
      <Dialog
        open={Boolean(bulkDelete.confirmScope)}
        onClose={bulkDelete.loading ? undefined : () => bulkDelete.setConfirmScope(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Smazat výstrahy?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {bulkDelete.confirmScope?.type === "selected"
              ? `Opravdu chcete smazat vybrané výstrahy? Po smazání se výstrahy nezobrazí v historii výstrah! (${bulkDelete.confirmScope.ids.length})`
              : `Opravdu chcete smazat výstrahy pro zvolený rozsah? Po smazání se výstrahy nezobrazí v historii výstrah! (${bulkDelete.confirmScope?.ids?.length ?? 0})`}
          </Typography>
          <ProgressInfo progress={bulkDelete.progress} />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => bulkDelete.setConfirmScope(null)}
            disabled={bulkDelete.loading}
          >
            Zrušit
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={bulkDelete.confirmAction}
            disabled={bulkDelete.loading}
          >
            Smazat
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(bulkResolve.confirmScope)}
        onClose={bulkResolve.loading ? undefined : () => bulkResolve.setConfirmScope(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Potvrdit výstrahy?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {bulkResolve.confirmScope?.type === "selected"
              ? `Opravdu chcete potvrdit vybrané výstrahy? (${bulkResolve.confirmScope.ids.length})`
              : `Opravdu chcete potvrdit výstrahy pro zvolený rozsah? (${bulkResolve.confirmScope?.ids?.length ?? 0})`}
          </Typography>
          <ProgressInfo progress={bulkResolve.progress} />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => bulkResolve.setConfirmScope(null)}
            disabled={bulkResolve.loading}
          >
            Zrušit
          </Button>
          <Button
            color="primary"
            variant="contained"
            onClick={bulkResolve.confirmAction}
            disabled={bulkResolve.loading}
          >
            Potvrdit
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
