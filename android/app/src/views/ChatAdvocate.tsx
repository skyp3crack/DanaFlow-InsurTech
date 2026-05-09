import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { GiftedChat, IMessage } from 'react-native-gifted-chat';
import firestore from '@react-native-firebase/firestore';
import { GEMINI_API_KEY } from '@env';

export default function ChatAdvocate() {
    const [messages, setMessages] = useState<IMessage[]>([]);
    const [isTyping, setIsTyping] = useState(false);

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
                        "⚡ Database Updated By AI",
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

    return (
        <View style={styles.container}>
            <GiftedChat
                messages={messages}
                onSend={messages => onSend(messages)}
                user={{ _id: 1 }}
                isTyping={isTyping}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});