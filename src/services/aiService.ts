import * as tf from '@tensorflow/tfjs-node';
import { SimpleLinearRegression, PolynomialRegression } from 'ml-regression';
import * as ss from 'simple-statistics';
import { PrismaClient } from '@prisma/client';
import { CacheService } from './cacheService';

const prisma = new PrismaClient();
const cache = new CacheService();

export interface ForecastResult {
  productId: string;
  predictions: Array<{
    date: string;
    predictedDemand: number;
    confidence: number;
    upperBound: number;
    lowerBound: number;
  }>;
  accuracy: number;
  modelType: string;
}

export interface OptimizationResult {
  productId: string;
  currentStock: number;
  optimalStock: number;
  reorderPoint: number;
  expectedSavings: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface AnomalyDetection {
  productId: string;
  anomalies: Array<{
    date: string;
    actualDemand: number;
    expectedDemand: number;
    anomalyScore: number;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
  }>;
}

export class AIService {
  private models: Map<string, tf.LayersModel> = new Map();
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;
    
    console.log('🤖 Initializing AI Service...');
    
    // Initialize TensorFlow backend
    await tf.ready();
    
    // Load or create models for each product category
    await this.initializeModels();
    
    this.isInitialized = true;
    console.log('✅ AI Service initialized successfully');
  }

  private async initializeModels() {
    const categories = await prisma.category.findMany();
    
    for (const category of categories) {
      try {
        // Try to load existing model
        const modelPath = `./models/demand_forecast_${category.id}`;
        const model = await this.loadOrCreateModel(category.id);
        this.models.set(category.id, model);
      } catch (error) {
        console.log(`Creating new model for category: ${category.name}`);
        const model = this.createDemandForecastModel();
        this.models.set(category.id, model);
      }
    }
  }

  private async loadOrCreateModel(categoryId: string): Promise<tf.LayersModel> {
    try {
      return await tf.loadLayersModel(`file://./models/demand_forecast_${categoryId}/model.json`);
    } catch {
      return this.createDemandForecastModel();
    }
  }

