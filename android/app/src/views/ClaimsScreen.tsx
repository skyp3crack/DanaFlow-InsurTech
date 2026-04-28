import React from "react";
import { View, Text, Button, StyleSheet, ScrollView } from "react-native";

export default function ClaimsScreen() {
    return (

        <View style={styles.container}>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
                <View style={styles.buttonWrapper}>
                    <Button title="Take Damage Photo" color="#FF3B30" onPress={() => { }} />
                </View>
                <View style={styles.buttonWrapper}>
                    <Button title="Describe Incident" color="#007BFF" onPress={() => { }} />
                </View>
            </View>

            {/*AI Chat PlaceHolder*/}
            <ScrollView style={styles.chatArea}>
                <View style={styles.aiBubble}>
                    <Text style={styles.aiText}>
                        Hi! I'm Dana from DanaFlow. I'm sorry to hear you've been in an accident.
                        How can I help with your claim
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}


const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
    actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    buttonWrapper: { flex: 1, marginHorizontal: 5 },
    chatArea: { flex: 1, backgroundColor: 'white', borderRadius: 8, padding: 15, elevation: 2 },
    aiBubble: { backgroundColor: '#E8F0FE', padding: 15, borderRadius: 12, alignSelf: 'flex-start', maxWidth: '85%' },
    aiText: { color: '#333', fontSize: 15, lineHeight: 22 }
});