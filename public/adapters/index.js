import allthailand from './allthailand.js';
import custom from './custom.js';

export const ADAPTERS = [allthailand, custom];

export function getAdapter(id) {
  return ADAPTERS.find(a => a.id === id) || ADAPTERS[0];
}
