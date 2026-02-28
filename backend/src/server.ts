import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDB } from './config/db';
import { startCronJobs } from './services/cronService';

dotenv.config();

// Initialize local JSON DB
initDB();

const app: Express = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
import scheduleRoutes from './routes/scheduleRoutes';
import { testEmail } from './controllers/testEmailController';

app.use('/api/schedules', scheduleRoutes);
app.get('/api/test-email', testEmail);

app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'healthy', message: 'CommuteSync API is running' });
});

app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
    startCronJobs();
});
