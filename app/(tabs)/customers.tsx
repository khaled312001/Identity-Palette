import React, { useState } from "react";
import {
  StyleSheet, Text, View, FlatList, Pressable, TextInput,
  Modal, Alert, ScrollView, Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Colors } from "@/constants/colors";
import { apiRequest, getQueryFn } from "@/lib/query-client";

export default function CustomersScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editCustomer, setEditCustomer] = useState<any>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", notes: "" });

  const { data: customers = [] } = useQuery<any[]>({
    queryKey: ["/api/customers", search ? `?search=${search}` : ""],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => apiRequest(editCustomer ? "PUT" : "POST", editCustomer ? `/api/customers/${editCustomer.id}` : "/api/customers", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/customers"] });
      setShowForm(false);
      setEditCustomer(null);
      setForm({ name: "", email: "", phone: "", address: "", notes: "" });
    },
    onError: (e: any) => Alert.alert("Error", e.message),
  });

  const openEdit = (c: any) => {
    setEditCustomer(c);
    setForm({ name: c.name, email: c.email || "", phone: c.phone || "", address: c.address || "", notes: c.notes || "" });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name) return Alert.alert("Error", "Name is required");
    saveMutation.mutate({ name: form.name, email: form.email || undefined, phone: form.phone || undefined, address: form.address || undefined, notes: form.notes || undefined });
  };

  const topPad = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top + topPad }]}>
      <LinearGradient colors={[Colors.gradientStart, Colors.gradientMid]} style={styles.header}>
        <Text style={styles.headerTitle}>Customers</Text>
        <Pressable style={styles.addBtn} onPress={() => { setEditCustomer(null); setForm({ name: "", email: "", phone: "", address: "", notes: "" }); setShowForm(true); }}>
          <Ionicons name="add" size={24} color={Colors.white} />
        </Pressable>
      </LinearGradient>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={Colors.textMuted} />
          <TextInput style={styles.searchInput} placeholder="Search customers..." placeholderTextColor={Colors.textMuted} value={search} onChangeText={setSearch} />
        </View>
      </View>

      <FlatList
        data={customers}
        keyExtractor={(item: any) => String(item.id)}
        contentContainerStyle={styles.list}
        scrollEnabled={!!customers.length}
        renderItem={({ item }: { item: any }) => (
          <Pressable style={styles.card} onPress={() => openEdit(item)}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{item.name}</Text>
              <Text style={styles.cardMeta}>{item.phone || item.email || "No contact info"}</Text>
            </View>
            <View style={styles.cardRight}>
              <View style={styles.loyaltyBadge}>
                <Ionicons name="star" size={12} color={Colors.warning} />
                <Text style={styles.loyaltyText}>{item.loyaltyPoints || 0}</Text>
              </View>
              <Text style={styles.totalSpent}>${Number(item.totalSpent || 0).toFixed(0)}</Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={<View style={styles.empty}><Ionicons name="people-outline" size={48} color={Colors.textMuted} /><Text style={styles.emptyText}>No customers yet</Text></View>}
      />

      <Modal visible={showForm} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editCustomer ? "Edit Customer" : "New Customer"}</Text>
              <Pressable onPress={() => setShowForm(false)}><Ionicons name="close" size={24} color={Colors.text} /></Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Name *</Text>
              <TextInput style={styles.input} value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} placeholderTextColor={Colors.textMuted} placeholder="Customer name" />
              <Text style={styles.label}>Phone</Text>
              <TextInput style={styles.input} value={form.phone} onChangeText={(t) => setForm({ ...form, phone: t })} keyboardType="phone-pad" placeholderTextColor={Colors.textMuted} placeholder="+1234567890" />
              <Text style={styles.label}>Email</Text>
              <TextInput style={styles.input} value={form.email} onChangeText={(t) => setForm({ ...form, email: t })} keyboardType="email-address" placeholderTextColor={Colors.textMuted} placeholder="email@example.com" autoCapitalize="none" />
              <Text style={styles.label}>Address</Text>
              <TextInput style={styles.input} value={form.address} onChangeText={(t) => setForm({ ...form, address: t })} placeholderTextColor={Colors.textMuted} placeholder="Address" />
              <Text style={styles.label}>Notes</Text>
              <TextInput style={[styles.input, { height: 80, textAlignVertical: "top" }]} value={form.notes} onChangeText={(t) => setForm({ ...form, notes: t })} multiline placeholderTextColor={Colors.textMuted} placeholder="Notes..." />
              <Pressable style={styles.saveBtn} onPress={handleSave}>
                <LinearGradient colors={[Colors.accent, Colors.gradientMid]} style={styles.saveBtnGradient}>
                  <Text style={styles.saveBtnText}>{editCustomer ? "Update" : "Create"} Customer</Text>
                </LinearGradient>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <View style={{ height: Platform.OS === "web" ? 84 : 60 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 },
  headerTitle: { fontSize: 22, fontWeight: "800", color: Colors.white },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center" },
  searchRow: { paddingHorizontal: 12, paddingVertical: 10 },
  searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.inputBg, borderRadius: 12, paddingHorizontal: 12, height: 42, borderWidth: 1, borderColor: Colors.inputBorder },
  searchInput: { flex: 1, color: Colors.text, marginLeft: 8, fontSize: 15 },
  list: { paddingHorizontal: 12 },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.cardBorder },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.gradientMid, justifyContent: "center", alignItems: "center", marginRight: 12 },
  avatarText: { color: Colors.white, fontSize: 18, fontWeight: "800" },
  cardInfo: { flex: 1 },
  cardName: { color: Colors.text, fontSize: 15, fontWeight: "600" },
  cardMeta: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  cardRight: { alignItems: "flex-end", gap: 4 },
  loyaltyBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(245,158,11,0.15)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  loyaltyText: { color: Colors.warning, fontSize: 12, fontWeight: "700" },
  totalSpent: { color: Colors.textMuted, fontSize: 12 },
  empty: { alignItems: "center", paddingVertical: 60 },
  emptyText: { color: Colors.textMuted, fontSize: 15, marginTop: 12 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: Colors.surface, borderRadius: 20, padding: 24, width: "90%", maxWidth: 460, maxHeight: "85%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { color: Colors.text, fontSize: 20, fontWeight: "700" },
  label: { color: Colors.textSecondary, fontSize: 12, fontWeight: "600", marginBottom: 6, marginTop: 12, textTransform: "uppercase" as const, letterSpacing: 0.5 },
  input: { backgroundColor: Colors.inputBg, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: Colors.text, fontSize: 15, borderWidth: 1, borderColor: Colors.inputBorder },
  saveBtn: { borderRadius: 14, overflow: "hidden", marginTop: 20, marginBottom: 16 },
  saveBtnGradient: { paddingVertical: 14, alignItems: "center" },
  saveBtnText: { color: Colors.white, fontSize: 16, fontWeight: "700" },
});
