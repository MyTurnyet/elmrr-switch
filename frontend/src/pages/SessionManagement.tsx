import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  Paper,
  Grid,
} from '@mui/material';
import {
  PlayArrow,
  Undo,
  Edit,
  CalendarToday,
  Info,
} from '@mui/icons-material';
import { useApp } from '../contexts/AppContext';

const SessionManagement: React.FC = () => {
  const {
    currentSession,
    sessionLoading,
    error,
    fetchCurrentSession,
    advanceSession,
    rollbackSession,
    updateSessionDescription,
  } = useApp();

  const [descriptionDialogOpen, setDescriptionDialogOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'advance' | 'rollback' | null>(null);

  useEffect(() => {
    fetchCurrentSession();
  }, [fetchCurrentSession]);

  useEffect(() => {
    if (currentSession?.description) {
      setDescription(currentSession.description);
    }
  }, [currentSession]);

  const handleOpenDescriptionDialog = () => {
    setDescription(currentSession?.description || '');
    setDescriptionDialogOpen(true);
  };

  const handleCloseDescriptionDialog = () => {
    setDescriptionDialogOpen(false);
  };

  const handleSaveDescription = async () => {
    try {
      await updateSessionDescription(description);
      setDescriptionDialogOpen(false);
    } catch (err) {
      // Error is handled by AppContext
    }
  };

  const handleOpenConfirmDialog = (action: 'advance' | 'rollback') => {
    setConfirmAction(action);
    setConfirmDialogOpen(true);
  };

  const handleCloseConfirmDialog = () => {
    setConfirmDialogOpen(false);
    setConfirmAction(null);
  };

  const handleConfirmAction = async () => {
    try {
      if (confirmAction === 'advance') {
        await advanceSession();
      } else if (confirmAction === 'rollback') {
        await rollbackSession();
      }
      setConfirmDialogOpen(false);
      setConfirmAction(null);
    } catch (err) {
      // Error is handled by AppContext
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (sessionLoading && !currentSession) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  const canRollback = currentSession && currentSession.currentSessionNumber > 1 && currentSession.previousSessionSnapshot;

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
        Session Management
      </Typography>

      {/* Current Session Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box>
              <Typography variant="h5" gutterBottom>
                Current Operating Session
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Manage your operating session progression
              </Typography>
            </Box>
            <Chip
              label={`Session ${currentSession?.currentSessionNumber || 1}`}
              color="primary"
              size="large"
              sx={{ fontSize: '1.1rem', py: 2.5, px: 1 }}
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Box display="flex" alignItems="center" mb={1}>
                  <CalendarToday sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="subtitle2" color="textSecondary">
                    Session Date
                  </Typography>
                </Box>
                <Typography variant="body1">
                  {currentSession?.sessionDate ? formatDate(currentSession.sessionDate) : 'Not set'}
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Box display="flex" alignItems="center" mb={1}>
                  <Info sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="subtitle2" color="textSecondary">
                    Description
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Typography variant="body1" sx={{ flex: 1 }}>
                    {currentSession?.description || 'No description'}
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<Edit />}
                    onClick={handleOpenDescriptionDialog}
                  >
                    Edit
                  </Button>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          <Box mt={3} display="flex" gap={2} flexWrap="wrap">
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={<PlayArrow />}
              onClick={() => handleOpenConfirmDialog('advance')}
              disabled={sessionLoading}
            >
              Advance to Next Session
            </Button>
            <Button
              variant="outlined"
              color="warning"
              size="large"
              startIcon={<Undo />}
              onClick={() => handleOpenConfirmDialog('rollback')}
              disabled={sessionLoading || !canRollback}
            >
              Rollback to Previous Session
            </Button>
          </Box>

          {!canRollback && currentSession && (
            <Alert severity="info" sx={{ mt: 2 }}>
              {currentSession.currentSessionNumber === 1
                ? 'Cannot rollback from session 1'
                : 'No previous session snapshot available'}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Session Information */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Session Operations
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            <strong>Advance Session:</strong> Creates a snapshot of the current state, increments the session number,
            updates car locations, deletes completed trains, and reverts cars from active trains.
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            <strong>Rollback Session:</strong> Restores the previous session state from the snapshot, including car
            locations, trains, and car orders. This operation can only be performed if a previous session snapshot exists.
          </Typography>
          <Typography variant="body2" color="textSecondary">
            <strong>Note:</strong> Session operations affect all trains, car orders, and car locations. Make sure to
            complete or cancel all trains before advancing to the next session.
          </Typography>
        </CardContent>
      </Card>

      {/* Description Edit Dialog */}
      <Dialog open={descriptionDialogOpen} onClose={handleCloseDescriptionDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Session Description</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Description"
            type="text"
            fullWidth
            multiline
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter a description for this session..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDescriptionDialog}>Cancel</Button>
          <Button onClick={handleSaveDescription} variant="contained" disabled={sessionLoading}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={handleCloseConfirmDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {confirmAction === 'advance' ? 'Advance Session?' : 'Rollback Session?'}
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            {confirmAction === 'advance' ? (
              <>
                <Typography variant="body2" gutterBottom>
                  <strong>This will:</strong>
                </Typography>
                <Typography variant="body2" component="div">
                  • Create a snapshot of the current session<br />
                  • Advance to session {(currentSession?.currentSessionNumber || 1) + 1}<br />
                  • Update car locations based on completed trains<br />
                  • Delete all completed trains<br />
                  • Revert cars from active trains to their original locations
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="body2" gutterBottom>
                  <strong>This will:</strong>
                </Typography>
                <Typography variant="body2" component="div">
                  • Restore session {(currentSession?.currentSessionNumber || 1) - 1}<br />
                  • Restore all car locations from the snapshot<br />
                  • Restore all trains from the snapshot<br />
                  • Restore all car orders from the snapshot
                </Typography>
              </>
            )}
          </Alert>
          <Typography variant="body2" color="textSecondary">
            Are you sure you want to continue?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog}>Cancel</Button>
          <Button
            onClick={handleConfirmAction}
            variant="contained"
            color={confirmAction === 'advance' ? 'primary' : 'warning'}
            disabled={sessionLoading}
          >
            {confirmAction === 'advance' ? 'Advance' : 'Rollback'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SessionManagement;
