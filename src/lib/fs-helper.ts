import fs from 'fs';
import { Sharp } from 'sharp';
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

export function writeFile(filePath: string, sharp: Sharp, buffer: Buffer | null) {
  return new Promise((fulfill, reject) => {
    const writeStream = fs.createWriteStream(filePath);
    writeStream.once('error', reject);
    writeStream.once('finish', fulfill);

    if (buffer) {
      writeStream.write(buffer);
      writeStream.end();
    } else {
      sharp.pipe(writeStream);
    }
  });
}
