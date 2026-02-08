import React from 'react';
/**
 * WebSocket Utility for Real-Time Updates
 * Provides real-time messaging, notifications, and status updates
 */

import { logger } from './logger';

class WebSocketManager {
  constructor() {
    this.ws = null;
    this.url = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.listeners = new Map();
    this.messageQueue = [];
    this.heartbeatInterval = null;
  }

  /**
   * Initialize WebSocket connection
   * @param {string} wsUrl - WebSocket URL
   * @param {Object} options - Configuration options
   */
  connect(wsUrl, options = {}) {
    const { 
      onOpen = null, 
      onClose = null, 
      onError = null,
      autoReconnect = true,
      heartbeat = true 
    } = options;

    this.url = wsUrl;
    this.onOpen = onOpen;
    this.onClose = onClose;
    this.onError = onError;
    this.autoReconnect = autoReconnect;

    try {
      logger.info('Connecting to WebSocket', { url: wsUrl });
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => this.handleOpen();
      this.ws.onmessage = (event) => this.handleMessage(event);
      this.ws.onerror = (error) => this.handleError(error);
      this.ws.onclose = () => this.handleClose();

      if (heartbeat) {
        this.setupHeartbeat();
      }
    } catch (error) {
      logger.error('WebSocket connection failed', error);
      if (this.onError) this.onError(error);
    }
  }

  /**
   * Handle WebSocket open event
   */
  handleOpen() {
    logger.info('WebSocket connected');
    this.isConnected = true;
    this.reconnectAttempts = 0;

    // Send queued messages
    this.flushMessageQueue();

    if (this.onOpen) this.onOpen();
  }

  /**
   * Handle incoming messages
   */
  handleMessage(event) {
    try {
      const data = JSON.parse(event.data);
      const { type, payload } = data;

      logger.debug('WebSocket message received', { type, payload });

      // Trigger listeners
      if (this.listeners.has(type)) {
        const callbacks = this.listeners.get(type);
        callbacks.forEach((callback) => callback(payload));
      }

      // Trigger generic listener
      if (this.listeners.has('*')) {
        const callbacks = this.listeners.get('*');
        callbacks.forEach((callback) => callback(data));
      }
    } catch (error) {
      logger.error('Failed to process WebSocket message', error);
    }
  }

  /**
   * Handle WebSocket error
   */
  handleError(error) {
    logger.error('WebSocket error', error);
    if (this.onError) this.onError(error);
  }

  /**
   * Handle WebSocket close
   */
  handleClose() {
    logger.info('WebSocket disconnected');
    this.isConnected = false;
    this.clearHeartbeat();

    if (this.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * this.reconnectAttempts;
      logger.info(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
      setTimeout(() => this.connect(this.url), delay);
    }

    if (this.onClose) this.onClose();
  }

  /**
   * Send message to server
   */
  send(type, payload = {}) {
    const message = JSON.stringify({ type, payload });

    if (this.isConnected && this.ws) {
      try {
        this.ws.send(message);
        logger.debug('WebSocket message sent', { type });
      } catch (error) {
        logger.error('Failed to send WebSocket message', error);
        this.messageQueue.push(message);
      }
    } else {
      logger.warn('WebSocket not connected, queuing message', { type });
      this.messageQueue.push(message);
    }
  }

  /**
   * Subscribe to message type
   */
  on(type, callback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type).push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(type);
      const index = callbacks.indexOf(callback);
      if (index > -1) callbacks.splice(index, 1);
    };
  }

  /**
   * Unsubscribe from message type
   */
  off(type, callback) {
    if (!this.listeners.has(type)) return;
    const callbacks = this.listeners.get(type);
    const index = callbacks.indexOf(callback);
    if (index > -1) callbacks.splice(index, 1);
  }

  /**
   * Flush queued messages
   */
  flushMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (this.ws) this.ws.send(message);
    }
  }

  /**
   * Setup heartbeat to keep connection alive
   */
  setupHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected && this.ws) {
        this.send('ping');
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Clear heartbeat interval
   */
  clearHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect() {
    logger.info('Disconnecting WebSocket');
    this.autoReconnect = false;
    this.clearHeartbeat();
    if (this.ws) {
      this.ws.close();
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      url: this.url,
      reconnectAttempts: this.reconnectAttempts,
      queuedMessages: this.messageQueue.length,
    };
  }
}

// Create singleton instance
export const wsManager = new WebSocketManager();

/**
 * React Hook for WebSocket
 * Usage: useWebSocket('ws://localhost:8000/ws', 'chat', handleMessage);
 */
export const useWebSocket = (wsUrl, messageType, callback) => {
  const [isConnected, setIsConnected] = React.useState(false);

  React.useEffect(() => {
    if (!wsManager.isConnected) {
      wsManager.connect(wsUrl, {
        onOpen: () => setIsConnected(true),
        onClose: () => setIsConnected(false),
      });
    }

    // Subscribe to message type
    const unsubscribe = wsManager.on(messageType, callback);

    return () => {
      unsubscribe();
    };
  }, [wsUrl, messageType, callback]);

  return { isConnected, send: wsManager.send.bind(wsManager) };
};

export default wsManager;
