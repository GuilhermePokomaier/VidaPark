import React, { useEffect, useState } from "react";
import {View,ScrollView, Text, TouchableOpacity, ImageBackground, StyleSheet,} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import About from "../components/About";
import Contact from "../components/Contact";
import { useTheme } from "../context/ThemeContext";
import { auth, db as database } from "../Firebase/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";


const IMG_HEADER_BG = require("../Images/header-bg.jpg");
const IMG_PACOTES = require("../Images/pacotes-festa.jpg");
const IMG_SALGADOS = require("../Images/salgados-avulsos.jpg");

export default function Home({ navigation, route }) {
  const [nome, setNome] = useState("");

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

  const nextEvent = {
    title: "Aniversário do João",
    date: "25/05/2025",
    daysLeft: 12,
  };

  const [showAbout, setShowAbout] = useState(true);
  const [showContact, setShowContact] = useState(false);

  const { theme } = useTheme();

  return (
    <View style={[ styles.container, { backgroundColor: theme.background,},]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} >

        <ImageBackground source={IMG_HEADER_BG} style={styles.header} imageStyle={styles.headerImageRadius} resizeMode="cover" >
          <View style={styles.headerTop}>
            <View style={{ flex: 1, paddingRight: 12 }}>

              <Text style={[ styles.greeting, {  color: theme.text, },]}>
                Olá, <Text style={{ color: theme.accent }}>{nome}</Text>
              </Text>
              <Text style={[  styles.subGreeting, { color: theme.lightPink, }, ]}> Que bom te ver por aqui! </Text>
              <Text style={[ styles.headerDescription, { color: theme.lightPink }, ]}> Escolha um evento e aproveite o melhor momento com a gente. </Text>
            </View>

            <TouchableOpacity style={[styles.bellButton, { backgroundColor: theme.softBlue,  }, ]}onPress={() => navigation.navigate("Notifications")}>
              <Ionicons
                name="notifications-outline"
                size={20}
                color={theme.text}
              />
              <View style={[ styles.bellDot, { backgroundColor: theme.accent, borderColor: theme.primary }, ]} />
            </TouchableOpacity>
          </View>
        </ImageBackground>

        <View style={[ styles.eventCard,  { backgroundColor: theme.surface, shadowColor: theme.cardShadow, },]} >
          <View style={[ styles.eventIconCircle, { backgroundColor: `${theme.accent}1F` }, ]}>
            <Ionicons name="calendar-outline" size={20} color={theme.accent} />
          </View>

          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[ styles.eventLabel, { color: theme.textMuted,  }, ]} > Próximo evento </Text>
            <Text style={[ styles.eventTitle, { color: theme.primary, }, ]}> {nextEvent.title}</Text>
            <View style={styles.eventDateRow}>
              <Ionicons name="calendar-clear-outline" size={12} color={theme.textSecondary} style={{ marginRight: 4 }} />
              <Text style={[ styles.eventDate, { color: theme.textSecondary }, ]} > {nextEvent.date} </Text>
            </View>
          </View>
          
          <View style={[ styles.countdownBadge, { backgroundColor: theme.accent, }, ]}>
            <Text style={[ styles.countdownNumber,  { color: theme.surface, }, ]}> {nextEvent.daysLeft} </Text>
            <Text style={[ styles.countdownLabel, {  color: theme.surface,  }, ]}> dias </Text>
          </View>

          <Ionicons name="chevron-forward" size={18} color={theme.textMuted} style={{ marginLeft: 6 }} />
        </View>

        <View style={styles.sectionTitleWrap}>
          <Text style={[ styles.sectionTitle, { color: theme.primary, },]} > O que você deseja? </Text>
          <View style={[ styles.sectionUnderline, { backgroundColor: theme.accent }, ]} />
        </View>

        <TouchableOpacity activeOpacity={0.85}style={styles.bannerCard} onPress={() => navigation.navigate("Pacotes")}>
          <ImageBackground source={IMG_PACOTES}style={styles.bannerImage} imageStyle={styles.bannerImageRadius} >
            <View style={[ styles.bannerIconBadge, { backgroundColor: theme.accent }, ]}>
              <Ionicons name="gift-outline" size={18} color={theme.surface} />
            </View>

            <View style={styles.bannerOverlay} >
              <View style={{ flex: 1 }}>
                <Text style={[ styles.bannerTitle, {color: theme.surface, },]} >PACOTES DE FESTA</Text>
                <Text style={[styles.bannerSubtitle, { color: theme.surface, }, ]}> Espaço + estrutura para seu evento </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.surface} />
            </View>
          </ImageBackground>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.85} style={styles.bannerCard} onPress={() => navigation.navigate("Catalogo")}>
          <ImageBackground source={IMG_SALGADOS} style={styles.bannerImage}imageStyle={styles.bannerImageRadius}>
            <View style={[ styles.bannerIconBadge, { backgroundColor: theme.primary }, ]}>
              <Ionicons name="fast-food-outline" size={18} color={theme.surface} />
            </View>

            <View style={styles.bannerOverlay}>
              <View style={{ flex: 1 }}>
                <Text style={[  styles.bannerTitle, { color: theme.surface, },]} > SALGADOS AVULSOS </Text>
                <Text style={[ styles.bannerSubtitle, {  color: theme.surface, }, ]}> Encomende seus salgados favoritos </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.surface} />
            </View>
          </ImageBackground>
        </TouchableOpacity>
      </ScrollView>

      <About
        visible={showAbout}
        onClose={() => setShowAbout(false)}
      />

      <Contact
        visible={showContact}
        onClose={() => setShowContact(false)}
      />
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

  bellButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  bellDot: {
    position: "absolute",
    top: 8,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
  },

  eventCard: {
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 5,
  },

  eventIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },

  eventLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 5,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  eventDateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  eventDate: {
    fontSize: 12,
    fontWeight: "500",
  },

  countdownBadge: {
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    minWidth: 60,
    marginLeft: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },

  countdownNumber: {
    fontSize: 18,
    fontWeight: "800",
  },

  countdownLabel: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

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