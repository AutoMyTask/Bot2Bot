import { app } from "../server";
import {afterAll, beforeAll} from "@jest/globals";

// L'idéeal c'est de configurer ici la bdd sur l'environement de test
// L'autre serra utilisé sur l'environement de prod ou dev celon les besoins
beforeAll(async () => {
    console.log(process.env.PORT)
    console.log('dddddddd')
})

afterAll(async () => {
    console.log('ddddddd')
})
