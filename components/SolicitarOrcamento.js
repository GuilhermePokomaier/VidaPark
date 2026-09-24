import React, { useState } from "react";
import {
  Modal, View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
} from "react-native";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../Firebase/firebaseConfig";
import { useTheme } from "../context/ThemeContext";

export default function SolicitarOrcamento({ pacote, visible, onClose }) {
  // ✅ Hooks antes de qualquer return condicional
  const { theme } = useTheme();
  const [dataEvento, setDataEvento] = useState("");
  const [horario, setHorario] = useState("");
  const [convidados, setConvidados] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [retorno, setRetorno] = useState("whatsapp");
  const [enviando, setEnviando] = useState(false);

  if (!pacote) return null;

  function limparEFechar() {
    setDataEvento("");
    setHorario("");
    setConvidados("");
    setObservacoes("");
    setRetorno("whatsapp");
    onClose();
  }

  async function enviar() {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Atenção", "Você precisa estar logado para solicitar um orçamento.");
      return;
    }
    if (!dataEvento.trim() || !horario.trim() || !convidados.trim()) {
      Alert.alert("Atenção", "Preencha data, horário e número de convidados.");
      return;
    }

    try {
      setEnviando(true);
      await addDoc(collection(db, "orcamentos"), {
        userId: user.uid,              // exigido pela regra
        status: "aguardando",          // exigido pela regra
        pacoteId: pacote.id,
        pacoteNome: pacote.nome,
        dataEvento: dataEvento.trim(),
        horario: horario.trim(),
        convidados: Number(convidados),
        observacoes: observacoes.trim(),
        retorno,
        criadoEm: serverTimestamp(),
      });
      Alert.alert("Enviado!", "Sua solicitação foi enviada. Em breve nossa equipe entrará em contato.");
      limparEFechar();
    } catch (error) {
      console.log("Erro ao enviar orçamento:", error);
      Alert.alert("Erro", "Não foi possível enviar a solicitação. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  const inputStyle = [
    styles.input,
    { backgroundColor: theme.surface, color: theme.primary },
  ];

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.primary }]}>Solicitar Orçamento</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{pacote.nome}</Text>

        <Text style={[styles.label, { color: theme.primary }]}>1. Data do evento</Text>
        <TextInput
          style={inputStyle}
          placeholder="DD/MM/AAAA"
          placeholderTextColor={theme.textSecondary}
          value={dataEvento}
          onChangeText={setDataEvento}
          keyboardType="numbers-and-punctuation"
        />

        <Text style={[styles.label, { color: theme.primary }]}>2. Horário previsto</Text>
        <TextInput
          style={inputStyle}
          placeholder="HH:MM"
          placeholderTextColor={theme.textSecondary}
          value={horario}
          onChangeText={setHorario}
          keyboardType="numbers-and-punctuation"
        />

        <Text style={[styles.label, { color: theme.primary }]}>3. Número de convidados (aprox.)</Text>
        <TextInput
          style={inputStyle}
          placeholder="Ex.: 80"
          placeholderTextColor={theme.textSecondary}
          value={convidados}
          onChangeText={(t) => setConvidados(t.replace(/[^0-9]/g, ""))}
          keyboardType="numeric"
        />

        <Text style={[styles.label, { color: theme.primary }]}>4. Observações (opcional)</Text>
        <TextInput
          style={[inputStyle, styles.textArea]}
          placeholder="Conte mais sobre o seu evento, tema desejado..."
          placeholderTextColor={theme.textSecondary}
          value={observacoes}
          onChangeText={setObservacoes}
          maxLength={200}
          multiline
        />
        <Text style={[styles.counter, { color: theme.textSecondary }]}>
          {observacoes.length}/200
        </Text>

        <Text style={[styles.label, { color: theme.primary }]}>Como prefere o retorno?</Text>
        <View style={styles.row}>
          {[
            { id: "whatsapp", label: "WhatsApp" },
            { id: "telefone", label: "Telefone" },
          ].map((op) => (
            <TouchableOpacity
              key={op.id}
              style={[
                styles.option,
                { backgroundColor: retorno === op.id ? theme.primary : theme.surface },
              ]}
              onPress={() => setRetorno(op.id)}
            >
              <Text style={{ color: retorno === op.id ? "#fff" : theme.primary, fontWeight: "bold" }}>
                {op.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.sendButton, { backgroundColor: theme.primary }]}
          onPress={enviar}
          disabled={enviando}
        >
          {enviando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.sendText}>Enviar Solicitação</Text>
          )}
        </TouchableOpacity>

        <Text style={[styles.footer, { color: theme.textSecondary }]}>
          Nosso time entrará em contato em até 2 horas úteis para enviar seu orçamento personalizado.
        </Text>

        <TouchableOpacity
          style={[styles.closeButton, { backgroundColor: theme.accent }]}
          onPress={limparEFechar}
        >
          <Text style={styles.sendText}>Voltar</Text>
        </TouchableOpacity>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 50 },
  title: { fontSize: 26, fontWeight: "bold" },
  subtitle: { fontSize: 16, marginBottom: 10 },
  label: { fontSize: 15, fontWeight: "bold", marginTop: 18, marginBottom: 6 },
  input: { borderRadius: 12, padding: 14, fontSize: 16 },
  textArea: { height: 100, textAlignVertical: "top" },
  counter: { alignSelf: "flex-end", fontSize: 12, marginTop: 4 },
  row: { flexDirection: "row", gap: 12 },
  option: { flex: 1, padding: 14, borderRadius: 12, alignItems: "center" },
  sendButton: { padding: 16, borderRadius: 30, alignItems: "center", marginTop: 28 },
  sendText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  footer: { fontSize: 12, textAlign: "center", marginTop: 14 },
  closeButton: { padding: 16, borderRadius: 30, alignItems: "center", marginTop: 16, marginBottom: 40 },
});