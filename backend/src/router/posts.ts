import express from "express";
import { Router } from 'express';
import { FileController } from '../controllers/posts';
import { upload } from '../middlewares/upload';
import { isAuthenticated } from '../middlewares/index';

const fileController = new FileController();

export default (router: express.Router) => {
    router.post('/posts/upload', isAuthenticated, upload.single('pdf'), fileController.uploadPDF);
    router.get('/posts/my-files', isAuthenticated, fileController.getMyPDFs); // Instructor's own files
    router.get('/posts/files', isAuthenticated, fileController.getAllPDFs); // All files
    router.get('/posts/download/:id', fileController.downloadPDF);
    router.get('/posts/view/:id', fileController.viewPDF);
    router.get('/posts/code/:code', fileController.getPDFByCode);
    router.delete('/posts/:id', isAuthenticated, fileController.deletePDF);
};