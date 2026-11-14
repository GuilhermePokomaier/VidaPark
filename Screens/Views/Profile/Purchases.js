import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db as database, auth } from "../../../Firebase/firebaseConfig";
import { useTheme } from "../../../context/ThemeContext";

const STATUS = {
  approved: { label: "Aprovado", cor: "#4CAF50" },
  authorized: { label: "Autorizado", cor: "#4CAF50" },
  pending: { label: "Pendente", cor: "#FF9800" },
  in_process: { label: "Em processamento", cor: "#FF9800" },
  rejected: { label: "Recusado", cor: "#f44336" },
  cancelled: { label: "Cancelado", cor: "#f44336" },
  refunded: { label: "Reembolsado", cor: "#9C27B0" },
  charged_back: { label: "Contestado", cor: "#9C27B0" },
};

const FORMAS = {
  pix: "PIX",
  boleto: "Boleto",
  card: "Cartão de crédito",
  debit_card: "Cartão de débito",
  checkout: "Checkout Mercado Pago",
};

const statusInfo = (status) => STATUS[status] || { label: status || "Desconhecido", cor: "#999" };

function formatMoney(value) {
  const n = Number(value);
  if (!isFinite(n)) return "R$ 0,00";
  return `R$ ${n.toFixed(2).replace(".", ",")}`;
}

function formatDate(date) {
  if (!date) return "";
  const d = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function Purchases({ navigation }) {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true); // primeira carga
  const [refreshing, setRefreshing] = useState(false); // puxar para atualizar
  const [erro, setErro] = useState(false);
  const { theme } = useTheme();

  const loadPurchases = useCallback(async () => {
    setErro(false);
    try {
      const user = auth.currentUser;
      if (!user) {
        setPurchases([]);
        return;
      }

      const q = query(collection(database, "payments"), where("payer.email", "==", user.email));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setPurchases(list);
    } catch {
      setErro(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Recarrega sempre que a tela ganha foco, sem esconder a lista que já está na tela
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", loadPurchases);
    return unsubscribe;
  }, [navigation, loadPurchases]);

  function onRefresh() {
    setRefreshing(true);
    loadPurchases();
  }

  const logado = !!auth.currentUser;

  function renderVazio() {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.primary }]}>Carregando compras...</Text>
        </View>
      );
    }

    if (erro) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="cloud-offline-outline" size={80} color={theme.accent} />
          <Text style={[styles.emptyText, { color: theme.primary }]}>Não foi possível carregar</Text>
          <Text style={[styles.emptySubtext, { color: theme.textMuted }]}>
            Verifique sua conexão com a internet e tente novamente.
          </Text>
          <TouchableOpacity
            style={[styles.shopButton, { backgroundColor: theme.primary }]}
            onPress={() => {
              setLoading(true);
              loadPurchases();
            }}
          >
            <Text style={styles.shopButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!logado) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="person-outline" size={80} color={theme.accent} />
          <Text style={[styles.emptyText, { color: theme.primary }]}>Você não está logado</Text>
          <Text style={[styles.emptySubtext, { color: theme.textMuted }]}>
            Faça login para ver suas compras.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="receipt-outline" size={80} color={theme.accent} />
        <Text style={[styles.emptyText, { color: theme.primary }]}>Nenhuma compra encontrada</Text>
        <Text style={[styles.emptySubtext, { color: theme.textMuted }]}>
          Suas compras aparecerão aqui após finalizar um pedido.
        </Text>
        <TouchableOpacity
          style={[styles.shopButton, { backgroundColor: theme.primary }]}
          onPress={() => navigation.navigate("catalogoSalgados")}
        >
          <Text style={styles.shopButtonText}>Ir às compras</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={theme.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.primary }]}>Minhas Compras</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={purchases}
        keyExtractor={(item) => item.id}
        contentContainerStyle={purchases.length ? styles.list : styles.listVazia}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={renderVazio}
        renderItem={({ item }) => {
          const st = statusInfo(item.status);
          return (
            <View style={[styles.purchaseCard, { backgroundColor: theme.surface }]}>
              <View style={styles.purchaseHeader}>
                <Text style={[styles.purchaseDescription, { color: theme.primary }]}>
                  {item.description || "Compra VidaPark"}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: st.cor + "20" }]}>
                  <Text style={[styles.statusText, { color: st.cor }]}>{st.label}</Text>
                </View>
              </View>

              <View style={styles.purchaseDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="cash-outline" size={16} color={theme.textMuted} />
                  <Text style={[styles.detailText, { color: theme.textSecondary }]}>{formatMoney(item.amount)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="calendar-outline" size={16} color={theme.textMuted} />
                  <Text style={[styles.detailText, { color: theme.textSecondary }]}>{formatDate(item.createdAt)}</Text>
                </View>
                {item.paymentMethod ? (
                  <View style={styles.detailRow}>
                    <Ionicons name="card-outline" size={16} color={theme.textMuted} />
                    <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                      {FORMAS[item.paymentMethod] || item.paymentMethod}
                    </Text>
                  </View>
                ) : null}
                {item.mpId ? (
                  <View style={styles.detailRow}>
                    <Ionicons name="finger-print-outline" size={16} color={theme.textMuted} />
                    <Text style={[styles.detailText, { color: theme.textSecondary }]}>ID: {item.mpId}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16 },
  headerTitle: { fontSize: 20, fontWeight: "bold" },
  loadingText: { marginTop: 12, fontSize: 16 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 40 },
  emptyText: { fontSize: 18, fontWeight: "bold", marginTop: 16 },
  emptySubtext: { fontSize: 14, textAlign: "center", marginTop: 8, lineHeight: 20 },
  shopButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 25, marginTop: 20 },
  shopButtonText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  list: { padding: 16, gap: 12 },
  listVazia: { flexGrow: 1 },
  purchaseCard: { borderRadius: 16, padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  purchaseHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  purchaseDescription: { fontSize: 16, fontWeight: "bold", flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginLeft: 8 },
  statusText: { fontSize: 12, fontWeight: "bold" },
  purchaseDetails: { gap: 8 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  detailText: { fontSize: 14 },
});
