
import React, { useState, useEffect, useMemo } from "react";

import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { db } from "../../../Firebase/firebaseConfig";

import {
  collection,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";

const COLORS = {
  fundo: "#181830",
  fundoHeader: "#202040",
  card: "#22224A",
  borda: "#33335C",
  rosa: "#E84890",
  rosaClaro: "#F7A8C8",
  branco: "#F8F8F8",
  textoSecundario: "#9494B8",
  textoMutado: "#6B6B90",
  verde: "#22C55E",
  verdeFundo: "rgba(34, 197, 94, 0.15)",
  azulEditar: "#4C6EF5",
  vermelhoExcluir: "#EF4444",
};

export default function GerenciarPacotes({ navigation }) {
  const [pacotes, setPacotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");

  // =========================================================
  // CARREGAR PACOTES
  // =========================================================

  async function carregarPacotes() {
    try {
      setLoading(true);

      const querySnapshot = await getDocs(
        collection(db, "pacotes")
      );

      const lista = [];

      querySnapshot.forEach((documento) => {
        lista.push({
          id: documento.id,
          ...documento.data(),
        });
      });

      setPacotes(lista);
    } catch (error) {
      console.log("Erro ao buscar pacotes:", error);

      Alert.alert(
        "Erro",
        "Não foi possível carregar os pacotes."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarPacotes();
  }, []);

  // =========================================================
  // EXCLUIR PACOTE
  // =========================================================

  async function excluirPacote(id) {
    try {
      await deleteDoc(doc(db, "pacotes", id));

      setPacotes((prev) =>
        prev.filter((pacote) => pacote.id !== id)
      );

      Alert.alert(
        "Sucesso",
        "Pacote excluído com sucesso."
      );
    } catch (error) {
      console.log("Erro ao excluir pacote:", error);

      Alert.alert(
        "Erro",
        "Não foi possível excluir o pacote."
      );
    }
  }

  function confirmarExclusao(pacote) {
    Alert.alert(
      "Excluir pacote",
      `Deseja excluir "${pacote.nome}"?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => excluirPacote(pacote.id),
        },
      ]
    );
  }

  // =========================================================
  // EDITAR
  // =========================================================

  function editarPacote(pacote) {
    navigation.navigate("EditPacote", {
      pacote,
      aoSalvar: carregarPacotes,
    });
  }

  // =========================================================
  // ADICIONAR
  // =========================================================

  function adicionarPacote() {
    navigation.navigate("AddPacote", {
      aoSalvar: carregarPacotes,
    });
  }

  // =========================================================
  // FORMATAR PREÇO
  // =========================================================

  function formatarValor(valor) {
    const numero = Number(valor);

    if (valor === undefined || valor === null || isNaN(numero)) {
      return "Sob consulta";
    }

    return `R$ ${numero.toFixed(2).replace(".", ",")}`;
  }

  // =========================================================
  // FILTRO DE BUSCA
  // =========================================================

  const pacotesFiltrados = useMemo(() => {
    return pacotes.filter((item) => {
      if (!busca.trim()) {
        return true;
      }

      const termo = busca.toLowerCase();

      return (
        (item.nome || "").toLowerCase().includes(termo) ||
        (item.descricao || "").toLowerCase().includes(termo) ||
        (item.ambiente || "").toLowerCase().includes(termo)
      );
    });
  }, [pacotes, busca]);

  // =========================================================
  // CARD
  // =========================================================

  function renderPacote({ item }) {
    const disponivel = item.disponivel !== false;

    const imagem =
      item.imagem ||
      (Array.isArray(item.imagens) && item.imagens.length > 0
        ? item.imagens[0]
        : null);

    return (
      <View style={styles.card}>

        {/* PARTE SUPERIOR */}
        <View style={styles.cardTopo}>

          {/* IMAGEM */}
          {imagem ? (
            <Image
              source={{ uri: imagem }}
              style={styles.cardImagem}
            />
          ) : (
            <View
              style={[
                styles.cardImagem,
                styles.cardImagemPlaceholder,
              ]}
            >
              <Ionicons
                name="gift-outline"
                size={28}
                color={COLORS.textoMutado}
              />
            </View>
          )}

          {/* INFORMAÇÕES */}
          <View style={styles.cardInfo}>

            <View style={styles.nomeRow}>
              <Text
                style={styles.cardNome}
                numberOfLines={2}
              >
                {item.nome || "Pacote sem nome"}
              </Text>

              {item.popular && (
                <View style={styles.tagPopular}>
                  <Text style={styles.tagPopularTexto}>
                    Popular
                  </Text>
                </View>
              )}
            </View>

            {!!item.descricao && (
              <Text
                style={styles.cardDescricao}
                numberOfLines={2}
              >
                {item.descricao}
              </Text>
            )}

            <Text style={styles.cardPreco}>
              {formatarValor(item.precoInicial)}
            </Text>

          </View>

        </View>

        {/* INFORMAÇÕES EXTRAS */}
        <View style={styles.detalhesRow}>

          {item.maxConvidados ? (
            <View style={styles.detalhe}>
              <Ionicons
                name="people-outline"
                size={14}
                color={COLORS.textoSecundario}
              />

              <Text style={styles.detalheTexto}>
                Até {item.maxConvidados} convidados
              </Text>
            </View>
          ) : null}

          {item.duracaoHoras ? (
            <View style={styles.detalhe}>
              <Ionicons
                name="time-outline"
                size={14}
                color={COLORS.textoSecundario}
              />

              <Text style={styles.detalheTexto}>
                {item.duracaoHoras}h
              </Text>
            </View>
          ) : null}

          {item.ambiente ? (
            <View style={styles.detalhe}>
              <Ionicons
                name="home-outline"
                size={14}
                color={COLORS.textoSecundario}
              />

              <Text
                style={styles.detalheTexto}
                numberOfLines={1}
              >
                {item.ambiente}
              </Text>
            </View>
          ) : null}

        </View>

        {/* STATUS */}
        <View style={styles.statusRow}>

          <View
            style={[
              styles.status,
              disponivel
                ? styles.statusDisponivel
                : styles.statusIndisponivel,
            ]}
          >
            <View
              style={[
                styles.statusBolinha,
                {
                  backgroundColor: disponivel
                    ? COLORS.verde
                    : COLORS.vermelhoExcluir,
                },
              ]}
            />

            <Text
              style={[
                styles.statusTexto,
                {
                  color: disponivel
                    ? COLORS.verde
                    : COLORS.vermelhoExcluir,
                },
              ]}
            >
              {disponivel
                ? "Disponível"
                : "Indisponível"}
            </Text>
          </View>

        </View>

        {/* BOTÕES */}
        <View style={styles.cardBotoes}>

          <TouchableOpacity
            style={styles.botaoEditar}
            onPress={() => editarPacote(item)}
          >
            <Ionicons
              name="pencil"
              size={14}
              color={COLORS.branco}
            />

            <Text style={styles.botaoTexto}>
              Editar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.botaoExcluir}
            onPress={() => confirmarExclusao(item)}
          >
            <Ionicons
              name="trash"
              size={14}
              color={COLORS.branco}
            />

            <Text style={styles.botaoTexto}>
              Excluir
            </Text>
          </TouchableOpacity>

        </View>

      </View>
    );
  }

  // =========================================================
  // TELA
  // =========================================================

  return (
    <View style={styles.container}>

      <FlatList
        data={pacotesFiltrados}
        keyExtractor={(item) => item.id}
        renderItem={renderPacote}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.lista}

        ListHeaderComponent={
          <>
            <Text style={styles.titulo}>
              Gerenciamento de Pacotes
            </Text>

            <Text style={styles.subtitulo}>
              Edite, exclua ou adicione novos pacotes
              para os eventos.
            </Text>

            {/* BUSCA */}
            <View style={styles.searchBox}>

              <Ionicons
                name="search-outline"
                size={18}
                color={COLORS.textoMutado}
              />

              <TextInput
                style={styles.searchInput}
                placeholder="Buscar pacote..."
                placeholderTextColor={COLORS.textoMutado}
                value={busca}
                onChangeText={setBusca}
              />

              {busca !== "" && (
                <TouchableOpacity
                  onPress={() => setBusca("")}
                >
                  <Ionicons
                    name="close"
                    size={18}
                    color={COLORS.textoMutado}
                  />
                </TouchableOpacity>
              )}

            </View>

            {/* CARREGANDO */}
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator
                  size="large"
                  color={COLORS.rosa}
                />

                <Text style={styles.loadingTexto}>
                  Carregando pacotes...
                </Text>
              </View>
            )}
          </>
        }

        ListEmptyComponent={
          !loading ? (
            <View style={styles.vazioContainer}>

              <Ionicons
                name="gift-outline"
                size={64}
                color={COLORS.rosa}
                style={styles.iconeVazio}
              />

              <Text style={styles.txtVazio}>
                {busca
                  ? "Nenhum pacote encontrado."
                  : "Não existem pacotes cadastrados."}
              </Text>

            </View>
          ) : null
        }

        ListFooterComponent={
          !loading && pacotes.length > 0 ? (
            <Text style={styles.totalTexto}>
              Total de pacotes: {pacotesFiltrados.length}
            </Text>
          ) : null
        }
      />

      {/* BOTÃO ADICIONAR */}
      <TouchableOpacity
        style={styles.fab}
        onPress={adicionarPacote}
        activeOpacity={0.85}
      >
        <Ionicons
          name="add"
          size={28}
          color={COLORS.branco}
        />
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: COLORS.fundo,
  },

  lista: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },

  titulo: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.rosa,
    marginTop: 20,
  },

  subtitulo: {
    fontSize: 13,
    color: COLORS.textoSecundario,
    marginTop: 4,
    marginBottom: 16,
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.borda,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 18,
  },

  searchInput: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.branco,
  },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borda,
    padding: 12,
    marginBottom: 12,
  },

  cardTopo: {
    flexDirection: "row",
  },

  cardImagem: {
    width: 82,
    height: 82,
    borderRadius: 12,
    backgroundColor: COLORS.borda,
  },

  cardImagemPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },

  cardInfo: {
    flex: 1,
    marginLeft: 12,
  },

  nomeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },

  cardNome: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.branco,
  },

  cardDescricao: {
    fontSize: 12,
    color: COLORS.textoSecundario,
    marginTop: 4,
  },

  cardPreco: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.rosa,
    marginTop: 6,
  },

  tagPopular: {
    backgroundColor: COLORS.rosa,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },

  tagPopularTexto: {
    color: COLORS.branco,
    fontSize: 9,
    fontWeight: "700",
  },

  detalhesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
  },

  detalhe: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  detalheTexto: {
    color: COLORS.textoSecundario,
    fontSize: 11,
  },

  statusRow: {
    marginTop: 10,
  },

  status: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },

  statusDisponivel: {
    backgroundColor: COLORS.verdeFundo,
  },

  statusIndisponivel: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
  },

  statusBolinha: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  statusTexto: {
    fontSize: 10,
    fontWeight: "700",
  },

  cardBotoes: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },

  botaoEditar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: COLORS.azulEditar,
    borderRadius: 10,
    paddingVertical: 9,
  },

  botaoExcluir: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: COLORS.vermelhoExcluir,
    borderRadius: 10,
    paddingVertical: 9,
  },

  botaoTexto: {
    color: COLORS.branco,
    fontSize: 13,
    fontWeight: "700",
  },

  vazioContainer: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
  },

  iconeVazio: {
    marginBottom: 10,
    opacity: 0.8,
  },

  txtVazio: {
    fontSize: 16,
    color: COLORS.rosaClaro,
    fontStyle: "italic",
    textAlign: "center",
    opacity: 0.8,
  },

  totalTexto: {
    fontSize: 12,
    color: COLORS.textoMutado,
    marginTop: 4,
    marginBottom: 20,
  },

  loadingContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },

  loadingTexto: {
    color: COLORS.textoSecundario,
    marginTop: 8,
    fontSize: 13,
  },

  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.rosa,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 6,
  },
});

