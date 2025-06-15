import { Router } from 'express';
import { AIController } from '../controllers/aiController';

const router = Router();
const aiController = new AIController();

// Demand forecasting endpoints
router.get('/forecast/:productId', aiController.getForecast.bind(aiController));
router.post('/forecast/:productId/generate', aiController.generateForecast.bind(aiController));
router.get('/forecast/:productId/accuracy', aiController.getForecastAccuracy.bind(aiController));

// Stock optimization endpoints
router.get('/optimize/:productId', aiController.getOptimization.bind(aiController));
router.post('/optimize/:productId/apply', aiController.applyOptimization.bind(aiController));
router.get('/optimize/recommendations', aiController.getOptimizationRecommendations.bind(aiController));

// Anomaly detection endpoints
router.get('/anomalies/:productId', aiController.getAnomalies.bind(aiController));
router.get('/anomalies', aiController.getAllAnomalies.bind(aiController));

// AI insights and recommendations
router.get('/insights/:productId', aiController.getInsights.bind(aiController));
router.get('/insights', aiController.getDashboardInsights.bind(aiController));

// Model management
router.post('/models/retrain', aiController.retrainModels.bind(aiController));
router.get('/models/status', aiController.getModelStatus.bind(aiController));

// Bulk operations
router.post('/forecast/bulk', aiController.bulkForecast.bind(aiController));
router.post('/optimize/bulk', aiController.bulkOptimize.bind(aiController));

export { router as aiRoutes };