import React, { ChangeEvent } from "react"
import { Input } from '@grafana/ui'

type NumberInputProps = {
    value: number
    defaultValue: number
    onChange: (v: number) => void
    width: number
}

export function NumberInput(props: NumberInputProps) {
    const [isEmpty, setIsEmpty] = React.useState(false)

    const {
        value,
        defaultValue,
        onChange,
        width,
    } = props

    const onNumberChange = (event: ChangeEvent<HTMLInputElement>) => {
        const v = event.currentTarget.value
        if (v.trim() === '') {
            setIsEmpty(true)
            return onChange(defaultValue || 0)
        }

        const n = Number(v)
        if (!Number.isNaN(n)) {
            setIsEmpty(false)
            return onChange(n)
        }
    }

    return (
        <Input
            type="number"
            placeholder={String(defaultValue)}
            value={isEmpty ? '' : value}
            onChange={onNumberChange}
            width={width}
        />
    )
}
