import "dotenv/config";
import express, { Request, Response } from 'express';
import cors from "cors";
import { connectToMongoDB, disconnectFromMongoDB } from './config/db.js';

const app = express();

// Middleware
app.use(cors())
app.use(express.json());

const port = process.env.PORT || 5000;

app.get('/', (req: Request, res: Response) => {
    res.send('Server is Live!');
});

// Start accepting requests only after MongoDB is ready.
connectToMongoDB().then(() => {
    console.log("Connected to MongoDB");
    app.listen(port, () => {
        console.log(`Server is running at http://localhost:${port}`);
    });
}).catch((err) => {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1); // Exit the process with an error code
});
