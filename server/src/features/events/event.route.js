import express from 'express';
import { acceptWorkshop, rejectWorkshop } from './event.controller.js';

export const router = express.Router();

// Accept workshop
router.patch('/:id/accept', acceptWorkshop);

// Reject workshop
router.patch('/:id/reject', rejectWorkshop);

export default router;  
