import React, { useState, useEffect, useRef, useCallback } from "react";
import { WebView } from "react-native-webview";
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Alert, Image, ScrollView } from "react-native";
import * as Clipboard from "expo-clipboard";
import { auth, db } from "../../../Firebase/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { callFunction } from "../Checkout/mercadopago";

function formatMoney(value) {
  return `R$ ${Number(value || 0).toFixed(2).replace(".", ",")}`;
}

export default function Pagamento({ navigation, route }) {
  // Vem da tela Checkout: link de pagamento já criado (createPreference),
  // a referência externa pra consultar o status, o total e os dados
  // do pedido que serão gravados no Firestore assim que o pagamento
  // for confirmado.
  const { checkoutUrl: initialCheckoutUrl, externalRef, total, pedido, pixData } = route?.params || {};

  const [checkoutUrl, setCheckoutUrl] = useState(initialCheckoutUrl || null);
  const [paymentResult, setPaymentResult] = useState(null);
  const [polling, setPolling] = useState(false);
  const [salvandoPedido, setSalvandoPedido] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const pollingRef = useRef(null);

  useEffect(() => {
    if (!initialCheckoutUrl && !pixData) {
      Alert.alert(
        "Erro",
        "Não foi possível abrir o pagamento. Volte e tente novamente.",
        [{ text: "Voltar", onPress: () => navigation.goBack() }]
      );
      return;
    }

    // Se veio um pagamento Pix já criado, começa a checar o status
    // automaticamente em segundo plano.
    if (pixData?.paymentId) {
      startPixPolling(pixData.paymentId);
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startPixPolling(paymentId) {
    if (pollingRef.current) return;

    setPolling(true);

    let attempts = 0;
    const maxAttempts = 24; // ~2 minutos (5s de intervalo)

    pollingRef.current = setInterval(async () => {
      attempts++;

      try {
        const result = await callFunction("getPaymentStatus", { paymentId });

        if (result.success && result.payment?.status === "approved") {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
          setPolling(false);
          await finalizarComoAprovado(result.payment.id);
          return;
        }

        if (result.success && (result.payment?.status === "rejected" || result.payment?.status === "cancelled")) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
          setPolling(false);
          setPaymentResult({
            status: "rejected",
            statusDetail: result.payment.statusDetail || "Pagamento recusado ou cancelado",
            transactionAmount: total,
            paymentId,
          });
          return;
        }
      } catch (e) {
        console.log("Erro ao verificar Pix:", e);
      }

      if (attempts >= maxAttempts) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
        setPolling(false);
        setPaymentResult({
          status: "pending",
          statusDetail: "Pagamento ainda não confirmado. Verifique sua conta ou aguarde.",
          transactionAmount: total,
          paymentId,
        });
      }
    }, 5000);
  }

  async function copiarCodigoPix() {
    if (!pixData?.qrCode) return;
    await Clipboard.setStringAsync(pixData.qrCode);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  // Grava o pedido no Firestore só depois que o pagamento é confirmado.
  const salvarPedido = useCallback(
    async (statusPagamento, mpPaymentId) => {
      if (!pedido) return;

      try {
        setSalvandoPedido(true);

        await addDoc(collection(db, "pedidos"), {
          ...pedido,
          status: statusPagamento === "approved" ? "em_preparacao" : "aguardando_pagamento",
          mpPaymentId: mpPaymentId || null,
          mpExternalReference: externalRef || null,
          createdAt: serverTimestamp(),
        });
      } catch (e) {
        console.error("Erro ao salvar pedido:", e);
        Alert.alert(
          "Atenção",
          "O pagamento foi confirmado, mas houve um erro ao registrar seu pedido. Entre em contato com o suporte."
        );
      } finally {
        setSalvandoPedido(false);
      }
    },
    [pedido, externalRef]
  );

  const finalizarComoAprovado = useCallback(
    async (mpPaymentId) => {
      setCheckoutUrl(null);
      setPolling(false);
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }

      await salvarPedido("approved", mpPaymentId);

      setPaymentResult({
        status: "approved",
        statusDetail: "Pagamento aprovado",
        transactionAmount: total,
        paymentId: mpPaymentId || null,
      });
    },
    [salvarPedido, total]
  );

  async function verifyByPaymentId(paymentId) {
    try {
      setPolling(true);

      const result = await callFunction("getPaymentStatus", { paymentId });

      if (result.success && result.payment) {
        const p = result.payment;

        if (p.status === "approved") {
          await finalizarComoAprovado(p.id);
        } else {
          setCheckoutUrl(null);
          setPaymentResult({
            status: p.status,
            statusDetail: p.statusDetail || p.status,
            transactionAmount: total,
            paymentId: p.id,
          });
        }
      }
    } catch (error) {
      console.log("Erro ao verificar pagamento:", error);

      setCheckoutUrl(null);
      setPaymentResult({
        status: "pending",
        statusDetail: "Pagamento em processamento. Verifique sua conta.",
        transactionAmount: total,
        paymentId,
      });
    } finally {
      setPolling(false);
    }
  }

  async function verifyByExternalRef() {
    if (!externalRef) return false;

    try {
      const result = await callFunction("verifyPaymentByRef", { externalReference: externalRef });

      if (result.success && result.found && result.status === "approved") {
        await finalizarComoAprovado(result.mpId);
        return true;
      }

      return false;
    } catch (e) {
      console.log("Verify by ref error:", e);
      return false;
    }
  }

  function startVerification() {
    if (pollingRef.current) return;

    setPolling(true);

    let attempts = 0;
    const maxAttempts = 15; // ~75s de tentativas (5s de intervalo)

    pollingRef.current = setInterval(async () => {
      attempts++;

      if (attempts >= maxAttempts) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
        setPolling(false);
        setCheckoutUrl(null);

        setPaymentResult({
          status: "pending",
          statusDetail: "Pagamento ainda não confirmado. Verifique sua conta ou aguarde.",
          transactionAmount: total,
        });

        return;
      }

      const approved = await verifyByExternalRef();

      if (approved) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
        setPolling(false);
      }
    }, 5000);
  }

  const handleWebViewMessage = useCallback(
    (event) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);

        if (data.type === "checkout") {
          const status = data.status;
          const paymentId = data.paymentId || null;

          if (status === "success" || status === "approved") {
            if (paymentId) {
              verifyByPaymentId(paymentId);
            } else {
              startVerification();
            }
          } else if (status === "failure" || status === "rejected") {
            setCheckoutUrl(null);
            Alert.alert(
              "Pagamento recusado",
              "Tente novamente com outra forma de pagamento.",
              [{ text: "OK", onPress: () => navigation.goBack() }]
            );
          } else {
            startVerification();
          }
        }
      } catch (e) {
        console.log("Erro ao processar mensagem do WebView:", e);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [total]
  );

  function handleFinish() {
    setPaymentResult(null);
    navigation.navigate("MeusPedidos", { pedidoConfirmado: true });
  }

  if (paymentResult) {
    const status = paymentResult.status;

    return (
      <View style={styles.resultContainer}>
        {salvandoPedido ? (
          <ActivityIndicator size="large" color="#8b3151" />
        ) : (
          <>
            <Text style={[styles.resultIcon, status === "approved" ? styles.iconSuccess : styles.iconOther]}>
              {status === "approved" ? "\u2713" : "\u2717"}
            </Text>

            <Text style={styles.resultTitle}>
              {status === "approved"
                ? "Pagamento Aprovado!"
                : status === "pending"
                ? "Pagamento Pendente"
                : "Pagamento Recusado"}
            </Text>

            <Text style={styles.resultStatus}>{paymentResult.statusDetail}</Text>
            <Text style={styles.resultAmount}>{formatMoney(paymentResult.transactionAmount)}</Text>

            {status === "pending" && (
              <TouchableOpacity
                style={[styles.finishButton, { backgroundColor: "#e58aaa", marginBottom: 12 }]}
                onPress={() => {
                  setPaymentResult(null);
                  navigation.goBack();
                }}
              >
                <Text style={styles.finishButtonText}>Voltar ao Carrinho</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.finishButton} onPress={handleFinish}>
              <Text style={styles.finishButtonText}>Ver Meus Pedidos</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  }

  if (pixData && !checkoutUrl) {
    return (
      <View style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.headerBack}>Voltar</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Pagamento Pix</Text>

          <View style={{ width: 50 }} />
        </View>

        <ScrollView contentContainerStyle={styles.pixContent}>
          <Text style={styles.pixAmount}>{formatMoney(total)}</Text>

          {pixData.qrCodeBase64 ? (
            <Image
              source={{ uri: `data:image/png;base64,${pixData.qrCodeBase64}` }}
              style={styles.qrImage}
            />
          ) : (
            <Text style={styles.loadingText}>QR Code indisponível</Text>
          )}

          <Text style={styles.pixInstrucao}>
            Escaneie o QR Code no app do seu banco, ou copie o código Pix abaixo:
          </Text>

          <TouchableOpacity style={styles.copyButton} onPress={copiarCodigoPix}>
            <Text style={styles.copyButtonText}>
              {copiado ? "Copiado!" : "Copiar código Pix"}
            </Text>
          </TouchableOpacity>

          <View style={styles.pixStatusRow}>
            <ActivityIndicator size="small" color="#8b3151" />
            <Text style={styles.pixStatusText}>Aguardando confirmação do pagamento...</Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (checkoutUrl) {
    return (
      <View style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.headerBack}>Voltar</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Mercado Pago</Text>

          {polling ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.headerBack}>Verificando...</Text>
            </View>
          ) : (
            <TouchableOpacity onPress={startVerification}>
              <Text style={styles.headerBack}>Verificar</Text>
            </TouchableOpacity>
          )}
        </View>

        <WebView
          source={{ uri: checkoutUrl }}
          style={{ flex: 1 }}
          onMessage={handleWebViewMessage}
          onNavigationStateChange={(navState) => {
            const url = navState.url || "";

            if (url.includes("checkout-result.html")) {
              const params = url.includes("?")
                ? new URLSearchParams(url.split("?")[1])
                : new URLSearchParams("");

              const mpStatus = params.get("status") || params.get("r") || "unknown";
              const paymentId = params.get("payment_id") || null;

              if (mpStatus === "approved" || mpStatus === "success") {
                if (paymentId) {
                  verifyByPaymentId(paymentId);
                } else {
                  startVerification();
                }
              } else if (mpStatus === "rejected" || mpStatus === "failure") {
                setCheckoutUrl(null);
                Alert.alert(
                  "Pagamento recusado",
                  "Tente novamente com outra forma de pagamento.",
                  [{ text: "OK", onPress: () => navigation.goBack() }]
                );
              } else {
                startVerification();
              }
            }
          }}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#8b3151" />
              <Text style={styles.loadingText}>Carregando pagamento...</Text>
            </View>
          )}
        />
      </View>
    );
  }

  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#8b3151" />
      <Text style={styles.loadingText}>Preparando pagamento...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#eadde1",
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#8b3151",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,247,250,0.9)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#8b3151",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 48,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  headerBack: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },
  resultContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#eadde1",
    padding: 24,
  },
  resultIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  iconSuccess: {
    color: "#4CAF50",
  },
  iconOther: {
    color: "#f44336",
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#8b3151",
    textAlign: "center",
    marginBottom: 8,
  },
  resultStatus: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
    textAlign: "center",
  },
  resultAmount: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#e58aaa",
    marginBottom: 32,
  },
  finishButton: {
    backgroundColor: "#8b3151",
    padding: 16,
    borderRadius: 30,
    width: "100%",
    alignItems: "center",
  },
  finishButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  pixContent: {
    padding: 24,
    alignItems: "center",
    backgroundColor: "#eadde1",
    flexGrow: 1,
  },
  pixAmount: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#8b3151",
    marginBottom: 16,
  },
  qrImage: {
    width: 220,
    height: 220,
    marginBottom: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
  },
  pixInstrucao: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  copyButton: {
    backgroundColor: "#8b3151",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    marginBottom: 24,
  },
  copyButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  pixStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pixStatusText: {
    fontSize: 13,
    color: "#8b3151",
  },
});