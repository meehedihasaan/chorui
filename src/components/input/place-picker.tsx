import { useState } from 'react';
import { MapPinIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { PostPlace } from '@lib/types/tweet';

type Props = {
  value: PostPlace | null;
  editing: boolean;
  onChange: (place: PostPlace | null) => void;
  onClose: () => void;
  onEdit: () => void;
};

export function PlacePicker({ value, editing, onChange, onClose, onEdit }: Props): JSX.Element {
  const [name, setName] = useState(value?.name ?? '');
  const [address, setAddress] = useState(value?.address ?? '');

  if (!editing && value)
    return (
      <div className='flex items-center gap-2 text-sm text-main-accent'>
        <button type='button' onClick={onEdit} className='flex min-w-0 items-center gap-1 font-bold hover:underline'>
          <MapPinIcon className='h-4 w-4 shrink-0' />
          <span className='truncate'>{value.name}{value.address ? `, ${value.address}` : ''}</span>
        </button>
        <button type='button' aria-label='Remove place' onClick={() => onChange(null)} className='rounded-full p-1 hover:bg-main-accent/10'>
          <XMarkIcon className='h-4 w-4' />
        </button>
      </div>
    );

  const save = (): void => {
    const n = name.trim();
    onChange(n ? { name: n.slice(0, 120), address: address.trim().slice(0, 160) || null } : null);
    onClose();
  };

  return (
    <div className='flex flex-col gap-2 rounded-2xl border border-light-border p-3 dark:border-dark-border'>
      <p className='flex items-center gap-1 text-sm font-bold'>
        <MapPinIcon className='h-4 w-4 text-main-accent' /> Add the place you visited
      </p>
      <input
        autoFocus
        value={name}
        maxLength={120}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); save(); } }}
        placeholder='Place name, e.g. Cox’s Bazar Beach'
        className='rounded-lg border border-light-border bg-transparent px-3 py-2 outline-none focus:border-main-accent dark:border-dark-border'
      />
      <input
        value={address}
        maxLength={160}
        onChange={e => setAddress(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); save(); } }}
        placeholder='City / area (optional)'
        className='rounded-lg border border-light-border bg-transparent px-3 py-2 outline-none focus:border-main-accent dark:border-dark-border'
      />
      <div className='flex justify-end gap-2'>
        <button type='button' onClick={onClose} className='btn-mint px-3 py-1 text-sm'>Cancel</button>
        <button type='button' onClick={save} className='btn-solid px-4 py-1 text-sm'>Add place</button>
      </div>
    </div>
  );
}
