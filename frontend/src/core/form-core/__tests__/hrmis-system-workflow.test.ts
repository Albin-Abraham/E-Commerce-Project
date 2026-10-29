import { describe, it, expect } from "vitest";
import { FormCore } from "../engine";
import type { FormDefinition } from "../domain";

describe("HRMIS System Workflow Test: Attendance to Payroll to Payslip (ZenOS)", () => {
  it("executes the complete multi-step HRMIS workflow and generates the expected ₹29,500 payslip", async () => {
    // ── Audit history to track workflow progress ────────────────────────────
    const auditLog: Array<{ step: string; timestamp: number; payload: Record<string, any> }> = [];

    // ── Canonical HRMIS Multi-Section Form Definition ──────────────────────
    const payrollWorkflowSchema: FormDefinition = {
      id: "hrmis-payroll-workflow",
      schemaVersion: 2,
      title: "HRMIS Integrated Payroll Workflow",

      // 1. Content Pillar
      content: {
        id: "payroll-content",
        title: "Monthly Payroll Processing",
      },

      // 2. Surface Pillar
      surface: {
        target: "screen",
        density: "comfortable",
        width: "full",
      },

      // 3. Governance Pillar
      governance: {
        permissions: {
          roles: ["hr_admin", "payroll_officer"],
          rules: [
            { fieldId: "basicSalary", access: "readOnly", roles: ["payroll_officer"] },
            { fieldId: "netSalary", access: "readOnly" },
          ],
        },
        audit: {
          trackChanges: true,
        },
      },

      sections: [
        {
          id: "sec_employee",
          title: "1. Employee Configuration",
          fields: [
            { id: "employeeId", name: "employeeId", type: "text", label: "Employee ID", required: true, defaultValue: "EMP-1001" },
            { id: "employeeName", name: "employeeName", type: "text", label: "Employee Name", defaultValue: "Aditi Sharma" },
            { id: "basicSalary", name: "basicSalary", type: "number", label: "Basic Salary", defaultValue: 30000 },
          ],
        },
        {
          id: "sec_attendance",
          title: "2. Attendance & Overtime",
          fields: [
            { id: "regularHours", name: "regularHours", type: "number", label: "Regular Hours", defaultValue: 160 },
            { id: "overtimeHours", name: "overtimeHours", type: "number", label: "Overtime Hours", defaultValue: 0 },
            { id: "hourlyRate", name: "hourlyRate", type: "number", label: "Overtime Hourly Rate", defaultValue: 200 },
            {
              id: "overtimePay",
              name: "overtimePay",
              type: "number",
              label: "Overtime Pay",
              computed: {
                formula: "({{overtimeHours}} || 0) * ({{hourlyRate}} || 0)",
                dependsOn: ["overtimeHours", "hourlyRate"],
                returnType: "number",
              },
            },
          ],
        },
        {
          id: "sec_leave",
          title: "3. Leave & Deductions",
          fields: [
            { id: "unpaidLeaveDays", name: "unpaidLeaveDays", type: "number", label: "Unpaid Leave Days", defaultValue: 0 },
            { id: "dailyRate", name: "dailyRate", type: "number", label: "Daily Rate", defaultValue: 1000 },
            {
              id: "unpaidLeaveDeduction",
              name: "unpaidLeaveDeduction",
              type: "number",
              label: "Unpaid Leave Deduction",
              computed: {
                formula: "({{unpaidLeaveDays}} || 0) * ({{dailyRate}} || 0)",
                dependsOn: ["unpaidLeaveDays", "dailyRate"],
                returnType: "number",
              },
            },
            { id: "taxDeduction", name: "taxDeduction", type: "number", label: "Tax Deduction", defaultValue: 1500 },
          ],
        },
        {
          id: "sec_summary",
          title: "4. Payslip Summary",
          fields: [
            {
              id: "netSalary",
              name: "netSalary",
              type: "number",
              label: "Net Salary",
              computed: {
                formula: "({{basicSalary}} || 0) + ({{overtimePay}} || 0) - ({{unpaidLeaveDeduction}} || 0) - ({{taxDeduction}} || 0)",
                dependsOn: ["basicSalary", "overtimePay", "unpaidLeaveDeduction", "taxDeduction"],
                returnType: "number",
              },
            },
            {
              id: "highDeductionAlert",
              name: "highDeductionAlert",
              type: "text",
              label: "Auditor Attention: High Deductions Detected",
              conditions: {
                groups: [
                  {
                    action: "show",
                    rules: [
                      {
                        field: "unpaidLeaveDeduction",
                        operator: "greaterThanOrEqual",
                        value: 1000,
                      },
                    ],
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    // ── Instantiate FormCore Kernel ─────────────────────────────────────────
    const form = new FormCore(payrollWorkflowSchema);

    // Register cross-cutting workflow audit listener via form.use
    form.use(async ({ form: f, fieldId }) => {
      if (!fieldId) return;
      const field = f.resolver.resolveField(fieldId);
      const name = field?.name || fieldId;
      auditLog.push({
        step: `Field Updated: ${name}`,
        timestamp: Date.now(),
        payload: { [name]: f.values[name] },
      });
    });

    // ── Phase 1: Verify Initial State ───────────────────────────────────────
    expect(form.values.employeeId).toBe("EMP-1001");
    expect(form.values.basicSalary).toBe(30000);
    expect(form.values.overtimeHours).toBe(0);
    expect(form.values.overtimePay).toBe(0);
    expect(form.values.unpaidLeaveDays).toBe(0);
    expect(form.values.unpaidLeaveDeduction).toBe(0);
    expect(form.values.taxDeduction).toBe(1500);

    // Initial Net Salary: 30000 - 1500 = 28500
    expect(form.values.netSalary).toBe(28500);

    // High deduction alert should initially be HIDDEN (unpaidLeaveDeduction is 0 < 1000)
    const alertId = form.nameToIdMap["highDeductionAlert"];
    expect(form.visibility[alertId]).toBe(false);

    // ── Phase 2: Record Attendance (10 Hours Overtime) ──────────────────────
    await form.setValue("overtimeHours", 10);

    // Overtime pay recomputed to: 10 * 200 = ₹2,000
    expect(form.values.overtimePay).toBe(2000);
    // Net Salary cascaded to: 30000 + 2000 - 0 - 1500 = ₹30,500
    expect(form.values.netSalary).toBe(30500);

    // ── Phase 3: Approve 1 Day Unpaid Leave ─────────────────────────────────
    await form.setValue("unpaidLeaveDays", 1);

    // Unpaid leave deduction recomputed to: 1 * 1000 = ₹1,000
    expect(form.values.unpaidLeaveDeduction).toBe(1000);

    // ── Phase 4: Final Payslip Verification ─────────────────────────────────
    // Net Salary: Basic (₹30,000) + Overtime (₹2,000) - Leave (-₹1,000) - Tax (-₹1,500) = ₹29,500!
    expect(form.values.netSalary).toBe(29500);

    // High deduction alert should now be VISIBLE (unpaidLeaveDeduction >= 1000)
    expect(form.visibility[alertId]).toBe(true);

    // Form validity
    expect(form.isValid).toBe(true);

    // Verify Audit Trail captured the workflow steps
    expect(auditLog.length).toBeGreaterThanOrEqual(2);
    expect(auditLog.some((e) => e.step === "Field Updated: overtimeHours")).toBe(true);
    expect(auditLog.some((e) => e.step === "Field Updated: unpaidLeaveDays")).toBe(true);
  });
});
