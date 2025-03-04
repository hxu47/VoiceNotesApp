import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet,
  ActivityIndicator,
  Alert
} from 'react-native';
import Voice from '@react-native-voice/voice';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HomeScreen = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [notes, setNotes] = useState([]);
    const [currentText, setCurrentText] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Initialize voice recognition
    useEffect(() => {
      // Set up listeners
      Voice.onSpeechStart = onSpeechStart;
      Voice.onSpeechEnd = onSpeechEnd;
      Voice.onSpeechResults = onSpeechResults;
      Voice.onSpeechError = onSpeechError;

      // Load saved notes when component mounts
      loadNotes();

      // Clean up listeners when component unmounts
      return () => {
        Voice.destroy().then(Voice.removeAllListeners);
      };
    }, []);


    // Voice recognition handlers
    const onSpeechStart = () => {
      console.log('Speech recognition started');
    };

    const onSpeechEnd = () => {
      setIsRecording(false);
      console.log('Speech recognition ended');
    };

    const onSpeechResults = (e) => {
      if (e.value && e.value.length > 0) {
        setCurrentText(e.value[0]);
      }
    };

    const onSpeechError = (e) => {
      console.error('Speech recognition error:', e);
      setIsRecording(false);
      Alert.alert('Error', 'Speech recognition failed. Please try again.');
    };

    // Start recording function
    const startRecording = async () => {
      try {
        setIsLoading(true);  // Set loading state to true before starting
        await Voice.start('en-US');
        setIsRecording(true);
        setCurrentText('');
        setIsLoading(false);  // Turn off loading when successful
      } catch (e) {
        console.error('Start recording error:', e);
        setIsLoading(false);  // Also turn off loading if there's an error
        Alert.alert('Error', 'Could not start recording. Please try again.');
      }
    };

    // Stop recording function
    const stopRecording = async () => {
      try {
        await Voice.stop();
        setIsRecording(false);
      } catch (e) {
        console.error('Stop recording error:', e);
      }
    };

    // Save the current note
    const saveNote = async () => {
      if (!currentText.trim()) {
        Alert.alert('Error', 'Cannot save empty note');
        return
      }

      const newNote = {
        id: Date.now().toString(),
        text: currentText,
        timestamp: new Date().toISOString(),
      };

      const updateNotes = [...notes, newNote];
      setNotes(updateNotes);

      try {
        await AsyncStorage.setItem('notes', JSON.stringify(updateNotes));
        setCurrentText('');
        Alert.alert('Success', 'Note saved successfully');
      } catch (e) {
        console.error('Save note error:', e);
        Alert.alert('Error', 'Failed to save note');
      }
    };

    // Load saved notes
    const loadNotes = async () => {
      try {
        const savedNotes = await AsyncStorage.getItem('notes');
        if (savedNotes) {
          setNotes(JSON.parse(savedNotes));
        }
      } catch (e) {
        console.error('Load notes error:', e);
      }
    };

    // Delete a note
    const deleteNote = async (id) => {
      const updateNotes = notes.filter(note => note.id !== id);
      setNotes(updatedNotes);

      try {
        await AsyncStorage.setItem('notes', JSON.stringify(updateNotes));
      } catch (e) {
        console.error('Delete note error:', e);
      }
    };

    // Render a note item
    const renderNoteItem = ({ item }) => {
      const date = new Date(item.timestamp);
      const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;

      return (
        <View style={styles.noteItem}>
          <View style={styles.noteContent}>
            <Text style={styles.noteText}>{item.text}</Text>
            <Text style={styles.noteTimestamp}>{formattedDate}</Text>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deleteNote(item.id)}
          >
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      );
    };

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Voice Notes</Text>

        {/* Recording Container */}
        <View style={styles.recordingContainer}>
          {/* Record Title */}
          <Text style={styles.recordingTitle}>
            {isRecording ? 'Recording...' : 'Press button to start recording'}
          </Text>

          {/* Record Button */}
          <TouchableOpacity
            style={[
              styles.recordButton,
              isRecording ? styles.recordingActive : null
            ]}
            onPress={isRecording ? stopRecording : startRecording}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.recordButtonText}>
                {isRecording ? 'Stop' : 'Record'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Save Button */}
          {currentText ? (
            <View style={styles.currentTextContainer}> 
              <Text style={styles.currentText}>{currentText}</Text>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveNote}
              >
                <Text style={styles.saveButtonText}>Save Note</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        {/* NotesList Container */}
        <View style={styles.notesListContainer}>
          <Text style={styles.notesListTitle}>Your Notes</Text>
          {notes.length > 0 ? (
            <FlatList
              data={notes}
              renderItem={renderNoteItem}
              keyExtractor={item => item.id}
              style={styles.notesList}
            />
          ):(
            <Text style={styles.emptyNotesText}>
              No notes yet. Start by recording something!
            </Text>
          )};
        </View>
      </View>
    );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  recordingContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  recordingTitle: {
    fontSize: 16,
    marginBottom: 15,
    color: '#666',
  },
  recordButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  recordingActive: {
    backgroundColor: '#F44336',
  },
  recordButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  currentTextContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  currentText: {
    fontSize: 16,
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  notesListContainer: {
    flex: 1,
  },
  notesListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  notesList: {
    flex: 1,
  },
  noteItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.20,
    shadowRadius: 1.41,
    elevation: 2,
  },
  noteContent: {
    flex: 1,
  },
  noteText: {
    fontSize: 16,
    marginBottom: 5,
  },
  noteTimestamp: {
    fontSize: 12,
    color: '#666',
  },
  deleteButton: {
    justifyContent: 'center',
    paddingLeft: 10,
  },
  deleteButtonText: {
    color: '#F44336',
    fontWeight: 'bold',
  },
  emptyNotesText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
});

export default HomeScreen;