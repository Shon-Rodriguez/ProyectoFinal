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
import { CatalogItem } from "../../types";

export default function CatalogScreen() {
  const router = useRouter();
  // estado de los campos de texto
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // carga los datos al entrar al tab
  useFocusEffect(
    useCallback(() => {
      loadCatalog();
    }, []),
  );

  // carga los daltos del sql
  const loadCatalog = async () => {
    try {
      setLoading(true);
      const db = await getDB();
      const result = await db.getAllAsync<CatalogItem>(
        "SELECT id, name, description, price, type, created_at FROM catalog ORDER BY id DESC;",
      );
      setItems(result || []);
    } catch (error) {
      console.log("Error al cargar el catálogo:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleDelete = async (id?: number) => {
    if (!id) return;
    try {
      const db = await getDB();
      await db.runAsync("DELETE FROM catalog WHERE id = ?;", [id]);
      loadCatalog(); //actualiza
    } catch (error) {
      console.log("Error al eliminar ítem del catálogo:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Encabezado */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Catálogo</Text>
        <Text style={styles.headerSubtitle}>
          Gestión de productos y servicios para cotizaciones
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
          placeholder="Buscar por nombre..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Botón: Registrar nuevo */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => router.push("/catalog/new")}
          activeOpacity={0.7}
        >
          <View style={styles.registerButtonLeft}>
            <View style={styles.iconBadge}>
              <Ionicons name="add-circle-outline" size={18} color="#2563EB" />
            </View>
            <Text style={styles.registerButtonText}>
              + Registrar nuevo ítem
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
      ) : filteredItems.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="cube-outline" size={48} color="#94A3B8" />
          <Text style={styles.emptyText}>No hay elementos en el catálogo</Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) =>
            item.id?.toString() || Math.random().toString()
          }
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.titlePriceRow}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.itemPrice}>
                    S/ {item.price.toFixed(2)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(item.id)}
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>

              <View style={styles.metaRow}>
                <View
                  style={[
                    styles.badge,
                    item.type === "SERVICIO"
                      ? styles.badgeService
                      : styles.badgeProduct,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      item.type === "SERVICIO"
                        ? styles.badgeTextService
                        : styles.badgeTextProduct,
                    ]}
                  >
                    {item.type}
                  </Text>
                </View>
              </View>

              {item.description ? (
                <Text style={styles.itemDescription} numberOfLines={2}>
                  {item.description}
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
  itemName: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  itemPrice: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2563EB",
    marginTop: 2,
  },
  deleteButton: { padding: 2 },
  metaRow: { flexDirection: "row", marginBottom: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeProduct: { backgroundColor: "#EEF2FF" },
  badgeService: { backgroundColor: "#F0FDF4" },
  badgeText: { fontSize: 10, fontWeight: "700" },
  badgeTextProduct: { color: "#3B82F6" },
  badgeTextService: { color: "#16A34A" },
  itemDescription: { fontSize: 13, color: "#475569", marginTop: 4 },
});
