import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { IconButton } from "react-native-paper";
import { auth } from "../../../Firebase/firebaseConfig";
import { signOut } from "firebase/auth";

export default function ADM({ navigation }) {
  function handleLogout() {
    signOut(auth).then(() => {
      navigation.navigate('Login');
    });
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View />
        <IconButton
          icon="logout"
          iconColor="#e58aaa"
          size={24}
          onPress={handleLogout}
        />
      </View>
      <Text style={styles.txt}>PAINEL ADM</Text>

      <View style={styles.grid}>
        
        <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => navigation.navigate('GerenciarCliente')}>
          <IconButton icon="account-group" iconColor="#E84890" size={40} pointerEvents="none" />
          <Text style={styles.cardTxt}>Gerenciar Clientes</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.card} 
          activeOpacity={0.7}
          onPress={() => navigation.navigate('SalgadosPacotes')}
        >
          <IconButton icon="package-variant-closed" iconColor="#E84890" size={40} pointerEvents="none" />
          <Text style={styles.cardTxt}>Gerenciar Produtos</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cardLargo} activeOpacity={0.7} onPress={() => navigation.navigate('GerenciarVendas')}>
          <IconButton icon="cash-register" iconColor="#E84890" size={40} pointerEvents="none" />
          <Text style={styles.cardTxt}>Controle de Vendas</Text>
        </TouchableOpacity>

      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  txt: {
    fontSize: 46,
    fontWeight: 'bold',
    color: '#E84890',
    textAlign: 'center',
    marginBottom: 40,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 6,
    letterSpacing: 2,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#202040',
    paddingTop: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 300,
    gap: 15,
    paddingHorizontal: 10,
  },
  card: {
    backgroundColor: '#34345C',
    width: '47%',
    height: 140,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  cardLargo: {
    backgroundColor: '#34345C',
    width: '100%',
    height: 120,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  cardTxt: {
    color: '#F8F8F8',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  }
});