import { useEffect, useState } from "react";
import { Redirect, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLicense } from "@/lib/license-context";
import { View, ActivityIndicator } from "react-native";
import { Colors } from "@/constants/colors";

export default function IndexScreen() {
    const router = useRouter();
    const { isValid, isValidating } = useLicense();
    const [hasSeenIntro, setHasSeenIntro] = useState<boolean | null>(null);

    useEffect(() => {
        async function checkIntro() {
            try {
                const seen = await AsyncStorage.getItem("hasSeenIntro");
                setHasSeenIntro(seen === "true");
            } catch (e) {
                setHasSeenIntro(false);
            }
        }
        checkIntro();
    }, []);

    useEffect(() => {
        if (isValidating || hasSeenIntro === null) return;

        // Use setTimeout to ensure the navigation state is ready for replace
        setTimeout(() => {
            if (!hasSeenIntro) {
                router.replace("/intro" as any);
                return;
            }

            if (isValid === false) {
                router.replace("/license-gate" as any);
            } else {
                router.replace("/login" as any);
            }
        }, 0);
    }, [isValidating, hasSeenIntro, isValid, router]);

    // Optionally return a fallback loading screen while deciding where to route
    return (
        <View style={{ flex: 1, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={Colors.primary} />
        </View>
    );
}
