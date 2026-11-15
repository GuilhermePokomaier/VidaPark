import { View, Text, TextInput, StyleSheet, Image, Alert, TouchableOpacity } from 'react-native';
import { Button } from 'react-native-paper';
import { Ionicons } from "@expo/vector-icons";
import { db as database } from '../../../Firebase/firebaseConfig';
import { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { imagemParaDataUri } from "../utils/imagem";

export default function AddProdutos({ navigation, route }) {

    const [nome, setNome] = useState('');
    const [valor, setValor] = useState('');
    const [descricao, setDescricao] = useState('');
    const [imagem, setImagem] = useState(null);

    const escolherImagem = async () => {

        try {
            const permissao =
                await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!permissao.granted) {
                Alert.alert(
                    'Permissão necessária',
                    'É necessário permitir o acesso à galeria para selecionar uma imagem.'
                );

                return;
            }
            // Abre a galeria
            const resultado =
                await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ['images'],
                    allowsEditing: true,
                    aspect: [1, 1],
                    quality: 0.5,
                });

            // Verifica se o usuário selecionou uma imagem
            if (!resultado.canceled && resultado.assets?.length > 0) {

                const uri = resultado.assets[0].uri;
                console.log('Imagem selecionada:', uri);
                setImagem(uri);
            }

        } catch (error) {

            console.log('Erro ao selecionar imagem:', error);

            Alert.alert(
                'Erro',
                'Não foi possível selecionar a imagem.'
            );
        }
    };

    const converterImagemParaBase64 = imagemParaDataUri;

    const CadastrarProdutos = async () => {

        try {
            console.log('Iniciando cadastro...');

            if (!nome.trim()) {

                Alert.alert(
                    'Erro',
                    'Digite o nome do produto.'
                );

                return;
            }

            if (!valor.trim()) {

                Alert.alert(
                    'Erro',
                    'Digite o valor do produto.'
                );

                return;
            }

            //Permite que o usuário digite o valor com vírgula ou ponto decimal, mas converte para ponto decimal para salvar no banco de dados. -gui
            const valorNumerico =
                parseFloat(
                    valor.replace(',', '.')
                );

            if (isNaN(valorNumerico)) {

                Alert.alert(
                    'Erro',
                    'Digite um valor válido.\n\nExemplo: 25,90'
                );

                return;
            }

            if (valorNumerico < 0) {

                Alert.alert(
                    'Erro',
                    'O valor não pode ser negativo.'
                );

                return;
            }

            let imagemBase64 = null;

            if (imagem) {

                console.log(
                    'Convertendo imagem...'
                );

                imagemBase64 =
                    await converterImagemParaBase64(
                        imagem
                    );

                console.log(
                    'Imagem convertida com sucesso.'
                );
            }

            const produto = {
                nome: nome.trim(),
                valor: valorNumerico,
                descricao: descricao.trim(),
                imagem: imagemBase64,
                criadoEm: new Date().toISOString(),
            };

            console.log(
                'Produto que será cadastrado:',
                produto
            );

            const referencia =
                await addDoc(
                    collection(
                        database,
                        'salgados'
                    ),
                    produto
                );

            console.log(
                'Produto cadastrado com ID:',
                referencia.id
            );

            setNome('');
            setValor('');
            setDescricao('');
            setImagem(null);

            Alert.alert(
                'Sucesso',
                'Produto cadastrado com sucesso!',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            navigation.goBack(); // a lista recarrega sozinha ao ganhar foco
                        },
                    },
                ]
            );

        } catch (error) {

            console.log(
                '================================'
            );

            console.log(
                'ERRO AO CADASTRAR PRODUTO:'
            );

            console.log(error);

            console.log(
                'Mensagem:',
                error.message
            );

            console.log(
                '================================'
            );

            Alert.alert(
                'Erro ao cadastrar',
                error.message ||
                'Não foi possível cadastrar o produto.'
            );
        }
    };

    const renderizarTextoBotao = () => {

        if (imagem) {
            return 'Trocar Imagem';
        }
        return 'Selecionar Imagem da Galeria';
    };

    return (

        <View style={styles.container}>

            <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
                accessibilityRole="button"
                accessibilityLabel="Voltar"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <Ionicons name="chevron-back" size={26} color="#E84890" />
            </TouchableOpacity>

            <Text style={styles.txt}>
                Adicionar Produtos
            </Text>

            <TextInput
                style={styles.barra}
                placeholder="Nome"
                value={nome}
                onChangeText={setNome}
                placeholderTextColor="#e58aaa"
            />

            <TextInput
                style={styles.barra}
                placeholder="Valor"
                value={valor}
                onChangeText={setValor}
                placeholderTextColor="#e58aaa"
                keyboardType="decimal-pad"
            />

            <TextInput
                style={styles.barra}
                placeholder="Descrição"
                value={descricao}
                onChangeText={setDescricao}
                placeholderTextColor="#e58aaa"
                multiline
            />

            <Button
                style={styles.GaleriaButton}
                buttonColor="#F7A8C8"
                textColor="#8b3151"
                mode="contained"
                onPress={escolherImagem}
            >
                {renderizarTextoBotao()}
            </Button>

            {imagem && (

                <Image
                    source={{ uri: imagem }}
                    style={styles.Previa}
                />
            )}

            <View style={styles.colunaBotoes}>

                <Button
                    style={styles.button}
                    buttonColor="#E84890"
                    textColor="#8b3151"
                    mode="contained"
                    onPress={CadastrarProdutos}
                >
                    Cadastrar
                </Button>

              
            </View>
        </View>
    );
}

const styles = StyleSheet.create({

    txt: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#E84890',
        textAlign: 'center',
        marginBottom: 30,
        textShadowColor: 'rgba(0, 0, 0, 0.4)',
        textShadowOffset: {
            width: 3,
            height: 3,
        },
        textShadowRadius: 6,
        letterSpacing: 2,
    },

    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#202040',
        padding: 20,
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
        borderColor: '#F7A8C8',
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
        backgroundColor: '#34345C',
        borderWidth: 1,
        borderColor: '#E84890',
        alignSelf: 'center',
        color: '#F8F8F8',
    },
});