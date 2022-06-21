import { PlatformConfig } from 'homebridge';

const AmbientWeatherApi = require('ambient-weather-api');

interface Sensor {
    num: string;
    humidity: number;
    tempf: number;
    tempc?: number;
    feelsLike: number;
}

export function sensorsFromFrame(frame) {
  const sensors: Array<Sensor> = [];
  return frame.then((data) => {
    data.forEach(element => {
      Object.keys(element).forEach(key => {
        if (key.startsWith('feelsLike') && key.length > 9) {
          const sensorNum = key.slice(-1);
          if (element.hasOwnProperty('humidity' + sensorNum)
                    && element.hasOwnProperty('temp' + sensorNum + 'f')
                    && element.hasOwnProperty('dewPoint' + sensorNum)) {
            const sensor: Sensor = {
              'num': sensorNum,
              'tempf': element['temp' + sensorNum + 'f'],
              'humidity': element['humidity' + sensorNum],
              'feelsLike': element['feelsLike' + sensorNum],
            };

            sensor.tempc = parseFloat(((sensor.tempf - 32) / 1.8).toFixed(1));

            sensors.push(sensor);
          }
        }
      });

    });
  }).then(() => {
    return sensors;
  });
}

export function getFrame(config: PlatformConfig) {
  const api = new AmbientWeatherApi({
    apiKey: config.api_key,
    applicationKey: config.application_key,
  });

  return api.deviceData(config.mac_address, { limit: 1 });
}