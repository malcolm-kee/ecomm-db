import { EventEmitter } from 'events';
import { isFileExist, writeFile } from './lib/fs-helper';
import { generateImage, getSharp } from './process-image';
import { GenerateImageOption } from './type';

export type ImageDetails = {
  imagePath: string;
  outputPath: string;
  option: GenerateImageOption;
};

export class ImageProcessor extends EventEmitter {
  private stack: ImageDetails[] = [];
  private capacity: number = 5;
  private processing: number = 0;
  private shouldLogProgress: boolean = false;

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
          const imageExist = await isFileExist(image.imagePath);
          if (imageExist) {
            const sharp = await getSharp(image.imagePath);
            const processResult = await generateImage(sharp, image.option);
            await writeFile(image.outputPath, processResult.buffer);
          }
        } catch (e) {
          console.error(`Error when processing image ${image.imagePath}`);
          console.error(e);
        } finally {
          this.processing--;
          if (this.shouldLogProgress) {
            console.log(`Remaining: ${this.stack.length + this.processing}`);
          }
          this.processNextImage();
        }
      } else if (this.processing === 0) {
        this.emit('done');
      }
    }
  }

  get isEmpty() {
    return this.processing === 0;
  }

  logProgress() {
    this.shouldLogProgress = true;
  }
}
