const { Router } = require("express");
const indexRouter = Router();
const authController = require("../controllers/authController");
const indexController = require("../controllers/indexController");

indexRouter.get("/", indexController.renderHome);

indexRouter.get("/login", authController.userLogInGET);

indexRouter.post("/login", authController.userLogInPOST);

indexRouter.get("/sign-up", authController.userSignUpGET);

indexRouter.post("/sign-up", authController.userSignUpPOST);

indexRouter.get("/logout", authController.userLogOutGET);

indexRouter.post("/upload", indexController.uploadFile);

indexRouter.get("/file/:id", indexController.renderFileDetails);

indexRouter.post("/file/:id/delete", indexController.deleteFile);

indexRouter.post("/file/:id/update", indexController.updateFile);

indexRouter.post("/folder/create", indexController.createFolder);

indexRouter.get("/folder/:id", indexController.renderFolder);

indexRouter.post("/folder/:id/upload", indexController.uploadFileInFolder);

indexRouter.post("/folder/:id/delete", indexController.deleteFolder);

indexRouter.post("/folder/:id/update", indexController.updateFolder);

indexRouter.post("/share/folder/:id", indexController.shareFolder);

indexRouter.get("/share/folder/:id", indexController.renderSharedFolder);

module.exports = indexRouter;
