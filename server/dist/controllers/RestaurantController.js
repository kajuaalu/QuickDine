import Restaurant from '../models/Restaurant.js';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { Booking } from '../models/Booking.js';
//get all restaurants with search and filters
export const getRestaurants = async (req, res) => {
    try {
        //.query contains the query parameters sent by the client in the request URL. 
        // In this case, we are extracting the search, priceRange, rating, location, and sort parameters from req.query. 
        // These parameters will be used to filter and sort the list of restaurants returned to the client.
        const { search, priceRange, rating, location, sort } = req.query;
        //build the query object based on the provided filters
        const queryObj = { status: 'approved' }; //only fetch approved restaurants
        if (search) {
            queryObj.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { cuisine: { $regex: search, $options: 'i' } },
                { tags: { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } }
            ];
        }
        if (priceRange) {
            const prices = Array.isArray(priceRange) ? priceRange : [priceRange];
            queryObj.priceRange = { $in: prices };
        }
        if (rating) {
            queryObj.rating = { $gte: Number(rating) };
        }
        if (location) {
            queryObj.location = { $regex: location, $options: 'i' };
        }
        //sorting
        let sortOption = { createdAt: -1 }; //default sort by newest
        if (sort === 'rating') {
            sortOption = { rating: -1 };
        }
        else if (sort === 'price_low') {
            sortOption = { priceRange: 1 };
        }
        else if (sort === 'price_high') {
            sortOption = { priceRange: -1 };
        }
        const restaurant = await Restaurant.find(queryObj).sort(sortOption);
        res.json(restaurant);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
};
//get featured restaurants and exclusive restaurants
// GET /api/restaurants/featured
export const getFeaturedRestaurants = async (req, res) => {
    try {
        const featured = await Restaurant.find({
            status: 'approved',
            featured: true
        }).limit(6);
        const exclusive = await Restaurant.find({
            status: 'approved',
            exclusive: true
        }).limit(6);
        res.json({ featured, exclusive });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
};
//get restaurant by slug
// get /api/restaurants/:slug
export const getRestaurantBySlug = async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ slug: req.params.slug });
        if (!restaurant) {
            res.status(404).json({ message: 'Restaurant not found' });
            return;
        }
        //if restaurant is not approved, verify if the user is the owner or admin, otherwise return 403
        if (restaurant.status !== 'approved') {
            let isAuthorized = false;
            if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
                try {
                    const token = req.headers.authorization.split(' ')[1];
                    const decoded = jwt.verify(token, process.env.JWT_SECRET);
                    const user = await User.findById(decoded.id);
                    if (user && (user.role === 'admin' || (user.role === 'owner' && restaurant.owner.toString() === user._id.toString()))) {
                        isAuthorized = true;
                    }
                }
                catch (error) {
                    console.error(error);
                }
            }
            if (!isAuthorized) {
                res.status(403).json({ message: 'Restaurant not found, pending approval' });
                return;
            }
        }
        res.json(restaurant);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
};
//get restaurant by availability fpr slots
//get api/restaurants/:id/availabilty
export const getRestaurantAvailability = async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) {
            res.status(400).json({ message: 'Please provide a date' });
            return;
        }
        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) {
            res.status(404).json({ message: 'Restaurant not found' });
            return;
        }
        const bookingDate = new Date(date);
        //get all active bookings on this date for this restaurant
        const bookings = await Booking.find({
            restaurant: restaurant._id,
            date: bookingDate,
            status: 'confirmed'
        });
        //map slots to availability capacity
        const availability = restaurant.availableSlots.map(slot => {
            const bookedSeats = bookings.filter(b => b.time === slot).reduce((sum, b) => sum + b.guests, 0);
            const totalSeats = restaurant.totalSeats || 20;
            const availableSeats = Math.max(0, totalSeats - bookedSeats);
            return {
                time: slot,
                availableSeats,
                isAvailable: availableSeats > 0
            };
        });
        res.json(availability);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
};
