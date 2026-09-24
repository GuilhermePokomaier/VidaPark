import React, { useState, useEffect } from "react";
import {
  Modal, View, Text, Image, TouchableOpacity, StyleSheet,
  ScrollView, FlatList, useWindowDimensions, Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useProducts } from "../context/ProductContext";
import { useTheme } from "../context/ThemeContext";
import { formatarPreco } from "./PacoteCard";

// 👉 Troque pelo WhatsApp da loja (código do país + DDD + número)
const WHATSAPP = "5548999999999";

const ABAS = [
  { id: "sobre", label: "Sobre o pacote" },
  { id: "inclui", label: "O que inclui" },
  { id: "estrutura", label: "Estrutura" },
  { id: "regras", label: "Regras" },
];

export default function PacoteModal({ pacote, visible, onClose, onSolicitar }) {
  // ✅ Todos os hooks antes de qualquer return condicional
  const { isFavorite, addFavorite, removeFavorite } = useProducts();
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const [aba, setAba] = useState("sobre");
  const [imagemAtual, setImagemAtual] = useState(1);

  useEffect(() => {
    setAba("sobre");
    setImagemAtual(1);
  }, [pacote?.id]);

  if (!pacote) return null;

  const imagens = pacote.imagens?.length
    ? pacote.imagens
    : pacote.imagem
    ? [pacote.imagem]
    : [];

  const favorited = isFavorite(pacote.id);
  const preco = Number(pacote.precoInicial);
  const parcela = !isNaN(preco) && preco > 0 ? formatarPreco(preco / 12) : null;

  function toggleFavorite() {
    favorited ? removeFavorite(pacote.id) : addFavorite(pacote);
  }

  function abrirWhatsApp() {
    const msg = encodeURIComponent(`Olá! Tenho dúvidas sobre o pacote ${pacote.nome}.`);
    Linking.openURL(`https://wa.me/${WHATSAPP}?text=${msg}`);
  }

  function ListaItens({ itens, icone }) {
    if (!itens?.length) {
      return (
        <Text style={[styles.texto, { color: theme.textMuted }]}>
          Informações em breve.
        </Text>
      );
    }
    return itens.map((item, i) => (
      <View key={i} style={styles.itemRow}>
        <Ionicons name={icone} size={15} color={theme.accent} />
        <Text style={[styles.itemTexto, { color: theme.textSecondary }]}>{item}</Text>
      </View>
    ));
  }

  function conteudoAba() {
    switch (aba) {
      case "inclui":
        return <ListaItens itens={pacote.inclui} icone="checkmark" />;
      case "estrutura":
        return <ListaItens itens={pacote.estrutura} icone="checkmark" />;
      case "regras":
        return <ListaItens itens={pacote.regras} icone="alert-circle-outline" />;
      default:
        return (
          <>
            {pacote.descricao ? (
              <Text style={[styles.texto, { color: theme.textSecondary }]}>
                {pacote.descricao}
              </Text>
            ) : null}
            {pacote.destaques?.length > 0 && (
              <>
                <Text style={[styles.tituloSecao, { color: theme.primary }]}>Destaques</Text>
                <ListaItens itens={pacote.destaques} icone="checkmark" />
              </>
            )}
          </>
        );
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>
          {/* Galeria */}
          <View>
            {imagens.length > 0 ? (
              <FlatList
                data={imagens}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(_, i) => String(i)}
                onMomentumScrollEnd={(e) =>
                  setImagemAtual(Math.round(e.nativeEvent.contentOffset.x / width) + 1)
                }
                renderItem={({ item }) => (
                  <Image source={{ uri: item }} style={{ width, height: 300 }} />
                )}
              />
            ) : (
              <View style={{ width, height: 300, backgroundColor: theme.surface }} />
            )}
            {imagens.length > 1 && (
              <View style={styles.contador}>
                <Text style={styles.contadorTexto}>
                  {imagemAtual}/{imagens.length}
                </Text>
              </View>
            )}
          </View>

          {/* Folha de informações */}
          <View style={[styles.sheet, { backgroundColor: theme.background }]}>
            <View style={styles.tituloRow}>
              <Text style={[styles.nome, { color: theme.primary }]}>{pacote.nome}</Text>
              {pacote.popular && (
                <View style={[styles.badge, { backgroundColor: theme.accent }]}>
                  <Text style={styles.badgeTexto}>Mais Popular</Text>
                </View>
              )}
            </View>

            <View style={styles.infoRow}>
              {pacote.maxConvidados ? (
                <View style={styles.infoItem}>
                  <Ionicons name="people-outline" size={15} color={theme.textSecondary} />
                  <Text style={[styles.infoTexto, { color: theme.textSecondary }]}>
                    Até {pacote.maxConvidados} convidados
                  </Text>
                </View>
              ) : null}
              {pacote.duracaoHoras ? (
                <View style={styles.infoItem}>
                  <Ionicons name="time-outline" size={15} color={theme.textSecondary} />
                  <Text style={[styles.infoTexto, { color: theme.textSecondary }]}>
                    {pacote.duracaoHoras} horas de evento
                  </Text>
                </View>
              ) : null}
              {pacote.ambiente ? (
                <View style={styles.infoItem}>
                  <Ionicons name="home-outline" size={15} color={theme.textSecondary} />
                  <Text style={[styles.infoTexto, { color: theme.textSecondary }]}>
                    {pacote.ambiente}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Preço + botão */}
            <View style={[styles.precoRow, { borderColor: theme.border }]}>
              <View>
                <Text style={[styles.from, { color: theme.textMuted }]}>A partir de</Text>
                <Text style={[styles.preco, { color: theme.primary }]}>
                  {formatarPreco(pacote.precoInicial)}
                </Text>
                {parcela && (
                  <Text style={[styles.parcela, { color: theme.textMuted }]}>
                    ou 12x de {parcela}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={[styles.botaoOrcamento, { backgroundColor: theme.accent }]}
                onPress={() => onSolicitar(pacote)}
                activeOpacity={0.85}
              >
                <Text style={styles.botaoTexto}>Solicitar Orçamento</Text>
              </TouchableOpacity>
            </View>

            {/* Abas */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={[styles.abas, { borderColor: theme.border }]}
            >
              {ABAS.map((a) => {
                const ativa = aba === a.id;
                return (
                  <TouchableOpacity
                    key={a.id}
                    onPress={() => setAba(a.id)}
                    style={[
                      styles.aba,
                      ativa && { borderBottomColor: theme.accent, borderBottomWidth: 2 },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: ativa ? "bold" : "normal",
                        color: ativa ? theme.accent : theme.textSecondary,
                      }}
                    >
                      {a.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.conteudo}>{conteudoAba()}</View>
          </View>
        </ScrollView>

        {/* Botões sobre a imagem */}
        <View style={styles.topBar} pointerEvents="box-none">
          <TouchableOpacity style={styles.circulo} onPress={onClose}>
            <Ionicons name="arrow-back" size={22} color="#202040" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.circulo} onPress={toggleFavorite}>
            <Ionicons
              name={favorited ? "heart" : "heart-outline"}
              size={22}
              color={favorited ? theme.accent : "#202040"}
            />
          </TouchableOpacity>
        </View>

        {/* Rodapé fixo */}
        <View
          style={[
            styles.rodape,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View>
            <Text style={[styles.duvidas, { color: theme.primary }]}>Tem dúvidas?</Text>
            <Text style={[styles.duvidasSub, { color: theme.textSecondary }]}>
              Fale com nossa equipe
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.botaoZap, { borderColor: "#25D366" }]}
            onPress={abrirWhatsApp}
          >
            <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
            <Text style={styles.zapTexto}>Falar no WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    position: "absolute",
    top: 45,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  circulo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  contador: {
    position: "absolute",
    bottom: 36,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  contadorTexto: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  sheet: {
    marginTop: -24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  tituloRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  nome: { flex: 1, fontSize: 22, fontWeight: "bold" },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeTexto: { color: "#fff", fontSize: 11, fontWeight: "bold" },
  infoRow: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginTop: 12 },
  infoItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  infoTexto: { fontSize: 12 },
  precoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 18,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  from: { fontSize: 12 },
  preco: { fontSize: 24, fontWeight: "bold" },
  parcela: { fontSize: 12, marginTop: 2 },
  botaoOrcamento: { paddingHorizontal: 18, paddingVertical: 14, borderRadius: 12 },
  botaoTexto: { color: "#fff", fontSize: 14, fontWeight: "bold" },
  abas: { marginTop: 4, borderBottomWidth: 1, flexGrow: 0 },
  aba: { paddingVertical: 12, paddingHorizontal: 12 },
  conteudo: { marginTop: 16 },
  texto: { fontSize: 14, lineHeight: 21 },
  tituloSecao: { fontSize: 16, fontWeight: "bold", marginTop: 18, marginBottom: 8 },
  itemRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 8 },
  itemTexto: { flex: 1, fontSize: 14, lineHeight: 20 },
  rodape: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 26,
    borderTopWidth: 1,
  },
  duvidas: { fontSize: 13, fontWeight: "bold" },
  duvidasSub: { fontSize: 12 },
  botaoZap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  zapTexto: { color: "#25D366", fontSize: 13, fontWeight: "bold" },
});