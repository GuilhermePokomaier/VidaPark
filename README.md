# 🎉 App de Gestão e Reservas para Espaço de Festas

Aplicativo mobile desenvolvido como **Trabalho de Conclusão de Curso (TCC)** para um espaço de festas real. A plataforma digitaliza o atendimento do negócio, permitindo que clientes conheçam e contratem **pacotes de locação** e **comprem lanches**, enquanto a administração gerencia pacotes, pedidos e vendas em um só lugar.

---

## 📌 Sobre o projeto

Espaços de festas costumam depender de contato manual (mensagens e ligações) para apresentar pacotes, informar valores e registrar pedidos. Este app centraliza esse processo, trazendo mais organização para o negócio e praticidade para o cliente.

O sistema é dividido em dois perfis:

- **Cliente:** navega pelos pacotes e pelo cardápio de lanches, consulta detalhes e realiza pedidos.
- **Administrador:** cadastra e edita pacotes, acompanha pedidos e gerencia as vendas.

---

## ✨ Funcionalidades

### Cliente
- Tela inicial com dois serviços: **locação de pacotes** e **venda de lanches**
- Listagem de pacotes com imagem, preço inicial e informações principais
- Detalhes do pacote: descrição, destaques, o que inclui, estrutura, regras, ambiente, duração e capacidade máxima de convidados
- Realização de pedidos

### Administrador
- Cadastro, edição e controle de disponibilidade de pacotes
- Marcação de pacotes como "popular"
- Upload de imagem do pacote a partir da galeria
- Gerenciamento de vendas (`GerenciarVendas`), com leitura da coleção `pedidos`

---

## 🛠️ Tecnologias

| Camada | Tecnologia |
|---|---|
| Aplicativo mobile | React Native + Expo |
| Navegação | React Navigation |
| Interface | React Native Paper |
| Banco de dados | Firebase Firestore |
| Mídia | expo-image-picker |
| Design e prototipação | Figma e Miro (User Flow) |

---

## 🗂️ Estrutura de dados (Firestore)

- **`pacotes`**: nome, preço inicial, descrição, destaques, itens inclusos, estrutura, regras, ambiente, duração, máximo de convidados, imagem, status de popular e disponibilidade
- **`pedidos`**: pedidos realizados pelos clientes, usados na tela de gestão de vendas

---

## 🚀 Como executar

```bash
# Clonar o repositório
git clone https://github.com/SEU-USUARIO/NOME-DO-REPOSITORIO.git
cd NOME-DO-REPOSITORIO

# Instalar as dependências
npm install

# Iniciar o projeto
npx expo start
```

Configure suas credenciais do Firebase em `Firebase/firebaseConfig.js` antes de executar.

> Para testar, utilize o aplicativo **Expo Go** no celular ou um emulador Android/iOS.

---

## 🗺️ Próximos passos

- [ ] Integração real de pagamentos com **Mercado Pago** (registro na coleção `payments`)
- [ ] Refinamento da interface e do fluxo de navegação
- [ ] Melhorias no painel administrativo

---

## 🎓 Contexto acadêmico

Projeto desenvolvido como Trabalho de Conclusão de Curso, aplicando conceitos de sistemas de informação, como **sistemas de processamento de transações (SPT)**, ao setor de eventos e locação de espaços.

---

## 👤 Autor

**Guilherme**
Interesse em GovTech e desenvolvimento de software para o setor público.
