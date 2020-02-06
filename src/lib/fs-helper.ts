import fs from 'fs';
import { isUrl } from './is-url';

export function isFileExist(filePath: string) {
  return new Promise<boolean>(fulfill => {
    if (!filePath) return fulfill(false);
    if (isUrl(filePath)) return fulfill(true);

    fs.access(filePath, fs.constants.R_OK, err => {
      if (err) return fulfill(false);
      fulfill(true);
    });
  });
}

export function writeFile(filePath: string, buffer: Buffer) {
  return new Promise((fulfill, reject) => {
    const writeStream = fs.createWriteStream(filePath);
    writeStream.once('error', reject);
    writeStream.once('finish', fulfill);

    writeStream.write(buffer);
    writeStream.end();
  });
}
