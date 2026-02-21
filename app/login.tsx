import React, { useState } from "react";
import {
  StyleSheet, Text, View, Pressable, Platform,
  Alert, Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { useAuth } from "@/lib/auth-context";
import { apiRequest } from "@/lib/query-client";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const topPad = Platform.OS === "web" ? 67 : 0;

  const handlePinPress = (digit: string) => {
    if (pin.length < 4) {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === 4) {
        handleLogin(newPin);
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };

  const handleLogin = async (pinCode: string) => {
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/employees/login", { pin: pinCode });
      const emp = await res.json();
      login(emp);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)");
    } catch (e: any) {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Login Failed", "Invalid PIN. Try 1234 (admin) or 0000 (cashier)");
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    try {
      const res = await apiRequest("POST", "/api/employees/login", { pin: "1234" });
      const emp = await res.json();
      login(emp);
      router.replace("/(tabs)");
    } catch {
      router.replace("/(tabs)");
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + topPad }]}>
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientMid, Colors.gradientEnd]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          <View style={styles.logoWrap}>
            <View style={styles.logoCircle}>
              <Ionicons name="cart" size={36} color={Colors.accent} />
            </View>
            <Text style={styles.appName}>Barmagly</Text>
            <Text style={styles.appDesc}>Smart POS System</Text>
          </View>

          <Text style={styles.pinLabel}>Enter PIN</Text>
          <View style={styles.pinDots}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={[styles.dot, i < pin.length && styles.dotFilled]} />
            ))}
          </View>

          <View style={styles.keypad}>
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"].map((key) => {
              if (key === "") return <View key="empty" style={styles.keyBtn} />;
              if (key === "del") {
                return (
                  <Pressable key="del" style={styles.keyBtn} onPress={handleDelete}>
                    <Ionicons name="backspace" size={24} color={Colors.white} />
                  </Pressable>
                );
              }
              return (
                <Pressable key={key} style={styles.keyBtn} onPress={() => handlePinPress(key)}>
                  <Text style={styles.keyText}>{key}</Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable style={styles.skipBtn} onPress={handleSkip}>
            <Text style={styles.skipText}>Quick Start (Admin)</Text>
          </Pressable>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  gradient: { flex: 1 },
  content: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  logoWrap: { alignItems: "center", marginBottom: 40 },
  logoCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "center", alignItems: "center", marginBottom: 12 },
  appName: { fontSize: 32, fontWeight: "900", color: Colors.white, letterSpacing: 1 },
  appDesc: { fontSize: 14, color: "rgba(255,255,255,0.7)", marginTop: 4 },
  pinLabel: { color: "rgba(255,255,255,0.8)", fontSize: 14, fontWeight: "600", marginBottom: 16 },
  pinDots: { flexDirection: "row", gap: 16, marginBottom: 32 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: "rgba(255,255,255,0.5)", backgroundColor: "transparent" },
  dotFilled: { backgroundColor: Colors.white, borderColor: Colors.white },
  keypad: { flexDirection: "row", flexWrap: "wrap", width: Math.min(SCREEN_WIDTH * 0.7, 280), justifyContent: "center" },
  keyBtn: { width: Math.min(SCREEN_WIDTH * 0.7, 280) / 3, height: 64, justifyContent: "center", alignItems: "center" },
  keyText: { color: Colors.white, fontSize: 28, fontWeight: "600" },
  skipBtn: { marginTop: 24, paddingVertical: 10, paddingHorizontal: 24 },
  skipText: { color: "rgba(255,255,255,0.6)", fontSize: 14 },
});
