import React, { useEffect, useState, useCallback } from "react";
import {View, ScrollView, Text, TouchableOpacity, ImageBackground, StyleSheet,ActivityIndicator} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import About from "../components/About";
import Contact from "../components/Contact";
import { useTheme } from "../context/ThemeContext";
import { auth, db as database } from "../Firebase/firebaseConfig";
import {doc, getDoc, collection, query, where, orderBy, limit, getDocs} from "firebase/firestore";

const IMG_HEADER_BG = require("../Images/header-bg.jpg");
const IMG_PACOTES = require("../Images/pacotes-festa.jpg");
const IMG_SALGADOS = require("../Images/salgados-avulsos.jpg");

// Nome da tela de pedidos no seu navigator (ajuste se for diferente)
const TELA_MEUS_PEDIDOS = "MeusPedidos";

// Status que contam como "pedido em andamento"
const STATUS_ATIVO = {
  aguardando_pagamento: {
    titulo: "Aguardando pagamento",
    mensagem: "Estamos esperando a confirmação do pagamento",
    icone: "time-outline",
    etapa: -1,
  },
  aprovado: {
    titulo: "Pedido aprovado",
    mensagem: "Pagamento confirmado! Já vamos começar",
    icone: "checkmark-circle-outline",
    etapa: 0,
  },
  em_preparo: {
    titulo: "Em preparação",
    mensagem: "Estamos preparando o seu pedido",
    icone: "restaurant-outline",
    etapa: 0,
  },
  em_preparacao: {
    titulo: "Em preparação",
    mensagem: "Estamos preparando o seu pedido",
    icone: "restaurant-outline",
    etapa: 0,
  },
  saiu_para_entrega: {
    titulo: "Saiu para entrega",
    mensagem: "Seu pedido está a caminho!",
    icone: "bicycle-outline",
    etapa: 1,
  },
};

