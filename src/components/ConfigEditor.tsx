import React, { ChangeEvent } from 'react'
import { InlineField, Input, SecretInput, SecretTextArea, Select } from '@grafana/ui'
import { DataSourcePluginOptionsEditorProps, SelectableValue } from '@grafana/data'
import { DEFAULT_CONNECTION_POOL, SunflakeDataSourceOptions, SunflakeSecureJsonData } from '../types'
import { NumberInput } from './input/NumberInput'

interface Props extends DataSourcePluginOptionsEditorProps<SunflakeDataSourceOptions> { }

const LABEL_WIDTH = 25
const INPUT_WIDTH = 34

export function ConfigEditor(props: Props) {
  const { onOptionsChange, options } = props
  const { jsonData, secureJsonFields } = options
  const { connPoolOptions = DEFAULT_CONNECTION_POOL } = jsonData
  const secureJsonData = (options.secureJsonData || {}) as SunflakeSecureJsonData
  const authtypeOptions = [
    { label: "Basic", value: "basic" },
    { label: "Keypair", value: "keypair" },
  ]

  const onAccountChange = (event: ChangeEvent<HTMLInputElement>) => {
    onOptionsChange({
      ...options,
      jsonData: {
        ...jsonData,
        account: event.target.value,
      }
    })
  }

  const onAuthTypeChange = (value: SelectableValue) => {
    onOptionsChange({
      ...options,
      jsonData: {
        ...jsonData,
        authtype: value.value
      }
    })
  }

  const onUserChange = (event: ChangeEvent<HTMLInputElement>) => {
    onOptionsChange({
      ...options,
      jsonData: {
        ...jsonData,
        user: event.target.value,
      }
    })
  }

  const onRoleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onOptionsChange({
      ...options,
      jsonData: {
        ...jsonData,
        role: event.target.value,
      }
    })
  }

  const onDatabaseChange = (event: ChangeEvent<HTMLInputElement>) => {
    onOptionsChange({
      ...options,
      jsonData: {
        ...jsonData,
        database: event.target.value,
      }
    })
  }

  const onSchemaChange = (event: ChangeEvent<HTMLInputElement>) => {
    onOptionsChange({
      ...options,
      jsonData: {
        ...jsonData,
        schema: event.target.value,
      }
    })
  }

  const onWarehouseChange = (event: ChangeEvent<HTMLInputElement>) => {
    onOptionsChange({
      ...options,
      jsonData: {
        ...jsonData,
        warehouse: event.target.value,
      }
    })
  }

  // Secure field (only sent to the backend)
  const onPasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    onOptionsChange({
      ...options,
      secureJsonFields: {
        ...options.secureJsonFields,
        password: false,
      },
      secureJsonData: {
        password: event.target.value,
        privatekey: '',
      },
    })
  }

  const onResetPassword = () => {
    onOptionsChange({
      ...options,
      secureJsonFields: {
        ...options.secureJsonFields,
        password: false,
      },
      secureJsonData: {
        ...options.secureJsonData,
        password: '',
      },
    })
  }

  const onPrivateKeyChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onOptionsChange({
      ...options,
      secureJsonFields: {
        ...options.secureJsonFields,
        password: false,
      },
      secureJsonData: {
        password: '',
        privatekey: event.target.value,
      },
    })
  }

  const onResetPrivateKey = () => {
    onOptionsChange({
      ...options,
      secureJsonFields: {
        ...options.secureJsonFields,
        privatekey: false,
      },
      secureJsonData: {
        ...options.secureJsonData,
        privatekey: '',
      },
    })
  }

  const onMaxOpenChange = (n: number) => {
    onOptionsChange({
      ...options,
      jsonData: {
        ...jsonData,
        connPoolOptions: {
          ...connPoolOptions,
          maxOpen: n,
        }
      }
    })
  }

  const onMaxIdleChange = (n: number) => {
    onOptionsChange({
      ...options,
      jsonData: {
        ...jsonData,
        connPoolOptions: {
          ...connPoolOptions,
          maxIdle: n,
        }
      }
    })
  }

  const onIdleTimeoutChange = (n: number) => {
    onOptionsChange({
      ...options,
      jsonData: {
        ...jsonData,
        connPoolOptions: {
          ...connPoolOptions,
          idleTimeout: n,
        }

      }
    })
  }

  const onMaxLifetimeChange = (n: number) => {
    onOptionsChange({
      ...options,
      jsonData: {
        ...jsonData,
        connPoolOptions: {
          ...connPoolOptions,
          maxLifetime: n,
        }
      }
    })
  }

  return (
    <div className="gf-form-group">
      <h4>Connection</h4>
      <InlineField label="Account" labelWidth={LABEL_WIDTH}>
        <Input
          onChange={onAccountChange}
          value={jsonData.account || ''}
          placeholder=""
          width={INPUT_WIDTH}
        />
      </InlineField>
      <InlineField label="Authentication Type" labelWidth={LABEL_WIDTH}>
        <Select
          options={authtypeOptions}
          value={jsonData.authtype || 'basic'}
          onChange={onAuthTypeChange}
          width={INPUT_WIDTH}
        />
      </InlineField>
      <InlineField label="User" labelWidth={LABEL_WIDTH}>
        <Input
          onChange={onUserChange}
          value={jsonData.user || ''}
          placeholder=""
          width={INPUT_WIDTH}
        />
      </InlineField>
      {(jsonData.authtype || 'basic') === 'basic' ? (
        <InlineField label="Password" labelWidth={LABEL_WIDTH}>
          <SecretInput
            isConfigured={(secureJsonFields && secureJsonFields.password) as boolean}
            value={secureJsonData.password || ''}
            placeholder="user password"
            width={INPUT_WIDTH}
            onReset={onResetPassword}
            onChange={onPasswordChange}
          />
        </InlineField>
      ) : null}
      {jsonData.authtype === 'keypair' ? (
        <InlineField label="Private Key" labelWidth={LABEL_WIDTH}>
          <SecretTextArea
            isConfigured={(secureJsonFields && secureJsonFields.privatekey) as boolean}
            value={secureJsonData.privatekey || ''}
            placeholder={"-----BEGIN PRIVATE KEY-----\n...\n...\n...-----END PRIVATE KEY-----"}
            onReset={onResetPrivateKey}
            onChange={onPrivateKeyChange}
            cols={32}
            rows={5}
          />
        </InlineField>
      ) : null}
      <br />
      <h4>Environment</h4>
      <InlineField label="Role" labelWidth={LABEL_WIDTH}>
        <Input
          onChange={onRoleChange}
          value={jsonData.role || ''}
          placeholder=""
          width={INPUT_WIDTH}
        />
      </InlineField>
      <InlineField label="Database" labelWidth={LABEL_WIDTH}>
        <Input
          onChange={onDatabaseChange}
          value={jsonData.database || ''}
          placeholder=""
          width={INPUT_WIDTH}
        />
      </InlineField>
      <InlineField label="Schema" labelWidth={LABEL_WIDTH}>
        <Input
          onChange={onSchemaChange}
          value={jsonData.schema || ''}
          placeholder=""
          width={INPUT_WIDTH}
        />
      </InlineField>
      <InlineField label="Warehouse" labelWidth={LABEL_WIDTH}>
        <Input
          onChange={onWarehouseChange}
          value={jsonData.warehouse || ''}
          placeholder=""
          width={INPUT_WIDTH}
        />
      </InlineField>
      <br />
      <h4>Managing connections</h4>
      <InlineField label="Max Open" labelWidth={LABEL_WIDTH} tooltip={
        <span>
          MaxOpen sets the maximum number of open connections to the database.
          If MaxOpen is greater than 0 and the new MaxOpen is less than MaxIdle,
          then MaxIdle will be reduced to match the new MaxOpen limit.
          If value is 0, then there is no limit on the number of open connections.
        </span>
      }>
        <NumberInput
          value={connPoolOptions.maxOpen}
          defaultValue={DEFAULT_CONNECTION_POOL.maxOpen}
          onChange={onMaxOpenChange}
          width={INPUT_WIDTH}
        />
      </InlineField>
      <InlineField label="Max Idle" labelWidth={LABEL_WIDTH} tooltip={
        <span>
          MaxIdle sets the maximum number of connections in the idle connection pool.
          If value is 0, no idle connections are retained.
          The default max idle connections is 2.
        </span>
      }>
        <NumberInput
          value={connPoolOptions.maxIdle}
          defaultValue={DEFAULT_CONNECTION_POOL.maxIdle}
          onChange={onMaxIdleChange}
          width={INPUT_WIDTH}
        />
      </InlineField>
      <InlineField label="Idle Timeout Seconds" labelWidth={LABEL_WIDTH} tooltip={
        <span>
          IdleTimeout sets the maximum amount of time a connection may be idle.
          Expired connections may be closed lazily before reuse.
          If value is 0, connections are not closed due to a connection&apos;s idle time.
        </span>
      }>
        <NumberInput
          value={connPoolOptions.idleTimeout}
          defaultValue={DEFAULT_CONNECTION_POOL.idleTimeout}
          onChange={onIdleTimeoutChange}
          width={INPUT_WIDTH}
        />
      </InlineField>
      <InlineField label="Max Lifetime Seconds" labelWidth={LABEL_WIDTH} tooltip={
        <span>
          MaxLifetime sets the maximum amount of time a connection may be reused.
          Expired connections may be closed lazily before reuse.
          If value is 0, connections are not closed due to a connection&apos;s age.
        </span>
      }>
        <NumberInput
          value={connPoolOptions.maxLifetime}
          defaultValue={DEFAULT_CONNECTION_POOL.maxLifetime}
          onChange={onMaxLifetimeChange}
          width={INPUT_WIDTH}
        />
      </InlineField>
    </div>
  )
}
