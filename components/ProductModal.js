import React from "react";
import { Modal, View, Text, Image, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useProducts } from "../context/ProductContext";
import { useTheme } from "../context/ThemeContext";

export default function ProductModal({ product, visible, onClose }) {

  if (!product) return null;

  const { isFavorite, addFavorite, removeFavorite, isInCart, addToCart, removeFromCart } = useProducts();
  const { theme } = useTheme();

  const imageSource = product.imagem
    ? { uri: product.imagem }
    : product.image;

  const nome = product.nome || product.name;
  const tamanho = product.tamanho || product.size;
  const preco = product.price
    ? product.price
    : `R$ ${Number(product.valor).toFixed(2).replace(".", ",")}`;

  const descricao = product.descricao || null;
  const productId = product.id;
  const favorited = isFavorite(productId);
  const inCart = isInCart(productId);

  function toggleFavorite() {
    if (favorited) {
      removeFavorite(productId);
    } else {
      addFavorite(product);
    }
  }

  function toggleCart() {
    if (inCart) {
      removeFromCart(productId);
    } else {
      addToCart(product);
    }
  }

  return (
    <Modal visible={visible} animationType="slide">

      <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>

        <Image source={imageSource} style={styles.image} />
        <Text style={[styles.name, { color: theme.primary }]}>{nome}</Text>
        <Text style={[styles.size, { color: theme.accent }]}>{tamanho}</Text>
        <Text style={[styles.price, { color: theme.primary }]}>{preco}</Text>

        {descricao && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>Descricao</Text>
            <Text style={[styles.description, { color: theme.textSecondary }]}>{descricao}</Text>
          </View>
        )}

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.accent }, favorited && [styles.actionButtonActive, { backgroundColor: theme.primary }]]}
            onPress={toggleFavorite}
          >
            <Text style={styles.actionButtonText}>
              {favorited ? "Favoritado" : "Favoritar"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.accent }, inCart && [styles.actionButtonActive, { backgroundColor: theme.primary }]]}
            onPress={toggleCart}
          >
            <Text style={styles.actionButtonText}>
              {inCart ? "No Carrinho" : "Carrinho"}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.closeButton, { backgroundColor: theme.primary }]} onPress={onClose}>
          <Text style={styles.closeText}>Sair</Text>
        </TouchableOpacity>

      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    padding: 20,
  },

  image: {
    width: "100%",
    height: 430,
    borderRadius: 25,
  },

  name: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 20,
  },

  size: {
    fontSize: 18,
    marginTop: 10,
  },

  price: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
  },

  section: {
    marginTop: 15,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
  },

  description: {
    fontSize: 16,
    fontStyle: "italic",
    lineHeight: 22,
  },

  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
    gap: 12,
  },

  actionButton: {
    flex: 1,
    padding: 14,
    borderRadius: 30,
    alignItems: "center",
  },

  actionButtonActive: {
  },

  actionButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
  },

  closeButton: {
    padding: 16,
    borderRadius: 30,
    marginTop: 20,
    marginBottom: 40,
    alignItems: "center",
  },

  closeText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

});