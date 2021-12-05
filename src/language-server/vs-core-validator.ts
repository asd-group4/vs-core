import {
  Reference,
  ValidationAcceptor,
  ValidationCheck,
  ValidationRegistry,
} from "langium";
import {
  EcoreClass,
  EcoreModel,
  EcoreReference,
  VsCoreAstType,
} from "./generated/ast";
import { VsCoreServices } from "./vs-core-module";

/**
 * Map of AST node types to validation checks.
 */
type VsCoreChecks = {
  [type in VsCoreAstType]?: ValidationCheck | ValidationCheck[];
};

/**
 * Registry for validation checks.
 */
export class VsCoreValidationRegistry extends ValidationRegistry {
  constructor(services: VsCoreServices) {
    super(services);
    const validator = services.validation.VsCoreValidator;
    const checks: VsCoreChecks = {
      EcoreClass: [
        validator.checkImplementsAreInterfaces,
        validator.checkInterfaceExtend,
      ],
      EcoreModel: [validator.validateContainment, validator.validateOpposite],
    };
    this.register(checks, validator);
  }
}

/**
 * Implementation of custom validations.
 */
export class VsCoreValidator {
  checkInterfaceExtend(
    ecoreClass: EcoreClass,
    accept: ValidationAcceptor
  ): void {
    if (ecoreClass.parentClass != null) {
      if (ecoreClass.parentClass.ref?.interface) {
        accept("error", "A class cannot extend an interface", {
          node: ecoreClass,
        });
      }
    }
  }

  checkImplementsAreInterfaces(
    ecoreClass: EcoreClass,
    accept: ValidationAcceptor
  ): void {
    // validate that all the classes in ecoreClass.implements are interfaces and not classes

    if (ecoreClass.interfaces.length > 0) {
      ecoreClass.interfaces.forEach((element: Reference<EcoreClass>) => {
        if (element.ref?.class)
          accept("error", "A class cannot implement a class", {
            node: ecoreClass,
          });
      });
      /*ecoreClass.interfaces.forEach((implements:EcoreClass) => {
                if(implements.class) accept("error", "A class cannot implement a class", {node:ecoreClass})
            });*/
    }
  }

  validateContainment(
    ecoreModel: EcoreModel,
    accept: ValidationAcceptor
  ): void {
    // validate that a container-class has a corresponding containment
    // also validate that a class doesnt have more than one container

    ecoreModel.ecoreClasses.forEach((ecoreClass: EcoreClass) => {
      let containerClasses = ecoreClass.references.filter(
        (ecoreReference: EcoreReference) =>
          ecoreReference.containmentType == "Container"
      );

      if (containerClasses.length > 1)
        accept("error", "A class can only have one container-class", {
          node: containerClasses[containerClasses.length - 1],
        });
    });
  }

  validateOpposite(ecoreModel: EcoreModel, accept: ValidationAcceptor): void {
    // this is a complete mess and should be reformatted
    // purpose is to make sure that a variable cant opposite to a class which
    // doesnt containt itself

    let classMap = new Map();
    let opposites: { classOrigin: EcoreClass; reference: EcoreReference }[] =
      [];

    ecoreModel.ecoreClasses.forEach((ecoreClass: EcoreClass) => {
      classMap.set(ecoreClass.name, ecoreClass);

      ecoreClass.references.forEach((ecoreReference: EcoreReference) => {
        if (ecoreReference.opposite != undefined) {
          opposites.push({
            classOrigin: ecoreClass,
            reference: ecoreReference,
          });
        }
      });
    });

    if (opposites.length > 0) {
      opposites.forEach((opposite) => {
        let valid = false;
        classMap
          .get(opposite.classOrigin.name)
          .references.forEach((reference: EcoreReference) => {
            if (
              reference.references.classReference.$refText ==
              opposite.reference.references.classReference.$refText
            )
              valid = !valid;
          });
        if (!valid)
          accept(
            "error",
            "The opposite reference is either ambiguous or refers to an element which doesn't exist",
            { node: opposite.reference }
          );
      });
    }
  }
}
