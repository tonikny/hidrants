import { v4 as uuidv4 } from 'uuid';
import { TrackingRepository, UbicacioData } from '../db/repositories/trackingRepository.js';

export const TrackingService = {
  async saveLocation(topic: string, data: {
    tid?: string;
    lat: number;
    lon: number;
    tst: number;
    acc?: number;
    alt?: number;
    batt?: number;
    vel?: number;
    t?: string;
    conn?: string;
  }) {
    const ubicacio: UbicacioData = {
      id: uuidv4(),
      topic,
      tracker_id: data.tid || null,
      lat: data.lat,
      lon: data.lon,
      timestamp: data.tst,
      accuracy: data.acc || null,
      altitude: data.alt || null,
      battery: data.batt || null,
      velocity: data.vel || null,
      trigger: data.t || null,
      connection: data.conn || null,
    };

    await TrackingRepository.insert(ubicacio);
    return ubicacio;
  },

  async getLatest() {
    return TrackingRepository.getLatestByTopic();
  },

  async getHistory(options: { tracker_id?: string; hours: number; limit: number }) {
    const minTimestamp = Math.floor(Date.now() / 1000) - (options.hours * 3600);
    return TrackingRepository.getHistory({
      tracker_id: options.tracker_id,
      minTimestamp,
      limit: options.limit
    });
  }
};
