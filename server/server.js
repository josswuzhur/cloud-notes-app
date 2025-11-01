const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin'); // 1. Import Admin SDK

// Lod service account key for authentication
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

// Get a reference to the Firestore database
const db = admin.firestore();

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Basic Test Route
app.get('/', (req, res) => {
    res.send('Cloud Notes API is running and connected to Firestore!')
});

// GET notes from Firestore
app.get('/notes', async (req, res) => {
    try {
        // Fetch all documents in the 'notes' collection
        const notesRef = db.collection('notes');
        const snapshot = await notesRef.orderBy('date', 'desc').get(); // Order by date descending

        const notes = [];
        snapshot.forEach(doc => {
            // Extract the data and include the unique document ID
            notes.push({
                id: doc.id,
                ...doc.data()
            });
        });

        // Send the real data back to the client
        res.status(200).json(notes);
    } catch (error) {
        console.error('Error fetching notes:', error);
        res.status(500).send('Error fetching notes from database.');
    }
});
app.listen(port, () => {
    console.log(`Server started on port: ${port}`);
})