import { TouchableOpacity, Image, StyleSheet, View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

export function formatarPreco(valor) {
  const numero = Number(valor);
  if (valor === undefined || valor === null || isNaN(numero)) return "Sob consulta";
  return `R$ ${numero.toFixed(2).replace(".", ",")}`;
}

export default function PacoteCard({ pacote, onPress }) {
  const { theme } = useTheme();

  const uriImagem = pacote.imagem || pacote.imagens?.[0];

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          shadowColor: theme.cardShadow,
        },
      ]}
      activeOpacity={0.85}
      onPress={() => onPress(pacote)}
    >
      <View>
        {uriImagem ? (
          <Image source={{ uri: uriImagem }} style={styles.image} />
        ) : (
          <View style={[styles.image, { backgroundColor: theme.background }]} />
        )}

        {pacote.popular && (
          <View style={[styles.badge, { backgroundColor: theme.accent }]}>
            <Text style={styles.badgeText}>Mais Popular</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={[styles.name, { color: theme.primary }]} numberOfLines={2}>
          {pacote.nome}
        </Text>

        {pacote.maxConvidados ? (
          <View style={styles.detailRow}>
            <Ionicons name="people-outline" size={13} color={theme.textSecondary} />
            <Text style={[styles.detail, { color: theme.textSecondary }]}>
              Até {pacote.maxConvidados} convidados
            </Text>
          </View>
        ) : null}

        {pacote.duracaoHoras ? (
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={13} color={theme.textSecondary} />
            <Text style={[styles.detail, { color: theme.textSecondary }]}>
              {pacote.duracaoHoras}h de evento
            </Text>
          </View>
        ) : null}

        <View style={styles.priceRow}>
          <View>
            <Text style={[styles.from, { color: theme.textMuted }]}>A partir de</Text>
            <Text style={[styles.price, { color: theme.primary }]}>
              {formatarPreco(pacote.precoInicial)}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: 1,
    padding: 10,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: 110,
    height: 118,
    borderRadius: 12,
  },
  badge: {
    position: "absolute",
    top: 6,
    left: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "bold",
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },
  detail: {
    fontSize: 12,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: "auto",
  },
  from: {
    fontSize: 10,
    marginTop: 6,
  },
  price: {
    fontSize: 17,
    fontWeight: "bold",
  },
});