import 'reflect-metadata'
import {DefaultType, Constructor, OpenApiPropDecorator, Enum} from "./openapi.decorator";


type OpenapiPropOptions = {
    type?: 'object' | 'array', // Si le type principal et le type optionnel sont 'object' générer une exeption. Idem pour array
                               // Si le type principal est un CONSTRUCTOR il faut absolument indiquer si c'est un array ou un object type. Idem pour enum
    minMax?: { maxLength?: number, minLength?: number },
    required?: boolean,
    additionalProperties?: boolean,
    enum?: string
}


// Pour enum, si le type est un constructor
// et que enum est à true alors je génére le schema pour l'enum (si pas présent dans les schemas globayx)
// Je peux également indiquer que il peut y avoir un array d'enum.
// minMax et additionalProperties doivent être impérativement à undefined
// Je dois spécifier absolument si le type est un object ou un array ?
export function OpenapiProp(
    types: (DefaultType|Constructor|Enum)[],
    options?: OpenapiPropOptions // Créer des types pour les objets, les constructors ....
) {
    return (target: Object, propName: string) => {
        const openApiProp = new OpenApiPropDecorator(target.constructor as Constructor)

        // Throw les errors (peut être utiliser chatgtp pour les définir)
        // Va falloir que prennent en charge les tableaux de types
        for (const type of types) {
            if (typeof type === 'function' || typeof type === 'object') {
                generateEnumAndConstructorSpec(openApiProp, propName, type, options)
            }
        }

        const defaultTypes = types
            .filter(
                type => typeof type !== 'object' && typeof type !== 'function'
            ) as DefaultType[]

        if (defaultTypes.length > 0) {
            openApiProp.addDefaultProperty(propName, {
                type: defaultTypes,
                maxLength: options?.minMax?.maxLength,
                minLength: options?.minMax?.minLength,
                additionalProperties: options?.additionalProperties
            })
        }

        if (options?.required) {
            openApiProp.addRequired(propName)
        }
    };
}

const generateEnumAndConstructorSpec = (
    openApiProp: OpenApiPropDecorator,
    propName: string,
    type: Constructor | Enum,
    options?: OpenapiPropOptions // {enum: string, type: 'object' | 'array'} // Faut que cela soit plus restrictif
) => {
    if (typeof type === 'function' && options && options.type) {
        openApiProp.addRefProperty(propName, type.name, options)
        openApiProp.addSchema(type)
    }
    if (options && options.enum && typeof type !== 'function') {
        openApiProp.addRefProperty(propName, options.enum, options)
        openApiProp.addEnum({name: options.enum, type})
    }
}
