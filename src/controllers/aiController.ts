import { Request, Response } from 'express';
import { AIService } from '../services/aiService';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();
const aiService = new AIService();

// Validation schemas
const forecastSchema = z.object({
  days: z.number().min(1).max(365).optional().default(30)
});

const bulkForecastSchema = z.object({
  productIds: z.array(z.string()).min(1).max(50),
  days: z.number().min(1).max(365).optional().default(30)
});

export class AIController {
  async getForecast(req: Request, res: Response) {
    try {
      const { productId } = req.params;
      const { days } = forecastSchema.parse(req.query);

      // Check if product exists
      const product = await prisma.product.findUnique({
        where: { id: productId }
      });

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const forecast = await aiService.generateDemandForecast(productId, days);
      
      res.json({
        success: true,
        data: forecast,
        metadata: {
          productId,
          generatedAt: new Date(),
          forecastDays: days
        }
      });
    } catch (error) {
      console.error('Error getting forecast:', error);
      res.status(500).json({ 
        error: 'Failed to generate forecast',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async generateForecast(req: Request, res: Response) {
    try {
      const { productId } = req.params;
      const { days } = forecastSchema.parse(req.body);

      const forecast = await aiService.generateDemandForecast(productId, days);
      
      // Save forecast to database
      await this.saveForecastToDatabase(forecast);

      res.json({
        success: true,
        data: forecast,
        message: 'Forecast generated and saved successfully'
      });
    } catch (error) {
      console.error('Error generating forecast:', error);
      res.status(500).json({ error: 'Failed to generate forecast' });
    }
  }

  async getForecastAccuracy(req: Request, res: Response) {
    try {
      const { productId } = req.params;

      // Get recent forecasts and actual demand
      const forecasts = await prisma.forecast.findMany({
        where: {
          productId,
          forecastDate: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        },
        orderBy: { forecastDate: 'desc' }
      });

      // Get actual demand for the same period
      const movements = await prisma.stockMovement.findMany({
        where: {
          productId,
          movementType: 'OUT',
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      });

      // Calculate accuracy metrics
      const accuracy = this.calculateForecastAccuracy(forecasts, movements);

      res.json({
        success: true,
        data: accuracy
      });
    } catch (error) {
      console.error('Error getting forecast accuracy:', error);
      res.status(500).json({ error: 'Failed to get forecast accuracy' });
    }
  }

  async getOptimization(req: Request, res: Response) {
    try {
      const { productId } = req.params;

      const optimization = await aiService.optimizeStockLevels(productId);

      res.json({
        success: true,
        data: optimization
      });
    } catch (error) {
      console.error('Error getting optimization:', error);
      res.status(500).json({ error: 'Failed to get optimization recommendations' });
    }
  }

  async applyOptimization(req: Request, res: Response) {
    try {
      const { productId } = req.params;

      const optimization = await aiService.optimizeStockLevels(productId);

      // Update product with optimized values
      await prisma.product.update({
        where: { id: productId },
        data: {
          reorderPoint: optimization.reorderPoint,
          optimalStock: optimization.optimalStock
        }
      });

      // Create activity log
      await prisma.stockMovement.create({
        data: {
          productId,
          movementType: 'ADJUSTMENT',
          quantity: 0, // No actual stock movement
          referenceNumber: `AI-OPT-${Date.now()}`,
          notes: `AI optimization applied: Reorder point set to ${optimization.reorderPoint}, Optimal stock set to ${optimization.optimalStock}`
        }
      });

      res.json({
        success: true,
        data: optimization,
        message: 'Optimization applied successfully'
      });
    } catch (error) {
      console.error('Error applying optimization:', error);
      res.status(500).json({ error: 'Failed to apply optimization' });
    }
  }

  async getOptimizationRecommendations(req: Request, res: Response) {
    try {
      const { limit = 10, riskLevel, category } = req.query;

      // Get products that need optimization
      const whereClause: any = {};
      if (riskLevel) whereClause.riskLevel = riskLevel;
      if (category) whereClause.categoryId = category;

      const products = await prisma.product.findMany({
        where: whereClause,
        take: Number(limit),
        include: {
          category: true,
          supplier: true
        }
      });

      const recommendations = [];

      for (const product of products) {
        try {
          const optimization = await aiService.optimizeStockLevels(product.id);
          
          // Only include if there's significant optimization opportunity
          const stockDifference = Math.abs(optimization.optimalStock - product.currentStock);
          const percentageDifference = (stockDifference / product.currentStock) * 100;

          if (percentageDifference > 15 || optimization.expectedSavings > 50) {
            recommendations.push({
              product: {
                id: product.id,
                name: product.name,
                category: product.category.name,
                supplier: product.supplier.name
              },
              optimization,
              priority: this.calculateOptimizationPriority(optimization, percentageDifference)
            });
          }
        } catch (error) {
          console.error(`Error optimizing product ${product.id}:`, error);
        }
      }

      // Sort by priority and expected savings
      recommendations.sort((a, b) => {
        if (a.priority !== b.priority) {
          const priorityOrder = { 'CRITICAL': 3, 'HIGH': 2, 'MEDIUM': 1, 'LOW': 0 };
          return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
                 (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
        }
        return b.optimization.expectedSavings - a.optimization.expectedSavings;
      });

      res.json({
        success: true,
        data: recommendations,
        metadata: {
          totalRecommendations: recommendations.length,
          totalPotentialSavings: recommendations.reduce((sum, r) => sum + r.optimization.expectedSavings, 0)
        }
      });
    } catch (error) {
      console.error('Error getting optimization recommendations:', error);
      res.status(500).json({ error: 'Failed to get optimization recommendations' });
    }
  }

  async getAnomalies(req: Request, res: Response) {
    try {
      const { productId } = req.params;

      const anomalies = await aiService.detectAnomalies(productId);

      res.json({
        success: true,
        data: anomalies
      });
    } catch (error) {
      console.error('Error getting anomalies:', error);
      res.status(500).json({ error: 'Failed to detect anomalies' });
    }
  }

  async getAllAnomalies(req: Request, res: Response) {
    try {
      const { limit = 20, severity, days = 30 } = req.query;

      // Get high-velocity products for anomaly detection
      const products = await prisma.product.findMany({
        where: { velocity: { in: ['HIGH', 'MEDIUM'] } },
        take: 50, // Limit to prevent timeout
        select: { id: true, name: true, category: { select: { name: true } } }
      });

      const allAnomalies = [];

      for (const product of products) {
        try {
          const anomalies = await aiService.detectAnomalies(product.id);
          
          // Filter by severity and date range
          let filteredAnomalies = anomalies.anomalies;
          
          if (severity) {
            filteredAnomalies = filteredAnomalies.filter(a => a.severity === severity);
          }

          const daysAgo = new Date();
          daysAgo.setDate(daysAgo.getDate() - Number(days));
          filteredAnomalies = filteredAnomalies.filter(a => new Date(a.date) > daysAgo);

          if (filteredAnomalies.length > 0) {
            allAnomalies.push({
              product: {
                id: product.id,
                name: product.name,
                category: product.category.name
              },
              anomalies: filteredAnomalies
            });
          }
        } catch (error) {
          console.error(`Error detecting anomalies for product ${product.id}:`, error);
        }
      }

      // Sort by severity and recency
      allAnomalies.sort((a, b) => {
        const aLatest = a.anomalies[0];
        const bLatest = b.anomalies[0];
        
        if (aLatest.severity !== bLatest.severity) {
          const severityOrder = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
          return (severityOrder[bLatest.severity as keyof typeof severityOrder] || 0) - 
                 (severityOrder[aLatest.severity as keyof typeof severityOrder] || 0);
        }
        
        return new Date(bLatest.date).getTime() - new Date(aLatest.date).getTime();
      });

      res.json({
        success: true,
        data: allAnomalies.slice(0, Number(limit)),
        metadata: {
          totalProducts: products.length,
          productsWithAnomalies: allAnomalies.length,
          totalAnomalies: allAnomalies.reduce((sum, p) => sum + p.anomalies.length, 0)
        }
      });
    } catch (error) {
      console.error('Error getting all anomalies:', error);
      res.status(500).json({ error: 'Failed to get anomalies' });
    }
  }

  async getInsights(req: Request, res: Response) {
    try {
      const { productId } = req.params;

      const insights = await aiService.generateInsights(productId);

      res.json({
        success: true,
        data: insights
      });
    } catch (error) {
      console.error('Error getting insights:', error);
      res.status(500).json({ error: 'Failed to generate insights' });
    }
  }

  async getDashboardInsights(req: Request, res: Response) {
    try {
      const { limit = 10 } = req.query;

      // Get top products by various criteria
      const highRiskProducts = await prisma.product.findMany({
        where: { riskLevel: 'HIGH' },
        take: 5,
        include: { category: true }
      });

      const highVelocityProducts = await prisma.product.findMany({
        where: { velocity: 'HIGH' },
        take: 5,
        include: { category: true }
      });

      const dashboardInsights = [];

      // Generate insights for high-risk products
      for (const product of highRiskProducts) {
        try {
          const insights = await aiService.generateInsights(product.id);
          dashboardInsights.push({
            productId: product.id,
            productName: product.name,
            category: product.category.name,
            type: 'HIGH_RISK',
            insights: insights.insights.slice(0, 2) // Top 2 insights
          });
        } catch (error) {
          console.error(`Error generating insights for product ${product.id}:`, error);
        }
      }

      // Generate optimization insights for high-velocity products
      for (const product of highVelocityProducts) {
        try {
          const optimization = await aiService.optimizeStockLevels(product.id);
          
          if (optimization.expectedSavings > 100) {
            dashboardInsights.push({
              productId: product.id,
              productName: product.name,
              category: product.category.name,
              type: 'OPTIMIZATION_OPPORTUNITY',
              optimization,
              priority: optimization.riskLevel === 'HIGH' ? 'CRITICAL' : 'MEDIUM'
            });
          }
        } catch (error) {
          console.error(`Error generating optimization for product ${product.id}:`, error);
        }
      }

      // Sort by priority and limit results
      dashboardInsights.sort((a, b) => {
        const priorityOrder = { 'CRITICAL': 3, 'HIGH': 2, 'MEDIUM': 1, 'LOW': 0 };
        const aPriority = a.priority || (a.type === 'HIGH_RISK' ? 'HIGH' : 'MEDIUM');
        const bPriority = b.priority || (b.type === 'HIGH_RISK' ? 'HIGH' : 'MEDIUM');
        
        return (priorityOrder[bPriority as keyof typeof priorityOrder] || 0) - 
               (priorityOrder[aPriority as keyof typeof priorityOrder] || 0);
      });

      res.json({
        success: true,
        data: dashboardInsights.slice(0, Number(limit)),
        metadata: {
          totalInsights: dashboardInsights.length,
          highRiskProducts: highRiskProducts.length,
          optimizationOpportunities: dashboardInsights.filter(i => i.type === 'OPTIMIZATION_OPPORTUNITY').length
        }
      });
    } catch (error) {
      console.error('Error getting dashboard insights:', error);
      res.status(500).json({ error: 'Failed to get dashboard insights' });
    }
  }

  async retrainModels(req: Request, res: Response) {
    try {
      const { categoryId } = req.body;

      if (categoryId) {
        // Retrain specific category model
        await aiService.saveModel(categoryId);
        res.json({
          success: true,
          message: `Model retrained for category: ${categoryId}`
        });
      } else {
        // Retrain all models
        const categories = await prisma.category.findMany();
        let retrainedCount = 0;

        for (const category of categories) {
          try {
            await aiService.saveModel(category.id);
            retrainedCount++;
          } catch (error) {
            console.error(`Error retraining model for category ${category.id}:`, error);
          }
        }

        res.json({
          success: true,
          message: `${retrainedCount}/${categories.length} models retrained successfully`
        });
      }
    } catch (error) {
      console.error('Error retraining models:', error);
      res.status(500).json({ error: 'Failed to retrain models' });
    }
  }

  async getModelStatus(req: Request, res: Response) {
    try {
      const categories = await prisma.category.findMany();
      const modelStatus = [];

      for (const category of categories) {
        const productCount = await prisma.product.count({
          where: { categoryId: category.id }
        });

        const recentForecasts = await prisma.forecast.count({
          where: {
            product: { categoryId: category.id },
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
            }
          }
        });

        modelStatus.push({
          categoryId: category.id,
          categoryName: category.name,
          productCount,
          recentForecasts,
          status: recentForecasts > 0 ? 'ACTIVE' : 'INACTIVE',
          lastUpdated: new Date() // This would be actual last update time in production
        });
      }

      res.json({
        success: true,
        data: modelStatus
      });
    } catch (error) {
      console.error('Error getting model status:', error);
      res.status(500).json({ error: 'Failed to get model status' });
    }
  }

  async bulkForecast(req: Request, res: Response) {
    try {
      const { productIds, days } = bulkForecastSchema.parse(req.body);

      const results = [];
      const errors = [];

      for (const productId of productIds) {
        try {
          const forecast = await aiService.generateDemandForecast(productId, days);
          await this.saveForecastToDatabase(forecast);
          results.push({ productId, success: true, forecast });
        } catch (error) {
          errors.push({ 
            productId, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }

      res.json({
        success: true,
        data: {
          successful: results,
          failed: errors,
          summary: {
            total: productIds.length,
            successful: results.length,
            failed: errors.length
          }
        }
      });
    } catch (error) {
      console.error('Error in bulk forecast:', error);
      res.status(500).json({ error: 'Failed to process bulk forecast' });
    }
  }

  async bulkOptimize(req: Request, res: Response) {
    try {
      const { productIds } = z.object({
        productIds: z.array(z.string()).min(1).max(50)
      }).parse(req.body);

      const results = [];
      const errors = [];

      for (const productId of productIds) {
        try {
          const optimization = await aiService.optimizeStockLevels(productId);
          results.push({ productId, success: true, optimization });
        } catch (error) {
          errors.push({ 
            productId, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }

      const totalSavings = results.reduce((sum, r) => sum + r.optimization.expectedSavings, 0);

      res.json({
        success: true,
        data: {
          successful: results,
          failed: errors,
          summary: {
            total: productIds.length,
            successful: results.length,
            failed: errors.length,
            totalPotentialSavings: totalSavings
          }
        }
      });
    } catch (error) {
      console.error('Error in bulk optimize:', error);
      res.status(500).json({ error: 'Failed to process bulk optimization' });
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

  private calculateForecastAccuracy(forecasts: any[], movements: any[]) {
    // Group movements by date
    const actualDemand = new Map();
    movements.forEach(movement => {
      const date = movement.createdAt.toISOString().split('T')[0];
      const current = actualDemand.get(date) || 0;
      actualDemand.set(date, current + Math.abs(movement.quantity));
    });

    // Calculate accuracy metrics
    let totalError = 0;
    let validComparisons = 0;

    forecasts.forEach(forecast => {
      const date = forecast.forecastDate.toISOString().split('T')[0];
      const actual = actualDemand.get(date);
      
      if (actual !== undefined) {
        const error = Math.abs(forecast.predictedDemand - actual);
        const percentageError = actual === 0 ? 0 : error / actual;
        totalError += percentageError;
        validComparisons++;
      }
    });

    const mape = validComparisons > 0 ? totalError / validComparisons : 0;
    const accuracy = Math.max(0, 1 - mape);

    return {
      accuracy: Math.round(accuracy * 100) / 100,
      mape: Math.round(mape * 100) / 100,
      validComparisons,
      totalForecasts: forecasts.length
    };
  }

  private calculateOptimizationPriority(optimization: any, percentageDifference: number): string {
    if (optimization.riskLevel === 'HIGH') return 'CRITICAL';
    if (optimization.expectedSavings > 500 || percentageDifference > 50) return 'HIGH';
    if (optimization.expectedSavings > 200 || percentageDifference > 25) return 'MEDIUM';
    return 'LOW';
  }
}