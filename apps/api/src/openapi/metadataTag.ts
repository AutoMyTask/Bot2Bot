import {TagObject} from "openapi3-ts/oas31";

export class MetadataTag{
    public readonly tagObject: TagObject
    constructor(
        private readonly name: string,
        private readonly description?: string
    ) {
        this.tagObject = {
            name,
            description
        }
    }
}
