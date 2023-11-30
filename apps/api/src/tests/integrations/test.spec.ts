import request from 'supertest'
import {app} from "../../server";


// Ici cela doit se concentrer uniquement sur la partie fonctionnelle.

it('should ', async () => {
    return request(app.app)
        .get('/users/@me/1')
        .set('Authorization', `Bearer ${process.env.AUH0_ACCESS_TOKEN}`)
        .expect(200)
});

it('should ', () => {
    return request(app.app)
        .get('/users/@me/1')
        .set('Authorization', `Bearer ${process.env.AUH0_ACCESS_TOKEN}`)
        .expect(200)
});
