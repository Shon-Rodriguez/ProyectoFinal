import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getDB } from "../../db/database";
import { CatalogItem, Client, QuotationDetail } from "../../types";

interface SelectedItem extends QuotationDetail {
  catalog_name: string;
}

export default function NewQuotationScreen() {
  const router = useRouter();

  // estados de los campos de texto
  const [code, setCode] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [items, setItems] = useState<SelectedItem[]>([]);

  const [clients, setClients] = useState<Client[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);

  const [clientModalVisible, setClientModalVisible] = useState(false);
  const [catalogModalVisible, setCatalogModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // cargar fecha actual y datos iniciales
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setDate(today);
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const db = await getDB();

      // obtener clientes
      const clientsResult = await db.getAllAsync<Client>(
        "SELECT * FROM clients ORDER BY name ASC;",
      );
      setClients(clientsResult || []);

      // obtener catalogo
      const catalogResult = await db.getAllAsync<CatalogItem>(
        "SELECT * FROM catalog ORDER BY name ASC;",
      );
      setCatalog(catalogResult || []);

      // generar codigo al pdf como COT-0001, COT-0002
      const countResult = await db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM quotations;",
      );
      const nextNum = (countResult?.count || 0) + 1;
      const generatedCode = `COT-${nextNum.toString().padStart(4, "0")}`;
      setCode(generatedCode);
    } catch (error) {
      console.log("Error al cargar datos iniciales:", error);
    } finally {
      setLoading(false);
    }
  };

  // agregar un producto/servicio del catalogo a la lista
  const addItemToQuotation = (catalogItem: CatalogItem) => {
    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex(
        (i) => i.catalog_id === catalogItem.id, //compara el id seleccionado y verifica si se repite
      );

      if (existingIndex > -1) {
        // si ya está agregado incrementamos la cantidad
        const updated = [...prevItems];
        const newQty = updated[existingIndex].quantity + 1;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          subtotal_line: newQty * updated[existingIndex].unit_price, //calcula el subtotal multiplicando la nueva cantidad por precio unitario
        };
        return updated;
      } else {
        // si el item es nuevo lo agregamos
        return [
          ...prevItems,
          {
            catalog_id: catalogItem.id!,
            catalog_name: catalogItem.name,
            quantity: 1,
            unit_price: catalogItem.price,
            subtotal_line: catalogItem.price,
          },
        ];
      }
    });
    setCatalogModalVisible(false);
  };

  // Cambiar cantidad de un ítem
  const updateQuantity = (index: number, change: number) => {
    setItems((prevItems) => {
      const updated = [...prevItems];
      const item = updated[index];
      const newQty = item.quantity + change;

      //elimina el producto de la lista
      if (newQty <= 0) {
        return prevItems.filter((_, i) => i !== index);
      }

      updated[index] = {
        ...item,
        quantity: newQty,
        subtotal_line: newQty * item.unit_price,
      };
      return updated;
    });
  };

  // Eliminar un ítem
  const removeItem = (index: number) => {
    setItems((prevItems) => prevItems.filter((_, i) => i !== index));
  };

  // Totales
  const subtotal = items.reduce((sum, item) => sum + item.subtotal_line, 0); //toma el total acumalo en sum y suma el subtotal_line
  const tax = subtotal * 0.18; // IGV 18%
  const total = subtotal + tax;

  // Guardar Presupuesto
  const handleSave = async () => {
    if (!selectedClient) {
      Alert.alert("Atención", "Por favor selecciona un cliente.");
      return;
    }

    if (items.length === 0) {
      Alert.alert("Atención", "Debes agregar al menos un ítem al presupuesto.");
      return;
    }

    try {
      setSaving(true);
      const db = await getDB();

      // Iniciar guardado de la cabecera
      const result = await db.runAsync(
        `INSERT INTO quotations (code, client_id, date, subtotal, tax, total, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [code, selectedClient.id!, date, subtotal, tax, total, notes || null],
      );

      const quotationId = result.lastInsertRowId;

      // Guardar cada detalle
      for (const item of items) {
        await db.runAsync(
          `INSERT INTO quotation_details (quotation_id, catalog_id, quantity, unit_price, subtotal_line)
           VALUES (?, ?, ?, ?, ?);`,
          [
            quotationId,
            item.catalog_id,
            item.quantity,
            item.unit_price,
            item.subtotal_line,
          ],
        );
      }

      Alert.alert("Éxito", "Presupuesto registrado correctamente", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.log("Error al guardar presupuesto:", error);
      Alert.alert("Error", "No se pudo guardar el presupuesto.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nuevo Presupuesto</Text>
        <Text style={styles.codeBadge}>{code}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Selección de Cliente */}
        <View style={styles.section}>
          <Text style={styles.label}>Cliente *</Text>
          <TouchableOpacity
            style={styles.selectorButton}
            onPress={() => setClientModalVisible(true)}
          >
            <Text
              style={
                selectedClient ? styles.selectorText : styles.placeholderText
              }
            >
              {selectedClient ? selectedClient.name : "Seleccionar un cliente"}
            </Text>
            <Ionicons name="chevron-down-outline" size={20} color="#64748B" />
          </TouchableOpacity>
          {selectedClient && (
            <Text style={styles.clientDetail}>
              {selectedClient.doc_type}: {selectedClient.doc_id}
            </Text>
          )}
        </View>

        {/* Fecha y Notas */}
        <View style={styles.row}>
          <View style={[styles.section, { flex: 1 }]}>
            <Text style={styles.label}>Fecha</Text>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
            />
          </View>
        </View>

        {/* Sección de Ítems */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.label}>Ítems del Presupuesto *</Text>
            <TouchableOpacity
              style={styles.addItemButton}
              onPress={() => setCatalogModalVisible(true)}
            >
              <Ionicons name="add-circle-outline" size={18} color="#2563EB" />
              <Text style={styles.addItemButtonText}>Agregar Ítem</Text>
            </TouchableOpacity>
          </View>

          {items.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No has agregado ítems aún</Text>
            </View>
          ) : (
            items.map((item, index) => (
              <View key={index} style={styles.itemCard}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.catalog_name}</Text>
                  <Text style={styles.itemPrice}>
                    S/ {item.unit_price.toFixed(2)} x {item.quantity} = S/{" "}
                    {item.subtotal_line.toFixed(2)}
                  </Text>
                </View>

                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    style={styles.qtyButton}
                    onPress={() => updateQuantity(index, -1)}
                  >
                    <Ionicons name="remove-outline" size={16} color="#475569" />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.qtyButton}
                    onPress={() => updateQuantity(index, 1)}
                  >
                    <Ionicons name="add-outline" size={16} color="#475569" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeItem(index)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Observaciones */}
        <View style={styles.section}>
          <Text style={styles.label}>Observaciones / Notas</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Ej. Tiempo de entrega, condiciones de pago..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={3}
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        {/* Resumen de Totales */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal:</Text>
            <Text style={styles.summaryValue}>S/ {subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>IGV (18%):</Text>
            <Text style={styles.summaryValue}>S/ {tax.toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>S/ {total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Botón Guardar */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.disabledButton]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Guardar Presupuesto</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Seleccionar Cliente */}
      <Modal visible={clientModalVisible} animationType="slide" transparent>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar Cliente</Text>
            <TouchableOpacity onPress={() => setClientModalVisible(false)}>
              <Ionicons name="close-outline" size={26} color="#1E293B" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={clients}
            keyExtractor={(item) => item.id!.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  setSelectedClient(item);
                  setClientModalVisible(false);
                }}
              >
                <Text style={styles.modalItemTitle}>{item.name}</Text>
                <Text style={styles.modalItemSub}>
                  {item.doc_type}: {item.doc_id}
                </Text>
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>

      {/* Seleccionar Ítem del Catálogo */}
      <Modal visible={catalogModalVisible} animationType="slide" transparent>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Agregar del Catálogo</Text>
            <TouchableOpacity onPress={() => setCatalogModalVisible(false)}>
              <Ionicons name="close-outline" size={26} color="#1E293B" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={catalog}
            keyExtractor={(item) => item.id!.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => addItemToQuotation(item)}
              >
                <View style={styles.modalItemRow}>
                  <Text style={styles.modalItemTitle}>{item.name}</Text>
                  <Text style={styles.modalItemPrice}>
                    S/ {item.price.toFixed(2)}
                  </Text>
                </View>
                {item.description ? (
                  <Text style={styles.modalItemSub}>{item.description}</Text>
                ) : null}
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1E293B" },
  codeBadge: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2563EB",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  scrollContent: { padding: 16 },
  section: { marginBottom: 16 },
  row: { flexDirection: "row", gap: 12 },
  label: { fontSize: 13, fontWeight: "600", color: "#475569", marginBottom: 6 },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#1E293B",
  },
  textArea: { height: 80, textAlignVertical: "top" },
  selectorButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  selectorText: { fontSize: 14, color: "#1E293B", fontWeight: "500" },
  placeholderText: { fontSize: 14, color: "#94A3B8" },
  clientDetail: { fontSize: 12, color: "#64748B", marginTop: 4, marginLeft: 4 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  addItemButton: { flexDirection: "row", alignItems: "center", gap: 4 },
  addItemButtonText: { fontSize: 13, fontWeight: "600", color: "#2563EB" },
  emptyBox: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },
  emptyText: { fontSize: 13, color: "#94A3B8" },
  itemCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  itemInfo: { flex: 1, marginRight: 8 },
  itemName: { fontSize: 14, fontWeight: "600", color: "#1E293B" },
  itemPrice: { fontSize: 12, color: "#64748B", marginTop: 2 },
  quantityControls: { flexDirection: "row", alignItems: "center", gap: 8 },
  qtyButton: {
    backgroundColor: "#F1F5F9",
    padding: 6,
    borderRadius: 6,
  },
  qtyText: { fontSize: 14, fontWeight: "600", color: "#1E293B" },
  removeButton: { marginLeft: 4, padding: 4 },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: { fontSize: 14, color: "#64748B" },
  summaryValue: { fontSize: 14, fontWeight: "600", color: "#1E293B" },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 8,
    marginTop: 4,
    marginBottom: 0,
  },
  totalLabel: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  totalValue: { fontSize: 18, fontWeight: "700", color: "#2563EB" },
  saveButton: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 30,
  },
  disabledButton: { opacity: 0.7 },
  saveButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },

  /* Modal styles */
  modalContainer: { flex: 1, backgroundColor: "#FFFFFF" },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#1E293B" },
  modalItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalItemRow: { flexDirection: "row", justifyContent: "space-between" },
  modalItemTitle: { fontSize: 15, fontWeight: "600", color: "#1E293B" },
  modalItemPrice: { fontSize: 15, fontWeight: "700", color: "#2563EB" },
  modalItemSub: { fontSize: 13, color: "#64748B", marginTop: 2 },
});
