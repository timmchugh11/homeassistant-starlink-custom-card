# starlink-custom-card
Custom home assistant lovelace card showing status of starlink

To install the card, create a new folder in your "homeassistant/www/" directory called "starlink-card" and download the files to this directory. Then in Home Assistant go to Configuration - Lovelace Dashboards - Resources and click "Add Resource". Enter "/local/starlink-card/starlink-card.js" for the URL and "JavaScript Module" for the type and click create. Back in your main dashboard, you can now manually add the new card with the following code:

```
type: custom:starlink-card
downlink: sensor.starlink_downlink_throughput
uplink: sensor.starlink_uplink_throughput
ping: sensor.starlink_ping
ip: sensor.myip
obstructed: binary_sensor.starlink_obstructed
pingdrop: sensor.starlink_ping_drop_rate
roaming: binary_sensor.starlink_roaming_mode
stow: switch.starlink_stowed
```

![alt text](https://github.com/timmchugh11/starlink-card/blob/main/img/Screenshot%202023-11-06%20094837.png)
