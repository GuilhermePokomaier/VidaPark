import { View, Text, TextInput, StyleSheet, Image, Alert, TouchableOpacity } from 'react-native';
import { Button } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { db as database } from '../../../Firebase/firebaseConfig';
import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { imagemParaDataUri } from "../utils/imagem";

// ─────────────────────────────────────────────
// PALETA "VIDA PARK"
// ─────────────────────────────────────────────
const COLORS = {
  azulVidaPark: "#202040",
  rosaVidaPark: "#E84890",
  branco: "#F8F8F8",
  rosaClaro: "#F7A8C8",
  azulSuave: "#34345C",
  rosaEscuro: "#C93678",
  textoSecundario: "#6B6B85",
  textoMutado: "#B3B3C6",
  bordaClara: "#EDEDF2",
  verdeSucesso: "#2E9E5B",
  verdeFundo: "#E4F5EA",
  laranjaAviso: "#D98A1F",
  laranjaFundo: "#FCEFD9",
};

export default function EditProduct({ navigation, route }) {
    const { produtoId } = route.params;

    const [carregando, setCarregando] = useState(true);
    const [nome, setNome] = useState('');
    const [valor, setValor] = useState('');
    const [descricao, setDescricao] = useState('');
    const [imagem, setImagem] = useState(null);

    useEffect(() => {
        async function carregarProduto() {
            try {
                const snap = await getDoc(doc(database, 'salgados', produtoId));
                if (snap.exists()) {
                    const dados = snap.data();
                    setNome(dados.nome || '');
                    setValor(String(dados.valor ?? ''));
                    setDescricao(dados.descricao || '');
                    setImagem(dados.imagem || null);
                }
            } catch (error) {
                console.log('erro ao carregar produto', error);
                Alert.alert('Erro', 'Não foi possível carregar o produto.');
            } finally {
                setCarregando(false);
            }
        }
        carregarProduto();
    }, [produtoId]);

    const escolherImagem = async () => {
        let resultado = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.2,
            width: 400,
            height: 400,
        });

        if (!resultado.canceled) {
            setImagem(resultado.assets[0].uri);
        }
    };

    const Salvar = async () => {
        try {
            let imagemBase64 = imagem;

            if (imagem && imagem.startsWith('file://')) {
                imagemBase64 = await imagemParaDataUri(imagem);
            }

            await updateDoc(doc(database, 'salgados', produtoId), {
                nome,
                valor: parseFloat(String(valor).replace(',', '.')),
                descricao,
                imagem: imagemBase64
            });

            Alert.alert('Sucesso', 'Produto atualizado com sucesso!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);

        } catch (error) {
            console.log('erro ao atualizar', error);
            Alert.alert('Erro', 'Não foi possível atualizar o produto.');
        }
    };

    const renderizarTextoBotao = () => {
        return imagem ? 'Trocar Imagem' : 'Selecionar Imagem da Galeria';
    };

    if (carregando) {
        return (
            <View style={styles.container}>
                <Text style={styles.txt}>Carregando...</Text>
            </View>
        );
    }
    return (
        <View style={styles.container}>
            <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
                accessibilityRole="button"
                accessibilityLabel="Voltar"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <Ionicons name="chevron-back" size={26} color={COLORS.rosaVidaPark} />
            </TouchableOpacity>

            <Text style={styles.txt}>Editar Produto</Text>
            
            <TextInput style={styles.barra} placeholder="Nome" value={nome} onChangeText={setNome} placeholderTextColor={COLORS.textoMutado} />
            <TextInput style={styles.barra} placeholder="Valor" value={valor} onChangeText={setValor} placeholderTextColor={COLORS.textoMutado} />
            <TextInput style={styles.barra} placeholder="Descrição" value={descricao} onChangeText={setDescricao} placeholderTextColor={COLORS.textoMutado} />

            <Button 
                style={styles.GaleriaButton} 
                buttonColor={COLORS.rosaEscuro} 
                textColor={COLORS.branco} 
                mode='contained' 
                onPress={escolherImagem}
            >
                {renderizarTextoBotao()}
            </Button>

            {imagem && (
                <Image source={{ uri: imagem }} style={styles.Previa} />
            )}

            <View style={styles.colunaBotoes}>
                <Button style={styles.button} buttonColor={COLORS.rosaVidaPark} textColor={COLORS.branco} mode='contained' onPress={Salvar}>Salvar</Button>
                <Button style={styles.button} buttonColor={COLORS.azulSuave} textColor={COLORS.rosaClaro} mode='contained' onPress={() => navigation.goBack()}>Voltar</Button>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    txt: {
        fontSize: 36,  
        fontWeight: 'bold',
        fontStyle: 'italic',
        color: COLORS.rosaVidaPark,
        textAlign: 'center',
        marginBottom: 30,
        textShadowColor: 'rgba(0, 0, 0, 0.9)',
        textShadowOffset: { width: 3, height: 3 },
        textShadowRadius: 6,
        letterSpacing: 2,
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.azulVidaPark,
    },
    backButton: {
        position: 'absolute',
        top: 40,
        left: 20,
        zIndex: 10,
        padding: 6,
    },
    GaleriaButton: {
        width: 280,
        marginVertical: 8,
        borderRadius: 12,
    },
    Previa: {
        width: 100,
        height: 100,
        borderRadius: 10,
        marginVertical: 10,
        borderWidth: 1,
        borderColor: COLORS.rosaClaro
    },
    button: {
        width: '100%',
        borderRadius: 12,
    },
    colunaBotoes: {
        flexDirection: 'column',
        width: 280,
        marginTop: 10,
        gap: 12,
    },
    barra: {
        width: 280,
        padding: 12,
        borderRadius: 12,
        marginVertical: 8,
        backgroundColor: COLORS.azulSuave,
        borderWidth: 1,
        borderColor: COLORS.rosaEscuro,
        alignSelf: 'center',
        color: COLORS.branco,
    },
    picker: {
        width: '100%',
        height: 50,
        color: COLORS.rosaVidaPark,
        backgroundColor: COLORS.azulSuave,
    },
    itemPicker: {
        backgroundColor: COLORS.azulSuave,
        color: COLORS.branco,
    }
});