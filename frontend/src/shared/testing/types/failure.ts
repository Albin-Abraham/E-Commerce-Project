export enum FailureType {
  Validation = "Validation",
  Authorization = "Authorization",
  Network = "Network",
  Server = "Server",
  Conflict = "Conflict",
  Timeout = "Timeout", // Distinguishes async exhaustion from transport failure
  Dependency = "Dependency", // Separates internal failures from downstream outages
}
