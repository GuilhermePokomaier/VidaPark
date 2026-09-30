import React, { useState, useCallback } from "react";
import {View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert,} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { auth, db } from "../../../Firebase/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { callFunction } from "../Checkout/mercadopago";

function addressesCollection(uid) {
  return collection(db, "users", uid, "addresses");
}

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
};

const FORMAS_PAGAMENTO = [
  { id: "pix", label: "Pix", icon: "qr-code-outline" },
  { id: "credito", label: "Cartão de crédito", icon: "card-outline" },
  { id: "debito", label: "Cartão de débito", icon: "card-outline" },
];

function getFullAddress(addr) {
  if (!addr) return "";
  return [
    addr.street,
    addr.number,
    addr.complement,
    addr.neighborhood,
    addr.city,
    addr.state,
    addr.zipCode ? `CEP: ${addr.zipCode}` : "",
  ]
    .filter(Boolean)
    .join(", ");
}

// Soma a quantidade de itens do combo para gravar em "unidades".
// Se cada item já tiver um campo "quantidade", usa a soma; senão,
// conta 1 por item como fallback.
function contarUnidades(combo) {
  if (!Array.isArray(combo) || combo.length === 0) return 0;

  return combo.reduce((total, item) => {
    const quantidade = Number(item?.quantidade ?? item?.qtd ?? 1);
    return total + (Number.isFinite(quantidade) ? quantidade : 1);
  }, 0);
}

