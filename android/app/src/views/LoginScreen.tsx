import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import auth from "@react-native-firebase/auth";
import ReactNativeBiometrics from "react-native-biometrics";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const COLORS = {
  primary: "#00B4B6",
  softCyan: "#7EDDD4",
  background: "#F9F9F9",
  charcoal: "#3D3D3D",
  warmGray: "#B0B0B0",
  white: "#FFFFFF",
  error: "#FF5B5B",
};

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // ── Business Logic — UNTOUCHED ──────────────────────────────────────────────

  //function to handle login in an exisiting user
  const handleLogin = async () => {
    try {
      await auth().signInWithEmailAndPassword(email, password);
      navigation.replace("Wallet"); //replace means we go to the Wallet, but the user can't swipe back to the Login screen
    } catch (error: any) {
      Alert.alert("Login Error", error.message);
    }
  };

  //function to handle creating brand new user
  const handleSignUp = async () => {
    try {
      await auth().createUserWithEmailAndPassword(email, password);
      navigation.replace("Wallet");
    } catch (error: any) {
      Alert.alert("Sign up Error", error.message);
    }
  };

  //handle biometric login
  const handleBiometricLogin = async () => {
    setIsAuthenticating(true);

    try {
      const rnBiometrics = new ReactNativeBiometrics();
      const { available, biometryType } =
        await rnBiometrics.isSensorAvailable(); //check if phone support biometrics
      if (available && biometryType === "Biometrics") {
        //if available and biometric is type of Biometrics
        const { success } = await rnBiometrics.simplePrompt({
          promptMessage: "Confirm identity to access DanaFlow",
          cancelButtonText: "Cancel", //text for the cancel button
        });
        if (success) {
          navigation.replace("Wallet");
        } else {
          Alert.alert("Authentication failed", "Please try again");
        }
      } else {
        Alert.alert(
          "Not Supported",
          "Biometrics are not set up on this device"
        );
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "An error occured during authentication");
    } finally {
      setIsAuthenticating(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* ── Header ── */}
        <View style={styles.headerSection}>
          <View style={styles.logoMark}>
            <Text style={styles.logoMarkText}>DF</Text>
          </View>
          <Text style={styles.header}>DanaFlow</Text>
          <Text style={styles.subHeader}>Agentic Insurance</Text>
        </View>

        {/* ── Card ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome back</Text>
          <Text style={styles.cardSubtitle}>Sign in to your account</Text>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={COLORS.warmGray}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.passwordWrapper}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter your password"
                placeholderTextColor={COLORS.warmGray}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeToggle}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.eyeIcon}>{showPassword ? "🙈" : "👁️"}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Primary CTA */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleLogin}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Sign In</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Biometric */}
          <TouchableOpacity
            style={[
              styles.biometricButton,
              isAuthenticating && styles.biometricButtonDisabled,
            ]}
            onPress={handleBiometricLogin}
            disabled={isAuthenticating}
            activeOpacity={0.85}
          >
            {isAuthenticating ? (
              <ActivityIndicator color={COLORS.primary} size="small" />
            ) : (
              <Text style={styles.biometricIcon}>🔐</Text>
            )}
            <Text style={styles.biometricButtonText}>
              {isAuthenticating ? "Verifying…" : "Quick Login (Face / Touch ID)"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Footer: Create Account ── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={handleSignUp} activeOpacity={0.7}>
            <Text style={styles.footerLink}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },

  // Header
  headerSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoMark: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  logoMarkText: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 1,
  },
  header: {
    fontSize: 30,
    fontWeight: "800",
    color: COLORS.charcoal,
    letterSpacing: -0.5,
  },
  subHeader: {
    fontSize: 14,
    color: COLORS.warmGray,
    marginTop: 4,
    letterSpacing: 0.5,
  },

  // Card
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.charcoal,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: COLORS.warmGray,
    marginBottom: 24,
  },

  // Inputs
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.charcoal,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#EBEBEB",
    fontSize: 15,
    color: COLORS.charcoal,
  },
  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#EBEBEB",
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.charcoal,
  },
  eyeToggle: {
    paddingHorizontal: 14,
  },
  eyeIcon: {
    fontSize: 17,
  },

  // Primary button
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  // Divider
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#EBEBEB",
  },
  dividerText: {
    color: COLORS.warmGray,
    marginHorizontal: 12,
    fontSize: 13,
  },

  // Biometric button
  biometricButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.softCyan,
    backgroundColor: "#F0FFFE",
  },
  biometricButtonDisabled: {
    opacity: 0.6,
  },
  biometricIcon: {
    fontSize: 18,
  },
  biometricButtonText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: "600",
  },

  // Footer
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 28,
  },
  footerText: {
    color: COLORS.warmGray,
    fontSize: 14,
  },
  footerLink: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "700",
  },
});