import Redis from 'redis';

export class CacheService {
  private client: any;
  private isConnected = false;

  constructor() {
    this.client = Redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    this.client.on('error', (err: Error) => {
      console.error('Redis Client Error:', err);
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      console.log('✅ Redis connected');
      this.isConnected = true;
    });

    this.connect();
  }

  private async connect() {
    try {
      await this.client.connect();
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      // Fallback to in-memory cache if Redis is not available
      this.setupFallbackCache();
    }
  }

  private fallbackCache = new Map<string, { value: string; expiry: number }>();

  private setupFallbackCache() {
    console.log('⚠️  Using in-memory cache fallback');
    
    // Clean up expired entries every 5 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.fallbackCache.entries()) {
        if (entry.expiry < now) {
          this.fallbackCache.delete(key);
        }
      }
    }, 5 * 60 * 1000);
  }

  async get(key: string): Promise<string | null> {
    try {
      if (this.isConnected) {
        return await this.client.get(key);
      } else {
        // Use fallback cache
        const entry = this.fallbackCache.get(key);
        if (entry && entry.expiry > Date.now()) {
          return entry.value;
        }
        return null;
      }
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: string, ttl: number = 3600): Promise<void> {
    try {
      if (this.isConnected) {
        await this.client.setEx(key, ttl, value);
      } else {
        // Use fallback cache
        this.fallbackCache.set(key, {
          value,
          expiry: Date.now() + (ttl * 1000)
        });
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      if (this.isConnected) {
        await this.client.del(key);
      } else {
        this.fallbackCache.delete(key);
      }
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async invalidate(pattern: string): Promise<void> {
    try {
      if (this.isConnected) {
        const keys = await this.client.keys(pattern);
        if (keys.length > 0) {
          await this.client.del(keys);
        }
      } else {
        // For fallback cache, remove keys that match the pattern
        const regex = new RegExp(pattern.replace('*', '.*'));
        for (const key of this.fallbackCache.keys()) {
          if (regex.test(key)) {
            this.fallbackCache.delete(key);
          }
        }
      }
    } catch (error) {
      console.error('Cache invalidate error:', error);
    }
  }

  async flush(): Promise<void> {
    try {
      if (this.isConnected) {
        await this.client.flushAll();
      } else {
        this.fallbackCache.clear();
      }
    } catch (error) {
      console.error('Cache flush error:', error);
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.isConnected) {
        await this.client.disconnect();
      }
      this.fallbackCache.clear();
    } catch (error) {
      console.error('Cache disconnect error:', error);
    }
  }
}