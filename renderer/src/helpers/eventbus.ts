import { Observable } from 'rxjs';

const globalEvents = (window as any).globalEvents;

export const centralEventBus = {
  on: (channel: string) => {
    return new Observable<{ event: any; message: any; }>(subscriber => {
      const listener = (event: any, message: any) => {
        subscriber.next({ event, message });
      };
      globalEvents.on(channel, listener);
      return {
        unsubscribe() {
          globalEvents.removeListener(channel, listener);
        },
      };
    });
  },
  emit: (channel: string, data?: any) => {
    globalEvents.send(channel, data);
  },
  clearAll: (channel?: string) => {
    globalEvents.removeAllListeners(channel);
  },
};