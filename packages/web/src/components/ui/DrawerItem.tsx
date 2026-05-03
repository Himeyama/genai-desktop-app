import { Link, useLocation } from 'react-router';

export type DrawerItemProps = {
  className?: string;
  label: string;
  to: string;
  disableParentAriaCurrent?: boolean;
};

export const DrawerItem = (props: DrawerItemProps) => {
  const { className, label, to, disableParentAriaCurrent } = props;
  const location = useLocation();

  // NOTE:
  // 完全一致の場合は aria-current='page'、部分一致の場合は aria-current='true' を返す
  // 例：`/chat/xxx` の場合は aria-current='true'
  // `use-case-builder` の場合は適用させないために disableParentAriaCurrent を追加
  const ariaCurrent: 'page' | 'true' | undefined = (() => {
    if (location.pathname === to) {
      return 'page';
    }
    if (!disableParentAriaCurrent && to !== '/' && location.pathname.startsWith(`${to}/`)) {
      return 'true';
    }
    return undefined;
  })();

  return (
    <Link
      className={`flex min-h-11 items-center rounded py-1 pr-2 pl-4 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2 aria-[current='page']:bg-blue-100! aria-[current='page']:font-bold aria-[current='page']:text-blue-700! aria-[current='true']:bg-blue-100! aria-[current='true']:font-bold aria-[current='true']:text-blue-700! ${className ?? ''}`}
      aria-current={ariaCurrent}
      to={to}
    >
      <div className='flex w-full items-center justify-between'>
        <span>{label}</span>
      </div>
    </Link>
  );
};
