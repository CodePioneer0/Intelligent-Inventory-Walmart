import cron from 'node-cron';
import { AIService } from './aiService';
import { PrismaClient } from '@prisma/client';
import { SocketHandler } from '../websocket/socketHandler';

const prisma = new PrismaClient();

export class AIScheduler {
  private aiService: AIService;
  private socketHandler: SocketHandler;
  private isRunning = false;

  constructor(socketHandler: SocketHandler) {
    this.aiService = new AIService();
    this.socketHandler = socketHandler;
  }

  async start() {
    if (this.isRunning) return;
    
    console.log('🤖 Starting AI Scheduler...');
    
    await this.aiService.initialize();
    
    // Schedule daily forecast updates at 2 AM
    cron.schedule('0 2 * * *', async () => {
      console.log('🔄 Running daily forecast updates...');
      await this.runDailyForecasts();
    });

    // Schedule hourly stock optimization checks
    cron.schedule('0 * * * *', async () => {
      console.log('📊 Running hourly optimization checks...');
      await this.runOptimizationChecks();
    });

    // Schedule anomaly detection every 4 hours
    cron.schedule('0 */4 * * *', async () => {
      console.log('🔍 Running anomaly detection...');
      await this.runAnomalyDetection();
    });

    // Schedule model retraining weekly on Sundays at 3 AM
    cron.schedule('0 3 * * 0', async () => {
      console.log('🧠 Running weekly model retraining...');
      await this.retrainModels();
    });

    // Schedule cleanup every 6 hours
    cron.schedule('0 */6 * * *', async () => {
      console.log('🧹 Running cleanup tasks...');
      await this.runCleanupTasks();
    });

    this.isRunning = true;
    console.log('✅ AI Scheduler started successfully');
  }

  private async runDailyForecasts() {
    try {
      const products = await prisma.product.findMany({
        select: { id: true, name: true }
      });

      let processedCount = 0;
      const batchSize = 10;

      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async (product) => {
            try {
              const forecast = await this.aiService.generateDemandForecast(product.id, 30);
              
              // Save forecast to database
              await this.saveForecastToDatabase(forecast);
              
              // Check if forecast indicates potential issues
              await this.checkForecastAlerts(product, forecast);
              
              processedCount++;
            } catch (error) {
              console.error(`Error forecasting for product ${product.id}:`, error);
            }
          })
        );

        // Small delay between batches to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`✅ Daily forecasts completed: ${processedCount}/${products.length} products`);
      
      // Broadcast update to connected clients
      this.socketHandler.broadcastUpdate('forecasts-updated', {
        processedCount,
        totalProducts: products.length,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error in daily forecasts:', error);
    }
  }

  private async runOptimizationChecks() {
    try {
      // Focus on high-velocity products for optimization
      const products = await prisma.product.findMany({
        where: {
          OR: [
            { velocity: 'HIGH' },
            { riskLevel: 'HIGH' }
          ]
        },
        select: { id: true, name: true, currentStock: true, reorderPoint: true }
      });

      let optimizationCount = 0;
      const recommendations = [];

      for (const product of products) {
        try {
          const optimization = await this.aiService.optimizeStockLevels(product.id);
          
          // Check if optimization suggests significant changes
          const stockDifference = Math.abs(optimization.optimalStock - product.currentStock);
          const percentageDifference = (stockDifference / product.currentStock) * 100;

          if (percentageDifference > 20 || optimization.expectedSavings > 100) {
            recommendations.push({
              productId: product.id,
              productName: product.name,
              optimization,
              priority: optimization.riskLevel === 'HIGH' ? 'CRITICAL' : 'MEDIUM'
            });
          }

          optimizationCount++;
        } catch (error) {
          console.error(`Error optimizing product ${product.id}:`, error);
        }
      }

      if (recommendations.length > 0) {
        // Create alerts for significant optimization opportunities
        await this.createOptimizationAlerts(recommendations);
        
        // Broadcast to connected clients
        this.socketHandler.broadcastUpdate('optimization-recommendations', {
          recommendations: recommendations.slice(0, 5), // Top 5 recommendations
          totalCount: recommendations.length,
          timestamp: new Date()
        });
      }

      console.log(`✅ Optimization checks completed: ${optimizationCount} products analyzed, ${recommendations.length} recommendations`);

    } catch (error) {
      console.error('Error in optimization checks:', error);
    }
  }

  private async runAnomalyDetection() {
    try {
      const products = await prisma.product.findMany({
        where: { velocity: { in: ['HIGH', 'MEDIUM'] } },
        select: { id: true, name: true }
      });

      let anomalyCount = 0;
      const criticalAnomalies = [];

      for (const product of products) {
        try {
          const anomalies = await this.aiService.detectAnomalies(product.id);
          
          // Focus on recent high-severity anomalies
          const recentCritical = anomalies.anomalies.filter(a => {
            const anomalyDate = new Date(a.date);
            const threeDaysAgo = new Date();
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
            return anomalyDate > threeDaysAgo && a.severity === 'HIGH';
          });

          if (recentCritical.length > 0) {
            criticalAnomalies.push({
              productId: product.id,
              productName: product.name,
              anomalies: recentCritical
            });
          }

          anomalyCount += anomalies.anomalies.length;
        } catch (error) {
          console.error(`Error detecting anomalies for product ${product.id}:`, error);
        }
      }

      if (criticalAnomalies.length > 0) {
        await this.createAnomalyAlerts(criticalAnomalies);
        
        this.socketHandler.broadcastUpdate('anomalies-detected', {
          criticalAnomalies: criticalAnomalies.slice(0, 3),
          totalAnomalies: anomalyCount,
          timestamp: new Date()
        });
      }

      console.log(`✅ Anomaly detection completed: ${anomalyCount} anomalies found, ${criticalAnomalies.length} critical`);

    } catch (error) {
      console.error('Error in anomaly detection:', error);
    }
  }

