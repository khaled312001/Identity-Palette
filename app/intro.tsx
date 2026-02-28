import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '@/lib/language-context';

export default function IntroScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { width } = Dimensions.get('window');
    const { t, language, setLanguage, isRTL, rtlText } = useLanguage();

    const handleStart = async () => {
        await AsyncStorage.setItem('hasSeenIntro', 'true');
        router.replace('/license-gate');
    };

    const toggleLanguage = () => {
        setLanguage(language === 'en' ? 'ar' : 'en');
    };

    const title = language === 'en' ? 'Welcome to Barmagly' : 'مرحباً بك في برمجي';
    const subtitle = language === 'en'
        ? 'Your all-in-one Smart POS system. Fast, reliable, and easy to use. Manage your store operations seamlessly from any device.'
        : 'نظام نقاط البيع الذكي المتكامل الخاص بك. سريع وموثوق وسهل الاستخدام. أدر عمليات متجرك بسلاسة من أي جهاز.';

    const feat1 = language === 'en' ? 'Complete Inventory Management' : 'إدارة متكاملة للمخزون';
    const feat2 = language === 'en' ? 'Multi-Account Support' : 'دعم متعدد الحسابات';
    const feat3 = language === 'en' ? 'Secure License Activation' : 'تفعيل ترخيص آمن';
    const btnText = language === 'en' ? 'Get Started' : 'البدء';

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[Colors.gradientStart, Colors.gradientMid, Colors.gradientEnd]}
                style={[styles.gradient, { paddingBottom: insets.bottom }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <TouchableOpacity
                    onPress={toggleLanguage}
                    style={[styles.langButton, { top: Math.max(insets.top + 16, 40) }]}
                >
                    <Ionicons name="language" size={20} color={Colors.white} />
                    <Text style={styles.langText}>{language === 'en' ? 'عربي' : 'English'}</Text>
                </TouchableOpacity>

                <View style={styles.content}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="storefront" size={80} color={Colors.white} />
                    </View>

                    <Text style={[styles.title, rtlText]}>{title}</Text>
                    <Text style={[styles.subtitle, rtlText]}>{subtitle}</Text>

                    <View style={styles.features}>
                        <View style={[styles.featureItem, isRTL ? { flexDirection: 'row-reverse' } : {}]}>
                            <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                            <Text style={[styles.featureText, rtlText, isRTL ? { marginRight: 12 } : { marginLeft: 12 }]}>{feat1}</Text>
                        </View>
                        <View style={[styles.featureItem, isRTL ? { flexDirection: 'row-reverse' } : {}]}>
                            <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                            <Text style={[styles.featureText, rtlText, isRTL ? { marginRight: 12 } : { marginLeft: 12 }]}>{feat2}</Text>
                        </View>
                        <View style={[styles.featureItem, isRTL ? { flexDirection: 'row-reverse' } : {}]}>
                            <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                            <Text style={[styles.featureText, rtlText, isRTL ? { marginRight: 12 } : { marginLeft: 12 }]}>{feat3}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.footer}>
                    <Pressable
                        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, isRTL ? { flexDirection: 'row-reverse' } : {}]}
                        onPress={handleStart}
                    >
                        <Text style={[styles.buttonText, rtlText, isRTL ? { marginLeft: 8 } : { marginRight: 8 }]}>{btnText}</Text>
                        <Ionicons name={isRTL ? "arrow-back" : "arrow-forward"} size={20} color={Colors.background} />
                    </Pressable>
                </View>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.surface,
    },
    gradient: {
        flex: 1,
        justifyContent: 'space-between',
    },
    langButton: {
        position: 'absolute',
        right: 24,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        zIndex: 10,
    },
    langText: {
        color: Colors.white,
        marginLeft: 8,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        paddingTop: 40,
    },
    iconContainer: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    title: {
        fontSize: 40,
        fontWeight: '800',
        color: Colors.white,
        marginBottom: 16,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        lineHeight: 24,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        marginBottom: 48,
    },
    features: {
        width: '100%',
        maxWidth: 400,
        gap: 16,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    featureText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        paddingHorizontal: 32,
        paddingBottom: 40,
        alignItems: 'center',
    },
    button: {
        backgroundColor: Colors.white,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        maxWidth: 400,
        paddingVertical: 18,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    buttonPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
    },
    buttonText: {
        color: Colors.background,
        fontSize: 18,
        fontWeight: '700',
    },
});
