import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { MOCK_POLICIES } from '../mock/policies';

const COLORS = {
  primary: '#00B4B6',
  softCyan: '#7EDDD4',
  background: '#F9F9F9',
  charcoal: '#3D3D3D',
  warmGray: '#B0B0B0',
  white: '#FFFFFF',
};

const POLICY_META: Record<string, { icon: string; accent: string }> = {
  'Auto Insurance':   { icon: '🚗', accent: '#00B4B6' },
  'Health Insurance': { icon: '🏥', accent: '#7EDDD4' },
  'Home Insurance':   { icon: '🏠', accent: '#F4A261' },
};

function getPolicyMeta(type: string) {
  return POLICY_META[type] ?? { icon: '📋', accent: COLORS.warmGray };
}

export default function WalletScreen({ navigation }: any) {
  //"({ navigation }: any)" — telling React Native navigation is of type "any"

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <FlatList
        data={MOCK_POLICIES}
        keyExtractor={item => item.id + item.name}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}

        ListHeaderComponent={
          <View>
            <View style={styles.topBar}>
              <View>
                <Text style={styles.greeting}>Good day 👋</Text>
                <Text style={styles.header}>My Wallet</Text>
              </View>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>U</Text>
              </View>
            </View>

            <View style={styles.summaryBanner}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{MOCK_POLICIES.length}</Text>
                <Text style={styles.summaryLabel}>Active Policies</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>0</Text>
                <Text style={styles.summaryLabel}>Pending Claims</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>✓</Text>
                <Text style={styles.summaryLabel}>All Synced</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Your Active Policies</Text>
          </View>
        }

        renderItem={({ item }) => {
          const meta = getPolicyMeta(item.type);
          return (
            <View style={styles.card}>
              <View style={[styles.cardAccent, { backgroundColor: meta.accent }]} />
              <View style={styles.cardContent}>
                <View style={[styles.iconBadge, { backgroundColor: meta.accent + '22' }]}>
                  <Text style={styles.iconBadgeText}>{meta.icon}</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  <Text style={styles.cardType}>{item.type}</Text>
                  <Text style={styles.cardId}>ID: {item.id}</Text>
                </View>
                <View style={styles.cardRight}>
                  <View style={styles.statusBadge}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>{item.status}</Text>
                  </View>
                  <Text style={styles.expiryText}>Exp</Text>
                  <Text style={styles.expiryDate}>{item.expiryDate}</Text>
                </View>
              </View>
            </View>
          );
        }}

        ListFooterComponent={
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => navigation.navigate('Claims')}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaIcon}>⚡</Text>
            <Text style={styles.ctaText}>File a New Claim</Text>
          </TouchableOpacity>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  listContent: { paddingHorizontal: 20, paddingBottom: 32 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Platform.OS === 'android' ? 16 : 8,
    marginBottom: 20,
  },
  greeting: { fontSize: 14, color: COLORS.warmGray, marginBottom: 2 },
  header: { fontSize: 26, fontWeight: '800', color: COLORS.charcoal, letterSpacing: -0.5 },
  avatarCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  avatarText: { color: COLORS.white, fontSize: 18, fontWeight: '700' },
  summaryBanner: {
    backgroundColor: COLORS.white, borderRadius: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    paddingVertical: 20, marginBottom: 28,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07, shadowRadius: 16, elevation: 5,
  },
  summaryItem: { alignItems: 'center' },
  summaryValue: { fontSize: 22, fontWeight: '800', color: COLORS.primary },
  summaryLabel: { fontSize: 11, color: COLORS.warmGray, marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryDivider: { width: 1, height: 36, backgroundColor: '#EBEBEB' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.charcoal, marginBottom: 14, letterSpacing: 0.2 },
  card: {
    backgroundColor: COLORS.white, borderRadius: 18, marginBottom: 14,
    flexDirection: 'row', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 12, elevation: 4,
  },
  cardAccent: { width: 5 },
  cardContent: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  iconBadge: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  iconBadgeText: { fontSize: 22 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '700', color: COLORS.charcoal, marginBottom: 2 },
  cardType: { fontSize: 12, color: COLORS.warmGray, marginBottom: 2 },
  cardId: { fontSize: 10, color: COLORS.warmGray, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  cardRight: { alignItems: 'flex-end', gap: 2 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#E8FFF3', borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 3, gap: 4, marginBottom: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4CAF50' },
  statusText: { color: '#2E7D32', fontSize: 11, fontWeight: '700' },
  expiryText: { fontSize: 10, color: COLORS.warmGray },
  expiryDate: { fontSize: 12, fontWeight: '600', color: COLORS.charcoal },
  ctaButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: COLORS.primary, paddingVertical: 18, borderRadius: 18, marginTop: 8,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 10,
  },
  ctaIcon: { fontSize: 18 },
  ctaText: { color: COLORS.white, fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
});