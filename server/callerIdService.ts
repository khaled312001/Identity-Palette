import { EventEmitter } from "events";
import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";

/**
 * CallerIDService handles incoming calls from hardware (FRITZ!Card via CAPI)
 * and broadcasts them to connected POS clients via WebSockets.
 */
export class CallerIDService extends EventEmitter {
  private wss: WebSocketServer | null = null;
  private isSimulation: boolean = true;

  constructor() {
    super();
  }

  /**
   * Initialize the service and start listening for calls
   */
  public async init(server: Server) {
    console.log("[CallerID] Initializing Service...");
    
    // Initialize WebSocket Server
    this.wss = new WebSocketServer({ server, path: "/api/ws/caller-id" });
    
    this.wss.on("connection", (ws) => {
      console.log("[CallerID] Client connected to WebSocket");
      ws.send(JSON.stringify({ type: "connected", status: "ready", mode: this.isSimulation ? "simulation" : "hardware" }));
      
      ws.on("message", (message) => {
        try {
          const data = JSON.parse(message.toString());
          if (data.type === "simulate_call") {
            this.handleIncomingCall(data.phoneNumber || "0123456789");
          }
        } catch (e) {
          console.error("[CallerID] WS Message Error:", e);
        }
      });
    });

    try {
      // Attempt to load CAPI (Common ISDN API) for FRITZ!Card
      // This requires the ffi-napi package and the capi2032.dll on Windows
      this.initHardware().then(success => {
        if (success) {
          this.isSimulation = false;
          console.log("[CallerID] Hardware (CAPI) connected successfully");
        } else {
          console.log("[CallerID] Hardware not found, running in simulation mode");
        }
      });
    } catch (e) {
      console.warn("[CallerID] Failed to init hardware, falling back to simulation", e);
    }
  }

  private async initHardware(): Promise<boolean> {
    // In a real production environment on Windows:
    // 1. Install ffi-napi: npm install ffi-napi
    // 2. The code would look like this:
    /*
    try {
      const ffi = require('ffi-napi');
      const capi = ffi.Library('capi2032.dll', {
        'CAPI_REGISTER': ['uint32', ['uint32', 'uint32', 'uint32', 'uint32', 'pointer']],
        'CAPI_RELEASE': ['uint32', ['uint32']],
        'CAPI_PUT_MESSAGE': ['uint32', ['uint32', 'pointer']],
        'CAPI_GET_MESSAGE': ['uint32', ['uint32', 'pointer']],
        // ... more CAPI functions
      });
      return true;
    } catch (e) {
      return false;
    }
    */
    return false; // Default to false for now as ffi-napi might not be compatible with this build env
  }

  /**
   * Handles an incoming call notification
   */
  public handleIncomingCall(phoneNumber: string) {
    console.log(`[CallerID] Incoming call from: ${phoneNumber}`);
    
    const payload = JSON.stringify({
      type: "incoming_call",
      phoneNumber,
      timestamp: new Date().toISOString()
    });

    if (this.wss) {
      this.wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(payload);
        }
      });
    }

    this.emit("call", phoneNumber);
  }

  /**
   * Mock function to trigger a call (for testing)
   */
  public simulateCall(number: string = "0551234567") {
    this.handleIncomingCall(number);
  }
}

export const callerIdService = new CallerIDService();
