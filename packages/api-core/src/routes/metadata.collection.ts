import {TypesCore} from "api-core-types";

export interface IMetadataCollection {
    items: object[]
    getAllMetadataAttributes<T extends TypesCore.New>(type: T): InstanceType<T>[]
    push(...metadata: object[]): void
}

export class MetadataCollection implements IMetadataCollection {
    public items: object[] = []

    push(...metadata: object[]): void {
        this.items.push(...metadata)
    }

    getAllMetadataAttributes<T extends TypesCore.New>(type: T): InstanceType<T>[] {
        return this.items
            .filter(metadata => metadata instanceof type)
            .map(metadata => metadata as InstanceType<T>);
    }
}
