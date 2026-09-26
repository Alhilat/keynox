import crypto from "crypto";

/** Stage 1 analyzer output cached between runs. */
export interface Stage1Output {
  analysis: string;
  cleanTopic: string;
  model?: string;
}

/** Stage 2 storyboard output cached between runs. */
export interface Stage2Output {
  storyboard: string;
  strategy?: any;
  model?: string;
}

interface CacheEntry {
  value: Stage1Output | Stage2Output;
  expiresAt: number;
}

const STAGE1_TTL_MS = 24 * 60 * 60 * 1000;
const STAGE2_TTL_MS = 12 * 60 * 60 * 1000;

/**
 * Mid-pipeline cache for Stage 1/2 artifacts, wrapping the same
 * hashing discipline as the presentation LRU cache with per-stage TTLs.
 */
export class MidPipelineCache {
  private readonly entries = new Map<string, CacheEntry>();

  /** Returns the hash key for a Stage 1 output. */
  stage1Key(topic: string): string {
    return `s1:${crypto.createHash("sha256").update(topic.trim().toLowerCase()).digest("hex")}`;
  }

  /** Returns the hash key for a Stage 2 output. */
  stage2Key(topic: string, slideCount: number): string {
    return `s2:${crypto.createHash("sha256").update(topic.trim().toLowerCase()).digest("hex")}:${slideCount}`;
  }

  /** Returns cached Stage 1 output, or null on miss/expiry. */
  async getStage1(topic: string): Promise<Stage1Output | null> {
    const hit = this.read(this.stage1Key(topic));
    return hit === null ? null : (hit as Stage1Output);
  }

  /** Stores Stage 1 output for 24 hours. */
  async setStage1(topic: string, output: Stage1Output): Promise<void> {
    this.entries.set(this.stage1Key(topic), { value: output, expiresAt: Date.now() + STAGE1_TTL_MS });
  }

  /** Returns cached Stage 2 output, or null on miss/expiry. */
  async getStage2(topic: string, slideCount: number): Promise<Stage2Output | null> {
    const hit = this.read(this.stage2Key(topic, slideCount));
    return hit === null ? null : (hit as Stage2Output);
  }

  /** Stores Stage 2 output for 12 hours. */
  async setStage2(topic: string, slideCount: number, output: Stage2Output): Promise<void> {
    this.entries.set(this.stage2Key(topic, slideCount), {
      value: output,
      expiresAt: Date.now() + STAGE2_TTL_MS,
    });
  }

  /** Clears both Stage 1 and Stage 2 entries for a topic. */
  async invalidate(topic: string): Promise<void> {
    const digest = crypto.createHash("sha256").update(topic.trim().toLowerCase()).digest("hex");
    for (const key of Array.from(this.entries.keys())) {
      if (key === `s1:${digest}` || key.startsWith(`s2:${digest}:`)) this.entries.delete(key);
    }
  }

  /** Reads an entry, evicting it when expired. */
  private read(key: string): Stage1Output | Stage2Output | null {
    const entry = this.entries.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.entries.delete(key);
      return null;
    }
    return entry.value;
  }
}
