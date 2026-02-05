import helmet from 'helmet';
import { Express } from 'express';

export const setupSecurity = (app: Express) => {
  // Helmet - HTTP headers security
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // Prevent clickjacking
  app.use(helmet.frameguard({ action: 'deny' }));

  // Hide X-Powered-By header
  app.use(helmet.hidePoweredBy());

  // Prevent MIME type sniffing
  app.use(helmet.noSniff());

  // Enable XSS filter
  app.use(helmet.xssFilter());
};
