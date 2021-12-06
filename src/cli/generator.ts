import fs from "fs";
import { CompositeGeneratorNode, NL, processGeneratorNode } from "langium";
import {
  EcoreClass,
  EcoreFeature,
  EcoreModel,
  EcoreReference,
  EcoreEnum,
  EcoreEnumEntry,
} from "../language-server/generated/ast";
import { extractDestinationAndName } from "./cli-util";
import path from "path";

let MODEL: EcoreModel | null = null;

export function generateEcoreClass(
  ecoreClass: EcoreClass,
  ecoreClasses: string[]
): string {
  let ecoreClassXML = "";

  const interfaceAttributes = `
    abstract="true"
    interface="true"`;

  ecoreClassXML += `
  <eClassifiers
    xsi:type="ecore:EClass"
    name="${ecoreClass.name}" ${ecoreClass.interface ? interfaceAttributes : ""}
  >`;

  ecoreClass.features.forEach(
    (feature) => (ecoreClassXML += generateEcoreFeature(feature, ecoreClasses))
  );
  ecoreClass.references.forEach(
    (reference) =>
      (ecoreClassXML += generateEcoreReference(
        reference,
        ecoreClasses,
        ecoreClass
      ))
  );

  ecoreClassXML += `
  </eClassifiers>`;

  return ecoreClassXML;
}

export function generateEcoreFeature(
  ecoreFeature: EcoreFeature,
  ecoreClasses: string[]
): string {
  let upperBound = "";
  let lowerBound = "";
  let extraFeatures = "";

  if (ecoreFeature.boundDefinition != undefined) {
    if (ecoreFeature.boundDefinition.upperBound != undefined)
      upperBound = `
      upperBound="${ecoreFeature.boundDefinition.upperBound}"`;
    if (ecoreFeature.boundDefinition.lowerBound != undefined)
      lowerBound = `
      lowerBound="${ecoreFeature.boundDefinition.lowerBound}"`;
  }

  if (ecoreFeature.required) {
    if (lowerBound == "")
      lowerBound = `
      lowerBound="1"`;
  }

  if (ecoreFeature.final)
    extraFeatures += `
      unsettable="true"`;
  if (ecoreFeature.volatile)
    extraFeatures += `
      volatile="true"`;
  if (ecoreFeature.transient)
    extraFeatures += `
      transient="true"`;

  return `
    <eStructuralFeatures
      xsi:type="ecore:EAttribute"
      name="${
        ecoreFeature.featureName
      }"${upperBound}${lowerBound}${extraFeatures}
      eType="${translate_etype(ecoreFeature.name, ecoreClasses)}"
    />`;
}

export function translate_etype(type: string, ecoreClasses: string[]): string {
  if (ecoreClasses.includes(type)) return `#//${type}`;
  return `ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//E${ecoreFormat(
    type
  )}`;
}

