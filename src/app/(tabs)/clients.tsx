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
import { Client } from "../../types";

export default function ClientsScreen() {
  const router = useRouter();

  // estado de los campos de texto
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // carga los datos al entrar al tab
  useFocusEffect(
    useCallback(() => {
      loadClients();
    }, []),
  );

  // carga los daltos del sql
  const loadClients = async () => {
    try {
      setLoading(true);
      const db = await getDB();
      const result = await db.getAllAsync<Client>(
        "SELECT id, name, doc_type, doc_id, phone, email, address, created_at FROM clients ORDER BY id DESC;",
      );
      setClients(result || []);
    } catch (error) {
      console.log("Error al cargar clientes:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.doc_id.includes(searchQuery),
  );

  const handleDelete = async (id?: number) => {
    if (!id) return;
    try {
      const db = await getDB();
      await db.runAsync("DELETE FROM clients WHERE id = ?;", [id]);
      loadClients(); //actualiza
    } catch (error) {
      console.log("Error al eliminar cliente:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Encabezado sin View innecesario */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Clientes</Text>
        <Text style={styles.headerSubtitle}>
          Gestión de clientes y empresas
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
          placeholder="Buscar por nombre, RUC o DNI..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Botón: Registrar nuevo cliente */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => router.push("/clients/new")}
          activeOpacity={0.7}
        >
          <View style={styles.registerButtonLeft}>
            <View style={styles.iconBadge}>
              <Ionicons name="person-add-outline" size={18} color="#2563EB" />
            </View>
            <Text style={styles.registerButtonText}>
              + Registrar nuevo cliente
            </Text>
          </View>

          <Ionicons name="arrow-forward-outline" size={18} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* Lista de Clientes */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : filteredClients.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="people-outline" size={48} color="#94A3B8" />
          <Text style={styles.emptyText}>No hay clientes registrados</Text>
        </View>
      ) : (
        <FlatList
          data={filteredClients}
          keyExtractor={(item) =>
            item.id?.toString() || Math.random().toString()
          }
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.clientCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.clientName}>{item.name}</Text>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(item.id)}
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>

              <View style={styles.taxStyle}>
                <View style={styles.badge}>
                  <Text style={styles.taxTypeText}>{item.doc_type}</Text>
                </View>
                <Text style={styles.taxIdText}>{item.doc_id}</Text>
              </View>

              {item.phone ? (
                <View style={styles.detailStyle}>
                  <Ionicons name="call-outline" size={15} color="#64748B" />
                  <Text style={styles.detailText}>{item.phone}</Text>
                </View>
              ) : null}

              {item.address ? (
                <View style={styles.detailStyle}>
                  <Ionicons name="location-outline" size={15} color="#64748B" />
                  <Text style={styles.detailText}>{item.address}</Text>
                </View>
              ) : null}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  searchContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    justifyContent: "center",
  },
  searchIcon: {
    position: "absolute",
    left: 12,
    zIndex: 1,
  },
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
  actionContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
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
  registerButtonLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBadge: {
    backgroundColor: "#EFF6FF",
    padding: 8,
    borderRadius: 10,
  },
  registerButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1D4ED8",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  clientCard: {
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
    alignItems: "center",
    marginBottom: 6,
  },
  clientName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
    flex: 1,
    marginRight: 8,
  },
  deleteButton: {
    padding: 2,
  },
  taxStyle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  badge: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  taxTypeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#3B82F6",
  },
  taxIdText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#334155",
  },
  detailStyle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  detailText: {
    fontSize: 13,
    color: "#475569",
  },
});
