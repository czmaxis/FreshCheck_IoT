import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
} from "@mui/material";

export default function BulkConfirmDialogs({ bulkDelete, bulkResolve }) {
  return (
    <>
      <Dialog
        open={Boolean(bulkDelete.confirmScope)}
        onClose={() => bulkDelete.setConfirmScope(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Smazat v\u00fdstrahy?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {bulkDelete.confirmScope?.type === "selected"
              ? `Opravdu chcete smazat vybran\u00e9 v\u00fdstrahy? Po smaz\u00e1n\u00ed se v\u00fdstrahy nezobraz\u00ed v historii v\u00fdstrah! (${bulkDelete.confirmScope.ids.length})`
              : `Opravdu chcete smazat v\u00fdstrahy pro zvolen\u00fd rozsah? Po smaz\u00e1n\u00ed se v\u00fdstrahy nezobraz\u00ed v historii v\u00fdstrah! (${bulkDelete.confirmScope?.ids?.length ?? 0})`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => bulkDelete.setConfirmScope(null)}>
            Zru\u0161it
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
        onClose={() => bulkResolve.setConfirmScope(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Potvrdit v\u00fdstrahy?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {bulkResolve.confirmScope?.type === "selected"
              ? `Opravdu chcete potvrdit vybran\u00e9 v\u00fdstrahy? (${bulkResolve.confirmScope.ids.length})`
              : `Opravdu chcete potvrdit v\u00fdstrahy pro zvolen\u00fd rozsah? (${bulkResolve.confirmScope?.ids?.length ?? 0})`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => bulkResolve.setConfirmScope(null)}>
            Zru\u0161it
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
