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

class PresentationCache {
  private cache = new Map<string, CachedPresentation>();
  private readonly maxSize: number;

  constructor(maxSize = 50) {
    this.maxSize = maxSize;
  }

  private generateKey(topic: string, slideCount?: number): string {
    const normalized = topic.trim().toLowerCase().replace(/\s+/g, " ");
    return crypto.createHash("md5").update(`${normalized}:${slideCount || "auto"}`).digest("hex");
  }

  public get(topic: string, slideCount?: number): CachedPresentation | null {
    const key = this.generateKey(topic, slideCount);
    const item = this.cache.get(key);
    if (!item) return null;

    // Cache valid for 4 hours
    if (Date.now() - item.timestamp > 4 * 60 * 60 * 1000) {
      this.cache.delete(key);
      return null;
    }

    // Invalidate if contains generic placeholder Greek letters (poison filter)
    if (
      item.html.includes("Intensity Factor (α)") ||
      item.html.includes("Intensity Factor α") ||
      item.html.includes("Load Constraint (β)") ||
      item.html.includes("Dynamic Intensity Factor")
    ) {
      this.cache.delete(key);
      return null;
    }

    // Refresh LRU position
    this.cache.delete(key);
    this.cache.set(key, item);
    return item;
  }

  public set(topic: string, data: Omit<CachedPresentation, "timestamp">, slideCount?: number): void {
    // Never cache generic placeholder boilerplate
    if (
      data.html.includes("Intensity Factor (α)") ||
      data.html.includes("Intensity Factor α") ||
      data.html.includes("Load Constraint (β)") ||
      data.html.includes("Dynamic Intensity Factor")
    ) {
      return;
    }

    const key = this.generateKey(topic, slideCount);

    if (this.cache.size >= this.maxSize) {
      // Remove oldest entry
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(key, { ...data, timestamp: Date.now() });
  }

  public clear(): void {
    this.cache.clear();
  }
}

export const presentationCache = new PresentationCache();
