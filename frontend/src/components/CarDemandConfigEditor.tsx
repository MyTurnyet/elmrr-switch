/**
 * CarDemandConfigEditor Component
 * 
 * Provides a user interface for managing industry car demand configuration.
 * Supports goods tracking with direction and multiple compatible AAR types.
 * 
 * Features:
 * - Add/Edit/Delete demand configurations
 * - Goods selector with direction (inbound/outbound)
 * - Multi-select for compatible AAR types
 * - Frequency and cars per session configuration
 * - Validation and error handling
 */

import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Add,
  Delete,
  Edit,
  ArrowDownward,
  ArrowUpward,
  LocalShipping,
  Info,
} from '@mui/icons-material';
import type { CarDemandConfig } from '../types';

interface CarDemandConfigEditorProps {
  value: CarDemandConfig[];
  onChange: (config: CarDemandConfig[]) => void;
  goods: Array<{ _id: string; name: string; category?: string }>;
  aarTypes: Array<{ _id: string; code: string; name: string }>;
  disabled?: boolean;
}

interface ConfigFormData extends Partial<CarDemandConfig> {
  errors?: Record<string, string>;
}

export const CarDemandConfigEditor: React.FC<CarDemandConfigEditorProps> = ({
  value = [],
  onChange,
  goods,
  aarTypes,
  disabled = false,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<ConfigFormData>({
    goodsId: '',
    direction: 'inbound',
    compatibleCarTypes: [],
    carsPerSession: 1,
    frequency: 1,
    errors: {},
  });

  const handleAdd = () => {
    setEditIndex(null);
    setFormData({
      goodsId: '',
      direction: 'inbound',
      compatibleCarTypes: [],
      carsPerSession: 1,
      frequency: 1,
      errors: {},
    });
    setDialogOpen(true);
  };

  const handleEdit = (index: number) => {
    const config = value[index];
    setEditIndex(index);
    setFormData({
      ...config,
      errors: {},
    });
    setDialogOpen(true);
  };

  const handleDelete = (index: number) => {
    const newConfig = [...value];
    newConfig.splice(index, 1);
    onChange(newConfig);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.goodsId) {
      errors.goodsId = 'Good is required';
    }

    if (!formData.direction) {
      errors.direction = 'Direction is required';
    }

    if (!formData.compatibleCarTypes || formData.compatibleCarTypes.length === 0) {
      errors.compatibleCarTypes = 'At least one compatible car type is required';
    }

    if (!formData.carsPerSession || formData.carsPerSession < 1) {
      errors.carsPerSession = 'Cars per session must be at least 1';
    }

    if (!formData.frequency || formData.frequency < 1) {
      errors.frequency = 'Frequency must be at least 1';
    }

    // Check for duplicate goods+direction combination
    const isDuplicate = value.some((config, index) => {
      if (editIndex !== null && index === editIndex) return false;
      return config.goodsId === formData.goodsId && config.direction === formData.direction;
    });

    if (isDuplicate) {
      errors.goodsId = `This good already has a ${formData.direction} configuration`;
    }

    setFormData({ ...formData, errors });
    return Object.keys(errors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const newConfig: CarDemandConfig = {
      goodsId: formData.goodsId!,
      direction: formData.direction!,
      compatibleCarTypes: formData.compatibleCarTypes!,
      carsPerSession: formData.carsPerSession!,
      frequency: formData.frequency!,
    };

    const updatedConfig = [...value];
    if (editIndex !== null) {
      updatedConfig[editIndex] = newConfig;
    } else {
      updatedConfig.push(newConfig);
    }

    onChange(updatedConfig);
    setDialogOpen(false);
  };

  const handleCancel = () => {
    setDialogOpen(false);
    setFormData({
      goodsId: '',
      direction: 'inbound',
      compatibleCarTypes: [],
      carsPerSession: 1,
      frequency: 1,
      errors: {},
    });
  };

  const getGoodName = (goodsId: string): string => {
    return goods.find(g => g._id === goodsId)?.name || goodsId;
  };

  const getAarTypeName = (aarTypeId: string): string => {
    const aarType = aarTypes.find(a => a._id === aarTypeId);
    return aarType ? `${aarType.code} - ${aarType.name}` : aarTypeId;
  };

  const getDirectionIcon = (direction: string) => {
    return direction === 'inbound' ? <ArrowDownward fontSize="small" /> : <ArrowUpward fontSize="small" />;
  };

  const getDirectionColor = (direction: string) => {
    return direction === 'inbound' ? 'primary' : 'secondary';
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" component="h3">
          Car Demand Configuration
        </Typography>
        <Tooltip title="Add demand configuration">
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAdd}
            disabled={disabled}
            size="small"
          >
            Add Demand
          </Button>
        </Tooltip>
      </Stack>

      {value.length === 0 ? (
        <Card variant="outlined">
          <CardContent>
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
              <Info color="action" />
              <Typography variant="body2" color="text.secondary">
                No demand configuration. Click "Add Demand" to configure what goods this industry ships or receives.
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={1}>
          {value.map((config, index) => (
            <Card key={index} variant="outlined">
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box flex={1}>
                    <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                      <Chip
                        icon={getDirectionIcon(config.direction)}
                        label={config.direction.toUpperCase()}
                        color={getDirectionColor(config.direction)}
                        size="small"
                      />
                      <Typography variant="subtitle1" fontWeight="bold">
                        {getGoodName(config.goodsId)}
                      </Typography>
                    </Stack>

                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Compatible Car Types:</strong>{' '}
                      {config.compatibleCarTypes.map(id => {
                        const aarType = aarTypes.find(a => a._id === id);
                        return aarType?.code || id;
                      }).join(', ')}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      <strong>Demand:</strong> {config.carsPerSession} car(s) every {config.frequency} session(s)
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1}>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(index)}
                        disabled={disabled}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(index)}
                        disabled={disabled}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCancel} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editIndex !== null ? 'Edit Demand Configuration' : 'Add Demand Configuration'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* Goods Selector */}
            <FormControl fullWidth error={!!formData.errors?.goodsId}>
              <InputLabel>Good/Commodity *</InputLabel>
              <Select
                value={formData.goodsId || ''}
                onChange={(e) => setFormData({ ...formData, goodsId: e.target.value, errors: { ...formData.errors, goodsId: undefined } })}
                label="Good/Commodity *"
              >
                {goods.map((good) => (
                  <MenuItem key={good._id} value={good._id}>
                    {good.name} {good.category && `(${good.category})`}
                  </MenuItem>
                ))}
              </Select>
              {formData.errors?.goodsId && (
                <FormHelperText>{formData.errors.goodsId}</FormHelperText>
              )}
            </FormControl>

            {/* Direction Selector */}
            <FormControl fullWidth error={!!formData.errors?.direction}>
              <InputLabel>Direction *</InputLabel>
              <Select
                value={formData.direction || 'inbound'}
                onChange={(e) => setFormData({ ...formData, direction: e.target.value as 'inbound' | 'outbound', errors: { ...formData.errors, direction: undefined } })}
                label="Direction *"
              >
                <MenuItem value="inbound">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <ArrowDownward fontSize="small" />
                    <span>Inbound (Receiving)</span>
                  </Stack>
                </MenuItem>
                <MenuItem value="outbound">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <ArrowUpward fontSize="small" />
                    <span>Outbound (Shipping)</span>
                  </Stack>
                </MenuItem>
              </Select>
              {formData.errors?.direction && (
                <FormHelperText>{formData.errors.direction}</FormHelperText>
              )}
              <FormHelperText>
                Inbound: Industry receives this good. Outbound: Industry ships this good.
              </FormHelperText>
            </FormControl>

            {/* Compatible AAR Types Multi-Select */}
            <FormControl fullWidth error={!!formData.errors?.compatibleCarTypes}>
              <InputLabel>Compatible Car Types *</InputLabel>
              <Select
                multiple
                value={formData.compatibleCarTypes || []}
                onChange={(e) => setFormData({ ...formData, compatibleCarTypes: e.target.value as string[], errors: { ...formData.errors, compatibleCarTypes: undefined } })}
                label="Compatible Car Types *"
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((value) => {
                      const aarType = aarTypes.find(a => a._id === value);
                      return (
                        <Chip key={value} label={aarType?.code || value} size="small" />
                      );
                    })}
                  </Box>
                )}
              >
                {aarTypes.map((aarType) => (
                  <MenuItem key={aarType._id} value={aarType._id}>
                    {aarType.code} - {aarType.name}
                  </MenuItem>
                ))}
              </Select>
              {formData.errors?.compatibleCarTypes && (
                <FormHelperText>{formData.errors.compatibleCarTypes}</FormHelperText>
              )}
              <FormHelperText>
                Select all AAR car types that can carry this good
              </FormHelperText>
            </FormControl>

            <Divider />

            {/* Cars Per Session */}
            <TextField
              label="Cars Per Session *"
              type="number"
              fullWidth
              value={formData.carsPerSession || 1}
              onChange={(e) => setFormData({ ...formData, carsPerSession: parseInt(e.target.value) || 1, errors: { ...formData.errors, carsPerSession: undefined } })}
              error={!!formData.errors?.carsPerSession}
              helperText={formData.errors?.carsPerSession || 'Number of cars needed per session'}
              inputProps={{ min: 1 }}
            />

            {/* Frequency */}
            <TextField
              label="Frequency (Sessions) *"
              type="number"
              fullWidth
              value={formData.frequency || 1}
              onChange={(e) => setFormData({ ...formData, frequency: parseInt(e.target.value) || 1, errors: { ...formData.errors, frequency: undefined } })}
              error={!!formData.errors?.frequency}
              helperText={formData.errors?.frequency || 'Generate orders every N sessions (1 = every session)'}
              inputProps={{ min: 1 }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editIndex !== null ? 'Save Changes' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CarDemandConfigEditor;
