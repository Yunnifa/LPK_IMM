import { Context, Next } from 'hono';
import fs from 'fs';
import path from 'path';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Get log file path with date
const getLogFilePath = () => {
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return path.join(logsDir, `api-${date}.log`);
};

// Format log entry
const formatLogEntry = (data: {
  timestamp: string;
  method: string;
  url: string;
  status: number;
  duration: number;
  ip: string;
  userAgent: string;
  body?: any;
  query?: Record<string, string>;
  error?: string;
}) => {
  return JSON.stringify(data) + '\n';
};

// Write to log file
const writeToLog = (entry: string) => {
  const logFile = getLogFilePath();
  fs.appendFileSync(logFile, entry, 'utf8');
};

export const apiLogger = async (c: Context, next: Next) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  const method = c.req.method;
  const url = c.req.url;
  const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
  const userAgent = c.req.header('user-agent') || 'unknown';
  
  // Get query params
  const urlObj = new URL(url);
  const query: Record<string, string> = {};
  urlObj.searchParams.forEach((value, key) => {
    query[key] = value;
  });

  // Get request body for POST/PUT/PATCH (excluding sensitive data)
  let body: any = undefined;
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    try {
      const clonedReq = c.req.raw.clone();
      const rawBody = await clonedReq.json();
      // Remove sensitive fields
      body = { ...rawBody };
      if (body.password) body.password = '[REDACTED]';
      if (body.token) body.token = '[REDACTED]';
    } catch {
      // Body might not be JSON
    }
  }

  let error: string | undefined;
  
  try {
    await next();
  } catch (err: any) {
    error = err.message || 'Unknown error';
    throw err;
  } finally {
    const duration = Date.now() - start;
    const status = c.res.status;

    // Console log (colorized)
    const statusColor = status >= 500 ? '\x1b[31m' : status >= 400 ? '\x1b[33m' : '\x1b[32m';
    console.log(`${statusColor}${method}\x1b[0m ${url} - ${status} (${duration}ms)`);

    // Write to log file
    const logEntry = formatLogEntry({
      timestamp,
      method,
      url: urlObj.pathname,
      status,
      duration,
      ip,
      userAgent,
      ...(Object.keys(query).length > 0 && { query }),
      ...(body && { body }),
      ...(error && { error }),
    });

    writeToLog(logEntry);
  }
};

// Utility: Get recent logs (for admin endpoint if needed)
export const getRecentLogs = (lines: number = 100): string[] => {
  const logFile = getLogFilePath();
  if (!fs.existsSync(logFile)) return [];
  
  const content = fs.readFileSync(logFile, 'utf8');
  const allLines = content.trim().split('\n').filter(Boolean);
  return allLines.slice(-lines);
};
