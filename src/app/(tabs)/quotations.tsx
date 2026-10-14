import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getDB } from "../../db/database";
import { Quotation } from "../../types";
import { handleGeneratePDF } from "../../utils/pdfGenerator";

export default function QuotationsScreen() {
  const router = useRouter();
  // estado de los campos de texto
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  // carga los datos al entrar al tab
  useFocusEffect(
    useCallback(() => {
      loadQuotations();
    }, []),
  );
  // carga los daltos del sql
  const loadQuotations = async () => {
    try {
      setLoading(true);
      const db = await getDB();
      const result = await db.getAllAsync<Quotation>(
        `SELECT 
           q.id, 
           q.code,
           q.client_id, 
           q.date, 
           q.subtotal, 
           q.tax, 
           q.total, 
           q.notes, 
           q.created_at, 
           c.name AS client_name, 
           c.doc_id AS client_document
         FROM quotations q
         JOIN clients c ON q.client_id = c.id
         ORDER BY q.id DESC;`,
      );
      setQuotations(result || []);
    } catch (error) {
      console.log("Error al cargar los presupuestos:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredQuotations = quotations.filter((item) => {
    const matchesSearch =
      item.client_name &&
      item.client_name.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  const handleDelete = async (id?: number) => {
    if (!id) return;
    try {
      const db = await getDB();
      await db.runAsync("DELETE FROM quotations WHERE id = ?;", [id]);
      loadQuotations(); //actualiza
    } catch (error) {
      console.log("Error al eliminar el presupuesto:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Encabezado */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Presupuestos</Text>
        <Text style={styles.headerSubtitle}>
          Historial de cotizaciones emitidas
        </Text>
      </View>

      {/* Buscador */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search-outline"
          size={18}
          color="#64748B"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por Cliente..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Botón: Registrar nuevo presupuesto */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => router.push("/quotations/new")}
          activeOpacity={0.7}
        >
          <View style={styles.registerButtonLeft}>
            <View style={styles.iconBadge}>
              <Ionicons
                name="document-text-outline"
                size={18}
                color="#2563EB"
              />
            </View>
            <Text style={styles.registerButtonText}>
              + Registrar nuevo presupuesto
            </Text>
          </View>
          <Ionicons name="arrow-forward-outline" size={18} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* Lista */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : filteredQuotations.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="receipt-outline" size={48} color="#94A3B8" />
          <Text style={styles.emptyText}>No hay presupuestos registrados</Text>
        </View>
      ) : (
        <FlatList
          data={filteredQuotations}
          keyExtractor={(item) =>
            item.id?.toString() || Math.random().toString()
          }
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.titlePriceRow}>
                  <View style={styles.codeRow}>
                    <Text style={styles.codeText}>{item.code}</Text>
                  </View>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.client_name || "Cliente general"}
                  </Text>
                  <Text style={styles.itemPrice}>
                    S/ {item.total.toFixed(2)}
                  </Text>
                </View>

                {/* Botones de acción (PDF y Eliminar) */}
                <View
                  style={{ flexDirection: "row", gap: 8, alignItems: "center" }}
                >
                  <TouchableOpacity
                    style={styles.pdfButton}
                    onPress={() => handleGeneratePDF(item.id!)}
                  >
                    <Ionicons
                      name="document-text-outline"
                      size={18}
                      color="#2563EB"
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(item.id)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.dateText}>Fecha: {item.date}</Text>
              </View>

              {item.notes ? (
                <Text style={styles.itemDescription} numberOfLines={2}>
                  {item.notes}
                </Text>
              ) : null}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#1E293B" },
  headerSubtitle: { fontSize: 12, color: "#64748B", marginTop: 2 },
  searchContainer: {
    marginHorizontal: 16,
    marginTop: 14,
    justifyContent: "center",
  },
  searchIcon: { position: "absolute", left: 12, zIndex: 1 },
  searchInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingLeft: 38,
    paddingRight: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#1E293B",
  },
  actionContainer: { paddingHorizontal: 16, marginVertical: 12 },
  registerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FAFCFF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderStyle: "dashed",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  registerButtonLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBadge: { backgroundColor: "#EFF6FF", padding: 8, borderRadius: 10 },
  registerButtonText: { fontSize: 14, fontWeight: "600", color: "#1D4ED8" },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 14, color: "#64748B", marginTop: 8 },
  listContent: { paddingHorizontal: 16, paddingBottom: 20 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  titlePriceRow: { flex: 1, marginRight: 8 },
  codeRow: { marginBottom: 2 },
  codeText: { fontSize: 11, fontWeight: "700", color: "#2563EB" },
  itemName: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  itemPrice: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2563EB",
    marginTop: 2,
  },
  deleteButton: { padding: 2 },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  dateText: { fontSize: 12, color: "#64748B" },
  itemDescription: { fontSize: 13, color: "#475569", marginTop: 4 },
  pdfButton: {
    backgroundColor: "#EFF6FF",
    padding: 6,
    borderRadius: 8,
  },
});
