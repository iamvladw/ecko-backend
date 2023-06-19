import express, { Request, Response } from 'express';
import logger from '../helpers/winston.helper';
import path from 'path';
import helperCache from '../helpers/cache.helper';
import packageJson from '../helpers/package.helper';
import os from 'os';
import helperEcko from '../helpers/ecko.helper';
import helperGithub from '../helpers/github.helper';
import helperFunctions from '../helpers/functions.helper';
import websocket from 'ws';

const router = express.Router();

router.get('/', (req, res) => {
    const ip = req.headers['x-forwarded-for'] ?? req.socket.remoteAddress;

    try {
        res.setHeader(
            'Content-Security-Policy',
            'default-src \'self\'; connect-src \'self\' ws://localhost:8081; style-src \'self\' https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/; img-src \'self\' data: https://i.imgur.com/;'
        ).sendFile(path.join(__dirname, '../../src/public/index.html'));
    } catch (err) {
        logger.error(`Error while trying to log out ${ip as string}`);
        logger.error(err as string);
        return res.status(500).json({ message: 'Failed to logout' });
    }
});

router.get('/main.js', (req, res) => {
    const filePath = path.join(__dirname, '../../src/public/main.js');

    res.setHeader('Content-Type', 'application/javascript').sendFile(filePath);
});

export default router;
