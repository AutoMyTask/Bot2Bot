import {New} from "../../types";

export type ParamPathType = string | number | 'int' | 'float'
export type ParamType = New | ParamPathType | ParamServiceType
export type Param<T extends ParamType> = { name: string, type: T, required?: boolean }
export type ParamServiceType = New | string
