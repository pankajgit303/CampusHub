export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      ai_document_chunks: {
        Row: {
          content: string
          document_id: string
          embedding: Json | null
          id: string
          metadata: Json
        }
        Insert: {
          content: string
          document_id: string
          embedding?: Json | null
          id?: string
          metadata?: Json
        }
        Update: {
          content?: string
          document_id?: string
          embedding?: Json | null
          id?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "ai_document_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "ai_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_documents: {
        Row: {
          content: string
          created_at: string
          department_id: string | null
          id: string
          source_id: string | null
          source_type: string
          title: string
        }
        Insert: {
          content: string
          created_at?: string
          department_id?: string | null
          id?: string
          source_id?: string | null
          source_type: string
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          department_id?: string | null
          id?: string
          source_id?: string | null
          source_type?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_documents_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_submissions: {
        Row: {
          assignment_id: string
          feedback: string | null
          file_url: string | null
          id: string
          marks: number | null
          status: string
          student_id: string
          submission_text: string | null
          submitted_at: string
        }
        Insert: {
          assignment_id: string
          feedback?: string | null
          file_url?: string | null
          id?: string
          marks?: number | null
          status?: string
          student_id: string
          submission_text?: string | null
          submitted_at?: string
        }
        Update: {
          assignment_id?: string
          feedback?: string | null
          file_url?: string | null
          id?: string
          marks?: number | null
          status?: string
          student_id?: string
          submission_text?: string | null
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          attachment_url: string | null
          created_at: string
          description: string
          due_date: string
          faculty_id: string
          id: string
          max_marks: number
          subject_id: string
          title: string
        }
        Insert: {
          attachment_url?: string | null
          created_at?: string
          description: string
          due_date: string
          faculty_id: string
          id?: string
          max_marks?: number
          subject_id: string
          title: string
        }
        Update: {
          attachment_url?: string | null
          created_at?: string
          description?: string
          due_date?: string
          faculty_id?: string
          id?: string
          max_marks?: number
          subject_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          attendance_date: string
          created_at: string
          faculty_id: string
          id: string
          status: string
          student_id: string
          subject_id: string
        }
        Insert: {
          attendance_date: string
          created_at?: string
          faculty_id: string
          id?: string
          status: string
          student_id: string
          subject_id: string
        }
        Update: {
          attendance_date?: string
          created_at?: string
          faculty_id?: string
          id?: string
          status?: string
          student_id?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      classrooms: {
        Row: {
          building: string | null
          capacity: number | null
          id: string
          name: string
        }
        Insert: {
          building?: string | null
          capacity?: number | null
          id?: string
          name: string
        }
        Update: {
          building?: string | null
          capacity?: number | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      complaint_updates: {
        Row: {
          complaint_id: string
          created_at: string
          id: string
          response: string | null
          status: string
        }
        Insert: {
          complaint_id: string
          created_at?: string
          id?: string
          response?: string | null
          status: string
        }
        Update: {
          complaint_id?: string
          created_at?: string
          id?: string
          response?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaint_updates_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "complaints"
            referencedColumns: ["id"]
          },
        ]
      }
      complaints: {
        Row: {
          admin_response: string | null
          assigned_to: string | null
          category: string
          created_at: string
          description: string
          id: string
          priority: string
          status: string
          student_id: string
          title: string
          updated_at: string
        }
        Insert: {
          admin_response?: string | null
          assigned_to?: string | null
          category: string
          created_at?: string
          description: string
          id?: string
          priority?: string
          status?: string
          student_id: string
          title: string
          updated_at?: string
        }
        Update: {
          admin_response?: string | null
          assigned_to?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          priority?: string
          status?: string
          student_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaints_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          department_id: string
          duration_years: number
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          department_id: string
          duration_years?: number
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          department_id?: string
          duration_years?: number
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      event_registrations: {
        Row: {
          event_id: string
          id: string
          registered_at: string
          student_id: string
        }
        Insert: {
          event_id: string
          id?: string
          registered_at?: string
          student_id: string
        }
        Update: {
          event_id?: string
          id?: string
          registered_at?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          created_by: string
          description: string
          event_date: string
          id: string
          image_url: string | null
          location: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description: string
          event_date: string
          id?: string
          image_url?: string | null
          location: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string
          event_date?: string
          id?: string
          image_url?: string | null
          location?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          duration_minutes: number
          exam_date: string
          id: string
          max_marks: number
          room_number: string
          semester_id: string
          start_time: string
          subject_id: string
          title: string
        }
        Insert: {
          duration_minutes: number
          exam_date: string
          id?: string
          max_marks: number
          room_number: string
          semester_id: string
          start_time: string
          subject_id: string
          title: string
        }
        Update: {
          duration_minutes?: number
          exam_date?: string
          id?: string
          max_marks?: number
          room_number?: string
          semester_id?: string
          start_time?: string
          subject_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "exams_semester_id_fkey"
            columns: ["semester_id"]
            isOneToOne: false
            referencedRelation: "semesters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exams_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      faculty_directory: {
        Row: {
          full_name: string
          id: string
        }
        Insert: {
          full_name: string
          id: string
        }
        Update: {
          full_name?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "faculty_directory_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      grading_rules: {
        Row: {
          grade: string
          grade_points: number
          id: string
          min_percentage: number
        }
        Insert: {
          grade: string
          grade_points: number
          id?: string
          min_percentage: number
        }
        Update: {
          grade?: string
          grade_points?: number
          id?: string
          min_percentage?: number
        }
        Relationships: []
      }
      notices: {
        Row: {
          attachment_url: string | null
          author_id: string
          content: string
          created_at: string
          department_id: string | null
          id: string
          priority: string
          target_role: string
          title: string
        }
        Insert: {
          attachment_url?: string | null
          author_id: string
          content: string
          created_at?: string
          department_id?: string | null
          id?: string
          priority?: string
          target_role?: string
          title: string
        }
        Update: {
          attachment_url?: string | null
          author_id?: string
          content?: string
          created_at?: string
          department_id?: string | null
          id?: string
          priority?: string
          target_role?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notices_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notices_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      placements: {
        Row: {
          application_url: string
          company_logo: string | null
          company_name: string
          created_at: string
          deadline: string
          department_id: string | null
          description: string
          eligibility: string
          id: string
          role_name: string
          salary_package: number | null
        }
        Insert: {
          application_url: string
          company_logo?: string | null
          company_name: string
          created_at?: string
          deadline: string
          department_id?: string | null
          description: string
          eligibility: string
          id?: string
          role_name: string
          salary_package?: number | null
        }
        Update: {
          application_url?: string
          company_logo?: string | null
          company_name?: string
          created_at?: string
          deadline?: string
          department_id?: string | null
          description?: string
          eligibility?: string
          id?: string
          role_name?: string
          salary_package?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "placements_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_status: string
          avatar_url: string | null
          created_at: string
          department_id: string | null
          email: string
          full_name: string
          id: string
          phone: string | null
          registration_number: string | null
          role: Database["public"]["Enums"]["app_role"]
          roll_number: string | null
          semester_id: string | null
          updated_at: string
        }
        Insert: {
          account_status?: string
          avatar_url?: string | null
          created_at?: string
          department_id?: string | null
          email: string
          full_name?: string
          id: string
          phone?: string | null
          registration_number?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          roll_number?: string | null
          semester_id?: string | null
          updated_at?: string
        }
        Update: {
          account_status?: string
          avatar_url?: string | null
          created_at?: string
          department_id?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          registration_number?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          roll_number?: string | null
          semester_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_semester_id_fkey"
            columns: ["semester_id"]
            isOneToOne: false
            referencedRelation: "semesters"
            referencedColumns: ["id"]
          },
        ]
      }
      results: {
        Row: {
          exam_id: string
          grade: string | null
          id: string
          marks_obtained: number
          remarks: string | null
          student_id: string
          subject_id: string
        }
        Insert: {
          exam_id: string
          grade?: string | null
          id?: string
          marks_obtained: number
          remarks?: string | null
          student_id: string
          subject_id: string
        }
        Update: {
          exam_id?: string
          grade?: string | null
          id?: string
          marks_obtained?: number
          remarks?: string | null
          student_id?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "results_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "results_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "results_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      semesters: {
        Row: {
          academic_year: string
          course_id: string | null
          department_id: string
          id: string
          semester_number: number
        }
        Insert: {
          academic_year: string
          course_id?: string | null
          department_id: string
          id?: string
          semester_number: number
        }
        Update: {
          academic_year?: string
          course_id?: string | null
          department_id?: string
          id?: string
          semester_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "semesters_course_department_fkey"
            columns: ["course_id", "department_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id", "department_id"]
          },
          {
            foreignKeyName: "semesters_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "semesters_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          id: string
          name: string
          value: number
        }
        Insert: {
          id?: string
          name: string
          value: number
        }
        Update: {
          id?: string
          name?: string
          value?: number
        }
        Relationships: []
      }
      study_materials: {
        Row: {
          created_at: string
          description: string | null
          faculty_id: string
          file_url: string
          id: string
          subject_id: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          faculty_id: string
          file_url: string
          id?: string
          subject_id: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          faculty_id?: string
          file_url?: string
          id?: string
          subject_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_materials_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_materials_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          credits: number
          department_id: string
          faculty_id: string | null
          id: string
          semester_id: string
          subject_code: string
          subject_name: string
        }
        Insert: {
          credits?: number
          department_id: string
          faculty_id?: string | null
          id?: string
          semester_id: string
          subject_code: string
          subject_name: string
        }
        Update: {
          credits?: number
          department_id?: string
          faculty_id?: string | null
          id?: string
          semester_id?: string
          subject_code?: string
          subject_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subjects_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subjects_semester_id_fkey"
            columns: ["semester_id"]
            isOneToOne: false
            referencedRelation: "semesters"
            referencedColumns: ["id"]
          },
        ]
      }
      timetable: {
        Row: {
          day_of_week: number
          department_id: string
          end_time: string
          faculty_id: string
          id: string
          room_number: string
          semester_id: string
          start_time: string
          subject_id: string
        }
        Insert: {
          day_of_week: number
          department_id: string
          end_time: string
          faculty_id: string
          id?: string
          room_number: string
          semester_id: string
          start_time: string
          subject_id: string
        }
        Update: {
          day_of_week?: number
          department_id?: string
          end_time?: string
          faculty_id?: string
          id?: string
          room_number?: string
          semester_id?: string
          start_time?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "timetable_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_semester_id_fkey"
            columns: ["semester_id"]
            isOneToOne: false
            referencedRelation: "semesters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      consume_ai_request: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "student" | "faculty" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["student", "faculty", "admin"],
    },
  },
} as const


