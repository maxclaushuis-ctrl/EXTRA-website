import { EventEmitter } from 'events';
const eventEmitter = new EventEmitter();
eventEmitter.setMaxListeners(50);
export default eventEmitter;
