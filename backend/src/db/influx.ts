import { InfluxDB, Point } from '@influxdata/influxdb-client';

const url = process.env.INFLUX_URL || 'http://127.0.0.1:8086';
const token = process.env.INFLUX_TOKEN || 'smarthub-super-secret-token';
const org = process.env.INFLUX_ORG || 'smarthub';
const bucket = process.env.INFLUX_BUCKET || 'energy';

export const influxDB = new InfluxDB({ url, token });
export const writeApi = influxDB.getWriteApi(org, bucket);
export const queryApi = influxDB.getQueryApi(org);

/**
 * Record power consumption for a specific device
 */
export function recordPowerMetrics(deviceId: number, deviceName: string, powerW: number) {
  const point = new Point('power_consumption')
    .tag('device_id', deviceId.toString())
    .tag('device_name', deviceName)
    .floatField('power', powerW);

  writeApi.writePoint(point);
  
  // Flush immediately for dev purposes (in prod you might want to rely on the default auto-flush)
  writeApi.flush().catch(console.error);
  
  console.log(`[InfluxDB] Recorded ${powerW}W for ${deviceName}`);
}

// Ensure the writeApi flushes on exit
process.on('SIGINT', async () => {
  try {
    await writeApi.close();
    console.log('InfluxDB write API closed.');
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
});
