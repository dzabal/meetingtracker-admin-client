import type { ActionDef } from './api/client';
export type GlobalOperationScope = 'MEETING_CASE' | 'SECTION' | 'DATE' | 'PIPELINE';
export type GlobalOperationSelection = { action: ActionDef | null; scope: GlobalOperationScope | null; processingDate: string; masterSessionId?: string; academicPeriod?: string; sectionCode?: string; sessionNumber?: number };
export const ACTIONS_BY_SCOPE: Record<GlobalOperationScope,string[]> = { DATE:['VALIDATE_ACADEMIC_DAY','ENQUEUE_ATTENDANCE_BY_DATE','SYNC_RECORDINGS_BY_DATE','PROCESS_ACADEMIC_DAY'], SECTION:['AUDIT_SECTION_MEETINGS','ASSIGN_SECTION_INSTRUCTOR'], MEETING_CASE:['SYNC_MEETING_INSTRUCTOR','RECONCILE_MEETING_COORGANIZERS','RECONCILE_SUPPORT_COORGANIZERS'], PIPELINE:['RUN_ACADEMIC_PIPELINE'] };
export const isAvailable=(a:ActionDef)=>a.implemented===true&&a.enabled===true&&!(a.blocked_by?.length);
