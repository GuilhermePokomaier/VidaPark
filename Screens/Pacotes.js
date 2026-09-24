import React, { useState, useEffect, useMemo } from "react";
import {
  View, FlatList, StyleSheet, Text, ActivityIndicator,
  TextInput, TouchableOpacity, ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { collection, getDocs } from "firebase/firestore";
import PacoteCard from "../components/PacoteCard";
import PacoteModal from "../components/PacoteModal";
import SolicitarOrcamento from "../components/SolicitarOrcamento";
import { db } from "../Firebase/firebaseConfig";
import { useTheme } from "../context/ThemeContext";

const CATEGORIAS = ["Todos", "Infantil", "Teen", "Adulto", "Corporativo"];

export default function Pacotes() {
  const [pacotes, setPacotes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("Todos");
  const [pacoteSelecionado, setPacoteSelecionado] = useState(null);
  const [pacoteOrcamento, setPacoteOrcamento] = useState(null);
  const { theme } = useTheme();

  async function carregarPacotes() {
    try {
      setErro(false);
      const querySnapshot = await getDocs(collection(db, "pacotes"));
      const lista = [];
      querySnapshot.forEach((doc) => {
        const dados = doc.data();
        if (dados.ativo !== false) {
          lista.push({ id: doc.id, ...dados });
        }
      });
      setPacotes(lista);
    } catch (error) {
      console.log("Erro ao carregar pacotes:", error);
      setErro(true);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarPacotes();
  }, []);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return pacotes.filter((p) => {
      const okCategoria =
        categoria === "Todos" || (p.categoria || "").toLowerCase() === categoria.toLowerCase();
      const okBusca =
        !termo ||
        (p.nome || "").toLowerCase().includes(termo) ||
        (p.descricao || "").toLowerCase().includes(termo);
      return okCategoria && okBusca;
    });
  }, [pacotes, busca, categoria]);

  function limparFiltros() {
    setBusca("");
    setCategoria("Todos");
  }

  function abrirOrcamento(pacote) {
    setPacoteSelecionado(null);
    setTimeout(() => setPacoteOrcamento(pacote), 300);
  }

  function renderConteudo() {
    if (carregando) {
      return (
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      );
    }

    if (erro) {
      return (
        <View style={styles.centro}>
          <Ionicons name="cloud-offline-outline" size={48} color={theme.accent} />
          <Text style={[styles.textoEstado, { color: theme.primary }]}>
            Não foi possível carregar os pacotes.{"\n"}Verifique sua conexão.
          </Text>
          <TouchableOpacity
            style={[styles.botaoEstado, { borderColor: theme.accent }]}
            onPress={() => {
              setCarregando(true);
              carregarPacotes();
            }}
          >
            <Text style={[styles.botaoEstadoTexto, { color: theme.accent }]}>
              Tentar novamente
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (pacotes.length === 0) {
      return (
        <View style={styles.centro}>
          <Ionicons name="gift-outline" size={48} color={theme.accent} />
          <Text style={[styles.textoEstado, { color: theme.primary }]}>
            Nenhum pacote cadastrado ainda
          </Text>
        </View>
      );
    }

    if (filtrados.length === 0) {
      return (
        <View style={styles.centro}>
          <Ionicons name="filter-outline" size={48} color={theme.accent} />
          <Text style={[styles.textoEstado, { color: theme.primary }]}>
            Nenhum pacote encontrado{"\n"}com os filtros selecionados.
          </Text>
          <TouchableOpacity
            style={[styles.botaoEstado, { borderColor: theme.accent }]}
            onPress={limparFiltros}
          >
            <Text style={[styles.botaoEstadoTexto, { color: theme.accent }]}>
              Limpar filtros
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <FlatList
        data={filtrados}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <PacoteCard pacote={item} onPress={setPacoteSelecionado} />
        )}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Cabeçalho */}
      <Text style={[styles.titulo, { color: theme.primary }]}>Pacotes de Festa</Text>
      <Text style={[styles.subtitulo, { color: theme.textSecondary }]}>
        Escolha o pacote ideal para o seu evento
      </Text>

      {/* Busca */}
      <View
        style={[
          styles.busca,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <Ionicons name="search-outline" size={18} color={theme.textMuted} />
        <TextInput
          style={[styles.buscaInput, { color: theme.primary }]}
          placeholder="Buscar pacote ou ocasião"
          placeholderTextColor={theme.textMuted}
          value={busca}
          onChangeText={setBusca}
        />
        {busca.length > 0 && (
          <TouchableOpacity onPress={() => setBusca("")}>
            <Ionicons name="close-circle" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Categorias */}
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chips}
          contentContainerStyle={{ gap: 8 }}
        >
          {CATEGORIAS.map((c) => {
            const ativa = categoria === c;
            return (
              <TouchableOpacity
                key={c}
                onPress={() => setCategoria(c)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: ativa ? theme.accent : theme.surface,
                    borderColor: ativa ? theme.accent : theme.border,
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: ativa ? "bold" : "normal",
                    color: ativa ? "#fff" : theme.textSecondary,
                  }}
                >
                  {c}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={{ flex: 1 }}>{renderConteudo()}</View>

      <PacoteModal
        pacote={pacoteSelecionado}
        visible={pacoteSelecionado !== null}
        onClose={() => setPacoteSelecionado(null)}
        onSolicitar={abrirOrcamento}
      />

      <SolicitarOrcamento
        pacote={pacoteOrcamento}
        visible={pacoteOrcamento !== null}
        onClose={() => setPacoteOrcamento(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 55, paddingHorizontal: 16 },
  titulo: { fontSize: 24, fontWeight: "bold" },
  subtitulo: { fontSize: 13, marginTop: 2, marginBottom: 14 },
  busca: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  buscaInput: { flex: 1, fontSize: 14 },
  chips: { flexGrow: 0, marginTop: 12, marginBottom: 14 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  centro: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20, gap: 12 },
  textoEstado: { fontSize: 15, textAlign: "center" },
  botaoEstado: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 4,
  },
  botaoEstadoTexto: { fontSize: 14, fontWeight: "bold" },
});