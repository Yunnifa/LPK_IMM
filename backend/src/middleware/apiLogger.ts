import { Context, Next } from 'hono';

export const apiLogger = async (c: Context, next: Next) => {
  const start = Date.now();
  const method = c.req.method;
  const path = new URL(c.req.url).pathname;

  try {
    await next();
  } catch (err: any) {
    const duration = Date.now() - start;
    console.error(`\x1b[31m${method}\x1b[0m ${path} - ERROR (${duration}ms):`, err.message);
    throw err;
  }

  const duration = Date.now() - start;
  const status = c.res.status;
  const statusColor = status >= 500 ? '\x1b[31m' : status >= 400 ? '\x1b[33m' : '\x1b[32m';
  console.log(`${statusColor}${method}\x1b[0m ${path} - ${status} (${duration}ms)`);
};

// No-op for backward compatibility
export const getRecentLogs = (_lines: number = 100): string[] => [];
