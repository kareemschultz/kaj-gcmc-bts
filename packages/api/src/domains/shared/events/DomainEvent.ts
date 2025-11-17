/**
 * Domain Events Infrastructure
 *
 * Event-driven architecture foundation for cross-domain communication
 */

export class DomainEvent {
  public readonly id: string;
  public readonly eventType: string;
  public readonly data: Record<string, any>;
  public readonly timestamp: Date;
  public readonly version: number;

  constructor(
    eventType: string,
    data: Record<string, any>,
    version: number = 1
  ) {
    this.id = this.generateEventId();
    this.eventType = eventType;
    this.data = data;
    this.timestamp = new Date();
    this.version = version;
  }

  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  toJSON() {
    return {
      id: this.id,
      eventType: this.eventType,
      data: this.data,
      timestamp: this.timestamp,
      version: this.version
    };
  }
}

export interface DomainEventHandler<T = any> {
  handle(event: DomainEvent): Promise<void> | void;
  eventType: string;
}

export class DomainEventDispatcher {
  private handlers: Map<string, DomainEventHandler[]> = new Map();

  subscribe(eventType: string, handler: DomainEventHandler): void {
    const existingHandlers = this.handlers.get(eventType) || [];
    this.handlers.set(eventType, [...existingHandlers, handler]);
  }

  async dispatch(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.eventType) || [];

    await Promise.all(
      handlers.map(handler => handler.handle(event))
    );
  }

  async dispatchMany(events: DomainEvent[]): Promise<void> {
    await Promise.all(
      events.map(event => this.dispatch(event))
    );
  }
}

// Global event dispatcher instance
export const domainEventDispatcher = new DomainEventDispatcher();