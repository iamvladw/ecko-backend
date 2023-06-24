module.exports = {
    branches: ['development'],
    plugins: [
        '@semantic-release/commit-analyzer',
        '@semantic-release/release-notes-generator',
        [
            '@semantic-release/exec',
            {
                prepareCmd: 'npm version ${nextRelease.version} --no-git-tag-version'
            }
        ],
        '@semantic-release/github',
        '@semantic-release/git'
    ]
};
