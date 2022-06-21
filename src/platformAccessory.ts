import { Service, PlatformAccessory } from 'homebridge';

import { AWHomebridgePlatform } from './platform';

export class AWPlatformAccessory {
  private service: Service;

  constructor(
    private readonly platform: AWHomebridgePlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'AmbientWeather')
      .setCharacteristic(this.platform.Characteristic.Model, 'WS-2000')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, '1122334455' + accessory.context.sensor.num);

    // get the LightBulb service if it exists, otherwise create a new LightBulb service
    // you can create multiple services for each accessory
    this.service = this.accessory.getService(this.platform.Service.HumiditySensor) ||
                    this.accessory.addService(this.platform.Service.HumiditySensor);

    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.service.setCharacteristic(this.platform.Characteristic.Name, 'Humidity ' + accessory.context.sensor.num);

    this.service.getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity)
      .onGet(this.handleCurrentRelativeHumidityGet.bind(this));

    // Add temperature and dewPoint
    const temp = this.accessory.getService(this.platform.Service.TemperatureSensor) ||
                  this.accessory.addService(this.platform.Service.TemperatureSensor);

    temp.setCharacteristic(this.platform.Characteristic.Name, 'Temperature ' + accessory.context.sensor.num);

    temp.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .onGet(this.handleCurrentTemperatureGet.bind(this));
  }

  handleCurrentRelativeHumidityGet() {
    if (this.accessory.context.last) {
      return this.accessory.context.last?.humidity;
    } else {
      return 0;
    }
  }

  handleCurrentTemperatureGet() {
    if (this.accessory.context.last) {
      return this.accessory.context.last?.tempc;
    } else {
      return 0;
    }
  }

}
