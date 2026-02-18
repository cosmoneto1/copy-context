import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "extension.generateCodeMarkdown",
    async (uri: vscode.Uri) => {
      let document: vscode.TextDocument;

      if (uri && uri.fsPath) {
        document = await vscode.workspace.openTextDocument(uri);
      } else {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;
        document = editor.document;
      }

      if (!isSupported(document.fileName)) {
        vscode.window.showWarningMessage(
          "Arquivo principal deve ser .ts, .tsx, .js ou .jsx",
        );
        return;
      }

      const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
      if (!workspaceFolder) return;

      const rootPath = workspaceFolder.uri.fsPath;
      const config = getProjectConfig(rootPath);
      const text = document.getText();
      const importRegex = /from\s+['"](.*?)['"]/g;
      let match;

      const relativeRootFile = path.relative(rootPath, document.fileName);
      let markdownContent = `ROOT:${relativeRootFile}\n---\n`;

      const processedFiles = new Set<string>();

      while ((match = importRegex.exec(text)) !== null) {
        const importPath = match[1];
        let resolvedPath = resolveImport(
          importPath,
          document.fileName,
          rootPath,
          config,
        );

        if (resolvedPath && !processedFiles.has(resolvedPath)) {
          processedFiles.add(resolvedPath);
          const displayPath = path.relative(rootPath, resolvedPath);

          // SE FOR SUPORTADO -> ADICIONA CONTEÚDO
          if (isSupported(resolvedPath)) {
            const rawContent = fs.readFileSync(resolvedPath, "utf-8");
            const compressed = compressCode(rawContent);
            markdownContent += `FILE:${displayPath}\n\`\`\`${getLang(resolvedPath)}\n${compressed}\n\`\`\`\n`;
          }
          // SE NÃO FOR SUPORTADO -> APENAS MENÇÃO (Economia de Tokens)
          else {
            markdownContent += `EXTERNAL_REF:${displayPath} (Conteúdo omitido)\n---\n`;
          }
        }
      }

      // Adiciona arquivo original
      markdownContent += `ORIGIN:${relativeRootFile}\n\`\`\`${getLang(document.fileName)}\n${compressCode(text)}\n\`\`\``;

      await finalize(markdownContent, rootPath);
    },
  );

  let openDocs = vscode.commands.registerCommand(
    "extension.openCodeDocs",
    async () => {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders) return;

      const indexPath = path.join(
        workspaceFolders[0].uri.fsPath,
        "code_docs",
        "index.md",
      );

      if (fs.existsSync(indexPath)) {
        const uri = vscode.Uri.file(indexPath);
        // Abre o arquivo de índice
        await vscode.commands.executeCommand("markdown.showPreview", uri);
      } else {
        vscode.window.showErrorMessage(
          "O índice de documentos ainda não foi gerado.",
        );
      }
    },
  );

  context.subscriptions.push(disposable);

  context.subscriptions.push(openDocs);
}

// Verifica se deve ler o conteúdo do arquivo
function isSupported(fileName: string): boolean {
  const ext = path.extname(fileName).toLowerCase();
  return [".ts", ".tsx", ".js", ".jsx"].includes(ext);
}

// Remove comentários e linhas vazias
function compressCode(code: string): string {
  return code
    .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "")
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0)
    .join("\n");
}

// Resolve caminhos com suporte a Aliases e Index
function resolveImport(
  importPath: string,
  currentFile: string,
  root: string,
  config: any,
): string | null {
  let targetPath = "";
  if (config.paths) {
    for (const alias in config.paths) {
      const aliasBase = alias.replace("/*", "");
      if (importPath.startsWith(aliasBase)) {
        const replacement = config.paths[alias][0].replace("/*", "");
        targetPath = path.resolve(
          root,
          config.baseUrl || ".",
          importPath.replace(aliasBase, replacement),
        );
        break;
      }
    }
  }
  if (
    !targetPath &&
    (importPath.startsWith(".") || importPath.startsWith("/"))
  ) {
    targetPath = path.resolve(path.dirname(currentFile), importPath);
  }
  if (!targetPath) return null;

  // Tenta extensões de código primeiro
  const extensions = [
    "",
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    "/index.ts",
    "/index.tsx",
    ".css",
    ".scss",
    ".json",
  ];
  for (const ext of extensions) {
    const fullPath = targetPath + ext;
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      return fullPath;
    }
  }
  return null;
}

// Finaliza o processo com versionamento e comparação
async function finalize(content: string, root: string) {
  const outDir = path.join(root, "code_docs");
  const indexFilePath = path.join(outDir, "index.md");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

  let v = 1;
  let lastPath = "";
  if (fs.existsSync(indexFilePath)) {
    const idx = fs.readFileSync(indexFilePath, "utf-8");
    const m = idx.match(/\| v(\d+) \|/g);
    if (m) {
      v = parseInt(m[m.length - 1].match(/\d+/)![0]);
      lastPath = path.join(outDir, `v${v}_context.md`);
      v++;
    }
  }

  if (
    lastPath &&
    fs.existsSync(lastPath) &&
    fs.readFileSync(lastPath, "utf-8") === content
  ) {
    await vscode.env.clipboard.writeText(content);
    vscode.window.showInformationMessage(
      "ℹ️ Sem mudanças. Copiado para o clipboard.",
    );
    return;
  }

  const fileName = `v${v}_context.md`;
  fs.writeFileSync(path.join(outDir, fileName), content);
  const row = `| v${v} | ${new Date().toLocaleString("pt-BR")} | [${fileName}](./${fileName}) |\n`;

  if (!fs.existsSync(indexFilePath)) {
    fs.writeFileSync(
      indexFilePath,
      `| V | Data | Arq |\n|---|---|---|\n` + row,
    );
  } else {
    fs.appendFileSync(indexFilePath, row);
  }

  await vscode.env.clipboard.writeText(content);
  vscode.window.showInformationMessage(`✅ v${v} gerada e copiada!`);
}

function getLang(p: string) {
  const ext = path.extname(p).toLowerCase();
  return ext === ".ts" || ext === ".tsx" ? "ts" : "js";
}

function getProjectConfig(root: string) {
  const tsPath = path.join(root, "tsconfig.json");
  const jsPath = path.join(root, "jsconfig.json");
  const configPath = fs.existsSync(tsPath)
    ? tsPath
    : fs.existsSync(jsPath)
      ? jsPath
      : null;
  if (configPath) {
    try {
      const content = fs
        .readFileSync(configPath, "utf-8")
        .replace(/\/\/.*|\/\*[\s\S]*?\*\//g, "");
      const json = JSON.parse(content);
      return {
        baseUrl: json.compilerOptions?.baseUrl || ".",
        paths: json.compilerOptions?.paths || null,
      };
    } catch (e) {
      return {};
    }
  }
  return {};
}
