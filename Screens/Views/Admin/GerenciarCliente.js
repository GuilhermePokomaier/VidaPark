import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { IconButton } from "react-native-paper";
import { db as database } from '../../../Firebase/firebaseConfig';
import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { useTheme } from '../../../context/ThemeContext';

export default function GerenciarCliente({ navigation }) {
  const { theme } = useTheme(); 
  const [clientes, setClientes] = useState([]);

  async function carregarClientes() {
    try {
      const querySnapshot = await getDocs(collection(database, 'usuarios'));
      const lista = [];
      
      querySnapshot.forEach((doc) => {
        lista.push({ id: doc.id, ...doc.data() });
      });
      
      setClientes(lista);
    } catch (error) {
      console.log("Erro ao buscar usuários: ", error);
      Alert.alert("Erro", "Não foi possível carregar a lista de clientes.");
    }
  }

  useEffect(() => {
    carregarClientes();
  }, []);

  async function alternarBanimento(id, statusAtual) {
    if (!id) {
      Alert.alert("Erro", "ID do usuário inválido.");
      return;
    }

    try {
      const usuarioRef = doc(database, "usuarios", id);
      const novoStatusBanido = !statusAtual;

      await updateDoc(usuarioRef, {
        banido: novoStatusBanido
      });
      
      setClientes((prev) =>
        prev.map((user) => {
          if (user.id === id) {
            return { ...user, banido: novoStatusBanido };
          } else {
            return user;
          }
        })
      );

      if (novoStatusBanido === true) {
        Alert.alert("Sucesso", "O usuário foi bloqueado com sucesso.");
      } else {
        Alert.alert("Sucesso", "O usuário foi desbloqueado com sucesso.");
      }

    } catch (error) {
      console.log(error);
      Alert.alert("Erro", "Não foi possível alterar o status do usuário no servidor.");
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.txt, { color: theme.primary }]}>Gerenciamento de Clientes</Text>

      <View style={styles.cardContainer}>
        <FlatList
          data={clientes}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: 20, flexGrow: 1 }}
          renderItem={({ item }) => {
            let textoStatus = "";
            let estiloStatus = null;
            let nomeIcone = "";

            if (item.banido === true) {
              textoStatus = "Status: Bloqueado";
              estiloStatus = styles.statusBloqueado;
              nomeIcone = "lock";
            } else {
              textoStatus = "Status: Ativo";
              estiloStatus = styles.statusAtivo;
              nomeIcone = "lock-open";
            }

            let exibicaoEmail = "";
            if (item.email) {
              exibicaoEmail = item.email;
            } else {
              exibicaoEmail = "Usuário sem e-mail";
            }

            return (
              <View style={[styles.itemCliente, { borderBottomColor: theme.border }]}>
                <View style={styles.infoContainer}>
                  <Text style={[styles.txtNomeCliente, { color: theme.primary }]} numberOfLines={1}>
                    {exibicaoEmail}
                  </Text>
                  <Text style={[styles.txtStatusCliente, estiloStatus]}>
                    {textoStatus}
                  </Text>
                </View>

                <IconButton 
                  icon={nomeIcone} 
                  iconColor={theme.primary} 
                  size={24} 
                  onPress={() => alternarBanimento(item.id, item.banido)} 
                />
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.vazioContainer}>
              <IconButton
                icon="account-remove"
                iconColor={theme.primary}
                size={80}
                style={styles.iconeVazio}
              />
              <Text style={[styles.txtVazio, { color: theme.primary }]}>Não existem clientes cadastrados</Text>
            </View>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  txt: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 50,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 6,
    letterSpacing: 2,
   
  },
  container: {
    flex: 1,
    paddingTop: 40,
  },
  cardContainer: {
    flex: 1,
    width: '100%',
  },
  itemCliente: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    marginHorizontal: 20,
    paddingHorizontal: 15,
    paddingVertical: 16,
  },
  infoContainer: {
    flex: 1,
    marginRight: 10,
  },
  txtNomeCliente: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  txtStatusCliente: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: 'bold',
  },
  statusAtivo: {
    color: '#E84890',
  },
  statusBloqueado: {
    color: '#C93678',
  },
  vazioContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  iconeVazio: {
    marginBottom: 10,
    opacity: 0.8,
  },
  txtVazio: {
    fontSize: 18,
    fontStyle: 'italic',
    textAlign: 'center',
    opacity: 0.8,
  }
});