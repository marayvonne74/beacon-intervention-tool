import { addEffectivenessRecord, loadSnapshots, addSnapshot } from '../services/storage';

export function useEffectiveness() {
  function recordImplementation(student, recommendation) {
    // Snapshot the student's current state when a recommendation is marked Implemented
    const snapshot = {
      studentId: student.id,
      timestamp: Date.now(),
      attendanceRate: student.attendanceRate,
      mathScore: student.mathScore,
    };
    addSnapshot(student.id, snapshot);
  }

  function computeAndStoreOutcome(student, recommendation, baselineAttendance, baselineMath) {
    const attendanceImprovement = (student.attendanceRate - baselineAttendance) * 100;
    const mathImprovement = student.mathScore - baselineMath;
    const outcomeScore = Math.round(
      Math.max(0, attendanceImprovement * 0.5 + mathImprovement * 0.5)
    );

    const record = {
      id: `eff-${Date.now()}`,
      studentId: student.id,
      tier: student.tier,
      gradeLevel: student.grade,
      attendanceRate: baselineAttendance,
      mathScore: baselineMath,
      interventionDescription: recommendation.action,
      interventionOwner: recommendation.owner,
      assignedStaff: recommendation.assignedStaffId,
      implementedAt: Date.now(),
      outcomeScore,
    };

    addEffectivenessRecord(record);
    return record;
  }

  return { recordImplementation, computeAndStoreOutcome };
}
