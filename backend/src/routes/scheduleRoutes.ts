import express from 'express';
import { getSchedules, createSchedule, deleteSchedule, triggerSchedule } from '../controllers/scheduleController';

const router = express.Router();

router.route('/').post(createSchedule);
router.route('/:email').get(getSchedules);
router.route('/:id').delete(deleteSchedule);
router.route('/:id/trigger').post(triggerSchedule);

export default router;
