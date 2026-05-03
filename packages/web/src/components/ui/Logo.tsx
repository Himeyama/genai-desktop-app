import { Link } from 'react-router';

type Props = {
  isLandingPage?: boolean;
};

const logoTypographyStyles =
  'text-lg font-bold leading-tight text-gray-900 lg:text-xl font-bold leading-snug';

export const Logo = (props: Props) => {
  const { isLandingPage } = props;
  return (
    <div className='flex flex-col gap-1 lg:flex-row lg:items-center lg:gap-4'>
      {isLandingPage ? (
        <h1 className={`${logoTypographyStyles}`}>ここにロゴが入る</h1>
      ) : (
        <Link
          to='/'
          className={`${logoTypographyStyles} focus-visible:rounded focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2`}
        >
          ここにロゴが入る
        </Link>
      )}
    </div>
  );
};
