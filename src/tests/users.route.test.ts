import request from 'supertest';
import { eckoServer, server, serverEnabled } from '../server';

describe('Testing Users Route', () => {
    beforeAll(async () => {
        while (!serverEnabled) {
            await new Promise((resolve) => {
                return setTimeout(resolve, 1000);
            });
        }
    });

    it('route /add/user should return 401 if username is empty', async () => {
        const response = await request(server).post('/users/add/user').send({
            username: '',
            email: 'test@example.com',
            password: 'password123'
        });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            error: [{
                'location': 'body',
                'msg': 'Username is required',
                'path': 'username',
                'type': 'field',
                'value': ''
            }]
        });
    });

    it('route /add/user should return 400 if email is empty', async () => {
        const response = await request(server)
            .post('/users/add/user')
            .send({ username: 'testuser', email: '', password: 'password123' });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            error: [{
                'location': 'body',
                'msg': 'Email is required',
                'path': 'email',
                'type': 'field',
                'value': ''
            }]
        });
    });

    it('route /add/user should return 400 if password is empty', async () => {
        const response = await request(server).post('/users/add/user').send({
            username: 'testuser',
            email: 'test@example.com',
            password: ''
        });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            error: [{
                'location': 'body',
                'msg': 'Password is required',
                'path': 'password',
                'type': 'field',
                'value': ''
            }]
        });
    });

    it('route /add/user should return 400 if username and password are empty', async () => {
        const response = await request(server)
            .post('/users/add/user')
            .send({ username: '', email: 'test@example.com', password: '' });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            error: [
                {
                    'location': 'body',
                    'msg': 'Username is required',
                    'path': 'username',
                    'type': 'field',
                    'value': ''
                },
                {
                    'location': 'body',
                    'msg': 'Password is required',
                    'path': 'password',
                    'type': 'field',
                    'value': ''
                }
            ]
        });
    });

    it('route /add/user should return 401 if user already exists', async () => {
        // Assuming the user already exists in the database
        const existingUser = {
            username: 'existinguser',
            email: 'existinguser@example.com',
            password: 'password123'
        };

        const response = await request(server)
            .post('/users/add/user')
            .send(existingUser);

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            message: 'User already exists based on the data provided'
        });
    });

    it('route /edit/user should return 401 if username is empty', async () => {
        const response = await request(server).put('/users/edit/user/:uuid').send({
            username: '',
            email: '',
            password: 'password123'
        });

        expect(response.status).toBe(401);
        expect(response.body).toEqual({error: 'Invalid user'});
    });

    it('route /remove/user should return 401 if username is empty', async () => {
        const response = await request(server).delete('/users/remove/user/:uuid').send({
            username: ''
        });

        expect(response.status).toBe(401);
        expect(response.body).toEqual({error: 'Invalid user'});
    });

    it('route /remove/user should return 401 if user does not exist', async () => {
        const response = await request(server).delete('/users/remove/user/:uuid').send({
            username: 'nonexistent'
        });

        expect(response.status).toBe(401);
        expect(response.body).toEqual({error: 'Invalid user'});
    });

    it('route /list/users should return 200 if user exists', async () => {
        const response = await request(server).get('/users/fetch/users').send();

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('users');
    });

    it('route /fetch/user should return 401 if username is empty', async () => {
        const response = await request(server).get('/users/fetch/user/:uuid').send({
            username: ''
        });

        expect(response.status).toBe(401);
        expect(response.body).toEqual({error: 'Invalid user'});
    });

    it('route /add/follower should return 400 if userUUID is empty', async () => {
        const response = await request(server).post('/users/add/follower').send({
            userUUID: '',
            targetUUID: 'testuser' 
        });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            error: [
                {
                    'location': 'body',
                    'msg': 'User uuid is required',
                    'path': 'userUUID',
                    'type': 'field',
                    'value': ''
                }
            ]
        });
    });

    it('route /add/follower should return 400 if targetUUID is empty', async () => {
        const response = await request(server).post('/users/add/follower').send({
            userUUID: 'testuser',
            targetUUID: ''
        });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            error: [
                {
                    'location': 'body',
                    'msg': 'Target uuid is required',
                    'path': 'targetUUID',
                    'type': 'field',
                    'value': ''
                }
            ]
        });
    });

    it('route /add/follower should return 401 if user does not exist', async () => {
        const response = await request(server).post('/users/add/follower').send({
            userUUID: 'nonexistent',
            targetUUID: 'testuser'
        });

        expect(response.status).toBe(401);
        expect(response.body).toEqual({error: 'Invalid user'});
    });

    it('route /remove/follower should return 400 if userUUID is empty', async () => {
        const response = await request(server).delete('/users/remove/follower').send({
            userUUID: '',
            targetUUID: 'testuser'
        });
        
        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            error: [
                {
                    'location': 'body',
                    'msg': 'User uuid is required',
                    'path': 'userUUID',
                    'type': 'field',
                    'value': ''
                }
            ]
        });
    });

    it('route /remove/follower should return 400 if targetUUID is empty', async () => {
        const response = await request(server).delete('/users/remove/follower').send({
            userUUID: 'testuser',
            targetUUID: ''
        });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            error: [
                {
                    'location': 'body',
                    'msg': 'Target uuid is required',
                    'path': 'targetUUID',
                    'type': 'field',
                    'value': ''
                }
            ]
        });
    });

    it('route /remove/follower should return 401 if user does not exist', async () => {
        const response = await request(server).delete('/users/remove/follower').send({
            userUUID: 'nonexistent',
            targetUUID: 'testuser'
        });

        expect(response.status).toBe(401);
        expect(response.body).toEqual({error: 'Invalid user'});
    });

    it('route /fetch/followers should return 401 if userUUID is empty', async () => {
        const response = await request(server).get('/users/fetch/followers/:uuid').send({
            uuid: ''
        });

        expect(response.status).toBe(401);
        expect(response.body).toEqual({error: 'Invalid user'});
    });

    it('route /fetch/following should return 401 if userUUID is empty', async () => {
        const response = await request(server).get('/users/fetch/following/:uuid').send({
            uuid: ''
        });

        expect(response.status).toBe(401);
        expect(response.body).toEqual({error: 'Invalid user'});
    });

    afterAll(() => {
        eckoServer.close();
    });
});
