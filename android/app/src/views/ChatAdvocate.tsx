import React, { useState, useEffect, useCallback } from "react";
import { IMessage, GiftedChat } from "react-native-gifted-chat";
import { StyleSheet, View, Alert } from "react-native";
import { GoogleGenerativeAI, SchemaType, FunctionDeclarationSchema } from "@google/generative-ai";
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
            //define tool for gemini to call on accident description
            const updateStatusTool = {
                functionDeclarations: [
                    {
                        name: "update_claim_status",
                        description: "Triggers when the AI has collected the accident description from the user. It moves the claim status to 'AI Reviewing'.",
                        parameters: {
                            type: SchemaType.OBJECT,
                            properties: {
                                reason: {
                                    type: SchemaType.STRING,
                                    description: "A short summary of why the claim is moving forward.",
                                },
                            },
                            required: ["reason"],
                        } as FunctionDeclarationSchema,
                    },
                ],
            };

            //initilaize the model with the tool attached
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", tools: [updateStatusTool] });
            //update the system prompt so it knows how to act
            const prompt = `You are a helpful, professional AI insurance claims advocate for an app called DanaFlow in Malaysia. 
                            The user just said:  "${userText}". 
                            If the user has clearly described their accident, call the 'update_claim_status' function. 
                            If they haven't given enough detail, just reply and ask for more info.`;
            const result = await model.generateContent(prompt);

            //Check : did the ai decide to use tool or just talk?
            const functionCalls = result.response.functionCalls();
            if (functionCalls && functionCalls.length > 0) {
                // THE AI CHOSE ACTION! 
                const call = functionCalls[0];
                if (call.name === "update_claim_status") {

                    // In a full production app, you would update Firebase here.
                    // For now, we will trigger an alert to prove the Agent worked!
                    Alert.alert(
                        "⚡ Agentic Action Triggered!",
                        `AI Summary: ${(call.args as any).reason}\n\nStatus changed to: AI Reviewing`
                    );

                    const aiMessage: IMessage = {
                        _id: Math.random().toString(),
                        text: "I have recorded the details and updated your claim status to 'AI Reviewing'. Our human adjusters will take it from here. Thank you!",
                        createdAt: new Date(),
                        user: { _id: 2, name: 'DanaFlow AI', avatar: 'https://placeimg.com/140/140/tech' },
                    };
                    setMessages(previousMessages => GiftedChat.append(previousMessages, [aiMessage]));
                }
            } else {
                // THE AI CHOSE TO JUST CHAT
                const aiResponseText = result.response.text();
                const aiMessage: IMessage = {
                    _id: Math.random().toString(),
                    text: aiResponseText,
                    createdAt: new Date(),
                    user: { _id: 2, name: 'DanaFlow AI', avatar: 'https://placeimg.com/140/140/tech' },
                };
                setMessages(previousMessages => GiftedChat.append(previousMessages, [aiMessage]));
            }

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