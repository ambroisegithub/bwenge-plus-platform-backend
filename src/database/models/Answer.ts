import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "./User";
import { Quiz } from "./Quiz";
import { Assessment } from "./Assessment";
import { Question } from "./Question";

@Entity("answers")
@Index(["user_id", "question_id"], { unique: false })
@Index(["user_id", "assessment_id"])
@Index(["user_id", "quiz_id"])
export class Answer {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  @Index()
  user_id: string;

  @ManyToOne(() => User, (user) => user.answers, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  // ==================== QUIZ RELATIONSHIP ====================
  @Column({ type: "uuid", nullable: true })
  @Index()
  quiz_id: string;

  @ManyToOne(() => Quiz, (quiz) => quiz.answers, {
    nullable: true,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "quiz_id" })
  quiz: Quiz;


  @Column({ type: "text", nullable: true }) 
  @Index()
  question_id: string;

  @ManyToOne(() => Question, (question) => question.answers, {
    nullable: true,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "question_id" })
  question: Question;


  @Column({ type: "uuid", nullable: true })
  @Index()
  assessment_id: string;

  @ManyToOne(() => Assessment, (assessment) => assessment.answer_submissions, {
    nullable: true,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "assessment_id" })
  assessment: Assessment;

  // ==================== ANSWER DATA ====================
  @Column({ type: "jsonb" })
  answer: any; // Can be string, array, or object depending on question type

  @Column({ type: "text", nullable: true })
  selected_option: string; // For backward compatibility

  @Column({ default: false })
  is_correct: boolean;

  @Column({ type: "integer", default: 0 })
  points_earned: number;

  @Column({ type: "integer", default: 0 })
  time_spent_seconds: number;

  // ==================== GRADING INFO ====================
  @Column({ type: "boolean", default: false })
  is_graded: boolean;

  @Column({ type: "uuid", nullable: true })
  graded_by_user_id: string;

  @Column({ type: "timestamp", nullable: true })
  graded_at: Date;

  @Column({ type: "text", nullable: true })
  feedback: string;

  // ==================== ATTEMPT TRACKING ====================
  @Column({ type: "integer", default: 1 })
  attempt_number: number;

  @Column({ type: "boolean", default: false })
  is_final_submission: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}