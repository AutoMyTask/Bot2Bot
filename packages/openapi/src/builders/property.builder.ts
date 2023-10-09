import {SchemaObject} from "openapi3-ts/dist/oas31";
import {ReferenceObject} from "openapi3-ts/oas31";
import {ItemArrayObjectType, DefaultType} from "../decorators/openapi.prop";


export class PropertyDefault {
    public property: SchemaObject = {}

    // Default Type a supprimer
    constructor(type?: DefaultType, options?: { additionalProperties?: boolean }) {
        this.property = type === 'any' ? {} : {type, ...options}
    }

    addUnion(property: SchemaObject | ReferenceObject) {
        this.property.oneOf ??= []
        this.property.oneOf.push(property)
    }
}

export class ArrayObjectProperty {
    public property: SchemaObject

    constructor(
        private readonly type: 'array' | 'object',
        private readonly itemTypes: ItemArrayObjectType[]) {

        this.property = {type}

        if (itemTypes.length > 1) {
            this.generateUnionItems()
        } else {
            this.generateItem()
        }
    }

    private generateItem() {
        const itemType = this.itemTypes[0]
        this.property.items = this.propertyFromItemType(itemType)
    }

    private generateUnionItems() {
        const items: SchemaObject = {oneOf: []}

        for (let itemType of this.itemTypes) {
            items.oneOf?.push(this.propertyFromItemType(itemType))
        }

        this.property.items = items
    }


    private propertyFromItemType(itemType: ItemArrayObjectType): ReferenceObject | SchemaObject {
        if (typeof itemType !== 'string' &&  (typeof itemType === 'function' || typeof itemType === 'object')){
            return {$ref: `#/components/schemas/${itemType.name}`}
        }

        if (itemType === 'any'){
            return {}
        }

        return {type: itemType}
    }

}
