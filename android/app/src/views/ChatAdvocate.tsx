import React, { useState, useEffect, useCallback } from "react";
import { IMessage, GiftedChat } from "react-native-gifted-chat";
import { StyleSheet, View } from "react-native";
import { GoogleGenerativeAI } from "@google/generative-ai";



export default function ChatAdvocate() {
    const [messages, setMessages] = useState<IMessage[]>([]); //IMessage is the type of message from gifted chat

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
    const onSend = useCallback((messages: IMessage[] = []) => {
        setMessages(previousMessages => GiftedChat.append(previousMessages, messages));
    }, []);

    return (
        <View style={styles.container}>
            <GiftedChat
                messages={messages}
                onSend={onSend}
                user={{
                    _id: 1,
                }}
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