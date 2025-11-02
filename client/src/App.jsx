import React, { useState, useEffect } from 'react';
import './App.css';
import AuthComponent from './AuthComponent';

// ******************************************************
// *** NoteItem Component (Unchanged from Day 5) ***
// ******************************************************

// Component for the Note List Item (Handles state for editing, requires onDelete and onUpdate props)
const NoteItem = ({ note, onDelete, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);

    // Local state for the text inside the editing field, initialized to note.text
    const [editText, setEditText] = useState(note.text || '');

    // Function to save the edit
    const handleSave = () => {
        if (editText.trim() && editText !== note.text) {
            onUpdate(note.id, editText);
        }
        setIsEditing(false);
    };

    // Function to cancel the edit
    const handleCancel = () => {
        setEditText(note.text || '');
        setIsEditing(false);
    };

    // Render the editing view if isEditing is true
    if (isEditing) {
        return (
            <li className="note-item editing">
                <textarea
                    className="edit-textarea"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows="2"
                />
                <div className="note-actions">
                    <button onClick={handleSave} className="action-button save">Save</button>
                    <button onClick={handleCancel} className="action-button cancel">Cancel</button>
                </div>
            </li>
        );
    }

    // Render the default view
    return (
        <li className="note-item">
            <p className="note-text">{note.text}</p>
            <div className="note-meta">
                <span className="note-date">{note.date}</span>
                <div className="note-actions">
                    <button onClick={() => setIsEditing(true)} className="action-button edit">Edit</button>
                    <button onClick={() => onDelete(note.id)} className="action-button delete">Delete</button>
                </div>
            </div>
        </li>
    );
};

// Component for the Add Note Form
const AddNoteForm = ({ onAddNote }) => {
    const [noteText, setNoteText] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (noteText.trim()) {
            onAddNote(noteText);
            setNoteText('');
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
            <button type="submit" className="submit-button">Add Note</button>
        </form>
    );
};


// ******************************************************
// *** Main App Component (Updated for Auth) ***
// ******************************************************

function App() {
    // Current user state (null if logged out, object if logged in)
    const [user, setUser] = useState(null);
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);

    // ******************************************************
    // *** R: REAL-TIME READ (SSE CLIENT) Logic ***
    // ******************************************************
    useEffect(() => {
        // Only attempt to establish the connection if a user is logged in
        if (!user) {
            setNotes([]);
            setLoading(false);
            return;
        }

        // NOTE: We will update the server route in Day 7 to secure it by user ID.
        // For now, the notes are public, but we only load them when a user is present.
        const url = 'http://localhost:3001/notes';

        // 1. Establish an SSE connection using EventSource
        const eventSource = new EventSource(url);

        eventSource.onmessage = (event) => {
            try {
                const newNotes = JSON.parse(event.data);
                setNotes(newNotes);
                setLoading(false);
            } catch (error) {
                console.error("Error parsing real-time data:", error);
            }
        };

        eventSource.onerror = (error) => {
            console.error("SSE connection error:", error);
            setLoading(false);
        };

        // 3. Define the cleanup function
        return () => {
            eventSource.close();
        };

    }, [user]); // Re-run effect whenever the user state changes (login/logout)


    // ******************************************************
    // *** CRUD HANDLERS (Unchanged, rely on SSE to update UI) ***
    // ******************************************************

    const handleAddNote = async (text) => {
        // Check if user is logged in before allowing POST
        if (!user) {
            console.error("Authentication required to add a note.");
            return;
        }

        try {
            const response = await fetch('http://localhost:3001/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, userId: user.uid }), // Send userId to server
            });

            if (response.status === 201) {
                console.log("Note added. Waiting for real-time update from server.");
            } else {
                console.error("Failed to add note on server.");
            }
        } catch (error) {
            console.error("Network error adding note:", error);
        }
    };

    const handleDeleteNote = async (id) => {
        if (!user) {
            console.error("Authentication required to delete a note.");
            return;
        }

        try {
            const response = await fetch(`http://localhost:3001/notes/${id}`, {
                method: 'DELETE',
            });

            if (response.status !== 204) {
                console.error("Failed to delete note on server.");
            } else {
                console.log("Note deleted. Waiting for real-time update from server.");
            }

        } catch (error) {
            console.error("Network error deleting note.", error);
        }
    };

    const handleUpdateNote = async (id, newText) => {
        if (!user) {
            console.error("Authentication required to update a note.");
            return;
        }

        try {
            const response = await fetch(`http://localhost:3001/notes/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: newText, userId: user.uid }), // Send userId to server
            });

            if (response.status === 200) {
                console.log("Note updated. Waiting for real-time update from server.");
            } else {
                console.error("Failed to update note on server.");
            }
        } catch (error) {
            console.error("Network error updating note:", error);
        }
    };


    return (
        <div className="app-container">
            <header className="app-header">
                <h1>Cloud Notes App</h1>
                {/* AuthComponent manages login state and passes the user object back up */}
                <AuthComponent user={user} setUser={setUser} />
            </header>

            <main className="main-content">
                {user ? (
                    <>
                        <AddNoteForm onAddNote={handleAddNote} />

                        <section className="notes-list-section">
                            <h2>My Notes</h2>
                            {loading ? (
                                <p className="loading-state">Loading notes...</p>
                            ) : (
                                <ul className="notes-list">
                                    {notes.map((note) => (
                                        <NoteItem
                                            key={note.id}
                                            note={note}
                                            onDelete={handleDeleteNote}
                                            onUpdate={handleUpdateNote}
                                        />
                                    ))}
                                </ul>
                            )}
                            {!loading && notes.length === 0 && <p className="no-notes">No notes yet. Add one above!</p>}
                        </section>
                    </>
                ) : (
                    // Display a prompt when logged out
                    <div className="logged-out-prompt">
                        <h2>Please Sign In or Register</h2>
                        <p>You must be signed in to view and manage your private notes.</p>
                        <p>Use the buttons above to get started!</p>
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;
