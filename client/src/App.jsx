import React, { useState, useEffect } from 'react';
// REMOVED: import './App.css'; - The file should be picked up by the build environment
// without an explicit import to avoid the resolution error.

// Component for the Note List Item (Now handles state for editing, requires onDelete and onUpdate props)
const NoteItem = ({ note, onDelete, onUpdate }) => {
    // State to manage if the note is currently being edited
    const [isEditing, setIsEditing] = useState(false);

    // Local state to manage the text inside the editing field
    // FIX APPLIED: Initialize state with note.text, falling back to an empty string ('')
    // This ensures editText is always a string, resolving the assignment/type error.
    const [editText, setEditText] = useState(note.text || '');

    // Function to save the edit
    const handleSave = () => {
        // Only update if the text has changed and is not empty
        if (editText.trim() && editText !== note.text) {
            // Call the parent update function, passing the note's ID and the new text
            onUpdate(note.id, editText);
        }
        setIsEditing(false); // Close edit mode
    };

    // Function to cancel the edit
    const handleCancel = () => {
        setEditText(note.text || ''); // Reset text to original state
        setIsEditing(false); // Close edit mode
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
                    {/* Call onDelete with the note's ID when the delete button is clicked */}
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
    // *** R: READ (GET) Logic ***
    // ******************************************************
    useEffect(() => {
        const fetchNotes = async () => {
            try {
                const response = await fetch('http://localhost:3001/notes');
                const data = await response.json();
                setNotes(data);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching notes:", error);
                setLoading(false);
            }
        };
        (async () => {
            await fetchNotes();
        })();
    }, []);


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
                const newNote = await response.json();
                setNotes([newNote, ...notes]);
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
        // Optimistic UI update: remove the note instantly before server confirmation
        const originalNotes = notes;
        setNotes(notes.filter(note => note.id !== id));

        try {
            const response = await fetch(`http://localhost:3001/notes/${id}`, {
                method: 'DELETE',
            });

            if (response.status !== 204) {
                console.error("Failed to delete note on server. Restoring UI.");
                // If the server failed, revert the state
                setNotes(originalNotes);
            }
            // If 204 (No Content), the deletion was successful and state is already updated.

        } catch (error) {
            console.error("Network error deleting note. Restoring UI.", error);
            // Restore state on network error
            setNotes(originalNotes);
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
                const updatedNote = await response.json();

                // Update the state by mapping over the notes array
                setNotes(notes.map(note =>
                    // When the ID matches, spread the original note and apply the new text
                    note.id === id ? { ...note, text: updatedNote.text } : note
                ));
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
