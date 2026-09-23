const multer = require("multer");

const storage = multer.memoryStorage();

const allowedMimeTypes = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

const upload = multer({
  storage,

  limits: {
    fileSize: 10 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error("Only PDF, DOCX, and TXT files are allowed"));
    }

    cb(null, true);
  },
});

module.exports = upload;