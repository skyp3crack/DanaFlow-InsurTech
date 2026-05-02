import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Alert, Image, ActivityIndicator } from "react-native";
import { launchCamera } from 'react-native-image-picker';
import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';

export default function ClaimsScreen({ navigation }: any) {

    const [description, setDescription] = useState('');
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const handleTakePhoto = async () => {
        const result = await launchCamera({ mediaType: 'photo', quality: 0.5 });
        if (result.assets && result.assets.length > 0) {
            setPhotoUri(result.assets[0].uri || null) // set 
        }
    }

    const uploadPhotoToStorage = async (uri: string) => {
        const filename = `claims/${Date.now()}.jpg`; // Create a unique file name
        const reference = storage().ref(`${filename}`);
        await reference.putFile(uri); //put file into storage //take uri from take photo (uri: string) 
        return await reference.getDownloadURL(); // Get the Download URL (required for Gemini to see image
    }

    const handleSubmitClaim = async () => {
        if (!photoUri || !description) {
            Alert.alert('Error', 'Please prove both a description and a photo. thank you');
            return;
        }
        setUploading(true);
        try {
            const CloudPhotoURL = await uploadPhotoToStorage(photoUri);
            await firestore().collection('claims').add({
                description: description,
                photoUrl: CloudPhotoURL,
                status: 'pending', //pending, assigned, resolved 
                createdAt: firestore.FieldValue.serverTimestamp(), //
            });
            Alert.alert('Success!', 'Your claim has been submitted to the cloud.');
            navigation.goBack(); // Return to Wallet
        } catch (error) {
            console.error(error);
            Alert.alert('Upload Failed', 'Something went wrong.');
        } finally {
            setUploading(false);
        }
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
                <Button title="Take photo" onPress={handleTakePhoto} color='FF3B30' />
            </View>

            {/*show preview of photo if they take one */}
            {photoUri && <Image source={{ uri: photoUri }} style={styles.previewImage} />}

            <View style={styles.submitContainer}>
                {uploading ? (
                    <ActivityIndicator size="large" color="#0000ff" />
                ) : (
                    <Button title="Submit Claim" onPress={handleSubmitClaim} color="#28A745" />
                )}
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
    submitContainer: { marginTop: 10 }
});