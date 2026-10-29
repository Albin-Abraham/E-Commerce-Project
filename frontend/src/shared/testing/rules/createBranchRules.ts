// @ts-nocheck
import { CreateBranchDriver } from "../drivers/CreateBranchDriver";

export const mustRequireName = async (driver: CreateBranchDriver) => {
  await driver.enterBranchCode("TEST-001");
  await driver.selectBranchType("HQ");
  // Leave name empty
  await driver.createBranch();

  await driver.expectValidationFailure();
};
