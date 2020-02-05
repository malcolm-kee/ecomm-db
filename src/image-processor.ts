import fs from 'fs';
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

export class ImageProcessor {
  private stack: ImageDetails[] = [];
  private capacity: number = 5;
  private processing: number = 0;

  constructor(capacity: number) {
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
        const sharp = await getSharp(image.imagePath);
        const processResult = await generateImage(sharp, image.options);
        await writeFile(image.outputPath, processResult.sharp, processResult.buffer);
        this.processing--;
        this.processNextImage();
      }
    }
  }
}
