import { Server } from 'socket.io';

export class SocketHandler {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Join dashboard room for real-time updates
      socket.on('join-dashboard', () => {
        socket.join('dashboard');
        console.log(`Client ${socket.id} joined dashboard room`);
      });

      // Join product-specific room for detailed updates
      socket.on('join-product', (productId: string) => {
        socket.join(`product-${productId}`);
        console.log(`Client ${socket.id} joined product room: ${productId}`);
      });

      // Leave rooms on disconnect
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });

      // Handle AI operation requests
      socket.on('request-forecast', async (data) => {
        try {
          // Emit acknowledgment
          socket.emit('forecast-started', { productId: data.productId });
          
          // The actual forecast generation would be handled by the AI service
          // This is just for real-time communication
        } catch (error) {
          socket.emit('forecast-error', { 
            productId: data.productId, 
            error: 'Failed to start forecast generation' 
          });
        }
      });
    });
  }

  // Broadcast stock level updates
  broadcastStockUpdate(productId: string, data: any) {
    this.io.to('dashboard').emit('stock-updated', {
      productId,
      ...data,
      timestamp: new Date()
    });

    this.io.to(`product-${productId}`).emit('product-updated', {
      productId,
      ...data,
      timestamp: new Date()
    });
  }

  // Broadcast new alerts
  broadcastAlert(alert: any) {
    this.io.to('dashboard').emit('new-alert', {
      ...alert,
      timestamp: new Date()
    });

    if (alert.productId) {
      this.io.to(`product-${alert.productId}`).emit('product-alert', {
        ...alert,
        timestamp: new Date()
      });
    }
  }

  // Broadcast AI-generated insights
  broadcastInsight(insight: any) {
    this.io.to('dashboard').emit('new-insight', {
      ...insight,
      timestamp: new Date()
    });

    if (insight.productId) {
      this.io.to(`product-${insight.productId}`).emit('product-insight', {
        ...insight,
        timestamp: new Date()
      });
    }
  }

  // Broadcast forecast updates
  broadcastForecastUpdate(productId: string, forecast: any) {
    this.io.to('dashboard').emit('forecast-updated', {
      productId,
      forecast,
      timestamp: new Date()
    });

    this.io.to(`product-${productId}`).emit('forecast-complete', {
      productId,
      forecast,
      timestamp: new Date()
    });
  }

  // Broadcast optimization recommendations
  broadcastOptimization(productId: string, optimization: any) {
    this.io.to('dashboard').emit('optimization-available', {
      productId,
      optimization,
      timestamp: new Date()
    });

    this.io.to(`product-${productId}`).emit('optimization-complete', {
      productId,
      optimization,
      timestamp: new Date()
    });
  }

  // Broadcast anomaly detection results
  broadcastAnomaly(productId: string, anomalies: any) {
    this.io.to('dashboard').emit('anomalies-detected', {
      productId,
      anomalies,
      timestamp: new Date()
    });

    this.io.to(`product-${productId}`).emit('product-anomalies', {
      productId,
      anomalies,
      timestamp: new Date()
    });
  }

  // Generic update broadcaster for AI scheduler
  broadcastUpdate(event: string, data: any) {
    this.io.to('dashboard').emit(event, {
      ...data,
      timestamp: new Date()
    });
  }

  // Broadcast system status updates
  broadcastSystemStatus(status: any) {
    this.io.emit('system-status', {
      ...status,
      timestamp: new Date()
    });
  }

  // Get connected clients count
  getConnectedClientsCount(): number {
    return this.io.engine.clientsCount;
  }

  // Get room information
  async getRoomInfo(room: string) {
    const sockets = await this.io.in(room).fetchSockets();
    return {
      room,
      clientCount: sockets.length,
      clients: sockets.map(s => s.id)
    };
  }
}