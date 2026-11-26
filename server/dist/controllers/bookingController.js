import { Booking } from '../models/Booking.js';
import Restaurant from '../models/Restaurant.js';
//Create a new booking
// POST /api/bookings
// @access Private
export const createBooking = async (req, res) => {
    try {
        const { restaurantId, date, time, guests, occasion, specialRequests } = req.body;
        if (!restaurantId || !date || !time || !guests) {
            res.status(400).json({ message: 'Please provide all required fields' });
            return;
        }
        //check if restaurant exists
        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            res.status(404).json({ message: 'Restaurant not found' });
            return;
        }
        //verify if restaurant is approved
        if (restaurant.status !== 'approved') {
            res.status(403).json({ message: 'Reservation are not open  for this restaurant yet' });
            return;
        }
        //verify seat availability for the selected date and time
        const requestedGuests = Number(guests);
        const existingBookings = await Booking.find({
            restaurant: restaurantId,
            date: new Date(date),
            time: time,
            status: 'confirmed'
        });
        const bookedSeats = existingBookings.reduce((sum, b) => sum + b.guests, 0);
        const totalSeats = restaurant.totalSeats || 20; //default to 20 if not set
        const availableSeats = Math.max(0, totalSeats - bookedSeats);
        if (requestedGuests > availableSeats) {
            res.status(400).json({ message: `Only ${availableSeats} seats are available for the selected date and time` });
            return;
        }
        const booking = await Booking.create({
            user: req.user?._id,
            restaurant: restaurantId,
            date: new Date(date),
            time,
            guests: requestedGuests,
            ocasion: occasion,
            specialRequests,
            status: 'confirmed'
        });
        //populate restaurant and user details in the booking response
        const populatedBooking = await booking.populate('restaurant', 'name image location address');
        res.status(201).json(populatedBooking);
    }
    catch (error) {
        console.error(error);
        res.status(400).json({ message: error.message || 'Server error' });
    }
};
//get logged in user bookings
//get /api/bookings/my
// @access Private
export const getMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user?._id }).populate('restaurant', 'name location image address slug').sort({ date: -1, time: -1 }); //sort by date descending and time ascending
        res.status(200).json(bookings);
    }
    catch (error) {
        console.error(error);
        res.status(400).json({ message: error.message || 'Server error' });
    }
};
//cancel a booking
//put /api/bookings/:id/cancel
// @access Private
export const cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            res.status(404).json({ message: 'Booking not found' });
            return;
        }
        //check if the logged in user is the owner of the booking
        if (booking.user.toString() !== req.user?._id.toString()) {
            res.status(403).json({ message: 'You are not authorized to cancel this booking' });
            return;
        }
        booking.status = 'cancelled';
        await booking.save();
        const populatedBooking = await booking.populate('restaurant', 'name image location address');
        res.status(200).json(populatedBooking);
    }
    catch (error) {
        console.error(error);
        res.status(400).json({ message: error.message || 'Server error' });
    }
};
