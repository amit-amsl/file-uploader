const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const asyncHandler = require("express-async-handler");
const multer = require("../middleware/multer");
const {
  cloudinary,
  uploadStreamToCloudinary,
} = require("../middleware/cloudinary");
const helperFunctions = require("../utils/helperFunctions");
const { formatRelative } = require("date-fns");

const renderHome = [
  (req, res, next) => {
    if (!req.isAuthenticated()) {
      res.redirect("/login");
    }
    next();
  },
  asyncHandler(async (req, res) => {
    const folders = await prisma.folder.findMany({
      where: {
        User: { is: { id: req.user.id } },
      },
    });
    const files = await prisma.file.findMany({
      where: {
        User: { is: { id: req.user.id } },
      },
    });
    res.render("index", {
      title: "Main page",
      user: req.user,
      userFolders: folders,
      userFiles: files,
      downloadLinkGenerator: helperFunctions.generateCloudinaryDownloadURL,
      formatRelative: formatRelative,
    });
  }),
];

const uploadFile = [
  multer.uploadImage.single("file"),
  asyncHandler(async (req, res) => {
    console.log("starting file upload..", req.file);

    const result = await uploadStreamToCloudinary(req.file.buffer, {
      folder: "",
    });
    if (result) {
      console.log("cloudinary upload result", result);

      const file = await prisma.file.create({
        data: {
          name: helperFunctions.removeFileExtension(req.file.originalname),
          size: req.file.size,
          url: result.secure_url,
          User: {
            connect: { id: req.user.id },
          },
          public_id: result.public_id,
        },
      });
      console.log("updated file with url", file);
    }

    res.redirect("/");
  }),
];

const renderFileDetails = [
  (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Log In to see this resource!" });
    }
    next();
  },
  asyncHandler(async (req, res) => {
    const file = await prisma.file.findUnique({
      where: {
        id: req.params.id,
      },
      include: {
        Folder: true,
      },
    });
    if (req.user.id !== file.userId) {
      return res.status(401).json({
        error:
          "You are unauthorized to see this resource, ask the owner of this resource to share it with you!",
      });
    }
    const allFolders = await prisma.folder.findMany({
      select: {
        id: true,
        name: true,
      },
    });
    res.render("file", {
      title: "File page",
      user: req.user,
      fileDetails: file,
      allFolders: allFolders,
      downloadLinkGenerator: helperFunctions.generateCloudinaryDownloadURL,
      formatRelative: formatRelative,
    });
  }),
];

const uploadFileInFolder = [
  multer.uploadImage.single("file"),
  asyncHandler(async (req, res) => {
    console.log("starting file upload..", req.file);

    const result = await uploadStreamToCloudinary(req.file.buffer, {
      folder: "",
    });
    if (result) {
      console.log("cloudinary upload result", result);

      const file = await prisma.file.create({
        data: {
          name: helperFunctions.removeFileExtension(req.file.originalname),
          size: req.file.size,
          url: result.secure_url,
          User: {
            connect: { id: req.user.id },
          },
          public_id: result.public_id,
          Folder: {
            connect: { id: req.params.id },
          },
        },
      });
      console.log("updated file with url", file);
    }

    res.redirect(`/folder/${req.params.id}`);
  }),
];

const deleteFile = asyncHandler(async (req, res) => {
  const deletedFile = await prisma.file.delete({
    where: {
      id: req.params.id,
    },
  });
  const deletedCloudinaryImage = await cloudinary.api.delete_resources(
    [deletedFile.public_id],
    { type: "upload", resource_type: "image" }
  );
  res.redirect("/");
});

const updateFile = asyncHandler(async (req, res) => {
  const { folder_id } = req.body;
  if (folder_id === "none") {
    const updatedFile = await prisma.file.update({
      where: {
        id: req.params.id,
      },
      data: {
        Folder: { disconnect: true },
      },
    });
  } else {
    const updatedFile = await prisma.file.update({
      where: {
        id: req.params.id,
      },
      data: {
        Folder: { connect: { id: folder_id } },
      },
    });
  }
  res.redirect(`/file/${req.params.id}`);
});

const createFolder = [
  (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "you cant do that" });
    }
    next();
  },
  asyncHandler(async (req, res) => {
    const { folder_name } = req.body;
    const folder = await prisma.folder.create({
      data: {
        name: folder_name,
        User: {
          connect: { id: req.user.id },
        },
      },
    });
    console.log("Created folder:", folder);
    res.redirect("/");
  }),
];

const renderFolder = [
  (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Log In to see this resource!" });
    }
    next();
  },
  asyncHandler(async (req, res) => {
    const folder = await prisma.folder.findUnique({
      where: {
        id: req.params.id,
      },
      include: {
        files: true,
        FolderShare: true,
      },
    });
    if (req.user.id !== folder.userId) {
      return res.status(401).json({
        error:
          "You are unauthorized to see this resource, ask the owner of this resource to share it with you!",
      });
    }
    res.render("folder", {
      title: "Folder page",
      user: req.user,
      folderDetails: folder,
      downloadLinkGenerator: helperFunctions.generateCloudinaryDownloadURL,
      formatRelative: formatRelative,
    });
  }),
];

const deleteFolder = asyncHandler(async (req, res) => {
  const deletedFolder = await prisma.folder.delete({
    where: {
      id: req.params.id,
    },
  });
  res.redirect("/");
});

const updateFolder = asyncHandler(async (req, res) => {
  const { folder_name } = req.body;
  const updatedFolder = await prisma.folder.update({
    where: {
      id: req.params.id,
    },
    data: {
      name: folder_name,
    },
  });
  res.redirect(`/folder/${req.params.id}`);
});

const shareFolder = asyncHandler(async (req, res) => {
  const now = new Date();
  const expireDate = new Date(new Date(now).setDate(now.getDate() + 2));
  const sharedFolder = await prisma.folderShare.create({
    data: {
      expiredAt: expireDate,
      Folder: { connect: { id: req.params.id } },
    },
  });

  res.redirect(`/folder/${req.params.id}`);
});

const renderSharedFolder = asyncHandler(async (req, res) => {
  const sharedFolder = await prisma.folderShare.findUnique({
    where: {
      id: req.params.id,
    },
    include: {
      Folder: {
        include: {
          files: true,
          User: true,
        },
      },
    },
  });
  if (!sharedFolder || sharedFolder.expiredAt < new Date()) {
    return res
      .status(404)
      .json({ error: "This share link doesn't exist or expired!" });
  }
  res.render("folderShare", {
    title: "Shared Folder page",
    sharedFolderDetails: sharedFolder,
    downloadLinkGenerator: helperFunctions.generateCloudinaryDownloadURL,
    formatRelative: formatRelative,
  });
});

module.exports = {
  renderHome,
  uploadFile,
  uploadFileInFolder,
  renderFileDetails,
  deleteFile,
  updateFile,
  createFolder,
  renderFolder,
  deleteFolder,
  updateFolder,
  shareFolder,
  renderSharedFolder,
};
