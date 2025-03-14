const removeFileExtension = (filename) => {
  return filename.substring(0, filename.lastIndexOf("."));
};

const generateCloudinaryDownloadURL = (filename, url) => {
  const splittedUrl = url.split("upload/");
  const cloudinaryDownloadFlag = `upload/fl_attachment:${filename}/`;
  return splittedUrl[0] + cloudinaryDownloadFlag + splittedUrl[1];
};

module.exports = {
  removeFileExtension,
  generateCloudinaryDownloadURL,
};