export default function Home({ navigation, route }) {
  const [nome, setNome] = useState("");
  const [pedidoAtivo, setPedidoAtivo] = useState(null);
  const [carregandoPedido, setCarregandoPedido] = useState(true);

  const [showAbout, setShowAbout] = useState(true);
  const [showContact, setShowContact] = useState(false);

  const { theme } = useTheme();

  useEffect(() => {
    const carregarNome = async () => {
      try {
        const user = auth.currentUser;

        if (!user) {
          return;
        }

        const usuarioRef = doc(database, "usuarios", user.uid);
        const usuarioSnap = await getDoc(usuarioRef);

        if (usuarioSnap.exists()) {
          const dadosUsuario = usuarioSnap.data();
          setNome(dadosUsuario.nome || "");
        }
      } catch (error) {
        console.log("Erro ao carregar nome:", error);
      }
    };

    carregarNome();
  }, []);

  // Recarrega o pedido ativo toda vez que a Home ganha foco
  useFocusEffect(
    useCallback(() => {
      const carregarPedidoAtivo = async () => {
        try {
          const uid = auth.currentUser?.uid;

          if (!uid) {
            setPedidoAtivo(null);
            return;
          }

          const q = query(
            collection(database, "pedidos"),
            where("userId", "==", uid),
            orderBy("createdAt", "desc"),
            limit(10)
          );

          const snap = await getDocs(q);

          const ativo = snap.docs
            .map((d) => {
              const dados = d.data();
              return { id: d.id, ...dados, status: dados.status || "em_preparacao" };
            })
            .find((p) => STATUS_ATIVO[p.status]);

          setPedidoAtivo(ativo || null);
        } catch (error) {
          console.log("Erro ao carregar pedido ativo:", error);
          setPedidoAtivo(null);
        } finally {
          setCarregandoPedido(false);
        }
      };

      carregarPedidoAtivo();
    }, [])
  );

  const irParaPedidos = () => navigation.navigate(TELA_MEUS_PEDIDOS);

  const renderCardPedido = () => {
    // Carregando
    if (carregandoPedido) {
      return (
        <View
          style={[
            styles.pedidoCard,
            styles.pedidoCardCentro,
            { backgroundColor: theme.surface, shadowColor: theme.cardShadow },
          ]}
        >
          <ActivityIndicator size="small" color={theme.accent} />
        </View>
      );
    }

    // Sem pedido ativo
    if (!pedidoAtivo) {
      return (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={irParaPedidos}
          style={[
            styles.pedidoCard,
            { backgroundColor: theme.surface, shadowColor: theme.cardShadow },
          ]}
        >
          <View style={styles.pedidoTopRow}>
            <View style={[styles.iconCircle, { backgroundColor: `${theme.textMuted}26` }]}>
              <Ionicons name="receipt-outline" size={20} color={theme.textMuted} />
            </View>

            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.pedidoLabel, { color: theme.textMuted }]}>Seus pedidos</Text>
              <Text style={[styles.pedidoTitulo, { color: theme.primary }]}>
                Sem pedidos no momento
              </Text>
              <Text style={[styles.pedidoMensagem, { color: theme.textSecondary }]}>
                Quando você fizer um pedido, ele aparece aqui
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </View>
        </TouchableOpacity>
      );
    }

    // Com pedido ativo
    const info = STATUS_ATIVO[pedidoAtivo.status];

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={irParaPedidos}
        style={[
          styles.pedidoCard,
          { backgroundColor: theme.surface, shadowColor: theme.cardShadow },
        ]}
      >
        <View style={styles.pedidoTopRow}>
          <View style={[styles.iconCircle, { backgroundColor: `${theme.accent}1F` }]}>
            <Ionicons name={info.icone} size={20} color={theme.accent} />
          </View>

          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.pedidoLabel, { color: theme.textMuted }]}>Seu pedido</Text>
            <Text style={[styles.pedidoTitulo, { color: theme.primary }]}>{info.titulo}</Text>
            <Text style={[styles.pedidoMensagem, { color: theme.textSecondary }]}>
              {info.mensagem}
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
        </View>

        <View style={styles.progressRow}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.progressBar,
                {
                  backgroundColor:
                    i <= info.etapa ? theme.accent : `${theme.textMuted}40`,
                },
              ]}
            />
          ))}
        </View>

        <View style={styles.progressLabels}>
          <Text style={[styles.progressLabel, { color: theme.textMuted }]}>Preparo</Text>
          <Text style={[styles.progressLabel, { color: theme.textMuted }]}>A caminho</Text>
          <Text style={[styles.progressLabel, { color: theme.textMuted }]}>Entregue</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <ImageBackground
          source={IMG_HEADER_BG}
          style={styles.header}
          imageStyle={styles.headerImageRadius}
          resizeMode="cover"
        >
          <View style={styles.headerTop}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={[styles.greeting, { color: theme.text }]}>
                Olá, <Text style={{ color: theme.accent }}>{nome}</Text>
              </Text>
              <Text style={[styles.subGreeting, { color: theme.lightPink }]}>
                Que bom te ver por aqui!
              </Text>
              <Text style={[styles.headerDescription, { color: theme.lightPink }]}>
                Escolha um evento e aproveite o melhor momento com a gente.
              </Text>
            </View>
          </View>
        </ImageBackground>

        {/* Card de acompanhamento do pedido (substitui o "Próximo evento") */}
        {renderCardPedido()}

        <View style={styles.sectionTitleWrap}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>
            O que você deseja?
          </Text>
          <View style={[styles.sectionUnderline, { backgroundColor: theme.accent }]} />
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.bannerCard}
          onPress={() => navigation.navigate("Pacotes")}
        >
          <ImageBackground
            source={IMG_PACOTES}
            style={styles.bannerImage}
            imageStyle={styles.bannerImageRadius}
          >
            <View style={[styles.bannerIconBadge, { backgroundColor: theme.accent }]}>
              <Ionicons name="gift-outline" size={18} color={theme.surface} />
            </View>

            <View style={styles.bannerOverlay}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.bannerTitle, { color: theme.surface }]}>
                  PACOTES DE FESTA
                </Text>
                <Text style={[styles.bannerSubtitle, { color: theme.surface }]}>
                  Espaço + estrutura para seu evento
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.surface} />
            </View>
          </ImageBackground>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.bannerCard}
          onPress={() => navigation.navigate("catalogoSalgados")}
        >
          <ImageBackground
            source={IMG_SALGADOS}
            style={styles.bannerImage}
            imageStyle={styles.bannerImageRadius}
          >
            <View style={[styles.bannerIconBadge, { backgroundColor: theme.primary }]}>
              <Ionicons name="fast-food-outline" size={18} color={theme.surface} />
            </View>

            <View style={styles.bannerOverlay}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.bannerTitle, { color: theme.surface }]}>
                  SALGADOS AVULSOS
                </Text>
                <Text style={[styles.bannerSubtitle, { color: theme.surface }]}>
                  Encomende seus salgados favoritos
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.surface} />
            </View>
          </ImageBackground>
        </TouchableOpacity>
      </ScrollView>

      <About visible={showAbout} onClose={() => setShowAbout(false)} />

      <Contact visible={showContact} onClose={() => setShowContact(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 30,
  },

  header: {
    paddingTop: 30,
    paddingHorizontal: 22,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    overflow: "hidden",
  },

  headerImageRadius: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingTop: 25,
  },

  greeting: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 0.2,
  },

  subGreeting: {
    fontSize: 15,
    marginTop: 6,
    fontWeight: "600",
  },

  headerDescription: {
    fontSize: 12.5,
    marginTop: 6,
    lineHeight: 18,
    opacity: 0.85,
  },

  // Card de pedido
  pedidoCard: {
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 20,
    padding: 16,
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },

  pedidoCardCentro: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 76,
  },

  pedidoTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },

  pedidoLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 5,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  pedidoTitulo: {
    fontSize: 16,
    fontWeight: "800",
  },

  pedidoMensagem: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 3,
  },

  progressRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 14,
  },

  progressBar: {
    flex: 1,
    height: 5,
    borderRadius: 3,
  },

  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },

  progressLabel: {
    fontSize: 10,
    fontWeight: "600",
  },

  // Seção
  sectionTitleWrap: {
    marginTop: 34,
    marginHorizontal: 20,
    marginBottom: 18,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: 0.2,
  },

  sectionUnderline: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginTop: 8,
  },

  // Banners
  bannerCard: {
    marginHorizontal: 20,
    marginBottom: 18,
    borderRadius: 22,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 6,
  },

  bannerImage: {
    width: "100%",
    height: 170,
    justifyContent: "flex-end",
  },

  bannerImageRadius: {
    borderRadius: 22,
  },

  bannerIconBadge: {
    position: "absolute",
    top: 14,
    left: 14,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },

  bannerOverlay: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    padding: 16,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },

  bannerTitle: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.5,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  bannerSubtitle: {
    fontSize: 12,
    marginTop: 5,
    opacity: 0.95,
    fontWeight: "500",
    textShadowColor: "rgba(0,0,0,0.25)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});