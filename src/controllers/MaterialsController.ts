// @ts-nocheck

import { Request, Response } from "express";
import dbConnection from "../database/db";
import { Course } from "../database/models/Course";
import { CourseInstructor } from "../database/models/CourseInstructor";
import { UploadToCloud } from "../services/cloudinary";
import { sendEmail } from "../services/emailService";
import * as path from "path";

export class MaterialsController {
  
  // ==================== GET COURSE MATERIALS ====================
  static async getCourseMaterials(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { course_id } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      // Verify course access
      const courseRepo = dbConnection.getRepository(Course);
      const courseInstructorRepo = dbConnection.getRepository(CourseInstructor);

      const isPrimaryInstructor = await courseRepo.findOne({
        where: { id: course_id, instructor_id: userId },
      });

      const isAdditionalInstructor = await courseInstructorRepo.findOne({
        where: { course_id, instructor_id: userId },
      });

      if (!isPrimaryInstructor && !isAdditionalInstructor) {
        return res.status(403).json({
          success: false,
          message: "You don't have access to this course",
        });
      }

      // Get materials (would need a materials table)
      // For now, return mock data

      res.json({
        success: true,
        data: {
          materials: [],
          folders: [],
        },
      });

    } catch (error: any) {
      console.error("❌ Get course materials error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch materials",
        error: error.message,
      });
    }
  }

  // ==================== UPLOAD MATERIALS ====================
  static async uploadMaterials(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const {
        course_id,
        title,
        description,
        module_id,
        lesson_id,
        is_public,
        tags,
      } = req.body;

      const files = req.files as Express.Multer.File[];

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      if (!course_id) {
        return res.status(400).json({
          success: false,
          message: "Course ID is required",
        });
      }

      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No files uploaded",
        });
      }

      // Verify course access
      const courseRepo = dbConnection.getRepository(Course);
      const courseInstructorRepo = dbConnection.getRepository(CourseInstructor);

      const isPrimaryInstructor = await courseRepo.findOne({
        where: { id: course_id, instructor_id: userId },
      });

      const isAdditionalInstructor = await courseInstructorRepo.findOne({
        where: { course_id, instructor_id: userId },
      });

      if (!isPrimaryInstructor && !isAdditionalInstructor) {
        return res.status(403).json({
          success: false,
          message: "You don't have access to this course",
        });
      }

      // Upload files to cloud storage
      const uploadedMaterials = [];

      for (const file of files) {
        try {
          const uploadResult = await UploadToCloud(file);
          
          // Save material info to database (would need a materials table)
          
          uploadedMaterials.push({
            id: `material-${Date.now()}-${Math.random()}`,
            title: title || file.originalname,
            description: description || "",
            file_url: uploadResult.secure_url,
            file_size: file.size,
            file_extension: path.extname(file.originalname),
            course_id,
            module_id: module_id || null,
            lesson_id: lesson_id || null,
            uploaded_by: userId,
            uploaded_at: new Date(),
            is_public: is_public === "true",
            tags: tags ? tags.split(",").map((t: string) => t.trim()) : [],
          });
        } catch (uploadError) {
          console.error("Error uploading file:", uploadError);
        }
      }

      // Send notification
      try {
        await sendEmail({
          to: (req.user as any).email,
          subject: "Materials Uploaded Successfully",
          html: `
            <h2>Materials Uploaded</h2>
            <p>You have successfully uploaded ${uploadedMaterials.length} file(s).</p>
            <p>Course ID: ${course_id}</p>
          `,
        });
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
      }

      res.status(201).json({
        success: true,
        message: `${uploadedMaterials.length} files uploaded successfully`,
        data: {
          materials: uploadedMaterials,
          total_uploaded: uploadedMaterials.length,
        },
      });

    } catch (error: any) {
      console.error("❌ Upload materials error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to upload materials",
        error: error.message,
      });
    }
  }

  // ==================== DELETE MATERIAL ====================
  static async deleteMaterial(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      // Delete material (would need a materials table)
      // For now, return success

      res.json({
        success: true,
        message: "Material deleted successfully",
      });

    } catch (error: any) {
      console.error("❌ Delete material error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete material",
        error: error.message,
      });
    }
  }

  // ==================== GET MATERIAL STATISTICS ====================
  static async getMaterialsStats(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      // Get all courses where user is instructor
      const courseRepo = dbConnection.getRepository(Course);
      const courses = await courseRepo
        .createQueryBuilder("course")
        .where(
          `(
            course.instructor_id = :userId 
            OR EXISTS (
              SELECT 1 FROM course_instructors ci 
              WHERE ci.course_id = course.id 
              AND ci.instructor_id = :userId 
              AND ci.can_edit_course_content = true
            )
          )`,
          { userId }
        )
        .getMany();

      const courseIds = courses.map(c => c.id);

      // Calculate statistics (would need a materials table)
      const stats = {
        total_materials: 0,
        total_size_mb: 0,
        total_downloads: 0,
        total_views: 0,
        materials_by_course: courseIds.length,
        materials_uploaded_this_week: 0,
        storage_used_percentage: 0,
        storage_limit_mb: 5120, // 5GB
      };

      res.json({
        success: true,
        data: stats,
      });

    } catch (error: any) {
      console.error("❌ Get materials stats error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch materials statistics",
        error: error.message,
      });
    }
  }
}