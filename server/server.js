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

app.post('/notes', async (req, res) => {
    try {
        // Extract data from the request body
        // The client send: { text: "New note content" }
        const { text } = req.body;

        if (!text) {
            return res.status(400).send("Note text is required");
        }

        // Prepare the data object for Firestore
        const newNote = {
            text: text,
            // Add a server-side timestamp for reliability
            date: new Date().toISOString().split('T')[0],
        };

        // Save the new document to the 'notes' collection
        // add() automatically generates a unique ID for the document
        const docRef = await db.collection('notes').add(newNote);

        // Send back the created note data, including the new Firestore ID
        res.status(201).json({
            id: docRef.id,
            ...newNote
        });
    } catch (error) {
        console.error('Error creating note:', error);
        res.status(500).send('Error saving note to database.');
    }
});

// Rout to delete a note by ID
app.delete('/notes/:id', async (req, res) => {
    try {
        const id = req.params.id; // Get ID from URL parameter
        const docRef = db.collection('notes').doc(id);

        await docRef.delete();

        // Send a successful but empty response (No Content)
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting note:', error);
        res.status(500).send('Error deleting note from database.');
    }
});

app.put('/notes/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const { text } = req.body; // New text from the request body

        if (!text) {
            return res.status(400).send("New note text is required.");
        }

        const docRef = db.collection('notes').doc(id);

        // Update the 'text' field in the Firestore document
        await docRef.update({ text: text });

        // Send back the updated note (with the old ID)
        res.status(200).json({ id: id, text: text });

    } catch (error) {
        console.error('Error updating note:', error);
        res.status(500).send('Error updating note in database.');
    }
});

app.listen(port, () => {
    console.log(`Server started on port: ${port}`);
});