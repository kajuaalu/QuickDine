import "dotenv/config";
import express, { Request, Response } from 'express';
import cors from "cors";
import { connectToMongoDB, disconnectFromMongoDB } from './config/db.js';

const app = express();

// Connect to MongoDB
connectToMongoDB().then(() => {
    console.log("Connected to MongoDB");
}).catch((err) => {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1); // Exit the process with an error code
});

// Middleware
app.use(cors())
app.use(express.json());

const port = process.env.PORT || 5000;

app.get('/', (req: Request, res: Response) => {
    res.send('Server is Live!');
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});