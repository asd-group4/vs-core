import fs from 'fs';
import { CompositeGeneratorNode, NL, processGeneratorNode } from 'langium';
import { EcoreClass, EcoreFeature, EcoreModel, EcoreReference, EcoreEnum, EcoreEnumEntry } from '../language-server/generated/ast';
import { extractDestinationAndName } from './cli-util';
import path from 'path';


let MODEL : EcoreModel | null = null;

export function generateEcoreClass(ecoreClass: EcoreClass, ecoreClasses : string[]): string{
    let ecoreClassXML = "";


    ecoreClassXML += `\n\t<eClassifiers xsi:type="ecore:EClass" name="${ecoreClass.name}" ${ecoreClass.interface? 'abstract="true" interface="true"':''}>`

    ecoreClass.features.forEach(feature => ecoreClassXML += generateEcoreFeature(feature, ecoreClasses));
    ecoreClass.references.forEach(reference => ecoreClassXML += generateEcoreReference(reference, ecoreClasses, ecoreClass));

    ecoreClassXML += "\n\t</eClassifiers>"

    return ecoreClassXML
}

export function generateEcoreFeature(ecoreFeature: EcoreFeature, ecoreClasses : string[]):string{

    let upperBound = "";
    let lowerBound = "";
    let extraFeatures = "";

    if(ecoreFeature.boundDefinition != undefined){
        if(ecoreFeature.boundDefinition.upperBound != undefined) upperBound = `upperBound="${ecoreFeature.boundDefinition.upperBound}"`
        if(ecoreFeature.boundDefinition.lowerBound != undefined) lowerBound = `lowerBound="${ecoreFeature.boundDefinition.lowerBound}"`
    }

    if(ecoreFeature.required){
        if(lowerBound == "") lowerBound = 'lowerBound="1"';
    }

    if(ecoreFeature.final) extraFeatures += 'unsettable="true"'
    if(ecoreFeature.volatile) extraFeatures += ' volatile="true"'
    if(ecoreFeature.transient) extraFeatures += ' transient="true"'

    return `\n\t\t<eStructuralFeatures xsi:type="ecore:EAttribute" name="${ecoreFeature.featureName}" ${upperBound} ${lowerBound} ${extraFeatures}
        eType="${translate_etype(ecoreFeature.name, ecoreClasses)}"/>`
}

export function translate_etype(type: string, ecoreClasses : string[]):string{
    if(ecoreClasses.includes(type)) return `#//${type}`
    return `ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//E${ecoreFormat(type)}`
}

function ecoreFormat(type : string) : string{
    return type.charAt(0).toUpperCase() + type.slice(1)
}

function translate_eclass_ref(eClass: string, ecoreClasses : string[]):string{
    return translate_etype(eClass, ecoreClasses)
}

export function generateEcoreReference(ecoreReference: EcoreReference, ecoreClasses : string[], ecoreParent : EcoreClass):string{
    let upperBound = "";
    let lowerBound = "";

    if(ecoreReference.boundDefinition != undefined){
        if(ecoreReference.boundDefinition.upperBound != undefined) upperBound = `upperBound="${ecoreReference.boundDefinition.upperBound}"`
        if(ecoreReference.boundDefinition.lowerBound != undefined) lowerBound = `lowerBound="${ecoreReference.boundDefinition.lowerBound}"`
    }

    if(ecoreReference.required){
        if(lowerBound == "") lowerBound = 'lowerBound="1"';
    }

    let containment = "";

    let opposite = ""; 

    if(!ecoreReference.refers){
        containment = `containment="${ecoreReference.containmentType==="Containment"}"`
    }

    if(ecoreReference.opposite != undefined){
        opposite = findOpposite(ecoreReference, ecoreParent)
    }

    return `\n<eStructuralFeatures xsi:type="ecore:EReference" name="${ecoreReference.featureName}" ${upperBound} ${lowerBound}
        eType="${translate_eclass_ref(ecoreReference.references.classReference.$refText, ecoreClasses)}" ${containment} ${opposite} />`
}

