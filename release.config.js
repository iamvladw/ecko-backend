module.exports = {
    branches: ['development'],
    plugins: [
        '@semantic-release/commit-analyzer',
        '@semantic-release/release-notes-generator',
        '@semantic-release/github',
        [
            '@semantic-release/git',
            {
                assets: [
                    'tsconfig.json',
                    'tailwind.config.js',
                    'package.json',
                    'nodemon.json',
                    'nginx.conf',
                    'LICENSE',
                    'config.example.json',
                    '.prettierrc.json',
                    '.eslintrc.json',
                    '.gitignore',
                    'src/**/*'
                ],
                message:
                    'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}'
            },
            'semantic-release-version',
            {
                packageFile: 'package.json',
                releaseNotesFile: 'CHANGELOG.md',
            },
        ]
    ]
};
