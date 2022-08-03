module.exports = {
  branches: 'main',
  repositoryUrl: 'https://github.com/MuhametSmaili/note-it',
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/github',
  ],
};
