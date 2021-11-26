import { Reference, ValidationAcceptor, ValidationCheck, ValidationRegistry } from 'langium';
import { EcoreClass, VsCoreAstType } from './generated/ast';
import { VsCoreServices } from './vs-core-module';

/**
 * Map AST node types to validation checks.
 */
type VsCoreChecks = { [type in VsCoreAstType]?: ValidationCheck | ValidationCheck[] }

/**
 * Registry for validation checks.
 */
export class VsCoreValidationRegistry extends ValidationRegistry {
    constructor(services: VsCoreServices) {
        super(services);
        const validator = services.validation.VsCoreValidator;
        const checks: VsCoreChecks = {
            EcoreClass: [validator.checkImplementsAreInterfaces, 
                validator.checkInterfaceExtend]
        };
        this.register(checks, validator);
    }
}

/**
 * Implementation of custom validations.
 */
export class VsCoreValidator {

    checkInterfaceExtend(ecoreClass: EcoreClass, accept:ValidationAcceptor): void{
        if(ecoreClass.parentClass != null){ 
            if(ecoreClass.parentClass.ref?.interface){
                    accept("error", "A class cannot extend an interface", {node:ecoreClass})
                }
            }
    }

    checkImplementsAreInterfaces(ecoreClass: EcoreClass, accept:ValidationAcceptor): void{
        // validate that all the classes in ecoreClass.implements are interfaces and not classes
        
        if(ecoreClass.interfaces.length > 0){
            ecoreClass.interfaces.forEach((element : Reference<EcoreClass>) => {
               if(element.ref?.class) accept("error", "A class cannot implement a class", {node:ecoreClass})
            });
            /*ecoreClass.interfaces.forEach((implements:EcoreClass) => {
                if(implements.class) accept("error", "A class cannot implement a class", {node:ecoreClass})
            });*/
        }
    }
    
}