import { randomBytes } from "node:crypto";
import { model, Schema } from "mongoose";
const BookingSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    restaurant: {
        type: Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    time: {
        type: String,
        required: true,
    },
    guests: {
        type: Number,
        required: true,
        min: 1,
    },
    ocasion: {
        type: String,
        trim: true,
    },
    specialRequests: {
        type: String,
        trim: true,
    },
    status: {
        type: String,
        enum: ['confirmed', 'cancelled', 'completed'],
        default: 'confirmed',
    },
    bookingId: {
        type: String,
        unique: true,
        required: true,
    },
}, {
    timestamps: true,
});
BookingSchema.pre("save", function () {
    if (!this.bookingId) {
        this.bookingId = `GR-${randomBytes(4).toString("hex").toUpperCase()}`;
    }
});
export const Booking = model('Booking', BookingSchema);
