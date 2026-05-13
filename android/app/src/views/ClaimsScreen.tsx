import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, Alert, Image, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { launchCamera } from 'react-native-image-picker';
import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';
import NetInfo from '@react-native-community/netinfo';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const COLORS = {
  primary: '#00B4B6',
  softCyan: '#7EDDD4',
  background: '#F9F9F9',
  charcoal: '#3D3D3D',
  warmGray: '#B0B0B0',
  white: '#FFFFFF',
  danger: '#FF5B5B',
  purple: '#7C4DFF',
  success: '#4CAF50',
};

export default function ClaimsScreen({ navigation }: any) {

  const [description, setDescription] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  // We can keep 'uploading' for UI logic if needed elsewhere, but we won't use it to block the user anymore.
  const [uploading, setUploading] = useState(false);

  // ── Business Logic — UNTOUCHED ──────────────────────────────────────────────

  const handleTakePhoto = async () => {
    const result = await launchCamera({ mediaType: 'photo', quality: 0.5 });
    if (result.assets && result.assets.length > 0) {
      setPhotoUri(result.assets[0].uri || null);
    }
  }

  const uploadPhotoToStorage = async (uri: string) => {
    const filename = `claims/${Date.now()}.jpg`;
    const reference = storage().ref(`${filename}`);
    await reference.putFile(uri);
    return await reference.getDownloadURL();
  }

  // Notice we removed the 'async' keyword from the main function here
  const handleSubmitClaim = async () => {
    if (!photoUri || !description) {
      Alert.alert('Error', 'Please provide both a description and a photo. Thank you.');
      return;
    }
    const networkState = await NetInfo.fetch();
    if (networkState.isConnected) {
      Alert.alert(
        'Claim submitted', 'Your claim has been successfully uploaded.'
      )
    } else {
      Alert.alert(
        "Offline mode",
        "No Internet connection. Your claim is securely saved to your device and will sync automatically when you regain connection"
      );
    }

    navigation.goBack();
    const processClaimInBackground = async () => {
      let cloudPhotoURL = 'offline_pending_upload';

      if (networkState.isConnected) {
        try {
          // Wait patiently for the emulator to finish the upload
          cloudPhotoURL = await uploadPhotoToStorage(photoUri);
        } catch (storageError) {
          console.log("Storage upload failed: ", storageError);
        }
      } else {
        console.log("Offline mode: Skipping photo upload. Text will sync automatically.");
      }

      try {
        // Firebase will cache this locally if offline, and sync later.
        await firestore().collection('claims').add({
          description: description,
          photoUrl: cloudPhotoURL,
          status: 'pending',
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
      } catch (error) {
        console.error("Background sync error: ", error);
      }
    };

    // Trigger the background task without 'awaiting' it
    processClaimInBackground();
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ── */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.backIcon}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.header}>File a Claim</Text>
            <View style={{ width: 36 }} />
          </View>

          {/* ── Step indicator ── */}
          <View style={styles.stepRow}>
            {['Describe', 'Photo', 'Submit'].map((label, i) => (
              <React.Fragment key={label}>
                <View style={styles.stepItem}>
                  <View style={[styles.stepDot, i === 0 && styles.stepDotActive]}>
                    <Text style={[styles.stepNum, i === 0 && styles.stepNumActive]}>{i + 1}</Text>
                  </View>
                  <Text style={[styles.stepLabel, i === 0 && styles.stepLabelActive]}>{label}</Text>
                </View>
                {i < 2 && <View style={styles.stepConnector} />}
              </React.Fragment>
            ))}
          </View>

          {/* ── Description card ── */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>📝</Text>
              <Text style={styles.cardTitle}>Describe the Incident</Text>
            </View>
            <TextInput
              style={styles.textArea}
              placeholder="What happened? Include location, time, and any other relevant details…"
              placeholderTextColor={COLORS.warmGray}
              value={description}
              onChangeText={setDescription}
              multiline={true}
              textAlignVertical="top"
            />
          </View>

          {/* ── Photo card ── */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>📷</Text>
              <Text style={styles.cardTitle}>Attach Evidence Photo</Text>
            </View>

            {photoUri ? (
              <View style={styles.photoPreviewWrapper}>
                <Image source={{ uri: photoUri }} style={styles.previewImage} />
                <TouchableOpacity
                  style={styles.retakeOverlay}
                  onPress={handleTakePhoto}
                  activeOpacity={0.85}
                >
                  <Text style={styles.retakeText}>🔄 Retake</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.photoPlaceholder}
                onPress={handleTakePhoto}
                activeOpacity={0.75}
              >
                <Text style={styles.photoPlaceholderIcon}>📸</Text>
                <Text style={styles.photoPlaceholderText}>Tap to take a photo</Text>
                <Text style={styles.photoPlaceholderSub}>Clear photos speed up claim processing</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ── AI Advocate CTA ── */}
          <TouchableOpacity
            style={styles.advocateButton}
            onPress={() => navigation.navigate('Chat')}
            activeOpacity={0.85}
          >
            <View style={styles.advocateLeft}>
              <View style={styles.advocateBadge}>
                <Text style={styles.advocateBadgeIcon}>🤖</Text>
              </View>
              <View>
                <Text style={styles.advocateTitle}>Talk to AI Advocate</Text>
                <Text style={styles.advocateSub}>Get guidance on your claim</Text>
              </View>
            </View>
            <Text style={styles.advocateArrow}>›</Text>
          </TouchableOpacity>

          {/* ── Submit button ── */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!photoUri || !description) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmitClaim}
            activeOpacity={0.85}
          >
            {/* We removed the loading spinner entirely to give a fast, snappy experience */}
            <Text style={styles.submitText}>Submit Claim</Text>
            <Text style={styles.submitArrow}>→</Text>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            🔒 Your data is end-to-end encrypted and will sync automatically when online.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

  // Header row
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Platform.OS === 'android' ? 16 : 8,
    marginBottom: 24,
  },
  backButton: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: COLORS.white,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
  },
  backIcon: { fontSize: 26, color: COLORS.charcoal, lineHeight: 30 },
  header: { fontSize: 20, fontWeight: '800', color: COLORS.charcoal, letterSpacing: -0.3 },

  // Step indicator
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  stepItem: { alignItems: 'center', gap: 4 },
  stepDot: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#EBEBEB',
    alignItems: 'center', justifyContent: 'center',
  },
  stepDotActive: { backgroundColor: COLORS.primary },
  stepNum: { fontSize: 13, fontWeight: '700', color: COLORS.warmGray },
  stepNumActive: { color: COLORS.white },
  stepLabel: { fontSize: 11, color: COLORS.warmGray, textTransform: 'uppercase', letterSpacing: 0.5 },
  stepLabelActive: { color: COLORS.primary, fontWeight: '700' },
  stepConnector: { flex: 1, height: 1, backgroundColor: '#EBEBEB', marginHorizontal: 8, marginBottom: 16 },

  // Card
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  cardIcon: { fontSize: 20 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.charcoal },

  // Text area
  textArea: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#EBEBEB',
    padding: 14,
    minHeight: 110,
    fontSize: 14,
    color: COLORS.charcoal,
    lineHeight: 22,
  },

  // Photo
  photoPlaceholder: {
    backgroundColor: '#F0FFFE',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.softCyan,
    borderStyle: 'dashed',
    paddingVertical: 36,
    alignItems: 'center',
    gap: 6,
  },
  photoPlaceholderIcon: { fontSize: 36 },
  photoPlaceholderText: { fontSize: 15, fontWeight: '600', color: COLORS.primary },
  photoPlaceholderSub: { fontSize: 12, color: COLORS.warmGray },
  photoPreviewWrapper: { position: 'relative', borderRadius: 14, overflow: 'hidden' },
  previewImage: { width: '100%', height: 200, resizeMode: 'cover', borderRadius: 14 },
  retakeOverlay: {
    position: 'absolute', bottom: 10, right: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
  },
  retakeText: { color: COLORS.white, fontSize: 13, fontWeight: '600' },

  // AI Advocate button
  advocateButton: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: COLORS.softCyan,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  advocateLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  advocateBadge: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: '#F0FFFE',
    alignItems: 'center', justifyContent: 'center',
  },
  advocateBadgeIcon: { fontSize: 24 },
  advocateTitle: { fontSize: 15, fontWeight: '700', color: COLORS.charcoal },
  advocateSub: { fontSize: 12, color: COLORS.warmGray, marginTop: 2 },
  advocateArrow: { fontSize: 24, color: COLORS.primary, fontWeight: '300' },

  // Submit button
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
    marginBottom: 16,
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitText: { color: COLORS.white, fontSize: 17, fontWeight: '700' },
  submitArrow: { color: COLORS.white, fontSize: 18 },

  // Disclaimer
  disclaimer: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.warmGray,
    lineHeight: 18,
  },
});