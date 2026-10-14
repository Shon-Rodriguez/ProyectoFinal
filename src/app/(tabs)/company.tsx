// 1. IMPORTACIONES BÁSICAS
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";

import { getDB } from "../../db/database";
import { CompanySettings } from "../../types/index";

export default function CompanyScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companyId, setCompanyId] = useState<number | null>(null);

  // estado de los campos de texto
  const [name, setName] = useState("");
  const [docId, setDocId] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [logo, setLogo] = useState<string | null>(null);
  const [currency, setCurrency] = useState("PEN");

  // carga los datos al entrar al tab
  useEffect(() => {
    loadCompanyData();
  }, []);

  // carga los daltos del sql
  const loadCompanyData = async () => {
    try {
      const db = await getDB();
      const result = await db.getFirstAsync<CompanySettings>(
        "SELECT * FROM company_settings LIMIT 1;",
      );

      // si encuentra datos guardados, actualiza los campos
      if (result) {
        setCompanyId(result.id ?? null);
        setName(result.name || "");
        setDocId(result.doc_id || "");
        setPhone(result.phone || "");
        setEmail(result.email || "");
        setAddress(result.address || "");
        setLogo(result.logo || null);
        setCurrency(result.currency || "PEN");
      }
    } catch (error) {
      console.log("Error al cargar datos:", error);
    } finally {
      setLoading(false);
    }
  };

  // funcion para abrir la galeria y selecionar el logo
  const handlePickLogo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      setLogo(result.assets[0].uri);
    }
  };

  // quitar el logo
  const handleRemoveLogo = () => {
    setLogo(null);
  };

  // guardar datos en la base de datos
  const handleSave = async () => {
    try {
      setSaving(true);
      const db = await getDB();

      if (companyId) {
        await db.runAsync(
          `UPDATE company_settings 
           SET name = ?, doc_id = ?, phone = ?, email = ?, address = ?, logo = ?, currency = ? 
           WHERE id = ?;`,
          [name, docId, phone, email, address, logo, currency, companyId],
        );
      } else {
        const insertResult = await db.runAsync(
          `INSERT INTO company_settings (name, doc_id, phone, email, address, logo, currency) 
           VALUES (?, ?, ?, ?, ?, ?, ?);`,
          [name, docId, phone, email, address, logo, currency],
        );
        setCompanyId(insertResult.lastInsertRowId);
      }
    } catch (error) {
      console.log("Error al guardar datos:", error);
    } finally {
      setSaving(false);
    }
  };

  // muestra al rueda de carga al leer los datos
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        {/* Encabezado */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mi Empresa</Text>
          <Text style={styles.headerSubtitle}>
            Datos del Emisor para Presupuestos
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Tarjeta de Logo */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Logo del Negocio</Text>

            <View style={styles.logoRow}>
              <View style={styles.logoBox}>
                {logo ? (
                  <Image source={{ uri: logo }} style={styles.logoImage} />
                ) : (
                  <Ionicons name="business-outline" size={32} color="#94A3B8" />
                )}
              </View>

              <View style={styles.logoActions}>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={handlePickLogo}
                >
                  <Text style={styles.uploadButtonText}>Subir logo</Text>
                </TouchableOpacity>

                {logo && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={handleRemoveLogo}
                  >
                    <Text style={styles.removeButtonText}>Quitar</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* Tarjeta de Datos Identificativos */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Información General</Text>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Nombre Comercial o Razón Social</Text>
              <TextInput
                style={styles.input}
                placeholder="ej. Servicios Profesionales Demo SAC"
                placeholderTextColor="#94A3B8"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Nro. de Documento / RUC</Text>
              <TextInput
                style={styles.input}
                placeholder="ej. 20491829101"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={docId}
                onChangeText={setDocId}
              />
            </View>
          </View>

          {/* Tarjeta de Contacto */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Datos de Contacto</Text>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Teléfono / WhatsApp</Text>
              <TextInput
                style={styles.input}
                placeholder="+51 900 111 222"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Correo</Text>
              <TextInput
                style={styles.input}
                placeholder="contacto@demo.com"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Dirección del Negocio</Text>
              <TextInput
                style={styles.input}
                placeholder="Av. Javier Prado 2450"
                placeholderTextColor="#94A3B8"
                value={address}
                onChangeText={setAddress}
              />
            </View>
          </View>

          {/* Botón de Guardar Directo */}
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Guardar Datos</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ESTILOS BÁSICOS
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 12,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    overflow: "hidden",
  },
  logoImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  logoActions: {
    flexDirection: "row",
    marginLeft: 16,
    alignItems: "center",
  },
  uploadButton: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  uploadButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  removeButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    marginLeft: 8,
    backgroundColor: "#FFFFFF",
  },
  removeButtonText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "500",
  },
  fieldContainer: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: "#334155",
    marginBottom: 6,
  },
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
  saveButton: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});