  private async retrainModels() {
    try {
      console.log('🧠 Starting weekly model retraining...');
      
      const categories = await prisma.category.findMany();
      let retrainedCount = 0;

      for (const category of categories) {
        try {
          // Get products in this category with sufficient data
          const products = await prisma.product.findMany({
            where: { categoryId: category.id },
            select: { id: true }
          });

          if (products.length === 0) continue;

          // Retrain model with recent data from all products in category
          const sampleProduct = products[0];
          await this.aiService.generateDemandForecast(sampleProduct.id, 7); // This triggers model training
          
          // Save the updated model
          await this.aiService.saveModel(category.id);
          
          retrainedCount++;
          
          console.log(`✅ Model retrained for category: ${category.name}`);
        } catch (error) {
          console.error(`Error retraining model for category ${category.id}:`, error);
        }
      }

      console.log(`✅ Model retraining completed: ${retrainedCount}/${categories.length} models updated`);
      
      this.socketHandler.broadcastUpdate('models-retrained', {
        retrainedCount,
        totalCategories: categories.length,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error in model retraining:', error);
    }
  }

  private async runCleanupTasks() {
    try {
      // Clean up old forecasts (keep last 90 days)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const deletedForecasts = await prisma.forecast.deleteMany({
        where: {
          createdAt: { lt: ninetyDaysAgo }
        }
      });

      // Clean up old alerts (keep last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const deletedAlerts = await prisma.alert.deleteMany({
        where: {
          createdAt: { lt: thirtyDaysAgo },
          isDismissed: true
        }
      });

      console.log(`🧹 Cleanup completed: ${deletedForecasts.count} old forecasts, ${deletedAlerts.count} old alerts removed`);

    } catch (error) {
      console.error('Error in cleanup tasks:', error);
    }
  }

  private async saveForecastToDatabase(forecast: any) {
    for (const prediction of forecast.predictions) {
      await prisma.forecast.upsert({
        where: {
          productId_forecastDate: {
            productId: forecast.productId,
            forecastDate: new Date(prediction.date)
          }
        },
        update: {
          predictedDemand: prediction.predictedDemand,
          confidenceScore: prediction.confidence,
          modelVersion: forecast.modelType
        },
        create: {
          productId: forecast.productId,
          forecastDate: new Date(prediction.date),
          predictedDemand: prediction.predictedDemand,
          confidenceScore: prediction.confidence,
          modelVersion: forecast.modelType
        }
      });
    }
  }

  private async checkForecastAlerts(product: any, forecast: any) {
    const avgPrediction = forecast.predictions.reduce((sum: number, p: any) => sum + p.predictedDemand, 0) / forecast.predictions.length;
    
    // Check for significant demand increase
    if (avgPrediction > product.currentStock * 2) {
      await prisma.alert.create({
        data: {
          productId: product.id,
          alertType: 'WARNING',
          title: 'High Demand Forecast',
          description: `Forecasted demand (${Math.round(avgPrediction)}/day) significantly exceeds current stock levels. Consider increasing inventory.`
        }
      });
    }

    // Check for low forecast accuracy
    if (forecast.accuracy < 0.6) {
      await prisma.alert.create({
        data: {
          productId: product.id,
          alertType: 'INFO',
          title: 'Low Forecast Accuracy',
          description: `Forecast accuracy is ${Math.round(forecast.accuracy * 100)}%. Historical data may need review.`
        }
      });
    }
  }

  private async createOptimizationAlerts(recommendations: any[]) {
    for (const rec of recommendations.slice(0, 5)) { // Limit to top 5
      await prisma.alert.create({
        data: {
          productId: rec.productId,
          alertType: rec.priority === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
          title: 'Stock Optimization Opportunity',
          description: `AI suggests adjusting stock from ${rec.optimization.currentStock} to ${rec.optimization.optimalStock} units. Potential savings: $${rec.optimization.expectedSavings}`
        }
      });
    }
  }

  private async createAnomalyAlerts(anomalies: any[]) {
    for (const anomaly of anomalies.slice(0, 3)) { // Limit to top 3
      const latestAnomaly = anomaly.anomalies[0];
      await prisma.alert.create({
        data: {
          productId: anomaly.productId,
          alertType: 'WARNING',
          title: 'Demand Anomaly Detected',
          description: `Unusual demand pattern detected: ${latestAnomaly.actualDemand} vs expected ${latestAnomaly.expectedDemand} (${latestAnomaly.date})`
        }
      });
    }
  }

  async stop() {
    if (!this.isRunning) return;
    
    console.log('🛑 Stopping AI Scheduler...');
    await this.aiService.cleanup();
    this.isRunning = false;
    console.log('✅ AI Scheduler stopped');
  }
}