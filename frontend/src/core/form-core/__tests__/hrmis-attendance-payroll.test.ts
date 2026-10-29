import { describe, it, expect } from "vitest";

// ============================================================================
// HRMIS Domain Utility Functions (Clean Architecture Domain Calculations)
// ============================================================================

/**
 * Calculates net working hours between check-in and check-out timestamps (minutes from midnight).
 * Handles overnight shifts crossing midnight and mandatory unpaid break deductions.
 */
export function calculateWorkingHours(
  checkIn: number,
  checkOut: number,
  breakMinutes: number = 0
): number {
  if (checkIn < 0 || checkOut < 0 || breakMinutes < 0) {
    throw new Error("Timestamps and breaks must be non-negative");
  }
  if (checkIn >= 1440 || checkOut >= 1440) {
    throw new Error("Timestamps must be within a 24-hour window (0-1439)");
  }

  let totalMinutes: number;
  if (checkOut >= checkIn) {
    totalMinutes = checkOut - checkIn;
  } else {
    // Overnight graveyard shift crossing midnight (e.g., 22:00 [1320] to 06:00 [360])
    totalMinutes = 1440 - checkIn + checkOut;
  }

  const netMinutes = Math.max(0, totalMinutes - breakMinutes);
  return Number((netMinutes / 60).toFixed(2));
}

/**
 * Evaluates whether an employee's requested leave can be approved based on available balance.
 */
export function getLeaveStatus(
  balance: number,
  requestedDays: number
): "APPROVED" | "REJECTED" {
  if (requestedDays < 0) {
    throw new Error("Requested leave days cannot be negative");
  }
  if (requestedDays <= balance) {
    return "APPROVED";
  }
  return "REJECTED";
}

/**
 * Calculates overtime compensation with shift multipliers (1.5x regular, 2.0x holiday).
 */
export function calculateOvertimePay(
  totalHours: number,
  standardHours: number,
  hourlyRate: number,
  options?: { isHoliday?: boolean; maxOvertimeHours?: number }
): number {
  if (totalHours < 0 || standardHours < 0 || hourlyRate < 0) {
    throw new Error("Hours and rates cannot be negative");
  }

  const rawOvertime = Math.max(0, totalHours - standardHours);
  const cappedOvertime = options?.maxOvertimeHours !== undefined
    ? Math.min(rawOvertime, options.maxOvertimeHours)
    : rawOvertime;

  const multiplier = options?.isHoliday ? 2.0 : 1.5;
  return Number((cappedOvertime * hourlyRate * multiplier).toFixed(2));
}

export interface PayrollParams {
  basicSalary: number;
  overtimePay: number;
  unpaidLeaveDays: number;
  dailyRate: number;
  fixedTaxDeduction?: number;
}

export interface PayrollResult {
  grossSalary: number;
  deductions: number;
  netSalary: number;
}

/**
 * Calculates comprehensive payroll breakdown for ZenOS / HRMIS.
 */
export function calculateNetSalary(params: PayrollParams): PayrollResult {
  const { basicSalary, overtimePay, unpaidLeaveDays, dailyRate, fixedTaxDeduction = 0 } = params;

  if (basicSalary < 0 || overtimePay < 0 || unpaidLeaveDays < 0 || dailyRate < 0 || fixedTaxDeduction < 0) {
    throw new Error("Salary inputs and deductions must be non-negative");
  }

  const grossSalary = Number((basicSalary + overtimePay).toFixed(2));
  const unpaidLeaveDeduction = Number((unpaidLeaveDays * dailyRate).toFixed(2));
  const totalDeductions = Number((unpaidLeaveDeduction + fixedTaxDeduction).toFixed(2));
  const netSalary = Math.max(0, Number((grossSalary - totalDeductions).toFixed(2)));

  return {
    grossSalary,
    deductions: totalDeductions,
    netSalary,
  };
}

