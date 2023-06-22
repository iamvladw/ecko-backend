let ws;

function connectWebSocket() {
    ws = new WebSocket('ws://localhost:8081');

    ws.addEventListener('open', () => {
        ws.send(JSON.stringify({ route: 'staticPage' }));
        console.log('WebSocket connection established.');
    });

    ws.addEventListener('message', (event) => {
        const wsData = JSON.parse(event.data);

        if (wsData.currentVersion !== wsData.githubVersion) {
            const updateNotify = document.getElementById('updateNotify');
            updateNotify.href = `https://github.com/iamvladw/ecko-backend/tree/${wsData.currentBranch}`;
            updateNotify.textContent = `Update available! v${wsData.githubVersion}`;
        }

        document.getElementById(
            'server-status'
        ).className = `sm:text-3xl text-2xl font-medium title-font text-green-500`;
        document.getElementById('server-status').textContent = `ONLINE`;

        document.getElementById(
            'cpu-usage'
        ).textContent = `${wsData.cpuUsage} %`;
        document.getElementById(
            'mem-usage'
        ).textContent = `${wsData.memUsage}`;
        document.getElementById('requests').textContent = `${wsData.requests}`;
        document.getElementById(
            'responses'
        ).textContent = `${wsData.responses}`;
        document.getElementById(
            'branch-github'
        ).textContent = `${wsData.currentBranch}`;
        document.getElementById(
            'commit-github'
        ).textContent = `${wsData.currentCommit}`;

        document.getElementById(
            'footer-data'
        ).innerHTML = `© 2023 Ecko Backend v${wsData.currentVersion} — <a href="https://github.com/iamvladw" class="text-red-500 ml-1" target="_blank" rel="noopener noreferrer">📌 @iamvladw</a> — <a href="https://github.com/sponsors/iamvladw" class="text-green-500 ml-1" target="_blank" rel="noopener noreferrer">💸 Sponsor me</a>`;
    });

    ws.addEventListener('error', (error) => {
        console.error('WebSocket error:', error);
        reconnectWebSocket();
    });

    ws.addEventListener('close', () => {
        console.log('WebSocket connection closed.');
        reconnectWebSocket();
    });
}

function reconnectWebSocket() {
    setTimeout(() => {
        document.getElementById(
            'server-status'
        ).className = `sm:text-3xl text-2xl font-medium title-font text-red-500`;
        document.getElementById('server-status').textContent = `OFFLINE`;

        document.getElementById('cpu-usage').textContent = `0.00 %`;
        document.getElementById('mem-usage').textContent = `0.00`;
        document.getElementById('requests').textContent = `0`;
        document.getElementById('responses').textContent = `0`;
        document.getElementById('branch-github').textContent = `Undefined`;
        document.getElementById('commit-github').textContent = `Undefined`;

        console.log('Attempting to reconnect WebSocket...');
        connectWebSocket();
    }, 3000);
}

connectWebSocket();

setTimeout(() => {
    const _wikiButton = document.getElementById('_wikiButton');
    const _githubButton = document.getElementById('_githubButton');

    _wikiButton.addEventListener('click', () => {
        window.location.href = 'https://github.com/iamvladw/ecko-backend/wiki';
    });

    _githubButton.addEventListener('click', () => {
        window.location.href = 'https://github.com/iamvladw/ecko-backend';
    });
}, 1000);
