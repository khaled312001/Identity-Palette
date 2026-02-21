import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet, Text, View, FlatList, Pressable, TextInput,
  ScrollView, Modal, Alert, Platform, Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Colors } from "@/constants/colors";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { apiRequest, getQueryFn } from "@/lib/query-client";
import * as Haptics from "expo-haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const isTablet = SCREEN_WIDTH > 700;

export default function POSScreen() {
  const insets = useSafeAreaInsets();
  const { employee } = useAuth();
  const qc = useQueryClient();
  const cart = useCart();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [cashReceived, setCashReceived] = useState("");

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["/api/categories"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: products = [] } = useQuery<any[]>({
    queryKey: ["/api/products", search ? `?search=${search}` : ""],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  useEffect(() => {
    apiRequest("POST", "/api/seed").catch(() => {});
  }, []);

  const filteredProducts = selectedCategory
    ? products.filter((p: any) => p.categoryId === selectedCategory)
    : products;

  const saleMutation = useMutation({
    mutationFn: async () => {
      const data = {
        branchId: employee?.branchId || 1,
        employeeId: employee?.id || 1,
        customerId: cart.customerId,
        subtotal: cart.subtotal.toFixed(2),
        taxAmount: cart.tax.toFixed(2),
        discountAmount: cart.discount.toFixed(2),
        totalAmount: cart.total.toFixed(2),
        paymentMethod,
        paymentStatus: "completed",
        status: "completed",
        tableNumber: cart.tableNumber || null,
        orderType: cart.orderType,
        changeAmount: paymentMethod === "cash" && cashReceived
          ? (Number(cashReceived) - cart.total).toFixed(2) : "0",
        items: cart.items.map((i) => ({
          productId: i.productId,
          productName: i.name,
          quantity: i.quantity,
          unitPrice: i.price.toFixed(2),
          total: (i.price * i.quantity).toFixed(2),
          discount: "0",
        })),
      };
      return apiRequest("POST", "/api/sales", data);
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      cart.clearCart();
      setShowCheckout(false);
      setCashReceived("");
      qc.invalidateQueries({ queryKey: ["/api/sales"] });
      qc.invalidateQueries({ queryKey: ["/api/dashboard"] });
      qc.invalidateQueries({ queryKey: ["/api/inventory"] });
      Alert.alert("Success", "Sale completed successfully!");
    },
    onError: (e: any) => {
      Alert.alert("Error", e.message || "Failed to complete sale");
    },
  });

  const handleAddToCart = useCallback((product: any) => {
    cart.addItem({ id: product.id, name: product.name, price: Number(product.price) });
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [cart]);

  const topPad = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top + topPad }]}>
      <View style={styles.header}>
        <LinearGradient colors={[Colors.gradientStart, Colors.gradientMid, Colors.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.headerGradient}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Barmagly POS</Text>
            <View style={styles.headerRight}>
              {employee && <Text style={styles.employeeName}>{employee.name}</Text>}
            </View>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.mainContent}>
        <View style={[styles.productsSection, isTablet && styles.productsSectionTablet]}>
          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color={Colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search products..."
                placeholderTextColor={Colors.textMuted}
                value={search}
                onChangeText={setSearch}
              />
              {search ? (
                <Pressable onPress={() => setSearch("")}>
                  <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
                </Pressable>
              ) : null}
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesRow} contentContainerStyle={styles.categoriesContent}>
            <Pressable
              style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text style={[styles.categoryChipText, !selectedCategory && styles.categoryChipTextActive]}>All</Text>
            </Pressable>
            {categories.map((cat: any) => (
              <Pressable
                key={cat.id}
                style={[styles.categoryChip, selectedCategory === cat.id && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
              >
                <View style={[styles.categoryDot, { backgroundColor: cat.color }]} />
                <Text style={[styles.categoryChipText, selectedCategory === cat.id && styles.categoryChipTextActive]}>{cat.name}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <FlatList
            data={filteredProducts}
            numColumns={isTablet ? 4 : 3}
            key={isTablet ? "tablet" : "phone"}
            keyExtractor={(item: any) => String(item.id)}
            contentContainerStyle={styles.productGrid}
            scrollEnabled={!!filteredProducts.length}
            renderItem={({ item }: { item: any }) => (
              <Pressable style={styles.productCard} onPress={() => handleAddToCart(item)}>
                <View style={[styles.productIcon, { backgroundColor: Colors.surfaceLight }]}>
                  <Ionicons name="cube" size={28} color={Colors.accent} />
                </View>
                <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.productPrice}>${Number(item.price).toFixed(2)}</Text>
              </Pressable>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="search" size={48} color={Colors.textMuted} />
                <Text style={styles.emptyText}>No products found</Text>
              </View>
            }
          />
        </View>

        <View style={[styles.cartSection, isTablet && styles.cartSectionTablet]}>
          <View style={styles.cartHeader}>
            <Text style={styles.cartTitle}>Cart ({cart.itemCount})</Text>
            {cart.items.length > 0 && (
              <Pressable onPress={() => cart.clearCart()}>
                <Ionicons name="trash" size={20} color={Colors.danger} />
              </Pressable>
            )}
          </View>

          <FlatList
            data={cart.items}
            keyExtractor={(item) => String(item.productId)}
            scrollEnabled={!!cart.items.length}
            style={styles.cartList}
            renderItem={({ item }) => (
              <View style={styles.cartItem}>
                <View style={styles.cartItemInfo}>
                  <Text style={styles.cartItemName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.cartItemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
                </View>
                <View style={styles.cartItemActions}>
                  <Pressable style={styles.qtyBtn} onPress={() => cart.updateQuantity(item.productId, item.quantity - 1)}>
                    <Ionicons name="remove" size={16} color={Colors.text} />
                  </Pressable>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <Pressable style={styles.qtyBtn} onPress={() => cart.updateQuantity(item.productId, item.quantity + 1)}>
                    <Ionicons name="add" size={16} color={Colors.text} />
                  </Pressable>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.cartEmpty}>
                <Ionicons name="cart-outline" size={40} color={Colors.textMuted} />
                <Text style={styles.cartEmptyText}>Cart is empty</Text>
                <Text style={styles.cartEmptySubtext}>Tap products to add</Text>
              </View>
            }
          />

          <View style={styles.cartSummary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>${cart.subtotal.toFixed(2)}</Text>
            </View>
            {cart.discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: Colors.success }]}>Discount</Text>
                <Text style={[styles.summaryValue, { color: Colors.success }]}>-${cart.discount.toFixed(2)}</Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax ({cart.taxRate}%)</Text>
              <Text style={styles.summaryValue}>${cart.tax.toFixed(2)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${cart.total.toFixed(2)}</Text>
            </View>
          </View>

          <Pressable
            style={[styles.checkoutBtn, !cart.items.length && styles.checkoutBtnDisabled]}
            onPress={() => cart.items.length > 0 && setShowCheckout(true)}
            disabled={!cart.items.length}
          >
            <LinearGradient
              colors={cart.items.length > 0 ? [Colors.gradientStart, Colors.accent] : ["#333", "#555"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.checkoutBtnGradient}
            >
              <Ionicons name="card" size={20} color={Colors.white} />
              <Text style={styles.checkoutBtnText}>Checkout ${cart.total.toFixed(2)}</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>

      <Modal visible={showCheckout} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Complete Payment</Text>
              <Pressable onPress={() => setShowCheckout(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </Pressable>
            </View>

            <Text style={styles.modalTotal}>${cart.total.toFixed(2)}</Text>

            <Text style={styles.sectionLabel}>Payment Method</Text>
            <View style={styles.paymentMethods}>
              {[
                { key: "cash", icon: "cash" as const, label: "Cash" },
                { key: "card", icon: "card" as const, label: "Card" },
                { key: "mobile", icon: "phone-portrait" as const, label: "Mobile" },
              ].map((m) => (
                <Pressable
                  key={m.key}
                  style={[styles.paymentBtn, paymentMethod === m.key && styles.paymentBtnActive]}
                  onPress={() => setPaymentMethod(m.key)}
                >
                  <Ionicons name={m.icon} size={24} color={paymentMethod === m.key ? Colors.accent : Colors.textSecondary} />
                  <Text style={[styles.paymentBtnText, paymentMethod === m.key && { color: Colors.accent }]}>{m.label}</Text>
                </Pressable>
              ))}
            </View>

            {paymentMethod === "cash" && (
              <View style={styles.cashSection}>
                <Text style={styles.sectionLabel}>Cash Received</Text>
                <TextInput
                  style={styles.cashInput}
                  placeholder="Enter amount..."
                  placeholderTextColor={Colors.textMuted}
                  value={cashReceived}
                  onChangeText={setCashReceived}
                  keyboardType="decimal-pad"
                />
                {cashReceived && Number(cashReceived) >= cart.total && (
                  <Text style={styles.changeText}>Change: ${(Number(cashReceived) - cart.total).toFixed(2)}</Text>
                )}
              </View>
            )}

            <Pressable
              style={[styles.completeBtn, saleMutation.isPending && { opacity: 0.7 }]}
              onPress={() => !saleMutation.isPending && saleMutation.mutate()}
              disabled={saleMutation.isPending}
            >
              <LinearGradient colors={[Colors.success, "#059669"]} style={styles.completeBtnGradient}>
                <Ionicons name="checkmark-circle" size={22} color={Colors.white} />
                <Text style={styles.completeBtnText}>
                  {saleMutation.isPending ? "Processing..." : "Complete Sale"}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </Modal>

      <View style={{ height: Platform.OS === "web" ? 84 : 60 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { overflow: "hidden" },
  headerGradient: { paddingHorizontal: 16, paddingVertical: 12 },
  headerContent: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { fontSize: 22, fontWeight: "800", color: Colors.white, letterSpacing: 0.5 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  employeeName: { color: Colors.white, fontSize: 13, opacity: 0.9 },
  mainContent: { flex: 1, flexDirection: isTablet ? "row" : "column" },
  productsSection: { flex: 1 },
  productsSectionTablet: { flex: 2 },
  searchRow: { paddingHorizontal: 12, paddingTop: 12 },
  searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.inputBg, borderRadius: 12, paddingHorizontal: 12, height: 42, borderWidth: 1, borderColor: Colors.inputBorder },
  searchInput: { flex: 1, color: Colors.text, marginLeft: 8, fontSize: 15 },
  categoriesRow: { maxHeight: 44, marginTop: 8 },
  categoriesContent: { paddingHorizontal: 12, gap: 8 },
  categoryChip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.cardBorder, gap: 6 },
  categoryChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  categoryChipText: { color: Colors.textSecondary, fontSize: 13, fontWeight: "600" },
  categoryChipTextActive: { color: Colors.textDark },
  categoryDot: { width: 8, height: 8, borderRadius: 4 },
  productGrid: { padding: 8 },
  productCard: { flex: 1, margin: 4, backgroundColor: Colors.surface, borderRadius: 14, padding: 12, alignItems: "center", borderWidth: 1, borderColor: Colors.cardBorder, minWidth: 90 },
  productIcon: { width: 52, height: 52, borderRadius: 14, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  productName: { color: Colors.text, fontSize: 12, fontWeight: "600", textAlign: "center", marginBottom: 4 },
  productPrice: { color: Colors.accent, fontSize: 14, fontWeight: "800" },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyText: { color: Colors.textMuted, fontSize: 15, marginTop: 12 },
  cartSection: { backgroundColor: Colors.surface, borderTopWidth: 1, borderColor: Colors.cardBorder, maxHeight: isTablet ? undefined : 320 },
  cartSectionTablet: { flex: 1, borderTopWidth: 0, borderLeftWidth: 1, maxHeight: undefined },
  cartHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderColor: Colors.cardBorder },
  cartTitle: { color: Colors.text, fontSize: 16, fontWeight: "700" },
  cartList: { maxHeight: isTablet ? undefined : 120 },
  cartItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  cartItemInfo: { flex: 1 },
  cartItemName: { color: Colors.text, fontSize: 13, fontWeight: "500" },
  cartItemPrice: { color: Colors.accent, fontSize: 12, marginTop: 2 },
  cartItemActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.surfaceLight, justifyContent: "center", alignItems: "center" },
  qtyText: { color: Colors.text, fontSize: 14, fontWeight: "700", minWidth: 20, textAlign: "center" },
  cartEmpty: { alignItems: "center", paddingVertical: 20 },
  cartEmptyText: { color: Colors.textMuted, fontSize: 14, marginTop: 8 },
  cartEmptySubtext: { color: Colors.textMuted, fontSize: 12, marginTop: 4 },
  cartSummary: { paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: 1, borderColor: Colors.cardBorder },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  summaryLabel: { color: Colors.textSecondary, fontSize: 13 },
  summaryValue: { color: Colors.text, fontSize: 13, fontWeight: "600" },
  totalRow: { borderTopWidth: 1, borderColor: Colors.cardBorder, paddingTop: 8, marginTop: 4 },
  totalLabel: { color: Colors.text, fontSize: 16, fontWeight: "800" },
  totalValue: { color: Colors.accent, fontSize: 18, fontWeight: "800" },
  checkoutBtn: { marginHorizontal: 16, marginBottom: 8, borderRadius: 14, overflow: "hidden" },
  checkoutBtnDisabled: { opacity: 0.5 },
  checkoutBtnGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14, gap: 8 },
  checkoutBtnText: { color: Colors.white, fontSize: 16, fontWeight: "700" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: Colors.surface, borderRadius: 20, padding: 24, width: isTablet ? 420 : "90%", maxHeight: "80%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { color: Colors.text, fontSize: 20, fontWeight: "700" },
  modalTotal: { color: Colors.accent, fontSize: 36, fontWeight: "800", textAlign: "center", marginBottom: 20 },
  sectionLabel: { color: Colors.textSecondary, fontSize: 13, fontWeight: "600", marginBottom: 8, textTransform: "uppercase" as const, letterSpacing: 1 },
  paymentMethods: { flexDirection: "row", gap: 12, marginBottom: 20 },
  paymentBtn: { flex: 1, alignItems: "center", paddingVertical: 16, borderRadius: 14, backgroundColor: Colors.surfaceLight, borderWidth: 1, borderColor: Colors.cardBorder, gap: 6 },
  paymentBtnActive: { borderColor: Colors.accent, backgroundColor: "rgba(47,211,198,0.1)" },
  paymentBtnText: { color: Colors.textSecondary, fontSize: 12, fontWeight: "600" },
  cashSection: { marginBottom: 16 },
  cashInput: { backgroundColor: Colors.inputBg, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: Colors.text, fontSize: 18, fontWeight: "700", borderWidth: 1, borderColor: Colors.inputBorder, textAlign: "center" },
  changeText: { color: Colors.success, fontSize: 16, fontWeight: "700", textAlign: "center", marginTop: 8 },
  completeBtn: { borderRadius: 14, overflow: "hidden", marginTop: 8 },
  completeBtnGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, gap: 8 },
  completeBtnText: { color: Colors.white, fontSize: 16, fontWeight: "700" },
});
