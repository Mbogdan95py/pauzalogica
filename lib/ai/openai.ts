import fs from 'node:fs';
import path from 'node:path';
import { aiConfig, MODEL_PRICING } from '@/lib/config';
import { createLogger } from '@/lib/log';
import { editorialPayloadSchema } from './schema';
import { EDITORIAL_JSON_SCHEMA } from './schema';
import { SYSTEM_PROMPT, buildUserPrompt } from './prompt';
import type { AiProvider, EditorialResult } from './provider';

const log = createLogger({ component: 'openai-provider' });

/**
 * Real OpenAI provider using the Responses API with Structured Outputs.
 * Node-only, used exclusively by the generation script — never bundled for the
 * browser and never invoked at site runtime.
 */
export class OpenAiProvider implements AiProvider {
  readonly name: string;

  constructor(
    private readonly model: string,
    private readonly source: 'primary' | 'fallback-model',
  ) {
    this.name = `openai:${model}`;
  }

  async generateEditorial(date: string, seed: string): Promise<EditorialResult> {
    const started = Date.now();
    if (!aiConfig.apiKey) throw new Error('OPENAI_API_KEY missing');

    // Imported lazily so mock-mode never needs the dependency at runtime.
    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({
      apiKey: aiConfig.apiKey,
      timeout: aiConfig.requestTimeoutMs,
      maxRetries: 0, // retries are orchestrated by us, with backoff + fallback
    });

    const response = await client.responses.create({
      model: this.model,
      instructions: SYSTEM_PROMPT,
      input: buildUserPrompt(date, seed),
      max_output_tokens: aiConfig.maxOutputTokens,
      // Low temperature + low reasoning effort → stable, concise editorial output.
      temperature: 0.4,
      text: {
        format: {
          type: 'json_schema',
          name: EDITORIAL_JSON_SCHEMA.name,
          strict: EDITORIAL_JSON_SCHEMA.strict,
          schema: EDITORIAL_JSON_SCHEMA.schema as Record<string, unknown>,
        },
      },
    } as never);

    const resp = response as unknown as {
      output_text?: string;
      usage?: { input_tokens?: number; output_tokens?: number };
    };

    const rawText = resp.output_text ?? '';
    if (aiConfig.saveRaw) {
      // Development-only debugging aid; never enabled in production.
      const dir = path.join(process.cwd(), 'tmp', 'ai-raw');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, `${date}-${this.model}.raw.json`), rawText, 'utf8');
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawText);
    } catch {
      throw new Error(`model ${this.model} returned non-JSON output`);
    }
    const parsed = editorialPayloadSchema.safeParse(parsedJson);
    if (!parsed.success) {
      throw new Error(`model ${this.model} output failed schema validation: ${parsed.error.issues[0]?.message}`);
    }

    const inputTokens = resp.usage?.input_tokens ?? 0;
    const outputTokens = resp.usage?.output_tokens ?? 0;
    const pricing = MODEL_PRICING[this.model];
    const estimatedCostUsd = pricing
      ? (inputTokens * pricing.inputPerM + outputTokens * pricing.outputPerM) / 1_000_000
      : 0;

    log.info('editorial generated', {
      model: this.model,
      inputTokens,
      outputTokens,
      estimatedCostUsd: Number(estimatedCostUsd.toFixed(5)),
      durationMs: Date.now() - started,
    });

    return {
      payload: parsed.data,
      model: this.model,
      source: this.source,
      attempts: 1,
      inputTokens,
      outputTokens,
      estimatedCostUsd,
      durationMs: Date.now() - started,
    };
  }
}
