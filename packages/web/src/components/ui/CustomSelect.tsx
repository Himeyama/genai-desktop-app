import {
  Description,
  Field,
  Label,
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/react';
import { PiCheck } from 'react-icons/pi';
import type { SelectBlockSize } from '@/components/ui/dads/Select';
import { SupportTextStyles } from '@/components/ui/dads/SupportText';
import { ArrowDownIcon } from '@/components/ui/icons/ArrowDownIcon';

type SupportTextPosition = 'top' | 'bottom';
type Option = {
  value: string;
  label: string;
  disabled?: boolean;
};

type Props = {
  className?: string;
  label?: string;
  labelClassName?: string;
  value: string;
  options: Option[];
  description?: string;
  isFullWidth?: boolean;
  isVertical?: boolean;
  selectSize?: SelectBlockSize;
  onChange: (value: string) => void;
};

// Determine the position of the support text for a select box.
// - Top: shown above the select box when vertical layout is used
// - Bottom: shown below the select box when horizontal layout is used
const getSupportTextPosition = (
  isVertical?: boolean,
  description?: string,
): SupportTextPosition | undefined => {
  if (!description) return undefined;
  return isVertical ? 'top' : 'bottom';
};

// Returns the display label of the selected option based on the given value.
// If no matching option is found, returns a fallback label.
const getSelectedValue = (options: Option[], value: string) => {
  const matchedOption = options.find((o) => o.value === value);
  return matchedOption?.label ?? '選択してください';
};

export const CustomSelect = (props: Props) => {
  const {
    className,
    label,
    labelClassName,
    description,
    value,
    options,
    onChange,
    isVertical,
    isFullWidth,
    selectSize = 'sm',
  } = props;

  const supportTextPosition = getSupportTextPosition(isVertical, description);
  const selectedLabel = getSelectedValue(options, value);

  return (
    <Field className={`relative ${isFullWidth ? 'w-full min-w-0' : ''} ${className ?? ''}`}>
      <div
        className={`flex ${isVertical ? 'flex-col gap-y-1.5' : 'flex-row items-center gap-x-0.5'} ${isFullWidth ? 'w-full min-w-0' : ''}`}
      >
        {label && (
          <Label className={`flex w-fit items-center gap-2 text-gray-800 ${labelClassName ?? ''}`}>
            {label}
          </Label>
        )}
        {supportTextPosition === 'top' && (
          <Description className={SupportTextStyles}>{description}</Description>
        )}
        <Listbox value={value} onChange={onChange}>
          <div className={`relative ${isFullWidth ? 'min-w-0 flex-1 w-full' : ''}`}>
            <ListboxButton
              className={`group/button relative rounded border border-gray-600 bg-white pr-10 pl-3 text-left text-gray-800 hover:border-black focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2 data-[select-size=lg]:h-14 data-[select-size=md]:h-12 data-[select-size=sm]:h-10 ${isFullWidth ? 'w-full' : 'w-fit'}`}
              data-select-size={selectSize}
            >
              <span className='block truncate'>{selectedLabel}</span>

              <span className='pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2'>
                <ArrowDownIcon
                  className='mt-0.5 group-data-open/button:rotate-180'
                  aria-hidden={true}
                />
              </span>
            </ListboxButton>
            <ListboxOptions
              className={`absolute z-10 mt-0.5 max-h-60 overflow-auto rounded-lg border border-gray-400 bg-white py-1 text-base leading-tight shadow-md focus:outline-hidden has-[>:nth-child(7)]:rounded-r-none ${isFullWidth ? 'w-full' : 'w-fit'}`}
            >
              {options.map((option, idx) => (
                // NOTE: The `focus` state of ListboxOptions in Headless UI v2 is same as `active` state.
                // Therefore we still cannot use the state as `data-[focus]` for focus-visible currently.
                <ListboxOption
                  key={`${option.value}-${idx}`}
                  disabled={option.disabled}
                  className={({ focus, disabled }) =>
                    `relative h-9 py-2 pr-4 pl-10 select-none ${disabled ? 'text-gray-400' : 'text-gray-800 hover:bg-gray-50 data-selected:bg-blue-50! data-selected:text-blue-700!'} ${focus && !disabled ? 'bg-gray-100' : ''} `
                  }
                  value={option.value}
                >
                  {({ selected }) => (
                    <>
                      <span className={`block truncate ${selected ? 'font-bold' : 'font-normal'}`}>
                        {option.label}
                      </span>
                      {selected ? (
                        <span className='absolute inset-y-0 left-0 flex items-center pl-3 text-blue-700'>
                          <PiCheck aria-hidden={true} className='size-5' />
                        </span>
                      ) : null}
                    </>
                  )}
                </ListboxOption>
              ))}
            </ListboxOptions>
          </div>
        </Listbox>
      </div>
      {supportTextPosition === 'bottom' && (
        <Description className={`${SupportTextStyles} mt-1`}>{description}</Description>
      )}
    </Field>
  );
};
