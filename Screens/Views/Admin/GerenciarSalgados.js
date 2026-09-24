import React, { useState, useEffect, useMemo } from "react";
import { View,Text,StyleSheet,FlatList,Alert,TouchableOpacity,Image,TextInput,} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { db as database } from "../../../Firebase/firebaseConfig";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import {useTheme} from "../../../context/ThemeContext";
import SalgadosPacotes from "./SalgadosPacotes";


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

const CATEGORIAS = [
  { id: "todos", label: "Todos", icon: "grid-outline" },
  { id: "salgados", label: "Salgados", icon: "fast-food-outline" },
  { id: "doces", label: "Doces", icon: "ice-cream-outline" },
  { id: "bebidas", label: "Bebidas", icon: "cafe-outline" },
];

export default function GerenciarSalgados({ navigation }) {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [categoriaAtiva, setCategoriaAtiva] = useState("todos");

  async function carregarProduto() {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(database, "salgados"));
      const lista = [];
      querySnapshot.forEach((doc) => {
        lista.push({ id: doc.id, ...doc.data() });
      });
      setProdutos(lista);
    } catch (error) {
      console.log("Erro ao buscar produtos: ", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarProduto();
  }, []);

  async function ExcluirProdutos(id) {
    try {
      await deleteDoc(doc(database, "salgados", id));
      setProdutos((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      Alert.alert("Erro", "Não foi possível deletar o produto");
      console.log(error);
    }
  }

  function confirmarExclusao(item) {
    Alert.alert(
      "Excluir produto",
      `Deseja excluir "${item.nome}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => ExcluirProdutos(item.id),
        },
      ]
    );
  }

  function EditarProdutos(produto) {
    navigation.navigate("EditProduct", { produto, aoSalvar: carregarProduto });
  }

  function AdicionarProdutos() {
    navigation.navigate("AddProdutos", { aoSalvar: carregarProduto });
  }

  function formatarValor(valor) {
    if (typeof valor === "string") return valor;
    return `R$ ${Number(valor || 0).toFixed(2).replace(".", ",")}`;
  }

  const produtosFiltrados = useMemo(() => {
    return produtos.filter((item) => {
      const categoriaItem = (item.categoria || "salgados").toLowerCase();

      const categoriaOk =
        categoriaAtiva === "todos" || categoriaItem === categoriaAtiva;

      const buscaOk =
        !busca ||
        (item.nome || "").toLowerCase().includes(busca.toLowerCase());

      return categoriaOk && buscaOk;
    });
  }, [produtos, busca, categoriaAtiva]);

  return (
    <View style={styles.container}>
      <FlatList
        data={produtosFiltrados}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.lista}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* TÍTULO */}
            <Text style={styles.titulo}>Gerenciamento de Salgados</Text>
            <Text style={styles.subtitulo}>
              Edite, exclua ou adicione novos produtos ao seu cardápio.
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
                placeholder="Buscar salgado..."
                placeholderTextColor={COLORS.textoMutado}
                value={busca}
                onChangeText={setBusca}
              />
              {busca !== "" && (
                <TouchableOpacity onPress={() => setBusca("")}>
                  <Ionicons
                    name="close"
                    size={18}
                    color={COLORS.textoMutado}
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* CATEGORIAS */}
            <FlatList
              data={CATEGORIAS}
              horizontal
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriasList}
              renderItem={({ item }) => {
                const ativo = categoriaAtiva === item.id;
                return (
                  <TouchableOpacity
                    style={[
                      styles.categoriaPill,
                      ativo && styles.categoriaPillAtiva,
                    ]}
                    onPress={() => setCategoriaAtiva(item.id)}
                  >
                    <Ionicons
                      name={item.icon}
                      size={14}
                      color={ativo ? COLORS.branco : COLORS.textoSecundario}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.categoriaLabel,
                        ativo && styles.categoriaLabelAtiva,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </>
        }
        renderItem={({ item }) => {
          const disponivel = item.disponivel !== false;

          return (
            <View style={styles.card}>
              <View style={styles.cardTopo}>
                {item.imagem ? (
                  <Image
                    source={{ uri: item.imagem }}
                    style={styles.cardImagem}
                  />
                ) : (
                  <View
                    style={[styles.cardImagem, styles.cardImagemPlaceholder]}
                  >
                    <Ionicons
                      name="fast-food-outline"
                      size={22}
                      color={COLORS.textoMutado}
                    />
                  </View>
                )}

                <View style={styles.cardInfo}>
                  <Text style={styles.cardNome} numberOfLines={1}>
                    {item.nome}
                  </Text>
                  {!!item.descricao && (
                    <Text style={styles.cardDescricao} numberOfLines={1}>
                      {item.descricao}
                    </Text>
                  )}
                  <Text style={styles.cardPreco}>
                    {formatarValor(item.valor)}
                  </Text>

                  <View style={styles.tagsRow}>
                    {!!item.tamanho && (
                      <View style={styles.tagCinza}>
                        <Ionicons
                          name="resize-outline"
                          size={11}
                          color={COLORS.textoSecundario}
                        />
                      </View>
                    )}
                  </View>
                </View>

                <TouchableOpacity style={styles.kebabButton}>
                  <Ionicons
                    name="ellipsis-vertical"
                    size={16}
                    color={COLORS.textoMutado}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.cardBotoes}>
                <TouchableOpacity
                  style={styles.botaoEditar}
                  onPress={() => EditarProdutos(item)}
                >
                  <Ionicons name="pencil" size={14} color={COLORS.branco} />
                  <Text style={styles.botaoTexto}>Editar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.botaoExcluir}
                  onPress={() => confirmarExclusao(item)}
                >
                  <Ionicons name="trash" size={14} color={COLORS.branco} />
                  <Text style={styles.botaoTexto}>Excluir</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          !loading && (
            <View style={styles.vazioContainer}>
              <Ionicons
                name="cube-outline"
                size={64}
                color={COLORS.rosa}
                style={styles.iconeVazio}
              />
              <Text style={styles.txtVazio}>
                Não existem produtos cadastrados
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          produtos.length > 0 && (
            <Text style={styles.totalTexto}>
              Total de produtos: {produtosFiltrados.length}
            </Text>
          )
        }
      />

      {/* BOTÃO FLUTUANTE ADICIONAR */}
      <TouchableOpacity
        style={styles.fab}
        onPress={AdicionarProdutos}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color={COLORS.branco} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.fundo,
  },

  /* HEADER */
  header: {
    backgroundColor: COLORS.fundoHeader,
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

  /* TÍTULO */
  titulo: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.rosa,
    marginTop: 20,
    marginHorizontal: 16,
  },

  subtitulo: {
    fontSize: 13,
    color: COLORS.textoSecundario,
    marginTop: 4,
    marginHorizontal: 16,
    marginBottom: 16,
  },

  /* BUSCA */
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.borda,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginHorizontal: 16,
  },

  searchInput: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.branco,
  },

  /* CATEGORIAS */
  categoriasList: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },

  categoriaPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.borda,
    marginRight: 8,
  },

  categoriaPillAtiva: {
    backgroundColor: COLORS.rosa,
    borderColor: COLORS.rosa,
  },

  categoriaLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textoSecundario,
  },

  categoriaLabelAtiva: {
    color: COLORS.branco,
  },

  /* LISTA */
  lista: {
    paddingHorizontal: 16,
    paddingBottom: 100,
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
    width: 64,
    height: 64,
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

  cardNome: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.branco,
  },

  cardDescricao: {
    fontSize: 12,
    color: COLORS.textoSecundario,
    marginTop: 2,
  },

  cardPreco: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.rosa,
    marginTop: 4,
  },

  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },

  tagCinza: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borda,
  },

  tagCinzaTexto: {
    fontSize: 10,
    color: COLORS.textoSecundario,
    fontWeight: "600",
  },

  tagStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    backgroundColor: COLORS.verdeFundo,
  },

  tagStatusIndisponivel: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
  },

  tagStatusTexto: {
    fontSize: 10,
    color: COLORS.verde,
    fontWeight: "700",
  },

  tagStatusTextoIndisponivel: {
    color: COLORS.vermelhoExcluir,
  },

  kebabButton: {
    padding: 4,
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

  /* VAZIO */
  vazioContainer: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingTop: 60,
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

  /* TOTAL */
  totalTexto: {
    fontSize: 12,
    color: COLORS.textoMutado,
    marginTop: 4,
  },

  /* FAB */
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
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
});