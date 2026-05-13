import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, StatusBar, TouchableOpacity, Platform, } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GiftedChat, IMessage, Bubble, InputToolbar, Send, Avatar } from 'react-native-gifted-chat';
import firestore from '@react-native-firebase/firestore';
import { GEMINI_API_KEY } from '@env';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const COLORS = {
    primary: '#00B4B6',
    softCyan: '#7EDDD4',
    background: '#F9F9F9',
    charcoal: '#3D3D3D',
    warmGray: '#B0B0B0',
    white: '#FFFFFF',
};

export default function ChatAdvocate({ navigation }: any) {
    const [messages, setMessages] = useState<IMessage[]>([]);
    const [isTyping, setIsTyping] = useState(false);

    // ── Business Logic — UNTOUCHED ──────────────────────────────────────────────

    useEffect(() => {
        setMessages([
            {
                _id: 1,
                text: 'Hi Ahmad! I am your DanaFlow AI Advocate. I see you want to file a claim. Can you briefly describe what happened to your car?',
                createdAt: new Date(),
                user: { _id: 2, name: 'DanaFlow AI', avatar: 'https://placeimg.com/140/140/tech' },
            },
        ]);
    }, []);

    const onSend = useCallback(async (newMessages: IMessage[] = []) => {
        setMessages(previousMessages => GiftedChat.append(previousMessages, newMessages));
        setIsTyping(true);

        const userText = newMessages[0].text;

        try {
            // 1. RAW FETCH REQUEST TO GEMINI (Bypasses the crashing SDK!)
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemInstruction: {
                        parts: [{ text: "You are a helpful AI insurance advocate for DanaFlow in Malaysia. If the user has clearly described their accident, call the 'update_claim_status' function. If they haven't given enough detail, just reply and ask for more info. Keep replies under 3 sentences." }]
                    },
                    contents: [{ role: "user", parts: [{ text: userText }] }],
                    tools: [{
                        functionDeclarations: [{
                            name: "update_claim_status",
                            description: "Triggers when the AI has collected the accident description from the user. It moves the claim status to 'AI Reviewing'.",
                            parameters: {
                                type: "OBJECT",
                                properties: {
                                    reason: { type: "STRING", description: "A short summary of why the claim is moving forward." }
                                },
                                required: ["reason"]
                            }
                        }]
                    }]
                })
            });

            const data = await response.json();

            // Catch API key or network errors from Google
            if (data.error) {
                console.error("Gemini API Error:", data.error.message);
                Alert.alert("API Error", data.error.message);
                setIsTyping(false);
                return;
            }

            // 2. Safely parse Gemini's response
            const responsePart = data.candidates[0].content.parts[0];

            if (responsePart.functionCall && responsePart.functionCall.name === 'update_claim_status') {
                // THE AGENT TOOK ACTION!
                const reason = responsePart.functionCall.args.reason;

                try {
                    //find the users most recently submitted claim
                    const latestClaimSnapshot = await firestore().collection('claims').orderBy('createdAt', 'desc')
                        .limit(1).get(); // fetch only one latest claim, ordered by created at descending

                    if (!latestClaimSnapshot.empty) {
                        await latestClaimSnapshot.docs[0].ref.update({
                            status: 'AI Reviewing',
                            aiSummary: reason,
                            updatedAt: firestore.FieldValue.serverTimestamp(),
                        });
                    }
                    Alert.alert(
                        "Database Updated By AI",
                        `AI Summary: ${reason}\n\nFirestore status successfully changed to 'AI Reviewing'.`
                    );
                } catch (dbError) {
                    console.error("Failed to update Firebase:", dbError);
                }

                const aiMessage: IMessage = {
                    _id: Math.random().toString(),
                    text: "I have recorded the details and updated your claim status to 'AI Reviewing'. Our human adjusters will take it from here. Thank you!",
                    createdAt: new Date(),
                    user: { _id: 2, name: 'DanaFlow AI', avatar: 'https://placeimg.com/140/140/tech' },
                };
                setMessages(previousMessages => GiftedChat.append(previousMessages, [aiMessage]));

            } else if (responsePart.text) {
                // THE AGENT JUST CHATTED
                const aiMessage: IMessage = {
                    _id: Math.random().toString(),
                    text: responsePart.text,
                    createdAt: new Date(),
                    user: { _id: 2, name: 'DanaFlow AI', avatar: 'https://placeimg.com/140/140/tech' },
                };
                setMessages(previousMessages => GiftedChat.append(previousMessages, [aiMessage]));
            }

        } catch (error) {
            console.error("Network Error:", error);
            Alert.alert("Network Error", "Could not reach the AI server.");
        } finally {
            setIsTyping(false);
        }
    }, []);

    // ── Render ──────────────────────────────────────────────────────────────────
    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

            {/* ── Custom Header ── */}
            <View style={styles.header}>
                {navigation && (
                    <TouchableOpacity
                        onPress={() => navigation.goBack?.()}
                        style={styles.backButton}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Text style={styles.backIcon}>‹</Text>
                    </TouchableOpacity>
                )}
                <View style={styles.headerCenter}>
                    <View style={styles.aiAvatar}>
                        <Text style={styles.aiAvatarText}>AI</Text>
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>DanaFlow Advocate</Text>
                        <View style={styles.onlineRow}>
                            <View style={styles.onlineDot} />
                            <Text style={styles.onlineText}>Online · Powered by Gemini</Text>
                        </View>
                    </View>
                </View>
                {/* Spacer to balance the back button */}
                <View style={{ width: 36 }} />
            </View>

            {/* ── Gifted Chat ── */}
            <GiftedChat
                messages={messages}
                onSend={msgs => onSend(msgs)}
                user={{ _id: 1 }}
                isTyping={isTyping}
                renderBubble={props => (
                    <Bubble
                        {...props}
                        wrapperStyle={{
                            right: {
                                backgroundColor: COLORS.primary,
                                borderRadius: 18,
                                borderBottomRightRadius: 4,
                                marginVertical: 2,
                                paddingHorizontal: 2,
                                shadowColor: COLORS.primary,
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.25,
                                shadowRadius: 8,
                                elevation: 4,
                            },
                            left: {
                                backgroundColor: COLORS.white,
                                borderRadius: 18,
                                borderBottomLeftRadius: 4,
                                marginVertical: 2,
                                paddingHorizontal: 2,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.07,
                                shadowRadius: 8,
                                elevation: 3,
                            },
                        }}
                        textStyle={{
                            right: { color: COLORS.white, fontSize: 15, lineHeight: 22 },
                            left: { color: COLORS.charcoal, fontSize: 15, lineHeight: 22 },
                        }}
                    />
                )}
                renderInputToolbar={props => (
                    <InputToolbar
                        {...props}
                        containerStyle={styles.inputToolbar}
                        primaryStyle={styles.inputPrimary}
                    />
                )}
                renderSend={props => (
                    <Send {...props} containerStyle={styles.sendContainer}>
                        <View style={styles.sendButton}>
                            <Icon name="arrow-up" size={20} color={COLORS.white} />
                        </View>
                    </Send>
                )}
                renderAvatar={props => {
                    const { currentMessage } = props;
                    if (currentMessage?.user?._id === 2) { // AI user
                        return (
                            <View style={styles.aiMessageAvatar}>
                                <MaterialIcon name="robot-happy-outline" size={20} color={COLORS.white} />
                            </View>
                        );
                    }
                    return null;
                }}
                messagesContainerStyle={styles.messagesContainer}
                timeTextStyle={{
                    right: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
                    left: { color: COLORS.warmGray, fontSize: 11 },
                }}
                textInputProps={{
                    style: styles.textInput,
                    placeholderTextColor: COLORS.warmGray,
                    placeholder: "Describe your claim…",
                }}
            />
        </SafeAreaView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.white },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    backButton: {
        width: 36, height: 36, borderRadius: 12,
        backgroundColor: COLORS.background,
        alignItems: 'center', justifyContent: 'center',
    },
    backIcon: { fontSize: 26, color: COLORS.charcoal, lineHeight: 30 },
    headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    aiAvatar: {
        width: 40, height: 40, borderRadius: 14,
        backgroundColor: COLORS.primary,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    aiAvatarText: { color: COLORS.white, fontSize: 13, fontWeight: '800' },
    headerTitle: { fontSize: 15, fontWeight: '700', color: COLORS.charcoal },
    onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
    onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4CAF50' },
    onlineText: { fontSize: 11, color: COLORS.warmGray },

    // Messages
    messagesContainer: { backgroundColor: COLORS.background, paddingBottom: 4 },
    placeholder: { color: COLORS.warmGray },

    // Input toolbar
    inputToolbar: {
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginHorizontal: 0,
    },
    inputPrimary: { flexDirection: 'row', alignItems: 'center' },
    textInput: {
        flex: 1,
        backgroundColor: COLORS.background,
        borderRadius: 22,
        paddingHorizontal: 18,
        paddingVertical: Platform.OS === 'ios' ? 10 : 8,
        fontSize: 15,
        color: COLORS.charcoal,
        borderWidth: 1.5,
        borderColor: '#EBEBEB',
        marginRight: 8,
    },

    // Send button
    sendContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 2,
    },
    sendButton: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: COLORS.primary,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
    },
    sendIcon: { color: COLORS.white, fontSize: 18, fontWeight: '700' }, // This style is not directly used by the Icon component

    // AI Message Avatar
    aiMessageAvatar: {
        width: 34,
        height: 34,
        borderRadius: 17, // Half of width/height for a perfect circle
        borderWidth: 2,
        borderColor: COLORS.softCyan,
        backgroundColor: COLORS.primary,
        alignItems: 'center', justifyContent: 'center',
    },
});