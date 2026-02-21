import React, { useState } from "react";
import {
  StyleSheet, Text, View, ScrollView, Pressable, Platform, FlatList, Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Colors } from "@/constants/colors";
import { getQueryFn } from "@/lib/query-client";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const isTablet = SCREEN_WIDTH > 700;

function StatCard({ icon, label, value, color, subValue }: { icon: string; label: string; value: string; color: string; subValue?: string }) {
  return (
    <View style={[statStyles.card, { borderLeftColor: color, borderLeftWidth: 3 }]}>
      <View style={[statStyles.iconWrap, { backgroundColor: color + "20" }]}>
        <Ionicons name={icon as any} size={22} color={color} />
      </View>
      <View style={statStyles.info}>
        <Text style={statStyles.label}>{label}</Text>
        <Text style={statStyles.value}>{value}</Text>
        {subValue ? <Text style={statStyles.subValue}>{subValue}</Text> : null}
      </View>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: { backgroundColor: Colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.cardBorder, flexDirection: "row", alignItems: "center", gap: 14, flex: 1, minWidth: 150 },
  iconWrap: { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  info: { flex: 1 },
  label: { color: Colors.textMuted, fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  value: { color: Colors.text, fontSize: 22, fontWeight: "800", marginTop: 2 },
  subValue: { color: Colors.textSecondary, fontSize: 11, marginTop: 2 },
});

export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<"overview" | "sales" | "inventory">("overview");

  const { data: stats } = useQuery<any>({
    queryKey: ["/api/dashboard"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: recentSales = [] } = useQuery<any[]>({
    queryKey: ["/api/sales?limit=20"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: lowStock = [] } = useQuery<any[]>({
    queryKey: ["/api/inventory/low-stock"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: allProducts = [] } = useQuery<any[]>({
    queryKey: ["/api/products"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const topPad = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top + topPad }]}>
      <LinearGradient colors={[Colors.gradientStart, Colors.gradientMid]} style={styles.header}>
        <Text style={styles.headerTitle}>Reports & Analytics</Text>
      </LinearGradient>

      <View style={styles.tabRow}>
        {(["overview", "sales", "inventory"] as const).map((t) => (
          <Pressable key={t} style={[styles.tabBtn, tab === t && styles.tabBtnActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: (Platform.OS === "web" ? 84 : 60) + 20 }]}>
        {tab === "overview" && (
          <>
            <View style={[styles.statGrid, isTablet && styles.statGridTablet]}>
              <StatCard icon="cash" label="Today Revenue" value={`$${(stats?.todayRevenue || 0).toFixed(0)}`} color={Colors.accent} subValue={`${stats?.todaySalesCount || 0} transactions`} />
              <StatCard icon="trending-up" label="Total Revenue" value={`$${(stats?.totalRevenue || 0).toFixed(0)}`} color={Colors.info} subValue={`${stats?.totalSales || 0} total sales`} />
            </View>
            <View style={[styles.statGrid, isTablet && styles.statGridTablet]}>
              <StatCard icon="people" label="Customers" value={String(stats?.totalCustomers || 0)} color={Colors.secondary} />
              <StatCard icon="cube" label="Products" value={String(stats?.totalProducts || 0)} color={Colors.success} />
            </View>
            <View style={styles.statGrid}>
              <StatCard icon="alert-circle" label="Low Stock Items" value={String(stats?.lowStockItems || 0)} color={Colors.danger} subValue="Need reorder" />
            </View>

            <Text style={styles.sectionTitle}>Recent Sales</Text>
            {recentSales.slice(0, 8).map((sale: any) => (
              <View key={sale.id} style={styles.saleCard}>
                <View style={styles.saleInfo}>
                  <Text style={styles.saleReceipt}>{sale.receiptNumber}</Text>
                  <Text style={styles.saleDate}>{new Date(sale.createdAt).toLocaleDateString()}</Text>
                </View>
                <View style={styles.saleRight}>
                  <Text style={styles.saleAmount}>${Number(sale.totalAmount).toFixed(2)}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: sale.status === "completed" ? Colors.success + "20" : Colors.warning + "20" }]}>
                    <Text style={[styles.statusText, { color: sale.status === "completed" ? Colors.success : Colors.warning }]}>
                      {sale.paymentMethod}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
            {recentSales.length === 0 && (
              <View style={styles.empty}>
                <Ionicons name="receipt-outline" size={40} color={Colors.textMuted} />
                <Text style={styles.emptyText}>No sales yet. Start selling!</Text>
              </View>
            )}
          </>
        )}

        {tab === "sales" && (
          <>
            <Text style={styles.sectionTitle}>All Sales</Text>
            {recentSales.map((sale: any) => (
              <View key={sale.id} style={styles.saleCard}>
                <View style={styles.saleInfo}>
                  <Text style={styles.saleReceipt}>{sale.receiptNumber}</Text>
                  <Text style={styles.saleDate}>{new Date(sale.createdAt).toLocaleString()}</Text>
                </View>
                <View style={styles.saleRight}>
                  <Text style={styles.saleAmount}>${Number(sale.totalAmount).toFixed(2)}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: Colors.success + "20" }]}>
                    <Text style={[styles.statusText, { color: Colors.success }]}>{sale.paymentMethod}</Text>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        {tab === "inventory" && (
          <>
            <Text style={styles.sectionTitle}>Low Stock Alerts</Text>
            {lowStock.length > 0 ? lowStock.map((item: any) => {
              const product = allProducts.find((p: any) => p.id === item.productId);
              return (
                <View key={item.id} style={styles.stockCard}>
                  <View style={[styles.stockIcon, { backgroundColor: Colors.danger + "20" }]}>
                    <Ionicons name="warning" size={20} color={Colors.danger} />
                  </View>
                  <View style={styles.stockInfo}>
                    <Text style={styles.stockName}>{product?.name || `Product #${item.productId}`}</Text>
                    <Text style={styles.stockMeta}>Threshold: {item.lowStockThreshold}</Text>
                  </View>
                  <View style={styles.stockRight}>
                    <Text style={[styles.stockQty, { color: (item.quantity || 0) <= 5 ? Colors.danger : Colors.warning }]}>
                      {item.quantity || 0} left
                    </Text>
                  </View>
                </View>
              );
            }) : (
              <View style={styles.empty}>
                <Ionicons name="checkmark-circle" size={40} color={Colors.success} />
                <Text style={styles.emptyText}>All stock levels are healthy</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 16, paddingVertical: 14 },
  headerTitle: { fontSize: 22, fontWeight: "800", color: Colors.white },
  tabRow: { flexDirection: "row", paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  tabBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.surface },
  tabBtnActive: { backgroundColor: Colors.accent },
  tabText: { color: Colors.textSecondary, fontSize: 13, fontWeight: "600" },
  tabTextActive: { color: Colors.textDark },
  content: { paddingHorizontal: 12 },
  statGrid: { flexDirection: "row", gap: 10, marginBottom: 10 },
  statGridTablet: {},
  sectionTitle: { color: Colors.text, fontSize: 17, fontWeight: "700", marginTop: 16, marginBottom: 10 },
  saleCard: { flexDirection: "row", justifyContent: "space-between", backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.cardBorder },
  saleInfo: { flex: 1 },
  saleReceipt: { color: Colors.text, fontSize: 13, fontWeight: "600" },
  saleDate: { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
  saleRight: { alignItems: "flex-end", gap: 4 },
  saleAmount: { color: Colors.accent, fontSize: 16, fontWeight: "800" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: "600" },
  stockCard: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.cardBorder },
  stockIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: "center", alignItems: "center", marginRight: 12 },
  stockInfo: { flex: 1 },
  stockName: { color: Colors.text, fontSize: 14, fontWeight: "600" },
  stockMeta: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  stockRight: { alignItems: "flex-end" },
  stockQty: { fontSize: 14, fontWeight: "800" },
  empty: { alignItems: "center", paddingVertical: 40 },
  emptyText: { color: Colors.textMuted, fontSize: 14, marginTop: 10 },
});