// ============================================================================
// UNIT TESTS: Exhaustive Boundary, Normal & Error Cases
// ============================================================================
describe("HRMIS Domain Logic Unit Tests (ZenOS)", () => {
  // ── 1. Attendance Working Hours ───────────────────────────────────────────
  describe("calculateWorkingHours", () => {
    it("calculates standard 9:00 AM to 5:00 PM shift (8.0 hours)", () => {
      // 9:00 AM = 540 min, 5:00 PM = 1020 min
      expect(calculateWorkingHours(540, 1020)).toBe(8);
    });

    it("returns zero when check-in and check-out are identical", () => {
      expect(calculateWorkingHours(540, 540)).toBe(0);
    });

    it("deducts break minutes accurately", () => {
      // 8 hours shift minus 45 min lunch break = 7.25 hours
      expect(calculateWorkingHours(540, 1020, 45)).toBe(7.25);
    });

    it("handles overnight graveyard shifts crossing midnight", () => {
      // 10:00 PM (1320 min) to 6:00 AM (360 min) = 8.0 hours
      expect(calculateWorkingHours(1320, 360)).toBe(8);
    });

    it("handles overnight shifts with break deduction", () => {
      // 10:00 PM (1320 min) to 6:00 AM (360 min) minus 30 min break = 7.5 hours
      expect(calculateWorkingHours(1320, 360, 30)).toBe(7.5);
    });

    it("clamps to zero when break exceeds total shift duration", () => {
      // 1 hour shift (60 min) with 90 min break -> 0 hours (no negative hours)
      expect(calculateWorkingHours(540, 600, 90)).toBe(0);
    });

    it("throws error on negative timestamps or invalid day bounds", () => {
      expect(() => calculateWorkingHours(-10, 500)).toThrow("non-negative");
      expect(() => calculateWorkingHours(500, 1500)).toThrow("24-hour window");
    });
  });

  // ── 2. Leave Status Decisions ─────────────────────────────────────────────
  describe("getLeaveStatus", () => {
    it("approves leave request when requested days are less than balance", () => {
      expect(getLeaveStatus(10, 3)).toBe("APPROVED");
    });

    it("approves leave request when requested days exactly equal balance (boundary)", () => {
      expect(getLeaveStatus(10, 10)).toBe("APPROVED");
    });

    it("approves zero days requested on zero balance (boundary)", () => {
      expect(getLeaveStatus(0, 0)).toBe("APPROVED");
    });

    it("rejects leave request when requested days exceed balance", () => {
      expect(getLeaveStatus(2, 5)).toBe("REJECTED");
    });

    it("rejects fractional leave requests exceeding balance", () => {
      expect(getLeaveStatus(4.0, 4.5)).toBe("REJECTED");
    });

    it("throws error when requested days is negative", () => {
      expect(() => getLeaveStatus(10, -1)).toThrow("cannot be negative");
    });
  });

  // ── 3. Overtime Pay Calculation ───────────────────────────────────────────
  describe("calculateOvertimePay", () => {
    it("returns zero overtime pay when total hours do not exceed standard", () => {
      expect(calculateOvertimePay(40, 40, 250)).toBe(0);
      expect(calculateOvertimePay(35, 40, 250)).toBe(0);
    });

    it("calculates normal weekday overtime at 1.5x multiplier", () => {
      // 50 total hours, 40 standard = 10 overtime hours @ ₹200/hr * 1.5 = ₹3,000
      expect(calculateOvertimePay(50, 40, 200)).toBe(3000);
    });

    it("calculates holiday overtime at 2.0x premium multiplier", () => {
      // 10 overtime hours @ ₹200/hr * 2.0 = ₹4,000
      expect(calculateOvertimePay(50, 40, 200, { isHoliday: true })).toBe(4000);
    });

    it("enforces maximum overtime cap threshold", () => {
      // 25 overtime hours, but capped at 10 hours max
      // 10 hrs * ₹200 * 1.5 = ₹3,000
      expect(
        calculateOvertimePay(65, 40, 200, { maxOvertimeHours: 10 })
      ).toBe(3000);
    });

    it("throws error on negative hourly rate or negative hours", () => {
      expect(() => calculateOvertimePay(-5, 40, 200)).toThrow("cannot be negative");
      expect(() => calculateOvertimePay(50, 40, -100)).toThrow("cannot be negative");
    });
  });

  // ── 4. Net Salary & Deductions Breakdown ──────────────────────────────────
  describe("calculateNetSalary", () => {
    it("reproduces exact canonical HRMIS payroll scenario: ₹30,000 + ₹2,000 - ₹1,000 - ₹1,500 = ₹29,500", () => {
      const result = calculateNetSalary({
        basicSalary: 30000,
        overtimePay: 2000,
        unpaidLeaveDays: 1,
        dailyRate: 1000,
        fixedTaxDeduction: 1500,
      });

      expect(result.grossSalary).toBe(32000);
      expect(result.deductions).toBe(2500); // 1000 + 1500
      expect(result.netSalary).toBe(29500);
    });

    it("handles zero overtime and zero deductions correctly", () => {
      const result = calculateNetSalary({
        basicSalary: 25000,
        overtimePay: 0,
        unpaidLeaveDays: 0,
        dailyRate: 1000,
        fixedTaxDeduction: 0,
      });

      expect(result.grossSalary).toBe(25000);
      expect(result.deductions).toBe(0);
      expect(result.netSalary).toBe(25000);
    });

    it("clamps net salary to zero when deductions exceed gross salary (no negative paycheck)", () => {
      const result = calculateNetSalary({
        basicSalary: 10000,
        overtimePay: 0,
        unpaidLeaveDays: 15,
        dailyRate: 1000, // ₹15,000 unpaid leave deduction
        fixedTaxDeduction: 0,
      });

      expect(result.grossSalary).toBe(10000);
      expect(result.deductions).toBe(15000);
      expect(result.netSalary).toBe(0);
    });

    it("throws error when any salary parameter is negative", () => {
      expect(() =>
        calculateNetSalary({
          basicSalary: -1000,
          overtimePay: 0,
          unpaidLeaveDays: 0,
          dailyRate: 500,
        })
      ).toThrow("non-negative");
    });
  });
});
