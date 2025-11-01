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
        </form>
    );
};

// Main App Component
function App() {

    // Placeholder function for Day 4
    const handleAddNote = (text) => {
        console.log("Note to be added:", text);
        // For now, just update the local state to see the form working
        const newNote = { id: Date.now(), text: text, date: new Date().toISOString().split('T')[0] };
        setNotes([newNote, ...notes]);
    };

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
        fetchNotes();
    }, []); // Empty array runs this code only once when the component mounts

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