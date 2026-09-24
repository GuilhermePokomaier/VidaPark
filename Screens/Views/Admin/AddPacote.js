import {View,  Text,  TextInput,  StyleSheet,  Image,  Alert,  ScrollView,  Switch,} from "react-native";
import { Button } from "react-native-paper";
import { db } from "../../../Firebase/firebaseConfig";
import { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";

export default function AddPacote({ navigation, route }) {
    const { aoSalvar } = route.params || {};

    const [nome, setNome] = useState("");
    const [precoInicial, setPrecoInicial] = useState("");
    const [descricao, setDescricao] = useState("");
    const [maxConvidados, setMaxConvidados] = useState("");
    const [duracaoHoras, setDuracaoHoras] = useState("");
    const [ambiente, setAmbiente] = useState("");

    const [destaques, setDestaques] = useState("");
    const [inclui, setInclui] = useState("");
    const [estrutura, setEstrutura] = useState("");
    const [regras, setRegras] = useState("");

    const [popular, setPopular] = useState(false);
    const [disponivel, setDisponivel] = useState(true);

    const [imagem, setImagem] = useState(null);


    const escolherImagem = async () => {
        try {
            const permissao =
                await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!permissao.granted) {
                Alert.alert(
                    "Permissão necessária",
                    "É necessário permitir o acesso à galeria para selecionar uma imagem."
                );
                return;
            }

            const resultado =
                await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ["images"],
                    allowsEditing: true,
                    aspect: [16, 9],
                    quality: 0.5,
                });

            if (!resultado.canceled && resultado.assets?.length > 0) {
                setImagem(resultado.assets[0].uri);
            }
        } catch (error) {
            console.log("Erro ao selecionar imagem:", error);

            Alert.alert(
                "Erro",
                "Não foi possível selecionar a imagem."
            );
        }
    };

  

    const converterImagemParaBase64 = async (uri) => {
        try {
            const response = await fetch(uri);

            if (!response.ok) {
                throw new Error(
                    "Não foi possível carregar a imagem."
                );
            }

            const blob = await response.blob();

            return new Promise((resolve, reject) => {
                const reader = new FileReader();

                reader.onloadend = () => {
                    resolve(reader.result);
                };

                reader.onerror = () => {
                    reject(
                        new Error("Erro ao converter a imagem.")
                    );
                };

                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.log("Erro ao converter imagem:", error);
            throw error;
        }
    };

   

    const converterLista = (texto) => {
        return texto
            .split("\n")
            .map((item) => item.trim())
            .filter((item) => item.length > 0);
    };

    
    const cadastrarPacote = async () => {
        try {
            if (!nome.trim()) {
                Alert.alert(
                    "Erro",
                    "Digite o nome do pacote."
                );
                return;
            }

            if (!precoInicial.trim()) {
                Alert.alert(
                    "Erro",
                    "Digite o preço inicial do pacote."
                );
                return;
            }

            const preco = parseFloat(
                precoInicial.replace(",", ".")
            );

            if (isNaN(preco) || preco < 0) {
                Alert.alert(
                    "Erro",
                    "Digite um preço válido.\n\nExemplo: 1500,00"
                );
                return;
            }

            let imagemBase64 = null;

            if (imagem) {
                imagemBase64 =
                    await converterImagemParaBase64(imagem);
            }

            const pacote = {
                nome: nome.trim(),

                precoInicial: preco,

                descricao: descricao.trim(),

                maxConvidados: maxConvidados
                    ? Number(maxConvidados)
                    : null,

                duracaoHoras: duracaoHoras
                    ? Number(duracaoHoras)
                    : null,

                ambiente: ambiente.trim(),

                popular,

                disponivel,

                imagem: imagemBase64,

                imagens: imagemBase64
                    ? [imagemBase64]
                    : [],

                destaques: converterLista(destaques),

                inclui: converterLista(inclui),

                estrutura: converterLista(estrutura),

                regras: converterLista(regras),

                criadoEm: new Date().toISOString(),
            };

            console.log(
                "Pacote que será cadastrado:",
                pacote
            );

            const referencia = await addDoc(
                collection(db, "pacotes"),
                pacote
            );

            console.log(
                "Pacote cadastrado com ID:",
                referencia.id
            );

            Alert.alert(
                "Sucesso",
                "Pacote cadastrado com sucesso!",
                [
                    {
                        text: "OK",
                        onPress: () => {
                            navigation.goBack();

                            if (aoSalvar) {
                                setTimeout(() => {
                                    aoSalvar();
                                }, 100);
                            }
                        },
                    },
                ]
            );
        } catch (error) {
            console.log(
                "ERRO AO CADASTRAR PACOTE:",
                error
            );

            Alert.alert(
                "Erro ao cadastrar",
                error.message ||
                    "Não foi possível cadastrar o pacote."
            );
        }
    };

    return (
        <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
        >
            <Text style={styles.txt}>
                Adicionar Pacote
            </Text>

            <TextInput
                style={styles.barra}
                placeholder="Nome do pacote"
                value={nome}
                onChangeText={setNome}
                placeholderTextColor="#e58aaa"
            />

            <TextInput
                style={styles.barra}
                placeholder="Preço inicial"
                value={precoInicial}
                onChangeText={setPrecoInicial}
                placeholderTextColor="#e58aaa"
                keyboardType="decimal-pad"
            />

            <TextInput
                style={styles.barra}
                placeholder="Máximo de convidados"
                value={maxConvidados}
                onChangeText={setMaxConvidados}
                placeholderTextColor="#e58aaa"
                keyboardType="numeric"
            />

            <TextInput
                style={styles.barra}
                placeholder="Duração em horas"
                value={duracaoHoras}
                onChangeText={setDuracaoHoras}
                placeholderTextColor="#e58aaa"
                keyboardType="numeric"
            />

            <TextInput
                style={styles.barra}
                placeholder="Ambiente"
                value={ambiente}
                onChangeText={setAmbiente}
                placeholderTextColor="#e58aaa"
            />

            <TextInput
                style={[styles.barra, styles.textArea]}
                placeholder="Descrição"
                value={descricao}
                onChangeText={setDescricao}
                placeholderTextColor="#e58aaa"
                multiline
            />

            <Text style={styles.subtitulo}>
                Destaques
            </Text>

            <Text style={styles.ajuda}>
                Digite um item por linha
            </Text>

            <TextInput
                style={[styles.barra, styles.textArea]}
                placeholder={"Ex:\nEspaço climatizado\nDecoração inclusa\nEquipe especializada"}
                value={destaques}
                onChangeText={setDestaques}
                placeholderTextColor="#e58aaa"
                multiline
            />

            <Text style={styles.subtitulo}>
                O que inclui
            </Text>

            <TextInput
                style={[styles.barra, styles.textArea]}
                placeholder={"Ex:\nBuffet\nBebidas\nDecoração"}
                value={inclui}
                onChangeText={setInclui}
                placeholderTextColor="#e58aaa"
                multiline
            />

            <Text style={styles.subtitulo}>
                Estrutura
            </Text>

            <TextInput
                style={[styles.barra, styles.textArea]}
                placeholder={"Ex:\nMesas e cadeiras\nSom\nIluminação"}
                value={estrutura}
                onChangeText={setEstrutura}
                placeholderTextColor="#e58aaa"
                multiline
            />

            <Text style={styles.subtitulo}>
                Regras
            </Text>

            <TextInput
                style={[styles.barra, styles.textArea]}
                placeholder={"Ex:\nNão é permitido fumar\nHorário máximo do evento"}
                value={regras}
                onChangeText={setRegras}
                placeholderTextColor="#e58aaa"
                multiline
            />

            <View style={styles.switchContainer}>
                <Text style={styles.switchText}>
                    Pacote popular
                </Text>

                <Switch
                    value={popular}
                    onValueChange={setPopular}
                    trackColor={{
                        false: "#34345C",
                        true: "#F7A8C8",
                    }}
                    thumbColor={
                        popular
                            ? "#E84890"
                            : "#F8F8F8"
                    }
                />
            </View>

            <View style={styles.switchContainer}>
                <Text style={styles.switchText}>
                    Pacote disponível
                </Text>

                <Switch
                    value={disponivel}
                    onValueChange={setDisponivel}
                    trackColor={{
                        false: "#34345C",
                        true: "#F7A8C8",
                    }}
                    thumbColor={
                        disponivel
                            ? "#E84890"
                            : "#F8F8F8"
                    }
                />
            </View>

            <Button
                style={styles.GaleriaButton}
                buttonColor="#F7A8C8"
                textColor="#8b3151"
                mode="contained"
                onPress={escolherImagem}
            >
                {imagem
                    ? "Trocar Imagem"
                    : "Selecionar Imagem da Galeria"}
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
                    textColor="#ffffff"
                    mode="contained"
                    onPress={cadastrarPacote}
                >
                    Cadastrar
                </Button>

                <Button
                    style={styles.button}
                    buttonColor="#F7A8C8"
                    textColor="#8b3151"
                    mode="contained"
                    onPress={() =>
                        navigation.goBack()
                    }
                >
                    Voltar
                </Button>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scroll: {
        flex: 1,
        backgroundColor: "#202040",
    },

    container: {
        alignItems: "center",
        padding: 20,
        paddingTop: 50,
        paddingBottom: 40,
    },

    txt: {
        fontSize: 34,
        fontWeight: "bold",
        color: "#E84890",
        textAlign: "center",
        marginBottom: 25,
        textShadowColor: "rgba(0, 0, 0, 0.4)",
        textShadowOffset: {
            width: 3,
            height: 3,
        },
        textShadowRadius: 6,
        letterSpacing: 2,
    },

    barra: {
        width: 280,
        padding: 12,
        borderRadius: 12,
        marginVertical: 8,
        backgroundColor: "#34345C",
        borderWidth: 1,
        borderColor: "#E84890",
        color: "#F8F8F8",
    },

    textArea: {
        minHeight: 100,
        textAlignVertical: "top",
    },

    subtitulo: {
        width: 280,
        color: "#F7A8C8",
        fontSize: 18,
        fontWeight: "bold",
        marginTop: 15,
    },

    ajuda: {
        width: 280,
        color: "#B3B3C6",
        fontSize: 12,
        marginBottom: 3,
    },

    switchContainer: {
        width: 280,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginVertical: 8,
        paddingHorizontal: 5,
    },

    switchText: {
        color: "#F8F8F8",
        fontSize: 16,
    },

    GaleriaButton: {
        width: 280,
        marginVertical: 12,
        borderRadius: 12,
    },

    Previa: {
        width: 180,
        height: 110,
        borderRadius: 10,
        marginVertical: 10,
        borderWidth: 1,
        borderColor: "#F7A8C8",
    },

    colunaBotoes: {
        flexDirection: "column",
        width: 280,
        marginTop: 10,
        gap: 12,
    },

    button: {
        width: "100%",
        borderRadius: 12,
    },
});