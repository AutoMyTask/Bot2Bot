import {New} from "../types";

export class MetadataCollection {
    public items: object[] = []

    push(...metadata: object[]) {
        this.items.push(...metadata)
    }

    getAllMetadataAttributes<T extends New>(type: T): InstanceType<T>[] {
        return this.items
            .filter(metadata => metadata instanceof type)
            .map(metadata => metadata as InstanceType<T>);
    }
}
