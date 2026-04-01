'use client'

import * as React from 'react'
import * as SliderPrimitive from '@radix-ui/react-slider'

import { cn } from '@/lib/utils'

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min, max],
    [value, defaultValue, min, max],
  )

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      style={{
        position: 'relative',
        display: 'flex',
        width: '100%',
        alignItems: 'center',
        userSelect: 'none',
        touchAction: 'none',
        WebkitUserSelect: 'none',
        cursor: 'pointer',
        height: '44px'
      }}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        style={{
          position: 'relative',
          height: '8px',
          width: '100%',
          flexGrow: 1,
          overflow: 'hidden',
          borderRadius: '9999px',
          backgroundColor: 'rgb(38 38 38)',
          touchAction: 'none',
          WebkitTapHighlightColor: 'transparent',
          cursor: 'pointer'
        }}
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          style={{
            position: 'absolute',
            height: '100%',
            backgroundColor: 'rgb(250 204 21)'
          }}
        />
      </SliderPrimitive.Track>
      {Array.from({ length: _values.length }, (_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          style={{
            display: 'block',
            width: '44px',
            height: '44px',
            borderRadius: '9999px',
            border: '3px solid rgb(250 204 21)',
            backgroundColor: 'white',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            touchAction: 'none',
            WebkitTapHighlightColor: 'transparent',
            cursor: 'grab',
            outline: 'none'
          }}
        />
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }
