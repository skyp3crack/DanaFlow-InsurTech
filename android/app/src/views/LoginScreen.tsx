import React, { useState } from "react";
import { View, Text, Button, StyleSheet, Alert, TextInput, TouchableOpacity } from "react-native";
import auth from "@react-native-firebase/auth";





export default function LoginScreen({ navigation }: any) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);



    //function to handle login in an exisiting user
    const handleLogin = async () => {
        try {
            await auth().signInWithEmailAndPassword(email, password);
            navigation.replace('Wallet'); //replace means we go to the Wallet, but the user can't swipe back to the Login screen
        } catch (error: any) {
            Alert.alert('Login Error', error.message);
        }
    };

    //function to handle creating brand new user
    const handleSignUp = async () => {
        try {
            await auth().createUserWithEmailAndPassword(email, password);
            navigation.replace('Wallet');
        } catch (error: any) {
            Alert.alert('Sign up Error', error.message);
        }
    };


    return (

        <View style={styles.container}>
            <Text style={styles.header}>DanaFlow </Text>
            <Text style={styles.subHeader}>Agentic Insurance</Text>
            <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                // secureTextEntry // Hides the password dots
                secureTextEntry={!showPassword}
            />
            <View style={styles.buttonContainer}>
                <Button title="Login" onPress={handleLogin} color="#007BFF" />
            </View>
            <View style={styles.buttonContainer}>
                <Button title="Create Account" onPress={handleSignUp} color="#28A745" />
            </View>

        </View>
    )


}


const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#f5f5f5' },
    header: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', color: '#333' },
    subHeader: { fontSize: 16, color: 'gray', textAlign: 'center', marginBottom: 40 },
    input: { backgroundColor: 'white', padding: 15, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#ddd' },
    buttonContainer: { marginBottom: 15 },
    eyeIcon: {
        position: 'absolute',
        right: 10,
        top: 188, // Adjust to position over the password input
        zIndex: 10,
    },

});