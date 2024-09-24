<img src="/doc/img/sunflake-logo-long.svg" width="300">

Sunflake is a Grafana plugin that provides a Snowflake datasource.
More detailed information will be updated soon.

## Datasource Configuration
Below is the configuration guide for setting up the Snowflake datasource in Grafana.

![Sunflake datasource configuration](/doc/img/config.png)

|Field                   |Description                                            |
|:-----------------------|:------------------------------------------------------|
|Name                    |The name of the datasource, used for identifying this Snowflake connection.|
|**Connection**          ||
|Account                 |Your Snowflake account identifier. (e.g. NEXON-SUNFLAKE)|
|Authentication Type     |Choose the method of authentication: `basic` (username/password) or `keypair` (private key).|
|User                    |Your Snowflake username.|
|Password                |(Required for `basic` authentication) Your Snowflake password.|
|Private Key             |(Required for `keypair` authentication) The private key used for Snowflake keypair authentication. The key must be in PEM format, starting with `-----BEGIN PRIVATE KEY-----` and ending with `-----END PRIVATE KEY-----`.|
|**Environment**         ||
|Role                    |The role that defines the Snowflake permissions.|
|Database                |The name of the database to be accessed.|
|Schema                  |The schema within the database you wish to query.|
|Warehouse               |The name of the Snowflake warehouse you want to query data from.|
|**Managing connections**||
|Max Open|MaxOpen sets the maximum number of open connections to the database. If MaxOpen is greater than 0 and the new MaxOpen is less than MaxIdle, then MaxIdle will be reduced to match the new MaxOpen limit. If value is 0, then there is no limit on the number of open connections.|
|Max Idle|MaxIdle sets the maximum number of connections in the idle connection pool. If value is 0, no idle connections are retained. The default max idle connections is 2.|
|Idle Timeout Seconds|IdleTimeout sets the maximum amount of time a connection may be idle. Expired connections may be closed lazily before reuse. If value is 0, connections are not closed due to a connection's idle time.|
|Max Lifetime Seconds|MaxLifetime sets the maximum amount of time a connection may be reused. Expired connections may be closed lazily before reuse. If value is 0, connections are not closed due to a connection's age.|

> [!CAUTION]
> This plugin cannot detect malicious code in queries executed on Snowflake, and it does not take responsibility for the execution of such queries. Therefore, you should use a ROLE with minimal privileges. Configure the ROLE to allow read access only to the necessary data by using the "GRANT SELECT ON TABLE" statement.


## Create Visualization
To create visualizations using only mouse clicks without writing Snowflake SQL directly, select "Builder Mode." Conversely, if you need to write complex queries (including joins), use "Code Mode" to enter your SQL directly.

![Edit Mode](/doc/img/mode.png)

### Builder mode for "Time series" data format
This is used when creating a timeseries format from data in a Snowflake table.

![Time series builder](/doc/img/time-series.png)

|Field                   |Description                                            |
|:-----------------------|:------------------------------------------------------|
|X-Axis                  |Select the column that represents time values for the X-axis.|
|Interval and Time unit  |Enter the tick interval for the X-axis.|
|Fill missing points     |Configure how to fill in missing metric values for each interval.|
|Y-Axis                  |Select the column that represents metric values for the Y-axis.|
|Aggregation             |Configure how to handle multiple metric values within a single interval.|
|Label                   |The label for the aggregated value.|
|Legend                  |Select the column used to distinguish between multiple lines in the timeseries.|
|Condition               |A condition to select only the desired values from the table.|
|Limit Rows              |Limits the number of data rows retrieved from the table.|

### Builder mode for "Table" data format
This is a query builder that generates query used to retrieve data in a table format.

![Table builder](/doc/img/table.png)

|Field                   |Description                                            |
|:-----------------------|:------------------------------------------------------|
|Column, Aggregation, Alias|These fields are used to create the SELECT clause.|
|Filter, Group, Order|"Filter" is used to create the WHERE clause, "Group" is for the GROUP BY clause, and "Order" is for the ORDER BY clause.|

### Code mode
Code Mode is a mode for creating visualizations by writing SQL statements directly. In this mode, you can use several provided macros.

![Code](/doc/img/code.png)

