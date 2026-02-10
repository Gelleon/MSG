type LogLevel = 'info' | 'warn' | 'error';

class LoggerService {
  private static instance: LoggerService;
  private isDevelopment = process.env.NODE_ENV === 'development';

  private constructor() {}

  public static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  public info(message: string, context?: Record<string, any>) {
    this.log('info', message, context);
  }

  public warn(message: string, context?: Record<string, any>) {
    this.log('warn', message, context);
  }

  public error(message: string, context?: Record<string, any>) {
    this.log('error', message, context);
  }

  public logVisibilityIssue(component: string, elementSelector: string, details: Record<string, any>) {
    this.error(`[UI Visibility Issue] ${component}: ${elementSelector} is not visible as expected`, details);
    // TODO: Send to external monitoring service (Sentry, LogRocket, etc.)
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>) {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level,
      message,
      ...context,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      url: typeof window !== 'undefined' ? window.location.href : 'server',
    };

    if (this.isDevelopment) {
      const style = {
        info: 'color: #3b82f6',
        warn: 'color: #f59e0b',
        error: 'color: #ef4444; font-weight: bold',
      };
      console.log(`%c[${level.toUpperCase()}] ${message}`, style[level], context || '');
    } else {
      // In production, you would send this to your logging backend
      // console.log(JSON.stringify(logData));
      if (level === 'error') {
        console.error(logData);
      }
    }
  }
}

export const logger = LoggerService.getInstance();
