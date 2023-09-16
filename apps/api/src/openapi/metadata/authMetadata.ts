import {SecurityRequirementObject} from "openapi3-ts/src/model/openapi31";


export class AuthMetadata {
    public securitySchema: SecurityRequirementObject[]
    constructor(securityName: string[]) {
        this.securitySchema = securityName.reduce((securitySchema, securityName) => {
            securitySchema.push({ [securityName]: [] })
            return securitySchema
        }, [] as SecurityRequirementObject[])
    }
}
