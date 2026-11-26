import Restaurant from "../models/Restaurant.js";
import { Booking } from "../models/Booking.js";
import { v2 as cloudinary } from "cloudinary";
const uploadToCloudinary = (fileBuffer) => new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder: "QuickDine" }, (error, result) => {
        if (error)
            return reject(error);
        if (!result?.secure_url)
            return reject(new Error("Upload failed"));
        resolve({ secure_url: result.secure_url });
    });
    stream.end(fileBuffer);
});
const parseCommaSeparated = (value, fallback = []) => {
    if (Array.isArray(value)) {
        return value.map((item) => String(item).trim()).filter(Boolean);
    }
    if (typeof value === "string") {
        return value.split(",").map((item) => item.trim()).filter(Boolean);
    }
    return fallback;
};
const makeSlug = (name) => name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
const allowedPriceRanges = ["$", "$$", "$$$", "$$$$"];
// GET /api/owner/restaurants
export const getOwnerRestaurants = async (req, res) => {
    try {
        const ownerId = req.user?._id;
        if (!ownerId) {
            res.status(401).json({ message: "Not authorized" });
            return;
        }
        const restaurant = await Restaurant.findOne({ owner: ownerId });
        res.status(200).json(restaurant);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || "Server error" });
    }
};
// POST /api/owner/restaurants
export const createOwnerRestaurant = async (req, res) => {
    try {
        const ownerId = req.user?._id;
        if (!ownerId) {
            res.status(401).json({ message: "Not authorized" });
            return;
        }
        const existing = await Restaurant.findOne({ owner: ownerId });
        if (existing) {
            res.status(400).json({ message: "You already have a restaurant registered" });
            return;
        }
        const { name, description, cuisine, priceRange, location, address, chef, tags, availableSlots, totalSeats } = req.body;
        const imageUrl = typeof req.body.image === "string" ? req.body.image.trim() : "";
        if (!name || !description || !cuisine || !priceRange || !location || !address || !chef) {
            res.status(400).json({ message: "Please provide all required fields" });
            return;
        }
        if (!allowedPriceRanges.includes(priceRange)) {
            res.status(400).json({ message: "Invalid price range" });
            return;
        }
        const seats = Number(totalSeats ?? 20);
        if (!Number.isFinite(seats) || seats < 20) {
            res.status(400).json({ message: "Total seats must be at least 20" });
            return;
        }
        const slug = makeSlug(String(name));
        if (!slug) {
            res.status(400).json({ message: "Please provide a valid restaurant name" });
            return;
        }
        if (await Restaurant.findOne({ slug })) {
            res.status(400).json({ message: "A restaurant with this name already exists" });
            return;
        }
        let finalImageUrl = imageUrl;
        if (req.file) {
            const upload = await uploadToCloudinary(req.file.buffer);
            finalImageUrl = upload.secure_url;
        }
        if (!finalImageUrl) {
            res.status(400).json({ message: "Please provide a restaurant image" });
            return;
        }
        const restaurant = await Restaurant.create({
            name: String(name).trim(),
            slug,
            description: String(description).trim(),
            cuisine: String(cuisine).trim(),
            priceRange,
            location: String(location).trim(),
            address: String(address).trim(),
            chef: String(chef).trim(),
            image: finalImageUrl,
            tags: parseCommaSeparated(tags),
            availableSlots: parseCommaSeparated(availableSlots, [
                "17:00", "18:00", "19:00", "20:00", "21:00",
            ]),
            totalSeats: seats,
            owner: ownerId,
            status: "pending",
        });
        res.status(201).json(restaurant);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || "Server error" });
    }
};
// PUT /api/owner/restaurants/:id
export const updateOwnerRestaurant = async (req, res) => {
    try {
        const ownerId = req.user?._id;
        if (!ownerId) {
            res.status(401).json({ message: "Not authorized" });
            return;
        }
        const restaurant = await Restaurant.findOne({ _id: req.params.id, owner: ownerId });
        if (!restaurant) {
            res.status(404).json({ message: "Restaurant profile not found" });
            return;
        }
        const { name, description, cuisine, priceRange, location, address, chef, tags, availableSlots, totalSeats } = req.body;
        if (name !== undefined) {
            const trimmedName = String(name).trim();
            if (!trimmedName) {
                res.status(400).json({ message: "Restaurant name cannot be empty" });
                return;
            }
            const slug = makeSlug(trimmedName);
            if (!slug) {
                res.status(400).json({ message: "Please provide a valid restaurant name" });
                return;
            }
            if (slug !== restaurant.slug) {
                const slugExists = await Restaurant.findOne({ slug, _id: { $ne: restaurant._id } });
                if (slugExists) {
                    res.status(400).json({ message: "A restaurant with this name already exists" });
                    return;
                }
                restaurant.slug = slug;
            }
            restaurant.name = trimmedName;
        }
        if (description !== undefined)
            restaurant.description = String(description).trim();
        if (cuisine !== undefined)
            restaurant.cuisine = String(cuisine).trim();
        if (priceRange !== undefined) {
            if (!allowedPriceRanges.includes(priceRange)) {
                res.status(400).json({ message: "Invalid price range" });
                return;
            }
            restaurant.priceRange = priceRange;
        }
        if (location !== undefined)
            restaurant.location = String(location).trim();
        if (address !== undefined)
            restaurant.address = String(address).trim();
        if (chef !== undefined)
            restaurant.chef = String(chef).trim();
        if (tags !== undefined)
            restaurant.tags = parseCommaSeparated(tags);
        if (availableSlots !== undefined)
            restaurant.availableSlots = parseCommaSeparated(availableSlots);
        if (totalSeats !== undefined) {
            const seats = Number(totalSeats);
            if (!Number.isFinite(seats) || seats < 20) {
                res.status(400).json({ message: "Total seats must be at least 20" });
                return;
            }
            restaurant.totalSeats = seats;
        }
        if (req.file) {
            const upload = await uploadToCloudinary(req.file.buffer);
            restaurant.image = upload.secure_url;
        }
        else if (typeof req.body.image === "string" && req.body.image.trim()) {
            restaurant.image = req.body.image.trim();
        }
        await restaurant.save();
        res.status(200).json(restaurant);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || "Server error" });
    }
};
// GET /api/owner/bookings
export const getOwnerBookings = async (req, res) => {
    try {
        const ownerId = req.user?._id;
        if (!ownerId) {
            res.status(401).json({ message: "Not authorized" });
            return;
        }
        const restaurant = await Restaurant.findOne({ owner: ownerId });
        if (!restaurant) {
            res.status(404).json({ message: "Restaurant profile not found" });
            return;
        }
        const bookings = await Booking.find({ restaurant: restaurant._id })
            .populate("user", "name email")
            .sort({ date: -1, time: -1 });
        res.status(200).json(bookings);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || "Server error" });
    }
};
// PUT /api/owner/bookings/:id/status
export const updateBookingStatus = async (req, res) => {
    try {
        const ownerId = req.user?._id;
        if (!ownerId) {
            res.status(401).json({ message: "Not authorized" });
            return;
        }
        const restaurant = await Restaurant.findOne({ owner: ownerId });
        if (!restaurant) {
            res.status(404).json({ message: "Restaurant profile not found" });
            return;
        }
        const { status } = req.body;
        if (!["confirmed", "cancelled", "completed"].includes(status)) {
            res.status(400).json({ message: "Invalid booking status" });
            return;
        }
        const booking = await Booking.findOne({
            _id: req.params.id,
            restaurant: restaurant._id,
        });
        if (!booking) {
            res.status(404).json({ message: "Booking not found" });
            return;
        }
        booking.status = status;
        await booking.save();
        const updatedBooking = await booking.populate("user", "name email");
        res.status(200).json(updatedBooking);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || "Server error" });
    }
};
