//import colors from 'colors';
import { Command } from 'commander';
import { languageMetaData } from '../language-server/generated/module';
//import { EcoreClass, EcoreFeature, EcoreInterface, EcoreRefference} from '../language-server/generated/ast';
//import { createVsCoreServices } from '../language-server/vs-core-module';
//import { extractAstNode } from './cli-util';
//import { generateEcoreClass, generateEcoreFeature, generateEcoreInterface, generateEcoreRefference } from './generator';

export const generateAction = async (fileName: string, opts: GenerateOptions): Promise<void> => {
    //const model = await extractAstNode<EcoreClass>(fileName, languageMetaData.fileExtensions, createVsCoreServices());
    //const ecoreClass = generateEcoreClass()
    //console.log(colors.green(`Ecore model generated successfully: ${generatedFilePath}`));
};

export type GenerateOptions = {
    destination?: string;
}

export default function(): void {
    const program = new Command();

    program
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        .version(require('../../package.json').version);

    program
        .command('generate')
        .argument('<file>', `possible file extensions: ${languageMetaData.fileExtensions.join(', ')}`)
        .option('-d, --destination <dir>', 'destination directory of generating')
        .description('generates JavaScript code that prints "Hello, {name}!" for each greeting in a source file')
        .action(generateAction);

    program.parse(process.argv);
}
