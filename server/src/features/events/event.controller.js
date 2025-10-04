import { Event } from './event.model.js';
import { workshopStatusSchema } from './event.validation.js';

// Accept workshop
export const acceptWorkshop = async (req, res) => {
  try {
    const { error } = workshopStatusSchema.validate({ id: req.params.id, status: 'approved' });
    if (error) return res.status(400).json({ message: error.details[0].message });

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { status: 'approved' },
      { new: true }
    );

    if (!event) {
      return res.status(404).json({ message: 'Workshop not found' });
    }

    res.status(200).json({ message: 'Workshop accepted and published', event });
  } catch (error) {
    res.status(500).json({ message: 'Error accepting workshop', error });
  }
};

// Reject workshop
export const rejectWorkshop = async (req, res) => {
  try {
    const { error } = workshopStatusSchema.validate({ id: req.params.id, status: 'rejected' });
    if (error) return res.status(400).json({ message: error.details[0].message });

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    );

    if (!event) {
      return res.status(404).json({ message: 'Workshop not found' });
    }

    res.status(200).json({ message: 'Workshop rejected', event });
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting workshop', error });
  }
};
