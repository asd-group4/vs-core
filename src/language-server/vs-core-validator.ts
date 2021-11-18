import { ValidationAcceptor, ValidationCheck, ValidationRegistry } from 'langium';
import { VsCoreAstType } from './generated/ast';
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
        };
        this.register(checks, validator);
    }
}

/**
 * Implementation of custom validations.
 */
export class VsCoreValidator {

    checkPersonStartsWithCapital(person: any, accept: ValidationAcceptor): void {
        if (person.name) {
            const firstChar = person.name.substring(0, 1);
            if (firstChar.toUpperCase() !== firstChar) {
                accept('warning', 'Person name should start with a capital.', { node: person, property: 'name' });
            }
        }
    }

}
