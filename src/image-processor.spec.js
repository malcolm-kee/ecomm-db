import { mocked } from 'ts-jest/utils';
import createSharp from 'sharp';

import { ImageProcessor } from './image-processor';

import { getSharp, generateImage } from './process-image';
import { isFileExist, writeFile } from './lib/fs-helper';

jest.mock('./process-image');
jest.mock('./lib/fs-helper');

const getSharpMock = mocked(getSharp);
const generateImageMock = mocked(generateImage);
const isFileExistMock = mocked(isFileExist);
const writeFileMock = mocked(writeFile);

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
    writeFileMock.mockImplementationOnce(() => Promise.resolve());
    isFileExistMock.mockImplementationOnce(() => Promise.resolve(true));

    const processor = new ImageProcessor(5);
    processor.addImage(createImageData());

    processor.on('done', () => {
      expect(writeFileMock).toHaveBeenCalledTimes(1);

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
    writeFileMock.mockImplementation(() => new Promise(fulfill => setTimeout(fulfill, 100)));
    isFileExistMock.mockImplementation(() => Promise.resolve(true));

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
      expect(writeFileMock).toHaveBeenCalledTimes(5);

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
