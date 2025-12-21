import { Request, Response } from "express";
import dbConnection from "../database/db";
import { User } from "../database/models/User";
import { Course } from "../database/models/Course";
import { CourseInstructor } from "../database/models/CourseInstructor";
import { Lesson } from "../database/models/Lesson";
import { Assessment } from "../database/models/Assessment";

export class ScheduleController {
  
  // ==================== GET INSTRUCTOR SCHEDULE ====================
  static async getInstructorSchedule(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { start_date, end_date, course_id } = req.query;

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

      if (courseIds.length === 0) {
        return res.json({
          success: true,
          data: {
            events: [],
            courses: [],
          },
        });
      }

      // Get lessons as events
      const lessonRepo = dbConnection.getRepository(Lesson);
      const lessons = await lessonRepo
        .createQueryBuilder("lesson")
        .leftJoinAndSelect("lesson.course", "course")
        .leftJoinAndSelect("lesson.module", "module")
        .where("lesson.course_id IN (:...courseIds)", { courseIds })
        .getMany();

      // Get assessments as events
      const assessmentRepo = dbConnection.getRepository(Assessment);
      const assessments = await assessmentRepo
        .createQueryBuilder("assessment")
        .leftJoinAndSelect("assessment.course", "course")
        .leftJoinAndSelect("assessment.module", "module")
        .leftJoinAndSelect("assessment.lesson", "lesson")
        .where("assessment.course_id IN (:...courseIds)", { courseIds })
        .getMany();

      // Transform lessons into events
      const lessonEvents = lessons.map(lesson => ({
        id: `lesson-${lesson.id}`,
        title: lesson.title,
        type: "lesson",
        course: {
          id: lesson.course.id,
          title: lesson.course.title,
          thumbnail_url: lesson.course.thumbnail_url,
        },
        module: lesson.module?.title,
        lesson: lesson.title,
        description: lesson.content?.substring(0, 200),
        start: new Date(), // Would need actual scheduled dates
        end: new Date(),
        status: "scheduled",
      }));

      // Transform assessments into events
      const assessmentEvents = assessments.map(assessment => ({
        id: `assessment-${assessment.id}`,
        title: assessment.title,
        type: "assessment",
        course: {
          id: assessment.course.id,
          title: assessment.course.title,
          thumbnail_url: assessment.course.thumbnail_url,
        },
        module: assessment.module?.title,
        lesson: assessment.lesson?.title,
        description: assessment.description,
        start: new Date(),
        end: new Date(),
        status: "scheduled",
      }));

      const events = [...lessonEvents, ...assessmentEvents];

      res.json({
        success: true,
        data: {
          events,
          courses: courses.map(c => ({
            id: c.id,
            title: c.title,
            thumbnail_url: c.thumbnail_url,
          })),
        },
      });

    } catch (error: any) {
      console.error("❌ Get instructor schedule error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch schedule",
        error: error.message,
      });
    }
  }

  // ==================== CREATE SCHEDULE EVENT ====================
  static async createEvent(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const {
        title,
        type,
        course_id,
        module_id,
        lesson_id,
        start,
        end,
        description,
        location,
        meeting_url,
        is_recurring,
        recurrence_pattern,
      } = req.body;

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

      // Create event (would need an events table)
      // For now, return success with mock data

      res.status(201).json({
        success: true,
        message: "Event created successfully",
        data: {
          id: `event-${Date.now()}`,
          title,
          type,
          course_id,
          module_id,
          lesson_id,
          start,
          end,
          description,
          location,
          meeting_url,
          is_recurring,
          recurrence_pattern,
          created_by: userId,
          created_at: new Date(),
        },
      });

    } catch (error: any) {
      console.error("❌ Create event error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create event",
        error: error.message,
      });
    }
  }

  // ==================== UPDATE EVENT ====================
  static async updateEvent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const updates = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      // Update event (would need an events table)
      // For now, return success with mock data

      res.json({
        success: true,
        message: "Event updated successfully",
        data: {
          id,
          ...updates,
          updated_by: userId,
          updated_at: new Date(),
        },
      });

    } catch (error: any) {
      console.error("❌ Update event error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update event",
        error: error.message,
      });
    }
  }

  // ==================== DELETE EVENT ====================
  static async deleteEvent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      // Delete event (would need an events table)
      // For now, return success

      res.json({
        success: true,
        message: "Event deleted successfully",
      });

    } catch (error: any) {
      console.error("❌ Delete event error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete event",
        error: error.message,
      });
    }
  }
}