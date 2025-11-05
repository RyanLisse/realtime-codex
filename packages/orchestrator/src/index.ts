/**
 * Orchestrator package exports
 */

export { AgentManager } from "./AgentManager.js";
export {
  AgentOrchestrator,
  type OrchestratorConfig,
} from "./AgentOrchestrator.js";
// Export core functions (for testing)
export {
  type AgentState,
  createAgentSession,
  createInitialState,
  getAgent,
  listAgents,
  removeAgent,
  updateAgentStatus,
} from "./core/agentState.js";
// Export shell functions (for advanced usage)
export { loadSessions, saveSessions } from "./shell/sideEffects.js";
export {
  type CommandAgentParams,
  type CommandAgentResponse,
  commandAgentTool,
} from "./tools/commandAgent.js";
export {
  type CreateAgentParams,
  type CreateAgentResponse,
  createAgentTool,
} from "./tools/createAgent.js";
// Export tools
export {
  type ListAgentsParams,
  type ListAgentsResponse,
  listAgentsTool,
} from "./tools/listAgents.js";
export {
  VoiceOrchestrator,
  type VoiceOrchestratorConfig,
} from "./VoiceOrchestrator.js";
