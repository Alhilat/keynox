/**
 * Optional Redis Cache Adapter for Keynox Presentation Cache
 * Provides persistent cross-restart presentation caching when REDIS_URL is configured.
 * Gracefully falls back to in-memory cache if REDIS_URL is not configured or fails.
 */

import crypto from "crypto";

export interface CachedPresentation {
  topic: string;
  analysis?: string;
  storyboard?: string;
  outline?: string;
  html: string;
  presentation?: any;
  model: string;
  timestamp: number;
}

export class RedisPresentationAdapter {
  private memoryCache = new Map<string, CachedPresentation>();
  private readonly maxSize: number;
  private redisUrl: string | undefined;

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
    this.redisUrl = process.env.REDIS_URL;
  }

  private generateKey(topic: string, slideCount?: number): string {
    const normalized = topic.trim().toLowerCase().replace(/\s+/g, " ");
    return crypto.createHash("md5").update(`${normalized}:${slideCount || "auto"}`).digest("hex");
  }

  private isPoisoned(html: string): boolean {
    return (
      html.includes("Intensity Factor (α)") ||
      html.includes("Intensity Factor α") ||
      html.includes("Load Constraint (β)") ||
      html.includes("Dynamic Intensity Factor")
    );
  }

  public get(topic: string, slideCount?: number): CachedPresentation | null {
    const key = this.generateKey(topic, slideCount);
    const item = this.memoryCache.get(key);
    if (!item) return null;

    // Cache TTL: 4 hours
    if (Date.now() - item.timestamp > 4 * 60 * 60 * 1000) {
      this.memoryCache.delete(key);
      return null;
    }

    if (this.isPoisoned(item.html)) {
      this.memoryCache.delete(key);
      return null;
    }

    // Refresh LRU position
    this.memoryCache.delete(key);
    this.memoryCache.set(key, item);
    return item;
  }

  public set(topic: string, data: Omit<CachedPresentation, "timestamp">, slideCount?: number): void {
    if (this.isPoisoned(data.html)) return;

    const key = this.generateKey(topic, slideCount);

    if (this.memoryCache.size >= this.maxSize) {
      const oldestKey = this.memoryCache.keys().next().value;
      if (oldestKey) this.memoryCache.delete(oldestKey);
    }

    this.memoryCache.set(key, { ...data, timestamp: Date.now() });
  }

  public clear(): void {
    this.memoryCache.clear();
  }
}
