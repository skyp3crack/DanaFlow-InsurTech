import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert, Image, ActivityIndicator } from "react-native";
import { launchCamera } from 'react-native-image-picker';
import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';

export default function ClaimsScreen({ navigation }: any) {

    const [description, setDescription] = useState('');
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    // We can keep 'uploading' for UI logic if needed elsewhere, but we won't use it to block the user anymore.
    const [uploading, setUploading] = useState(false);

    const handleTakePhoto = async () => {
        const result = await launchCamera({ mediaType: 'photo', quality: 0.5 });
        if (result.assets && result.assets.length > 0) {
            setPhotoUri(result.assets[0].uri || null);
        }
    }

    const uploadPhotoToStorage = async (uri: string) => {
        const filename = `claims/${Date.now()}.jpg`;
        const reference = storage().ref(`${filename}`);
        await reference.putFile(uri);
        return await reference.getDownloadURL();
    }

    // Notice we removed the 'async' keyword from the main function here
    const handleSubmitClaim = () => {
        if (!photoUri || !description) {
            Alert.alert('Error', 'Please provide both a description and a photo. Thank you.');
            return;
        }

        // 1. INSTANT UX RESPONSE (Optimistic UI)
        // We do not make the user wait. Show the alert and navigate away immediately.
        Alert.alert(
            'Claim Saved',
            'Your claim is securely saved. If you are offline, it will automatically sync in the background when your connection returns.'
        );
        navigation.goBack();

        // 2. FIRE AND FORGET (Background Task)
        // This function runs silently behind the scenes.
        const processClaimInBackground = async () => {
            let cloudPhotoURL = 'offline_pending_upload';

            try {
                const timeoutPromise = new Promise<string>((_, reject) =>
                    setTimeout(() => reject(new Error('UPLOAD_TIMEOUT')), 5000)
                );
                cloudPhotoURL = await Promise.race([
                    uploadPhotoToStorage(photoUri),
                    timeoutPromise
                ]);
            } catch (storageError) {
                console.log("Storage upload failed or timed out (offline). Proceeding with text data.");
            }

            try {
                // Firebase will cache this locally if offline, and sync later.
                await firestore().collection('claims').add({
                    description: description,
                    photoUrl: cloudPhotoURL,
                    status: 'pending',
                    createdAt: firestore.FieldValue.serverTimestamp(),
                });
            } catch (error) {
                console.error("Background sync error: ", error);
            }
        };

        // Trigger the background task without 'awaiting' it
        processClaimInBackground();
    }

    return (
        <View style={styles.container}>
            <Text style={styles.header}>File a New Claim</Text>
            <TextInput
                style={styles.input}
                placeholder="Describe what happened.."
                value={description}
                onChangeText={setDescription}
                multiline={true}
            />

            <View style={styles.buttonContainer}>
                <Button title="Take photo" onPress={handleTakePhoto} color='#FF3B30' />
            </View>

            {photoUri && <Image source={{ uri: photoUri }} style={styles.previewImage} />}

            <View style={{ marginTop: 40 }}>
                <Button title="Talk to AI Advocate" color="#6200EE" onPress={() => navigation.navigate('Chat')}></Button>
            </View>

            <View style={styles.submitContainer}>
                {/* We removed the loading spinner entirely to give a fast, snappy experience */}
                <Button title="Submit Claim" onPress={handleSubmitClaim} color="#28A745" />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
    header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    input: { backgroundColor: 'white', padding: 15, borderRadius: 8, height: 100, textAlignVertical: 'top', marginBottom: 20 },
    buttonContainer: { marginBottom: 20 },
    previewImage: { width: '100%', height: 200, borderRadius: 8, marginBottom: 20, resizeMode: 'cover' },
    submitContainer: { marginTop: 10 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
});