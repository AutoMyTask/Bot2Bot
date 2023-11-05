import {TypesCore} from "api-core-types";

type OpenapiObjectDescriptorOption = { description: string }

export class OpenapiObjectDescriptorDecorator {
    public metadata: {
        option: OpenapiObjectDescriptorOption
    }

    constructor(
        protected readonly target: TypesCore.New
    ) {

        this.metadata = Reflect.getMetadata('option', this.target) || {
            option: {}
        }
    }

    addOption(option: OpenapiObjectDescriptorOption) {
        this.metadata.option = option
    }

    update() {
        Reflect.defineMetadata('option', this.metadata, this.target)
    }
}

export function OpenapiObjectDescriptor(
    option: OpenapiObjectDescriptorOption
) {
    return (target: Object) => {
        const openapiObjectDescriptor = new OpenapiObjectDescriptorDecorator(target as TypesCore.New)
        openapiObjectDescriptor.addOption(option)
        openapiObjectDescriptor.update()
    }
}
