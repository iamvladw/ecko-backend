import request from 'supertest';
import { eckoAPIServer, serverAPI, serverEnabled } from '../server';
import { cleanupInterval } from '../helpers/cdn.helper';

describe('Testing Users Route', () => {
    beforeAll(async () => {
        while (!serverEnabled) {
            await new Promise((resolve) => {
                return setTimeout(resolve, 1000);
            });
        }
    });

    it('route /add/user should return 401 if username is empty', async () => {
        const response = await request(serverAPI).post('/users/add/user').send({
            username: '',
            email: 'test@example.com',
            password: 'password123'
        });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            error: [
                {
                    location: 'body',
                    msg: 'Username is required',
                    path: 'username',
                    type: 'field',
                    value: ''
                }
            ]
        });
    });

    it('route /add/user should return 400 if email is empty', async () => {
        const response = await request(serverAPI)
            .post('/users/add/user')
            .send({ username: 'testuser', email: '', password: 'password123' });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            error: [
                {
                    location: 'body',
                    msg: 'Email is required',
                    path: 'email',
                    type: 'field',
                    value: ''
                }
            ]
        });
    });

    it('route /add/user should return 400 if password is empty', async () => {
        const response = await request(serverAPI).post('/users/add/user').send({
            username: 'testuser',
            email: 'test@example.com',
            password: ''
        });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            error: [
                {
                    location: 'body',
                    msg: 'Password is required',
                    path: 'password',
                    type: 'field',
                    value: ''
                }
            ]
        });
    });

    it('route /add/user should return 400 if username and password are empty', async () => {
        const response = await request(serverAPI)
            .post('/users/add/user')
            .send({ username: '', email: 'test@example.com', password: '' });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            error: [
                {
                    location: 'body',
                    msg: 'Username is required',
                    path: 'username',
                    type: 'field',
                    value: ''
                },
                {
                    location: 'body',
                    msg: 'Password is required',
                    path: 'password',
                    type: 'field',
                    value: ''
                }
            ]
        });
    });

    it('route /edit/user should return 401 if username is empty', async () => {
        const response = await request(serverAPI)
            .put('/users/edit/user/:uuid')
            .send({ username: '', email: '', password: 'password123' });

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ error: 'Invalid user' });
    });

    it('route /remove/user should return 401 if username is empty', async () => {
        const response = await request(serverAPI)
            .delete('/users/remove/user/:uuid')
            .send({ username: '' });

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ error: 'Invalid user' });
    });

    it('route /remove/user should return 401 if user does not exist', async () => {
        const response = await request(serverAPI)
            .delete('/users/remove/user/:uuid')
            .send({ username: 'nonexistent' });

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ error: 'Invalid user' });
    });

    it('route /fetch/user should return 401 if username is empty', async () => {
        const response = await request(serverAPI)
            .get('/users/fetch/user/:uuid')
            .send({ username: '' });

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ error: 'Invalid user' });
    });

    it('route /add/follower should return 400 if user is empty', async () => {
        const response = await request(serverAPI)
            .post('/users/add/follower')
            .send({ user: '', target: 'testuser' });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            error: [
                {
                    location: 'body',
                    msg: 'UUID is required',
                    path: 'user',
                    type: 'field',
                    value: ''
                }
            ]
        });
    });

    it('route /add/follower should return 400 if target is empty', async () => {
        const response = await request(serverAPI)
            .post('/users/add/follower')
            .send({ user: 'testuser', target: '' });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            error: [
                {
                    location: 'body',
                    msg: 'Target uuid is required',
                    path: 'target',
                    type: 'field',
                    value: ''
                }
            ]
        });
    });

    it('route /add/follower should return 401 if user does not exist', async () => {
        const response = await request(serverAPI)
            .post('/users/add/follower')
            .send({ user: 'nonexistent', target: 'testuser' });

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ error: 'Invalid user' });
    });

    it('route /remove/follower should return 400 if user is empty', async () => {
        const response = await request(serverAPI)
            .delete('/users/remove/follower')
            .send({ user: '', target: 'testuser' });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            error: [
                {
                    location: 'body',
                    msg: 'UUID is required',
                    path: 'user',
                    type: 'field',
                    value: ''
                }
            ]
        });
    });

    it('route /remove/follower should return 400 if target is empty', async () => {
        const response = await request(serverAPI)
            .delete('/users/remove/follower')
            .send({ user: 'testuser', target: '' });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            error: [
                {
                    location: 'body',
                    msg: 'Target uuid is required',
                    path: 'target',
                    type: 'field',
                    value: ''
                }
            ]
        });
    });

    it('route /remove/follower should return 401 if user does not exist', async () => {
        const response = await request(serverAPI)
            .delete('/users/remove/follower')
            .send({ user: 'nonexistent', target: 'testuser' });

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ error: 'Invalid user' });
    });

    it('route /fetch/followers should return 401 if user is empty', async () => {
        const response = await request(serverAPI)
            .get('/users/fetch/followers/:uuid')
            .send({ uuid: '' });

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ error: 'Invalid user' });
    });

    it('route /fetch/following should return 401 if user is empty', async () => {
        const response = await request(serverAPI)
            .get('/users/fetch/following/:uuid')
            .send({ uuid: '' });

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ error: 'Invalid user' });
    });

    afterAll(() => {
        clearInterval(cleanupInterval);
        eckoAPIServer.close();
    });
});
