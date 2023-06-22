import express from 'express';
import logger from '../helpers/winston.helper';
import path from 'path';
import config from '../helpers/config.helper';

const router = express.Router();

if (config.staticPage) {
    router.get('/', (req, res) => {
        const ip = req.headers['x-real-ip'] ?? req.socket.remoteAddress;

        try {
            res.setHeader(
                'Content-Security-Policy',
                'default-src \'self\'; connect-src \'self\' ws://localhost:8081; style-src \'self\' https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/; img-src \'self\' data: https://i.imgur.com/;'
            ).sendFile(path.join(__dirname, '../../src/public/index.html'));
        } catch (err) {
            logger.error(
                `Error while trying to log out ${ip as string}: ${
                    err as string
                }`
            );
            return res.status(500).json({ message: 'Failed to logout' });
        }
    });

    router.get('/main.js', (req, res) => {
        const filePath = path.join(__dirname, '../../src/public/main.js');

        res.setHeader('Content-Type', 'application/javascript').sendFile(
            filePath
        );
    });
}

export default router;
