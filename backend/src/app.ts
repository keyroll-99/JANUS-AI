import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errorHandler } from './shared/middlewares/errorHandler';
import authRouter from './auth/auth.routes';
import profileRouter from './profile/profile.routes';
import transactionRouter from './transactions/transaction.routes';
import strategyRouter from './strategies/strategies.routes';
import portfolioRouter from './portfolios/portfolios.routes';
import analysisRouter from './ai-analysis/analysis.routes';
import config from './shared/config/config';
import { initializeAIProviders } from './ai-analysis/providers';

// Initialize AI providers
initializeAIProviders();

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true, // Allow cookies to be sent
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parsing middleware
app.use(cookieParser());

// API routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/profile', profileRouter);
app.use('/api/v1/transactions', transactionRouter);
app.use('/api/v1/strategy', strategyRouter);
app.use('/api/v1/dashboard', portfolioRouter);
app.use('/api/v1/analyses', analysisRouter);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;