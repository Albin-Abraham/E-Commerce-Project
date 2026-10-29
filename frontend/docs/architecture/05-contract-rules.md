# Frontend IPC Governance

> Status: Mandatory Engineering Contract
> Scope: Public Contracts and System Interfaces

## 1. Public Contract System

Every feature MUST expose a public contract boundary.
Consumers MAY ONLY import from `feature/public`. Direct internal imports are prohibited.

## 2. Public Contract Rules

Feature public contracts define:

- approved exports
- communication events
- route contracts
- DTO contracts
- capability contracts
- permission contracts
- extension contracts
  Public contracts are the ONLY supported integration boundary.

## 3. Public Contract Structure

Required public structure under `public/`:
`index.ts`, `contracts.ts`, `events.ts`, `routes.ts`, `permissions.ts`, `capabilities.ts`, `types.ts`.
All externally consumable behavior MUST be declared here.
