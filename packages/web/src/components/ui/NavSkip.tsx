export const NavSkip = () => {
  return (
    <>
      <p id='window-title' className='sr-only' tabIndex={-1} />
      <a
        className={`sr-only top-1.5 left-1.5 inline-flex min-h-9 min-w-20 items-center justify-center rounded-md text-base font-bold leading-none text-blue-600 focus-visible:not-sr-only focus-visible:fixed focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2 focus-visible:px-3 focus-visible:py-0.5`}
        href='#mainContents'
        id='skip-nav-label'
      >
        本文へ移動
      </a>
    </>
  );
};
