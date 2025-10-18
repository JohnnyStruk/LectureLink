// controllers/fileController.ts
import { Request, Response } from 'express';
import { FileService } from '../helpers/fileService';
import { Types } from 'mongoose';

const fileService = new FileService();

declare global {
  namespace Express {
    interface Request {
      identity?: {
        _id: Types.ObjectId;
        username: string;
        
      };
    }
  }
}

export class FileController {
  async uploadPDF(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      if (!req.identity) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const savedFile = await fileService.savePDF(req.file, req.identity._id);
      
      res.status(201).json({
        message: 'File uploaded successfully',
        file: {
          id: savedFile._id,
          filename: savedFile.filename,
          originalName: savedFile.originalName,
          size: savedFile.size,
          uploadDate: savedFile.uploadDate,
          instructor: {
            id: req.identity._id,
            username: req.identity.username
          }
        }
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Failed to upload file' });
    }
  }

  async downloadPDF(req: Request, res: Response) {
    try {
      const file = await fileService.getPDFById(req.params.id);
      
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      res.set({
        'Content-Type': file.mimeType,
        'Content-Disposition': `attachment; filename="${file.originalName}"`,
        'Content-Length': file.size
      });

      res.send(file.data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to download file' });
    }
  }

  async viewPDF(req: Request, res: Response) {
    try {
      const file = await fileService.getPDFById(req.params.id);
      
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      res.set({
        'Content-Type': file.mimeType,
        'Content-Length': file.size
      });

      res.send(file.data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to view file' });
    }
  }

  // Get all PDF files for the logged-in instructor
  async getMyPDFs(req: Request, res: Response) {
    try {
      if (!req.identity) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const files = await fileService.getPDFsByInstructor(req.identity._id);
      res.json(files);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch files' });
    }
  }

  // Get all PDF files
  async getAllPDFs(req: Request, res: Response) {
    try {
      const files = await fileService.getAllPDFs();
      res.json(files);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch files' });
    }
  }

  // Get PDF by code
  async getPDFByCode(req: Request, res: Response) {
    try {
      const file = await fileService.getPDFByCode(req.params.code);
      res.json(file);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch file' });
    }
  }
  

  // Delete PDF file
  async deletePDF(req: Request, res: Response) {
    try {
      if (!req.identity) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const deleted = await fileService.deletePDF(req.params.id, req.identity._id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'File not found or access denied' });
      }

      res.json({ message: 'File deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete file' });
    }
  }
}