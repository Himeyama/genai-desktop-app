export const submitModifierLabel = 'Shift';

export const isSubmitKey = (e: Pick<KeyboardEvent, 'key' | 'shiftKey'>): boolean =>
  e.key === 'Enter' && !e.shiftKey;
