/**
 * Fulfillment Bounded Context Public API
 */

export { FulfillmentMethod, type FulfillmentType } from "./domain/fulfillment-method.vo";
export {
  EvaluateBopisEligibilityQuery,
  type BopisEligibilityResult,
} from "./application/evaluate-bopis-eligibility.query";
