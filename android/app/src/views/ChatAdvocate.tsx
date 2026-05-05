import React, { useState, useEffect, useCallback } from "react";
import { IMessage, GiftedChat } from "react-native-gifted-chat";
import { StyleSheet, View } from "react-native";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_API_KEY } from "@env";


const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export default function ChatAdvocate() {
    const [messages, setMessages] = useState<IMessage[]>([]); //IMessage is the type of message from gifted chat
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => { //this useEffect handles loading the intial prompt/messages when the screen opens
        setMessages([
            {
                _id: 1,
                text: ' Hi Ahmad, I see you are filing a claim. can you describe what happened to your vechile?',
                createdAt: new Date(),
                user: {
                    _id: 2,
                    name: 'DanaFlow AI',
                    avatar: 'https://placeimg.com/140/140/tech',
                },
            },
        ]);
    }, []);

    //handles adding messages to the chat screen when the user types a message
    const onSend = useCallback(async (newMessages: IMessage[] = []) => {
        setMessages(previousMessages => GiftedChat.append(previousMessages, newMessages));
        setIsTyping(true);
        const userText = newMessages[0].text;
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const prompt = `You are a helpful, professional AI insurance claims advocate for an app called DanaFlow in Malaysia. 
                            The user just said:  "${userText}". 
                            Respond kindly, keep it under 3 sentences, and ask one follow-up question to help process their claim.`;
            const result = await model.generateContent(prompt);
            const aiResponseText = result.response.text();
            const aiMessage: IMessage = {
                _id: Math.random().toString(),
                text: aiResponseText,
                createdAt: new Date(),
                user: {
                    _id: 2,
                    name: 'DanaFlow AI',
                    avatar: 'https://placeimg.com/140/140/tech',
                },
            };
            setMessages(previousMessages => GiftedChat.append(previousMessages, [aiMessage]));
        } catch (error) {
            console.error("Error talking to Gemini:", error);
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