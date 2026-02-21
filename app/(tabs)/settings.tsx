import React, { useState } from "react";
import {
  StyleSheet, Text, View, ScrollView, Pressable, Modal,
  TextInput, Alert, Platform, FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Colors } from "@/constants/colors";
import { useAuth } from "@/lib/auth-context";
import { apiRequest, getQueryFn } from "@/lib/query-client";

function SettingRow({ icon, label, value, onPress, color }: { icon: string; label: string; value?: string; onPress?: () => void; color?: string }) {
  return (
    <Pressable style={rowStyles.row} onPress={onPress}>
      <View style={[rowStyles.iconWrap, { backgroundColor: (color || Colors.accent) + "20" }]}>
        <Ionicons name={icon as any} size={20} color={color || Colors.accent} />
      </View>
      <View style={rowStyles.info}>
        <Text style={rowStyles.label}>{label}</Text>
        {value ? <Text style={rowStyles.value}>{value}</Text> : null}
      </View>
      {onPress && <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />}
    </Pressable>
  );
}

const rowStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.cardBorder },
  iconWrap: { width: 40, height: 40, borderRadius: 10, justifyContent: "center", alignItems: "center", marginRight: 12 },
  info: { flex: 1 },
  label: { color: Colors.text, fontSize: 15, fontWeight: "600" },
  value: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
});

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { employee, logout } = useAuth();
  const [showEmployees, setShowEmployees] = useState(false);
  const [showSuppliers, setShowSuppliers] = useState(false);
  const [showBranches, setShowBranches] = useState(false);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [empForm, setEmpForm] = useState({ name: "", pin: "", role: "cashier", email: "", phone: "" });
  const [supForm, setSupForm] = useState({ name: "", contactName: "", email: "", phone: "", paymentTerms: "" });

  const { data: employees = [] } = useQuery<any[]>({ queryKey: ["/api/employees"], queryFn: getQueryFn({ on401: "throw" }) });
  const { data: suppliers = [] } = useQuery<any[]>({ queryKey: ["/api/suppliers"], queryFn: getQueryFn({ on401: "throw" }) });
  const { data: branches = [] } = useQuery<any[]>({ queryKey: ["/api/branches"], queryFn: getQueryFn({ on401: "throw" }) });
  const { data: shifts = [] } = useQuery<any[]>({ queryKey: ["/api/shifts"], queryFn: getQueryFn({ on401: "throw" }) });

  const createEmpMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/employees", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/employees"] }); setShowEmployeeForm(false); },
    onError: (e: any) => Alert.alert("Error", e.message),
  });

  const createSupMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/suppliers", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/suppliers"] }); setShowSupplierForm(false); },
    onError: (e: any) => Alert.alert("Error", e.message),
  });

  const topPad = Platform.OS === "web" ? 67 : 0;
  const roleColors: Record<string, string> = { admin: Colors.danger, manager: Colors.warning, cashier: Colors.info, owner: Colors.secondary };

  return (
    <View style={[styles.container, { paddingTop: insets.top + topPad }]}>
      <LinearGradient colors={[Colors.gradientStart, Colors.gradientMid]} style={styles.header}>
        <Text style={styles.headerTitle}>Settings & More</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: (Platform.OS === "web" ? 84 : 60) + 20 }]}>
        {employee && (
          <View style={styles.profileCard}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileInitial}>{employee.name.charAt(0)}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{employee.name}</Text>
              <View style={[styles.roleBadge, { backgroundColor: (roleColors[employee.role] || Colors.info) + "20" }]}>
                <Text style={[styles.roleText, { color: roleColors[employee.role] || Colors.info }]}>{employee.role}</Text>
              </View>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>Management</Text>
        <SettingRow icon="people" label="Employees" value={`${employees.length} members`} onPress={() => setShowEmployees(true)} color={Colors.info} />
        <SettingRow icon="business" label="Branches" value={`${branches.length} locations`} onPress={() => setShowBranches(true)} color={Colors.secondary} />
        <SettingRow icon="cube" label="Suppliers" value={`${suppliers.length} suppliers`} onPress={() => setShowSuppliers(true)} color={Colors.success} />
        <SettingRow icon="time" label="Shifts" value={`${shifts.length} records`} color={Colors.warning} />

        <Text style={styles.sectionTitle}>System</Text>
        <SettingRow icon="language" label="Language" value="English" color={Colors.accent} />
        <SettingRow icon="print" label="Receipt Printer" value="Not configured" color={Colors.textMuted} />
        <SettingRow icon="cloud-upload" label="Sync Status" value="Connected" color={Colors.success} />
        <SettingRow icon="information-circle" label="App Version" value="1.0.0" color={Colors.info} />

        <Pressable style={styles.logoutBtn} onPress={() => { logout(); Alert.alert("Logged Out", "You have been logged out"); }}>
          <Ionicons name="log-out" size={20} color={Colors.danger} />
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>
      </ScrollView>

      {/* Employees Modal */}
      <Modal visible={showEmployees} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Employees</Text>
              <View style={styles.modalActions}>
                <Pressable onPress={() => { setEmpForm({ name: "", pin: "", role: "cashier", email: "", phone: "" }); setShowEmployeeForm(true); }}>
                  <Ionicons name="add-circle" size={28} color={Colors.accent} />
                </Pressable>
                <Pressable onPress={() => setShowEmployees(false)}><Ionicons name="close" size={24} color={Colors.text} /></Pressable>
              </View>
            </View>
            <FlatList
              data={employees}
              keyExtractor={(item: any) => String(item.id)}
              scrollEnabled={!!employees.length}
              renderItem={({ item }: { item: any }) => (
                <View style={styles.empCard}>
                  <View style={[styles.empAvatar, { backgroundColor: (roleColors[item.role] || Colors.info) + "30" }]}>
                    <Text style={styles.empInitial}>{item.name.charAt(0)}</Text>
                  </View>
                  <View style={styles.empInfo}>
                    <Text style={styles.empName}>{item.name}</Text>
                    <Text style={styles.empMeta}>PIN: {item.pin} | {item.email || "No email"}</Text>
                  </View>
                  <View style={[styles.roleBadge, { backgroundColor: (roleColors[item.role] || Colors.info) + "20" }]}>
                    <Text style={[styles.roleText, { color: roleColors[item.role] || Colors.info }]}>{item.role}</Text>
                  </View>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* New Employee Form */}
      <Modal visible={showEmployeeForm} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Employee</Text>
              <Pressable onPress={() => setShowEmployeeForm(false)}><Ionicons name="close" size={24} color={Colors.text} /></Pressable>
            </View>
            <ScrollView>
              <Text style={styles.label}>Name *</Text>
              <TextInput style={styles.input} value={empForm.name} onChangeText={(t) => setEmpForm({ ...empForm, name: t })} placeholderTextColor={Colors.textMuted} placeholder="Employee name" />
              <Text style={styles.label}>PIN *</Text>
              <TextInput style={styles.input} value={empForm.pin} onChangeText={(t) => setEmpForm({ ...empForm, pin: t })} keyboardType="number-pad" placeholderTextColor={Colors.textMuted} placeholder="4-digit PIN" maxLength={4} />
              <Text style={styles.label}>Role</Text>
              <View style={styles.roleRow}>
                {["cashier", "manager", "admin", "owner"].map((r) => (
                  <Pressable key={r} style={[styles.roleChip, empForm.role === r && { backgroundColor: Colors.accent }]} onPress={() => setEmpForm({ ...empForm, role: r })}>
                    <Text style={[styles.roleChipText, empForm.role === r && { color: Colors.textDark }]}>{r}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.label}>Email</Text>
              <TextInput style={styles.input} value={empForm.email} onChangeText={(t) => setEmpForm({ ...empForm, email: t })} placeholderTextColor={Colors.textMuted} placeholder="email@example.com" autoCapitalize="none" />
              <Pressable style={styles.saveBtn} onPress={() => {
                if (!empForm.name || !empForm.pin) return Alert.alert("Error", "Name and PIN required");
                createEmpMutation.mutate({ name: empForm.name, pin: empForm.pin, role: empForm.role, email: empForm.email || undefined, branchId: 1, permissions: empForm.role === "admin" ? ["all"] : ["pos"] });
              }}>
                <LinearGradient colors={[Colors.accent, Colors.gradientMid]} style={styles.saveBtnGradient}>
                  <Text style={styles.saveBtnText}>Create Employee</Text>
                </LinearGradient>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Suppliers Modal */}
      <Modal visible={showSuppliers} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Suppliers</Text>
              <View style={styles.modalActions}>
                <Pressable onPress={() => { setSupForm({ name: "", contactName: "", email: "", phone: "", paymentTerms: "" }); setShowSupplierForm(true); }}>
                  <Ionicons name="add-circle" size={28} color={Colors.accent} />
                </Pressable>
                <Pressable onPress={() => setShowSuppliers(false)}><Ionicons name="close" size={24} color={Colors.text} /></Pressable>
              </View>
            </View>
            <FlatList
              data={suppliers}
              keyExtractor={(item: any) => String(item.id)}
              scrollEnabled={!!suppliers.length}
              renderItem={({ item }: { item: any }) => (
                <View style={styles.empCard}>
                  <View style={[styles.empAvatar, { backgroundColor: Colors.success + "30" }]}>
                    <Ionicons name="cube" size={20} color={Colors.success} />
                  </View>
                  <View style={styles.empInfo}>
                    <Text style={styles.empName}>{item.name}</Text>
                    <Text style={styles.empMeta}>{item.contactName || "No contact"} | {item.phone || "No phone"}</Text>
                  </View>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* New Supplier Form */}
      <Modal visible={showSupplierForm} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Supplier</Text>
              <Pressable onPress={() => setShowSupplierForm(false)}><Ionicons name="close" size={24} color={Colors.text} /></Pressable>
            </View>
            <ScrollView>
              <Text style={styles.label}>Company Name *</Text>
              <TextInput style={styles.input} value={supForm.name} onChangeText={(t) => setSupForm({ ...supForm, name: t })} placeholderTextColor={Colors.textMuted} placeholder="Supplier name" />
              <Text style={styles.label}>Contact Person</Text>
              <TextInput style={styles.input} value={supForm.contactName} onChangeText={(t) => setSupForm({ ...supForm, contactName: t })} placeholderTextColor={Colors.textMuted} placeholder="Contact name" />
              <Text style={styles.label}>Phone</Text>
              <TextInput style={styles.input} value={supForm.phone} onChangeText={(t) => setSupForm({ ...supForm, phone: t })} keyboardType="phone-pad" placeholderTextColor={Colors.textMuted} placeholder="+1234567890" />
              <Text style={styles.label}>Email</Text>
              <TextInput style={styles.input} value={supForm.email} onChangeText={(t) => setSupForm({ ...supForm, email: t })} placeholderTextColor={Colors.textMuted} placeholder="email@example.com" autoCapitalize="none" />
              <Pressable style={styles.saveBtn} onPress={() => {
                if (!supForm.name) return Alert.alert("Error", "Company name required");
                createSupMutation.mutate({ name: supForm.name, contactName: supForm.contactName || undefined, phone: supForm.phone || undefined, email: supForm.email || undefined, paymentTerms: supForm.paymentTerms || undefined });
              }}>
                <LinearGradient colors={[Colors.accent, Colors.gradientMid]} style={styles.saveBtnGradient}>
                  <Text style={styles.saveBtnText}>Create Supplier</Text>
                </LinearGradient>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Branches Modal */}
      <Modal visible={showBranches} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Branches</Text>
              <Pressable onPress={() => setShowBranches(false)}><Ionicons name="close" size={24} color={Colors.text} /></Pressable>
            </View>
            <FlatList
              data={branches}
              keyExtractor={(item: any) => String(item.id)}
              scrollEnabled={!!branches.length}
              renderItem={({ item }: { item: any }) => (
                <View style={styles.empCard}>
                  <View style={[styles.empAvatar, { backgroundColor: Colors.secondary + "30" }]}>
                    <Ionicons name="business" size={20} color={Colors.secondary} />
                  </View>
                  <View style={styles.empInfo}>
                    <Text style={styles.empName}>{item.name}</Text>
                    <Text style={styles.empMeta}>{item.address || "No address"} | {item.currency || "USD"}</Text>
                  </View>
                  {item.isMain && (
                    <View style={[styles.roleBadge, { backgroundColor: Colors.accent + "20" }]}>
                      <Text style={[styles.roleText, { color: Colors.accent }]}>Main</Text>
                    </View>
                  )}
                </View>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 16, paddingVertical: 14 },
  headerTitle: { fontSize: 22, fontWeight: "800", color: Colors.white },
  content: { paddingHorizontal: 12 },
  profileCard: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.cardBorder },
  profileAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.accent, justifyContent: "center", alignItems: "center", marginRight: 14 },
  profileInitial: { color: Colors.textDark, fontSize: 22, fontWeight: "800" },
  profileInfo: { flex: 1 },
  profileName: { color: Colors.text, fontSize: 18, fontWeight: "700" },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, alignSelf: "flex-start", marginTop: 4 },
  roleText: { fontSize: 12, fontWeight: "700", textTransform: "capitalize" as const },
  sectionTitle: { color: Colors.textSecondary, fontSize: 13, fontWeight: "600", marginTop: 16, marginBottom: 8, textTransform: "uppercase" as const, letterSpacing: 1 },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: Colors.surface, borderRadius: 14, padding: 16, marginTop: 20, borderWidth: 1, borderColor: Colors.danger + "30" },
  logoutText: { color: Colors.danger, fontSize: 16, fontWeight: "600" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: Colors.surface, borderRadius: 20, padding: 24, width: "92%", maxWidth: 500, maxHeight: "85%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { color: Colors.text, fontSize: 20, fontWeight: "700" },
  modalActions: { flexDirection: "row", alignItems: "center", gap: 12 },
  empCard: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.surfaceLight, borderRadius: 12, padding: 12, marginBottom: 8 },
  empAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center", marginRight: 12 },
  empInitial: { color: Colors.text, fontSize: 16, fontWeight: "700" },
  empInfo: { flex: 1 },
  empName: { color: Colors.text, fontSize: 14, fontWeight: "600" },
  empMeta: { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
  label: { color: Colors.textSecondary, fontSize: 12, fontWeight: "600", marginBottom: 6, marginTop: 12, textTransform: "uppercase" as const, letterSpacing: 0.5 },
  input: { backgroundColor: Colors.inputBg, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: Colors.text, fontSize: 15, borderWidth: 1, borderColor: Colors.inputBorder },
  roleRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  roleChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.surfaceLight },
  roleChipText: { color: Colors.textSecondary, fontSize: 13, fontWeight: "600", textTransform: "capitalize" as const },
  saveBtn: { borderRadius: 14, overflow: "hidden", marginTop: 20, marginBottom: 16 },
  saveBtnGradient: { paddingVertical: 14, alignItems: "center" },
  saveBtnText: { color: Colors.white, fontSize: 16, fontWeight: "700" },
});
