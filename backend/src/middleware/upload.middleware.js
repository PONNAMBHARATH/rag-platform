const multer = require("multer");
const { extname } = require("node:path");
const { XLSX_MIME_TYPE } = require("../services/document/xlsx.service");

const storage = multer.memoryStorage();

const allowedMimeTypes = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  XLSX_MIME_TYPE,
];

const upload = multer({
  storage,

  limits: {
    fileSize: 10 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error("Only PDF, DOCX, TXT, and XLSX files are allowed"));
    }

    if (file.mimetype === XLSX_MIME_TYPE && extname(file.originalname).toLowerCase() !== ".xlsx") {
      return cb(new Error("Excel uploads must use the .xlsx extension"));
    }

    cb(null, true);
  },
});

module.exports = upload;