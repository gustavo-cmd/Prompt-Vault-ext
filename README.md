# PromptVault - Extensão para Chrome

Uma extensão poderosa e elegante para salvar, organizar, buscar e copiar prompts de IA rapidamente com suporte a variáveis dinâmicas.

## 🚀 Funcionalidades

- **Armazenamento Seguro**: Salve seus prompts favoritos no armazenamento local do Chrome
- **Suporte a Variáveis**: Use `{{variavel}}` nos seus prompts para campos dinâmicos
- **Busca Avançada**: Pesquise por título, conteúdo, descrição ou tags
- **Filtro por Tags**: Organize e filtre seus prompts por categorias personalizadas
- **Ordenação**: Ordene por data de criação, alfabeticamente ou por mais utilizados
- **Backup & Importação**: Exporte e importe seus prompts via JSON
- **Interface Premium**: Design moderno e intuitivo com tema escuro
- **Dashboard Completo**: Painel de gerenciamento com editor integrado
- **Preview em Tempo Real**: Visualize as variáveis destacadas enquanto edita

## 📦 Instalação

### Modo Desenvolvedor (Recomendado para Testes)

1. Clone ou baixe este repositório
2. Abra o Chrome e navegue até `chrome://extensions/`
3. Ative o **"Modo do desenvolvedor"** no canto superior direito
4. Clique em **"Carregar sem compactação"**
5. Selecione a pasta onde estão os arquivos da extensão

### Estrutura de Arquivos

```
PromptVault/
├── manifest.json        # Configuração da extensão
├── html/
│   ├── popup.html       # Interface do popup
│   └── dashboard.html   # Painel de gerenciamento
├── css/
│   ├── popup.css        # Estilos do popup
│   └── dashboard.css    # Estilos do dashboard
├── js/
│   ├── popup.js         # Lógica do popup
│   ├── dashboard.js     # Lógica do dashboard
│   └── storage.js       # Módulo de armazenamento unificado
├── icon16.png           # Ícone 16x16
├── icon32.png           # Ícone 32x32
├── icon48.png           # Ícone 48x48
├── icon128.png          # Ícone 128x128
└── README.md            # Este arquivo
```

## 🎯 Como Usar

### No Popup (Acesso Rápido)

1. Clique no ícone da extensão na barra de ferramentas
2. Use a barra de pesquisa para encontrar prompts
3. Filtre por tags clicando nas pílulas
4. Clique em um prompt para copiar (ou preencher variáveis)
5. Use o botão "Criar Novo Prompt" para acessar o dashboard

### No Dashboard (Gerenciamento Completo)

1. Acesse via botão no popup ou clique com botão direito > Opções
2. **Criar Prompt**: Clique em "Novo Prompt"
3. **Editar**: Clique no botão de lápis em qualquer card
4. **Excluir**: Clique no botão de lixeira
5. **Copiar**: Clique no botão de cópia rápida
6. **Exportar/Importar**: Use os botões na sidebar para backup

### Criando Prompts com Variáveis

Use a sintaxe `{{nome_da_variavel}}` no conteúdo do prompt:

```
Aja como um especialista em {{linguagem}} e analise o seguinte código:

{{codigo}}

Forneça sugestões de melhoria focando em:
1. Performance
2. Segurança
3. Boas práticas
```

Ao copiar este prompt, um modal será aberto solicitando os valores para:
- `linguagem`
- `codigo`

## 🔧 Melhorias Implementadas

### Estabilidade

- ✅ Validação de entrada nos formulários de variáveis
- ✅ Verificação de null/undefined antes de operar
- ✅ Fallback automático entre Chrome Storage e localStorage
- ✅ Tratamento de erros em todas as operações assíncronas
- ✅ Validação de dados na importação de JSON

### Usabilidade

- ✅ Caminhos de arquivo corrigidos no manifest.json
- ✅ Mensagens de erro claras e informativas
- ✅ Confirmação antes de excluir prompts
- ✅ Feedback visual ao copiar (toast + animação)
- ✅ Focus automático no primeiro campo de variáveis

### Compatibilidade

- ✅ Funciona como extensão Chrome (Manifest V3)
- ✅ Funciona em modo standalone (navegador)
- ✅ Sincronização automática de dados entre popup e dashboard

## 🛠️ Desenvolvimento

### Pré-requisitos

- Google Chrome (versão 88+)
- Conhecimento básico de HTML, CSS e JavaScript

### Testando Localmente

Você pode testar o dashboard diretamente no navegador:

```bash
# Abra o dashboard.html no Chrome
# Os dados serão salvos no localStorage
```

### Debugging

1. No popup: Botão direito > Inspecionar
2. No dashboard: F12 para abrir DevTools
3. Console mostrará logs de erro detalhados

## 📝 Formato de Backup (JSON)

```json
[
  {
    "id": "prompt-1234567890-abc123",
    "title": "Meu Prompt",
    "description": "Descrição opcional",
    "content": "Conteúdo do prompt com {{variavel}}",
    "tags": ["tag1", "tag2"],
    "created": 1234567890000,
    "lastUsed": 1234567890000
  }
]
```

## ⚠️ Notas Importantes

- **Primeira Execução**: Prompts de exemplo são criados automaticamente
- **Limite de Armazenamento**: ~5MB no localStorage/chrome.storage.local
- **Dados Locais**: Os dados não são sincronizados entre dispositivos
- **Variáveis Obrigatórias**: Todos os campos devem ser preenchidos ao usar prompts com variáveis

## 🐛 Solução de Problemas

### A extensão não carrega
- Verifique se o manifest.json está na raiz da pasta
- Confira se todos os arquivos referenced existem
- Recarregue a extensão em chrome://extensions/

### Dados não persistem
- Verifique permissões de armazenamento do navegador
- Tente limpar cache e recarregar a extensão

### Erro ao importar JSON
- Certifique-se que o arquivo é um array válido
- Verifique se cada prompt tem pelo menos `title` e `content`

## 📄 Licença

MIT License - Sinta-se livre para usar e modificar.

## 🤝 Contribuições

Contribuições são bem-vindas! Sugestões de melhorias:

- [ ] Sincronização com nuvem
- [ ] Categorias aninhadas
- [ ] Templates predefinidos
- [ ] Atalhos de teclado
- [ ] Temas personalizados

---

**PromptVault** - Seu cofre pessoal de prompts de IA 🚀
