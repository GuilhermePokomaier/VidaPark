import { TouchableOpacity, Image, StyleSheet, View, Text } from "react-native";
import { useTheme } from "../context/ThemeContext";

export default function ProductCard({ product, onPress }) {
  const { theme } = useTheme();

  const imageSource = product.imagem
    ? { uri: product.imagem }
    : product.image;

  const nome = product.nome || product.name;
  const preco = product.price
    ? product.price
    : `R$ ${Number(product.valor).toFixed(2).replace(".", ",")}`;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.surface }]}
      activeOpacity={0.8}
      onPress={() => onPress({...product, nome, preco})}
    >
      <Image source={imageSource} style={styles.image}/>
      <View style={styles.info}>
        <Text style={[styles.name, { color: theme.primary }]}>{nome}</Text>
        <Text style={[styles.price, { color: theme.primary }]}>{preco}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card:{
    flex:1,
    margin:8,
    borderRadius:18,
    padding:8,
    shadowColor:"#000",
    shadowOffset:{ width:0, height:3 },
    shadowOpacity:0.15,
    shadowRadius:5,
    elevation:5,
  },
  image:{
    width:"100%",
    height:180,
    borderRadius:15,
  },
  info:{
    padding:8,
  },
  name:{
    fontSize:16,
    fontWeight:"bold",
  },
  price:{
    marginTop:5,
    fontSize:16,
    fontWeight:"bold",
  },
});