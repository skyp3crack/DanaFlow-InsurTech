
import 'react-native-gesture-handler';
import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import firestore from '@react-native-firebase/firestore';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import storage from '@react-native-firebase/storage';
import WalletScreen from './android/app/src/views/WalletScreen';
import ClaimsScreen from './android/app/src/views/ClaimsScreen';
import LoginScreen from './android/app/src/views/LoginScreen';
import ChatAdvocate from './android/app/src/views/ChatAdvocate';


firestore().settings({
  persistence: true,
});

const Stack = createNativeStackNavigator();

export default function App() {
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        processOfflineQueue();
      }
    });
    return () => unsubscribe();
  }, []);

  const processOfflineQueue = async () => {
    try {
      const queueStr = await AsyncStorage.getItem('OFFLINE_IMAGE_QUEUE');
      if (!queueStr) return;

      const queue = JSON.parse(queueStr);
      if (queue.length === 0) return;

      console.log(`Internet restored! Processing ${queue.length} queued images...`);
      const remainingQueue = [];

      for (const item of queue) {
        try {
          // 1. Upload the queued image to Firebase Storage
          const filename = `claims/${Date.now()}_sync.jpg`;
          const reference = storage().ref(filename);
          await reference.putFile(item.uri);
          const downloadURL = await reference.getDownloadURL();

          // 2. Update the existing Firestore document with the real URL!
          await firestore().collection('claims').doc(item.claimId).update({
            photoUrl: downloadURL
          });

          console.log(`Successfully synced image for claim: ${item.claimId}`);
        } catch (uploadErr) {
          console.error("Sync failed for item, keeping in queue.", uploadErr);
          remainingQueue.push(item); // Keep it in the queue if it fails again
        }
      }

      // 3. Save the remaining (failed) items back to the queue, or empty it if all succeeded
      await AsyncStorage.setItem('OFFLINE_IMAGE_QUEUE', JSON.stringify(remainingQueue));

    } catch (e) {
      console.error("Queue processing error", e);
    }
  }


  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Wallet" component={WalletScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Chat" component={ChatAdvocate} options={{ headerShown: false }} />
        <Stack.Screen name="Claims" component={ClaimsScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}


























// /**
//  * Sample React Native App
//  * https://github.com/facebook/react-native
//  *
//  * @format
//  */

// import { NewAppScreen } from '@react-native/new-app-screen';
// import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
// import {
//   SafeAreaProvider,
//   useSafeAreaInsets,
// } from 'react-native-safe-area-context';

// function App() {
//   const isDarkMode = useColorScheme() === 'dark';

//   return (
//     <SafeAreaProvider>
//       <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
//       <AppContent />
//     </SafeAreaProvider>
//   );
// }

// function AppContent() {
//   const safeAreaInsets = useSafeAreaInsets();

//   return (
//     <View style={styles.container}>
//       <NewAppScreen
//         templateFileName="App.tsx"
//         safeAreaInsets={safeAreaInsets}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
// });

// export default App;
