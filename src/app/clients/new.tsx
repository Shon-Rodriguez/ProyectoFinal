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
import { DocType } from "../../types";

export default function NewClientScreen() {
  const router = useRouter();

  // estados de los campos de texto
  const [name, setName] = useState("");
  const [docType, setDocType] = useState<DocType>("RUC");
  const [docId, setDocId] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !docId.trim() || !phone.trim()) {
      alert(
        "Por favor completa los campos obligatorios (Nombre, Documento y Teléfono).",
      );
      return;
    }

    try {
      setSaving(true);
      const db = await getDB();
      await db.runAsync(
        "INSERT INTO clients (name, doc_type, doc_id, phone, email, address) VALUES (?, ?, ?, ?, ?, ?);",
        [
          name.trim(),
          docType,
          docId.trim(),
          phone.trim(),
          email.trim() || null,
          address.trim() || null,
        ],
      );
      router.back();
    } catch (error) {
      console.log("Error al guardar cliente:", error);
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
          <Text style={styles.headerTitle}>Nuevo Cliente</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Formulario */}
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Tipo de Documento */}
          <Text style={styles.label}>Tipo de Documento</Text>
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[
                styles.typeOption,
                docType === "RUC" && styles.typeOptionActive,
              ]}
              onPress={() => setDocType("RUC")}
            >
              <Text
                style={[
                  styles.typeOptionText,
                  docType === "RUC" && styles.typeOptionTextActive,
                ]}
              >
                RUC (Empresa)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeOption,
                docType === "DNI" && styles.typeOptionActive,
              ]}
              onPress={() => setDocType("DNI")}
            >
              <Text
                style={[
                  styles.typeOptionText,
                  docType === "DNI" && styles.typeOptionTextActive,
                ]}
              >
                DNI (Persona)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Nombre / Razón Social */}
          <Text style={styles.label}>Nombre o Razón Social </Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. Empresa Demo SAC"
            placeholderTextColor="#94A3B8"
            value={name}
            onChangeText={setName}
          />

          {/* Número de Documento */}
          <Text style={styles.label}>
            {docType === "RUC" ? "Número de RUC " : "Número de DNI "}
          </Text>
          <TextInput
            style={styles.input}
            placeholder={docType === "RUC" ? "10203040506" : "12345678"}
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            value={docId}
            onChangeText={setDocId}
          />

          {/* Teléfono */}
          <Text style={styles.label}>Teléfono</Text>
          <TextInput
            style={styles.input}
            placeholder="+51 987 654 321"
            placeholderTextColor="#94A3B8"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          {/* Correo Electrónico */}
          <Text style={styles.label}>Correo Electrónico (Opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder="contacto@empresa.com"
            placeholderTextColor="#94A3B8"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          {/* Dirección */}
          <Text style={styles.label}>Dirección (Opcional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Av. Principal 123, Lima, Perú"
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={3}
            value={address}
            onChangeText={setAddress}
          />

          {/* Botón Guardar */}
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Ionicons name="checkmark-outline" size={20} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>
              {saving ? "Guardando..." : "Guardar Cliente"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
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
  typeOptionActive: {
    backgroundColor: "#FFFFFF",
  },
  typeOptionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  typeOptionTextActive: {
    color: "#2563EB",
  },
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
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
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
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
