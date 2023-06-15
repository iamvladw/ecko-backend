/* eslint-disable @typescript-eslint/no-explicit-any */
import inquirer, { QuestionCollection, Answers } from 'inquirer';
import logger from './winston.helper';
import { SetupConfig } from '../interfaces/config.interface';
import helperCache from './cache.helper';
import { v4 as uuid } from 'uuid';
import helperAES from './aes.helper';
import helperFunctions from './functions.helper';

class helperSetup {
    private static questions: QuestionCollection[] = [
        {
            type: 'input',
            name: 'serverName',
            message: 'What\'s the server name?'
        },
        {
            type: 'input',
            name: 'serverLocation',
            message: 'What\'s the server location?'
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

    private static generateServerConfig(answers: Answers): SetupConfig {
        const secret = helperFunctions.randomString(
            answers.secretLenght as number
        );

        const serverConfig: SetupConfig = {
            serverName: answers.serverName as string,
            uuid: uuid(),
            location: answers.serverLocation as string,
            secret: secret,
            secretPhrase: answers.secretPhrase as string,
            apiKey: helperAES.encrypt(
                (answers.secretPhrase as string) ||
                    'api.node.ecko.backend.server',
                secret
            ) as string
        };

        return serverConfig;
    }

    public static async initializeServerSetup(): Promise<void> {
        try {
            if (!helperCache.instance.server.apiKey) {
                logger.log('setup', 'Welcome to Ecko Backend Server Setup');
                logger.log('setup', '------------------------------------');
                logger.log(
                    'setup',
                    'This setup will guide you through the process of configuring your Ecko Backend server.'
                );
                logger.log(
                    'setup',
                    'Please provide the requested information to generate the server configuration.'
                );

                const answers: Answers = await inquirer.prompt(this.questions);

                // Generate the server configuration
                const setupConfig = this.generateServerConfig(answers);

                helperCache.instance.server = setupConfig;

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
                    `Name: ${helperCache.instance.server.serverName}`
                );
                logger.log(
                    'setup',
                    `UUID: ${helperCache.instance.server.uuid}`
                );
                logger.log(
                    'setup',
                    `Location: ${helperCache.instance.server.location}`
                );
                logger.log(
                    'setup',
                    `Secret: ${helperCache.instance.server.secret}`
                );
                logger.log(
                    'setup',
                    `Secret Phrase: ${helperCache.instance.server.secretPhrase}`
                );
                logger.log(
                    'setup',
                    `apiKey: ${helperCache.instance.server.apiKey}`
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
        } catch (error) {
            logger.error(
                'Error occurred while generating server configuration:',
                error
            );
        }
    }
}

export default helperSetup;
