import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Image, Platform, Linking, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLicense } from '@/lib/license-context';
import { Colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const WEBSITE_URL = 'https://identity-palette.replit.app/';

export default function LicenseGate() {
    const { isValidating, isValid, validateLicense, errorReason, deviceId } = useLicense();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [key, setKey] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleValidate = async () => {
        const cleanEmail = email.trim();
        const cleanPassword = password.trim();
        const cleanKey = key.replace(/\s+/g, '').toUpperCase();

        if (!cleanEmail || !cleanPassword || !cleanKey) return;
        setLoading(true);
        await validateLicense(cleanKey, cleanEmail, cleanPassword);
        setLoading(false);
    };

    useEffect(() => {
        if (isValid && !isValidating) {
            router.replace('/login');
        }
    }, [isValid, isValidating, router]);

    if (isValidating) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Verifying Store Activation...</Text>
            </View>
        );
    }

    // Wait for effect to route
    if (isValid) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="shield-checkmark" size={64} color={Colors.success} />
                <Text style={styles.successText}>Store Activated. Redirecting...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.content}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="shield-outline" size={64} color={Colors.primary} />
                    </View>

                    <Text style={styles.title}>Store Activation</Text>
                    <Text style={styles.subtitle}>Enter your store credentials and license key to get started.</Text>

                    {errorReason && (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>{errorReason}</Text>
                        </View>
                    )}

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Store Email</Text>
                        <TextInput
                            style={styles.inputRegular}
                            placeholder="store@example.com"
                            placeholderTextColor={Colors.textMuted}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Store Password</Text>
                        <TextInput
                            style={styles.inputRegular}
                            placeholder="••••••••"
                            placeholderTextColor={Colors.textMuted}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>License Key</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="BARMAGLY-XXXX-XXXX-XXXX-XXXX"
                            placeholderTextColor={Colors.textMuted}
                            value={key}
                            onChangeText={setKey}
                            autoCapitalize="characters"
                            autoCorrect={false}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.button, (!key.trim() || !email.trim() || !password.trim() || loading) && styles.buttonDisabled]}
                        onPress={handleValidate}
                        disabled={!key.trim() || !email.trim() || !password.trim() || loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Activate Store</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Need help? Contact your store administrator.</Text>
                    </View>

                    {/* ── Subscription Plans Section ── */}
                    <View style={styles.plansSection}>
                        <View style={styles.plansDivider} />
                        <Text style={styles.plansHeading}>Don't have a subscription yet?</Text>
                        <Text style={styles.plansSubheading}>
                            Subscribe to get your email, password, and activation key sent instantly.
                        </Text>

                        {/* Plan Cards */}
                        <View style={styles.planCards}>
                            {/* Basic Plan */}
                            <View style={styles.planCard}>
                                <View style={styles.planBadge}>
                                    <Text style={styles.planBadgeText}>🟢 Basic</Text>
                                </View>
                                <Text style={styles.planName}>POS Starter</Text>
                                <Text style={styles.planPrice}>
                                    <Text style={styles.planPriceCurrency}>CHF </Text>
                                    <Text style={styles.planPriceAmount}>199</Text>
                                    <Text style={styles.planPricePeriod}>/mo</Text>
                                </Text>
                                <View style={styles.planFeatures}>
                                    {['POS System', 'Inventory', 'Invoicing', 'Reports', 'Hosting & Support'].map(f => (
                                        <View key={f} style={styles.planFeatureRow}>
                                            <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                                            <Text style={styles.planFeatureText}>{f}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>

                            {/* Advanced Plan */}
                            <View style={[styles.planCard, styles.planCardAdvanced]}>
                                <View style={[styles.planBadge, styles.planBadgeAdvanced]}>
                                    <Text style={styles.planBadgeText}>🔵 Advanced</Text>
                                </View>
                                <Text style={styles.planName}>Smart Business Growth</Text>
                                <Text style={styles.planPrice}>
                                    <Text style={styles.planPriceCurrency}>CHF </Text>
                                    <Text style={styles.planPriceAmount}>499</Text>
                                    <Text style={styles.planPricePeriod}>/mo</Text>
                                </Text>
                                <View style={styles.planFeatures}>
                                    {['Everything in Basic', 'Online Store', 'CRM', 'Multi-device POS', 'Advanced Reports', 'Marketing Services'].map(f => (
                                        <View key={f} style={styles.planFeatureRow}>
                                            <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />
                                            <Text style={styles.planFeatureText}>{f}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </View>

                        {/* CTA Button */}
                        <TouchableOpacity
                            style={styles.subscribeButton}
                            onPress={() => Linking.openURL(WEBSITE_URL)}
                            activeOpacity={0.85}
                        >
                            <Ionicons name="globe-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                            <Text style={styles.subscribeButtonText}>Subscribe & Get Your Key →</Text>
                        </TouchableOpacity>

                        <Text style={styles.plansNote}>
                            After subscribing, check your email for your login credentials and license key.
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 32,
    },
    content: {
        width: '100%',
        maxWidth: 420,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: `${Colors.primary}15`,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: Colors.textMuted,
        marginBottom: 32,
        textAlign: 'center',
    },
    errorContainer: {
        backgroundColor: `${Colors.danger}15`,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: `${Colors.danger}30`,
        marginBottom: 24,
        width: '100%',
    },
    errorText: {
        color: Colors.danger,
        fontSize: 14,
        textAlign: 'center',
        fontWeight: '500',
    },
    inputContainer: {
        width: '100%',
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 8,
    },
    input: {
        backgroundColor: Colors.card,
        borderWidth: 1,
        borderColor: Colors.inputBorder,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: Colors.text,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        textAlign: 'center',
        letterSpacing: 2,
    },
    inputRegular: {
        backgroundColor: Colors.card,
        borderWidth: 1,
        borderColor: Colors.inputBorder,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: Colors.text,
        textAlign: 'left',
    },
    button: {
        backgroundColor: Colors.primary,
        width: '100%',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: "0px 4px 8px rgba(124, 58, 237, 0.2)",
        elevation: 4,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    footer: {
        marginTop: 48,
        alignItems: 'center',
    },
    footerText: {
        color: Colors.textMuted,
        fontSize: 12,
        marginBottom: 4,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: Colors.text,
    },
    successText: {
        marginTop: 16,
        fontSize: 24,
        fontWeight: '700',
        color: Colors.success,
    },

    // ── Plans Section ──
    plansSection: {
        width: '100%',
        marginTop: 8,
        paddingBottom: 24,
    },
    plansDivider: {
        height: 1,
        backgroundColor: Colors.cardBorder,
        marginVertical: 28,
        width: '100%',
    },
    plansHeading: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.text,
        textAlign: 'center',
        marginBottom: 8,
    },
    plansSubheading: {
        fontSize: 13,
        color: Colors.textMuted,
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 19,
    },
    planCards: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    planCard: {
        flex: 1,
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
    },
    planCardAdvanced: {
        borderColor: Colors.primary + '60',
        backgroundColor: Colors.primary + '08',
    },
    planBadge: {
        backgroundColor: Colors.success + '20',
        borderRadius: 20,
        paddingHorizontal: 8,
        paddingVertical: 3,
        alignSelf: 'flex-start',
        marginBottom: 10,
    },
    planBadgeAdvanced: {
        backgroundColor: Colors.primary + '20',
    },
    planBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.text,
    },
    planName: {
        fontSize: 13,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 8,
    },
    planPrice: {
        marginBottom: 12,
    },
    planPriceCurrency: {
        fontSize: 12,
        color: Colors.textMuted,
        fontWeight: '600',
    },
    planPriceAmount: {
        fontSize: 24,
        fontWeight: '900',
        color: Colors.primary,
    },
    planPricePeriod: {
        fontSize: 12,
        color: Colors.textMuted,
    },
    planFeatures: {
        gap: 6,
    },
    planFeatureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    planFeatureText: {
        fontSize: 11,
        color: Colors.textMuted,
        flex: 1,
    },
    subscribeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.primary,
        borderRadius: 14,
        paddingVertical: 16,
        paddingHorizontal: 24,
        width: '100%',
        marginBottom: 14,
    },
    subscribeButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    plansNote: {
        fontSize: 12,
        color: Colors.textMuted,
        textAlign: 'center',
        lineHeight: 18,
    },
});
