import {New} from "../../types";

export type ParamPathType = string | number | 'int' | 'float'
export type ParamType = New | ParamPathType | ParamServiceType
export type Param<TParam extends ParamType> = { name: string, type: TParam, required?: boolean }
export type ParamServiceType = New | string
