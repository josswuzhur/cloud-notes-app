import { useState } from 'react'
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
    // Hardcoded notes for Day 1. On Day 4, this state will be populated from the server.
    const [notes, setNotes] = useState([
        { id: 101, text: "Finish Day 1 Setup!", date: "2025-10-31" },
        { id: 102, text: "Connect to Firestore tomorrow.", date: "2025-10-31"}
    ]);

    // Placeholder function for Day 4
    const handleAddNote = (text) => {
        console.log("Note to be added:", text);
        // For now, just update the local state to see the form working
        const newNote = { id: Date.now(), text: text, date: new Date().toISOString().split('T')[0] };
        setNotes([newNote, ...notes]);
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
                    <ul className="notes-list">
                        {notes.map((note) => (
                            <NoteItem key={note.id} note={note} />
                        ))}
                    </ul>
                    {notes.length === 0 && <p className="no-notes">No notes yet. Add one above!</p>}
                </section>
            </main>
        </div>
    );
}

export default App;