|Field                   |Description                                            |
|:-----------------------|:------------------------------------------------------|
|$__time(column)|Converts the column to a timestamp format and sets it with the alias "time," using it as the time axis for the timeseries. This effectively transforms it into `TO_TIMESTAMP_NTZ(column) AS time`.|
|$__timeFilter(column)|Restricts the column to the time range of the dashboard. This effectively transforms it into `column BETWEEN fromTime AND toTime`.|
|$__timeGroup(column,interval,value)|Sets the time axis for the timeseries based on the specified column. The interval represents the tick interval for the time axis, which can be referenced in the time unit table below. The value specifies what to display when there are no corresponding values for a given time, as detailed in the fillMissingValue table below.   For example, if you are using the `createdate` column as the time value, setting the interval to `1 minute`, and filling missing values with `0`, it would be written as `$__timeGroup(CREATEDATE, '1m', 0)`.|


If using macros feels difficult, exploring Builder Mode (timeseries) by trying different options and checking the `preview` can help you understand how the macros work.

#### Time Unit
|Unit                    |Description                                            |
|:-----------------------|:------------------------------------------------------|
|s|Second|
|m|Minute|
|h|Hour|
|d|Day|
|w|Week|
|M|Month|
|y|Year|

#### Fill missing value
|value                   |Description                                            |
|:-----------------------|:------------------------------------------------------|
|0|Set the value to 0.|
|null|Sets to null, so it will not be displayed.|
|previous|Fills with the value from the previous time period.|

> [!CAUTION]
> Be cautious, as the values entered will be lost when switching between Builder and Code modes.

## Usage Guide
Let's assume you have the following data that you want to represent as a time series.

```SQL
SELECT createdate, name, size
FROM sunflake_long_frame
```

|Createdate         |Name   |Size|
|:-----------------:|:------|---:|
|2024-03-19 13:03:20|Tom    |5   |
|2024-03-19 13:05:28|Tom    |2   |
|2024-03-19 13:10:35|Tom    |10  |
|2024-03-19 13:09:30|Charlie|5   |
|2024-03-19 13:10:35|Charlie|12  |
|2024-03-19 13:04:29|David  |3   |

The data in this table does not have consistent intervals for createdate. Therefore, it is necessary to group and sort the values into regular intervals.   If the values are grouped into 1-minute intervals, it would look like this.

```SQL
SELECT
  TIME_SLICE(TO_TIMESTAMP_NTZ(createdate), 60, 'SECOND', 'START') AS time,
  name,
  SUM(size) AS size
FROM sunflake_long_frame
GROUP BY time, name
ORDER BY time
```

|Time               |Name   |Size|
|:-----------------:|:------|---:|
|2024-03-19 13:03:00|Tom    |5   |
|2024-03-19 13:04:00|David  |3   |
|2024-03-19 13:05:00|Tom    |2   |
|2024-03-19 13:09:00|Charlie|5   |
|2024-03-19 13:10:00|Tom    |10  |
|2024-03-19 13:10:00|Charlie|12  |

However, since there are not values for every minute, the graph will not be a continuous line but will appear as points, as shown below.

![time slice](/doc/img/time_slice.png)

If you want to maintain the previous value to connect the points when a value is missing, you should use the timeGroup macro as follows.

![time group](/doc/img/time_group_previous.png)

If you are using Builder Mode, you can input it as follows.
Looking at the preview query, you can see that it matches the query above.

![builder time group](/doc/img/builder_time_group.png)

## Install the sunflake plugin
#### 1. Download the Sunflake plugin
Download the plugin(zip file) from the [release page](https://github.com/nexon-official/sunflake/releases)

#### 2. Extract the Sunflake plugin
```bash
unzip nexon-sunflake-datasource-x.x.x.zip -d YOUR_PLUGIN_DIR
```
This will extract the plugin into the YOUR_PLUGIN_DIR.   
Your grafana plugins directory typically located at `/var/lib/grafana/plugins`.
> [!WARNING]
> The locations of the plugin folder and grafana.ini file may vary. Please refer to the official Grafana documentation for more details.


#### 3. Allow Unsigned plugin
Open the `grafana.ini` file, usually located in `/etc/grafana/grafana.ini`.   
Add or update the following line under the `[plugins]` section to allow unsigned plugins:
```ini
[plugins]
allow_loading_unsigned_plugins = nexon-sunflake-datasource
```
> [!NOTE]
> Please refer to the documentation for more details.   
https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/#configuration-file-location   
https://grafana.com/docs/grafana/latest/administration/plugin-management/#allow-unsigned-plugins

#### 4. Restart Grafana
Restart the Grafana server to apply the changes:
```bash
sudo service grafana-server restart
```
> [!NOTE]
> Please refer to the documentation for more details.
https://grafana.com/docs/grafana/latest/setup-grafana/start-restart-grafana/
