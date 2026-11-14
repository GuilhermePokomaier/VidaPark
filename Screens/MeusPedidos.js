import React, { useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { auth, db } from "../Firebase/firebaseConfig";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";

// ─────────────────────────────────────────────
// PALETA "VIDA PARK"
// ─────────────────────────────────────────────
const COLORS = {
  azulVidaPark: "#202040",
  rosaVidaPark: "#E84890",
  branco: "#F8F8F8",
  rosaClaro: "#F7A8C8",
  azulSuave: "#34345C",
  rosaEscuro: "#C93678",
  textoSecundario: "#6B6B85",
  textoMutado: "#B3B3C6",
  bordaClara: "#EDEDF2",
  verdeSucesso: "#2E9E5B",
  verdeFundo: "#E4F5EA",
  laranjaAviso: "#D98A1F",
  laranjaFundo: "#FCEFD9",
};

const ABAS = [
  { id: "todos", label: "Todos" },
  { id: "andamento", label: "Em andamento" },
  { id: "concluidos", label: "Concluídos" },
];

function statusInfo(status) {
  switch (status) {
    case "aguardando_pagamento":
      return { label: "Aguardando pagamento", cor: COLORS.laranjaAviso, fundo: COLORS.laranjaFundo, aba: "andamento" };
    case "aprovado":
      return { label: "Pedido aprovado", cor: COLORS.verdeSucesso, fundo: COLORS.verdeFundo, aba: "andamento" };
    case "em_preparo":
    case "em_preparacao":
      return { label: "Em preparação", cor: COLORS.laranjaAviso, fundo: COLORS.laranjaFundo, aba: "andamento" };
    case "saiu_para_entrega":
      return { label: "Saiu para entrega", cor: COLORS.laranjaAviso, fundo: COLORS.laranjaFundo, aba: "andamento" };
    case "entregue":
      return { label: "Entregue", cor: COLORS.verdeSucesso, fundo: COLORS.verdeFundo, aba: "concluidos" };
    case "cancelado":
      return { label: "Cancelado", cor: "#C0392B", fundo: "#FBE3E1", aba: "concluidos" };
    default:
      return { label: status, cor: COLORS.textoMutado, fundo: COLORS.bordaClara, aba: "todos" };
  }
}

// O id do banco é grande (ex.: mp_1234567890); para o cliente mostramos só o final.
function numeroDoPedido(id) {
  return String(id || "").replace(/^mp_/, "").slice(-6).toUpperCase();
}

const FINALIZADOS = ["entregue", "cancelado"];

function formatarPreco(valor) {
  return `R$ ${Number(valor || 0).toFixed(2).replace(".", ",")}`;
}

export default function MeusPedidos({ navigation }) {
  const [abaAtiva, setAbaAtiva] = useState("todos");
  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);

  const carregarPedidos = useCallback(async () => {
    try {
      setCarregando(true);
      setErro(false);

      const uid = auth.currentUser?.uid;

      if (!uid) {
        setPedidos([]);
        setCarregando(false);
        return;
      }

      const pedidosRef = collection(db, "pedidos");

      // Sem orderBy na consulta: assim não precisa de índice no Firestore.
      // A ordenação (mais recente primeiro) é feita aqui no app.
      const pedidosQuery = query(pedidosRef, where("userId", "==", uid));

      const snapshot = await getDocs(pedidosQuery);

      const lista = snapshot.docs
        .map((item) => {
          const dados = item.data();

          return {
            id: item.id,
            status: dados.status || "em_preparacao",
            data: dados.data || "",
            horario: dados.horario || "",
            unidades: dados.unidades || 0,
            total: dados.total || 0,
            oculto: dados.ocultoCliente === true,
            criadoEm: dados.createdAt?.seconds || 0,
          };
        })
        // pedidos que o cliente removeu do histórico não aparecem
        .filter((pedido) => !pedido.oculto)
        .sort((a, b) => b.criadoEm - a.criadoEm);

      setPedidos(lista);
    } catch (error) {
      console.error("ERRO AO CARREGAR PEDIDOS:", error);
      setErro(true);
      setPedidos([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  // Recarrega toda vez que a tela ganha foco — assim, ao voltar do
  // Checkout depois de confirmar um pedido novo, a lista já aparece
  // atualizada sem precisar reabrir a tela do zero.
  useFocusEffect(
    useCallback(() => {
      carregarPedidos();
    }, [carregarPedidos])
  );

  // "Remover do histórico" só esconde o pedido para o cliente: a loja continua com o registro.
  function confirmarRemocao(pedido) {
    Alert.alert(
      "Remover do histórico",
      "Este pedido deixará de aparecer na sua lista. Deseja remover?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            try {
              await updateDoc(doc(db, "pedidos", pedido.id), { ocultoCliente: true });
              setPedidos((anteriores) => anteriores.filter((p) => p.id !== pedido.id));
            } catch (e) {
              console.log("Erro ao remover pedido:", e);
              Alert.alert("Erro", "Não foi possível remover o pedido. Tente novamente.");
            }
          },
        },
      ]
    );
  }

  const pedidosFiltrados = pedidos.filter((pedido) => {
    if (abaAtiva === "todos") return true;
    return statusInfo(pedido.status).aba === abaAtiva;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={26} color={COLORS.rosaVidaPark} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Meus pedidos</Text>
      </View>

      {/* Abas */}
      <View style={styles.abasWrapper}>
        {ABAS.map((aba) => {
          const ativa = abaAtiva === aba.id;
          return (
            <TouchableOpacity
              key={aba.id}
              style={styles.abaItem}
              onPress={() => setAbaAtiva(aba.id)}
            >
              <Text style={[styles.abaLabel, ativa && styles.abaLabelAtiva]}>{aba.label}</Text>
              {ativa && <View style={styles.abaIndicador} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Lista */}
      {carregando ? (
        <View style={styles.emptyBox}>
          <ActivityIndicator size="large" color={COLORS.rosaVidaPark} />
        </View>
      ) : erro ? (
        <View style={styles.emptyBox}>
          <Ionicons name="cloud-offline-outline" size={48} color={COLORS.textoMutado} />
          <Text style={styles.emptyText}>Não foi possível carregar seus pedidos</Text>
          <TouchableOpacity onPress={carregarPedidos}>
            <Text style={styles.verDetalhesLink}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : pedidosFiltrados.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="receipt-outline" size={48} color={COLORS.textoMutado} />
          <Text style={styles.emptyText}>Nenhum pedido por aqui ainda</Text>
        </View>
      ) : (
        <FlatList
          data={pedidosFiltrados}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const status = statusInfo(item.status);
            return (
              <TouchableOpacity
                style={styles.pedidoCard}
                activeOpacity={0.85}
                onPress={() => navigation.navigate("PedidoDetalhes", { pedido: item })}
              >
                <View style={styles.pedidoTopo}>
                  <Text style={styles.pedidoNumero}>Pedido #{numeroDoPedido(item.id)}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: status.fundo }]}>
                    <Text style={[styles.statusTexto, { color: status.cor }]}>{status.label}</Text>
                  </View>
                </View>

                <Text style={styles.pedidoData}>
                  {item.data} às {item.horario}
                </Text>
                <Text style={styles.pedidoUnidades}>{item.unidades} unidades</Text>

                <View style={styles.pedidoRodape}>
                  <Text style={styles.pedidoTotal}>Total: {formatarPreco(item.total)}</Text>

                  {item.status === "entregue" ? (
                    <TouchableOpacity onPress={() => navigation.navigate("AvaliarPedido", { pedido: item })}>
                      <Text style={styles.avaliarLink}>Avaliar pedido ★</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.verDetalhesLink}>Ver detalhes ›</Text>
                  )}
                </View>

                {FINALIZADOS.includes(item.status) ? (
                  <TouchableOpacity style={styles.removerBotao} onPress={() => confirmarRemocao(item)}>
                    <Ionicons name="trash-outline" size={14} color={COLORS.textoSecundario} />
                    <Text style={styles.removerTexto}>Remover do histórico</Text>
                  </TouchableOpacity>
                ) : null}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.branco,
  },

  // Header
  header: {
    backgroundColor: COLORS.azulVidaPark,
    paddingTop: 55,
    paddingHorizontal: 20,
    paddingBottom: 18,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -6,
    marginRight: 2,
  },
  headerTitle: {
    color: COLORS.rosaVidaPark,
    fontSize: 19,
    fontWeight: "700",
  },

  // Abas
  abasWrapper: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bordaClara,
  },
  abaItem: {
    marginRight: 22,
    paddingBottom: 10,
    alignItems: "center",
  },
  abaLabel: {
    fontSize: 13,
    color: COLORS.textoMutado,
    fontWeight: "600",
  },
  abaLabelAtiva: {
    color: COLORS.rosaVidaPark,
  },
  abaIndicador: {
    marginTop: 6,
    height: 3,
    width: "100%",
    borderRadius: 2,
    backgroundColor: COLORS.rosaVidaPark,
  },

  // Lista
  lista: {
    padding: 16,
  },
  pedidoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  pedidoTopo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  pedidoNumero: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.azulVidaPark,
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusTexto: {
    fontSize: 11,
    fontWeight: "700",
  },
  pedidoData: {
    fontSize: 12,
    color: COLORS.textoMutado,
  },
  pedidoUnidades: {
    fontSize: 12,
    color: COLORS.textoSecundario,
    marginTop: 2,
  },
  pedidoRodape: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  pedidoTotal: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.azulVidaPark,
  },
  verDetalhesLink: {
    fontSize: 12,
    color: COLORS.rosaVidaPark,
    fontWeight: "700",
  },
  avaliarLink: {
    fontSize: 12,
    color: COLORS.laranjaAviso,
    fontWeight: "700",
  },

  removerBotao: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    marginTop: 10,
    paddingVertical: 4,
  },
  removerTexto: {
    fontSize: 12,
    color: COLORS.textoSecundario,
    fontWeight: "600",
  },

  // Vazio
  emptyBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  emptyText: {
    color: COLORS.textoMutado,
    fontSize: 14,
  },
});