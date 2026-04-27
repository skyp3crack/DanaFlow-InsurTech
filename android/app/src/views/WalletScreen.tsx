import React from 'react';
import { View, Text, Button, FlatList, StyleSheet } from 'react-native';
import { MOCK_POLICIES } from '../mock/policies';

export default function WalletScreen({ navigation }: any) {
    //"({ navigation }: any " meaning is that we are telling react-native that navigation 
    // is of type "any" meaning it can be anything. "({ navigation }: any)" we are passing it to the WalletScreen component.

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Welcome To DanaFlow</Text>
            <Text style={styles.subHeader}>Your Active Policies</Text>

            <FlatList
                data={MOCK_POLICIES}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <Text style={styles.cardText}>{item.name}</Text>
                        <View style={styles.row}>
                            <Text style={styles.badge}>{item.status}</Text>
                            <Text style={styles.expiry}>Exp: {item.expiryDate}</Text>
                        </View>
                    </View>
                )}
            />

            <View style={styles.buttonContainer}>
                <Button
                    title="File a New Claim"
                    color="#007BFF"
                    onPress={() => navigation.navigate('Claims')}
                />
            </View>
        </View>

    )


}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
    header: { fontSize: 24, fontWeight: 'bold', marginBottom: 5 },
    subHeader: { fontSize: 16, color: 'gray', marginBottom: 20 },
    card: { backgroundColor: 'white', padding: 15, marginBottom: 10, borderRadius: 8, elevation: 2 },
    cardText: { fontSize: 16, fontWeight: '600' },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
    badge: { color: 'green', fontWeight: 'bold' },
    expiry: { color: 'gray', fontSize: 12 },
    buttonContainer: { marginTop: 20 }
})