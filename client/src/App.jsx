import React, { useState, useEffect } from 'react'
import './App.css'

// Component for the Note List Item
const NoteItem = ({ note }) => (
    <li className="note-item">
        <p className="note-text">{note.text}</p>
        <span className="note-date">{note.date}</span>
        {/* Day 5: We will add Edit and Delete buttons here */}
    </li>
);

// Component for the Add Note Form
const AddNoteForm = ({ onAddNote }) => {
    const [noteText, setNoteText] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (noteText.trim()) {
            // On Day 4, this function will call the backend POST API
            onAddNote(noteText);
            setNoteText(''); // Clear the input
        }
    };

    return (
        <form className="add-note-form" onSubmit={handleSubmit}>
            <textarea
                placeholder="Write a new note..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows="3"
                required
            />
            <button type='submit' className='submit-button'>Add Note</button>
        </form>
    );
};

// Main App Component
function App() {

    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true); // New loading state

    useEffect(() => {
        const fetchNotes = async () => {
            try {
                // Fetch from your Express API running on port 3001
                const response = await fetch('http://localhost:3001/notes');
                const data = await response.json();
                setNotes(data);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching notes:", error);
                setLoading(false);
            }
        };

        // This pattern executes the async function immediately
        (async () => {
            await fetchNotes();
        })();
    }, []); // Empty array runs this code only once when the component mounts

    const handleAddNote = async (text) => {
        try {
            const response = await fetch('http://localhost:3001/notes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                // Send the note text as a JSON body to the server
                body: JSON.stringify({ text }),
            });

            // If the server successfully created the note (status 201)
            if (response.status === 201) {
                const newNote = await response.json();
                // Add the new note (which now includes the Firestore ID) to the top of the list
                setNotes([newNote, ...notes]);
            } else {
                console.error("Failed to add note on server.");
            }
        } catch (error) {
            console.error("Network error adding note:", error);
        }
    };

    return (
        <div className="app-container">
            <header className="app-header">
                <h1>Cloud Notes App</h1>
                { /* Day 7: We will add login/logout buttons here */ }
            </header>

            <main className="main-content">
                <AddNoteForm onAddNote={handleAddNote} />

                <section className="notes-list-section">
                    <h2>My Notes</h2>
                    {loading ? (
                        <p className="loading-state">Loading notes...</p>
                    ) : (
                        <ul className="notes-list">
                            {notes.map((note) => (
                                <NoteItem key={note.id} note={note} />
                            ))}
                        </ul>
                    )}
                    {!loading && notes.length === 0 && <p className="no-notes">No notes yet. Add one above!</p>}
                </section>
            </main>
        </div>
    );
}

export default App;