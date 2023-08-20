/* eslint-disable @typescript-eslint/no-explicit-any */
import inquirer, { QuestionCollection, Answers } from 'inquirer';
import logger from './winston.helper';
import { Config, SetupConfig } from '../interfaces/config.interface';
import helperCache from './cache.helper';
import { v4 as uuid } from 'uuid';
import helperAES from './aes.helper';
import helperFunctions from './functions.helper';
import axios from 'axios';
import { JSONData } from '../interfaces/cache.interface';

class helperSetup {
    public static serverUUID: string = uuid();

    public static originAddress: string;
    public static originCache: JSONData;
    public static originConfig: Config;

    private static serverModeQuestion: QuestionCollection[] = [
        {
            type: 'list',
            name: 'serverMode',
            message: 'What\'s the server mode?',
            choices: ['Standalone', 'Load Balancer']
        }
    ];

    private static serverRoleQuestion: QuestionCollection[] = [
        {
            type: 'list',
            name: 'serverRole',
            message: 'What\'s the server role?',
            choices: ['Origin', 'Edge']
        }
    ];

    private static serverOriginQuestion: QuestionCollection[] = [
        {
            type: 'input',
            name: 'serverOrigin',
            message:
                'What\'s the server origin address? (https://example.com or http://192.168.1.1:8080)',
            validate: async (origin) => {
                this.originAddress = origin;
                if (this.originAddress.trim() === '') {
                    return 'Server origin address cannot be empty.';
                }
                const urlPattern = /^(http?|https?):\/\/[^\s/$.?#].[^\s]*$/;
                if (!urlPattern.test(this.originAddress)) {
                    return 'Please enter a valid URL in the format http://example.com or https://192.168.1.1:8080';
                }
                const response = await axios.post(
                    `${this.originAddress}/system/loadbalancer/setup/${this.serverUUID}`
                );
                if (response.status !== 200) {
                    return 'Error while trying to setup the load balancer';
                }
                return true;
            }
        }
    ];

    public static serverSecurityCodeQuestion: QuestionCollection[] = [
        {
            type: 'input',
            name: 'serverSecurityCode',
            message:
                'Enter the security code deployed in the origin server console:',
            validate: async (security: string) => {
                if (security.trim() === '') {
                    return 'Server origin address cannot be empty.';
                }
                const codePattern = /^[0-9]{6}$/;
                if (!codePattern.test(security)) {
                    return 'Please enter a valid security code';
                }
                const responseVerify = axios.post(
                    `${this.originAddress}/system/loadbalancer/verify/${this.serverUUID}`,
                    { securityCode: security }
                );
                if ((await responseVerify).status !== 200) {
                    return 'Invalid security code';
                }
                this.originCache = (await responseVerify).data.cache;
                this.originConfig = (await responseVerify).data.config;
                return true;
            }
        },
        {
            type: 'input',
            name: 'serverName',
            message: 'What\'s the server name?',
            validate: (value) => {
                if (value.trim() === '') {
                    return 'Server name cannot be empty.';
                }
                return true;
            }
        },
        {
            type: 'input',
            name: 'serverLocation',
            message: 'What\'s the server location?',
            validate: (value) => {
                if (value.trim() === '') {
                    return 'Server location cannot be empty.';
                }
                return true;
            }
        }
    ];

    private static standaloneQuestions: QuestionCollection[] = [
        {
            type: 'input',
            name: 'serverName',
            message: 'What\'s the server name?',
            validate: (value) => {
                if (value.trim() === '') {
                    return 'Server name cannot be empty.';
                }
                return true;
            }
        },
        {
            type: 'input',
            name: 'serverLocation',
            message: 'What\'s the server location?',
            validate: (value) => {
                if (value.trim() === '') {
                    return 'Server location cannot be empty.';
                }
                return true;
            }
        },
        {
            type: 'input',
            name: 'secretLenght',
            message:
                'What\'s the secret lenght? (at least 64 characters and less then 256 characters)',
            validate: (input: number) => {
                if (input < 64) {
                    return 'Secret phrase must be at least 64 characters long';
                }
                if (input > 256) {
                    return 'Secret phrase must be less then 256 characters long';
                }
                return true;
            }
        },
        {
            type: 'input',
            name: 'secretPhrase',
            message:
                'Enter a secret phrase for verifying the apiKey result (at least 16 characters):',
            validate: (input: string) => {
                if (input.length < 16) {
                    return 'Secret phrase must be at least 16 characters long';
                }
                return true;
            }
        }
    ];

    private static generateServerConfig(
        answers: Answers,
        uuid: string,
        serverMode: 'Standalone' | 'Load Balancer',
        serverRole: 'Origin' | 'Edge'
    ): SetupConfig {
        const secret = helperFunctions.randomString(
            answers.secretLenght as number
        );

        const serverConfig: SetupConfig = {
            serverName: answers.serverName as string,
            uuid: uuid,
            mode: serverMode,
            role: serverRole,
            origin: answers.serverOrigin,
            location: answers.serverLocation as string,
            secret: secret,
            secretPhrase: answers.secretPhrase as string,
            apiKey: helperAES.encrypt(
                answers.secretPhrase as string,
                secret
            ) as string
        };

        return serverConfig;
    }

    public static async initializeServerSetup(): Promise<void> {
        try {
            if (
                !helperCache.get.server.apiKey &&
                !helperCache.get.server.mode &&
                !helperCache.get.server.role &&
                !helperCache.get.server.origin
            ) {
                logger.log('setup', 'Welcome to Ecko Backend Server Setup');
                logger.log('setup', `${this.serverUUID}`);
                logger.log('setup', '------------------------------------');
                logger.log(
                    'setup',
                    'This setup will guide you through the process of configuring your Ecko Backend server.'
                );
                logger.log(
                    'setup',
                    'Please provide the requested information to generate the server configuration.'
                );

                let answers: Answers = await inquirer.prompt(
                    this.serverModeQuestion
                );

                let setupConfig;

                switch (answers.serverMode) {
                case 'Standalone':
                    answers = await inquirer.prompt(
                        this.standaloneQuestions
                    );

                    setupConfig = this.generateServerConfig(
                        answers,
                        this.serverUUID,
                        'Standalone',
                        'Origin'
                    );
                    break;
                case 'Load Balancer':
                    answers = await inquirer.prompt(
                        this.serverRoleQuestion
                    );
                    if (answers.serverRole === 'Origin') {
                        answers = await inquirer.prompt(
                            this.standaloneQuestions
                        );
                        setupConfig = this.generateServerConfig(
                            answers,
                            this.serverUUID,
                            'Load Balancer',
                            'Origin'
                        );
                    } else {
                        await inquirer.prompt(this.serverOriginQuestion);
                        answers = await inquirer.prompt(
                            this.serverSecurityCodeQuestion
                        );
                        setupConfig = {
                            serverName: answers.serverName,
                            uuid: uuid(),
                            mode: 'Load Balancer',
                            role: 'Edge',
                            origin: this.originAddress,
                            location: answers.serverLocation,
                            secret: this.originCache.server.secret,
                            secretPhrase:
                                    this.originCache.server.secretPhrase,
                            apiKey: this.originCache.server.apiKey
                        };
                        break;
                    }

                    helperCache.get.server = setupConfig;
                    helperCache.get.data = {
                        lastDatabaseLoaded: '',
                        numberOfRequests: 0,
                        numberOfResponses: 0,
                        fileRecords: {}
                    };
                    helperCache.update();

                    logger.log(
                        'setup',
                        `Server configuration generated successfully! ${JSON.stringify(
                            setupConfig
                        )}`
                    );

                    logger.log(
                        'setup',
                        'Based on the data provided, the server generated a UUID and an apiKey'
                    );
                    logger.log(
                        'setup',
                        'Please copy the apiKey to connect the front-end to the backend'
                    );
                    logger.log(
                        'setup',
                        '---------------------------------------------'
                    );
                    logger.log(
                        'setup',
                        `Name: ${helperCache.get.server.serverName}`
                    );
                    logger.log(
                        'setup',
                        `UUID: ${helperCache.get.server.uuid}`
                    );
                    logger.log(
                        'setup',
                        `Location: ${helperCache.get.server.location}`
                    );
                    logger.log(
                        'setup',
                        `Secret: ${helperCache.get.server.secret}`
                    );
                    logger.log(
                        'setup',
                        `Secret Phrase: ${helperCache.get.server.secretPhrase}`
                    );
                    logger.log(
                        'setup',
                        `apiKey: ${helperCache.get.server.apiKey}`
                    );
                    logger.log(
                        'setup',
                        '---------------------------------------------'
                    );
                    logger.log(
                        'setup',
                        'Please copy the data provided from the terminal or latest.log'
                    );
                }

                if (!helperCache.get.data) {
                    helperCache.get.data = {
                        lastDatabaseLoaded: '',
                        numberOfRequests: 0,
                        numberOfResponses: 0,
                        fileRecords: {}
                    };
                    helperCache.update();
                }
            }
        } catch (err) {
            logger.error(
                `Error while trying to generate server configuration: ${
                    err as string
                }`
            );
        }
    }
}

export default helperSetup;
