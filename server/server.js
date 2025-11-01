const express = require('express');
const cors = require('cors');

// Initialize the Express app
const app = express();
const port = 3001; // Server is on port 3001

// Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Allows the server to read JSON bodies from requests

// Basic Test Route
app.get('/', (req, res) => {
    res.send('Cloud Notes API is running!');
});

// Notes API placeholder route (We will update this on Day 2)
app.get('/notes', (req, res) => {
    // Placeholder data for now
    res.json([
        { id: 1, text: 'Welcome to Cloud Notes!', date: '2025-01-01'},
    ]);
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port: ${port}`);
});