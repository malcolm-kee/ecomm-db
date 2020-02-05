import fs from 'fs';
import { EventEmitter } from 'events';
import { Sharp } from 'sharp';
import { GenerateImageOption } from './type';
import { getSharp, generateImage } from './process-image';

function writeFile(filePath: string, sharp: Sharp, buffer: Buffer | null) {
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

export type ImageDetails = {
  imagePath: string;
  outputPath: string;
  options: GenerateImageOption;
};

export class ImageProcessor extends EventEmitter {
  private stack: ImageDetails[] = [];
  private capacity: number = 5;
  private processing: number = 0;

  constructor(capacity: number = 5) {
    super();
    this.capacity = capacity;
  }

  addImage(image: ImageDetails) {
    this.stack.push(image);
    this.processNextImage();
  }

  async processNextImage() {
    if (this.processing < this.capacity) {
      const image = this.stack.pop();
      if (image) {
        this.processing++;
        try {
          const sharp = await getSharp(image.imagePath);
          const processResult = await generateImage(sharp, image.options);
          await writeFile(image.outputPath, processResult.sharp, processResult.buffer);
        } catch (e) {
          console.error(`Error when processing image ${image.imagePath}`);
          console.error(e);
        } finally {
          this.processing--;
          this.processNextImage();
        }
      } else {
        this.emit('done');
      }
    }
  }

  get isEmpty() {
    return this.processing === 0;
  }
}
