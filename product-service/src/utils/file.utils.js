const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream/promises');

const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const saveFileStream = async (fileStream, destinationPath) => {
  await pipeline(fileStream, fs.createWriteStream(destinationPath));
};

module.exports = {
  ensureDirectoryExists,
  saveFileStream
};
