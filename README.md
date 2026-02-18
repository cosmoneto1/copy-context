# 🚀 AI Context Weaver

**AI Context Weaver** é a ferramenta definitiva para desenvolvedores que utilizam LLMs (ChatGPT, Claude, Gemini). Ela lê o arquivo aberto, resolve todos os seus imports locais (incluindo path aliases) e gera um arquivo Markdown ultra-compactado pronto para ser colado no seu chat de IA.

## ✨ Funcionalidades

* **📦 Resolução Inteligente de Imports**: Identifica e busca o conteúdo de arquivos `.ts`, `.tsx`, `.js` e `.jsx` importados.
* **🔗 Suporte a Path Aliases**: Lê seu `tsconfig.json` ou `jsconfig.json` para resolver caminhos como `@/components/*`.
* **📉 Otimização de Tokens**:
* Remove comentários e linhas em branco.
* Minifica o código para reduzir o consumo de tokens.
* Mantém referências externas (CSS, JSON) apenas como nomes de arquivos para economizar espaço.


* **📜 Versionamento Automático**: Cria um histórico de versões em `/code_docs` com um `index.md` para fácil navegação.
* **🔄 Detecção de Mudanças**: Só cria uma nova versão se o conteúdo gerado for diferente da última.
* **📋 Clipboard Instantâneo**: Copia o Markdown final automaticamente para sua área de transferência.

## ⌨️ Atalhos de Teclado

| Comando | Atalho (Windows/Linux) | Atalho (Mac) |
| --- | --- | --- |
| **Gerar Contexto Compacto** | `Ctrl+Shift+Alt+M` | `Cmd+Shift+Alt+M` |
| **Ver Lista de Versões** | `Ctrl+Shift+Alt+L` | `Cmd+Shift+Alt+L` |

## 🖱️ Como Usar

1. **Pelo Explorer**: Clique com o botão direito em qualquer arquivo de código na barra lateral e selecione `Gerar Markdown Compacto para IA`.
2. **Pelo Editor**: Clique com o botão direito dentro do código ou use o atalho de teclado.
3. **Visualização**: Use o atalho `Ctrl+Shift+Alt+L` para abrir o índice de versões e navegar pelos contextos gerados anteriormente.

## 📂 Estrutura de Arquivos Gerada

A extensão cria uma pasta `code_docs` na raiz do seu projeto:

```text
projeto/
├── code_docs/
│   ├── index.md        <-- Lista de todas as versões geradas
│   ├── v1.md           <-- Contexto da versão 1
│   └── v2.md           <-- Contexto da versão 2
└── src/
    └── ...

```

## 🛠️ Configurações Suportadas

A extensão respeita automaticamente as configurações de:

* `compilerOptions.baseUrl`
* `compilerOptions.paths` (Aliases)

---

> **Dica de Pro**: Adicione a pasta `code_docs/` ao seu `.gitignore` para manter seu repositório limpo enquanto mantém seus contextos organizados localmente.

---

### 📦 Como instalar localmente (VSIX)

Se você quiser gerar o instalador para o seu VS Code:

1. Instale o gerenciador: `npm install -g @vscode/vsce`
2. Gere o pacote: `vsce package`
3. No VS Code, vá em extensões -> `...` (três pontos) -> `Install from VSIX...`

---

**Gostaria que eu fizesse alguma alteração no nome da extensão ou adicionasse alguma seção extra de suporte?**