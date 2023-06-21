<br />
<p align="center">
  <a href="https://github.com/iamvladw/ecko-backend">
    <img src="./.media/ecko-logo-white.png" alt="Logo" width="30%" height="10%">
  </a>

  <h3 align="center">Ecko Backend Server</h3>

  <p align="center">
    A powerful and scalable backend application for the Ecko social media platform
    <br />
    <a href="https://github.com/iamvladw/ecko-backend/wiki"><strong>Explore the wiki »</strong></a>
    <br />
    <br />
    <a href="https://github.com/iamvladw/ecko-backend">View Demo</a>
    ·
    <a href="https://github.com/iamvladw/ecko-backend/issues">Report Bug</a>
    ·
    <a href="https://github.com/iamvladw/ecko-backend/issues">Request Feature</a>
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/github/actions/workflow/status/iamvladw/ecko-backend/jest.yml?label=Tests&style=popout&branch=development" alt="CI">
  <img src="https://img.shields.io/github/package-json/v/iamvladw/ecko-backend?label=Version&style=popout" alt="Version">
  <img src="https://img.shields.io/github/last-commit/iamvladw/ecko-backend?label=Last%20Commit&style=popout" alt="Last Commit">
  <img src="https://img.shields.io/github/downloads/iamvladw/ecko-backend/total?label=Downloads&style=popout" alt="Downloads">
  <img src="https://img.shields.io/github/contributors/iamvladw/ecko-backend?label=Contributors&style=popout" alt="Contributors">
  <img src="https://img.shields.io/github/release-date/iamvladw/ecko-backend?label=Release%20Date&style=popout" alt="Release Date">
</p>

### Table of Contents

<details open="open">
  <summary>Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About the Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li><a href="#getting-started">Getting Started</a></li>
    <li><a href="#api-reference">API Reference</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
  </ol>
</details>

### About the Project

The Ecko Backend is a powerful and scalable backend application that serves as the foundation for the Ecko social media platform. It provides a robust set of features and functionalities to handle user authentication, data storage, and API management, supporting both SQL and NoSQL databases. The backend supports seamless database replication and synchronization, ensuring data consistency across multiple nodes. To enhance security, AES encryption is implemented for API keys and other sensitive user data, safeguarding user privacy.

The Ecko Backend incorporates JSON Web Tokens (JWT) for secure user authentication and authorization. It includes a root privileges checker to ensure proper access control and prevent unauthorized actions. The backend operates in both HTTP and HTTPS modes, supporting encrypted communication over secure connections. Request compression minimizes bandwidth usage and improves overall performance.

To handle high traffic and prevent abuse, the backend includes a request limiter that applies rate limiting policies. The project comes with recommended extensions and is Docker dev container-ready, facilitating seamless development and deployment workflows. The extensible architecture enables developers to extend and customize the backend to meet specific requirements.

### Built With

-   Node.js
-   Express.js
-   TypeScript
-   TypeORM
-   JSONWebToken
-   Crypto-js
-   Winston

## Getting Started

To get started with the Ecko Backend, follow these steps:

### Prerequisites

-   Node.js 20 (using NVM)
-   `config.json` file

### Installation

1. Install NVM (Node Version Manager) by following the instructions for your operating system:

    - **Windows**: Visit the NVM for Windows repository at [https://github.com/coreybutler/nvm-windows](https://github.com/coreybutler/nvm-windows) and follow the installation guide.
    - **Linux/macOS**: Open your terminal and run the following command:
        ```bash
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
        ```

2. Reload the shell configuration
   
   - **Linux/macOS**: Run the following command:
        ```bash
        source ~/.bashrc
        ```

3. Install Node.js 20 by running the following command:
    ```bash
    nvm install 20
    ```
4. Verify that Node.js 20 is installed:
    ```bash
    node --version
    ```

### Clone the Repository

1. Clone the repository:
    ```bash
    git clone https://github.com/iamvladw/ecko-backend.git
    ```
2. Navigate to the project directory:
    ```bash
    cd ecko-backend
    ```

### Install Dependencies

1. Install NPM packages:
    ```bash
    npm install
    ```

### Configuration

1. Rename the config.example.json file to config.json and update the necessary configurations according to your environment.

### Usage

1. Start the server as dev:
    ```bash
    npm run dev
    ```

2. Complete the first-time setup by providing the following data:

    ```bash
    Server Name: <Enter the name of your server>
    Server Location: <Enter the location of your server>
    Secret Length: <Enter the desired secret length for verifying the apiKey result (at least 64 characters and less than 256 characters)>
    Secret Phrase: <Enter a secret phrase for verifying the apiKey result (at least 16 characters)>
    ```

    ![Example GIF](./.media/setup-example.gif)

3. Access the backend API at [http://localhost:8080](http://localhost:8080).

Please note that the instructions assume you have NVM already installed. If you don't have NVM, you can follow the provided instructions to install it before proceeding with the Node.js 20 installation.

Additionally, make sure to have the `config.json` file in your project directory and rename the provided `config.example.json` file to `config.json` for proper configuration.

## API Reference

For detailed information about the API endpoints and request/response examples, please refer to the [API Reference documentation](https://github.com/iamvladw/ecko-backend/wiki/API-Reference).

## License

This project is licensed under the [CC-BY-NC-ND-4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/) license.

## Contact

Project Link: [https://github.com/iamvladw/ecko-backend](https://github.com/iamvladw/ecko-backend)
