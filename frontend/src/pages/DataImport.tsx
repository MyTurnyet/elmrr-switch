import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  TextField,
  Grid,
  Chip,
} from '@mui/material';
import {
  CloudUpload,
  FileUpload,
  CheckCircle,
  Error,
  Warning,
} from '@mui/icons-material';
import { useApp } from '../contexts/AppContext';

const DataImport: React.FC = () => {
  const { importData, loading } = useApp();
  const [importResult, setImportResult] = useState<any>(null);
  const [jsonInput, setJsonInput] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          setJsonInput(content);
        } catch (error) {
          console.error('Error reading file:', error);
        }
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleImport = async () => {
    try {
      if (!jsonInput.trim()) {
        setImportResult({
          success: false,
          error: 'No data to import',
        });
        return;
      }

      const data = JSON.parse(jsonInput);
      const result = await importData(data);
      setImportResult({
        success: true,
        data: result,
      });
    } catch (error) {
      setImportResult({
        success: false,
        error: error instanceof Error ? error.message : 'Import failed',
      });
    }
  };

  const handleClear = () => {
    setJsonInput('');
    setFile(null);
    setImportResult(null);
  };

  const sampleData = {
    cars: [
      {
        reportingMarks: "ATSF",
        reportingNumber: "12345",
        carType: "boxcar",
        color: "brown",
        homeYard: "yard1",
        currentIndustry: "yard1",
        isInService: true
      }
    ],
    industries: [
      {
        name: "Main Yard",
        stationId: "station1",
        goodsReceived: [],
        goodsToShip: [],
        preferredCarTypes: ["all"],
        isYard: true,
        isOnLayout: true
      }
    ],
    stations: [
      {
        name: "Central Station",
        block: "block1",
        type: "yard",
        description: "Main classification yard"
      }
    ]
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Data Import
      </Typography>

      <Box 
        sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
          gap: 3 
        }}
      >
        {/* Import Section */}
        <Box>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Import JSON Data
              </Typography>
              
              {/* File Upload */}
              <Box sx={{ mb: 3 }}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<FileUpload />}
                  sx={{ mb: 2 }}
                >
                  Choose JSON File
                  <input
                    type="file"
                    accept=".json"
                    hidden
                    onChange={handleFileUpload}
                  />
                </Button>
                {file && (
                  <Chip
                    label={file.name}
                    onDelete={() => {
                      setFile(null);
                      setJsonInput('');
                    }}
                    sx={{ ml: 2 }}
                  />
                )}
              </Box>

              {/* JSON Input */}
              <TextField
                label="JSON Data"
                multiline
                rows={12}
                fullWidth
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder="Paste your JSON data here or upload a file..."
                sx={{ mb: 3 }}
              />

              {/* Action Buttons */}
              <Box display="flex" gap={2}>
                <Button
                  variant="contained"
                  onClick={handleImport}
                  disabled={loading || !jsonInput.trim()}
                  startIcon={<CloudUpload />}
                >
                  Import Data
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleClear}
                  disabled={loading}
                >
                  Clear
                </Button>
                <Button
                  variant="text"
                  onClick={() => setJsonInput(JSON.stringify(sampleData, null, 2))}
                  disabled={loading}
                >
                  Load Sample
                </Button>
              </Box>

              {loading && <LinearProgress sx={{ mt: 2 }} />}
            </CardContent>
          </Card>

          {/* Import Results */}
          {importResult && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Import Results
                </Typography>
                
                {importResult.success ? (
                  <Alert severity="success" icon={<CheckCircle />} sx={{ mb: 2 }}>
                    Import completed successfully!
                  </Alert>
                ) : (
                  <Alert severity="error" icon={<Error />} sx={{ mb: 2 }}>
                    {importResult.error}
                  </Alert>
                )}

                {importResult.data && (
                  <Box>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      <strong>Imported:</strong> {importResult.data.imported} records
                    </Typography>

                    {importResult.data.errors.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="error" gutterBottom>
                          <Error sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                          Errors ({importResult.data.errors.length}):
                        </Typography>
                        <List dense>
                          {importResult.data.errors.map((error: string, index: number) => (
                            <ListItem key={index} sx={{ py: 0 }}>
                              <ListItemText primary={error} />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}

                    {importResult.data.warnings.length > 0 && (
                      <Box>
                        <Typography variant="body2" color="warning.main" gutterBottom>
                          <Warning sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                          Warnings ({importResult.data.warnings.length}):
                        </Typography>
                        <List dense>
                          {importResult.data.warnings.map((warning: string, index: number) => (
                            <ListItem key={index} sx={{ py: 0 }}>
                              <ListItemText primary={warning} />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Instructions */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Import Instructions
              </Typography>
              
              <Typography variant="body2" paragraph>
                Upload a JSON file or paste JSON data containing your railroad layout information.
              </Typography>

              <Typography variant="subtitle2" gutterBottom>
                Supported Data Types:
              </Typography>
              <List dense>
                <ListItem sx={{ py: 0 }}>
                  <ListItemText primary="• Cars (rolling stock)" />
                </ListItem>
                <ListItem sx={{ py: 0 }}>
                  <ListItemText primary="• Locomotives" />
                </ListItem>
                <ListItem sx={{ py: 0 }}>
                  <ListItemText primary="• Industries" />
                </ListItem>
                <ListItem sx={{ py: 0 }}>
                  <ListItemText primary="• Stations" />
                </ListItem>
                <ListItem sx={{ py: 0 }}>
                  <ListItemText primary="• Goods" />
                </ListItem>
                <ListItem sx={{ py: 0 }}>
                  <ListItemText primary="• AAR Types" />
                </ListItem>
                <ListItem sx={{ py: 0 }}>
                  <ListItemText primary="• Blocks" />
                </ListItem>
                <ListItem sx={{ py: 0 }}>
                  <ListItemText primary="• Tracks" />
                </ListItem>
              </List>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                Data Format:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                The JSON should contain objects with arrays for each data type. 
                Click "Load Sample" to see the expected format.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DataImport;
