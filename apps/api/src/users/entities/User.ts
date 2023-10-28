import {Collection, Entity, ManyToMany, PrimaryKey, Property} from "@mikro-orm/core";

@Entity()
export class User {
    @PrimaryKey()
    id!: string
}
