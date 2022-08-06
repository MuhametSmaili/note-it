module.exports = {
  branches: 'main',
  repositoryUrl: 'https://github.com/MuhametSmaili/note-it',
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    [
      'semantic-release-chrome',
      {
        asset: 'note-it.zip',
        distFolder: 'build',
        extensionId: 'gkfjolpbhbinhoaehiejoglclongclld',
      },
    ],
    [
      '@semantic-release/github',
      {
        assets: [{ name: 'note-it-${nextRelease.version}.zip', path: 'note-it.zip' }],
      },
    ],
  ],
};
