import { createWriteStream } from 'fs';
import { EventEmitter } from 'events';
import { mocked } from 'ts-jest/utils';
import createSharp from 'sharp';

import { ImageProcessor } from './image-processor';

import { getSharp, generateImage } from './process-image';

jest.mock('fs');
jest.mock('./process-image');

const getSharpMock = mocked(getSharp);
const generateImageMock = mocked(generateImage);
const createWriteStreamMock = mocked(createWriteStream);

describe(`ImageProcessor`, () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it(`can be constructed`, () => {
    const processor = new ImageProcessor();
    expect(processor).toBeDefined();
  });

  it(`kick starts processing once image is added`, done => {
    const sharp = createSharp();
    mocked(getSharpMock).mockImplementationOnce(() => Promise.resolve(sharp));
    generateImageMock.mockImplementationOnce(() =>
      Promise.resolve({
        sharp,
        buffer: Buffer.from('12345678'),
      })
    );
    createWriteStreamMock.mockImplementationOnce(() => {
      const stream = new EventEmitter();
      stream.write = jest.fn();
      stream.end = jest.fn();
      setTimeout(() => stream.emit('finish'), 100);
      return stream;
    });

    const processor = new ImageProcessor(5);
    processor.addImage(createImageData());

    processor.on('done', () => {
      expect(createWriteStreamMock).toHaveBeenCalledTimes(1);

      done();
    });
  });

  it(`will emit done only when all image are processed`, done => {
    const sharp = createSharp();
    mocked(getSharpMock).mockImplementation(() => Promise.resolve(sharp));
    generateImageMock.mockImplementation(() =>
      Promise.resolve({
        sharp,
        buffer: Buffer.from('12345678'),
      })
    );
    createWriteStreamMock.mockImplementation(() => {
      const stream = new EventEmitter();
      stream.write = jest.fn();
      stream.end = jest.fn();
      setTimeout(() => stream.emit('finish'), 50);
      return stream;
    });

    const processor = new ImageProcessor(2);

    for (let i = 0; i < 5; i++) {
      processor.addImage(
        createImageData({
          imagePath: `image-${i}.jpg`,
          outputPath: `output/Image${i}.jpg`,
          width: 100 * i,
          height: 100 * i,
        })
      );
    }

    processor.on('done', () => {
      expect(createWriteStreamMock).toHaveBeenCalledTimes(5);

      done();
    });
  });
});

function createImageData({
  imagePath = 'imagePath',
  outputPath = 'outputPath',
  width = 200,
  height = 200,
  format = 'jpg',
} = {}) {
  return {
    imagePath,
    outputPath,
    options: {
      width,
      height,
      format,
    },
  };
}
