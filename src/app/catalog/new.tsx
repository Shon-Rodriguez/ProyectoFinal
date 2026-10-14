import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getDB } from "../../db/database";
import { ItemType } from "../../types";

export default function NewCatalogItemScreen() {
  const router = useRouter();

  // estados de los campos de texto
  const [name, setName] = useState("");
  const [type, setType] = useState<ItemType>("PRODUCTO");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !price.trim()) {
      alert("Por favor completa los campos obligatorios (Nombre y Precio).");
      return;
    }
    const cleanedPrice = price.trim().replace(/,/g, ""); // g = para que busque de forma global y no se quede en la primera ","
    const numericPrice = Number(cleanedPrice); // convierte el texto a un numero

    if (isNaN(numericPrice) || numericPrice < 0) {
      //cuando se escriba letras o numeros negativos
      alert("Por favor ingresa un precio unitario válido (mayor o igual a 0).");
      return;
    }

    try {
      setSaving(true);
      const db = await getDB();
      await db.runAsync(
        "INSERT INTO catalog (name, description, price, type) VALUES (?, ?, ?, ?);",
        [name.trim(), description.trim() || null, numericPrice, type],
      );
      router.back();
    } catch (error) {
      console.log("Error al guardar ítem en el catálogo:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        {/* Encabezado */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back-outline" size={22} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nuevo Ítem</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Formulario */}
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Tipo de Ítem */}
          <Text style={styles.label}>Tipo de Ítem</Text>
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[
                styles.typeOption,
                type === "PRODUCTO" && styles.typeOptionActive,
              ]}
              onPress={() => setType("PRODUCTO")}
            >
              <Text
                style={[
                  styles.typeOptionText,
                  type === "PRODUCTO" && styles.typeOptionTextActive,
                ]}
              >
                Producto
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeOption,
                type === "SERVICIO" && styles.typeOptionActive,
              ]}
              onPress={() => setType("SERVICIO")}
            >
              <Text
                style={[
                  styles.typeOptionText,
                  type === "SERVICIO" && styles.typeOptionTextActive,
                ]}
              >
                Servicio
              </Text>
            </TouchableOpacity>
          </View>

          {/* Nombre */}
          <Text style={styles.label}>Nombre del producto o servicio</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. Consultoría técnica / Licencia software"
            placeholderTextColor="#94A3B8"
            value={name}
            onChangeText={setName}
          />

          {/* Precio (Soles) */}
          <Text style={styles.label}>Precio Unitario (S/)</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor="#94A3B8"
            keyboardType="decimal-pad"
            value={price}
            onChangeText={setPrice}
          />

          {/* Descripción */}
          <Text style={styles.label}>Descripción (Opcional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Detalles, alcance o características del ítem..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={3}
            value={description}
            onChangeText={setDescription}
          />

          {/* Botón Guardar */}
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Ionicons name="checkmark-outline" size={20} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>
              {saving ? "Guardando..." : "Guardar Ítem"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1E293B" },
  scrollContent: { padding: 20, paddingBottom: 40 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 6,
    marginTop: 12,
  },
  typeSelector: {
    flexDirection: "row",
    backgroundColor: "#E2E8F0",
    borderRadius: 10,
    padding: 3,
    marginBottom: 4,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  typeOptionActive: { backgroundColor: "#FFFFFF" },
  typeOptionText: { fontSize: 13, fontWeight: "600", color: "#64748B" },
  typeOptionTextActive: { color: "#2563EB" },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: "#1E293B",
  },
  textArea: { height: 80, textAlignVertical: "top" },
  saveButton: {
    flexDirection: "row",
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 28,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
});
