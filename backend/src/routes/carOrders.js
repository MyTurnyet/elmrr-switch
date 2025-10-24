import express from 'express';
import { getService } from '../services/index.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const router = express.Router();
const carOrderService = getService('carOrder');

// GET /api/car-orders - List all orders with optional filtering
router.get('/', asyncHandler(async (req, res) => {
  const carOrders = await carOrderService.getOrdersWithFilters(req.query);
  res.json(ApiResponse.success(carOrders, 'Car orders retrieved successfully'));
}));

// GET /api/car-orders/:id - Get single order
router.get('/:id', asyncHandler(async (req, res) => {
  const enrichedOrder = await carOrderService.getEnrichedOrder(req.params.id);
  res.json(ApiResponse.success(enrichedOrder, 'Car order retrieved successfully'));
}));

// POST /api/car-orders - Create new order (manual creation)
router.post('/', asyncHandler(async (req, res) => {
  const newOrder = await carOrderService.createOrder(req.body);
  res.status(201).json(ApiResponse.success(newOrder, 'Car order created successfully', 201));
}));


// PUT /api/car-orders/:id - Update order (status, assigned car/train)
router.put('/:id', asyncHandler(async (req, res) => {
  const updatedOrder = await carOrderService.updateOrder(req.params.id, req.body);
  res.json(ApiResponse.success(updatedOrder, 'Car order updated successfully'));
}));

// DELETE /api/car-orders/:id - Delete order
router.delete('/:id', asyncHandler(async (req, res) => {
  await carOrderService.deleteOrder(req.params.id);
  res.json(ApiResponse.success(null, 'Car order deleted successfully'));
}));

// POST /api/car-orders/generate - Generate orders for current session based on industry demand
router.post('/generate', asyncHandler(async (req, res) => {
  const result = await carOrderService.generateOrders(req.body);
  res.json(ApiResponse.success(result, `Generated ${result.ordersGenerated} car orders for session ${result.sessionNumber}`));
}));

export default router;
