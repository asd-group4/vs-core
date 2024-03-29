import * as vscode from "vscode";
import * as path from "path";
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from "vscode-languageclient/node";
import { generateAction } from "./cli";

let client: LanguageClient;

const generateHandler = async () => {
  const currentFilePath = vscode.window.activeTextEditor?.document.uri.path;

  if (currentFilePath === undefined) {
    return;
  }

  const generatedFilePath = path.join(
    path.dirname(currentFilePath),
    "generated"
  );

  await generateAction(currentFilePath, { destination: generatedFilePath });

  vscode.window.showInformationMessage(
    `Generated files in: ${generatedFilePath}`
  );
};

// This function is called when the extension is activated.
export function activate(context: vscode.ExtensionContext): void {
  client = startLanguageClient(context);

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "vs-core.generateEcoreAndGenmodel",
      generateHandler
    )
  );
}

// This function is called when the extension is deactivated.
export function deactivate(): Thenable<void> | undefined {
  if (client) {
    return client.stop();
  }
  return undefined;
}

function startLanguageClient(context: vscode.ExtensionContext): LanguageClient {
  const serverModule = context.asAbsolutePath(
    path.join("out", "language-server", "main")
  );
  // The debug options for the server
  // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging.
  // By setting `process.env.DEBUG_BREAK` to a truthy value, the language server will wait until a debugger is attached.
  const debugOptions = {
    execArgv: [
      "--nolazy",
      `
        --inspect${process.env.DEBUG_BREAK ? "-brk" : ""}
        =${process.env.DEBUG_SOCKET || "6009"}
      `,
    ],
  };

  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: debugOptions,
    },
  };

  const fileSystemWatcher =
    vscode.workspace.createFileSystemWatcher("**/*.vscore");
  context.subscriptions.push(fileSystemWatcher);

  // Options to control the language client
  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: "file", language: "vs-core" }],
    synchronize: {
      // Notify the server about file changes to files contained in the workspace
      fileEvents: fileSystemWatcher,
    },
  };

  // Create the language client and start the client.
  const client = new LanguageClient(
    "vs-core",
    "vs-core",
    serverOptions,
    clientOptions
  );

  // Start the client. This will also launch the server
  client.start();

  return client;
}
