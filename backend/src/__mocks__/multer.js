// Mock implementation of multer
const memoryStorage = jest.fn().mockImplementation(() => ({
  _handleFile: (req, file, cb) => {
    file.buffer = Buffer.from(JSON.stringify(req.body.data || {}));
    cb(null, file);
  },
  _removeFile: (file, cb) => cb(null)
}));

const single = jest.fn().mockImplementation(() => (req, res, next) => {
  if (req.file) {
    req.file.buffer = Buffer.from(JSON.stringify(req.body.data || {}));
  }
  next();
});

const multer = jest.fn().mockImplementation(() => ({
  single,
  memoryStorage
}));

multer.memoryStorage = memoryStorage;

module.exports = multer;
