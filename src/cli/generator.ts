//import fs from 'fs';
//import { CompositeGeneratorNode, NL, processGeneratorNode } from 'langium';
import { EcoreClass, EcoreFeature, EcoreReference } from '../language-server/generated/ast';
//import { extractDestinationAndName } from './cli-util';
//import path from 'path';

export function generateEcoreClass(ecoreClass: EcoreClass): string{
    return "todo: generate ecore-class"
}

export function generateEcoreFeature(ecoreFeature: EcoreFeature):string{
    return "todo: generate ecore-feature"
}

export function generateEcoreReference(refference: EcoreReference):string{
    return "todo: generate ecore-reference"
}

/*
export function generateJavaScript(model: Model, filePath: string, destination: string | undefined): string {
    const data = extractDestinationAndName(filePath, destination);
    const generatedFilePath = `${path.join(data.destination, data.name)}.js`;

    const fileNode = new CompositeGeneratorNode();
    fileNode.append('"use strict";', NL, NL);
    model.greetings.forEach(greeting => fileNode.append(`console.log('Hello, ${greeting.person.$refText}!');`, NL));

    if (!fs.existsSync(data.destination)) {
        fs.mkdirSync(data.destination, { recursive: true });
    }
    fs.writeFileSync(generatedFilePath, processGeneratorNode(fileNode));
    return generatedFilePath;
}
*/