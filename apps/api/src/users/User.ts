import {Model} from "objection";

export interface IUser {
    id: string
}

export class User extends Model {
    id!: string

    static get tableName() {
        return 'user';
    }

    static get idColumn() {
        return 'id';
    }
}