function ecoreFormat(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function translate_eclass_ref(eClass: string, ecoreClasses: string[]): string {
  return translate_etype(eClass, ecoreClasses);
}

export function generateEcoreReference(
  ecoreReference: EcoreReference,
  ecoreClasses: string[],
  ecoreParent: EcoreClass
): string {
  let upperBound = "";
  let lowerBound = "";

  if (ecoreReference.boundDefinition != undefined) {
    if (ecoreReference.boundDefinition.upperBound != undefined)
      upperBound = `
      upperBound="${ecoreReference.boundDefinition.upperBound}"`;
    if (ecoreReference.boundDefinition.lowerBound != undefined)
      lowerBound = `
      lowerBound="${ecoreReference.boundDefinition.lowerBound}"`;
  }

  if (ecoreReference.required) {
    if (lowerBound == "")
      lowerBound = `
      lowerBound="1"`;
  }

  let containment = "";

  if (!ecoreReference.refers) {
    containment = `
      containment="${ecoreReference.containmentType === "Containment"}"`;
  }

  let opposite = "";

  if (ecoreReference.opposite != undefined) {
    opposite = findOpposite(ecoreReference, ecoreParent);
  }

  return `
    <eStructuralFeatures
      xsi:type="ecore:EReference"
      name="${ecoreReference.featureName}"${upperBound}${lowerBound}
      eType="${translate_eclass_ref(
        ecoreReference.references.classReference.$refText,
        ecoreClasses
      )}"${containment}${opposite}
    />`;
}

export function generateEcoreEnum(ecoreEnum: EcoreEnum): string {
  let ecoreEnumXML = `
  <eClassifiers
    xsi:type="ecore:EEnum"
    name="${ecoreEnum.name}"
  >`;

  ecoreEnum.enumEntry.forEach((entry: EcoreEnumEntry, i: number) => {
    ecoreEnumXML += `
    <eLiterals
      name="${entry.name}"
      value="${i}"
      literal="${entry.name.toLowerCase()}"
    />`;
  });

  ecoreEnumXML += `
  </eClassifiers>`;

  return ecoreEnumXML;
}

function generateGenmodelEnum(ecoreEnum: EcoreEnum, fileName: string): string {
  let xml = `
    <genEnums
      typeSafeEnumCompatible="false"
      ecoreEnum="${fileName}#//${ecoreEnum.name}"
    >`;

  ecoreEnum.enumEntry.forEach((entry) => {
    xml += `
      <genEnumLiterals
        ecoreEnumLiteral="${fileName}#//${ecoreEnum.name}/${entry.name}"
      />`;
  });

  xml += `
    </genEnums>`;

  return xml;
}

function generateGenmodelAttribute(
  feature: EcoreFeature,
  className: string,
  fileName: string
): string {
  let xml = `
      <genFeatures
        createChild="false"
        ecoreFeature="ecore:EAttribute ${fileName}#//${className}/${feature.featureName}"
      />`;

  return xml;
}

function generateGenmodelReference(
  reference: EcoreReference,
  className: string,
  fileName: string
): string {
  let xml = `
      <genFeatures`;

  if (!reference.refers && reference.containmentType === "Containment") {
    xml += `
        property="None"`;
    xml += `
        children="true"`;
    xml += `
        createChild="true"`;
  } else {
    xml += `
        notify="false"`;
    xml += `
        createChild="false"`;
    xml += `
        propertySortChoices="true"`;
  }

  xml += `
        ecoreFeature="ecore:EReference${fileName}#//${className}/${reference.featureName}"`;

  xml += `
      />`;

  return xml;
}

function generateGenmodelClass(
  ecoreClass: EcoreClass,
  fileName: string
): string {
  let image = ecoreClass.interface
    ? `
      image="false" `
    : "";
  let xml = `
    <genClasses ${image}
      ecoreClass="${fileName}#//${ecoreClass.name}"
    >`;

  ecoreClass.features.forEach((feature) => {
    xml += generateGenmodelAttribute(feature, ecoreClass.name, fileName);
  });

  ecoreClass.references.forEach((feature) => {
    xml += generateGenmodelReference(feature, ecoreClass.name, fileName);
  });

  xml += `
    </genClasses>`;

  return xml;
}

export function generateXML(ecoreModel: EcoreModel): string {
  let text = `<?xml version="1.0" encoding="UTF-8"?>`;

  MODEL = ecoreModel;

  text += `
<ecore:EPackage
  xmi:version="2.0"
  xmlns:xmi="http://www.omg.org/XMI"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:ecore="http://www.eclipse.org/emf/2002/Ecore"
  name="${ecoreModel.name.name}"
  nsPrefix="${ecoreModel.name.name}"
  nsURI="${ecoreModel.nsUri !== undefined ? ecoreModel.nsUri.name : ""}"
>`;

  console.log("ecore-model name : ", ecoreModel.name.name);

  let ecoreClassesName = ecoreModel.ecoreClasses.map(
    (ecoreClass) => ecoreClass.name
  );
  let ecoreEnums = ecoreModel.ecoreEnums.map((ecoreClass) => ecoreClass.name);

  // used to check if the datatype of a feature is an ecore datatype or model-defined class
  const ecoreClasses = ecoreClassesName.concat(ecoreEnums);

  ecoreModel.ecoreClasses.forEach((ecoreClass) => {
    text += generateEcoreClass(ecoreClass, ecoreClasses);
  });
  ecoreModel.ecoreEnums.forEach((ecoreEnum) => {
    text += generateEcoreEnum(ecoreEnum);
  });

  text += `
</ecore:EPackage>`;

  return text;
}

function generateGenmodelXML(
  model: EcoreModel,
  destination: string,
  name: string
): string {
  let text = '<?xml version="1.0" encoding="UTF-8"?>';
  let ecoreModelFileName = `${name}.ecore`;

  text += `
<genmodel:GenModel
  xmi:version="2.0"
  xmlns:xmi="http://www.omg.org/XMI"
  xmlns:ecore="http://www.eclipse.org/emf/2002/Ecore"
  xmlns:genmodel="http://www.eclipse.org/emf/2002/GenModel"
  modelDirectory="/${destination}"
  modelPluginID="${name}"
  modelName="${model.name.name}"
  rootExtendsClass="org.eclipse.emf.ecore.impl.MinimalEObjectImpl$Container"
  importerID="org.eclipse.emf.importer.ecore"
  complianceLevel="5.0"
  copyrightFields="false"
  operationReflection="true"
  importOrganizing="true"
>`;

  text += `
  <foreignModel>${ecoreModelFileName}</foreignModel>`;

  text += `
  <genPackages
    prefix="Examplemodel"
    disposableProviderFactory="true"
    ecorePackage="${ecoreModelFileName}#/"
  >`;

  model.ecoreEnums.forEach((ecoreEnum) => {
    text += generateGenmodelEnum(ecoreEnum, ecoreModelFileName);
  });

  model.ecoreClasses.forEach((ecoreClass) => {
    text += generateGenmodelClass(ecoreClass, ecoreModelFileName);
  });

  text += `
  </genPackages>`;

  text += `
</genmodel:GenModel>`;

  return text;
}

function findOpposite(
  ecoreReference: EcoreReference,
  ecoreParent: EcoreClass
): string {
  // eOpposite="#//Universitet/studenter"

  if (ecoreReference.opposite.oppositeClass == undefined) {
    let refClass = getEcoreClassDefinition(
      ecoreReference.references.classReference.$refText
    );

    return `
      eOpposite="#//${refClass?.name}/${getEcoreClassDefinitionRefName(
      refClass,
      ecoreParent.name
    )}"`;
  }

  return `
      eOpposite="#//${
        ecoreReference.opposite.oppositeClass.$refText
      }/${getEcoreClassDefinitionRefName(
    ecoreReference.opposite.oppositeClass.ref,
    ecoreParent.name
  )}"`;
}

function getEcoreClassDefinition(ecoreClassName: string) {
  return MODEL?.ecoreClasses.find(
    (ecoreClass) => ecoreClass.name == ecoreClassName
  );
}

/**
 * Funcion to get the name of a reference within a given class with a given type
 */
function getEcoreClassDefinitionRefName(
  ecoreClass: EcoreClass | undefined,
  ecoreFeatureType: string
): string {
  if (ecoreClass == undefined)
    throw "Invalid Ecore Opposite Reference: Ecore class undefined";

  let featureName;

  console.log(`Trying to find feature ${ecoreFeatureType}`);
  console.log(`Looking at class ${ecoreClass.name}`);

  featureName = ecoreClass.features.find(
    (ecoreFeature) => ecoreFeature.name == ecoreFeatureType
  )?.featureName;
  if (featureName != undefined) return featureName;

  featureName = ecoreClass.references.find(
    (ecoreReference) =>
      ecoreReference.references.classReference.$refText == ecoreFeatureType
  )?.featureName;
  if (featureName != undefined) return featureName;

  if (featureName == undefined)
    throw "Invalid Ecore Opposite Reference: Ecore class featureName undefined";

  return "";
}

function generateModelFile(
  filePath: string,
  destination: string | undefined,
  fileExtension: string,
  fileNode: CompositeGeneratorNode
): string {
  const data = extractDestinationAndName(filePath, destination);
  let generatedFilePath = `${path.join(data.destination, data.name)}`.concat(
    fileExtension
  );

  if (destination == undefined) {
    data.destination = data.destination.replace("/vscore/", "/vs-core/");
    generatedFilePath = generatedFilePath.replace("/vscore/", "/vs-core/");
  }

  if (!fs.existsSync(data.destination)) {
    fs.mkdirSync(data.destination, { recursive: true });
  }
  fs.writeFileSync(generatedFilePath, processGeneratorNode(fileNode));
  return generatedFilePath;
}

export function generateEcore(
  ecoreModel: EcoreModel,
  filePath: string,
  destination: string | undefined
): string {
  const fileNode = new CompositeGeneratorNode();
  fileNode.append(generateXML(ecoreModel), NL);

  return generateModelFile(filePath, destination, ".ecore", fileNode);
}

export function generateGenmodel(
  ecoreModel: EcoreModel,
  filePath: string,
  destination: string | undefined
): string {
  const data = extractDestinationAndName(filePath, destination);

  const fileNode = new CompositeGeneratorNode();
  fileNode.append(
    generateGenmodelXML(ecoreModel, data.destination, data.name),
    NL
  );

  return generateModelFile(filePath, destination, ".genmodel", fileNode);
}
