
import 'react-native-gesture-handler';
import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import storage from '@react-native-firebase/storage';
import WalletScreen from './android/app/src/views/WalletScreen';
import ClaimsScreen from './android/app/src/views/ClaimsScreen';
import LoginScreen from './android/app/src/views/LoginScreen';
import ChatAdvocate from './android/app/src/views/ChatAdvocate';

firestore().settings({ persistence: true, });

const Stack = createNativeStackNavigator();

const COLORS = {
  primary: '#00B4B6',
  softCyan: '#7EDDD4',
  background: '#F9F9F9',
  charcoal: '#3D3D3D',
  warmGray: '#B0B0B0',
  white: '#FFFFFF',
};

function HistoryScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background }}>
      <Text style={{ fontSize: 18, color: COLORS.charcoal, fontWeight: '700' }}>Claims History</Text>
      <Text style={{ color: COLORS.warmGray, marginTop: 6 }}>Coming soon</Text>
    </View>
  );
}

function SettingsScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background }}>
      <Text style={{ fontSize: 18, color: COLORS.charcoal, fontWeight: '700' }}>Settings</Text>
      <Text style={{ color: COLORS.warmGray, marginTop: 6 }}>Coming soon</Text>
    </View>
  );
}

// ─── Tab bar icon map ─────────────────────────────────────────────────────────
const TAB_ICONS: Record<string, { icon: string; label: string }> = {
  Wallet: { icon: '⊞', label: 'Home' },
  Claims: { icon: '📋', label: 'Claims' },
  Advocate: { icon: 'AI', label: '' }, // center — no label
  History: { icon: '⏱', label: 'History' },
  Settings: { icon: '⚙', label: 'Settings' },
};

// ─── Custom Bottom Tab Bar ────────────────────────────────────────────────────
function DanaFlowTabBar({ state, descriptors, navigation }: any) {
  return (
    <View style={tabStyles.outerWrapper}>
      <View style={tabStyles.bar}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const isCenter = index === 2; // Advocate is always index 2
          const meta = TAB_ICONS[route.name] ?? { icon: '•', label: route.name };

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          // ── Center AI Advocate FAB ──────────────────────────────────────────
          if (isCenter) {
            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                style={tabStyles.centerWrapper}
                activeOpacity={0.85}
                accessibilityLabel="AI Advocate"
              >
                {/* Glow ring — mimics the After Effects pulse */}
                <View style={[tabStyles.centerGlow, isFocused && tabStyles.centerGlowActive]} />
                <View style={[tabStyles.centerButton, isFocused && tabStyles.centerButtonActive]}>
                  <Text style={tabStyles.centerLabel}>AI</Text>
                </View>
              </TouchableOpacity>
            );
          }

          // ── Regular Tab ────────────────────────────────────────────────────
          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={tabStyles.tabItem}
              activeOpacity={0.7}
              accessibilityLabel={meta.label}
            >
              <Text style={[tabStyles.tabIcon, isFocused && tabStyles.tabIconFocused]}>
                {meta.icon}
              </Text>
              <Text style={[tabStyles.tabLabel, isFocused && tabStyles.tabLabelFocused]}>
                {meta.label}
              </Text>
              {/* Active underline dot */}
              {isFocused && <View style={tabStyles.activeDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Main Tab Navigator (shown after login) ───────────────────────────────────
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <DanaFlowTabBar {...props} />}
      screenOptions={{ headerShown: false }}
      initialRouteName="Wallet"
    >
      {/* Order matters — Advocate must be index 2 (middle) */}
      <Tab.Screen name="Wallet" component={WalletScreen} />
      <Tab.Screen name="Claims" component={ClaimsScreen} />
      <Tab.Screen name="Advocate" component={ChatAdvocate} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

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
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}



const TAB_BAR_HEIGHT = 70;
const CENTER_BUTTON_SIZE = 62;
const CENTER_LIFT = 28; // how many px the center button floats above the bar

const tabStyles = StyleSheet.create({
  outerWrapper: {
    // Transparent area above the pill so the center button can float
    paddingTop: CENTER_LIFT,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    backgroundColor: 'transparent',
    // Make sure the floating center button is not clipped
    overflow: 'visible',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: COLORS.white,
    borderRadius: 30,
    height: TAB_BAR_HEIGHT,
    paddingHorizontal: 8,
    // Shadow that matches the reference image
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 18,
  },

  // ── Regular tab ──
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    position: 'relative',
  },
  tabIcon: {
    fontSize: 22,
    color: COLORS.warmGray,
    marginBottom: 2,
  },
  tabIconFocused: {
    color: COLORS.primary,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.warmGray,
    letterSpacing: 0.3,
  },
  tabLabelFocused: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  activeDot: {
    position: 'absolute',
    bottom: -2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },

  // ── Center FAB ──
  centerWrapper: {
    // Pull the button UP above the bar
    marginTop: -(CENTER_BUTTON_SIZE / 2 + CENTER_LIFT - 8),
    alignItems: 'center',
    justifyContent: 'center',
    width: CENTER_BUTTON_SIZE + 24, // wider tap target
  },
  // Pulsing outer glow ring (static — for true pulse animation, use Animated.loop)
  centerGlow: {
    position: 'absolute',
    width: CENTER_BUTTON_SIZE + 16,
    height: CENTER_BUTTON_SIZE + 16,
    borderRadius: (CENTER_BUTTON_SIZE + 16) / 2,
    backgroundColor: COLORS.softCyan,
    opacity: 0.25,
  },
  centerGlowActive: {
    opacity: 0.45,
    backgroundColor: COLORS.primary,
  },
  centerButton: {
    width: CENTER_BUTTON_SIZE,
    height: CENTER_BUTTON_SIZE,
    borderRadius: CENTER_BUTTON_SIZE / 2,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    // White ring border — matches the reference image
    borderWidth: 4,
    borderColor: COLORS.white,
    // Drop shadow
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 14,
  },
  centerButtonActive: {
    backgroundColor: '#007F82', // Deep teal when active
  },
  centerLabel: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});