export function generateEcoreEnum(ecoreEnum: EcoreEnum):string{

    let ecoreEnumXML = `\n<eClassifiers xsi:type="ecore:EEnum" name="${ecoreEnum.name}">`

    ecoreEnum.enumEntry.forEach((entry:EcoreEnumEntry, i: number) => ecoreEnumXML += (
        `\n<eLiterals name="${entry.name}" value="${i}" literal="${entry.name.toLowerCase()}"/>`
    ))

    ecoreEnumXML += "\n</eClassifiers>"

    return ecoreEnumXML
    
}

export function generateXML(ecoreModel : EcoreModel): string{
    let text = '<?xml version="1.0" encoding="UTF-8"?>';

    MODEL = ecoreModel;

    text += `\n<ecore:EPackage xmi:version="2.0" xmlns:xmi="http://www.omg.org/XMI" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:ecore="http://www.eclipse.org/emf/2002/Ecore" name="${ecoreModel.name.name}" nsURI="${ecoreModel.nsUri.name}" nsPrefix="${ecoreModel.name.name}">`
    
    console.log("ecore-model name : ", ecoreModel.name.name)

    let ecoreClassesName = ecoreModel.ecoreClasses.map(ecoreClass => ecoreClass.name)
    let ecoreEnums = ecoreModel.ecoreEnums.map(ecoreClass => ecoreClass.name)

    const ecoreClasses = ecoreClassesName.concat(ecoreEnums)


    // used to check if the datatype of a feature is an ecore datatype or model-defined class

    ecoreModel.ecoreClasses.forEach(ecoreClass => text += generateEcoreClass(ecoreClass, ecoreClasses));
    ecoreModel.ecoreEnums.forEach(ecoreEnum => text+= generateEcoreEnum(ecoreEnum))

    text += '\n</ecore:EPackage>'

    return text
}

function findOpposite(ecoreReference : EcoreReference, ecoreParent : EcoreClass):string{
    //    eOpposite="#//Universitet/studenter" 

    if(ecoreReference.opposite.oppositeClass == undefined){
        let refClass = getEcoreClassDefinition(ecoreReference.references.classReference.$refText)
        return `eOpposite="#//${refClass?.name}/${getEcoreClassDefinitionRefName(
            refClass, ecoreParent.name
        )}"`
    } else {
        return `eOpposite="#//${ecoreReference.opposite.oppositeClass.$refText}/${getEcoreClassDefinitionRefName(
            ecoreReference.opposite.oppositeClass.ref, ecoreParent.name
        )}"`
    }   
}

function getEcoreClassDefinition(ecoreClassName : string){
    return MODEL?.ecoreClasses.find(ecoreClass => ecoreClass.name == ecoreClassName)
}

/**
 * Funcion to get the name of a reference within a given class with a given type
 */

function getEcoreClassDefinitionRefName(ecoreClass: EcoreClass | undefined, ecoreFeatureType: string):string{
    if(ecoreClass == undefined) throw 'Invalid Ecore Opposite Reference: Ecore class undefined'
    let featureName
    
    console.log("Trying to find feature", ecoreFeatureType);
    console.log("Looking at class", ecoreClass.name);   

    featureName = ecoreClass.features.find(ecoreFeature => ecoreFeature.name == ecoreFeatureType)?.featureName
    if(featureName != undefined) return featureName


    featureName = ecoreClass.references.find(ecoreReference => ecoreReference.references.classReference.$refText == ecoreFeatureType)?.featureName
    if(featureName != undefined) return featureName
    
    if(featureName == undefined) throw 'Invalid Ecore Opposite Reference: Ecore class featureName undefined'

    return ""
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

//TODO: Refactor common code
export function generateGenmodel(ecoreModel: EcoreModel, filePath: string, destination: string | undefined): string {
    const data = extractDestinationAndName(filePath, destination);
    let generatedFilePath = `${path.join(data.destination, data.name)}.genmodel`;

    const fileNode = new CompositeGeneratorNode();
    fileNode.append("Test", NL);

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
