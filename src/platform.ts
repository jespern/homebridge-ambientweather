import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';

import { getFrame, sensorsFromFrame } from './aw';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { AWPlatformAccessory } from './platformAccessory';

export class AWHomebridgePlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  public sensors: Array<PlatformAccessory> = [];

  // this is used to track restored cached accessories
  public readonly accessories: PlatformAccessory[] = [];

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.log.debug('Finished initializing platform:', this.config.name);

    this.api.on('didFinishLaunching', () => {
      this.discoverDevices();
      this.updateWeather();
    });
  }

  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);
    this.accessories.push(accessory);
  }

  updateWeather() {
    const frame = getFrame(this.config);
    const sensors = sensorsFromFrame(frame);

    sensors.then(sensors => {
      sensors.forEach(sensor => {
        const acc = this.sensors.find(accessory => accessory.context.sensor.num === sensor.num);

        if (acc) {
          acc.context.last = sensor;

          const temp = acc.getService(this.Service.TemperatureSensor);
          const humidity = acc.getService(this.Service.HumiditySensor);

          temp?.setCharacteristic(this.Characteristic.CurrentTemperature, sensor.tempc);
          humidity?.setCharacteristic(this.Characteristic.CurrentRelativeHumidity, sensor.humidity);

          this.log.debug('Logged sensor ' + sensor.num + ' as ' + JSON.stringify(sensor) + ' (acc is = ' + acc.context.sensor.num + ')');
        }
      });
    });

    setTimeout(this.updateWeather.bind(this), 30000);
  }

  discoverDevices() {
    const frame = getFrame(this.config);
    const sensors = sensorsFromFrame(frame);

    sensors.then(sensors => {
      sensors.forEach(sensor => {
        const uuid = this.api.hap.uuid.generate('sensor' + sensor.num);
        const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

        if (existingAccessory) {
          new AWPlatformAccessory(this, existingAccessory);

          this.sensors.push(existingAccessory);
        } else {
          this.log.info('Adding new accessory: sensor', sensor.num);

          // create a new accessory
          const accessory = new this.api.platformAccessory('Sensor ' + sensor.num, uuid);
          accessory.context.sensor = sensor;

          // link the accessory to your platform
          this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);

          this.sensors.push(accessory);
        }
      });
    });
  }
}
