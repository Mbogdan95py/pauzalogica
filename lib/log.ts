/**
 * Structured logger for the generation pipeline. Emits one JSON object per line
 * (easy to grep in CI) and redacts anything that looks like a secret. Never log
 * the API key or raw AI responses through this.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

const SECRET_KEY_RE = /(api[-_]?key|secret|token|authorization|password)/i;
const SECRET_VALUE_RE = /\bsk-[A-Za-z0-9_-]{8,}\b/g;

function redact(value: unknown): unknown {
  if (typeof value === 'string') return value.replace(SECRET_VALUE_RE, 'sk-***');
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = SECRET_KEY_RE.test(k) ? '***' : redact(v);
    }
    return out;
  }
  return value;
}

export interface Logger {
  debug(msg: string, data?: Record<string, unknown>): void;
  info(msg: string, data?: Record<string, unknown>): void;
  warn(msg: string, data?: Record<string, unknown>): void;
  error(msg: string, data?: Record<string, unknown>): void;
  child(context: Record<string, unknown>): Logger;
}

const minLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

function emit(level: LogLevel, context: Record<string, unknown>, msg: string, data?: Record<string, unknown>) {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[minLevel]) return;
  const record = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...redact(context) as Record<string, unknown>,
    ...(data ? (redact(data) as Record<string, unknown>) : {}),
  };
  const line = JSON.stringify(record);
  if (level === 'error') process.stderr.write(line + '\n');
  else process.stdout.write(line + '\n');
}

export function createLogger(context: Record<string, unknown> = {}): Logger {
  return {
    debug: (msg, data) => emit('debug', context, msg, data),
    info: (msg, data) => emit('info', context, msg, data),
    warn: (msg, data) => emit('warn', context, msg, data),
    error: (msg, data) => emit('error', context, msg, data),
    child: (extra) => createLogger({ ...context, ...extra }),
  };
}

export const logger = createLogger();
