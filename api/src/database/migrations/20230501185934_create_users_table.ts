import {Knex} from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('user', function (tableBuilder) {
        tableBuilder.string('id').primary()
    })
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable('user')
}

