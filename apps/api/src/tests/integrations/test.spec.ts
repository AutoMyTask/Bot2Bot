import request from 'supertest'
import {app} from "../../server";


it('should ', async () => {
    return request(app.app)
        .get('/users/@me/1')
        .set('Authorization', `Bearer ${process.env.AUTH0_ACCESS_TOKEN}`)
        .expect(200) // Si j'effectue deux fois le même test cela ne fonctionnera pas car le token discord aura refresh
});

it('should ', async () => {
    return request(app.app)
        .get('/users/@me/1')
        .set('Authorization', `Bearer ${process.env.AUTH0_ACCESS_TOKEN}`)
        .expect(200) // Si j'effectue deux fois le même test cela ne fonctionnera pas car le token discord aura refresh
});
