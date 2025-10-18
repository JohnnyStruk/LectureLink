import { Post, IFile } from '../db/posts';
import { Types } from 'mongoose';

export class FileService {
  // Save PDF file to MongoDB
  async savePDF(file: Express.Multer.File, instructorId: Types.ObjectId): Promise<IFile> {
    const newFile = new Post({
      filename: `${Date.now()}-${file.originalname}`,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      data: file.buffer,
      instructor: instructorId
    });

    return await newFile.save();
  }

  // Get PDF file by ID and populate instructor info
  async getPDFById(id: string): Promise<IFile | null> {
    return await Post.findById(id).populate('instructor', 'username');
  }

  // Get all PDF files for a specific instructor
  async getPDFsByInstructor(instructorId: Types.ObjectId): Promise<IFile[]> {
    return await Post.find({ instructor: instructorId })
      .select('-data') // Exclude binary data for listing
      .populate('instructor', 'username')
      .sort({ uploadDate: -1 });
  }

  // Get all PDF files (for admin purposes)
  async getAllPDFs(): Promise<IFile[]> {
    return await Post.find()
      .select('-data')
      .populate('instructor', 'username')
      .sort({ uploadDate: -1 });
  }

  // Delete PDF file (with instructor check for security)
  async deletePDF(id: string, instructorId: Types.ObjectId): Promise<boolean> {
    const result = await Post.findOneAndDelete({ 
      _id: id, 
      instructor: instructorId 
    });
    return result !== null;
  }

  // Check if file belongs to instructor (for authorization)
  async isFileOwner(fileId: string, instructorId: Types.ObjectId): Promise<boolean> {
    const file = await Post.findOne({ _id: fileId, instructor: instructorId });
    return file !== null;
  }
}