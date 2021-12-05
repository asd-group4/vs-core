import { startLanguageServer } from "langium";
import { createConnection, ProposedFeatures } from "vscode-languageserver/node";
import { createVsCoreServices } from "./vs-core-module";

// Creates a connection to the client
const connection = createConnection(ProposedFeatures.all);

// Injects the language services
const services = createVsCoreServices({ connection });

// Starts the language server with the language-specific services
startLanguageServer(services);