export default function Checkout({ navigation, route }) {
  // Dados que vieram do Carrinho
  const combo = route?.params?.combo || [];
  const totalCombo = route?.params?.totalCombo || 0;
  const taxaEntrega = route?.params?.taxaEntrega || 5;
  const totalGeral = route?.params?.totalGeral || totalCombo + taxaEntrega;

  // Endereço vem do Firestore (users/{uid}/addresses),
  // priorizando o que está marcado como "selected" na tela Addresses.
  const [endereco, setEndereco] = useState(null);
  const [carregandoEndereco, setCarregandoEndereco] = useState(true);

  const [data] = useState("25/05/2025");
  const [horario] = useState("18:00");
  const [formaPagamento, setFormaPagamento] = useState("pix");
  const [enviando, setEnviando] = useState(false);

  const carregarEndereco = useCallback(async () => {
    try {
      setCarregandoEndereco(true);

      const uid = auth.currentUser?.uid;
      if (!uid) {
        setEndereco(null);
        setCarregandoEndereco(false);
        return;
      }

      const snapshot = await getDocs(addressesCollection(uid));
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Prioridade: endereço marcado como padrão (selected: true).
      // Se nenhum estiver marcado, cai no primeiro da lista como fallback.
      const marcado = list.find((a) => a.selected) || list[0] || null;

      setEndereco(marcado);
    } catch (e) {
      console.log("Erro ao carregar endereço no Checkout:", e);
      setEndereco(null);
    } finally {
      setCarregandoEndereco(false);
    }
  }, []);

  // Recarrega toda vez que a tela ganha foco — assim, ao voltar de
  // "Addresses" depois de trocar o endereço padrão, o Checkout já
  // aparece atualizado sem precisar reabrir a tela do zero.
  useFocusEffect(
    useCallback(() => {
      carregarEndereco();
    }, [carregarEndereco])
  );

  function formatarPreco(valor) {
    return `R$ ${Number(valor || 0).toFixed(2).replace(".", ",")}`;
  }

  async function confirmarPedido() {
    if (!endereco) {
      Alert.alert(
        "Endereço necessário",
        "Adicione um endereço de entrega antes de confirmar o pedido.",
        [{ text: "Adicionar endereço", onPress: () => navigation.navigate("Addresses") }]
      );
      return;
    }

    const uid = auth.currentUser?.uid;

    if (!uid) {
      Alert.alert(
        "Sessão necessária",
        "Faça login novamente para confirmar o pedido."
      );
      return;
    }

    setEnviando(true);

    try {
      const user = auth.currentUser;
      const email = user?.email || "cliente@email.com";
      const name = user?.displayName || "Cliente";
      const description = combo.map((item) => item.nome || "Produto").join(", ");

      const pedidoBase = {
        userId: uid,
        itens: combo,
        unidades: contarUnidades(combo),
        totalCombo,
        taxaEntrega,
        total: totalGeral,
        data,
        horario,
        formaPagamento,
        endereco: {
          label: endereco.label || "Endereço",
          enderecoCompleto: getFullAddress(endereco),
        },
      };

      if (formaPagamento === "pix") {
        // Pix: gera o QR Code direto via createPayment (não usa o checkout
        // hospedado, que no sandbox não mostra a opção de Pix).
        const result = await callFunction("createPayment", {
          paymentMethod: "pix",
          amount: totalGeral,
          description,
          payerInfo: { name, email },
        });

        setEnviando(false);

        navigation.navigate("Pagamento", {
          pixData: {
            paymentId: result.payment.id,
            qrCode: result.payment.qrCode,
            qrCodeBase64: result.payment.qrCodeBase64,
            ticketUrl: result.payment.ticketUrl,
          },
          total: totalGeral,
          pedido: pedidoBase,
        });
        return;
      }

      // Cartão / débito: continua pelo checkout hospedado do Mercado Pago
      const result = await callFunction("createPreference", {
        amount: totalGeral,
        description,
        payerInfo: { name, email },
        address: getFullAddress(endereco),
      });

      setEnviando(false);

      // O pedido só é gravado no Firestore depois que o pagamento for
      // confirmado (isso acontece dentro da tela "Pagamento").
      navigation.navigate("Pagamento", {
        checkoutUrl: result.initPoint,
        externalRef: result.externalReference,
        total: totalGeral,
        pedido: pedidoBase,
      });
    } catch (error) {
      console.error("Erro ao criar preferência de pagamento:", error);

      setEnviando(false);

      Alert.alert(
        "Erro",
        error?.message || "Não foi possível iniciar o pagamento. Tente novamente."
      );
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Ionicons name="chevron-back" size={22} color={COLORS.branco} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Endereço de entrega */}
        <View style={styles.card}>
          <View style={styles.cardTopo}>
            <Text style={styles.cardTitulo}>Endereço de entrega</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Addresses")}>
              <Text style={styles.alterarLink}>Alterar</Text>
            </TouchableOpacity>
          </View>

          {carregandoEndereco ? (
            <ActivityIndicator size="small" color={COLORS.rosaVidaPark} />
          ) : endereco ? (
            <View style={styles.enderecoLinha}>
              <Ionicons name="location-outline" size={18} color={COLORS.rosaVidaPark} />
              <View style={{ marginLeft: 8, flex: 1 }}>
                <Text style={styles.enderecoRua}>{endereco.label || "Endereço"}</Text>
                <Text style={styles.enderecoBairro}>{getFullAddress(endereco)}</Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.enderecoLinha}
              onPress={() => navigation.navigate("Addresses")}
            >
              <Ionicons name="alert-circle-outline" size={18} color={COLORS.rosaVidaPark} />
              <Text style={[styles.enderecoBairro, { marginLeft: 8 }]}>
                Nenhum endereço cadastrado. Toque para adicionar.
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Data e horário */}
        <View style={styles.card}>
          <Text style={styles.cardTitulo}>Data e horário</Text>
          <View style={styles.dataLinha}>
            <View style={styles.dataItem}>
              <Ionicons name="calendar-outline" size={16} color={COLORS.textoSecundario} />
              <Text style={styles.dataTexto}>{data}</Text>
            </View>
            <View style={styles.dataItem}>
              <Ionicons name="time-outline" size={16} color={COLORS.textoSecundario} />
              <Text style={styles.dataTexto}>{horario}</Text>
            </View>
          </View>
        </View>

        {/* Forma de pagamento */}
        <View style={styles.card}>
          <Text style={styles.cardTitulo}>Forma de pagamento</Text>

          {FORMAS_PAGAMENTO.map((forma) => {
            const selecionada = formaPagamento === forma.id;
            return (
              <TouchableOpacity
                key={forma.id}
                style={styles.pagamentoLinha}
                onPress={() => setFormaPagamento(forma.id)}
              >
                <View style={styles.pagamentoEsquerda}>
                  <Ionicons name={forma.icon} size={18} color={COLORS.azulVidaPark} />
                  <Text style={styles.pagamentoLabel}>{forma.label}</Text>
                </View>
                <Ionicons
                  name={selecionada ? "checkmark-circle" : "ellipse-outline"}
                  size={20}
                  color={selecionada ? COLORS.rosaVidaPark : COLORS.textoMutado}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer fixo */}
      <View style={styles.footer}>
        <View style={styles.totalLinha}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValor}>{formatarPreco(totalGeral)}</Text>
        </View>

        <TouchableOpacity
          style={[styles.confirmarButton, enviando && { opacity: 0.7 }]}
          onPress={confirmarPedido}
          disabled={enviando}
        >
          {enviando ? (
            <ActivityIndicator size="small" color={COLORS.branco} />
          ) : (
            <Text style={styles.confirmarButtonText}>CONFIRMAR PEDIDO</Text>
          )}
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    color: COLORS.branco,
    fontSize: 17,
    fontWeight: "700",
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },

  // Cards
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTopo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cardTitulo: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.azulVidaPark,
    marginBottom: 4,
  },
  alterarLink: {
    fontSize: 12,
    color: COLORS.rosaVidaPark,
    fontWeight: "700",
  },

  // Endereço
  enderecoLinha: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  enderecoRua: {
    fontSize: 14,
    color: COLORS.azulVidaPark,
    fontWeight: "600",
  },
  enderecoBairro: {
    fontSize: 12,
    color: COLORS.textoSecundario,
    marginTop: 2,
  },

  // Data e horário
  dataLinha: {
    flexDirection: "row",
    gap: 20,
    marginTop: 4,
  },
  dataItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dataTexto: {
    fontSize: 13,
    color: COLORS.textoSecundario,
    fontWeight: "600",
  },

  // Forma de pagamento
  pagamentoLinha: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bordaClara,
  },
  pagamentoEsquerda: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  pagamentoLabel: {
    fontSize: 14,
    color: COLORS.azulVidaPark,
    fontWeight: "600",
  },

  // Footer
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.bordaClara,
    backgroundColor: COLORS.branco,
  },
  totalLinha: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 15,
    color: COLORS.azulVidaPark,
    fontWeight: "700",
  },
  totalValor: {
    fontSize: 17,
    color: COLORS.azulVidaPark,
    fontWeight: "800",
  },
  confirmarButton: {
    backgroundColor: COLORS.rosaVidaPark,
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: "center",
  },
  confirmarButtonText: {
    color: COLORS.branco,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});