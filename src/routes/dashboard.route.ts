import express, { Request, Response } from 'express';
import logger from '../helpers/winston.helper';
import path from 'path';
import mime from 'mime-types';
import helperCache from '../helpers/cache.helper';
import packageJson from '../helpers/package.helper';

const router = express.Router();

router.get('/', (req, res) => {
    res.redirect('/dashboard');
});

router.get('/dashboard', (req, res) => {
    const ip = req.headers['x-forwarded-for'] ?? req.socket.remoteAddress;

    try {
        res.setHeader(
            'Content-Security-Policy',
            'default-src \'self\'; style-src \'self\' https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/; img-src \'self\' data: https://i.imgur.com/;'
        ).sendFile(path.join(__dirname, '../../src/views/dashboard.html'));
    } catch (err) {
        logger.error(`Error while trying to log out ${ip as string}`);
        logger.error(err as string);
        return res.status(500).json({ message: 'Failed to logout' });
    }
});

router.get('/dashboard.js', (req, res) => {
    const filePath = path.join(__dirname, '../../src/views/dashboard.js');
    const mimeType = mime.lookup(filePath);

    if (mimeType === 'application/javascript') {
        res.sendFile(filePath);
    } else {
        res.status(500).send('Internal Server Error');
    }
});

router.get('/dashboard/server-data', (req, res) => {
    const serverInfo = {
        serverName: helperCache.instance.server.serverName,
        currentVersion: packageJson.version,
        githubVersion: 'Your GitHub version'
    };

    res.json(serverInfo);
});

export default router;