  private createDemandForecastModel(): tf.LayersModel {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [10], units: 64, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 16, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'linear' })
      ]
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae']
    });

    return model;
  }

  async generateDemandForecast(productId: string, days: number = 30): Promise<ForecastResult> {
    const cacheKey = `forecast:${productId}:${days}`;
    const cached = await cache.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { category: true }
    });

    if (!product) {
      throw new Error('Product not found');
    }

    // Get historical data
    const historicalData = await this.getHistoricalDemandData(productId, 180); // 6 months
    
    if (historicalData.length < 30) {
      // Use simple statistical methods for products with limited data
      return this.generateStatisticalForecast(productId, historicalData, days);
    }

    // Use neural network for products with sufficient data
    const forecast = await this.generateNeuralNetworkForecast(product, historicalData, days);
    
    // Cache the result for 1 hour
    await cache.set(cacheKey, JSON.stringify(forecast), 3600);
    
    return forecast;
  }

  private async getHistoricalDemandData(productId: string, days: number) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const movements = await prisma.stockMovement.findMany({
      where: {
        productId,
        movementType: 'OUT',
        createdAt: { gte: startDate }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Group by day and calculate daily demand
    const dailyDemand = new Map<string, number>();
    
    movements.forEach(movement => {
      const date = movement.createdAt.toISOString().split('T')[0];
      const current = dailyDemand.get(date) || 0;
      dailyDemand.set(date, current + Math.abs(movement.quantity));
    });

    // Fill missing days with 0
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      result.push({
        date: dateStr,
        demand: dailyDemand.get(dateStr) || 0,
        dayOfWeek: date.getDay(),
        dayOfMonth: date.getDate(),
        month: date.getMonth(),
        isWeekend: date.getDay() === 0 || date.getDay() === 6
      });
    }

    return result;
  }

  private async generateStatisticalForecast(
    productId: string, 
    historicalData: any[], 
    days: number
  ): Promise<ForecastResult> {
    const demands = historicalData.map(d => d.demand);
    
    // Calculate basic statistics
    const mean = ss.mean(demands);
    const stdDev = ss.standardDeviation(demands);
    const trend = this.calculateTrend(demands);
    
    // Generate predictions using moving average with trend
    const predictions = [];
    const windowSize = Math.min(7, demands.length);
    const recentAverage = ss.mean(demands.slice(-windowSize));
    
    for (let i = 0; i < days; i++) {
      const trendAdjustment = trend * (i + 1);
      const seasonalFactor = this.getSeasonalFactor(i, historicalData);
      
      const predictedDemand = Math.max(0, Math.round(
        (recentAverage + trendAdjustment) * seasonalFactor
      ));
      
      const confidence = Math.max(0.3, 1 - (stdDev / mean));
      const margin = stdDev * 1.96; // 95% confidence interval
      
      const date = new Date();
      date.setDate(date.getDate() + i + 1);
      
      predictions.push({
        date: date.toISOString().split('T')[0],
        predictedDemand,
        confidence: Math.round(confidence * 100) / 100,
        upperBound: Math.round(predictedDemand + margin),
        lowerBound: Math.max(0, Math.round(predictedDemand - margin))
      });
    }

    return {
      productId,
      predictions,
      accuracy: confidence,
      modelType: 'STATISTICAL'
    };
  }

  private async generateNeuralNetworkForecast(
    product: any,
    historicalData: any[],
    days: number
  ): Promise<ForecastResult> {
    const model = this.models.get(product.categoryId);
    if (!model) {
      throw new Error('Model not found for category');
    }

    // Prepare training data
    const { inputs, outputs } = this.prepareTrainingData(historicalData);
    
    if (inputs.length < 10) {
      // Fall back to statistical method
      return this.generateStatisticalForecast(product.id, historicalData, days);
    }

    // Train the model with recent data
    const xs = tf.tensor2d(inputs);
    const ys = tf.tensor2d(outputs, [outputs.length, 1]);

    await model.fit(xs, ys, {
      epochs: 50,
      batchSize: 8,
      validationSplit: 0.2,
      verbose: 0
    });

    // Generate predictions
    const predictions = [];
    let lastFeatures = inputs[inputs.length - 1];

    for (let i = 0; i < days; i++) {
      const prediction = model.predict(tf.tensor2d([lastFeatures])) as tf.Tensor;
      const predictedValue = await prediction.data();
      const predictedDemand = Math.max(0, Math.round(predictedValue[0]));

      // Calculate confidence based on model uncertainty
      const confidence = this.calculatePredictionConfidence(predictedDemand, historicalData);
      const margin = predictedDemand * 0.2; // 20% margin

      const date = new Date();
      date.setDate(date.getDate() + i + 1);

      predictions.push({
        date: date.toISOString().split('T')[0],
        predictedDemand,
        confidence,
        upperBound: Math.round(predictedDemand + margin),
        lowerBound: Math.max(0, Math.round(predictedDemand - margin))
      });

      // Update features for next prediction
      lastFeatures = this.updateFeatures(lastFeatures, predictedDemand, i + 1);
      
      prediction.dispose();
    }

    xs.dispose();
    ys.dispose();

    // Calculate model accuracy
    const accuracy = await this.calculateModelAccuracy(model, inputs, outputs);

    return {
      productId: product.id,
      predictions,
      accuracy,
      modelType: 'NEURAL_NETWORK'
    };
  }

  private prepareTrainingData(historicalData: any[]) {
    const inputs = [];
    const outputs = [];
    const windowSize = 10;

    for (let i = windowSize; i < historicalData.length; i++) {
      const features = [];
      
      // Historical demand (last 7 days)
      for (let j = 7; j > 0; j--) {
        features.push(historicalData[i - j].demand);
      }
      
      // Additional features
      features.push(historicalData[i].dayOfWeek);
      features.push(historicalData[i].dayOfMonth);
      features.push(historicalData[i].month);
      
      inputs.push(features);
      outputs.push(historicalData[i].demand);
    }

    return { inputs, outputs };
  }

  private updateFeatures(features: number[], newDemand: number, dayOffset: number): number[] {
    const newFeatures = [...features];
    
    // Shift demand history
    for (let i = 0; i < 6; i++) {
      newFeatures[i] = newFeatures[i + 1];
    }
    newFeatures[6] = newDemand;
    
    // Update date features
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + dayOffset);
    
    newFeatures[7] = futureDate.getDay();
    newFeatures[8] = futureDate.getDate();
    newFeatures[9] = futureDate.getMonth();
    
    return newFeatures;
  }

  private calculateTrend(demands: number[]): number {
    if (demands.length < 2) return 0;
    
    const x = demands.map((_, i) => i);
    const regression = new SimpleLinearRegression(x, demands);
    return regression.slope;
  }

  private getSeasonalFactor(dayOffset: number, historicalData: any[]): number {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + dayOffset);
    const dayOfWeek = futureDate.getDay();
    
    // Calculate average demand for this day of week
    const sameDayDemands = historicalData
      .filter(d => new Date(d.date).getDay() === dayOfWeek)
      .map(d => d.demand);
    
    if (sameDayDemands.length === 0) return 1;
    
    const avgSameDayDemand = ss.mean(sameDayDemands);
    const overallAverage = ss.mean(historicalData.map(d => d.demand));
    
    return overallAverage === 0 ? 1 : avgSameDayDemand / overallAverage;
  }

  private calculatePredictionConfidence(prediction: number, historicalData: any[]): number {
    const demands = historicalData.map(d => d.demand);
    const mean = ss.mean(demands);
    const stdDev = ss.standardDeviation(demands);
    
    // Confidence decreases as prediction deviates from historical mean
    const deviation = Math.abs(prediction - mean);
    const normalizedDeviation = stdDev === 0 ? 0 : deviation / stdDev;
    
    return Math.max(0.3, Math.min(0.95, 1 - (normalizedDeviation * 0.1)));
  }

  private async calculateModelAccuracy(model: tf.LayersModel, inputs: number[][], outputs: number[]): Promise<number> {
    if (inputs.length === 0) return 0.5;
    
    const xs = tf.tensor2d(inputs);
    const ys = tf.tensor2d(outputs, [outputs.length, 1]);
    
    const predictions = model.predict(xs) as tf.Tensor;
    const predictionData = await predictions.data();
    
    // Calculate Mean Absolute Percentage Error (MAPE)
    let totalError = 0;
    let validPredictions = 0;
    
    for (let i = 0; i < outputs.length; i++) {
      if (outputs[i] !== 0) {
        const error = Math.abs((outputs[i] - predictionData[i]) / outputs[i]);
        totalError += error;
        validPredictions++;
      }
    }
    
    xs.dispose();
    ys.dispose();
    predictions.dispose();
    
    const mape = validPredictions > 0 ? totalError / validPredictions : 1;
    return Math.max(0, 1 - mape); // Convert to accuracy score
  }

  async optimizeStockLevels(productId: string): Promise<OptimizationResult> {
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      throw new Error('Product not found');
    }

    // Get demand forecast
    const forecast = await this.generateDemandForecast(productId, 30);
    
    // Calculate optimal stock levels using Economic Order Quantity (EOQ) model
    const avgDailyDemand = forecast.predictions.reduce((sum, p) => sum + p.predictedDemand, 0) / 30;
    const annualDemand = avgDailyDemand * 365;
    
    // Estimated costs (these should be configurable per product)
    const orderingCost = 50; // Cost per order
    const holdingCostRate = 0.25; // 25% of unit price per year
    const holdingCost = product.unitPrice ? Number(product.unitPrice) * holdingCostRate : 10;
    
    // EOQ calculation
    const eoq = Math.sqrt((2 * annualDemand * orderingCost) / holdingCost);
    
    // Safety stock calculation (based on demand variability)
    const demandVariability = this.calculateDemandVariability(forecast.predictions);
    const serviceLevel = 0.95; // 95% service level
    const zScore = 1.645; // Z-score for 95% service level
    const leadTime = 7; // Assume 7 days lead time
    
    const safetyStock = zScore * Math.sqrt(leadTime) * demandVariability;
    const reorderPoint = (avgDailyDemand * leadTime) + safetyStock;
    const optimalStock = eoq + safetyStock;
    
    // Calculate expected savings
    const currentHoldingCost = product.currentStock * holdingCost / 365 * 30; // Monthly cost
    const optimizedHoldingCost = optimalStock * holdingCost / 365 * 30;
    const expectedSavings = Math.max(0, currentHoldingCost - optimizedHoldingCost);
    
    // Determine risk level
    const stockoutRisk = this.calculateStockoutRisk(product.currentStock, avgDailyDemand, demandVariability);
    const riskLevel = stockoutRisk > 0.2 ? 'HIGH' : stockoutRisk > 0.1 ? 'MEDIUM' : 'LOW';

    return {
      productId,
      currentStock: product.currentStock,
      optimalStock: Math.round(optimalStock),
      reorderPoint: Math.round(reorderPoint),
      expectedSavings: Math.round(expectedSavings * 100) / 100,
      riskLevel
    };
  }

  private calculateDemandVariability(predictions: any[]): number {
    const demands = predictions.map(p => p.predictedDemand);
    return ss.standardDeviation(demands);
  }

  private calculateStockoutRisk(currentStock: number, avgDemand: number, variability: number): number {
    if (avgDemand === 0) return 0;
    
    const daysOfStock = currentStock / avgDemand;
    const riskFactor = variability / avgDemand;
    
    // Simple risk calculation - more sophisticated models could be used
    return Math.max(0, Math.min(1, (7 - daysOfStock) * riskFactor / 7));
  }

  async detectAnomalies(productId: string): Promise<AnomalyDetection> {
    const historicalData = await this.getHistoricalDemandData(productId, 90);
    const demands = historicalData.map(d => d.demand);
    
    if (demands.length < 14) {
      return { productId, anomalies: [] };
    }

    const mean = ss.mean(demands);
    const stdDev = ss.standardDeviation(demands);
    const anomalies = [];

    // Use Z-score method for anomaly detection
    for (let i = 7; i < historicalData.length; i++) {
      const recentAvg = ss.mean(demands.slice(i - 7, i));
      const currentDemand = demands[i];
      
      const zScore = stdDev === 0 ? 0 : Math.abs(currentDemand - recentAvg) / stdDev;
      
      if (zScore > 2) { // Anomaly threshold
        const severity = zScore > 3 ? 'HIGH' : zScore > 2.5 ? 'MEDIUM' : 'LOW';
        
        anomalies.push({
          date: historicalData[i].date,
          actualDemand: currentDemand,
          expectedDemand: Math.round(recentAvg),
          anomalyScore: Math.round(zScore * 100) / 100,
          severity
        });
      }
    }

    return { productId, anomalies };
  }

  async generateInsights(productId: string): Promise<any> {
    const [forecast, optimization, anomalies] = await Promise.all([
      this.generateDemandForecast(productId, 30),
      this.optimizeStockLevels(productId),
      this.detectAnomalies(productId)
    ]);

    const insights = [];

    // Forecast insights
    const avgPrediction = forecast.predictions.reduce((sum, p) => sum + p.predictedDemand, 0) / 30;
    if (forecast.accuracy < 0.7) {
      insights.push({
        type: 'WARNING',
        title: 'Low Forecast Accuracy',
        description: `Forecast accuracy is ${Math.round(forecast.accuracy * 100)}%. Consider reviewing historical data quality.`,
        priority: 'MEDIUM'
      });
    }

    // Stock optimization insights
    if (optimization.currentStock > optimization.optimalStock * 1.5) {
      insights.push({
        type: 'OPTIMIZATION',
        title: 'Excess Inventory',
        description: `Current stock is ${Math.round(((optimization.currentStock - optimization.optimalStock) / optimization.optimalStock) * 100)}% above optimal level.`,
        priority: 'HIGH',
        savings: optimization.expectedSavings
      });
    }

    if (optimization.riskLevel === 'HIGH') {
      insights.push({
        type: 'CRITICAL',
        title: 'High Stockout Risk',
        description: 'Current stock levels pose a high risk of stockout. Consider immediate reordering.',
        priority: 'CRITICAL'
      });
    }

    // Anomaly insights
    const recentAnomalies = anomalies.anomalies.filter(a => {
      const anomalyDate = new Date(a.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return anomalyDate > weekAgo;
    });

    if (recentAnomalies.length > 0) {
      insights.push({
        type: 'INFO',
        title: 'Recent Demand Anomalies',
        description: `${recentAnomalies.length} unusual demand patterns detected in the last week.`,
        priority: 'LOW'
      });
    }

    return {
      productId,
      insights,
      forecast,
      optimization,
      anomalies: anomalies.anomalies.slice(-5) // Last 5 anomalies
    };
  }

  async saveModel(categoryId: string): Promise<void> {
    const model = this.models.get(categoryId);
    if (!model) return;

    const savePath = `./models/demand_forecast_${categoryId}`;
    await model.save(`file://${savePath}`);
    console.log(`Model saved for category: ${categoryId}`);
  }

  async cleanup(): Promise<void> {
    // Dispose of all models to free memory
    for (const [categoryId, model] of this.models) {
      model.dispose();
      console.log(`Model disposed for category: ${categoryId}`);
    }
    this.models.clear();
  }
}