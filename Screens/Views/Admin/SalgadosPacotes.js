import React from "react";
import {View, Text, StyleSheet, TouchableOpacity, ScrollView,} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../context/ThemeContext";

export default function SalgadosPacotes({ navigation }) {
  const { theme } = useTheme();

  const escolhas = [
    {
      id: "salgados",
      tipo: "Salgado",
      title: "Salgados",
      subtitle: "Quero editar meus salgados",
      icon: "fast-food-outline",
    },
    {
      id: "pacotes",
      tipo: "Pacote",
      title: "Pacotes",
      subtitle: "Quero editar meus pacotes",
      icon: "gift-outline",
    },
  ];

  const selecionarEscolha = (escolha) => {
    if (escolha.id === "salgados") {
      navigation.navigate("GerenciarSalgados");
      return;
    }

    if (escolha.id === "pacotes") {
      navigation.navigate("GerenciarPacotes");
      return;
    }
  };

  return (
    <ScrollView style={[ styles.container,  {  backgroundColor: theme.background, },]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={[  styles.title, { color: theme.primary, },]}>O que deseja editar hoje? </Text>
        <Text style={[ styles.description,{  color: theme.textSecondary,},]} > Escolha uma das opções abaixo para continuar </Text>
      </View>

      <View style={styles.menu}>
        {escolhas.map((escolha) => (
          <TouchableOpacity
            key={escolha.id}
            style={[
              styles.card,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                shadowColor: theme.cardShadow,
              },
            ]}
            onPress={() => selecionarEscolha(escolha)}
            activeOpacity={0.7}
          >
            <View style={styles.cardLeft}>
              <Ionicons
                name={escolha.icon}
                size={28}
                color={theme.accent}
                style={styles.cardIcon}
              />

              <View>
                <Text style={[  styles.cardTitle, {  color: theme.primary,  },]} > {escolha.title}</Text>
                <Text  style={[styles.cardSubtitle, { color: theme.textSecondary,}, ]} > {escolha.subtitle}  </Text>
              </View>
            </View>

            <Text style={[ styles.arrow, { color: theme.primary, }, ]} >
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 15,
  },

  content: {
    paddingBottom: 40,
  },

  header: {
    alignItems: "center",
    marginBottom: 30,
    marginTop: 150,
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
  },

  description: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },

  menu: {
    gap: 12,
    marginTop: 10,
  },

  card: {
    borderRadius: 15,
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
  },

  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  cardIcon: {
    marginRight: 14,
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: "bold",
  },

  cardSubtitle: {
    marginTop: 5,
    fontSize: 13,
  },

  arrow: {
    fontSize: 30,
  },
});