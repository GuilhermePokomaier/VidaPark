import { View,Text,TextInput,StyleSheet,Image,Alert,ScrollView,Switch,TouchableOpacity,KeyboardAvoidingView,Platform} from "react-native";
import { Button } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { db } from "../../../Firebase/firebaseConfig";
import { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import { imagemParaDataUri } from "../utils/imagem";

const converterLista = (texto) => {
    return texto
        .split("\n")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
};

/* Seção recolhível para os campos de lista (um item por linha).
   Fica fora do AddPacote para não ser recriada a cada digitação. */
function SecaoLista({
    titulo,
    valor,
    onChange,
    placeholder,
    aberto,
    onToggle,
}) {
    const qtd = converterLista(valor).length;

    const resumo = //Operador ternário para exibir a quantidade de itens ou "Opcional" se não houver nenhum.
        qtd === 0 ? "Opcional" : qtd === 1 ? "1 item" : `${qtd} itens`;

    return (
        <View style={styles.secao}> 
            <TouchableOpacity
                style={styles.secaoCabecalho}
                onPress={onToggle}
                activeOpacity={0.7}
            >
                <Text style={styles.secaoTitulo}>{titulo}</Text>

                <View style={styles.secaoDireita}>
                    <Text style={styles.secaoResumo}>{resumo}</Text>
                    <Ionicons
                        name={aberto ? "chevron-up" : "chevron-down"}
                        size={18}
                        color="#F7A8C8"
                    />
                </View>
            </TouchableOpacity>

            
            {aberto && ( //renderização condicional.
                <View style={styles.secaoCorpo}>
                    <Text style={styles.ajuda}>Digite um item por linha</Text>

                    <TextInput
                        style={[styles.barra, styles.textArea]}
                        placeholder={placeholder}
                        value={valor}
                        onChangeText={onChange}
                        placeholderTextColor="#e58aaa"
                        multiline
                        autoFocus
                    />
                </View>
            )}
        </View>
    );
}

export default function AddPacote({ navigation }) {

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

    // Controla quais seções de lista estão abertas
    const [abertas, setAbertas] = useState({
        destaques: false,
        inclui: false,
        estrutura: false,
        regras: false,
    });

    const alternarSecao = (chave) =>
        setAbertas((anterior) => ({
            ...anterior,
            [chave]: !anterior[chave],
        }));

    const escolherImagem = async () => {
        try {
            const permissao =
                await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!permissao.granted) { //permissão negada, exibe alerta e retorna.
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

    const converterImagemParaBase64 = imagemParaDataUri;

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
                            navigation.goBack(); // a lista recarrega sozinha ao ganhar foco
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
        <KeyboardAvoidingView
            style={styles.raiz}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
                accessibilityRole="button"
                accessibilityLabel="Voltar"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <Ionicons name="chevron-back" size={26} color="#E84890" />
            </TouchableOpacity>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.conteudo}>
                    <Text style={styles.txt}>Adicionar Pacote</Text>

                    {/* IMAGEM DE CAPA */}
                    <TouchableOpacity
                        style={styles.imagemBox}
                        onPress={escolherImagem}
                        activeOpacity={0.8}
                    >
                        {imagem ? (
                            <>
                                <Image
                                    source={{ uri: imagem }}
                                    style={styles.imagemPreview}
                                />

                                <View style={styles.imagemBadge}>
                                    <Ionicons
                                        name="camera"
                                        size={14}
                                        color="#F8F8F8"
                                    />
                                    <Text style={styles.imagemBadgeTxt}>
                                        Trocar
                                    </Text>
                                </View>
                            </>
                        ) : (
                            <>
                                <Ionicons
                                    name="image-outline"
                                    size={32}
                                    color="#F7A8C8"
                                />
                                <Text style={styles.imagemTxt}>
                                    Adicionar imagem de capa
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* DADOS PRINCIPAIS */}
                    <TextInput
                        style={[styles.barra, styles.espaco]}
                        placeholder="Nome do pacote"
                        value={nome}
                        onChangeText={setNome}
                        placeholderTextColor="#e58aaa"
                    />

                    <View style={styles.linha}>
                        <TextInput
                            style={[styles.barra, styles.metade]}
                            placeholder="Preço inicial"
                            value={precoInicial}
                            onChangeText={setPrecoInicial}
                            placeholderTextColor="#e58aaa"
                            keyboardType="decimal-pad"
                        />

                        <TextInput
                            style={[styles.barra, styles.metade]}
                            placeholder="Máx. convidados"
                            value={maxConvidados}
                            onChangeText={setMaxConvidados}
                            placeholderTextColor="#e58aaa"
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={styles.linha}>
                        <TextInput
                            style={[styles.barra, styles.metade]}
                            placeholder="Duração (horas)"
                            value={duracaoHoras}
                            onChangeText={setDuracaoHoras}
                            placeholderTextColor="#e58aaa"
                            keyboardType="numeric"
                        />

                        <TextInput
                            style={[styles.barra, styles.metade]}
                            placeholder="Ambiente"
                            value={ambiente}
                            onChangeText={setAmbiente}
                            placeholderTextColor="#e58aaa"
                        />
                    </View>

                    <TextInput
                        style={[
                            styles.barra,
                            styles.textArea,
                            styles.espaco,
                        ]}
                        placeholder="Descrição"
                        value={descricao}
                        onChangeText={setDescricao}
                        placeholderTextColor="#e58aaa"
                        multiline
                    />

                    {/* LISTAS (RECOLHÍVEIS) */}
                    <SecaoLista
                        titulo="Destaques"
                        valor={destaques}
                        onChange={setDestaques}
                        placeholder={
                            "Ex:\nEspaço climatizado\nDecoração inclusa\nEquipe especializada"
                        }
                        aberto={abertas.destaques}
                        onToggle={() => alternarSecao("destaques")}
                    />

                    <SecaoLista
                        titulo="O que inclui"
                        valor={inclui}
                        onChange={setInclui}
                        placeholder={"Ex:\nBuffet\nBebidas\nDecoração"}
                        aberto={abertas.inclui}
                        onToggle={() => alternarSecao("inclui")}
                    />

                    <SecaoLista
                        titulo="Estrutura"
                        valor={estrutura}
                        onChange={setEstrutura}
                        placeholder={
                            "Ex:\nMesas e cadeiras\nSom\nIluminação"
                        }
                        aberto={abertas.estrutura}
                        onToggle={() => alternarSecao("estrutura")}
                    />

                    <SecaoLista
                        titulo="Regras"
                        valor={regras}
                        onChange={setRegras}
                        placeholder={
                            "Ex:\nNão é permitido fumar\nHorário máximo do evento"
                        }
                        aberto={abertas.regras}
                        onToggle={() => alternarSecao("regras")}
                    />

                    {/* SWITCHES */}
                    <View style={styles.switchLinha}>
                        <View style={styles.switchCard}>
                            <Text style={styles.switchText}>Popular</Text>

                            <Switch
                                value={popular}
                                onValueChange={setPopular}
                                trackColor={{
                                    false: "#34345C",
                                    true: "#F7A8C8",
                                }}
                                thumbColor={
                                    popular ? "#E84890" : "#F8F8F8"
                                }
                            />
                        </View>

                        <View style={styles.switchCard}>
                            <Text style={styles.switchText}>Disponível</Text>

                            <Switch
                                value={disponivel}
                                onValueChange={setDisponivel}
                                trackColor={{
                                    false: "#34345C",
                                    true: "#F7A8C8",
                                }}
                                thumbColor={
                                    disponivel ? "#E84890" : "#F8F8F8"
                                }
                            />
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* BOTÕES FIXOS NO RODAPÉ */}
            <View style={styles.rodape}>
                <Button
                    style={styles.botaoVoltar}
                    buttonColor="#F7A8C8"
                    textColor="#8b3151"
                    mode="contained"
                    onPress={() => navigation.goBack()}
                >
                    Voltar
                </Button>

                <Button
                    style={styles.botaoCadastrar}
                    buttonColor="#E84890"
                    textColor="#ffffff"
                    mode="contained"
                    onPress={cadastrarPacote}
                >
                    Cadastrar
                </Button>
            </View>
        </KeyboardAvoidingView>
    );
}

// Estilos (não importante para a lógica, mas mantém a aparência do app)

const styles = StyleSheet.create({
    raiz: {
        flex: 1,
        backgroundColor: "#202040",
    },

    backButton: {
        position: "absolute",
        top: 40,
        left: 16,
        zIndex: 10,
        padding: 6,
    },

    scroll: {
        flex: 1,
    },

    container: {
        alignItems: "center",
        padding: 20,
        paddingTop: 40,
        paddingBottom: 24,
    },

    conteudo: {
        width: "100%",
        maxWidth: 480,
    },

    txt: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#E84890",
        textAlign: "center",
        marginBottom: 20,
        textShadowColor: "rgba(0, 0, 0, 0.4)",
        textShadowOffset: {
            width: 3,
            height: 3,
        },
        textShadowRadius: 6,
        letterSpacing: 1,
    },

    /* IMAGEM */
    imagemBox: {
        width: "100%",
        aspectRatio: 16 / 9,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E84890",
        backgroundColor: "#34345C",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        marginBottom: 12,
    },

    imagemPreview: {
        width: "100%",
        height: "100%",
    },

    imagemTxt: {
        color: "#F7A8C8",
        fontSize: 14,
        marginTop: 6,
    },

    imagemBadge: {
        position: "absolute",
        right: 8,
        bottom: 8,
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "rgba(0,0,0,0.6)",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 14,
    },

    imagemBadgeTxt: {
        color: "#F8F8F8",
        fontSize: 12,
        fontWeight: "600",
    },

    /* CAMPOS */
    barra: {
        padding: 12,
        borderRadius: 12,
        backgroundColor: "#34345C",
        borderWidth: 1,
        borderColor: "#E84890",
        color: "#F8F8F8",
        fontSize: 14,
    },

    espaco: {
        marginBottom: 12,
    },

    linha: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 12,
    },

    metade: {
        flex: 1,
    },

    textArea: {
        minHeight: 80,
        textAlignVertical: "top",
    },

    /* SEÇÕES RECOLHÍVEIS */
    secao: {
        backgroundColor: "rgba(52, 52, 92, 0.5)",
        borderWidth: 1,
        borderColor: "#33335C",
        borderRadius: 12,
        marginBottom: 10,
        overflow: "hidden",
    },

    secaoCabecalho: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingVertical: 14,
    },

    secaoTitulo: {
        color: "#F7A8C8",
        fontSize: 16,
        fontWeight: "bold",
    },

    secaoDireita: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },

    secaoResumo: {
        color: "#B3B3C6",
        fontSize: 12,
    },

    secaoCorpo: {
        paddingHorizontal: 12,
        paddingBottom: 12,
    },

    ajuda: {
        color: "#B3B3C6",
        fontSize: 12,
        marginBottom: 6,
    },

    /* SWITCHES */
    switchLinha: {
        flexDirection: "row",
        gap: 12,
        marginTop: 6,
    },

    switchCard: {
        flex: 1,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "rgba(52, 52, 92, 0.5)",
        borderWidth: 1,
        borderColor: "#33335C",
        borderRadius: 12,
        paddingLeft: 12,
        paddingRight: 6,
        paddingVertical: 4,
    },

    switchText: {
        color: "#F8F8F8",
        fontSize: 14,
    },

    /* RODAPÉ */
    rodape: {
        flexDirection: "row",
        gap: 12,
        paddingHorizontal: 20,
        paddingVertical: 14,
        backgroundColor: "#202040",
        borderTopWidth: 1,
        borderTopColor: "#33335C",
    },

    botaoVoltar: {
        flex: 1,
        borderRadius: 12,
    },

    botaoCadastrar: {
        flex: 2,
        borderRadius: 12,
    },
});