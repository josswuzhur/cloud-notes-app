import React, { useState, useEffect } from 'react';
// Note: We rely on App.css being present in the same directory for styling

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

// Main App Component
function App() {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);

    // ******************************************************
    // *** R: REAL-TIME READ (SSE CLIENT) Logic - NEW for Day 5 ***
    // ******************************************************
    useEffect(() => {
        const url = 'http://localhost:3001/notes';

        // 1. Establish an SSE connection using EventSource
        const eventSource = new EventSource(url);

        // 2. Define the listener for the 'message' event (the data stream from the server)
        eventSource.onmessage = (event) => {
            try {
                // The data sent by the server is a JSON string of the entire notes array
                const newNotes = JSON.parse(event.data);

                // Update the state with the new, complete array of notes
                setNotes(newNotes);
                setLoading(false);
            } catch (error) {
                console.error("Error parsing real-time data:", error);
            }
        };

        eventSource.onerror = (error) => {
            console.error("SSE connection error:", error);
            setLoading(false);
            // NOTE: EventSource will attempt to auto-reconnect on most errors
        };

        // 3. Define the cleanup function
        // This closes the persistent connection when the component unmounts
        return () => {
            eventSource.close();
            console.log('SSE connection closed.');
        };

    }, []); // Runs once when the component mounts

    // ******************************************************
    // *** C: CREATE (POST) Logic ***
    // ******************************************************
    const handleAddNote = async (text) => {
        try {
            const response = await fetch('http://localhost:3001/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
            });

            if (response.status === 201) {
                // Note: We don't need to manually update state here!
                // The server will handle the POST, and the SSE listener (EventSource)
                // will automatically fetch the updated notes list and update the UI.
                console.log("Note added. Waiting for real-time update from server.");
            } else {
                console.error("Failed to add note on server.");
            }
        } catch (error) {
            console.error("Network error adding note:", error);
        }
    };


    // ******************************************************
    // *** D: DELETE Logic ***
    // ******************************************************
    const handleDeleteNote = async (id) => {
        // We no longer do optimistic UI update. We wait for the SSE stream to update the UI.
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


    // ******************************************************
    // *** U: UPDATE (PUT) Logic ***
    // ******************************************************
    const handleUpdateNote = async (id, newText) => {
        try {
            const response = await fetch(`http://localhost:3001/notes/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: newText }),
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
            </main>
        </div>
    );
}

export default App;