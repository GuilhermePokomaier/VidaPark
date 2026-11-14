import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../../../Firebase/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { confirmarSaida } from "../utils/sessao";
import { doc, getDoc } from "firebase/firestore";
import { useTheme } from "../../../context/ThemeContext";
import React, { useState, useEffect } from "react";
import Contact from "../../../components/Contact";
import { lerFotoLocal } from "../utils/perfilLocal";

export default function Profile({ navigation }) {
  const [user, setUser] = useState(null);
  const [photoUri, setPhotoUri] = useState(null);
  const [savedName, setSavedName] = useState(null);
  const [showContact, setShowContact] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return unsubscribe;
  }, []);

  // Recarrega nome e foto sempre que a aba ganha foco (ex.: voltando de "Editar perfil")
  // e quando o usuário logado muda.
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", loadProfile);
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    loadProfile();
  }, [user?.uid]);

  async function loadProfile() {
    const current = auth.currentUser;
    if (!current) {
      setPhotoUri(null);
      setSavedName(null);
      return;
    }

    setPhotoUri(await lerFotoLocal(current.uid));

    try {
      const snap = await getDoc(doc(db, "usuarios", current.uid));
      setSavedName(snap.exists() ? snap.data().nome || null : null);
    } catch {
      // sem conexão: cai no nome do perfil do Firebase Auth (displayName)
      setSavedName(null);
    }
  }

  function logout() {
    confirmarSaida(navigation, () => setUser(null));
  }

  function getInitials() {
    const name = (savedName || user?.displayName || "").trim();
    if (name) {
      const parts = name.split(/\s+/).filter(Boolean);
      if (parts.length === 1) return parts[0][0].toUpperCase();
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  }

  function getDisplayName() {
    if (savedName) return savedName;
    if (user?.displayName) return user.displayName;
    if (user?.email) return user.email.split("@")[0];
    return "Usuário";
  }

  function getEmail() {
    return user?.email || "";
  }

  const options = [
    {
      title: "Minhas compras",
      subtitle: "Veja seus pedidos e histórico",
      icon: "receipt-outline",
      action: () => navigation.navigate("MeusPedidos"),
    },
    {
      title: "Alterar senha",
      subtitle: "Atualize sua senha de acesso",
      icon: "lock-closed-outline",
      action: () => navigation.navigate("ChangePassword"),
    },
    {
      title: "Editar perfil",
      subtitle: "Altere seus dados pessoais",
      icon: "person-outline",
      action: () => navigation.navigate("EditProfile"),
    },
    {
      title: "Meus endereços",
      subtitle: "Gerencie seus endereços de entrega",
      icon: "location-outline",
      action: () => navigation.navigate("Addresses"),
    },
    {
      title: "Configurações",
      subtitle: "Preferencias do aplicativo",
      icon: "settings-outline",
      action: () => navigation.navigate("Settings"),
    },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.profileBox}>
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: theme.surface }]}
          onPress={logout}
          accessibilityRole="button"
          accessibilityLabel="Sair da conta"
        >
          <Ionicons name="exit" size={20} color={theme.text} />
        </TouchableOpacity>

        <View style={styles.avatarContainer}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={[styles.avatarImage, { borderColor: theme.primary }]} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
              <Text style={styles.avatarText}>{getInitials()}</Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.editIcon, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate("EditProfile")}
          >
            <Ionicons name="camera" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={[styles.name, { color: theme.primary }]}>{getDisplayName()}</Text>
        <Text style={[styles.email, { color: theme.textSecondary }]}>{getEmail()}</Text>
        
      </View>

      <View style={styles.menu}>
        
        {options.map((item) => (
          <TouchableOpacity
            key={item.title}
            style={[styles.card, { backgroundColor: theme.surface }]}
            onPress={item.action}
          >
            <View style={styles.cardLeft}>
              <Ionicons name={item.icon} size={24} color={theme.accent} style={styles.cardIcon} />
              <View>
                <Text style={[styles.cardTitle, { color: theme.primary }]}>{item.title}</Text>
                <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>{item.subtitle}</Text>
              </View>
            </View>
            <Text style={[styles.arrow, { color: theme.primary }]}>›</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={[styles.infoButton, { backgroundColor: theme.accent }]} onPress={() => setShowContact(true)}>
          <Ionicons name="information-circle-sharp" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.infoButtonText}>Informações da casa</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 100 }} />

      <Contact visible={showContact} onClose={() => setShowContact(false)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 15,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 15,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
   
  },
profileBox: {
  alignItems: "center",
  marginBottom: 30,
  width: "100%",
},
logoutButton: {
  position: "absolute",
  top: 0,
  right: 0,
  zIndex: 10,
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
  
  avatarText: {
    color: "#fff",
    fontSize: 38,
    fontWeight: "bold",
  },
  editIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
  },
  email: {
    fontSize: 14,
    marginTop: 5,
  },
  menu: {
    gap: 12,
  },
  card: {
    borderRadius: 15,
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
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
  infoButton: {
    marginTop: 20,
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  infoButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
