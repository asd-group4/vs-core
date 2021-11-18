import fs from 'fs';
import { CompositeGeneratorNode, NL, processGeneratorNode } from 'langium';
import { EcoreClass, EcoreFeature, EcoreModel, EcoreReference, EcoreEnum, EcoreEnumEntry } from '../language-server/generated/ast';
import { extractDestinationAndName } from './cli-util';
import path from 'path';

export function generateEcoreClass(ecoreClass: EcoreClass): string{
    let ecoreClassXML = "";

    ecoreClassXML += `\n<eClassifiers xsi:type="ecore:EClass" name="${ecoreClass.name}" ${ecoreClass.interface == null? 'abstract="true" interface="true"':''}">`

    ecoreClass.features.forEach(feature => ecoreClassXML += generateEcoreFeature(feature));
    ecoreClass.references.forEach(reference => ecoreClassXML += generateEcoreReference(reference));

    ecoreClassXML += "\n</eClassifiers>"

    return ecoreClassXML
}

export function generateEcoreFeature(ecoreFeature: EcoreFeature):string{
    return `\n<eStructuralFeatures xsi:type="ecore:EReference" name="${ecoreFeature.featureName}" upperBound="-1"
        eType="${translate_etype(ecoreFeature.name)}"/>`
}

export function translate_etype(type: string):string{
    let emp = type.toLocaleLowerCase()
    switch (emp){
        case "string":
            return "ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EString"
        case "int":
            return "ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EInt"
        default:
            return `#//${type}/`
    }
}

export function generateEcoreReference(ecoreReference: EcoreReference):string{
    return `\n<eStructuralFeatures xsi:type="ecore:EReference" name="${ecoreReference.name}" upperBound="-1"
        eType="${translate_etype(ecoreReference.name)}" containment="true" />`
}

export function generateEcoreEnum(ecoreEnum: EcoreEnum):string{
    /*
    <eClassifiers xsi:type="ecore:EEnum" name="Season">
    <eLiterals name="SPRING" literal="spring"/>
    <eLiterals name="FALL" value="1" literal="fall"/>
    </eClassifiers>
    */

    let ecoreEnumXML = `\n<eClassifiers xsi:type="ecore:EEnum" name="${ecoreEnum.name}">`

    ecoreEnum.enumEntry.forEach((entry:EcoreEnumEntry, i: number) => ecoreEnumXML += (
        `\n<eLiterals name="${entry.name}" value="${entry.numberDefinition? entry.numberDefinition : i}" literal="${entry.stringDefinition}"/>`
    ))

    ecoreEnumXML += "\n</eClassifiers>"

    return ecoreEnumXML
    
}

export function generateXML(ecoreModel : EcoreModel): string{
    let text = '<?xml version="1.0" encoding="UTF-8"?';

    text += `\n<ecore:EPackage xmi:version="2.0" xmlns:xmi="http://www.omg.org/XMI" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:ecore="http://www.eclipse.org/emf/2002/Ecore" name="${ecoreModel.name.name}" nsURI="${ecoreModel.nsUri}" nsPrefix="${ecoreModel.name.name}">`
    
    console.log("ecore-model name : ", ecoreModel.name.name)

    ecoreModel.ecoreClasses.forEach(ecoreClass => text += generateEcoreClass(ecoreClass));
    ecoreModel.ecoreEnums.forEach(ecoreEnum => text+= generateEcoreEnum(ecoreEnum))

    text += '\n</ecore:EPackage>'

    return text
}

export function generateEcore(ecoreModel: EcoreModel, filePath: string, destination: string | undefined): string {
    const data = extractDestinationAndName(filePath, destination);
    let generatedFilePath = `${path.join(data.destination, data.name)}.ecore`;

    const fileNode = new CompositeGeneratorNode();
    fileNode.append(generateXML(ecoreModel), NL)

    if (destination == undefined){
        data.destination = data.destination.replace("/vscore/", "/vs-core/")
        generatedFilePath = generatedFilePath.replace("/vscore/", "/vs-core/")
    }     

    if (!fs.existsSync(data.destination)) {
        fs.mkdirSync(data.destination, { recursive: true });
    }
    fs.writeFileSync(generatedFilePath, processGeneratorNode(fileNode));
    return generatedFilePath;
}
