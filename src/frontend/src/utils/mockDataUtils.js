/**
 * Generates an array of mock sensor data records.
 */
export function generateMockData(count, dateFrom, dateTo, tempMin, tempMax, humMin, humMax, doorOpenChance, deviceId) {
  const startTs = dateFrom.valueOf();
  const endTs = dateTo.valueOf();
  const step = count > 1 ? (endTs - startTs) / (count - 1) : 0;

  const data = [];
  let prevTemp = (tempMin + tempMax) / 2;
  let prevHum = (humMin + humMax) / 2;

  for (let i = 0; i < count; i++) {
    const ts = count === 1 ? startTs : startTs + step * i;

    const tempDrift = (Math.random() - 0.5) * 2;
    let temp = prevTemp + tempDrift;
    temp = Math.max(tempMin, Math.min(tempMax, temp));
    temp = Math.round(temp * 10) / 10;
    prevTemp = temp;

    const humDrift = (Math.random() - 0.5) * 3;
    let hum = prevHum + humDrift;
    hum = Math.max(humMin, Math.min(humMax, hum));
    hum = Math.round(hum * 10) / 10;
    prevHum = hum;

    const doors = Math.random() < doorOpenChance ? 1 : 0;

    data.push({
      deviceId,
      timestamp: new Date(ts).toISOString(),
      temperature: temp,
      humidity: hum,
      doors: !!doors,
    });
  }

  return data;
}
