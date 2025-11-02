const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();
const port = 3001;

// Initialize Firebase Admin (using your serviceAccountKey.json)
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Middleware
// Ensure client can connect
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json()); // For parsing application/json

// --- UTILITY FUNCTION FOR DATE FORMATTING ---
// Function to safely format the Firestore document for client display
const formatNoteForClient = (doc) => {
    const data = doc.data();

    // Safely retrieve the timestamp or use a fallback if it's missing/pending
    const timestamp = data.createdAt ? data.createdAt.toDate() : new Date();

    return {
        id: doc.id,
        text: data.text,
        date: timestamp.toLocaleDateString(),
        // Keep the raw timestamp for consistent sorting on the client if needed
        createdAt: timestamp.getTime()
    };
}

// --- CRUD ROUTES ---

// ******************************************************
// *** R: REAL-TIME READ (GET) Logic - SSE Implementation ***
// ******************************************************
app.get('/notes', (req, res) => {
    // 1. Set the necessary headers for Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // Send headers immediately

    // 2. Define the Firestore query
    const query = db.collection('notes').orderBy('createdAt', 'desc');

    // 3. Set up the onSnapshot listener
    const unsubscribe = query.onSnapshot(snapshot => {
        // Convert the snapshot changes into a clean array of notes
        const notes = snapshot.docs.map(doc => formatNoteForClient(doc));

        // 4. Send the data payload as an SSE message
        // The client will listen for the 'message' event
        res.write(`data: ${JSON.stringify(notes)}\n\n`);
    }, (error) => {
        console.error("Firestore snapshot error:", error);
        // On error, close the connection
        res.end();
    });

    // 5. Handle client disconnection
    req.on('close', () => {
        console.log('Client disconnected, closing Firestore listener.');
        // This is CRITICAL: when the client closes the connection, stop the Firestore listener
        unsubscribe();
        res.end();
    });
});


// ******************************************************
// *** C: CREATE (POST) Logic ***
// ******************************************************
app.post('/notes', async (req, res) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).send("Note text is required.");
        }

        const newNote = {
            text: text,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection('notes').add(newNote);
        const doc = await docRef.get();
        const formattedNote = formatNoteForClient(doc);

        res.status(201).json(formattedNote);

    } catch (error) {
        console.error('Error creating note:', error);
        res.status(500).send('Error adding note to database.');
    }
});


// ******************************************************
// *** U: UPDATE (PUT) Logic ***
// ******************************************************
app.put('/notes/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const { text } = req.body;

        if (!text) {
            return res.status(400).send("New note text is required for update.");
        }

        const docRef = db.collection('notes').doc(id);

        await docRef.update({ text: text });

        const doc = await docRef.get();
        const formattedNote = formatNoteForClient(doc);

        res.status(200).json(formattedNote);

    } catch (error) {
        console.error('Error updating note:', error);
        res.status(500).send('Error updating note in database.');
    }
});


// ******************************************************
// *** D: DELETE Logic ***
// ******************************************************
app.delete('/notes/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const docRef = db.collection('notes').doc(id);

        await docRef.delete();

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting note:', error);
        res.status(500).send('Error deleting note from database.');
    }
});


app.listen(port, () => {
    console.log(`Server started on port: ${port}`);
});
